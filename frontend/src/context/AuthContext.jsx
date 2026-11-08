import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { authApi, usersApi } from '../api/auth'
import { setUnauthorizedHandler, tokenStore } from '../api/client'

// Token approach: the JWT from /api/auth/login is kept in localStorage
// (key "gymtracker.token") and sent as "Authorization: Bearer <token>".
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  // "loading" while we check a saved token, then "authenticated" or "guest".
  // "offline" = we have a token but couldn't reach the server (don't log out for that).
  const [status, setStatus] = useState(() => (tokenStore.get() ? 'loading' : 'guest'))
  const [checkError, setCheckError] = useState('')
  const [checkTick, setCheckTick] = useState(0)
  const retryCheck = useCallback(() => {
    setStatus('loading')
    setCheckTick((n) => n + 1)
  }, [])

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
      .catch((err) => {
        if (cancelled) return
        if (err.status === 401) return logout() // token expired or invalid
        setCheckError(err.message)
        setStatus('offline')
      })
    return () => {
      cancelled = true
    }
  }, [logout, checkTick])

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
    () => ({ user, status, login, logout, setUser, checkError, retryCheck }),
    [user, status, login, logout, checkError, retryCheck],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
