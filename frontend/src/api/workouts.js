import { api } from './client'

export const workoutsApi = {
  list: () => api('/api/workouts'),
  get: (id) => api(`/api/workouts/${id}`),
  create: (data) => api('/api/workouts', { method: 'POST', body: data }),
  update: (id, data) => api(`/api/workouts/${id}`, { method: 'PUT', body: data }),
  remove: (id) => api(`/api/workouts/${id}`, { method: 'DELETE' }),
  complete: (id) => api(`/api/workouts/${id}/complete`, { method: 'POST' }),
  history: (limit = 20) => api(`/api/workouts/history?limit=${limit}`),

  // Exercises inside one workout
  listExercises: (id) => api(`/api/workouts/${id}/exercises`),
  addExercise: (id, { exercise_id, sets, reps, weight }) =>
    api(`/api/workouts/${id}/exercises`, {
      method: 'POST',
      body: { exercise_id, sets, reps, weight: weight === '' || weight == null ? null : weight },
    }),
}
