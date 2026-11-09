# Campus Loop API

Standalone REST API for Campus Loop. It runs independently from the React/Vite frontend and stores users, listings, claims, and activity in MongoDB Atlas.

## Stack and structure

Node.js ES modules, Express 4, Mongoose 8, JWT, bcryptjs, dotenv, cors, express-validator, Helmet, and express-rate-limit. Tests use Node's built-in test runner and `fetch`.

```text
server/
  scripts/seed.js
  src/
    config/       db.js, env.js
    constants/    index.js
    controllers/  auth, item, claim, user, admin, stats
    middleware/   auth, admin, validation, errors
    models/       User, Item, Claim, Activity
    routes/       auth, items, claims, users, admin, stats
    utils/        response, async, pagination, token, activity, regex
    validators/   auth, items, claims
    app.js
    server.js
  tests/api.test.js
```

## Install and configure

Use Node.js 20 or newer. From the project root:

```sh
cd server
npm install
```

Copy `.env.example` to `.env`, then set `MONGODB_URI` to an Atlas URI that includes the database name and set `JWT_SECRET` to at least 32 random characters. Keep `.env` private. Set `CLIENT_URL` to one or more comma-separated allowed frontend origins. The API does not use credentials in CORS.

For MongoDB Atlas, create a cluster and database user, add the current network address to Atlas Network Access, and copy the connection URI. URL-encode special characters in the database password and include a database name in the URI.

Start the API:

```sh
npm run dev
# or
npm start
```

The API listens on `PORT` (5000 by default). It connects to MongoDB before listening and exits with an error if configuration or connection fails. Check `GET /api/health` for the uptime and database connection state.

## Admin seed

Set `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_STUDENT_ID`, and `ADMIN_PASSWORD` in `server/.env`. The seed command hashes the password and creates or updates the configured admin by email; it is safe to run again.

```sh
npm run seed
```

### Sample data seed

Set `SEED_STUDENT_NAME`, `SEED_STUDENT_EMAIL`, `SEED_STUDENT_ID`, and `SEED_STUDENT_PASSWORD` in `server/.env`. `ADMIN_EMAIL` must identify the admin created by `npm run seed`. The sample seed creates or updates 14 realistic listings and four claims with matching item states. It is idempotent and refuses to run when `NODE_ENV=production`.

```sh
npm run seed:sample
```

Public registration always creates a student. The seed script is the only provided way to assign an admin role.

## Authentication

Register or log in to receive a JWT. Send it on protected requests as:

```http
Authorization: Bearer <token>
```

Logout is stateless: discard the token on the client. A token remains valid until it expires, unless its user is deleted.

## API reference

All responses use `{ "success": true|false, "message": "...", "data": ... }`. Validation errors include `errors: [{ field, message }]`. Lists wrap records and pagination as `{ items|claims, pagination: { page, limit, total, totalPages } }`.

Helmet sets security headers. The API allows only configured CORS origins, caps JSON bodies at 10 KB, validates and whitelists request fields, and never includes password hashes in JSON. General API traffic is limited to 300 requests per IP per 15 minutes; login and registration share a 20 requests per IP per 15 minutes limit. Both limits use the in-memory store and are intended for a single API instance.

### Health, auth, and public stats

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/api/health` | Public | Uptime and MongoDB status |
| POST | `/api/auth/register` | Public | Register student: `{ "name", "email", "studentId", "password" }` |
| POST | `/api/auth/login` | Public | Login: `{ "email", "password" }` |
| GET | `/api/auth/me` | Bearer | Current user |
| POST | `/api/auth/logout` | Bearer | Stateless logout notice |
| GET | `/api/stats` | Public | `{ itemsReported, itemsRecovered, activeListings }` |

Registration returns `201` with `data.user` and `data.token`; login returns `200` with the same shape. Invalid credentials return the same `401` message. A duplicate email or student ID returns `409`.

### Items

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/api/items` | Public; optional Bearer | Browse listings |
| GET | `/api/items/:id` | Public; optional Bearer | Listing details |
| POST | `/api/items` | Bearer | Create a listing |
| PUT | `/api/items/:id` | Owner or admin | Edit listing fields |
| PATCH | `/api/items/:id/status` | Owner or admin | Change listing status |
| DELETE | `/api/items/:id` | Owner or admin | Delete listing |
| GET | `/api/admin/items` | Admin | All listing statuses and contact fields |
| PATCH | `/api/admin/items/:id/status` | Admin | Admin status change |
| DELETE | `/api/admin/items/:id` | Admin | Delete any listing |

