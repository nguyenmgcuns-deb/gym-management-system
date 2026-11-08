import { useMemo, useState } from 'react'

import { exercisesApi } from '../api/exercises'
import { useAsync } from '../hooks/useAsync'
import { Alert, Spinner } from '../ui'
import Icon from '../ui/Icon'

// Search + muscle-group filter over the exercise catalog. Calls onSelect(exercise).
export default function ExercisePicker({ selectedId, onSelect }) {
  const { data: exercises, loading, error, reload } = useAsync(() => exercisesApi.list(), [])
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState('')

  const groups = useMemo(
    () => [...new Set((exercises || []).map((e) => e.muscle_group))].sort(),
    [exercises],
  )
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (exercises || []).filter(
      (e) => (!group || e.muscle_group === group) && (!q || e.name.toLowerCase().includes(q)),
    )
  }, [exercises, query, group])

  if (loading && !exercises) return <Spinner label="Loading exercises…" />
  if (error) return <Alert onRetry={reload}>{error.message}</Alert>

  return (
    <div className="picker">
      <div className="picker__filters">
        <div className="search">
          <Icon name="search" size={18} />
          <input className="input" type="search" placeholder={`Search ${exercises.length} exercises…`}
            aria-label="Search exercises" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <select className="select" aria-label="Muscle group" value={group} onChange={(e) => setGroup(e.target.value)}>
          <option value="">All muscle groups</option>
          {groups.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      <div className="picker__list" role="listbox" aria-label="Exercises">
        {matches.length === 0 && <p className="muted" style={{ padding: 12, margin: 0 }}>No exercise matches “{query}”.</p>}
        {matches.map((e) => (
          <button key={e.id} type="button" role="option" aria-selected={e.id === selectedId}
            className={`picker__item ${e.id === selectedId ? 'picker__item--selected' : ''}`}
            onClick={() => onSelect(e)}>
            <span>{e.name}</span>
            <span className="chip">{e.muscle_group}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
