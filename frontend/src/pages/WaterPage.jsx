import { useState } from 'react'

import { waterApi } from '../api/water'
import { useAsync } from '../hooks/useAsync'
import { Alert, Card, EmptyState, Field, PageHeader, ProgressBar, Spinner } from '../ui'
import Icon from '../ui/Icon'
import { addDays, formatShort, formatTime, formatWeekday, fromISODate, toISODate } from '../utils/dates'
import { waterOn } from '../utils/water'

const QUICK_AMOUNTS = [150, 250, 500, 750]
const HISTORY_DAYS = 7

async function loadWater() {
  // From local midnight 6 days ago, so "last 7 days" means the user's own days
  const since = addDays(fromISODate(toISODate()), -(HISTORY_DAYS - 1))
  const [goal, entries] = await Promise.all([waterApi.getGoal(), waterApi.list(since)])
  return { goal, entries }
}

export default function WaterPage() {
  const { data, loading, error, reload, setData } = useAsync(loadWater, [])
  const [custom, setCustom] = useState('')
  const [customError, setCustomError] = useState('')
  const [goalInput, setGoalInput] = useState('')
  const [goalError, setGoalError] = useState('')
  const [editingGoal, setEditingGoal] = useState(false)
  const [flash, setFlash] = useState('')
  const [actionError, setActionError] = useState('')
  const [busy, setBusy] = useState(false)

  if (loading && !data) return <><PageHeader title="Water tracking" /><Spinner /></>
  if (error && !data) {
    return <><PageHeader title="Water tracking" /><Alert onRetry={reload}>{error.message}</Alert></>
  }

  const { goal, entries } = data
  const today = toISODate()
  const total = waterOn(entries, today)
  const left = Math.max(0, goal - total)
  const todays = entries.filter((e) => toISODate(new Date(e.at)) === today)
  const days = Array.from({ length: HISTORY_DAYS }, (_, i) => toISODate(addDays(fromISODate(today), -i)))

  // Run a server action with one shared busy / error / success handling
  async function run(fn, success) {
    setBusy(true)
    setActionError('')
    setFlash('')
    try {
      await fn()
      if (success) setFlash(success)
    } catch (err) {
      setActionError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const add = (amount) =>
    run(async () => {
      const entry = await waterApi.add(amount)
      setData((d) => ({ ...d, entries: [entry, ...d.entries] }))
    }, `Added ${amount} ml.`)

  const remove = (entry) =>
    run(async () => {
      await waterApi.remove(entry.id)
      setData((d) => ({ ...d, entries: d.entries.filter((e) => e.id !== entry.id) }))
    }, `Removed ${entry.amount} ml.`)

  function addCustom(e) {
    e.preventDefault()
    const n = Number(custom)
    if (!Number.isInteger(n) || n < 1 || n > 5000) {
      setCustomError('Enter a whole number between 1 and 5000 ml.')
      return
    }
    setCustomError('')
    setCustom('')
    add(n)
  }

  function saveGoal(e) {
    e.preventDefault()
    const n = Number(goalInput)
    if (!Number.isInteger(n) || n < 500 || n > 10000) {
      setGoalError('Pick a goal between 500 and 10000 ml.')
      return
    }
    setGoalError('')
    run(async () => {
      const saved = await waterApi.setGoal(n)
      setData((d) => ({ ...d, goal: saved }))
      setEditingGoal(false)
    }, 'Daily goal updated.')
  }

  return (
    <>
      <PageHeader title="Water tracking" subtitle="Stay hydrated through the day." />

      <div className="stack">
        {flash && <Alert kind="success">{flash}</Alert>}
        {actionError && <Alert>{actionError}</Alert>}

        <div className="two-col">
          <Card title="Today">
            <div className="water-today">
              <div className="water-today__amount">
                <Icon name="droplet" size={34} />
                <div>
                  <div className="stat__value">{total.toLocaleString()} ml</div>
                  <div className="stat__meta">
                    {left ? `${left.toLocaleString()} ml to go` : 'Goal reached. Well done!'}
                  </div>
                </div>
              </div>
              <ProgressBar value={total} max={goal} />
              <div className="row">
                <span className="muted">{Math.round((total / goal) * 100)}% of {goal.toLocaleString()} ml</span>
                <span className="spacer" />
                {!editingGoal && (
                  <button type="button" className="link-btn"
                    onClick={() => { setGoalInput(String(goal)); setEditingGoal(true) }}>
                    Change goal
                  </button>
                )}
              </div>
              {editingGoal && (
                <form className="row" onSubmit={saveGoal} noValidate>
                  <Field label="Daily goal (ml)" htmlFor="goal" error={goalError}>
                    <input id="goal" type="number" min="500" step="50" className="input" value={goalInput}
                      onChange={(e) => setGoalInput(e.target.value)} />
                  </Field>
                  <button type="submit" className="btn btn--primary btn--sm" style={{ alignSelf: 'flex-end' }} disabled={busy}>Save goal</button>
                  <button type="button" className="btn btn--secondary btn--sm" style={{ alignSelf: 'flex-end' }}
                    onClick={() => { setEditingGoal(false); setGoalError('') }}>Cancel</button>
                </form>
              )}
            </div>
          </Card>

          <Card title="Add water">
            <div className="quick-add">
              {QUICK_AMOUNTS.map((a) => (
                <button key={a} type="button" className="quick-add__btn" onClick={() => add(a)} disabled={busy}>
                  <Icon name="plus" size={16} /> {a} ml
                </button>
              ))}
            </div>
            <form className="row" style={{ marginTop: 18, alignItems: 'flex-start' }} onSubmit={addCustom} noValidate>
              <div style={{ flex: 1, minWidth: 160 }}>
                <Field label="Custom amount (ml)" htmlFor="custom" error={customError}>
                  <input id="custom" type="number" min="1" step="1" inputMode="numeric" className="input"
                    placeholder="e.g. 330" value={custom} onChange={(e) => setCustom(e.target.value)} />
                </Field>
              </div>
              <button type="submit" className="btn btn--primary" style={{ marginTop: 27 }} disabled={busy}>Add</button>
            </form>
          </Card>
        </div>

        <div className="two-col">
          <Card title="Today's log">
            {todays.length === 0 ? (
              <EmptyState>Nothing logged yet today.</EmptyState>
            ) : (
              <ul className="log">
                {todays.map((e) => (
                  <li key={e.id}>
                    <span className="log__time">{formatTime(e.at)}</span>
                    <strong>{e.amount} ml</strong>
                    <button type="button" className="icon-btn icon-btn--danger" disabled={busy}
                      aria-label={`Remove ${e.amount} ml at ${formatTime(e.at)}`} onClick={() => remove(e)}>
                      <Icon name="trash" size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Last 7 days">
            <ul className="day-bars">
              {days.map((d) => {
                const amount = waterOn(entries, d)
                const pct = Math.min(100, Math.round((amount / goal) * 100))
                return (
                  <li key={d}>
                    <span className="day-bars__label">{d === today ? 'Today' : `${formatWeekday(d)} ${formatShort(d)}`}</span>
                    <span className="day-bars__track"><span className={`day-bars__fill ${pct >= 100 ? 'day-bars__fill--done' : ''}`} style={{ width: `${pct}%` }} /></span>
                    <span className="day-bars__value">{amount.toLocaleString()} ml</span>
                  </li>
                )
              })}
            </ul>
          </Card>
        </div>
      </div>
    </>
  )
}
