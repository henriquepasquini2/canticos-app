import { useState, useCallback } from 'react'
import {
  RefreshCw,
  FileSpreadsheet,
  FolderOpen,
  Check,
  AlertTriangle,
  Plus,
  X,
  ExternalLink,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

/** Opcional: defina no .env local (não commite valores reais em repositório público). */
const DEFAULT_SHEETS_URL =
  (import.meta.env.VITE_DEFAULT_SHEETS_CSV_URL as string | undefined)?.trim() ||
  ''

const DEFAULT_DRIVE_URL =
  (import.meta.env.VITE_DEFAULT_DRIVE_FOLDER_URL as string | undefined)?.trim() ||
  ''

function extractDriveFolderId(url: string): string | null {
  const match = url.match(/folders\/([a-zA-Z0-9_-]+)/)
  return match ? match[1] : null
}

interface SheetRow {
  date: string
  songNumber: number
  songName: string
}

interface SyncPreview {
  newSundays: string[]
  newEntries: { date: string; songNumber: number; songName: string }[]
  removedEntries: { date: string; songNumber: number; songName: string; sundaySongId: number }[]
  totalRows: number
}

interface DriveFile {
  id: string
  name: string
  number: number | null
}

function parseCSV(text: string): SheetRow[] {
  const lines = text.split('\n')
  const rows: SheetRow[] = []
  let currentDate = ''

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const cols = parseCSVLine(line)
    const dateCol = cols[0]?.trim() || ''
    const numCol = cols[1]?.trim() || ''

    if (dateCol && dateCol.includes('/')) {
      currentDate = dateCol
    }

    if (!numCol || numCol === '-') continue
    const songNum = parseInt(numCol, 10)
    if (isNaN(songNum)) continue

    const songName = cols[2]?.trim() || ''

    if (currentDate) {
      rows.push({ date: currentDate, songNumber: songNum, songName })
    }
  }

  return rows
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  result.push(current)
  return result
}

function convertDate(dateStr: string): string {
  const parts = dateStr.split('/')
  if (parts.length !== 3) return ''
  return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
}

