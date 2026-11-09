const TOKEN_KEY = 'campusloop_token'

export async function getStoredValue(key, fallback = null) {
  if (key !== 'session') return fallback
  const token = getSessionToken()
  return token ? { token } : fallback
}

export async function setStoredValue(key, value, remember = true) {
  if (key !== 'session') return value
  const token = typeof value === 'string' ? value : value?.token
  if (!token) return value
  try {
    const target = remember ? window.localStorage : window.sessionStorage
    const other = remember ? window.sessionStorage : window.localStorage
    target.setItem(TOKEN_KEY, token)
    other.removeItem(TOKEN_KEY)
  } catch { throw new Error('Could not save the session in this browser.') }
  return value
}

export async function removeStoredValue(key) {
  if (key !== 'session') return
  try {
    window.localStorage.removeItem(TOKEN_KEY)
    window.sessionStorage.removeItem(TOKEN_KEY)
    window.localStorage.removeItem('campusloop_session')
  } catch { /* Storage can be unavailable in private browsing. */ }
}

export function getSessionToken() {
  try {
    let token = window.localStorage.getItem(TOKEN_KEY) || window.sessionStorage.getItem(TOKEN_KEY)
    const legacy = window.localStorage.getItem('campusloop_session')
    if (legacy) {
      try { token ||= JSON.parse(legacy)?.token || null } catch { /* Discard malformed legacy session data. */ }
      window.localStorage.removeItem('campusloop_session')
      if (token) window.localStorage.setItem(TOKEN_KEY, token)
    }
    return token
  } catch { return null }
}
