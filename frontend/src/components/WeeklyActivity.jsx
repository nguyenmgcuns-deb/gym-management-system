import { useState } from 'react'

import { addDays, formatDuration, formatShort, formatWeekday, startOfWeek, toISODate } from '../utils/dates'

// Bar per day = minutes spent at the gym. A dot under the day = a completed workout.
export default function WeeklyActivity({ sessions, workouts }) {
  const [offset, setOffset] = useState(0) // 0 = this week, -1 = last week …
  const start = addDays(startOfWeek(), offset * 7)
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i))
  const todayISO = toISODate()

  const minutesByDay = {}
  for (const s of sessions) {
    const d = toISODate(new Date(s.check_in))
    minutesByDay[d] = (minutesByDay[d] || 0) + (s.duration || 0)
  }
  const workoutsByDay = {}
  for (const w of workouts) {
    if (w.status === 'completed') workoutsByDay[w.date] = (workoutsByDay[w.date] || 0) + 1
  }

  const values = days.map((d) => minutesByDay[toISODate(d)] || 0)
  const max = Math.max(60, ...values)
  const total = values.reduce((a, b) => a + b, 0)
  const workoutTotal = days.reduce((n, d) => n + (workoutsByDay[toISODate(d)] || 0), 0)

  return (
    <div>
      <div className="row week__nav">
        <button type="button" className="btn btn--primary" onClick={() => setOffset(offset - 1)}>
          Previous<span className="hide-phone"> week</span>
        </button>
        <button type="button" className="btn btn--primary" onClick={() => setOffset(0)} disabled={offset === 0}>This week</button>
        <button type="button" className="btn btn--primary" onClick={() => setOffset(offset + 1)} disabled={offset >= 0}>
          Next<span className="hide-phone"> week</span>
        </button>
      </div>
      <p className="week__range">
        {formatShort(days[0])} – {formatShort(days[6])}
      </p>

      <div className="week" role="img"
        aria-label={`${formatDuration(total)} at the gym and ${workoutTotal} completed workouts this week`}>
        {days.map((d, i) => {
          const iso = toISODate(d)
          const v = values[i]
          return (
            <div key={iso} className={`week__day ${iso === todayISO ? 'week__day--today' : ''}`}>
              <span className="week__value">{v ? `${v}m` : ''}</span>
              <div className="week__track">
                <div className="week__bar" style={{ height: `${(v / max) * 100}%` }} />
              </div>
              <span className="week__label">{formatWeekday(d)}</span>
              <span className="week__dots">
                {Array.from({ length: Math.min(workoutsByDay[iso] || 0, 3) }, (_, k) => (
                  <i key={k} />
                ))}
              </span>
            </div>
          )
        })}
      </div>

      <p className="week__summary">
        <strong>{formatDuration(total)}</strong> at the gym · <strong>{workoutTotal}</strong> completed workout{workoutTotal === 1 ? '' : 's'}
      </p>
    </div>
  )
}
