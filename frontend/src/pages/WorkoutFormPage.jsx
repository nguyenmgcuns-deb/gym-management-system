import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { exerciseMap } from '../api/exercises'
import { workoutsApi } from '../api/workouts'
import ExercisePicker from '../components/ExercisePicker'
import { Alert, Card, EmptyState, Field, PageHeader, Spinner } from '../ui'
import Icon from '../ui/Icon'
import { toISODate } from '../utils/dates'
import { compact } from '../utils/validate'

const EMPTY_ENTRY = { exercise: null, sets: '3', reps: '10', weight: '' }

function validateWorkout(form) {
  const name = form.name.trim()
  return compact({
    name: !name ? 'Name is required.' : name.length > 100 ? 'Keep it under 100 characters.' : null,
    date: !form.date ? 'Pick a date.' : null,
    duration:
      form.duration !== '' && !(Number.isInteger(Number(form.duration)) && Number(form.duration) >= 0)
        ? 'Use whole minutes (0 or more).'
        : null,
  })
}

function validateEntry(entry) {
  const whole = (v) => Number.isInteger(Number(v)) && Number(v) > 0
  return compact({
    exercise: entry.exercise ? null : 'Choose an exercise from the list.',
    sets: whole(entry.sets) ? null : 'At least 1.',
    reps: whole(entry.reps) ? null : 'At least 1.',
    weight: entry.weight !== '' && !(Number(entry.weight) >= 0) ? 'Use 0 or more (or leave empty).' : null,
  })
}

const toPayload = (form) => ({
  name: form.name.trim(),
  date: form.date,
  duration: form.duration === '' ? null : Number(form.duration),
})

