import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { gymApi } from '../api/gym'
import { workoutsApi } from '../api/workouts'
import WeeklyActivity from '../components/WeeklyActivity'
import { useAuth } from '../context/AuthContext'
import { useAsync } from '../hooks/useAsync'
import { Alert, Card, PageHeader, Spinner } from '../ui'
import { formatDate, formatDuration, formatShort, startOfWeek, toISODate } from '../utils/dates'
import { settingsStore, waterOn, waterStore, weightStore } from '../utils/localRecords'

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
  const [workouts, sessions, recent] = await Promise.all([
    workoutsApi.list(),
    gymApi.history(),
    workoutsApi.history(5),
  ])
  // Exercise count per recent workout
  const counts = await Promise.all(recent.map((w) => workoutsApi.listExercises(w.id)))
  const recentRows = recent.map((w, i) => ({ ...w, exerciseCount: counts[i].length }))
  return { workouts, sessions, recent: recentRows }
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { data, loading, error, reload } = useAsync(loadDashboard, [])
  const [water, setWater] = useState(() => waterStore.load(user.id))
  const weights = useMemo(() => weightStore.load(user.id), [user.id])
  const weeklyTarget = settingsStore.weeklyTarget(user.id)

  const today = toISODate()
  const waterToday = waterOn(water.entries, today)
  const waterPct = Math.round((waterToday / water.goal) * 100)
  const latestWeight = weights[0]

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
          <div className="stat__value">{waterToday.toLocaleString()} ml</div>
          <div className="stat__meta">
            {waterPct}% of daily goal ·{' '}
            <button type="button" className="link-btn"
              onClick={() => setWater(waterStore.add(user.id, QUICK_WATER))}>
              Add water
            </button>
          </div>
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
      </div>

      <div className="two-col">
        <Card title="Weekly activity">
          <WeeklyActivity sessions={data?.sessions || []} workouts={data?.workouts || []} />
        </Card>

        <Card title="Recent workouts">
          <div className="table-wrap">
            <table className="table">
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
                      <td>{formatShort(w.date)}</td>
                      <td><Link to={`/workouts/${w.id}`}>{w.name}</Link></td>
                      <td>{formatDuration(w.duration)}</td>
                      <td>{w.exerciseCount}</td>
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
