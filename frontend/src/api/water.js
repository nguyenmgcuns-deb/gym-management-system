import { api } from './client'

// Backend log { id, amount_ml, logged_at } -> UI entry { id, amount, at }
const toEntry = (log) => ({ id: log.id, amount: log.amount_ml, at: log.logged_at })

export const waterApi = {
  // Logs at or after `since` (a Date). The page groups them into local days.
  list: async (since) => {
    const qs = since ? `?since=${encodeURIComponent(since.toISOString())}` : ''
    return (await api(`/api/water${qs}`)).map(toEntry)
  },
  add: async (amount) => toEntry(await api('/api/water', { method: 'POST', body: { amount_ml: amount } })),
  remove: (id) => api(`/api/water/${id}`, { method: 'DELETE' }),
  getGoal: async () => (await api('/api/water/goal')).daily_goal_ml,
  setGoal: async (ml) =>
    (await api('/api/water/goal', { method: 'PUT', body: { daily_goal_ml: ml } })).daily_goal_ml,
}
