import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { authApi, usersApi } from '../api/auth'
import { setUnauthorizedHandler, tokenStore } from '../api/client'

// Token approach: the JWT from /api/auth/login is kept in localStorage
// (key "gymtracker.token") and sent as "Authorization: Bearer <token>".
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  // "loading" while we check a saved token, then "authenticated" or "guest"
  const [status, setStatus] = useState(() => (tokenStore.get() ? 'loading' : 'guest'))

  const logout = useCallback(() => {
    tokenStore.clear()
    setUser(null)
    setStatus('guest')
  }, [])

  // Any 401 from the API (expired / invalid token) logs the user out.
  useEffect(() => {
    setUnauthorizedHandler(logout)
  }, [logout])

  // On page load: if a token was saved, ask the backend who it belongs to.
  useEffect(() => {
    if (!tokenStore.get()) return
    let cancelled = false
    usersApi
      .me()
      .then((me) => {
        if (cancelled) return
        setUser(me)
        setStatus('authenticated')
      })
      .catch(() => {
        if (!cancelled) logout()
      })
    return () => {
      cancelled = true
    }
  }, [logout])

  const login = useCallback(async (email, password) => {
    const { access_token } = await authApi.login({ email, password })
    tokenStore.set(access_token)
    try {
      const me = await usersApi.me()
      setUser(me)
      setStatus('authenticated')
      return me
    } catch (err) {
      tokenStore.clear()
      throw err
    }
  }, [])

  const value = useMemo(
    () => ({ user, status, login, logout, setUser }),
    [user, status, login, logout],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
