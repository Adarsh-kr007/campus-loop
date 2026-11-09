import { apiRequest } from './apiClient.js'

function toQuery(params = {}) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query.set(key, String(value))
  })
  if (!query.has('limit')) query.set('limit', '50')
  return query.toString()
}

export async function getItemPage(params = {}) {
  const data = await apiRequest('/items?' + toQuery(params))
  return { items: data.items || [], pagination: data.pagination || { page: 1, limit: 50, total: 0, totalPages: 0 } }
}

export async function getItems(params = {}) {
  return (await getItemPage(params)).items
}

export async function getAdminItemPage(params = {}) {
  const data = await apiRequest('/admin/items?' + toQuery(params))
  return { items: data.items || [], pagination: data.pagination || { page: 1, limit: 50, total: 0, totalPages: 0 } }
}

export async function getItemById(id) {
  try { return (await apiRequest('/items/' + encodeURIComponent(id))).item || null }
  catch (error) { if (error.status === 404) return null; throw error }
}

export async function createItem(item) {
  const body = {
    type: item.type, title: item.title, description: item.description, category: item.category,
    location: item.location, date: item.date, imageUrl: null,
    contactName: item.contactName, contactEmail: item.contactEmail, contactPhone: item.contactPhone || undefined,
  }
  return (await apiRequest('/items', { method: 'POST', body })).item
}

export async function updateItem(id, item) {
  const body = {}
  ;['title', 'description', 'category', 'location', 'date', 'contactName', 'contactEmail', 'contactPhone'].forEach((key) => {
    if (item[key] !== undefined) body[key] = item[key]
  })
  body.imageUrl = null
  return (await apiRequest('/items/' + encodeURIComponent(id), { method: 'PUT', body })).item
}

export async function updateItemStatus(id, status) {
  return (await apiRequest('/items/' + encodeURIComponent(id) + '/status', { method: 'PATCH', body: { status } })).item
}

export async function updateAdminItemStatus(id, status) {
  return (await apiRequest('/admin/items/' + encodeURIComponent(id) + '/status', { method: 'PATCH', body: { status } })).item
}

export async function deleteItem(id) {
  return apiRequest('/items/' + encodeURIComponent(id), { method: 'DELETE' })
}
