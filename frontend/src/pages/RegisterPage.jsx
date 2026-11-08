import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { authApi } from '../api/auth'
import AuthLayout from '../layouts/AuthLayout'
import { Alert, Field } from '../ui'
import { compact, validateEmail, validateRequired } from '../utils/validate'

const EMPTY = { first_name: '', last_name: '', email: '', password: '', confirm: '' }

function validate(form) {
  return compact({
    first_name: validateRequired(form.first_name, 'First name'),
    last_name: validateRequired(form.last_name, 'Last name'),
    email: validateEmail(form.email),
    password:
      form.password.length < 8 ? 'Password must be at least 8 characters.' : null,
    confirm: form.confirm !== form.password ? 'Passwords do not match.' : null,
  })
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const update = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value })
    if (errors[field]) setErrors({ ...errors, [field]: null })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setApiError('')
    const found = validate(form)
    setErrors(found)
    if (Object.keys(found).length) return

    setSubmitting(true)
    try {
      await authApi.register({
        email: form.email.trim(),
        password: form.password,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
      })
      navigate('/login', { state: { registeredEmail: form.email.trim() } })
    } catch (err) {
      setApiError(err.message)
      setErrors(err.fieldErrors || {})
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      <h1>Create your account</h1>
      <p className="page-header__sub">Start tracking your training in a minute.</p>

      <form className="form" onSubmit={handleSubmit} noValidate>
        <Alert>{apiError}</Alert>

        <div className="form-row">
          <Field label="First name" htmlFor="first_name" error={errors.first_name}>
            <input id="first_name" className="input" autoComplete="given-name"
              value={form.first_name} onChange={update('first_name')} />
          </Field>
          <Field label="Last name" htmlFor="last_name" error={errors.last_name}>
            <input id="last_name" className="input" autoComplete="family-name"
              value={form.last_name} onChange={update('last_name')} />
          </Field>
        </div>

        <Field label="Email" htmlFor="email" error={errors.email}>
          <input id="email" type="email" className="input" autoComplete="email"
            value={form.email} onChange={update('email')} />
        </Field>

        <Field label="Password" htmlFor="password" error={errors.password} hint="At least 8 characters.">
          <input id="password" type="password" className="input" autoComplete="new-password"
            value={form.password} onChange={update('password')} />
        </Field>

        <Field label="Confirm password" htmlFor="confirm" error={errors.confirm}>
          <input id="confirm" type="password" className="input" autoComplete="new-password"
            value={form.confirm} onChange={update('confirm')} />
        </Field>

        <button className="btn btn--primary btn--block" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="auth__switch">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </AuthLayout>
  )
}