export default function WorkoutFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [form, setForm] = useState({ name: '', date: toISODate(), duration: '' })
  const [errors, setErrors] = useState({})
  const [saved, setSaved] = useState([]) // exercises already stored on the server (edit mode)
  const [pending, setPending] = useState([]) // exercises added here, saved on submit
  const [entry, setEntry] = useState(EMPTY_ENTRY)
  const [entryErrors, setEntryErrors] = useState({})
  const [loading, setLoading] = useState(isEdit)
  const [loadError, setLoadError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [saving, setSaving] = useState(false)
  const [createdId, setCreatedId] = useState(null) // so a retry doesn't create a second workout

  // Edit mode: load the workout and its exercises
  useEffect(() => {
    if (!isEdit) return
    let cancelled = false
    Promise.all([workoutsApi.get(id), workoutsApi.listExercises(id), exerciseMap()])
      .then(([w, items, byId]) => {
        if (cancelled) return
        setForm({ name: w.name, date: w.date, duration: w.duration ?? '' })
        setSaved(items.map((it) => ({ ...it, exercise: byId[it.exercise_id] })))
        setLoading(false)
      })
      .catch((err) => {
        if (cancelled) return
        setLoadError(err.status === 404 ? 'This workout does not exist.' : err.message)
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id, isEdit])

  const updateForm = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value })
    if (errors[field]) setErrors({ ...errors, [field]: null })
  }
  const updateEntry = (field) => (e) => {
    setEntry({ ...entry, [field]: e.target.value })
    if (entryErrors[field]) setEntryErrors({ ...entryErrors, [field]: null })
  }

  function addEntry() {
    const found = validateEntry(entry)
    setEntryErrors(found)
    if (Object.keys(found).length) return
    setPending([
      ...pending,
      {
        key: `${Date.now()}-${pending.length}`,
        exercise: entry.exercise,
        sets: Number(entry.sets),
        reps: Number(entry.reps),
        weight: entry.weight === '' ? null : Number(entry.weight),
      },
    ])
    // Keep sets/reps/weight for the next exercise; clear the choice
    setEntry({ ...entry, exercise: null })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaveError('')
    const found = validateWorkout(form)
    setErrors(found)
    if (Object.keys(found).length) return

    setSaving(true)
    try {
      let workoutId = isEdit ? Number(id) : createdId
      if (isEdit) {
        await workoutsApi.update(workoutId, toPayload(form))
      } else if (!workoutId) {
        const created = await workoutsApi.create(toPayload(form))
        workoutId = created.id
        setCreatedId(created.id)
      }
      // Save new exercises one by one; drop each from the list once stored
      for (const item of pending) {
        await workoutsApi.addExercise(workoutId, {
          exercise_id: item.exercise.id,
          sets: item.sets,
          reps: item.reps,
          weight: item.weight,
        })
        setPending((list) => list.filter((x) => x.key !== item.key))
      }
      navigate(`/workouts/${workoutId}`, { state: { flash: isEdit ? 'Workout updated.' : 'Workout created.' } })
    } catch (err) {
      setSaveError(err.message)
      setErrors((prev) => ({ ...prev, ...(err.fieldErrors || {}) }))
      setSaving(false)
    }
  }

  if (loading) return <Spinner />
  if (loadError) {
    return (
      <>
        <PageHeader title="Edit workout" />
        <Alert>{loadError}</Alert>
        <p><Link to="/workouts">Back to workouts</Link></p>
      </>
    )
  }

  const rows = [
    ...saved.map((s) => ({ ...s, key: `s${s.id}`, isSaved: true })),
    ...pending.map((p) => ({ ...p, isSaved: false })),
  ]

  return (
    <>
      <PageHeader
        title={isEdit ? 'Edit workout' : 'New workout'}
        subtitle={isEdit ? 'Change the details or add more exercises.' : 'Name it, pick a day, and add exercises.'}
      />

      <form className="stack" onSubmit={handleSubmit} noValidate>
        {saveError && <Alert>{saveError}</Alert>}

        <Card title="Details">
          <div className="form">
            <Field label="Workout name" htmlFor="name" error={errors.name}>
              <input id="name" className="input" placeholder="e.g. Push day" maxLength={100}
                value={form.name} onChange={updateForm('name')} />
            </Field>
            <div className="form-row">
              <Field label="Date" htmlFor="date" error={errors.date}>
                <input id="date" type="date" className="input" value={form.date} onChange={updateForm('date')} />
              </Field>
              <Field label="Duration (minutes)" htmlFor="duration" error={errors.duration} hint="Optional">
                <input id="duration" type="number" min="0" step="1" inputMode="numeric" className="input"
                  value={form.duration} onChange={updateForm('duration')} />
              </Field>
            </div>
          </div>
        </Card>

        <Card title="Exercises">
          <div className="exercise-builder">
            <div>
              <ExercisePicker selectedId={entry.exercise?.id}
                onSelect={(ex) => { setEntry({ ...entry, exercise: ex }); setEntryErrors({ ...entryErrors, exercise: null }) }} />
            </div>
            <div className="form">
              <div className={`selected-ex ${entryErrors.exercise ? 'selected-ex--error' : ''}`}>
                {entry.exercise ? (
                  <><strong>{entry.exercise.name}</strong> <span className="chip">{entry.exercise.muscle_group}</span></>
                ) : (
                  <span className="muted">No exercise selected</span>
                )}
              </div>
              {entryErrors.exercise && <p className="field__error">{entryErrors.exercise}</p>}
              <div className="form-row form-row--3">
                <Field label="Sets" htmlFor="sets" error={entryErrors.sets}>
                  <input id="sets" type="number" min="1" step="1" inputMode="numeric" className="input"
                    value={entry.sets} onChange={updateEntry('sets')} />
                </Field>
                <Field label="Reps" htmlFor="reps" error={entryErrors.reps}>
                  <input id="reps" type="number" min="1" step="1" inputMode="numeric" className="input"
                    value={entry.reps} onChange={updateEntry('reps')} />
                </Field>
                <Field label="Weight (kg)" htmlFor="weight" error={entryErrors.weight} hint="Empty = bodyweight">
                  <input id="weight" type="number" min="0" step="0.5" inputMode="decimal" className="input"
                    value={entry.weight} onChange={updateEntry('weight')} />
                </Field>
              </div>
              <button type="button" className="btn btn--secondary" onClick={addEntry}>
                <Icon name="plus" size={18} /> Add exercise
              </button>
            </div>
          </div>

          <div className="table-wrap" style={{ marginTop: 24 }}>
            {rows.length === 0 ? (
              <EmptyState>No exercises yet. Pick one above and press “Add exercise”.</EmptyState>
            ) : (
              <table className="table">
                <thead>
                  <tr><th>Exercise</th><th>Sets</th><th>Reps</th><th>Weight</th><th><span className="sr-only">Remove</span></th></tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.key}>
                      <td>
                        {r.exercise?.name ?? `Exercise #${r.exercise_id}`}{' '}
                        {!r.isSaved && <span className="chip chip--new">new</span>}
                      </td>
                      <td>{r.sets}</td>
                      <td>{r.reps}</td>
                      <td>{r.weight == null ? 'Bodyweight' : `${r.weight} kg`}</td>
                      <td>
                        {!r.isSaved && (
                          <div className="actions">
                            <button type="button" className="icon-btn icon-btn--danger"
                              aria-label={`Remove ${r.exercise.name}`}
                              onClick={() => setPending(pending.filter((p) => p.key !== r.key))}>
                              <Icon name="trash" size={18} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>

        <div className="row">
          <button type="submit" className="btn btn--primary" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create workout'}
          </button>
          <Link to={isEdit ? `/workouts/${id}` : '/workouts'} className="btn btn--secondary">Cancel</Link>
          {pending.length > 0 && (
            <span className="muted">{pending.length} new exercise{pending.length > 1 ? 's' : ''} will be saved.</span>
          )}
        </div>
      </form>
    </>
  )
}
