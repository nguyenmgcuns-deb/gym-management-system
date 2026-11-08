import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'
import { Alert, Spinner } from '../ui'

// Wrap private routes: guests are sent to /login, then brought back after logging in.
export default function ProtectedRoute() {
  const { status, checkError, retryCheck, logout } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return (
      <div className="fullscreen-center">
        <Spinner label="Loading your account…" />
      </div>
    )
  }
  if (status === 'offline') {
    return (
      <div className="fullscreen-center">
        <div style={{ maxWidth: 480, padding: 16 }} className="stack">
          <Alert onRetry={retryCheck}>{checkError}</Alert>
          <button type="button" className="link-btn" onClick={logout}>Log out instead</button>
        </div>
      </div>
    )
  }
  if (status !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }
  return <Outlet />
}
