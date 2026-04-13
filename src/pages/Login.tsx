import { Navigate } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/Button'

export function Login() {
  const { isAdmin, user, loading, signIn } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-primary">
        <div className="animate-pulse text-text-muted">Carregando...</div>
      </div>
    )
  }

  // Admin → admin panel
  if (isAdmin) {
    return <Navigate to="/admin" replace />
  }

  // Any logged-in user (approved or not) → public pages
  // Approved users can edit schedules there.
  // Non-approved users see the access request banner in PublicLayout.
  if (user) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary px-4">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div>
          <img
            src="/logo-ipb.png"
            alt="IP Filadelfia"
            className="mx-auto h-20 w-20 rounded-full bg-white object-cover"
          />
          <h1 className="mt-6 text-2xl font-bold">Equipe de louvor</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Entre com a conta Google autorizada para editar cronogramas, repertório e
            demais funções internas do site.
          </p>
        </div>

        <Button onClick={signIn} size="lg" className="w-full">
          <LogIn size={18} />
          Entrar com Google
        </Button>

        <p className="text-xs text-text-muted">
          O acesso à edição é liberado só para quem foi cadastrado. Se você participa
          do louvor e precisa de permissão, fale com a coordenação.
        </p>
      </div>
    </div>
  )
}
