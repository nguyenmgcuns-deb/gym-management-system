import { Navigate, Route, Routes } from 'react-router-dom'

import { useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import { Card } from './ui'

// Temporary home until the dashboard is built
function Home() {
  const { user } = useAuth()
  return (
    <div className="main">
      <Card title={`Hi ${user?.first_name ?? ''}`}>You are logged in.</Card>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<Home />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
