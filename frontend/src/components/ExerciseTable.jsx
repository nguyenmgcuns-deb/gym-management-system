import { volumeOf } from '../utils/workout'

// Read-only list of the exercises recorded in a workout.
export default function ExerciseTable({ items, compact = false }) {
  return (
    <div className="table-wrap">
      <table className={`table ${compact ? 'table--compact' : ''}`}>
        <thead>
          <tr>
            <th>Exercise</th>
            {!compact && <th>Muscle group</th>}
            <th>Sets</th>
            <th>Reps</th>
            <th>Weight</th>
            <th>Volume</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it.id}>
              <td>{it.exercise?.name ?? `Exercise #${it.exercise_id}`}</td>
              {!compact && <td><span className="chip">{it.exercise?.muscle_group ?? '—'}</span></td>}
              <td>{it.sets}</td>
              <td>{it.reps}</td>
              <td>{it.weight == null ? 'Bodyweight' : `${it.weight} kg`}</td>
              <td>{it.weight ? `${volumeOf(it).toLocaleString()} kg` : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
