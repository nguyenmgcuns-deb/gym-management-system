// Small per-user settings saved in this browser (no backend endpoint yet).
import { storage } from './storage'

const key = (userId, name) => `gymtracker.${userId}.${name}`

export const DEFAULT_WEEKLY_TARGET = 5 // gym sessions

// ---------- Settings ----------
export const settingsStore = {
  weeklyTarget(userId) {
    return Number(storage.get(key(userId, 'weeklyTarget'))) || DEFAULT_WEEKLY_TARGET
  },
  setWeeklyTarget(userId, n) {
    storage.set(key(userId, 'weeklyTarget'), String(n))
  },
}
