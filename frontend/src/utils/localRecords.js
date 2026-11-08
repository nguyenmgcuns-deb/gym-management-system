// Body-weight records and small settings, saved in this browser per user.
import { storage } from './storage'

const key = (userId, name) => `gymtracker.${userId}.${name}`
const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

export const DEFAULT_WEEKLY_TARGET = 5 // gym sessions

// ---------- Weight ----------
// [{ id, kg, date: "YYYY-MM-DD" }], newest first
export const weightStore = {
  load(userId) {
    return storage.getJSON(key(userId, 'weight'), [])
  },
  save(userId, list) {
    const sorted = [...list].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    storage.setJSON(key(userId, 'weight'), sorted)
    return sorted
  },
  add(userId, { kg, date }) {
    // One record per day: a new value for the same day replaces the old one
    const list = this.load(userId).filter((w) => w.date !== date)
    return this.save(userId, [{ id: newId(), kg, date }, ...list])
  },
  remove(userId, id) {
    return this.save(userId, this.load(userId).filter((w) => w.id !== id))
  },
}

// ---------- Settings ----------
export const settingsStore = {
  weeklyTarget(userId) {
    return Number(storage.get(key(userId, 'weeklyTarget'))) || DEFAULT_WEEKLY_TARGET
  },
  setWeeklyTarget(userId, n) {
    storage.set(key(userId, 'weeklyTarget'), String(n))
  },
}
