import { apiRequest } from './apiClient.js'

export async function getPublicStats() {
  return { itemsReported: 0, itemsRecovered: 0, activeListings: 0, ...(await apiRequest('/stats')) }
}

export async function getAdminStats() {
  return apiRequest('/admin/stats')
}
