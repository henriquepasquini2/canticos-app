import { useState, useCallback } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Library,
  CalendarDays,
  Lightbulb,
  MoreHorizontal,
  BarChart3,
  RefreshCw,
  Users,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSuggestions } from '@/hooks/useSuggestions'
import { useMultiRealtime, REALTIME } from '@/hooks/useRealtime'

const mainItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Home', end: true },
  { to: '/admin/catalogo', icon: Library, label: 'Catálogo', end: false },
  { to: '/admin/calendario', icon: CalendarDays, label: 'Calendário', end: false },
  { to: '/admin/sugestoes', icon: Lightbulb, label: 'Sugestões', end: false },
]

const moreItems = [
  { to: '/admin/insights', icon: BarChart3, label: 'Insights' },
  { to: '/admin/sync', icon: RefreshCw, label: 'Sincronizar' },
  { to: '/admin/usuarios', icon: Users, label: 'Usuários' },
]

export function MobileNav() {
  const { pendingCount, refetch: refetchSuggestions } = useSuggestions()
  const [showMore, setShowMore] = useState(false)

  const refreshSuggestionBadge = useCallback(() => {
    void refetchSuggestions()
  }, [refetchSuggestions])

  useMultiRealtime(REALTIME.suggestions, refreshSuggestionBadge, true)

  return (
    <>
      {/* More menu overlay */}
      {showMore && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setShowMore(false)}
        />
      )}

      {/* More menu panel */}
      {showMore && (
        <div className="fixed bottom-16 right-2 z-50 w-48 rounded-xl border border-border bg-bg-secondary shadow-xl shadow-black/30 p-2 lg:hidden">
          {moreItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setShowMore(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-accent-light/15 text-accent-light'
                    : 'text-text-secondary hover:bg-bg-card hover:text-text-primary'
                )
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </div>
      )}

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-bg-secondary/95 backdrop-blur-md lg:hidden">
        <div className="flex items-center justify-around">
          {mainItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 px-3 py-2.5 text-[10px] font-medium transition-colors relative',
                  isActive ? 'text-accent-light' : 'text-text-muted'
                )
              }
            >
              <item.icon size={20} />
              <span>{item.label}</span>
              {item.to === '/admin/sugestoes' && pendingCount > 0 && (
                <span className="absolute top-1.5 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-light text-[9px] font-bold text-white">
                  {pendingCount}
                </span>
              )}
            </NavLink>
          ))}

          {/* More button */}
          <button
            onClick={() => setShowMore(!showMore)}
            className={cn(
              'flex flex-col items-center gap-1 px-3 py-2.5 text-[10px] font-medium transition-colors cursor-pointer',
              showMore ? 'text-accent-light' : 'text-text-muted'
            )}
          >
            {showMore ? <X size={20} /> : <MoreHorizontal size={20} />}
            <span>Mais</span>
          </button>
        </div>
      </nav>
    </>
  )
}
