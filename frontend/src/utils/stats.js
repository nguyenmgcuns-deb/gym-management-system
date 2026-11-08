// Simple statistics computed from data the API already returns. No analytics engine.
import { addDays, fromISODate, startOfWeek, toISODate } from './dates'
import { waterOn } from './water'

const avg = (nums) => (nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : null)
const round1 = (n) => Math.round(n * 10) / 10

export function workoutStats(workouts, today = toISODate()) {
  const completed = workouts.filter((w) => w.status === 'completed')
  const month = today.slice(0, 7)
  const prev = fromISODate(`${month}-01`)
  prev.setMonth(prev.getMonth() - 1)
  const lastMonth = toISODate(prev).slice(0, 7)

  // Completed workouts per week, last 8 weeks (oldest first)
  const thisWeek = startOfWeek(fromISODate(today))
  const weeks = Array.from({ length: 8 }, (_, i) => {
    const start = addDays(thisWeek, -7 * (7 - i))
    const from = toISODate(start)
    const to = toISODate(addDays(start, 6))
    return { start: from, count: completed.filter((w) => w.date >= from && w.date <= to).length }
  })

  return {
    total: completed.length,
    planned: workouts.length - completed.length,
    thisMonth: completed.filter((w) => w.date.startsWith(month)).length,
    lastMonth: completed.filter((w) => w.date.startsWith(lastMonth)).length,
    avgDuration: avg(completed.filter((w) => w.duration != null).map((w) => w.duration)),
    weeks,
  }
}

export function gymStats(sessions) {
  const done = sessions.filter((s) => s.duration != null)
  return {
    visits: sessions.length,
    totalMinutes: done.reduce((n, s) => n + s.duration, 0),
    avgMinutes: avg(done.map((s) => s.duration)),
    longest: done.length ? Math.max(...done.map((s) => s.duration)) : null,
  }
}

export function waterStats(entries, goal, days = 7, today = toISODate()) {
  const totals = Array.from({ length: days }, (_, i) => waterOn(entries, toISODate(addDays(fromISODate(today), -i))))
  return {
    avgPerDay: avg(totals),
    daysGoalMet: totals.filter((t) => t >= goal).length,
    days,
  }
}

export function weightStats(entries) {
  // entries newest first
  if (!entries.length) return null
  const kgs = entries.map((e) => e.kg)
  const current = entries[0]
  const start = entries[entries.length - 1]
  return {
    current: current.kg,
    start: start.kg,
    startDate: start.date,
    change: round1(current.kg - start.kg),
    lowest: Math.min(...kgs),
    highest: Math.max(...kgs),
    count: entries.length,
  }
}