export function Sync() {
  const [sheetsUrl, setSheetsUrl] = useState(
    () => localStorage.getItem('canticos_sheets_url') || DEFAULT_SHEETS_URL
  )
  const [driveUrl, setDriveUrl] = useState(
    () => localStorage.getItem('canticos_drive_url') || DEFAULT_DRIVE_URL
  )
  const googleApiKey = import.meta.env.VITE_GOOGLE_API_KEY as string || ''
  const [syncingSheets, setSyncingSheets] = useState(false)
  const [syncingDrive, setSyncingDrive] = useState(false)
  const [preview, setPreview] = useState<SyncPreview | null>(null)
  const [applying, setApplying] = useState(false)
  const [parsedRows, setParsedRows] = useState<SheetRow[]>([])
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([])
  const [newDriveSongs, setNewDriveSongs] = useState<DriveFile[]>([])

  const handleSaveUrl = () => {
    localStorage.setItem('canticos_sheets_url', sheetsUrl)
    toast.success('URL da planilha salva')
  }

  const handleSaveDriveUrl = () => {
    localStorage.setItem('canticos_drive_url', driveUrl)
    toast.success('URL do Drive salva')
  }



  const handleFetchSheets = useCallback(async () => {
    setSyncingSheets(true)
    setPreview(null)

    try {
      const res = await fetch(sheetsUrl)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const text = await res.text()
      const rows = parseCSV(text)
      setParsedRows(rows)

      const { data: existingSundays } = await supabase
        .from('sundays')
        .select('date')
      const { data: existingSundaySongs } = await supabase
        .from('sunday_songs')
        .select('id, song_id, sunday:sundays(date), song:songs(number, name)')
      const { data: songs } = await supabase.from('songs').select('id, number')

      const existingDates = new Set(
        (existingSundays || []).map((s: { date: string }) => s.date)
      )
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ssList = (existingSundaySongs || []) as any[]
      const existingPairs = new Set(
        ssList.map((ss) => {
          const date = Array.isArray(ss.sunday) ? ss.sunday[0]?.date : ss.sunday?.date
          return `${date}|${ss.song_id}`
        })
      )
      const songMap = new Map<number, number>()
      ;(songs || []).forEach((s: { id: number; number: number }) =>
        songMap.set(s.number, s.id)
      )

      const newSundays: string[] = []
      const newEntries: SheetRow[] = []

      const grouped = new Map<string, SheetRow[]>()
      for (const row of rows) {
        const isoDate = convertDate(row.date)
        if (!isoDate) continue
        if (!grouped.has(isoDate)) grouped.set(isoDate, [])
        grouped.get(isoDate)!.push(row)
      }

      // Detect additions
      for (const [isoDate, dateRows] of grouped) {
        if (!existingDates.has(isoDate)) {
          newSundays.push(isoDate)
        }
        for (const row of dateRows) {
          const songId = songMap.get(row.songNumber)
          if (songId && !existingPairs.has(`${isoDate}|${songId}`)) {
            newEntries.push(row)
          }
        }
      }

      // Detect removals: entries in DB for dates that exist in sheet, but song not in sheet for that date
      const sheetPairs = new Set<string>()
      for (const [isoDate, dateRows] of grouped) {
        for (const row of dateRows) {
          const songId = songMap.get(row.songNumber)
          if (songId) sheetPairs.add(`${isoDate}|${songId}`)
        }
      }
      const sheetDates = new Set(grouped.keys())

      const removedEntries: SyncPreview['removedEntries'] = []
      for (const ss of ssList) {
        const date = Array.isArray(ss.sunday) ? ss.sunday[0]?.date : ss.sunday?.date
        const song = Array.isArray(ss.song) ? ss.song[0] : ss.song
        if (!date || !sheetDates.has(date)) continue
        if (!sheetPairs.has(`${date}|${ss.song_id}`)) {
          removedEntries.push({
            date,
            songNumber: song?.number ?? 0,
            songName: song?.name ?? '?',
            sundaySongId: ss.id,
          })
        }
      }

      setPreview({
        newSundays,
        newEntries,
        removedEntries,
        totalRows: rows.length,
      })
    } catch (err) {
      toast.error(
        `Erro ao buscar planilha: ${err instanceof Error ? err.message : 'Erro desconhecido'}`
      )
    } finally {
      setSyncingSheets(false)
    }
  }, [sheetsUrl])

  const handleApplySync = async () => {
    if (!preview || !parsedRows.length) return
    setApplying(true)

    try {
      const { data: songs } = await supabase.from('songs').select('id, number')
      const songMap = new Map<number, number>()
      ;(songs || []).forEach((s: { id: number; number: number }) =>
        songMap.set(s.number, s.id)
      )

      const grouped = new Map<string, SheetRow[]>()
      for (const row of parsedRows) {
        const isoDate = convertDate(row.date)
        if (!isoDate) continue
        if (!grouped.has(isoDate)) grouped.set(isoDate, [])
        grouped.get(isoDate)!.push(row)
      }

      let sundaysProcessed = 0
      let songsAdded = 0

      for (const [isoDate, dateRows] of grouped) {
        const { data: sunday } = await supabase
          .from('sundays')
          .upsert({ date: isoDate }, { onConflict: 'date' })
          .select('id')
          .single()

        if (!sunday) continue
        sundaysProcessed++

        let position = 0
        for (const row of dateRows) {
          const songId = songMap.get(row.songNumber)
          if (!songId) continue
          position++

          await supabase
            .from('sunday_songs')
            .upsert(
              {
                sunday_id: sunday.id,
                song_id: songId,
                position,
              },
              { onConflict: 'sunday_id,song_id' }
            )
          songsAdded++
        }
      }

      // Delete removed entries
      let songsRemoved = 0
      for (const entry of preview.removedEntries) {
        await supabase
          .from('sunday_songs')
          .delete()
          .eq('id', entry.sundaySongId)
        songsRemoved++
      }

      const parts = [`${sundaysProcessed} domingos`, `${songsAdded} registros`]
      if (songsRemoved > 0) parts.push(`${songsRemoved} removido(s)`)
      toast.success(`Sincronizado: ${parts.join(', ')}`)

      setPreview(null)
      setParsedRows([])
    } catch (err) {
      toast.error('Erro ao aplicar sincronização')
    } finally {
      setApplying(false)
    }
  }

  const handleCheckDrive = useCallback(async () => {
    if (!googleApiKey) {
      toast.error('Configure VITE_GOOGLE_API_KEY no .env')
      return
    }
    const folderId = extractDriveFolderId(driveUrl)
    if (!folderId) {
      toast.error('URL do Drive inválida')
      return
    }

    setSyncingDrive(true)
    setDriveFiles([])
    setNewDriveSongs([])

    try {
      const url = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+mimeType='application/vnd.google-apps.folder'&fields=files(id,name)&key=${googleApiKey}&pageSize=200`
      const res = await fetch(url)

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error?.message || `HTTP ${res.status}`)
      }

      const data = await res.json()
      const files: DriveFile[] = (
        data.files as { id: string; name: string }[]
      ).map((f) => {
        const match = f.name.match(/^(\d+)\s/)
        return {
          id: f.id,
          name: f.name,
          number: match ? parseInt(match[1], 10) : null,
        }
      })

      setDriveFiles(files)

      const { data: existingSongs } = await supabase
        .from('songs')
        .select('number, drive_folder_id')
      const existingMap = new Map<number, string | null>()
      ;(existingSongs || []).forEach(
        (s: { number: number; drive_folder_id: string | null }) =>
          existingMap.set(s.number, s.drive_folder_id)
      )

      let linksUpdated = 0
      for (const f of files) {
        if (f.number === null) continue
        if (!existingMap.has(f.number)) continue
        const current = existingMap.get(f.number)
        if (current === f.id) continue

        const { error: updateErr } = await supabase
          .from('songs')
          .update({ drive_folder_id: f.id })
          .eq('number', f.number)

        if (updateErr) {
          console.error(`Failed to update song ${f.number}:`, updateErr.message)
        } else {
          linksUpdated++
        }
      }

      const newSongs = files.filter(
        (f) => f.number !== null && !existingMap.has(f.number!)
      )
      setNewDriveSongs(newSongs)

      const msgs: string[] = [`${files.length} pastas encontradas`]
      if (linksUpdated > 0) msgs.push(`${linksUpdated} links atualizados`)
      if (newSongs.length > 0) {
        msgs.push(`${newSongs.length} música(s) nova(s)`)
        toast.info(msgs.join('. '))
      } else {
        toast.success(msgs.join('. ') + '. Catálogo atualizado!')
      }
    } catch (err) {
      toast.error(
        `Erro ao acessar Drive: ${err instanceof Error ? err.message : 'Erro desconhecido'}`
      )
    } finally {
      setSyncingDrive(false)
    }
  }, [googleApiKey, driveUrl])

  const handleImportDriveSongs = async () => {
    if (!newDriveSongs.length) return

    const rows = newDriveSongs
      .filter((f) => f.number !== null)
      .map((f) => {
        const name = f.name.replace(/^\d+\s*/, '').trim()
        return { number: f.number!, name, drive_folder_id: f.id }
      })

    const { error } = await supabase.from('songs').upsert(rows, {
      onConflict: 'number',
    })

    if (error) {
      toast.error('Erro ao importar músicas')
    } else {
      toast.success(`${rows.length} música(s) importada(s)!`)
      setNewDriveSongs([])
    }
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Sincronização</h1>
        <p className="text-text-secondary mt-1">
          Sincronizar dados com Google Sheets e Google Drive
        </p>
      </div>

      {/* Google Sheets Sync */}
      <div className="rounded-xl border border-border bg-bg-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <FileSpreadsheet size={20} className="text-success" />
          <h2 className="text-lg font-semibold">Google Sheets (Cronograma)</h2>
        </div>
        <p className="text-sm text-text-secondary">
          Puxa os dados da planilha de cronograma e sincroniza com a base de
          dados. Quando virar o ano, troque a URL para a nova planilha.
        </p>

        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              id="sheets_url"
              label="URL da planilha (CSV export)"
              placeholder="https://docs.google.com/spreadsheets/d/.../export?format=csv&gid=..."
              value={sheetsUrl}
              onChange={(e) => setSheetsUrl(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button size="sm" variant="secondary" onClick={handleSaveUrl}>
              Salvar
            </Button>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleFetchSheets} disabled={syncingSheets}>
            {syncingSheets ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )}
            {syncingSheets ? 'Buscando...' : 'Verificar Planilha'}
          </Button>
        </div>

        {preview && (
          <div className="rounded-lg bg-bg-secondary p-4 space-y-3">
            <p className="text-sm font-medium">
              Preview ({preview.totalRows} registros na planilha)
            </p>
            <div className="flex gap-4 text-sm">
              <div>
                <span className="text-text-muted">Novos domingos: </span>
                <Badge
                  variant={
                    preview.newSundays.length > 0 ? 'warning' : 'success'
                  }
                >
                  {preview.newSundays.length}
                </Badge>
              </div>
              <div>
                <span className="text-text-muted">Adições: </span>
                <Badge
                  variant={
                    preview.newEntries.length > 0 ? 'warning' : 'success'
                  }
                >
                  {preview.newEntries.length}
                </Badge>
              </div>
              <div>
                <span className="text-text-muted">Remoções: </span>
                <Badge
                  variant={
                    preview.removedEntries.length > 0 ? 'danger' : 'success'
                  }
                >
                  {preview.removedEntries.length}
                </Badge>
              </div>
            </div>

            {preview.newEntries.length > 0 && (
              <div className="max-h-36 overflow-y-auto space-y-1">
                {preview.newEntries.map((e, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-xs text-text-secondary"
                  >
                    <Plus size={12} className="text-success shrink-0" />
                    <span className="text-text-muted">{e.date}</span>
                    <span>
                      {String(e.songNumber).padStart(2, '0')} - {e.songName}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {preview.removedEntries.length > 0 && (
              <div className="max-h-36 overflow-y-auto space-y-1">
                {preview.removedEntries.map((e, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-xs text-text-secondary"
                  >
                    <X size={12} className="text-danger shrink-0" />
                    <span className="text-text-muted">{e.date}</span>
                    <span>
                      {String(e.songNumber).padStart(2, '0')} - {e.songName}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {(preview.newSundays.length > 0 ||
              preview.newEntries.length > 0 ||
              preview.removedEntries.length > 0) && (
              <Button onClick={handleApplySync} disabled={applying}>
                {applying ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Check size={16} />
                )}
                {applying ? 'Aplicando...' : 'Aplicar Sincronização'}
              </Button>
            )}

            {preview.newSundays.length === 0 &&
              preview.newEntries.length === 0 &&
              preview.removedEntries.length === 0 && (
                <div className="flex items-center gap-2 text-success text-sm">
                  <Check size={16} />
                  Tudo sincronizado! Nenhuma alteração necessária.
                </div>
              )}
          </div>
        )}
      </div>

      {/* Google Drive Sync */}
      <div className="rounded-xl border border-border bg-bg-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <FolderOpen size={20} className="text-accent-light" />
          <h2 className="text-lg font-semibold">
            Google Drive (Novas Músicas)
          </h2>
        </div>
        <p className="text-sm text-text-secondary">
          Verifica se há novas pastas de músicas no Google Drive que ainda não
          estão no catálogo, e atualiza os links de cada cântico.
        </p>

        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              id="drive_url"
              label="URL da pasta do Drive"
              placeholder="https://drive.google.com/drive/folders/..."
              value={driveUrl}
              onChange={(e) => setDriveUrl(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button size="sm" variant="secondary" onClick={handleSaveDriveUrl}>
              Salvar
            </Button>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleCheckDrive}
            disabled={syncingDrive || !googleApiKey}
          >
            {syncingDrive ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )}
            {syncingDrive ? 'Verificando...' : 'Verificar Drive'}
          </Button>
          <a href={driveUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="ghost">
              <ExternalLink size={16} />
              Abrir no Drive
            </Button>
          </a>
        </div>

        {driveFiles.length > 0 && (
          <div className="rounded-lg bg-bg-secondary p-4 space-y-3">
            <p className="text-sm font-medium">
              {driveFiles.length} pastas encontradas no Drive
            </p>

            {newDriveSongs.length > 0 ? (
              <>
                <div className="flex items-center gap-2 text-warning text-sm">
                  <AlertTriangle size={16} />
                  {newDriveSongs.length} música(s) nova(s) não estão no
                  catálogo:
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {newDriveSongs.map((f) => (
                    <div
                      key={f.id}
                      className="flex items-center gap-2 text-xs text-text-secondary"
                    >
                      <Plus size={12} className="text-success shrink-0" />
                      <span>{f.name}</span>
                    </div>
                  ))}
                </div>
                <Button onClick={handleImportDriveSongs}>
                  <Plus size={16} />
                  Importar {newDriveSongs.length} música(s)
                </Button>
              </>
            ) : (
              <div className="flex items-center gap-2 text-success text-sm">
                <Check size={16} />
                Catálogo atualizado! Todas as pastas do Drive já estão no
                sistema.
              </div>
            )}
          </div>
        )}

        {!googleApiKey && (
          <div className="rounded-lg bg-bg-secondary p-4">
            <p className="text-sm text-text-muted">
              API Key do Google não configurada. Defina <code className="text-text-secondary">VITE_GOOGLE_API_KEY</code> no arquivo .env e no Vercel.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
