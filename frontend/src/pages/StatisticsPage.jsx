import { Link } from 'react-router-dom'

import { gymApi } from '../api/gym'
import { waterApi } from '../api/water'
import { weightApi } from '../api/weight'
import { workoutsApi } from '../api/workouts'
import { useAsync } from '../hooks/useAsync'
import { Alert, Card, EmptyState, PageHeader, Spinner } from '../ui'
import { addDays, formatDate, formatDuration, formatShort, fromISODate, toISODate } from '../utils/dates'
import { gymStats, waterStats, weightStats, workoutStats } from '../utils/stats'

async function loadStats() {
  const since = addDays(fromISODate(toISODate()), -6)
  const [workouts, sessions, water, goal, weights] = await Promise.all([
    workoutsApi.list(),
    gymApi.history(),
    waterApi.list(since),
    waterApi.getGoal(),
    weightApi.list(365),
  ])
  return {
    workouts: workoutStats(workouts),
    gym: gymStats(sessions),
    water: waterStats(water, goal),
    goal,
    weight: weightStats(weights),
  }
}

function Stat({ label, value, meta }) {
  return (
    <div className="mini-stat">
      <div className="mini-stat__label">{label}</div>
      <div className="mini-stat__value">{value}</div>
      {meta && <div className="mini-stat__meta">{meta}</div>}
    </div>
  )
}

export default function StatisticsPage() {
  const { data, loading, error, reload } = useAsync(loadStats, [])

  if (loading && !data) return <><PageHeader title="Statistics" /><Spinner /></>
  if (error && !data) return <><PageHeader title="Statistics" /><Alert onRetry={reload}>{error.message}</Alert></>

  const { workouts, gym, water, goal, weight } = data
  const maxWeek = Math.max(1, ...workouts.weeks.map((w) => w.count))
  const monthDiff = workouts.thisMonth - workouts.lastMonth

  return (
    <>
      <PageHeader title="Statistics" subtitle="Simple totals and averages from your own records." />

      <div className="stack">
        <div className="two-col">
          <Card title="Workouts">
            <div className="mini-stats">
              <Stat label="Completed" value={workouts.total} meta={`${workouts.planned} still planned`} />
              <Stat label="This month" value={workouts.thisMonth}
                meta={monthDiff === 0 ? 'Same as last month' : `${monthDiff > 0 ? '+' : ''}${monthDiff} vs last month`} />
              <Stat label="Average length" value={formatDuration(workouts.avgDuration)} />
            </div>
            <h3 className="sub-title">Completed per week</h3>
            <div className="week week--compact" role="img"
              aria-label={`Completed workouts per week: ${workouts.weeks.map((w) => w.count).join(', ')}`}>
              {workouts.weeks.map((w) => (
                <div key={w.start} className="week__day">
                  <span className="week__value">{w.count || ''}</span>
                  <div className="week__track">
                    <div className="week__bar" style={{ height: `${(w.count / maxWeek) * 100}%` }} />
                  </div>
                  <span className="week__label">{formatShort(w.start)}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Gym visits">
            {gym.visits === 0 ? (
              <EmptyState action={<Link to="/gym" className="btn btn--primary">Go to gym sessions</Link>}>
                No visits yet.
              </EmptyState>
            ) : (
              <div className="mini-stats">
                <Stat label="Total visits" value={gym.visits} />
                <Stat label="Time at the gym" value={formatDuration(gym.totalMinutes)} />
                <Stat label="Average visit" value={formatDuration(gym.avgMinutes)} />
                <Stat label="Longest visit" value={formatDuration(gym.longest)} />
              </div>
            )}
          </Card>
        </div>

        <div className="two-col">
          <Card title="Water · last 7 days">
            <div className="mini-stats">
              <Stat label="Average per day" value={`${(water.avgPerDay ?? 0).toLocaleString()} ml`}
                meta={`Goal ${goal.toLocaleString()} ml`} />
              <Stat label="Days goal reached" value={`${water.daysGoalMet} / ${water.days}`} />
            </div>
          </Card>

          <Card title="Weight">
            {!weight ? (
              <EmptyState action={<Link to="/weight" className="btn btn--primary">Record weight</Link>}>
                No weigh-ins yet.
              </EmptyState>
            ) : (
              <div className="mini-stats">
                <Stat label="Current" value={`${weight.current} kg`} />
                <Stat label="Change" value={`${weight.change > 0 ? '+' : ''}${weight.change} kg`}
                  meta={`since ${formatDate(weight.startDate)}`} />
                <Stat label="Lowest" value={`${weight.lowest} kg`} />
                <Stat label="Highest" value={`${weight.highest} kg`} meta={`${weight.count} weigh-ins`} />
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  )
}
