import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import type { User, Session } from '@supabase/supabase-js'
import type { UserRole } from './types'
import { supabase } from './supabase'

interface AuthState {
  user: User | null
  session: Session | null
  isAdmin: boolean
  isApproved: boolean
  role: UserRole
  loading: boolean
  loginError: string | null
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState>({
  user: null,
  session: null,
  isAdmin: false,
  isApproved: false,
  role: null,
  loading: true,
  loginError: null,
  signIn: async () => {},
  signOut: async () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isApproved, setIsApproved] = useState(false)
  const [role, setRole] = useState<UserRole>(null)
  const [loading, setLoading] = useState(true)
  const [loginError, setLoginError] = useState<string | null>(null)

  const checkRole = useCallback(async (email: string | undefined) => {
    if (!email) {
      setIsAdmin(false)
      setIsApproved(false)
      setRole(null)
      return null
    }

    const { data: adminData } = await supabase
      .from('admins')
      .select('id')
      .eq('email', email)
      .single()

    if (adminData) {
      setIsAdmin(true)
      setIsApproved(true)
      setRole('admin')
      return 'admin' as const
    }

    const { data: approvedData } = await supabase
      .from('approved_users')
      .select('id')
      .eq('email', email)
      .single()

    if (approvedData) {
      setIsAdmin(false)
      setIsApproved(true)
      setRole('approved')
      return 'approved' as const
    }

    setIsAdmin(false)
    setIsApproved(false)
    setRole(null)
    return null
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      setUser(s?.user ?? null)
      if (s?.user) {
        checkRole(s.user.email).then(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      setUser(s?.user ?? null)
      setLoginError(null)
      if (s?.user) {
        checkRole(s.user.email).then(() => {
          setLoading(false)
        })
      } else {
        setIsAdmin(false)
        setIsApproved(false)
        setRole(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [checkRole])

  const signIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/login',
      },
    })
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    setIsAdmin(false)
    setIsApproved(false)
    setRole(null)
  }

  return (
    <AuthContext.Provider
      value={{ user, session, isAdmin, isApproved, role, loading, loginError, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  )
}
