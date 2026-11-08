import { api } from './client'

// Backend entry { id, weight_kg, date } -> UI entry { id, kg, date }
const toEntry = (e) => ({ id: e.id, kg: e.weight_kg, date: e.date })

export const weightApi = {
  list: async (limit = 100) => (await api(`/api/weight?limit=${limit}`)).map(toEntry),
  // Same date again replaces that day's entry
  save: async ({ kg, date }) =>
    toEntry(await api('/api/weight', { method: 'POST', body: { weight_kg: kg, date } })),
  remove: (id) => api(`/api/weight/${id}`, { method: 'DELETE' }),
}
