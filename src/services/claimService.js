import { apiRequest } from './apiClient.js'

export async function getClaims(isAdmin = false, params = {}) {
  const query = new URLSearchParams({ limit: '50' })
  Object.entries(params).forEach(([key, value]) => { if (value !== undefined && value !== null && value !== '') query.set(key, String(value)) })
  const data = await apiRequest((isAdmin ? '/admin/claims?' : '/claims/my?') + query.toString())
  return data.items || data.claims || []
}

export async function createClaim(claim) {
  const body = {
    itemId: claim.itemId, claimantName: claim.claimantName, claimantEmail: claim.claimantEmail,
    identifyingDetails: claim.identifyingDetails, ownershipReason: claim.ownershipReason,
  }
  return (await apiRequest('/claims', { method: 'POST', body })).claim
}

export async function updateClaimStatus(id, status) {
  return (await apiRequest('/claims/' + encodeURIComponent(id) + '/status', { method: 'PATCH', body: { status } })).claim
}
