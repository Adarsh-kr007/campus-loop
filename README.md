# Campus Loop

Campus Loop is a campus lost-and-found application. Students can report and browse lost or found belongings, submit ownership claims, and follow their listings. Admins can review reports and claims.

## Features

- Report lost and found items with a category, campus location, date, and contact details. Image upload is not available yet; the frontend sends `imageUrl: null`.
- Browse listings with search, type/category/location/date filters, and newest/oldest sorting.
- Submit claims for found items and follow them in the student dashboard.
- Student dashboard with account statistics, recent activity, listings, claims, and listing status actions.
- Admin dashboard with campus statistics, all listings, and claim review/status actions.
- JWT-based registration and login, with student and admin access controls.

## Tech stack

- Frontend: React 18, Vite, React Router, Lucide React, plain CSS.
- Backend: Node.js 20+, Express, MongoDB Atlas, Mongoose, JWT, bcryptjs.

## Architecture

The React frontend calls the REST API through a shared service layer (`src/services`). It reads `VITE_API_URL` at build time. The Express API exposes JSON routes under `/api`, validates and filters request data, authenticates protected operations with JWTs, and stores users, listings, claims, and activity in MongoDB through Mongoose.

Claim rules are enforced by the API: only found items that are active or already claim-pending can receive claims; a user can claim an item once; approving a claim recovers its item and rejects other pending claims; rejecting the final pending claim returns the item to active. Claim decisions, manual item status changes, and item deletions use MongoDB transactions. Atlas supports the replica-set transactions these operations require.

## Screenshots

Add screenshots at these paths when available:

- Home: `docs/screenshots/home.png`
- Browse: `docs/screenshots/browse.png`
- Item details: `docs/screenshots/item-details.png`
- Student dashboard: `docs/screenshots/dashboard.png`
- Admin dashboard: `docs/screenshots/admin.png`

## Local setup

### Prerequisites

- Node.js 20 or newer and npm.
- A MongoDB Atlas database with network access enabled for the machine running the API.
- A JWT secret of at least 32 characters.

### Backend

In a terminal:

```sh
cd server
npm install
```

Copy `server/.env.example` to `server/.env` and replace its placeholders with your own values. Do not commit `.env` files. Configure `MONGODB_URI`, `JWT_SECRET`, and `CLIENT_URL`; `CLIENT_URL` accepts comma-separated exact origins, for example local Vite origins. Set your own admin name, email, student ID, and password before creating the admin account.

```sh
npm run seed
npm start
```

The API listens on `PORT` (5000 by default). Check `GET /api/health` for its health and database connection status. For sample records, configure `SEED_STUDENT_NAME`, `SEED_STUDENT_EMAIL`, `SEED_STUDENT_ID`, and `SEED_STUDENT_PASSWORD`, then run this separately in the server directory:

```sh
npm run seed:sample
```

The sample seed creates 14 listings and four claims, is idempotent, and refuses to run with `NODE_ENV=production`.

### Frontend

In a second terminal at the project root:

```sh
npm install
```

Copy the root `.env.example` to `.env`. For local development it points to `http://localhost:5000/api`; change it if your backend uses another URL. Keep this file local.

```sh
npm run dev
npm run build
```

For API integration tests, keep the backend running and connected to Atlas, and make the seeded admin credentials available to the test process through `server/.env`. By default the tests call `http://127.0.0.1:5000/api`; override this with `API_BASE_URL` if needed. Run in a third terminal:

```sh
cd server
npm run test:api
```

The tests create uniquely named student accounts and remove test listings through the admin API. There is no user-delete endpoint, so those test accounts remain in the database.

## API overview

All routes below are prefixed with `/api`. Protected routes require `Authorization: Bearer <token>`. Admin routes require an admin account.

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/api/health` | Public | API/database health (declared directly in `src/app.js`) |
| POST | `/api/auth/register` | Public | Register a student |
| POST | `/api/auth/login` | Public | Log in |
| GET | `/api/auth/me` | Bearer | Get the current user |
| POST | `/api/auth/logout` | Bearer | Logout notice; client discards the token |
| GET | `/api/stats` | Public | Public listing statistics |
| GET | `/api/items` | Public/optional Bearer | Browse and filter active listings |
| GET | `/api/items/:id` | Public/optional Bearer | Get listing details |
| POST | `/api/items` | Bearer | Create a listing |
| PUT | `/api/items/:id` | Owner/admin | Edit a listing |
| PATCH | `/api/items/:id/status` | Owner/admin | Change listing status |
| DELETE | `/api/items/:id` | Owner/admin | Delete a listing |
| GET | `/api/claims/my` | Bearer | Get the current user's claims |
| POST | `/api/claims` | Bearer | Submit a claim |
| GET | `/api/claims/:id` | Claim owner/admin | Get a claim |
| GET | `/api/claims` | Admin | List claims |
| PATCH | `/api/claims/:id/status` | Admin | Approve or reject a claim |
| GET | `/api/users/me` | Bearer | Get profile and student statistics |
| GET | `/api/users/me/items` | Bearer | List the user's listings |
| GET | `/api/users/me/claims` | Bearer | List the user's claims |
| GET | `/api/users/me/activity` | Bearer | List recent activity |
| GET | `/api/admin/stats` | Admin | Get admin statistics |
| GET | `/api/admin/items` | Admin | List all listings, including closed items |
| GET | `/api/admin/claims` | Admin | List claims for admin review |
| PATCH | `/api/admin/items/:id/status` | Admin | Change any listing's status |
| DELETE | `/api/admin/items/:id` | Admin | Delete any listing |

## Deployment

### Backend on Render

Create a Render Web Service with **Root Directory** `server`, **Build Command** `npm install`, and **Start Command** `npm start`. Set the environment variables from `server/.env.example` in Render's dashboard; do not upload a real `.env` file. Set the health check path to `/api/health`.

Set `CLIENT_URL` to the exact deployed frontend origin (scheme and host, with no trailing path). Multiple exact origins can be comma-separated. Configure MongoDB Atlas network access so the deployed backend can connect to the cluster.

Render's free web services spin down after 15 minutes without traffic and need about one minute to spin back up; allow roughly 30?60 seconds for a first request after idle. See [Render's free instance documentation](https://render.com/docs/free).

### Frontend on Vercel

Deploy the project root as a Vite frontend, with build command `npm run build` and output directory `dist`. Set the build environment variable `VITE_API_URL` to the deployed backend URL ending in `/api`, such as `https://<your-api-host>/api`. The included `vercel.json` rewrites frontend paths to `index.html` so client-side routes can be refreshed directly.

After deployment, set the backend's `CLIENT_URL` to the exact Vercel frontend origin. If the Vercel domain changes, update `CLIENT_URL` as well.

## Known limitations

- Image upload and image hosting are not implemented; item requests currently use `imageUrl: null`.
- Email verification and password reset are not implemented.
- Rate limiting uses an in-memory store per API process.
- Logout is stateless; it does not revoke an issued JWT. The client clears its token.
- A user can submit only one claim per item.
- The admin interface has no demo-data reset action for the live database.
- Render's free service plan may sleep when idle, so it is intended for testing and low-traffic use rather than always-on production traffic.
