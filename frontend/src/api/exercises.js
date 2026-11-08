import { api } from './client'

// The catalog rarely changes, so fetch it once per page load and share it.
let cache = null

export const exercisesApi = {
  list() {
    if (!cache) {
      cache = api('/api/exercises').catch((err) => {
        cache = null // let the next call retry
        throw err
      })
    }
    return cache
  },
}

// { 12: { id: 12, name: 'Squat', muscle_group: 'Legs' }, ... }
export async function exerciseMap() {
  const list = await exercisesApi.list()
  return Object.fromEntries(list.map((e) => [e.id, e]))
}
