import { api } from './client'

export const gymApi = {
  checkIn: () => api('/api/gym/check-in', { method: 'POST' }),
  checkOut: () => api('/api/gym/check-out', { method: 'POST' }),
  history: () => api('/api/gym/history'),
}
