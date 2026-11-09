import 'dotenv/config'
import { after, before, test } from 'node:test'
import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import jwt from 'jsonwebtoken'

const API_BASE_URL = (process.env.API_BASE_URL || `http://127.0.0.1:${process.env.PORT || 5000}/api`).replace(/\/+$/, '')
const runId = `${Date.now().toString(36)}${randomBytes(4).toString('hex')}`
const password = `Test-${randomBytes(18).toString('hex')}`
const users = {}
const itemIds = new Set()
let baselineAdminStats

async function request(path, { token, method = 'GET', body, rawBody, headers = {} } = {}) {
  const requestHeaders = { ...headers }
  if (body !== undefined || rawBody !== undefined) requestHeaders['content-type'] = 'application/json'
  if (token) requestHeaders.authorization = `Bearer ${token}`
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: requestHeaders,
    body: rawBody !== undefined ? rawBody : body === undefined ? undefined : JSON.stringify(body),
  })
  let payload = {}
  try { payload = await response.json() } catch { /* Keep failures visible through status assertions. */ }
  return { response, payload }
}

function registerBody(label, role) {
  const suffix = `${runId}-${label}`
  return {
    name: `API Test ${label}`,
    email: `campus-loop-${suffix}@example.test`,
    studentId: `T${randomBytes(8).toString('hex')}`,
    password,
    ...(role ? { role } : {}),
  }
}

async function registerUser(label, role) {
  const credentials = registerBody(label, role)
  const result = await request('/auth/register', { method: 'POST', body: credentials })
  assert.equal(result.response.status, 201, `registration for ${label}: ${result.payload.message}`)
  assert.equal(result.payload.data.user.role, 'student')
  return { ...credentials, id: result.payload.data.user.id, token: result.payload.data.token }
}

function itemBody(label, overrides = {}) {
  return {
    type: 'found',
    title: `Test ${runId} ${label}`,
    description: `A uniquely described test listing for ${label} in the Campus Loop API checks.`,
    category: 'Electronics',
    location: 'Library',
    date: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
    imageUrl: null,
    contactName: 'API Test Contact',
    contactEmail: `contact-${runId}@example.test`,
    contactPhone: '+1 555 123 4567',
    ...overrides,
  }
}

async function createItem(owner, label, overrides = {}) {
  const result = await request('/items', { method: 'POST', token: owner.token, body: itemBody(label, overrides) })
  assert.equal(result.response.status, 201, `create item ${label}: ${result.payload.message}`)
  const id = result.payload.data.item.id
  itemIds.add(id)
  return result.payload.data.item
}

function claimBody(item, claimant) {
  return {
    itemId: item.id,
    claimantName: claimant.name,
    claimantEmail: claimant.email,
    identifyingDetails: 'There is a distinctive scratch beside the power button and a small blue sticker.',
    ownershipReason: 'I can describe the contents and a unique mark that is not visible in the public listing.',
  }
}

async function createClaim(item, claimant) {
  const result = await request('/claims', { method: 'POST', token: claimant.token, body: claimBody(item, claimant) })
  assert.equal(result.response.status, 201, `create claim: ${result.payload.message}`)
  return result.payload.data.claim
}

async function decideClaim(claim, status) {
  return request(`/claims/${claim.id}/status`, { method: 'PATCH', token: users.admin.token, body: { status } })
}

before(async () => {
  assert.ok(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD, 'ADMIN_EMAIL and ADMIN_PASSWORD must be available in the server environment')
  const adminLogin = await request('/auth/login', { method: 'POST', body: { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD } })
  assert.equal(adminLogin.response.status, 200, `admin login: ${adminLogin.payload.message}`)
  users.admin = { token: adminLogin.payload.data.token, id: adminLogin.payload.data.user.id }
  const stats = await request('/admin/stats', { token: users.admin.token })
  assert.equal(stats.response.status, 200, `admin stats baseline: ${stats.payload.message}`)
  baselineAdminStats = stats.payload.data
})

after(async () => {
  if (!users.admin?.token) return
  for (const id of itemIds) {
    const { response } = await request(`/admin/items/${id}`, { method: 'DELETE', token: users.admin.token })
    assert.ok([200, 404].includes(response.status), `test item cleanup failed for ${id}: ${response.status}`)
  }
})

test('health endpoint reports API and connected database state without secrets', async () => {
  const { response, payload } = await request('/health')
  assert.equal(response.status, 200)
  assert.equal(payload.success, true)
  assert.equal(payload.message, 'OK')
  assert.equal(payload.data.db, 'connected')
  assert.equal(typeof payload.data.uptime, 'number')
  assert.equal(JSON.stringify(payload).includes(process.env.JWT_SECRET), false)
})

test('unknown routes return the JSON error envelope', async () => {
  const { response, payload } = await request('/does-not-exist')
  assert.equal(response.status, 404)
  assert.equal(payload.success, false)
  assert.match(payload.message, /Route not found/)
})

