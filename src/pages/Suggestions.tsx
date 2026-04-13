import { useState } from 'react'
import {
  Lightbulb,
  ExternalLink,
  Check,
  X,
  Clock,
} from 'lucide-react'
import { useSuggestions } from '@/hooks/useSuggestions'
import { useRealtime } from '@/hooks/useRealtime'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { toast } from 'sonner'
import { isSafeHttpUrl } from '@/lib/safeUrl'

const statusConfig = {
  pendente: { label: 'Pendente', variant: 'warning' as const, icon: Clock },
  aprovada: { label: 'Aprovada', variant: 'success' as const, icon: Check },
  rejeitada: { label: 'Rejeitada', variant: 'danger' as const, icon: X },
}

export function Suggestions() {
  const { suggestions, addSuggestion, updateStatus, refetch } = useSuggestions()
  useRealtime('suggestions', refetch)

  const [form, setForm] = useState({
    song_name: '',
    artist: '',
    suggested_by: '',
    reason: '',
    link: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.song_name.trim() || !form.suggested_by.trim()) {
      toast.error('Preencha o nome da música e seu nome')
      return
    }

    const linkTrim = form.link.trim()
    if (linkTrim && !isSafeHttpUrl(linkTrim)) {
      toast.error('Use apenas links que comecem com http:// ou https://')
      return
    }

    setSubmitting(true)
    const { error } = await addSuggestion({
      song_name: form.song_name.trim(),
      artist: form.artist.trim() || undefined,
      suggested_by: form.suggested_by.trim(),
      reason: form.reason.trim() || undefined,
      link: linkTrim || undefined,
    })

    if (error) {
      toast.error('Erro ao enviar sugestão')
    } else {
      toast.success('Sugestão enviada!')
      setForm({ song_name: '', artist: '', suggested_by: '', reason: '', link: '' })
    }
    setSubmitting(false)
  }

  const handleStatus = async (
    id: number,
    status: 'aprovada' | 'rejeitada'
  ) => {
    await updateStatus(id, status)
    toast.success(`Sugestão ${status}`)
  }

  const pending = suggestions.filter((s) => s.status === 'pendente')
  const resolved = suggestions.filter((s) => s.status !== 'pendente')

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Sugestões</h1>
        <p className="text-text-secondary mt-1">
          Sugira novas músicas para o repertório
        </p>
      </div>

      {/* Suggestion form */}
      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-border bg-bg-card p-6 space-y-4"
      >
        <div className="flex items-center gap-2 mb-2">
          <Lightbulb size={18} className="text-warning" />
          <h2 className="text-base font-semibold">Nova Sugestão</h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Input
            id="song_name"
            label="Nome da música *"
            placeholder="Ex: Grande é o Senhor"
            value={form.song_name}
            onChange={(e) => setForm({ ...form, song_name: e.target.value })}
          />
          <Input
            id="artist"
            label="Artista / Compositor"
            placeholder="Ex: Diante do Trono"
            value={form.artist}
            onChange={(e) => setForm({ ...form, artist: e.target.value })}
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Input
            id="suggested_by"
            label="Seu nome *"
            placeholder="Seu nome"
            value={form.suggested_by}
            onChange={(e) =>
              setForm({ ...form, suggested_by: e.target.value })
            }
          />
          <Input
            id="link"
            label="Link (YouTube, cifra, etc.)"
            placeholder="https://..."
            value={form.link}
            onChange={(e) => setForm({ ...form, link: e.target.value })}
          />
        </div>

        <Textarea
          id="reason"
          label="Por que essa música?"
          placeholder="Conte por que acha que essa música seria boa para o repertório..."
          value={form.reason}
          onChange={(e) => setForm({ ...form, reason: e.target.value })}
        />

        <Button type="submit" disabled={submitting}>
          {submitting ? 'Enviando...' : 'Enviar Sugestão'}
        </Button>
      </form>

      {/* Pending suggestions */}
      {pending.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">
            Pendentes ({pending.length})
          </h2>
          <div className="space-y-3">
            {pending.map((s) => (
              <SuggestionCard
                key={s.id}
                suggestion={s}
                onApprove={() => handleStatus(s.id, 'aprovada')}
                onReject={() => handleStatus(s.id, 'rejeitada')}
              />
            ))}
          </div>
        </div>
      )}

      {/* Resolved suggestions */}
      {resolved.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">
            Resolvidas ({resolved.length})
          </h2>
          <div className="space-y-3">
            {resolved.map((s) => (
              <SuggestionCard key={s.id} suggestion={s} />
            ))}
          </div>
        </div>
      )}

      {suggestions.length === 0 && (
        <div className="text-center py-12 text-text-muted">
          <Lightbulb size={40} className="mx-auto mb-3 opacity-30" />
          <p>Nenhuma sugestão ainda. Seja o primeiro!</p>
        </div>
      )}
    </div>
  )
}

function SuggestionCard({
  suggestion,
  onApprove,
  onReject,
}: {
  suggestion: ReturnType<typeof useSuggestions>['suggestions'][0]
  onApprove?: () => void
  onReject?: () => void
}) {
  const config = statusConfig[suggestion.status]

  return (
    <div className="rounded-xl border border-border bg-bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium">{suggestion.song_name}</h3>
            <Badge variant={config.variant}>{config.label}</Badge>
          </div>
          {suggestion.artist && (
            <p className="text-sm text-text-secondary">{suggestion.artist}</p>
          )}
          {suggestion.reason && (
            <p className="text-sm text-text-muted mt-2">{suggestion.reason}</p>
          )}
          <div className="flex items-center gap-3 mt-3 text-xs text-text-muted">
            <span>Por {suggestion.suggested_by}</span>
            <span>
              {new Date(suggestion.created_at).toLocaleDateString('pt-BR')}
            </span>
            {suggestion.link &&
              (isSafeHttpUrl(suggestion.link) ? (
                <a
                  href={suggestion.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-accent-light hover:underline"
                >
                  <ExternalLink size={12} />
                  Link
                </a>
              ) : (
                <span className="text-text-muted" title="Link com formato não permitido">
                  (link inválido)
                </span>
              ))}
          </div>
        </div>

        {suggestion.status === 'pendente' && onApprove && onReject && (
          <div className="flex gap-2 shrink-0">
            <button
              onClick={onApprove}
              className="rounded-lg p-2 text-success hover:bg-success/10 transition-colors cursor-pointer"
              title="Aprovar"
            >
              <Check size={18} />
            </button>
            <button
              onClick={onReject}
              className="rounded-lg p-2 text-danger hover:bg-danger/10 transition-colors cursor-pointer"
              title="Rejeitar"
            >
              <X size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
