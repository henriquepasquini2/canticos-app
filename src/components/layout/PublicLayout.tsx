import { useState } from 'react'
import { Outlet, NavLink, Link } from 'react-router-dom'
import { Library, CalendarDays, Lightbulb, Lock, ShieldQuestion, Check, Clock, X } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { useMyAccessRequest } from '@/hooks/useAccessRequests'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export function PublicLayout() {
  const { isAdmin, isApproved, user, signOut } = useAuth()
  const { request, submitRequest } = useMyAccessRequest(
    !isApproved && user ? user.email : undefined
  )
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const showBanner = !!user && !isApproved && !isAdmin

  const handleRequest = async () => {
    setSubmitting(true)
    const { error } = await submitRequest(message)
    if (error) {
      toast.error('Erro ao enviar pedido')
    } else {
      toast.success('Pedido enviado! O administrador será notificado.')
      setMessage('')
    }
    setSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-bg-secondary/80 backdrop-blur-md px-4 lg:px-6">
        <Link
          to="/"
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <img
            src="/logo-ipb.png"
            alt="IP Filadelfia"
            className="h-10 w-10 rounded-full object-cover bg-white"
          />
          <div>
            <h1 className="text-base font-bold leading-tight tracking-tight">
              Cânticos
            </h1>
            <p className="text-[10px] text-text-muted leading-none">
              IP Filadelfia - São Carlos/SP
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          <nav className="hidden sm:flex items-center gap-1">
            <NavLink
              to="/catalogo"
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-accent-light/15 text-accent-light'
                    : 'text-text-secondary hover:text-text-primary'
                )
              }
            >
              <Library size={16} />
              Catálogo
            </NavLink>
            <NavLink
              to="/calendario"
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-accent-light/15 text-accent-light'
                    : 'text-text-secondary hover:text-text-primary'
                )
              }
            >
              <CalendarDays size={16} />
              Calendário
            </NavLink>
            {isApproved && (
              <NavLink
                to="/admin/sugestoes"
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-accent-light/15 text-accent-light'
                      : 'text-text-secondary hover:text-text-primary'
                  )
                }
              >
                <Lightbulb size={16} />
                Sugestões
              </NavLink>
            )}
          </nav>

          {isAdmin ? (
            <div className="flex items-center gap-2">
              <Link
                to="/admin"
                className="flex items-center gap-1.5 rounded-lg bg-accent-light/15 px-3 py-1.5 text-xs font-medium text-accent-light hover:bg-accent-light/25 transition-colors"
              >
                <Lock size={12} />
                Admin
              </Link>
              {user?.user_metadata?.avatar_url && (
                <img
                  src={user.user_metadata.avatar_url}
                  alt=""
                  className="h-7 w-7 rounded-full"
                />
              )}
              <button
                onClick={signOut}
                className="text-xs text-text-muted hover:text-text-primary transition-colors cursor-pointer"
              >
                Sair
              </button>
            </div>
          ) : user ? (
            <div className="flex items-center gap-2">
              {user.user_metadata?.avatar_url && (
                <img
                  src={user.user_metadata.avatar_url}
                  alt=""
                  className="h-7 w-7 rounded-full"
                />
              )}
              <button
                onClick={signOut}
                className="text-xs text-text-muted hover:text-text-primary transition-colors cursor-pointer"
              >
                Sair
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-text-muted hover:text-text-primary transition-colors"
            >
              <Lock size={12} />
              Entrar
            </Link>
          )}
        </div>
      </header>

      {/* Access request banner for logged-in non-approved users */}
      {showBanner && (
        <div className="border-b border-border bg-bg-secondary px-4 py-3 lg:px-8">
          <div className="max-w-6xl mx-auto">
            {!request ? (
              // No request yet - show form
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <ShieldQuestion size={18} className="text-accent-light shrink-0" />
                  <p className="text-sm text-text-secondary">
                    Participa do louvor? Peça acesso para editar a programação.
                  </p>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Seu nome (opcional)"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="flex-1 sm:w-48 rounded-lg border border-border bg-bg-input px-3 py-1.5 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent-light"
                  />
                  <Button size="sm" onClick={handleRequest} disabled={submitting}>
                    {submitting ? 'Enviando...' : 'Pedir acesso'}
                  </Button>
                </div>
              </div>
            ) : request.status === 'pending' ? (
              // Request pending
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-warning shrink-0" />
                <p className="text-sm text-warning">
                  Seu pedido de acesso foi enviado e está aguardando aprovação.
                </p>
              </div>
            ) : request.status === 'denied' ? (
              // Request denied
              <div className="flex items-center gap-2">
                <X size={16} className="text-danger shrink-0" />
                <p className="text-sm text-text-secondary">
                  Seu pedido de acesso não foi aprovado. Em caso de dúvida, fale com a coordenação.
                </p>
              </div>
            ) : request.status === 'approved' ? (
              // Approved (edge case - shouldn't show normally since isApproved would be true)
              <div className="flex items-center gap-2">
                <Check size={16} className="text-success shrink-0" />
                <p className="text-sm text-success">
                  Acesso aprovado! Recarregue a página para ativar.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-bg-secondary/95 backdrop-blur-md sm:hidden">
        <div className="flex items-center justify-around">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 px-3 py-2.5 text-[10px] font-medium transition-colors',
                isActive ? 'text-accent-light' : 'text-text-muted'
              )
            }
          >
            <CalendarDays size={20} />
            <span>Início</span>
          </NavLink>
          <NavLink
            to="/catalogo"
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 px-3 py-2.5 text-[10px] font-medium transition-colors',
                isActive ? 'text-accent-light' : 'text-text-muted'
              )
            }
          >
            <Library size={20} />
            <span>Catálogo</span>
          </NavLink>
          <NavLink
            to="/calendario"
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 px-3 py-2.5 text-[10px] font-medium transition-colors',
                isActive ? 'text-accent-light' : 'text-text-muted'
              )
            }
          >
            <CalendarDays size={20} />
            <span>Calendário</span>
          </NavLink>
          {isApproved && (
            <NavLink
              to="/admin/sugestoes"
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 px-3 py-2.5 text-[10px] font-medium transition-colors',
                  isActive ? 'text-accent-light' : 'text-text-muted'
                )
              }
            >
              <Lightbulb size={20} />
              <span>Sugestões</span>
            </NavLink>
          )}
        </div>
      </nav>

      <main className="min-h-[calc(100vh-4rem)] pt-6 pb-24 sm:pb-12 px-4 lg:px-8 max-w-6xl mx-auto">
        <Outlet />
        <footer className="mt-16 border-t border-border pt-6 text-center text-[11px] text-text-muted">
          <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <Link to="/privacidade" className="hover:text-text-secondary">
              Privacidade
            </Link>
            <span aria-hidden className="text-border">
              ·
            </span>
            <Link to="/termos" className="hover:text-text-secondary">
              Termos de uso
            </Link>
          </nav>
        </footer>
      </main>
    </div>
  )
}
