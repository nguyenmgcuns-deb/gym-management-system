import { Navigate, Route, Routes } from 'react-router-dom'

import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './layouts/AppLayout'
import ComingSoonPage from './pages/ComingSoonPage'
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import WorkoutsPage from './pages/WorkoutsPage'

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Logged-in only */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="gym" element={<ComingSoonPage title="Gym sessions" />} />
          <Route path="workouts" element={<WorkoutsPage />} />
          <Route path="exercises" element={<ComingSoonPage title="Exercises" />} />
          <Route path="water" element={<ComingSoonPage title="Water tracking" />} />
          <Route path="weight" element={<ComingSoonPage title="Weight tracking" />} />
          <Route path="history" element={<ComingSoonPage title="Workout history" />} />
          <Route path="profile" element={<ComingSoonPage title="My profile" />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
