import { apiRequest } from './apiClient.js'

function queryString(params = {}) {
  const query = new URLSearchParams({ limit: '50' })
  Object.entries(params).forEach(([key, value]) => { if (value !== undefined && value !== null && value !== '') query.set(key, String(value)) })
  return query.toString()
}

export async function getMyProfile() {
  const data = await apiRequest('/users/me')
  return { user: data.user, stats: data.stats }
}

export async function getMyItems(params = {}) {
  const data = await apiRequest('/users/me/items?' + queryString(params))
  return { items: data.items || [], pagination: data.pagination || { page: 1, limit: 50, total: 0, totalPages: 0 } }
}

export async function getMyActivity(params = {}) {
  return (await apiRequest('/users/me/activity?' + queryString(params))).activity || []
}
