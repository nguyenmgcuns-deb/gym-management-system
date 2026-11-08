import { formatShort } from '../utils/dates'

// Simple SVG line chart of body weight over time (oldest -> newest).
const W = 640
const H = 240
const PAD = { top: 20, right: 24, bottom: 36, left: 48 }

export default function WeightChart({ entries }) {
  const points = [...entries].sort((a, b) => (a.date < b.date ? -1 : 1)).slice(-30)
  if (points.length < 2) {
    return <p className="muted" style={{ margin: 0 }}>Add at least two weigh-ins to see your trend.</p>
  }

  const values = points.map((p) => p.kg)
  const min = Math.floor(Math.min(...values) - 1)
  const max = Math.ceil(Math.max(...values) + 1)
  const x = (i) => PAD.left + (i * (W - PAD.left - PAD.right)) / (points.length - 1)
  const y = (v) => PAD.top + ((max - v) * (H - PAD.top - PAD.bottom)) / (max - min)
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.kg).toFixed(1)}`).join(' ')
  const area = `${line} L${x(points.length - 1).toFixed(1)},${H - PAD.bottom} L${x(0).toFixed(1)},${H - PAD.bottom} Z`
  const ticks = [min, (min + max) / 2, max]
  const labelEvery = Math.ceil(points.length / 6)

  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img"
      aria-label={`Weight from ${points[0].kg} kg to ${points[points.length - 1].kg} kg`}>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} className="chart__grid" />
          <text x={PAD.left - 8} y={y(t) + 4} textAnchor="end" className="chart__label">{Number(t.toFixed(1))}</text>
        </g>
      ))}
      <path d={area} className="chart__area" />
      <path d={line} className="chart__line" />
      {points.map((p, i) => (
        <g key={p.id}>
          <circle cx={x(i)} cy={y(p.kg)} r="4" className="chart__dot">
            <title>{`${formatShort(p.date)}: ${p.kg} kg`}</title>
          </circle>
          {(i % labelEvery === 0 || i === points.length - 1) && (
            <text x={x(i)} y={H - 10} textAnchor="middle" className="chart__label">{formatShort(p.date)}</text>
          )}
        </g>
      ))}
    </svg>
  )
}
