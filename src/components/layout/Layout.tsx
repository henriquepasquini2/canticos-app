import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { MobileNav } from './MobileNav'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth'

export function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const { isAdmin } = useAuth()

  return (
    <div className="min-h-screen bg-bg-primary">
      <Header />
      {isAdmin && (
        <div className="hidden lg:block">
          <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
        </div>
      )}
      <main
        className={cn(
          'min-h-[calc(100vh-4rem)] pt-6 pb-24 lg:pb-12 px-4 lg:px-8 transition-all duration-300',
          isAdmin && (collapsed ? 'lg:ml-16' : 'lg:ml-56')
        )}
      >
        <Outlet />
      </main>
      <MobileNav />
    </div>
  )
}
