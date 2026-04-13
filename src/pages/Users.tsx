import { useState, useEffect, useCallback } from 'react'
import {
  Users as UsersIcon,
  UserPlus,
  Trash2,
  Shield,
  ShieldCheck,
  ShieldQuestion,
  Check,
  X,
} from 'lucide-react'
import { useApprovedUsers } from '@/hooks/useApprovedUsers'
import { useAccessRequests } from '@/hooks/useAccessRequests'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useMultiRealtime, REALTIME } from '@/hooks/useRealtime'

interface Admin {
  id: number
  email: string
}

export function Users() {
  const { users, addUser, removeUser, refetch: refetchUsers } = useApprovedUsers()
  const {
    requests,
    approveRequest,
    denyRequest,
    deleteRequest,
    refetch: refetchRequests,
  } = useAccessRequests()
  const [admins, setAdmins] = useState<Admin[]>([])
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const pendingRequests = requests.filter((r) => r.status === 'pending')
  const resolvedRequests = requests.filter((r) => r.status !== 'pending')

  const adminEmailSet = new Set(admins.map((a) => a.email.toLowerCase()))
  const approvedEditors = users.filter(
    (u) => !adminEmailSet.has(u.email.toLowerCase())
  )

  const loadAdmins = useCallback(async () => {
    const { data } = await supabase.from('admins').select('id, email')
    if (data) setAdmins(data)
  }, [])

  useEffect(() => {
    void loadAdmins()
  }, [loadAdmins])

  const refreshUsersPage = useCallback(() => {
    void refetchUsers()
    void refetchRequests()
    void loadAdmins()
  }, [refetchUsers, refetchRequests, loadAdmins])

  useMultiRealtime(REALTIME.usersAdmin, refreshUsersPage, true)

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedEmail = email.trim().toLowerCase()
    if (!trimmedEmail) {
      toast.error('Informe o email')
      return
    }

    const isAlreadyAdmin = admins.some((a) => a.email === trimmedEmail)
    if (isAlreadyAdmin) {
      toast.error('Este email já é administrador')
      return
    }

    const isAlreadyApproved = users.some((u) => u.email === trimmedEmail)
    if (isAlreadyApproved) {
      toast.error('Este email já está aprovado')
      return
    }

    setSubmitting(true)
    const { error } = await addUser(trimmedEmail)
    if (error) {
      toast.error('Erro ao adicionar usuário')
    } else {
      toast.success('Usuário aprovado!')
      setEmail('')
    }
    setSubmitting(false)
  }

  const handleRemove = async (id: number, userEmail: string) => {
    const { error } = await removeUser(id)
    if (error) {
      toast.error('Erro ao remover usuário')
    } else {
      toast.success(`${userEmail} removido`)
    }
  }

  const handleApprove = async (req: typeof requests[0]) => {
    const { error } = await approveRequest(req)
    if (error) {
      toast.error('Erro ao aprovar')
    } else {
      toast.success(`${req.email} aprovado!`)
      await refetchUsers()
    }
  }

  const handleDeny = async (req: typeof requests[0]) => {
    const { error } = await denyRequest(req.id)
    if (error) {
      toast.error('Erro ao recusar')
    } else {
      toast.success(`Pedido de ${req.email} recusado`)
    }
  }

  const handleDeleteRequest = async (id: number) => {
    const { error } = await deleteRequest(id)
    if (error) {
      toast.error('Erro ao remover pedido')
    }
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Gerenciar Usuários</h1>
        <p className="text-text-secondary mt-1">
          Controle quem pode editar a programação
        </p>
      </div>

      {/* Pending access requests */}
      {pendingRequests.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <ShieldQuestion size={18} className="text-warning" />
            <h2 className="text-lg font-semibold">Pedidos de Acesso</h2>
            <Badge variant="warning">{pendingRequests.length}</Badge>
          </div>
          <div className="space-y-2">
            {pendingRequests.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-warning/30 bg-warning/5 px-4 py-3"
              >
                <div className="min-w-0">
                  <span className="text-sm font-medium block truncate">
                    {req.email}
                  </span>
                  {req.message && (
                    <span className="text-xs text-text-muted">{req.message}</span>
                  )}
                  <span className="text-[10px] text-text-muted block">
                    {new Date(req.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleApprove(req)}
                    className="rounded-lg p-2 text-success hover:bg-success/10 transition-colors cursor-pointer"
                    title="Aprovar"
                  >
                    <Check size={18} />
                  </button>
                  <button
                    onClick={() => handleDeny(req)}
                    className="rounded-lg p-2 text-danger hover:bg-danger/10 transition-colors cursor-pointer"
                    title="Recusar"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add user form */}
      <form
        onSubmit={handleAdd}
        className="rounded-xl border border-border bg-bg-card p-6 space-y-4"
      >
        <div className="flex items-center gap-2 mb-2">
          <UserPlus size={18} className="text-accent-light" />
          <h2 className="text-base font-semibold">Aprovar Novo Usuário</h2>
        </div>
        <p className="text-sm text-text-secondary">
          Adicione o email da conta Google do usuário para dar acesso de edição.
        </p>

        <Input
          id="user_email"
          label="Email (Google) *"
          type="email"
          placeholder="usuario@gmail.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Button type="submit" disabled={submitting}>
          <UserPlus size={16} />
          {submitting ? 'Adicionando...' : 'Aprovar Usuário'}
        </Button>
      </form>

      {/* Admins list */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Shield size={18} className="text-warning" />
          <h2 className="text-lg font-semibold">Administradores</h2>
          <Badge variant="warning">{admins.length}</Badge>
        </div>
        <div className="space-y-2">
          {admins.map((admin) => (
            <div
              key={admin.id}
              className="flex items-center justify-between rounded-lg border border-border bg-bg-card px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <Shield size={16} className="text-warning shrink-0" />
                <span className="text-sm font-medium">{admin.email}</span>
              </div>
              <Badge variant="warning">Admin</Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Approved users list */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck size={18} className="text-accent-light" />
          <h2 className="text-lg font-semibold">Usuários Aprovados</h2>
          <Badge variant="info">{approvedEditors.length}</Badge>
        </div>
        {approvedEditors.length > 0 ? (
          <div className="space-y-2">
            {approvedEditors.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between rounded-lg border border-border bg-bg-card px-4 py-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <ShieldCheck size={16} className="text-accent-light shrink-0" />
                  <div className="min-w-0">
                    <span className="text-sm font-medium block truncate">
                      {u.email}
                    </span>
                    {u.name && (
                      <span className="text-xs text-text-muted">{u.name}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Badge variant="info">Editor</Badge>
                  <button
                    onClick={() => handleRemove(u.id, u.email)}
                    className="rounded-lg p-2 text-text-muted hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer"
                    title="Remover acesso"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-text-muted rounded-xl border border-border bg-bg-card">
            <UsersIcon size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nenhum usuário aprovado ainda.</p>
          </div>
        )}
      </div>

      {/* Resolved requests history */}
      {resolvedRequests.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 text-text-secondary">Histórico de Pedidos</h2>
          <div className="space-y-2">
            {resolvedRequests.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between rounded-lg border border-border/50 bg-bg-card/50 px-4 py-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {req.status === 'approved' ? (
                    <Check size={14} className="text-success shrink-0" />
                  ) : (
                    <X size={14} className="text-danger shrink-0" />
                  )}
                  <div className="min-w-0">
                    <span className="text-sm text-text-secondary block truncate">
                      {req.email}
                    </span>
                    <span className="text-[10px] text-text-muted">
                      {req.status === 'approved' ? 'Aprovado' : 'Recusado'} em{' '}
                      {new Date(req.updated_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteRequest(req.id)}
                  className="rounded p-1.5 text-text-muted hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer shrink-0"
                  title="Remover do histórico"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
