import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/lib/auth'

export function AdminRoute() {
  const { isAdmin, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-bg-primary">
        <div className="animate-pulse text-text-muted">Verificando acesso...</div>
      </div>
    )
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
