// Client-side checks so users get instant feedback before we call the API.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateEmail(email) {
  if (!email.trim()) return 'Email is required.'
  if (!EMAIL_RE.test(email.trim())) return 'Enter a valid email address.'
  return null
}

export function validateRequired(value, label) {
  return String(value ?? '').trim() ? null : `${label} is required.`
}

// Drop empty entries so `Object.keys(errors).length` tells us if the form is valid.
export function compact(errors) {
  return Object.fromEntries(Object.entries(errors).filter(([, v]) => v))
}
