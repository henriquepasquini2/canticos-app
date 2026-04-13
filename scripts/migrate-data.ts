/**
 * Migration script: imports canticos.txt and cantados_YYYY.txt into Supabase.
 *
 * Usage:
 *   npx tsx scripts/migrate-data.ts
 *
 * Requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in ../.env
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!

if (!supabaseUrl || supabaseUrl.includes('your-supabase')) {
  console.error('Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const DO_NOT_PLAY = [
  7, 24, 26, 28, 36, 37, 56, 60, 74, 77, 82, 107, 113, 114, 118, 119, 120,
  124, 126, 127,
]
const NOT_READY = [103, 106, 107, 128, 131]

const DATA_DIR = path.resolve(__dirname, '../../')

async function migrateSongs() {
  console.log('Importing songs from canticos.txt...')
  const text = fs.readFileSync(path.join(DATA_DIR, 'canticos.txt'), 'utf-8')
  const lines = text.trim().split('\n')

  const songs = lines.map((line) => {
    const num = parseInt(line.substring(0, 3).trim(), 10)
    const name = line.substring(3).trim()
    return {
      number: num,
      name,
      is_playable: !DO_NOT_PLAY.includes(num),
      is_ready: !NOT_READY.includes(num),
    }
  })

  const { error } = await supabase.from('songs').upsert(songs, {
    onConflict: 'number',
  })

  if (error) {
    console.error('Error importing songs:', error.message)
    return
  }

  console.log(`  Imported ${songs.length} songs`)
}

interface SongRow {
  id: number
  number: number
}

async function migrateSungSongs() {
  const files = [
    'cantados_2022.txt',
    'cantados_2023.txt',
    'cantados_2024.txt',
    'cantados_2025.txt',
    'cantados_2026.txt',
  ]

  const { data: allSongs } = await supabase
    .from('songs')
    .select('id, number')

  if (!allSongs) {
    console.error('Could not fetch songs from database')
    return
  }

  const songMap = new Map<number, number>()
  allSongs.forEach((s: SongRow) => songMap.set(s.number, s.id))

  for (const file of files) {
    const filePath = path.join(DATA_DIR, file)
    if (!fs.existsSync(filePath)) {
      console.log(`  Skipping ${file} (not found)`)
      continue
    }

    console.log(`Importing ${file}...`)
    const text = fs.readFileSync(filePath, 'utf-8')
    const lines = text.split('\n')

    let currentDate: string | null = null
    let sundayEntries: { date: string; songNum: number; position: number }[] = []
    let position = 0

    for (const line of lines) {
      if (!line.trim()) continue

      const parts = line.split('\t')

      if (parts[0] && parts[0].includes('/')) {
        const dateParts = parts[0].trim().split('/')
        if (dateParts.length === 3) {
          currentDate = `${dateParts[2]}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`
          position = 0
        }
      }

      const songNumStr = parts.length > 1 ? parts[1]?.trim() : parts[0]?.trim()
      if (!songNumStr) continue

      const songNum = parseInt(songNumStr, 10)
      if (isNaN(songNum) || !currentDate) continue

      if (!songMap.has(songNum)) {
        console.log(`    Warning: song number ${songNum} not found in catalog`)
        continue
      }

      position++
      sundayEntries.push({ date: currentDate, songNum, position })
    }

    const uniqueDates = [...new Set(sundayEntries.map((e) => e.date))]
    for (const date of uniqueDates) {
      const { data: sunday, error: sundayErr } = await supabase
        .from('sundays')
        .upsert({ date }, { onConflict: 'date' })
        .select('id')
        .single()

      if (sundayErr || !sunday) {
        console.error(`    Error creating sunday ${date}:`, sundayErr?.message)
        continue
      }

      const entries = sundayEntries.filter((e) => e.date === date)

      // Reset positions per sunday
      let pos = 0
      const songRows = entries.map((e) => {
        pos++
        return {
          sunday_id: sunday.id,
          song_id: songMap.get(e.songNum)!,
          position: pos,
        }
      })

      const { error: insertErr } = await supabase
        .from('sunday_songs')
        .upsert(songRows, { onConflict: 'sunday_id,song_id' })

      if (insertErr) {
        console.error(`    Error inserting songs for ${date}:`, insertErr.message)
      }
    }

    console.log(`  Processed ${uniqueDates.length} Sundays from ${file}`)
  }
}

async function main() {
  console.log('Starting migration...\n')
  await migrateSongs()
  await migrateSungSongs()
  console.log('\nMigration complete!')
}

main().catch(console.error)
