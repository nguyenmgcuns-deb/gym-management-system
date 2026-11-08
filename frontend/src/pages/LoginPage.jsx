import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'
import AuthLayout from '../layouts/AuthLayout'
import { Alert, Field, Spinner } from '../ui'
import { compact, validateEmail, validateRequired } from '../utils/validate'

export default function LoginPage() {
  const { login, status } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const registeredEmail = location.state?.registeredEmail
  const redirectTo = location.state?.from || '/'

  const [form, setForm] = useState({ email: registeredEmail || '', password: '' })
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (status === 'authenticated') return <Navigate to={redirectTo} replace />
  if (status === 'loading') return <Spinner label="Checking your session…" />

  const update = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value })
    if (errors[field]) setErrors({ ...errors, [field]: null })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setApiError('')
    const found = compact({
      email: validateEmail(form.email),
      password: validateRequired(form.password, 'Password'),
    })
    setErrors(found)
    if (Object.keys(found).length) return

    setSubmitting(true)
    try {
      await login(form.email.trim(), form.password)
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setApiError(err.message)
      setErrors(err.fieldErrors || {})
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      <h1>Welcome back</h1>
      <p className="page-header__sub">Log in to see your activity.</p>

      <form className="form" onSubmit={handleSubmit} noValidate>
        {registeredEmail && !apiError && (
          <Alert kind="success">Account created. Log in to get started.</Alert>
        )}
        <Alert>{apiError}</Alert>

        <Field label="Email" htmlFor="email" error={errors.email}>
          <input id="email" type="email" className="input" autoComplete="email"
            value={form.email} onChange={update('email')} />
        </Field>

        <Field label="Password" htmlFor="password" error={errors.password}>
          <input id="password" type="password" className="input" autoComplete="current-password"
            autoFocus={Boolean(registeredEmail)}
            value={form.password} onChange={update('password')} />
        </Field>

        <button type="submit" className="btn btn--primary btn--block" disabled={submitting}>
          {submitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>

      <p className="auth__switch">
        New here? <Link to="/register">Create an account</Link>
      </p>
    </AuthLayout>
  )
}
