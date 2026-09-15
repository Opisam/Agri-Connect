import { useCallback, useEffect, useMemo, useState } from 'react'

import { authApi } from '../api/authApi'
import { AuthContext, type AuthContextValue } from './context'
import type { LoginPayload, RegisterPayload, User } from './types'

const ACCESS_KEY = 'access'
const REFRESH_KEY = 'refresh'
const USER_KEY = 'agri_user'

function readStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

function persistSession(user: User, access: string, refresh: string) {
  localStorage.setItem(ACCESS_KEY, access)
  localStorage.setItem(REFRESH_KEY, refresh)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

function clearSession() {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
  localStorage.removeItem(USER_KEY)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => readStoredUser())
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const initialize = async () => {
      if (!localStorage.getItem(ACCESS_KEY)) {
        return
      }
      try {
        const current = await authApi.me()
        setUser(current)
      } catch {
        clearSession()
        setUser(null)
      }
    }
    void initialize()
  }, [])

  const login = useCallback(async (payload: LoginPayload) => {
    setLoading(true)
    try {
      const session = await authApi.login(payload)
      persistSession(session.user, session.access, session.refresh)
      setUser(session.user)
    } finally {
      setLoading(false)
    }
  }, [])

  const register = useCallback(async (payload: RegisterPayload) => {
    setLoading(true)
    try {
      const session = await authApi.register(payload)
      persistSession(session.user, session.access, session.refresh)
      setUser(session.user)
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    const refresh = localStorage.getItem(REFRESH_KEY)
    if (refresh) {
      try {
        await authApi.logout(refresh)
      } catch {
        // Ignore network/blacklist errors; the local session is cleared anyway.
      }
    }
    clearSession()
    setUser(null)
  }, [])

  const value: AuthContextValue = useMemo(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}