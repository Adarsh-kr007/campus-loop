import { apiRequest } from './apiClient.js'
import { getSessionToken, removeStoredValue, setStoredValue } from './localStorageService.js'

async function saveSession(data, remember = true) {
  await setStoredValue('session', data.token, remember)
  return data.user
}
export async function login({ remember = true, ...credentials }) {
  return saveSession(await apiRequest('/auth/login', { method: 'POST', body: credentials }), remember)
}
export async function register(details) {
  return saveSession(await apiRequest('/auth/register', { method: 'POST', body: details }))
}
export async function logout() {
  try { await apiRequest('/auth/logout', { method: 'POST' }) } catch { /* Clear the token even if the API is unavailable. */ }
  await removeStoredValue('session')
}
export async function getSession() {
  if (!getSessionToken()) return null
  try { return (await apiRequest('/auth/me')).user || null }
  catch (error) { if (error.status === 401) return null; throw error }
}
