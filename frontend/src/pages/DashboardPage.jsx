import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { gymApi } from '../api/gym'
import { waterApi } from '../api/water'
import { workoutsApi } from '../api/workouts'
import WeeklyActivity from '../components/WeeklyActivity'
import { useAuth } from '../context/AuthContext'
import { useAsync } from '../hooks/useAsync'
import { Alert, Card, PageHeader, Spinner } from '../ui'
import { formatDate, formatDuration, formatShort, fromISODate, startOfWeek, toISODate } from '../utils/dates'
import { settingsStore, weightStore } from '../utils/localRecords'
import { waterOn } from '../utils/water'

const QUICK_WATER = 250 // ml added by the "Add water" link

// Workout to show in "Today's workout": today's planned one, else the next planned one.
function pickTodaysWorkout(workouts, today) {
  const planned = workouts.filter((w) => w.status === 'planned')
  const todays = planned.find((w) => w.date === today)
  if (todays) return { workout: todays, label: "Today's workout" }
  const upcoming = planned.filter((w) => w.date > today).sort((a, b) => (a.date < b.date ? -1 : 1))[0]
  if (upcoming) return { workout: upcoming, label: `Next workout · ${formatShort(upcoming.date)}` }
  const doneToday = workouts.find((w) => w.status === 'completed' && w.date === today)
  if (doneToday) return { workout: doneToday, label: "Today's workout", done: true }
  return { workout: null, label: "Today's workout" }
}

async function loadDashboard() {
  const midnight = fromISODate(toISODate()) // start of today, local time
  const [workouts, sessions, recent, waterToday, waterGoal] = await Promise.all([
    workoutsApi.list(),
    gymApi.history(),
    workoutsApi.history(5),
    waterApi.list(midnight),
    waterApi.getGoal(),
  ])
  // Exercise count per recent workout
  const counts = await Promise.all(recent.map((w) => workoutsApi.listExercises(w.id)))
  const recentRows = recent.map((w, i) => ({ ...w, exerciseCount: counts[i].length }))
  return { workouts, sessions, recent: recentRows, waterToday, waterGoal }
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { data, loading, error, reload, setData } = useAsync(loadDashboard, [])
  const [waterBusy, setWaterBusy] = useState(false)
  const [waterError, setWaterError] = useState('')
  const weights = useMemo(() => weightStore.load(user.id), [user.id])
  const weeklyTarget = settingsStore.weeklyTarget(user.id)

  const today = toISODate()
  const waterToday = data ? waterOn(data.waterToday, today) : 0
  const waterGoal = data?.waterGoal || 3000
  const waterPct = Math.round((waterToday / waterGoal) * 100)
  const latestWeight = weights[0]

  async function quickAddWater() {
    setWaterBusy(true)
    setWaterError('')
    try {
      const entry = await waterApi.add(QUICK_WATER)
      setData((d) => ({ ...d, waterToday: [entry, ...d.waterToday] }))
    } catch (err) {
      setWaterError(err.message)
    } finally {
      setWaterBusy(false)
    }
  }

  const month = today.slice(0, 7) // "YYYY-MM"
  const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(fromISODate(today))
  const workoutsThisMonth = (data?.workouts || []).filter(
    (w) => w.status === 'completed' && w.date.startsWith(month),
  ).length

  const weekStart = toISODate(startOfWeek())
  const sessionsThisWeek = (data?.sessions || []).filter(
    (s) => toISODate(new Date(s.check_in)) >= weekStart,
  ).length
  const todays = data ? pickTodaysWorkout(data.workouts, today) : null

  return (
    <>
      <PageHeader
        title={`Your activity, ${user.first_name}`}
        subtitle={`${formatShort(today)} · Here's how your week is going`}
      />

      {error && <div style={{ marginBottom: 20 }}><Alert onRetry={reload}>{error.message}</Alert></div>}

      <div className="stat-grid">
        <Card className="stat">
          <div className="stat__label">{todays?.label || "Today's workout"}</div>
          {loading && !data ? (
            <Spinner />
          ) : todays?.workout ? (
            <>
              <div className="stat__value">{todays.workout.name}</div>
              {todays.done ? (
                <div className="stat__meta">Completed. Nice work!</div>
              ) : (
                <Link className="btn btn--primary" to={`/workouts/${todays.workout.id}`}>
                  Start workout
                </Link>
              )}
            </>
          ) : (
            <>
              <div className="stat__value">Rest day</div>
              <Link className="btn btn--primary" to="/workouts/new">Plan a workout</Link>
            </>
          )}
        </Card>

        <Card className="stat">
          <div className="stat__label">Water intake</div>
          <div className="stat__value">{loading && !data ? '…' : `${waterToday.toLocaleString()} ml`}</div>
          <div className="stat__meta">
            {waterPct}% of daily goal ·{' '}
            <button type="button" className="link-btn" onClick={quickAddWater} disabled={waterBusy || !data}>
              {waterBusy ? 'Adding…' : 'Add water'}
            </button>
          </div>
          {waterError && <p className="field__error">{waterError}</p>}
        </Card>

        <Card className="stat">
          <div className="stat__label">Current weight</div>
          <div className="stat__value">{latestWeight ? `${latestWeight.kg} kg` : 'Not recorded'}</div>
          <div className="stat__meta">
            {latestWeight && <>{formatDate(latestWeight.date)} · </>}
            <Link to="/weight">Record weight</Link>
          </div>
        </Card>

        <Card className="stat">
          <div className="stat__label">Weekly sessions</div>
          <div className="stat__value">{loading && !data ? '…' : sessionsThisWeek}</div>
          <div className="stat__meta">Target: {weeklyTarget} sessions</div>
        </Card>

        <Card className="stat">
          <div className="stat__label">This month</div>
          <div className="stat__value">{loading && !data ? '…' : workoutsThisMonth}</div>
          <div className="stat__meta">
            Workouts done in {monthName}
          </div>
        </Card>
      </div>

      <div className="two-col">
        <Card title="Weekly activity">
          <WeeklyActivity sessions={data?.sessions || []} workouts={data?.workouts || []} />
        </Card>

        <Card title="Recent workouts">
          <div className="table-wrap">
            <table className="table table--cards">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Workout</th>
                  <th>Duration</th>
                  <th>Exercises</th>
                </tr>
              </thead>
              <tbody>
                {loading && !data ? (
                  <tr><td colSpan={4}><Spinner /></td></tr>
                ) : data?.recent.length ? (
                  data.recent.map((w) => (
                    <tr key={w.id}>
                      <td data-label="Date">{formatShort(w.date)}</td>
                      <td className="td-title"><Link to={`/workouts/${w.id}`}>{w.name}</Link></td>
                      <td data-label="Duration">{formatDuration(w.duration)}</td>
                      <td data-label="Exercises">{w.exerciseCount}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={4} className="muted">No records yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 20 }}>
            <Link className="btn btn--primary" to="/history">View all history</Link>
          </div>
        </Card>
      </div>
    </>
  )
}