test('malformed JSON is a client error with the standard envelope', async () => {
  const { response, payload } = await request('/auth/login', { method: 'POST', rawBody: '{bad-json' })
  assert.equal(response.status, 400)
  assert.equal(payload.success, false)
})

test('invalid registration returns field validation errors before database writes', async () => {
  const { response, payload } = await request('/auth/register', {
    method: 'POST',
    body: { name: 'A', email: 'bad', studentId: 'x', password: 'tiny', role: 'admin' },
  })
  assert.equal(response.status, 400)
  assert.equal(payload.success, false)
  assert.equal(payload.message, 'Validation failed')
  assert.ok(payload.errors.length >= 4)
})

test('invalid item IDs and invalid filters are rejected as client errors', async () => {
  const badId = await request('/items/not-an-object-id')
  const badFilter = await request('/items?type=unknown')
  assert.equal(badId.response.status, 400)
  assert.equal(badId.payload.success, false)
  assert.equal(badFilter.response.status, 400)
  assert.equal(badFilter.payload.success, false)
})

test('missing, invalid and expired bearer tokens are rejected', async () => {
  const expired = jwt.sign({ id: '507f1f77bcf86cd799439011', exp: Math.floor(Date.now() / 1000) - 1 }, process.env.JWT_SECRET)
  for (const authorization of [undefined, 'Bearer not-a-jwt', `Bearer ${expired}`]) {
    const result = await request('/auth/me', { headers: authorization ? { authorization } : {} })
    assert.equal(result.response.status, 401)
    assert.equal(result.payload.success, false)
  }
})

test('registration succeeds and ignores role=admin in the public request body', async () => {
  users.owner = await registerUser('owner', 'admin')
  assert.ok(users.owner.id)
  assert.ok(users.owner.token)
})

test('duplicate email registration returns 409', async () => {
  const duplicate = { ...registerBody('duplicate'), email: users.owner.email }
  const { response, payload } = await request('/auth/register', { method: 'POST', body: duplicate })
  assert.equal(response.status, 409)
  assert.equal(payload.success, false)
})

test('login succeeds, wrong password is 401, and GET /auth/me returns the current user', async () => {
  const good = await request('/auth/login', { method: 'POST', body: { email: users.owner.email, password } })
  assert.equal(good.response.status, 200)
  assert.equal(good.payload.data.user.id, users.owner.id)
  users.owner.token = good.payload.data.token
  const wrong = await request('/auth/login', { method: 'POST', body: { email: users.owner.email, password: `${password}-wrong` } })
  assert.equal(wrong.response.status, 401)
  const me = await request('/auth/me', { token: users.owner.token })
  assert.equal(me.response.status, 200)
  assert.equal(me.payload.data.user.email, users.owner.email)
  assert.equal(me.payload.data.user.role, 'student')
})

test('student tokens receive 403 from every admin route family', async () => {
  users.claimantA = await registerUser('claimant-a')
  users.claimantB = await registerUser('claimant-b')
  users.outsider = await registerUser('outsider')
  for (const path of ['/admin/stats', '/admin/items', '/admin/claims']) {
    const result = await request(path, { token: users.owner.token })
    assert.equal(result.response.status, 403, `${path} should reject a student token`)
  }
})

test('item create, combined filters, anonymous contact privacy, owner checks, and invalid dates/images', async () => {
  const item = await createItem(users.owner, 'filter-target')
  const query = new URLSearchParams({ q: item.title, type: 'found', category: 'Electronics', location: 'Library', limit: '50' })
  const filtered = await request(`/items?${query}`)
  assert.equal(filtered.response.status, 200)
  assert.ok(filtered.payload.data.items.some((entry) => entry.id === item.id))
  assert.equal(typeof filtered.payload.data.pagination.total, 'number')

  const anonymous = await request(`/items?q=${encodeURIComponent(item.title)}`)
  const publicItem = anonymous.payload.data.items.find((entry) => entry.id === item.id)
  assert.ok(publicItem)
  assert.equal(Object.hasOwn(publicItem, 'contactEmail'), false)
  assert.equal(Object.hasOwn(publicItem, 'contactPhone'), false)

  const edit = await request(`/items/${item.id}`, { method: 'PUT', token: users.outsider.token, body: { title: 'Edited by another student' } })
  const deletion = await request(`/items/${item.id}`, { method: 'DELETE', token: users.outsider.token })
  assert.equal(edit.response.status, 403)
  assert.equal(deletion.response.status, 403)

  const future = await request('/items', { method: 'POST', token: users.owner.token, body: itemBody('future-date', { date: '2999-01-01' }) })
  const dataUrl = await request('/items', { method: 'POST', token: users.owner.token, body: itemBody('data-url', { imageUrl: 'data:image/png;base64,AAAA' }) })
  assert.equal(future.response.status, 400)
  assert.equal(dataUrl.response.status, 400)
})

