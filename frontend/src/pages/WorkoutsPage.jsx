import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { workoutsApi } from '../api/workouts'
import { useAsync } from '../hooks/useAsync'
import { Alert, Badge, Card, EmptyState, PageHeader, Spinner } from '../ui'
import Icon from '../ui/Icon'
import { formatDate, formatDuration } from '../utils/dates'

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'planned', label: 'Planned' },
  { key: 'completed', label: 'Completed' },
]

export default function WorkoutsPage() {
  const navigate = useNavigate()
  const { data: workouts, loading, error, reload, setData } = useAsync(() => workoutsApi.list(), [])
  const [filter, setFilter] = useState('all')
  const [busyId, setBusyId] = useState(null)
  const [actionError, setActionError] = useState('')

  const shown = (workouts || []).filter((w) => filter === 'all' || w.status === filter)
  const count = (key) => (workouts || []).filter((w) => key === 'all' || w.status === key).length

  async function act(id, fn) {
    setBusyId(id)
    setActionError('')
    try {
      await fn()
    } catch (err) {
      setActionError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  const complete = (w) =>
    act(w.id, async () => {
      const updated = await workoutsApi.complete(w.id)
      setData((list) => list.map((x) => (x.id === w.id ? updated : x)))
    })

  const remove = (w) => {
    if (!window.confirm(`Delete "${w.name}"? Its exercises will be deleted too.`)) return
    act(w.id, async () => {
      await workoutsApi.remove(w.id)
      setData((list) => list.filter((x) => x.id !== w.id))
    })
  }

  return (
    <>
      <PageHeader
        title="Workout plans"
        subtitle="Plan workouts, log exercises, and mark them done."
        action={
          <Link to="/workouts/new" className="btn btn--primary">
            <Icon name="plus" size={18} /> New workout
          </Link>
        }
      />

      <Card>
        <div className="card__head">
          <div className="tabs" role="tablist">
            {FILTERS.map((f) => (
              <button key={f.key} type="button" role="tab" aria-selected={filter === f.key}
                className={`tab ${filter === f.key ? 'active' : ''}`} onClick={() => setFilter(f.key)}>
                {f.label} ({count(f.key)})
              </button>
            ))}
          </div>
        </div>

        {actionError && <div style={{ marginBottom: 16 }}><Alert>{actionError}</Alert></div>}

        {loading && !workouts ? (
          <Spinner />
        ) : error ? (
          <Alert onRetry={reload}>{error.message}</Alert>
        ) : shown.length === 0 ? (
          <EmptyState action={<Link to="/workouts/new" className="btn btn--primary">Plan your first workout</Link>}>
            {filter === 'all' ? 'No workouts yet.' : `No ${filter} workouts.`}
          </EmptyState>
        ) : (
          <div className="table-wrap">
            <table className="table table--cards">
              <thead>
                <tr>
                  <th>Workout</th>
                  <th>Date</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {shown.map((w) => (
                  <tr key={w.id}>
                    <td className="td-title"><Link to={`/workouts/${w.id}`}>{w.name}</Link></td>
                    <td data-label="Date">{formatDate(w.date)}</td>
                    <td data-label="Duration">{formatDuration(w.duration)}</td>
                    <td data-label="Status"><Badge kind={w.status}>{w.status}</Badge></td>
                    <td>
                      <div className="actions">
                        {w.status === 'planned' && (
                          <button type="button" className="btn btn--secondary btn--sm" disabled={busyId === w.id}
                            onClick={() => complete(w)}>
                            <Icon name="check" size={16} /> Complete
                          </button>
                        )}
                        <button type="button" className="icon-btn" title="View" aria-label={`View ${w.name}`}
                          onClick={() => navigate(`/workouts/${w.id}`)}>
                          <Icon name="eye" size={18} />
                        </button>
                        <button type="button" className="icon-btn" title="Edit" aria-label={`Edit ${w.name}`}
                          onClick={() => navigate(`/workouts/${w.id}/edit`)}>
                          <Icon name="edit" size={18} />
                        </button>
                        <button type="button" className="icon-btn icon-btn--danger" title="Delete"
                          aria-label={`Delete ${w.name}`} disabled={busyId === w.id} onClick={() => remove(w)}>
                          <Icon name="trash" size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  )
}
