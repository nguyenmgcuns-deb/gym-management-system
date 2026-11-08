import { useState } from 'react'

import { weightApi } from '../api/weight'
import WeightChart from '../components/WeightChart'
import { useAsync } from '../hooks/useAsync'
import { Alert, Card, EmptyState, Field, PageHeader, Spinner } from '../ui'
import Icon from '../ui/Icon'
import { formatDate, toISODate } from '../utils/dates'

const sortNewest = (list) => [...list].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))

const round1 = (n) => Math.round(n * 10) / 10

function Change({ value }) {
  if (value == null || value === 0) return <span className="muted">—</span>
  return <span className={value < 0 ? 'delta delta--down' : 'delta delta--up'}>{value > 0 ? '+' : ''}{value} kg</span>
}

export default function WeightPage() {
  const { data, loading, error, reload, setData } = useAsync(() => weightApi.list(), [])
  const today = toISODate()
  const [form, setForm] = useState({ kg: '', date: today })
  const [errors, setErrors] = useState({})
  const [flash, setFlash] = useState('')
  const [actionError, setActionError] = useState('')
  const [busy, setBusy] = useState(false)

  if (loading && !data) return <><PageHeader title="Weight tracking" /><Spinner /></>
  if (error && !data) {
    return <><PageHeader title="Weight tracking" /><Alert onRetry={reload}>{error.message}</Alert></>
  }

  const entries = data
  const latest = entries[0]
  const first = entries[entries.length - 1]
  const lowest = entries.length ? Math.min(...entries.map((e) => e.kg)) : null

  async function run(fn) {
    setBusy(true)
    setActionError('')
    setFlash('')
    try {
      await fn()
    } catch (err) {
      setActionError(err.message)
      setErrors(err.fieldErrors?.weight_kg ? { kg: err.fieldErrors.weight_kg } : err.fieldErrors?.date ? { date: err.fieldErrors.date } : {})
    } finally {
      setBusy(false)
    }
  }

  function submit(e) {
    e.preventDefault()
    const kg = Number(form.kg)
    const found = {}
    if (form.kg === '' || !(kg >= 20 && kg <= 400)) found.kg = 'Enter a weight between 20 and 400 kg.'
    if (!form.date) found.date = 'Pick a date.'
    else if (form.date > today) found.date = "Can't log a future date."
    setErrors(found)
    if (Object.keys(found).length) return

    const replaced = entries.some((x) => x.date === form.date)
    run(async () => {
      const saved = await weightApi.save({ kg: round1(kg), date: form.date })
      setData((list) => sortNewest([saved, ...list.filter((x) => x.date !== saved.date)]))
      setForm({ kg: '', date: today })
      setFlash(replaced ? `Updated your weight for ${formatDate(saved.date)}.` : `Saved ${saved.kg} kg.`)
    })
  }

  function remove(entry) {
    if (!window.confirm(`Delete ${entry.kg} kg on ${formatDate(entry.date)}?`)) return
    run(async () => {
      await weightApi.remove(entry.id)
      setData((list) => list.filter((x) => x.id !== entry.id))
      setFlash(`Deleted ${entry.kg} kg on ${formatDate(entry.date)}.`)
    })
  }

  return (
    <>
      <PageHeader title="Weight tracking" subtitle="One weigh-in per day. Logging the same day again updates it." />

      <div className="stack">
        {flash && <Alert kind="success">{flash}</Alert>}
        {actionError && <Alert>{actionError}</Alert>}

        <div className="stat-grid stat-grid--3">
          <Card className="stat stat--small">
            <div className="stat__label">Current weight</div>
            <div className="stat__value">{latest ? `${latest.kg} kg` : 'Not recorded'}</div>
            {latest && <div className="stat__meta">{formatDate(latest.date)}</div>}
          </Card>
          <Card className="stat stat--small">
            <div className="stat__label">Change since first entry</div>
            <div className="stat__value">{entries.length > 1 ? <Change value={round1(latest.kg - first.kg)} /> : '—'}</div>
            {entries.length > 1 && <div className="stat__meta">Since {formatDate(first.date)}</div>}
          </Card>
          <Card className="stat stat--small">
            <div className="stat__label">Lowest</div>
            <div className="stat__value">{lowest != null ? `${lowest} kg` : '—'}</div>
          </Card>
        </div>

        <div className="two-col">
          <Card title="Record weight">
            <form className="form" onSubmit={submit} noValidate>
              <div className="form-row">
                <Field label="Weight (kg)" htmlFor="kg" error={errors.kg}>
                  <input id="kg" type="number" step="0.1" min="20" max="400" inputMode="decimal" className="input"
                    placeholder="e.g. 72.5" value={form.kg} onChange={(e) => setForm({ ...form, kg: e.target.value })} />
                </Field>
                <Field label="Date" htmlFor="wdate" error={errors.date}>
                  <input id="wdate" type="date" max={today} className="input" value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </Field>
              </div>
              <button type="submit" className="btn btn--primary" style={{ alignSelf: 'flex-start' }} disabled={busy}>
                <Icon name="plus" size={18} /> Save weight
              </button>
            </form>
          </Card>

          <Card title="Trend">
            <WeightChart entries={entries} />
          </Card>
        </div>

        <Card title="History">
          {entries.length === 0 ? (
            <EmptyState>No weigh-ins yet. Record your first one above.</EmptyState>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th>Date</th><th>Weight</th><th>Change</th><th><span className="sr-only">Delete</span></th></tr>
                </thead>
                <tbody>
                  {entries.map((e, i) => {
                    const prev = entries[i + 1]
                    return (
                      <tr key={e.id}>
                        <td>{formatDate(e.date)}</td>
                        <td><strong>{e.kg} kg</strong></td>
                        <td><Change value={prev ? round1(e.kg - prev.kg) : null} /></td>
                        <td>
                          <div className="actions">
                            <button type="button" className="icon-btn icon-btn--danger" aria-label={`Delete ${e.kg} kg on ${formatDate(e.date)}`}
                              onClick={() => remove(e)}>
                              <Icon name="trash" size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </>
  )
}
