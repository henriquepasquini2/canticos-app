import {
  createBrowserRouter,
  RouterProvider,
  Route,
  createRoutesFromElements,
} from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/lib/auth'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { Layout } from '@/components/layout/Layout'
import { AdminRoute } from '@/components/layout/AdminRoute'
import { PublicHome } from '@/pages/PublicHome'
import { PublicCatalog } from '@/pages/PublicCatalog'
import { PublicCalendar } from '@/pages/PublicCalendar'
import { PublicScheduleView } from '@/pages/PublicScheduleView'
import { Login } from '@/pages/Login'
import { Dashboard } from '@/pages/Dashboard'
import { Catalog } from '@/pages/Catalog'
import { Calendar } from '@/pages/Calendar'
import { ScheduleBuilderPage } from '@/pages/ScheduleBuilderPage'
import { Suggestions } from '@/pages/Suggestions'
import { Insights } from '@/pages/Insights'
import { Sync } from '@/pages/Sync'
import { Users } from '@/pages/Users'
import { Privacy } from '@/pages/Privacy'
import { Terms } from '@/pages/Terms'

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      {/* Public routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<PublicHome />} />
        <Route path="/catalogo" element={<PublicCatalog />} />
        <Route path="/calendario" element={<PublicCalendar />} />
        <Route path="/domingo/:date" element={<PublicScheduleView />} />
        <Route path="/sugestoes" element={<Suggestions />} />
        <Route path="/privacidade" element={<Privacy />} />
        <Route path="/termos" element={<Terms />} />
      </Route>

      <Route path="/login" element={<Login />} />

      {/* Admin routes */}
      <Route element={<AdminRoute />}>
        <Route element={<Layout />}>
          <Route path="/admin" element={<Dashboard />} />
          <Route path="/admin/catalogo" element={<Catalog />} />
          <Route path="/admin/calendario" element={<Calendar />} />
          <Route
            path="/admin/domingo/:date"
            element={<ScheduleBuilderPage />}
          />
          <Route path="/admin/sugestoes" element={<Suggestions />} />
          <Route path="/admin/insights" element={<Insights />} />
          <Route path="/admin/sync" element={<Sync />} />
          <Route path="/admin/usuarios" element={<Users />} />
        </Route>
      </Route>
    </>
  )
)

export default function App() {
  return (
    <AuthProvider>
      <Toaster
        position="bottom-right"
        theme="dark"
        toastOptions={{
          style: {
            background: '#16213e',
            border: '1px solid #1e293b',
            color: '#e2e8f0',
          },
        }}
      />
      <RouterProvider router={router} />
    </AuthProvider>
  )
}
