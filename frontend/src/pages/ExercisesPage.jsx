import { useMemo, useState } from 'react'

import { exercisesApi } from '../api/exercises'
import { useAsync } from '../hooks/useAsync'
import { Alert, Card, PageHeader, Spinner } from '../ui'
import Icon from '../ui/Icon'

// Browse the exercise catalog, grouped by muscle group.
export default function ExercisesPage() {
  const { data: exercises, loading, error, reload } = useAsync(() => exercisesApi.list(), [])
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState('')

  const groups = useMemo(() => [...new Set((exercises || []).map((e) => e.muscle_group))].sort(), [exercises])
  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase()
    const out = {}
    for (const e of exercises || []) {
      if (group && e.muscle_group !== group) continue
      if (q && !e.name.toLowerCase().includes(q)) continue
      ;(out[e.muscle_group] ||= []).push(e)
    }
    return out
  }, [exercises, query, group])
  const total = Object.values(grouped).reduce((n, list) => n + list.length, 0)

  return (
    <>
      <PageHeader title="Exercises" subtitle={exercises ? `${exercises.length} exercises across ${groups.length} muscle groups` : ' '} />

      {loading && !exercises ? (
        <Spinner />
      ) : error ? (
        <Alert onRetry={reload}>{error.message}</Alert>
      ) : (
        <div className="stack">
          <div className="picker__filters">
            <div className="search">
              <Icon name="search" size={18} />
              <input className="input" type="search" placeholder="Search exercises…" aria-label="Search exercises"
                value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <div className="tabs">
              <button type="button" className={`tab ${!group ? 'active' : ''}`} onClick={() => setGroup('')}>All</button>
              {groups.map((g) => (
                <button key={g} type="button" className={`tab ${group === g ? 'active' : ''}`} onClick={() => setGroup(g)}>{g}</button>
              ))}
            </div>
          </div>

          {total === 0 && <Card>No exercise matches “{query}”.</Card>}
          <div className="ex-groups">
            {Object.entries(grouped).map(([g, list]) => (
              <Card key={g} title={`${g} · ${list.length}`}>
                <ul className="ex-list">
                  {list.map((e) => <li key={e.id}>{e.name}</li>)}
                </ul>
              </Card>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
