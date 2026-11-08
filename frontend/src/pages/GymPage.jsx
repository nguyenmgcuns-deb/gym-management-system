import { useEffect, useState } from 'react'

import { gymApi } from '../api/gym'
import { useAuth } from '../context/AuthContext'
import { useAsync } from '../hooks/useAsync'
import { Alert, Badge, Card, EmptyState, PageHeader, ProgressBar, Spinner } from '../ui'
import Icon from '../ui/Icon'
import { formatDate, formatDuration, formatTime, startOfWeek, toISODate } from '../utils/dates'
import { settingsStore } from '../utils/localRecords'

// Re-render every `ms` so the live timer moves.
function useNow(ms, active) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return
    const t = setInterval(() => setNow(Date.now()), ms)
    return () => clearInterval(t)
  }, [ms, active])
  return now
}

export default function GymPage() {
  const { user } = useAuth()
  const { data: sessions, loading, error, reload, setData } = useAsync(() => gymApi.history(), [])
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState('')
  const [flash, setFlash] = useState('')
  const [target, setTarget] = useState(() => settingsStore.weeklyTarget(user.id))

  const open = (sessions || []).find((s) => !s.check_out)
  const now = useNow(1000, Boolean(open))
  const weekStart = toISODate(startOfWeek())
  const thisWeek = (sessions || []).filter((s) => toISODate(new Date(s.check_in)) >= weekStart).length
  const finished = (sessions || []).filter((s) => s.duration != null)
  const avg = finished.length ? Math.round(finished.reduce((n, s) => n + s.duration, 0) / finished.length) : null

  async function toggle() {
    setBusy(true)
    setActionError('')
    setFlash('')
    try {
      if (open) {
        const closed = await gymApi.checkOut()
        setData((list) => list.map((s) => (s.id === closed.id ? closed : s)))
        setFlash(`Checked out. You trained for ${formatDuration(closed.duration)}.`)
      } else {
        const created = await gymApi.checkIn()
        setData((list) => [created, ...(list || [])])
        setFlash('Checked in. Have a great session!')
      }
    } catch (err) {
      setActionError(err.message)
      reload() // server state may differ (e.g. checked in on another device)
    } finally {
      setBusy(false)
    }
  }

  function changeTarget(n) {
    const next = Math.min(14, Math.max(1, n))
    settingsStore.setWeeklyTarget(user.id, next)
    setTarget(next)
  }

  const elapsed = open ? Math.max(0, Math.floor((now - new Date(open.check_in).getTime()) / 1000)) : 0
  const hh = String(Math.floor(elapsed / 3600)).padStart(2, '0')
  const mm = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0')
  const ss = String(elapsed % 60).padStart(2, '0')

  return (
    <>
      <PageHeader title="Gym sessions" subtitle="Check in when you arrive, check out when you leave." />

      {loading && !sessions ? (
        <Spinner />
      ) : error ? (
        <Alert onRetry={reload}>{error.message}</Alert>
      ) : (
        <div className="stack">
          {flash && <Alert kind="success">{flash}</Alert>}
          {actionError && <Alert>{actionError}</Alert>}

          <div className="two-col">
            <Card className={`checkin ${open ? 'checkin--active' : ''}`}>
              <div className="stat__label">{open ? `Checked in at ${formatTime(open.check_in)}` : 'Not at the gym'}</div>
              <div className="checkin__timer" aria-live="polite">{open ? `${hh}:${mm}:${ss}` : '00:00:00'}</div>
              <button type="button" className={`btn ${open ? 'btn--danger' : 'btn--primary'} checkin__btn`} onClick={toggle} disabled={busy}>
                <Icon name={open ? 'logout' : 'login'} size={20} />
                {busy ? 'Please wait…' : open ? 'Check out' : 'Check in'}
              </button>
            </Card>

            <Card title="This week">
              <div className="stat__value">{thisWeek} / {target} sessions</div>
              <ProgressBar value={thisWeek} max={target} />
              <div className="row" style={{ marginTop: 16 }}>
                <span className="muted">Weekly target</span>
                <span className="spacer" />
                <button type="button" className="icon-btn" aria-label="Lower target" onClick={() => changeTarget(target - 1)}>−</button>
                <strong style={{ minWidth: 24, textAlign: 'center' }}>{target}</strong>
                <button type="button" className="icon-btn" aria-label="Raise target" onClick={() => changeTarget(target + 1)}>+</button>
              </div>
              <p className="muted" style={{ margin: '14px 0 0' }}>
                {sessions.length} total visit{sessions.length === 1 ? '' : 's'}
                {avg != null && <> · average {formatDuration(avg)}</>}
              </p>
            </Card>
          </div>

          <Card title="Visit history">
            {sessions.length === 0 ? (
              <EmptyState>No visits yet. Press “Check in” when you arrive at the gym.</EmptyState>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr><th>Date</th><th>Check in</th><th>Check out</th><th>Duration</th></tr>
                  </thead>
                  <tbody>
                    {sessions.map((s) => (
                      <tr key={s.id}>
                        <td>{formatDate(s.check_in)}</td>
                        <td>{formatTime(s.check_in)}</td>
                        <td>{s.check_out ? formatTime(s.check_out) : <Badge kind="active">In progress</Badge>}</td>
                        <td>{formatDuration(s.duration)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}
    </>
  )
}
