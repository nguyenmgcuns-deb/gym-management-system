// Date helpers. "ISO date" = "YYYY-MM-DD" in the user's local time zone.

export function toISODate(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// "2026-11-08" -> Date at local midnight (new Date("2026-11-08") would be UTC)
export function fromISODate(s) {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(d, n) {
  const copy = new Date(d)
  copy.setDate(copy.getDate() + n)
  return copy
}

// Weeks run Sunday -> Saturday
export function startOfWeek(d = new Date()) {
  const s = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  return addDays(s, -s.getDay())
}

const fmt = (opts) => new Intl.DateTimeFormat('en-US', opts)
const short = fmt({ month: 'short', day: 'numeric' })
const medium = fmt({ month: 'short', day: 'numeric', year: 'numeric' })
const weekday = fmt({ weekday: 'short' })
const time = fmt({ hour: 'numeric', minute: '2-digit' })

const asDate = (v) => (typeof v === 'string' && v.length === 10 ? fromISODate(v) : new Date(v))

export const formatShort = (v) => short.format(asDate(v)) // "Nov 8"
export const formatDate = (v) => medium.format(asDate(v)) // "Nov 8, 2026"
export const formatWeekday = (v) => weekday.format(asDate(v)) // "Sun"
export const formatTime = (v) => time.format(asDate(v)) // "6:05 PM"

export function formatDuration(minutes) {
  if (minutes == null) return '—'
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h} h ${m} min` : `${h} h`
}
