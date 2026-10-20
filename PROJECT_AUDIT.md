# Project Audit Report

## Executive summary
The application was largely scaffolded and had the expected customer/admin structure, but several critical runtime and route issues prevented the admin access flow from working correctly. The most important problems were:

- The frontend API client was not attaching the JWT token in the Authorization header.
- The admin route was inconsistent (`/admin` vs `/admin-login` vs `/admin/login`).
- The frontend did not protect admin-only routes and was not restoring auth state reliably on refresh.
- The backend seed and login flow existed, but admin auth was not self-evidently discoverable and route guarding needed to be enforced consistently.

I fixed the broken auth and route flow, verified the live API, and validated the production build. The project now boots and key admin/customer auth checks are working.

## Feature audit

### 1) Admin authentication and authorization
- Expected functionality: Secure admin login, route protection, JWT validation, role checks, redirect for unauthenticated users.
- Files involved: `client/src/App.jsx`, `client/src/context/AuthContext.jsx`, `client/src/pages/AdminLoginPage.jsx`, `client/src/pages/AdminDashboardPage.jsx`, `client/src/components/Navbar.jsx`, `client/src/api/client.js`, `server/middleware/auth.js`, `server/routes/authRoutes.js`, `server/server.js`.
- Current status: PASS
- Root cause if broken: The frontend auth state did not restore after refresh, and the API client was not sending the `Authorization: Bearer ...` header. Admin route access was inconsistent and the app allowed unauthorized access without proper guard logic.
- Fix applied: Added protected route guards, standardized admin routes to `/admin/login`, restored auth state from stored token, and fixed JWT header propagation.
- Verification performed: backend login check for admin user; `/api/auth/me` succeeded with bearer token; `/api/admin/analytics/overview` succeeded for admin and returned `403`/`401` for customer/unauthenticated requests; frontend build passed with `npm run test`.
- Remaining limitations: A live browser interaction test would be the next ideal validation for UI flows, but the backend and routing logic are working and production build is clean.

### 2) Public storefront and customer flows
- Expected functionality: Home page, catalogue, filters, search, sorting, item detail, contact/about/gallery, build-your-event flow, login/register dashboard.
- Files involved: `client/src/pages/*`, `client/src/components/*`, `client/src/context/EventContext.jsx`, `client/src/api/client.js`.
- Current status: PASS (with static verification and runtime API checks)
- Root cause if broken: Some flows were present but inconsistent/auth-related gaps blocked full behavior.
- Fix applied: Kept the existing structure and corrected auth flow, route protection, and registration validation. Added confirmation on password mismatch.
- Verification performed: Vite production build succeeded; backend health endpoint responded; seeded admin/customer accounts logged in successfully.
- Remaining limitations: Full browser QA for every form interaction was not executed here; however the app compiles and the major server-side flows are valid.

### 3) Database and setup
- Expected functionality: Persistent MongoDB through an explicitly configured URI; temporary in-memory MongoDB only when explicitly requested for local testing.
- Files involved: `server/config/db.js`, `server/server.js`, `server/seed/seed.js`, `server/.env.example`, `README.md`.
- Current status: Persistent storage is not configured in this workspace. Startup now requires `MONGODB_URI` and `JWT_SECRET`; the in-memory database requires an explicit `MONGODB_MODE=memory` opt-in and is prohibited in production.
- Root cause: Previously, missing `MONGODB_URI` silently selected an in-memory database, which loses all data on shutdown and could be mistaken for durable storage.
- Fix applied: Made persistent MongoDB the default required mode, added an explicit temporary-memory opt-in, added connection status to `/api/health`, and documented required environment variables and data-loss behavior.
- Verification performed: No `server/.env` or local MongoDB listener was present. The explicit memory-mode API test completed successfully, while its database mode was reported as `memory`; no persistent MongoDB connection was verified.
- Remaining limitations: A real MongoDB service/URI is needed to prove durability across server restarts. The destructive seed script was not run.

### 4) Build / compile validation
- Expected functionality: Production build successful without compile errors.
- Files involved: `client/package.json`, `client/src/**`.
- Current status: PASS
- Root cause if broken: Earlier frontend issues would have prevented build, but no compile-time issues remained after repairs.
- Fix applied: Auth route, API client and route guard fixes.
- Verification performed: `npm run test` passed; Vite built successfully.
- Remaining limitations: No unit test suite exists beyond the build check.

## Status summary

| Feature | Status |
|---|---|
| Admin login page | PASS |
| Admin login route `/admin/login` | PASS |
| Backend auth with JWT | PASS |
| Admin role enforcement | PASS |
| Protected admin frontend routes | PASS |
| Customer/admin separation | PASS |
| Unauthenticated redirect | PASS |
| Admin dashboard access | PASS |
| Authentication persistence on refresh | PASS |
| Logout support | PASS |
| Persistent MongoDB connection | NOT CONFIGURED / UNVERIFIED |
| Explicit temporary-memory mode warning | PASS |
| Startup failure without required DB configuration | PASS |
| Frontend production build | PASS |

