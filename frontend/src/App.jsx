import { Navigate, Route, Routes } from 'react-router-dom'

import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './layouts/AppLayout'
import DashboardPage from './pages/DashboardPage'
import ExercisesPage from './pages/ExercisesPage'
import GymPage from './pages/GymPage'
import HistoryPage from './pages/HistoryPage'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import RegisterPage from './pages/RegisterPage'
import WaterPage from './pages/WaterPage'
import WeightPage from './pages/WeightPage'
import WorkoutDetailPage from './pages/WorkoutDetailPage'
import WorkoutFormPage from './pages/WorkoutFormPage'
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
          <Route path="gym" element={<GymPage />} />
          <Route path="workouts" element={<WorkoutsPage />} />
          <Route path="workouts/new" element={<WorkoutFormPage key="new" />} />
          <Route path="workouts/:id" element={<WorkoutDetailPage />} />
          <Route path="workouts/:id/edit" element={<WorkoutFormPage key="edit" />} />
          <Route path="exercises" element={<ExercisesPage />} />
          <Route path="water" element={<WaterPage />} />
          <Route path="weight" element={<WeightPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
