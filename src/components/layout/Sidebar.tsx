import { useCallback } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Library,
  CalendarDays,
  Lightbulb,
  BarChart3,
  RefreshCw,
  Users,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSuggestions } from '@/hooks/useSuggestions'
import { useMultiRealtime, REALTIME } from '@/hooks/useRealtime'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/catalogo', icon: Library, label: 'Catálogo', end: false },
  { to: '/admin/calendario', icon: CalendarDays, label: 'Calendário', end: false },
  { to: '/admin/sugestoes', icon: Lightbulb, label: 'Sugestões', end: false },
  { to: '/admin/insights', icon: BarChart3, label: 'Insights', end: false },
  { to: '/admin/sync', icon: RefreshCw, label: 'Sincronizar', end: false },
  { to: '/admin/usuarios', icon: Users, label: 'Usuários', end: false },
]

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { pendingCount, refetch: refetchSuggestions } = useSuggestions()

  const refreshSuggestionBadge = useCallback(() => {
    void refetchSuggestions()
  }, [refetchSuggestions])

  useMultiRealtime(REALTIME.suggestions, refreshSuggestionBadge, true)

  return (
    <aside
      className={cn(
        'fixed left-0 top-16 z-30 flex h-[calc(100vh-4rem)] flex-col border-r border-border bg-bg-secondary transition-all duration-300',
        collapsed ? 'w-16' : 'w-56'
      )}
    >
      <nav className="flex-1 space-y-1 p-2 pt-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-accent-light/15 text-accent-light'
                  : 'text-text-secondary hover:bg-bg-card hover:text-text-primary',
                collapsed && 'justify-center px-0'
              )
            }
          >
            <item.icon size={20} className="shrink-0" />
            {!collapsed && <span className="flex-1">{item.label}</span>}
            {!collapsed &&
              item.to === '/admin/sugestoes' &&
              pendingCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-light text-[10px] font-bold text-white">
                  {pendingCount}
                </span>
              )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-border p-2">
        <button
          onClick={onToggle}
          className="flex w-full items-center justify-center rounded-lg p-2.5 text-text-muted hover:bg-bg-card hover:text-text-primary transition-colors cursor-pointer"
        >
          {collapsed ? <PanelLeft size={20} /> : <PanelLeftClose size={20} />}
        </button>
      </div>
    </aside>
  )
}
