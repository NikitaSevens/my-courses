import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { api } from '../api/client'

interface User {
  id: number
  email: string
  firstName: string
  lastName: string
  role: string
}

interface AuthCtx {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  isAuthenticated: boolean
}

const Ctx = createContext<AuthCtx | null>(null)

function loadUser(): User | null {
  try { return JSON.parse(localStorage.getItem('user') || 'null') } catch { return null }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(loadUser)

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password })
    localStorage.setItem('accessToken', data.accessToken)
    localStorage.setItem('refreshToken', data.refreshToken)
    localStorage.setItem('user', JSON.stringify(data.user))
    setUser(data.user)
  }, [])

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('refreshToken')
    try { await api.post('/auth/logout', { refreshToken }) } catch {}
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    setUser(null)
  }, [])

  return (
    <Ctx.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </Ctx.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
