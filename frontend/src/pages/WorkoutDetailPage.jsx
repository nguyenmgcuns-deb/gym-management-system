import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'

import { exerciseMap } from '../api/exercises'
import { workoutsApi } from '../api/workouts'
import ExerciseTable from '../components/ExerciseTable'
import { useAsync } from '../hooks/useAsync'
import { Alert, Badge, Card, EmptyState, PageHeader, Spinner } from '../ui'
import Icon from '../ui/Icon'
import { formatDate, formatDuration } from '../utils/dates'
import { volumeOf } from '../utils/workout'

async function loadWorkout(id) {
  const [workout, items, byId] = await Promise.all([
    workoutsApi.get(id),
    workoutsApi.listExercises(id),
    exerciseMap(),
  ])
  return { workout, items: items.map((it) => ({ ...it, exercise: byId[it.exercise_id] })) }
}

export default function WorkoutDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { data, loading, error, reload, setData } = useAsync(() => loadWorkout(id), [id])
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState('')
  const [flash, setFlash] = useState(location.state?.flash || '')

  if (loading && !data) return <Spinner />
  if (error) {
    return (
      <>
        <PageHeader title="Workout" />
        <Alert onRetry={error.status === 404 ? undefined : reload}>
          {error.status === 404 ? 'This workout does not exist.' : error.message}
        </Alert>
        <p><Link to="/workouts">Back to workouts</Link></p>
      </>
    )
  }

  const { workout, items } = data
  const totalSets = items.reduce((n, it) => n + it.sets, 0)
  const totalVolume = items.reduce((n, it) => n + volumeOf(it), 0)

  async function complete() {
    setBusy(true)
    setActionError('')
    try {
      const updated = await workoutsApi.complete(workout.id)
      setData((d) => ({ ...d, workout: updated }))
      setFlash('Workout completed. Great job!')
    } catch (err) {
      setActionError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    if (!window.confirm(`Delete "${workout.name}"? This can't be undone.`)) return
    setBusy(true)
    try {
      await workoutsApi.remove(workout.id)
      navigate('/workouts', { replace: true })
    } catch (err) {
      setActionError(err.message)
      setBusy(false)
    }
  }

  return (
    <>
      <p className="crumb"><Link to="/workouts"><Icon name="chevronLeft" size={16} /> Workout plans</Link></p>
      <PageHeader
        title={workout.name}
        subtitle={<>{formatDate(workout.date)} · {formatDuration(workout.duration)} · <Badge kind={workout.status}>{workout.status}</Badge></>}
        action={
          <div className="row">
            {workout.status === 'planned' && (
              <button type="button" className="btn btn--primary" onClick={complete} disabled={busy}>
                <Icon name="check" size={18} /> Complete workout
              </button>
            )}
            <Link to={`/workouts/${workout.id}/edit`} className="btn btn--secondary">
              <Icon name="edit" size={18} /> Edit
            </Link>
            <button type="button" className="btn btn--danger" onClick={remove} disabled={busy}>
              <Icon name="trash" size={18} /> Delete
            </button>
          </div>
        }
      />

      <div className="stack">
        {flash && <Alert kind="success">{flash}</Alert>}
        {actionError && <Alert>{actionError}</Alert>}

        <div className="stat-grid stat-grid--3">
          <Card className="stat stat--small">
            <div className="stat__label">Exercises</div>
            <div className="stat__value">{items.length}</div>
          </Card>
          <Card className="stat stat--small">
            <div className="stat__label">Total sets</div>
            <div className="stat__value">{totalSets}</div>
          </Card>
          <Card className="stat stat--small">
            <div className="stat__label">Volume lifted</div>
            <div className="stat__value">{totalVolume.toLocaleString()} kg</div>
          </Card>
        </div>

        <Card title="Exercises">
          {items.length ? (
            <ExerciseTable items={items} />
          ) : (
            <EmptyState action={<Link to={`/workouts/${workout.id}/edit`} className="btn btn--primary">Add exercises</Link>}>
              No exercises recorded yet.
            </EmptyState>
          )}
        </Card>
      </div>
    </>
  )
}