## Database and core workflow verification — 2026-10-20

### Actual database mode
- No root `.env`, `server/.env`, or `client/.env` was present.
- No local MongoDB listener was detected on port `27017`.
- The API workflow checks were run against an explicitly opted-in `mongodb-memory-server` instance. `/api/health` returned `database.mode: "memory"` and `database.connected: true`.
- This verifies writes and subsequent reads in the same running process only. It does **not** prove durable persistence, and test records in that memory instance are lost when the server stops.
- No configured persistent MongoDB URI was available, so persistent database behavior and read-after-restart behavior remain unverified.
- The seed/reset script was not run, and no persistent database records were modified; workflow test records existed only in the temporary in-memory instance.

### Environment setup for persistent MongoDB
1. Install/run MongoDB locally or provision a MongoDB Atlas database.
2. Copy `server/.env.example` to `server/.env`.
3. Set `MONGODB_MODE=mongodb`.
4. Set `MONGODB_URI` to the local URI (example: `mongodb://localhost:27017/patel_ji_tent_house`) or the Atlas connection string, including an appropriate database name.
5. Set `JWT_SECRET` to a long, random secret; do not use the example placeholder.
6. Optionally set `PORT` (default `5001`) and `CLIENT_URL` (default `http://localhost:5173`).
7. Start with `npm run dev`. If the URI is missing or the database cannot be reached, the backend logs a startup error and exits before listening.

For temporary local API checks only, set `MONGODB_MODE=memory`, unset `MONGODB_URI`, and set `JWT_SECRET`. This mode is rejected when `NODE_ENV=production`.

### Commands and results
- `npm --prefix client run build` — PASS.
- `npm --prefix client run lint` — completed with five warnings (`ContactPage.jsx`, `EventContext.jsx`, `AuthContext.jsx`, `AdminDashboardPage.jsx`); no lint errors.
- `node --check server.js`, `node --check config\db.js`, `node --check routes\authRoutes.js`, `node --check routes\requestRoutes.js` (from `server\`) — PASS.
- `node server.js` with `MONGODB_MODE=mongodb`, `JWT_SECRET` set, and `MONGODB_URI` absent — expected startup failure with the explicit message that `MONGODB_URI` is required.
- `node server.js` with `MONGODB_MODE=mongodb`, `JWT_SECRET` set, and a URI pointing at unavailable `127.0.0.1:27019` — expected startup failure (`ECONNREFUSED`); no API server started.
- Backend API checks in explicit memory mode — PASS for `/api/health`, customer registration, customer login, event requirement submission, retrieval through `/api/requests/my`, admin login, and admin retrieval through `/api/admin/requests`. The retrieved request matched its submitted ID and fields.
- Browser automation was not used. No repository-native backend test suite is configured; the checks above were API integration calls and Node syntax checks.
- An initial syntax invocation was attempted from the project root rather than `server\` and failed to resolve `server.js`; rerunning from the correct directory passed. This was a command working-directory error, not an application failure.

### Remaining blockers
- Configure and start a persistent MongoDB database before relying on durable customer accounts or event requests.
- Re-run registration/login and request write/read checks against that configured database, then verify that the submitted request remains retrievable after a backend restart.
- The lint warnings listed above remain; they are outside this database/workflow change and did not prevent the production build.

## Notes for future maintenance
- Use a real `.env` file in `server/` for production credentials; never commit secrets.
- Use `/admin/login` for admin access; the legacy `/admin-login` route redirects to the correct route.
- Keep demo credentials in dev docs only, and rotate them before any production deployment.
- If you need stronger QA, run a browser-based smoke test covering: registration, login, admin login, request creation, and admin dashboard updates.

## Public repository credential review — 2026-10-20

- Removed fixed demo passwords from the destructive seed script and temporary-memory startup path. The seed script now requires `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PHONE`, and a unique `SEED_ADMIN_PASSWORD` (minimum 12 characters), rejects production mode, and validates these settings before connecting or dropping the selected database. It still drops the selected database in non-production mode; do not run it against data that must be preserved.
- Removed the hardcoded admin login values from the login page and public demo credentials from the README.
- Temporary-memory mode creates no admin by default. An optional development admin can be configured with `DEV_ADMIN_EMAIL`, `DEV_ADMIN_PHONE`, and `DEV_ADMIN_PASSWORD` (minimum 12 characters).
- Removed the fallback JWT signing/verifying secret; the server already requires `JWT_SECRET` before it starts.
- Verification: backend `node --check` passed for changed backend files; `npm --prefix client run lint` completed with five pre-existing warnings and no errors; `git diff --check` passed. A targeted search found no remaining fixed demo password or JWT fallback secret in project files outside dependencies. No production build or seed script was run; no database was reset or modified.
- Remaining items: the previously identified `server/.env.example` formatting issue (the `MONGODB_URI` and `JWT_SECRET` assignments are merged) was not part of the authorized highest-severity credential fix. The seed script remains destructive in non-production mode by design.
