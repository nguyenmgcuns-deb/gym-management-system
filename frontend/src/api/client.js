// The ONLY place that knows the backend address.
// Set VITE_API_URL in frontend/.env (see .env.example). Falls back to the local backend.
import { storage } from '../utils/storage'

export const API_URL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '')

const TOKEN_KEY = 'gymtracker.token'

export const tokenStore = {
  get: () => storage.get(TOKEN_KEY),
  set: (token) => storage.set(TOKEN_KEY, token),
  clear: () => storage.remove(TOKEN_KEY),
}

// Called when the backend says the token is no longer valid (set by AuthContext).
let onUnauthorized = () => {}
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn
}

export class ApiError extends Error {
  constructor(message, status, fieldErrors = {}) {
    super(message)
    this.status = status
    this.fieldErrors = fieldErrors // { email: "value is not a valid email address", ... }
  }
}

// Turn FastAPI's error body into one readable message + per-field messages.
// "daily_goal_ml" -> "Daily goal ml"
const humanize = (field) => {
  const s = String(field).replace(/_/g, ' ')
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function parseError(status, body) {
  const detail = body?.detail
  if (Array.isArray(detail)) {
    const fieldErrors = {}
    for (const item of detail) {
      const field = item.loc?.[item.loc.length - 1]
      const msg = String(item.msg || 'Invalid value').replace(/^Value error, /, '')
      if (field && !fieldErrors[field]) fieldErrors[field] = msg
    }
    const entries = Object.entries(fieldErrors)
    const message =
      entries.length === 1
        ? `${humanize(entries[0][0])}: ${entries[0][1]}`
        : 'Please check the highlighted fields.'
    return new ApiError(message, status, fieldErrors)
  }
  if (typeof detail === 'string') return new ApiError(detail, status)
  if (status >= 500) return new ApiError('Something went wrong on the server. Please try again in a moment.', status)
  if (status === 403) return new ApiError("You don't have access to this.", status)
  if (status === 404) return new ApiError("This item doesn't exist (anymore).", status)
  return new ApiError(`Request failed (${status}).`, status)
}

/**
 * Call the backend.
 *   api('/api/workouts')                              -> GET
 *   api('/api/workouts', { method: 'POST', body })    -> JSON body
 *   api('/api/auth/login', { auth: false, ... })      -> no token header
 */
export async function api(path, { method = 'GET', body, auth = true } = {}) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const token = tokenStore.get()
  if (auth && token) headers.Authorization = `Bearer ${token}`

  let res
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(`Can't reach the server at ${API_URL}. Is the backend running?`, 0)
  }

  if (res.status === 204) return null
  const data = await res.json().catch(() => null)

  if (!res.ok) {
    if (res.status === 401 && auth) onUnauthorized()
    throw parseError(res.status, data)
  }
  return data
}
