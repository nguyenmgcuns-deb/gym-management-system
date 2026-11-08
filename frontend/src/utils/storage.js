// localStorage that never throws (private mode, blocked storage, etc.)
export const storage = {
  get(key) {
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, value)
    } catch {
      /* storage unavailable: keep working without persistence */
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(key)
    } catch {
      /* ignore */
    }
  },
  getJSON(key, fallback) {
    const raw = this.get(key)
    if (raw == null) return fallback
    try {
      return JSON.parse(raw)
    } catch {
      return fallback
    }
  },
  setJSON(key, value) {
    this.set(key, JSON.stringify(value))
  },
}
