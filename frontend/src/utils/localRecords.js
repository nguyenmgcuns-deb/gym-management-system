// Water and body-weight records, saved in this browser per user.
// The backend has no water/weight endpoints yet. When it does, swap these
// functions for API calls (same shapes) and the pages keep working.
import { toISODate } from './dates'
import { storage } from './storage'

const key = (userId, name) => `gymtracker.${userId}.${name}`
const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

export const DEFAULT_WATER_GOAL = 3000 // ml
export const DEFAULT_WEEKLY_TARGET = 5 // gym sessions

// ---------- Water ----------
// { goal: 3000, entries: [{ id, amount, at: ISO datetime }] }
export const waterStore = {
  load(userId) {
    const data = storage.getJSON(key(userId, 'water'), null)
    return { goal: data?.goal || DEFAULT_WATER_GOAL, entries: data?.entries || [] }
  },
  save(userId, data) {
    storage.setJSON(key(userId, 'water'), data)
    return data
  },
  add(userId, amount) {
    const data = this.load(userId)
    data.entries = [{ id: newId(), amount, at: new Date().toISOString() }, ...data.entries]
    return this.save(userId, data)
  },
  remove(userId, id) {
    const data = this.load(userId)
    data.entries = data.entries.filter((e) => e.id !== id)
    return this.save(userId, data)
  },
  setGoal(userId, goal) {
    return this.save(userId, { ...this.load(userId), goal })
  },
}

export function waterOn(entries, isoDate = toISODate()) {
  return entries
    .filter((e) => toISODate(new Date(e.at)) === isoDate)
    .reduce((sum, e) => sum + e.amount, 0)
}

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
