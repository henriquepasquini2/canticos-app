import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/lib/auth'

/** Approved editors and admins (can open team tools like Suggestions). */
export function EditorRoute() {
  const { user, isApproved, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-primary">
        <div className="animate-pulse text-text-muted">Verificando acesso...</div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: '/admin/sugestoes' }} />
  }

  if (!isApproved) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
