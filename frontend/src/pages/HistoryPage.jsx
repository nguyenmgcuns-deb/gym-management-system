import { useState } from 'react'
import { Link } from 'react-router-dom'

import { exerciseMap } from '../api/exercises'
import { workoutsApi } from '../api/workouts'
import ExerciseTable from '../components/ExerciseTable'
import { useAsync } from '../hooks/useAsync'
import { Alert, Card, EmptyState, PageHeader, Spinner } from '../ui'
import Icon from '../ui/Icon'
import { formatDate, formatDuration, toISODate } from '../utils/dates'

const LIMIT = 100 // backend maximum

// One completed workout; its exercises load when the row is opened.
function HistoryItem({ workout }) {
  const [open, setOpen] = useState(false)
  const [state, setState] = useState({ items: null, loading: false, error: '' })

  async function toggle() {
    const next = !open
    setOpen(next)
    if (!next || state.items) return
    setState({ items: null, loading: true, error: '' })
    try {
      const [items, byId] = await Promise.all([workoutsApi.listExercises(workout.id), exerciseMap()])
      setState({ items: items.map((it) => ({ ...it, exercise: byId[it.exercise_id] })), loading: false, error: '' })
    } catch (err) {
      setState({ items: null, loading: false, error: err.message })
    }
  }

  return (
    <li className={`history__item ${open ? 'history__item--open' : ''}`}>
      <button type="button" className="history__head" onClick={toggle} aria-expanded={open}>
        <span className="history__date">{formatDate(workout.date)}</span>
        <span className="history__name">{workout.name}</span>
        <span className="history__dur"><Icon name="clock" size={16} /> {formatDuration(workout.duration)}</span>
        <Icon name="chevronDown" size={20} className="history__chev" />
      </button>
      {open && (
        <div className="history__body">
          {state.loading && <Spinner label="Loading exercises…" />}
          {state.error && <Alert>{state.error}</Alert>}
          {state.items && (state.items.length
            ? <ExerciseTable items={state.items} compact />
            : <p className="muted" style={{ margin: 0 }}>No exercises were recorded.</p>)}
          <p style={{ margin: '12px 0 0' }}><Link to={`/workouts/${workout.id}`}>Open workout</Link></p>
        </div>
      )}
    </li>
  )
}

export default function HistoryPage() {
  const { data: workouts, loading, error, reload } = useAsync(() => workoutsApi.history(LIMIT), [])

  const month = toISODate().slice(0, 7)
  const thisMonth = (workouts || []).filter((w) => w.date.startsWith(month)).length
  const minutes = (workouts || []).reduce((n, w) => n + (w.duration || 0), 0)

  return (
    <>
      <PageHeader title="Workout history" subtitle="Every workout you've completed, newest first." />

      {loading && !workouts ? (
        <Spinner />
      ) : error ? (
        <Alert onRetry={reload}>{error.message}</Alert>
      ) : (
        <div className="stack">
          <div className="stat-grid stat-grid--3">
            <Card className="stat stat--small">
              <div className="stat__label">Completed workouts</div>
              <div className="stat__value">{workouts.length}{workouts.length === LIMIT ? '+' : ''}</div>
            </Card>
            <Card className="stat stat--small">
              <div className="stat__label">This month</div>
              <div className="stat__value">{thisMonth}</div>
            </Card>
            <Card className="stat stat--small">
              <div className="stat__label">Time trained</div>
              <div className="stat__value">{formatDuration(minutes)}</div>
            </Card>
          </div>

          <Card title="Completed workouts">
            {workouts.length === 0 ? (
              <EmptyState action={<Link to="/workouts" className="btn btn--primary">Go to workout plans</Link>}>
                No completed workouts yet. Finish a workout and it shows up here.
              </EmptyState>
            ) : (
              <ul className="history">
                {workouts.map((w) => <HistoryItem key={w.id} workout={w} />)}
              </ul>
            )}
          </Card>
        </div>
      )}
    </>
  )
}
