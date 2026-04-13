import { Link } from 'react-router-dom'
import { LogOut, Globe } from 'lucide-react'
import { useAuth } from '@/lib/auth'

export function Header() {
  const { user, signOut } = useAuth()

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-bg-secondary/80 backdrop-blur-md px-4 lg:px-6">
      <Link
        to="/admin"
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
            <span className="ml-1.5 text-[10px] bg-accent-light/20 text-accent-light px-1.5 py-0.5 rounded-full font-medium align-middle">
              Admin
            </span>
          </h1>
          <p className="text-[10px] text-text-muted leading-none">
            IP Filadelfia - São Carlos/SP
          </p>
        </div>
      </Link>

      <div className="flex items-center gap-3">
        <Link
          to="/"
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-text-muted hover:text-text-primary hover:bg-bg-card transition-colors"
          title="Ver site público"
        >
          <Globe size={14} />
          <span className="hidden sm:inline">Site Público</span>
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
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-text-muted hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer"
        >
          <LogOut size={14} />
          <span className="hidden sm:inline">Sair</span>
        </button>
      </div>
    </header>
  )
}
