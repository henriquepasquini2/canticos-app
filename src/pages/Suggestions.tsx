import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Lightbulb,
  ExternalLink,
  Check,
  X,
  Clock,
  Trash2,
} from 'lucide-react'
import { useSuggestions } from '@/hooks/useSuggestions'
import { useAuth } from '@/lib/auth'
import { useMultiRealtime, REALTIME, LIVE_DATA_POLL_MS } from '@/hooks/useRealtime'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { toast } from 'sonner'
import { isSafeHttpUrl } from '@/lib/safeUrl'
import { isRlsOrAuthError } from '@/lib/supabaseErrors'
import { getUserDisplayName } from '@/lib/userDisplayName'

const statusConfig = {
  pendente: { label: 'Pendente', variant: 'warning' as const, icon: Clock },
  aprovada: { label: 'Aprovada', variant: 'success' as const, icon: Check },
  rejeitada: { label: 'Rejeitada', variant: 'danger' as const, icon: X },
}

export function Suggestions() {
  const { isAdmin, user, isApproved } = useAuth()
  const canSubmit = isApproved
  const { suggestions, addSuggestion, deleteOwnPending, updateStatus, refetch } =
    useSuggestions()
  useMultiRealtime(REALTIME.suggestions, refetch, true, {
    pollIntervalMs: LIVE_DATA_POLL_MS,
  })

  const [form, setForm] = useState({
    song_name: '',
    artist: '',
    reason: '',
    link: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.song_name.trim()) {
      toast.error('Preencha o nome da música')
      return
    }

    const suggestedBy = getUserDisplayName(user)
    if (!user?.id || !suggestedBy) {
      toast.error('Não foi possível identificar seu usuário. Entre de novo.')
      return
    }

    const linkTrim = form.link.trim()
    if (linkTrim && !isSafeHttpUrl(linkTrim)) {
      toast.error('Use apenas links que comecem com http:// ou https://')
      return
    }

    setSubmitting(true)
    const { error } = await addSuggestion(
      {
        song_name: form.song_name.trim(),
        artist: form.artist.trim() || undefined,
        suggested_by: suggestedBy,
        reason: form.reason.trim() || undefined,
        link: linkTrim || undefined,
      },
      user.id
    )

    if (error) {
      if (isRlsOrAuthError(error)) {
        toast.error(
          'Não foi possível enviar: entre com uma conta autorizada ou atualize a página se a sessão expirou.'
        )
      } else {
        toast.error('Erro ao enviar sugestão')
      }
    } else {
      toast.success('Sugestão enviada!')
      setForm({ song_name: '', artist: '', reason: '', link: '' })
    }
    setSubmitting(false)
  }

  const handleStatus = async (
    id: number,
    status: 'aprovada' | 'rejeitada'
  ) => {
    const { error } = await updateStatus(id, status)
    if (error) {
      if (isRlsOrAuthError(error)) {
        toast.error(
          'Sem permissão ou sessão expirada. Atualize a página e entre de novo.'
        )
      } else {
        toast.error('Não foi possível atualizar o status')
      }
      return
    }
    toast.success(`Sugestão ${status}`)
  }

  const handleRemoveOwn = async (id: number) => {
    const { error } = await deleteOwnPending(id)
    if (error) {
      if (isRlsOrAuthError(error)) {
        toast.error('Sem permissão ou esta sugestão não pode mais ser removida.')
      } else {
        toast.error('Não foi possível remover a sugestão')
      }
      return
    }
    toast.success('Sugestão removida')
  }

  const visible = suggestions.filter((s) => s.status !== 'rejeitada')
  const pending = visible.filter((s) => s.status === 'pendente')
  const approved = visible.filter((s) => s.status === 'aprovada')

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Sugestões</h1>
      </div>

      {!canSubmit && (
        <div className="rounded-xl border border-border bg-bg-secondary/50 px-4 py-3 text-sm text-text-secondary">
          {!user ? (
            <>
              Para enviar sugestões, entre com uma conta{' '}
              <span className="text-text-primary font-medium">autorizada pela equipe</span>.{' '}
              <Link to="/login" className="text-accent-light hover:underline">
                Entrar
              </Link>
            </>
          ) : (
            <>
              Sua conta ainda não pode enviar sugestões. Use o pedido de acesso no topo do site
              ou fale com a coordenação.
            </>
          )}
        </div>
      )}

      {canSubmit && (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-border bg-bg-card p-6 space-y-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb size={18} className="text-warning" />
            <h2 className="text-base font-semibold">Nova sugestão</h2>
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

          <Input
            id="link"
            label="Link (YouTube, cifra, etc.)"
            placeholder="https://..."
            value={form.link}
            onChange={(e) => setForm({ ...form, link: e.target.value })}
          />
          {user && (
            <p className="text-xs text-text-muted">
              Enviando como{' '}
              <span className="text-text-secondary">
                {getUserDisplayName(user) || user.email}
              </span>
            </p>
          )}

          <Textarea
            id="reason"
            label="Por que essa música?"
            placeholder="Conte por que acha que essa música seria boa para o repertório..."
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
          />

          <Button type="submit" disabled={submitting}>
            {submitting ? 'Enviando...' : 'Enviar sugestão'}
          </Button>
        </form>
      )}

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
                onApprove={
                  isAdmin
                    ? () => handleStatus(s.id, 'aprovada')
                    : undefined
                }
                onReject={
                  isAdmin
                    ? () => handleStatus(s.id, 'rejeitada')
                    : undefined
                }
                onRemoveOwn={
                  !isAdmin &&
                  canSubmit &&
                  user?.id &&
                  s.user_id === user.id
                    ? () => handleRemoveOwn(s.id)
                    : undefined
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* Approved suggestions (rejected are hidden) */}
      {approved.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">
            Aprovadas ({approved.length})
          </h2>
          <div className="space-y-3">
            {approved.map((s) => (
              <SuggestionCard key={s.id} suggestion={s} />
            ))}
          </div>
        </div>
      )}

      {visible.length === 0 && (
        <div className="text-center py-12 text-text-muted">
          <Lightbulb size={40} className="mx-auto mb-3 opacity-30" />
          <p>
            {suggestions.length === 0
              ? 'Nenhuma sugestão ainda. Seja o primeiro!'
              : 'Não há sugestões pendentes ou aprovadas para exibir.'}
          </p>
        </div>
      )}
    </div>
  )
}

function SuggestionCard({
  suggestion,
  onApprove,
  onReject,
  onRemoveOwn,
}: {
  suggestion: ReturnType<typeof useSuggestions>['suggestions'][0]
  onApprove?: () => void
  onReject?: () => void
  onRemoveOwn?: () => void
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

        {suggestion.status === 'pendente' && (
          <div className="flex gap-2 shrink-0">
            {onRemoveOwn && (
              <button
                type="button"
                onClick={onRemoveOwn}
                className="rounded-lg p-2 text-text-muted hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer"
                title="Remover minha sugestão"
              >
                <Trash2 size={18} />
              </button>
            )}
            {onApprove && onReject && (
              <>
                <button
                  type="button"
                  onClick={onApprove}
                  className="rounded-lg p-2 text-success hover:bg-success/10 transition-colors cursor-pointer"
                  title="Aprovar"
                >
                  <Check size={18} />
                </button>
                <button
                  type="button"
                  onClick={onReject}
                  className="rounded-lg p-2 text-danger hover:bg-danger/10 transition-colors cursor-pointer"
                  title="Rejeitar"
                >
                  <X size={18} />
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