test('claim rules cover own claims, duplicates, approval, rejection transitions, and repeat decisions', async () => {
  const ownItem = await createItem(users.owner, 'own-claim')
  const own = await request('/claims', { method: 'POST', token: users.owner.token, body: claimBody(ownItem, users.owner) })
  assert.equal(own.response.status, 403)

  const duplicateItem = await createItem(users.owner, 'duplicate-claim')
  const first = await createClaim(duplicateItem, users.claimantA)
  const duplicate = await request('/claims', { method: 'POST', token: users.claimantA.token, body: claimBody(duplicateItem, users.claimantA) })
  assert.equal(duplicate.response.status, 409)

  const approvalItem = await createItem(users.owner, 'approval-two-pending')
  const approvedClaim = await createClaim(approvalItem, users.claimantA)
  const autoRejectedClaim = await createClaim(approvalItem, users.claimantB)
  const approval = await decideClaim(approvedClaim, 'approved')
  assert.equal(approval.response.status, 200)
  const approvalClaims = await request(`/admin/claims?status=pending&limit=50`, { token: users.admin.token })
  assert.equal(approvalClaims.response.status, 200)
  const decidedList = await request(`/claims/${approvedClaim.id}`, { token: users.admin.token })
  const rejectedList = await request(`/claims/${autoRejectedClaim.id}`, { token: users.admin.token })
  assert.equal(decidedList.payload.data.claim.status, 'approved')
  assert.equal(rejectedList.payload.data.claim.status, 'rejected')
  const recovered = await request(`/items/${approvalItem.id}`, { token: users.owner.token })
  assert.equal(recovered.payload.data.item.status, 'recovered')
  const repeatDecision = await decideClaim(approvedClaim, 'rejected')
  assert.equal(repeatDecision.response.status, 409)

  const rejectionItem = await createItem(users.owner, 'reject-two-pending')
  const rejectedFirst = await createClaim(rejectionItem, users.claimantA)
  const rejectedLast = await createClaim(rejectionItem, users.claimantB)
  assert.equal((await decideClaim(rejectedFirst, 'rejected')).response.status, 200)
  let current = await request(`/items/${rejectionItem.id}`, { token: users.owner.token })
  assert.equal(current.payload.data.item.status, 'claim_pending')
  assert.equal((await decideClaim(rejectedLast, 'rejected')).response.status, 200)
  current = await request(`/items/${rejectionItem.id}`, { token: users.owner.token })
  assert.equal(current.payload.data.item.status, 'active')
  assert.equal((await decideClaim(rejectedLast, 'approved')).response.status, 409)
})

test('manual item status changes reject all its pending claims', async () => {
  const item = await createItem(users.owner, 'manual-status')
  const pendingOne = await createClaim(item, users.claimantA)
  const pendingTwo = await createClaim(item, users.claimantB)
  const changed = await request(`/items/${item.id}/status`, { method: 'PATCH', token: users.owner.token, body: { status: 'closed' } })
  assert.equal(changed.response.status, 200)
  assert.equal(changed.payload.data.item.status, 'closed')
  for (const claim of [pendingOne, pendingTwo]) {
    const result = await request(`/claims/${claim.id}`, { token: users.admin.token })
    assert.equal(result.payload.data.claim.status, 'rejected')
  }
})

test('user and admin stats match manually counted API records', async () => {
  const ownItems = await request('/users/me/items?limit=50', { token: users.owner.token })
  assert.equal(ownItems.response.status, 200)
  const ownClaims = await request('/claims/my?limit=50', { token: users.owner.token })
  assert.equal(ownClaims.response.status, 200)
  const profile = await request('/users/me', { token: users.owner.token })
  assert.equal(profile.response.status, 200)
  const items = ownItems.payload.data.items
  const claims = ownClaims.payload.data.claims
  const manuallyCounted = {
    totalItems: items.length,
    lostItems: items.filter((item) => item.type === 'lost').length,
    foundItems: items.filter((item) => item.type === 'found').length,
    pendingClaims: claims.filter((claim) => claim.status === 'pending').length,
    recoveredItems: items.filter((item) => item.status === 'recovered').length,
  }
  assert.deepEqual(profile.payload.data.stats, manuallyCounted)
  assert.equal(items.length, 6)

  const stats = await request('/admin/stats', { token: users.admin.token })
  assert.equal(stats.response.status, 200)
  assert.equal(stats.payload.data.totalReported - baselineAdminStats.totalReported, 6)
  assert.equal(stats.payload.data.totalFound - baselineAdminStats.totalFound, 6)
  assert.equal(stats.payload.data.pendingClaims - baselineAdminStats.pendingClaims, 1)
  assert.equal(stats.payload.data.recoveredItems - baselineAdminStats.recoveredItems, 1)
})
