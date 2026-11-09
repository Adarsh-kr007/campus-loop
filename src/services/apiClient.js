import { getSessionToken, removeStoredValue } from './localStorageService.js'

const configuredBase = import.meta.env.VITE_API_URL?.trim()
const API_BASE_URL = (configuredBase || (import.meta.env.DEV ? 'http://localhost:5000/api' : '')).replace(/\/+$/, '')
if (!API_BASE_URL && !import.meta.env.DEV) {
  console.error('[Campus Loop] VITE_API_URL is not set. Configure it before building for production.')
}
let redirectingAfterUnauthorized = false

export async function apiRequest(path, { method = 'GET', body, headers = {} } = {}) {
  if (!API_BASE_URL) throw new Error('Campus Loop API is not configured. Set VITE_API_URL and rebuild the frontend.')
  const requestHeaders = { Accept: 'application/json', ...headers }
  const token = getSessionToken()
  if (token) requestHeaders.Authorization = 'Bearer ' + token
  if (body !== undefined) requestHeaders['Content-Type'] = 'application/json'
  let response
  try {
    response = await fetch(API_BASE_URL + path, { method, headers: requestHeaders, body: body === undefined ? undefined : JSON.stringify(body) })
  } catch {
    throw new Error('Cannot reach the Campus Loop API. Make sure the backend is running at ' + API_BASE_URL + '.')
  }
  let payload = {}
  try { payload = await response.json() } catch { /* Use the standard error below for non-JSON responses. */ }
  if (response.status === 401) {
    await removeStoredValue('session')
    if (!redirectingAfterUnauthorized && window.location.pathname !== '/login') {
      redirectingAfterUnauthorized = true
      window.location.assign('/login')
    }
  }
  if (!response.ok) {
    const error = new Error(payload.message || ('API request failed (' + response.status + ')'))
    error.status = response.status
    error.errors = payload.errors || []
    throw error
  }
  return payload.data ?? {}
}