Create body example:

```json
{
  "type": "found",
  "title": "Black HP Laptop",
  "description": "Found on a study table near the main reading area.",
  "category": "Electronics",
  "location": "Library",
  "date": "2026-11-05",
  "imageUrl": null,
  "contactName": "Alex Morgan",
  "contactEmail": "alex@example.edu",
  "contactPhone": "+1 555 123 4567"
}
```

Browse query parameters combine: `q`, `type`, `category`, `location`, `status`, `dateRange=7d|30d`, exact `date=YYYY-MM-DD`, `sort=newest|oldest`, `page`, and `limit`. Defaults are active and claim-pending listings, newest first, page 1, 12 per page. Limit is capped at 50. Search is case-insensitive and regex-escaped. Closed listings are excluded from public browse. Anonymous responses omit contact email and phone; authenticated responses include them. Poster data contains only id and name.

Item body fields are validated against the frontend's categories, locations, and statuses. `imageUrl` may be null or an HTTPS URL up to 500 characters; data URLs and uploads are not supported. New reports cannot be dated in the future. Owners may mark an item recovered or closed; admins may also reopen it. Claim-pending status is managed through claims.

### Claims

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/api/claims` | Bearer | Submit claim: `{ "itemId", "claimantName", "claimantEmail", "identifyingDetails", "ownershipReason" }` |
| GET | `/api/claims/my` | Bearer | Current user's claims |
| GET | `/api/claims/:id` | Owner or admin | Claim details |
| GET | `/api/claims` | Admin | All claims, optional `status`, `page`, `limit` |
| PATCH | `/api/claims/:id/status` | Admin | Decide: `{ "status": "approved" }` or `{ "status": "rejected" }` |
| GET | `/api/admin/claims` | Admin | Admin claims list |

Claims are accepted only for active found items, and users cannot claim their own listings. One user may claim an item only once. Submitting a claim changes the listing to `claim_pending`. Approval recovers the item and rejects any other pending claims. Rejection returns the listing to active only when no other pending claims remain. Claim and item changes use MongoDB transactions; Atlas replica-set support is required.

### Student dashboard and admin

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/api/users/me` | Bearer | Profile plus item/claim dashboard statistics |
| GET | `/api/users/me/items` | Bearer | Current user's listings |
| GET | `/api/users/me/claims` | Bearer | Current user's claims |
| GET | `/api/users/me/activity` | Bearer | Recent activity |
| GET | `/api/admin/stats` | Admin | Total listings, found listings, pending claims, recovered items |

All user dashboard queries are scoped to the authenticated user's ID. Admin endpoints require a database user with the admin role.

## Testing

Run the API integration suite with the backend already running and connected to MongoDB Atlas. Set `API_BASE_URL` to the API root (for example, `http://127.0.0.1:5000/api`) and provide the seeded `ADMIN_EMAIL` and `ADMIN_PASSWORD` in the environment or `server/.env`.

```sh
npm run test:api
```

The Node built-in `node:test` suite uses `fetch` against `API_BASE_URL`; it does not start another API process. It registers uniquely named student accounts, exercises auth, role, listing, claim, and statistics behavior, then removes test listings through the admin API. The API has no user-delete endpoint, so the uniquely named test accounts remain.

## Limitations and future frontend mapping

- Logout does not revoke a JWT; the client must discard it and tokens expire according to `JWT_EXPIRES_IN`.
- Images are not uploaded or hosted. `imageUrl` must be null or an HTTPS URL; data URLs are rejected until image hosting is added.
- There is no email verification, password reset, refresh token, or email delivery.
- Rate limits use the default in-memory store and apply per process; multiple server instances need a shared store.
- Claim/item atomic updates require a MongoDB replica set (Atlas supports this).
- Frontend services can later map `getItems` → `GET /api/items`, `getItemById` → `GET /api/items/:id`, `createItem` → `POST /api/items`, `updateItemStatus` → `PATCH /api/items/:id/status`, `createClaim` → `POST /api/claims`, `updateClaimStatus` → `PATCH /api/claims/:id/status`, auth methods → `/api/auth/*`, landing stats → `GET /api/stats`, dashboard data → `/api/users/me/*`, and admin tables → `/api/admin/*`. Send the JWT as `Authorization: Bearer <token>`. No frontend integration has been implemented.
