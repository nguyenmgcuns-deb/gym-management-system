import { useState } from 'react'

import { usersApi } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import { Alert, Card, Field, PageHeader } from '../ui'
import { formatDate } from '../utils/dates'
import { compact, validateRequired } from '../utils/validate'

export default function ProfilePage() {
  const { user, setUser, logout } = useAuth()
  const [form, setForm] = useState({ first_name: user.first_name, last_name: user.last_name })
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState({ saving: false, error: '', success: '' })

  const dirty = form.first_name !== user.first_name || form.last_name !== user.last_name

  const update = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value })
    setStatus((s) => ({ ...s, success: '' }))
    if (errors[field]) setErrors({ ...errors, [field]: null })
  }

  async function save(e) {
    e.preventDefault()
    const found = compact({
      first_name: validateRequired(form.first_name, 'First name'),
      last_name: validateRequired(form.last_name, 'Last name'),
    })
    setErrors(found)
    if (Object.keys(found).length) return

    setStatus({ saving: true, error: '', success: '' })
    try {
      const updated = await usersApi.updateMe({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
      })
      setUser(updated)
      setForm({ first_name: updated.first_name, last_name: updated.last_name })
      setStatus({ saving: false, error: '', success: 'Profile saved.' })
    } catch (err) {
      setErrors(err.fieldErrors || {})
      setStatus({ saving: false, error: err.message, success: '' })
    }
  }

  return (
    <>
      <PageHeader title="My profile" subtitle={`Member since ${formatDate(user.created_at)}`} />

      <div className="two-col">
        <Card title="Personal details">
          <form className="form" onSubmit={save} noValidate>
            <Alert>{status.error}</Alert>
            {status.success && <Alert kind="success">{status.success}</Alert>}
            <div className="form-row">
              <Field label="First name" htmlFor="first_name" error={errors.first_name}>
                <input id="first_name" className="input" maxLength={100} value={form.first_name} onChange={update('first_name')} />
              </Field>
              <Field label="Last name" htmlFor="last_name" error={errors.last_name}>
                <input id="last_name" className="input" maxLength={100} value={form.last_name} onChange={update('last_name')} />
              </Field>
            </div>
            <Field label="Email" htmlFor="email" hint="Email can't be changed.">
              <input id="email" className="input" value={user.email} disabled />
            </Field>
            <div className="row">
              <button type="submit" className="btn btn--primary" disabled={!dirty || status.saving}>
                {status.saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        </Card>

        <Card title="Account">
          <p className="muted" style={{ marginTop: 0 }}>
            You're signed in as <strong>{user.email}</strong>. Water and weight records are saved in this browser.
          </p>
          <button type="button" className="btn btn--danger" onClick={logout}>Log out</button>
        </Card>
      </div>
    </>
  )
}
