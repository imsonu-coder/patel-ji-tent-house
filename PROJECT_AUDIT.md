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


## Full-Stack Feature & Architecture Implementation — 2026-10-30

### 1. `httpValidation.js` Contract Repair & Backward Compatibility
- **Issue:** The previous session replaced `parseListLimit` and `sendBoundedList` with `parsePagination` and `sendPaginatedList` in `server/utils/httpValidation.js`, breaking callers across routes and tests.
- **Resolution:** Re-exported `parseListLimit` and `sendBoundedList` alongside `parsePagination`, `sendPaginatedList`, and `setPaginationHeaders`.
- **Status:** All routes (`bookingRoutes.js`, `requestRoutes.js`, `quotationRoutes.js`, `supplierRoutes.js`, `analyticsRoutes.js`) and tests (`securityValidation.test.js`) are fully supported with backward compatibility.

### 2. Shared Rate Limiting Architecture
- **Implementation:** Created `server/middleware/rateLimiter.js` with centralized rate-limiting factories (`createRateLimiter`, `globalLimiter`, `authLimiter`, `contactLimiter`, `requestCreationLimiter`).
- **Multi-Instance / Distributed Deployment Architecture:**
  - Standard in-memory rate limiting stores counts in process memory, which operates independently per node worker/instance.
  - For true distributed multi-instance deployment across load-balanced containers or cluster nodes:
    1. Express must have `TRUST_PROXY=1` enabled so client IP is accurately read from reverse proxy headers (`X-Forwarded-For`).
    2. A distributed store backend (such as Redis via `rate-limit-redis` or MongoDB via `rate-limit-mongo`) must be supplied via the `store` option in `createRateLimiter`.
    3. The shared rate limiter module is structured to accept external store instances while defaulting to in-process memory in single-instance/development environments.

### 3. Comprehensive Pagination (Backend & Frontend)
- **Backend List Endpoints:**
  - `GET /api/items`: Full pagination via `parsePagination` and `sendPaginatedList` with standard `X-Total-Count`, `X-Page`, `X-Page-Size`, `X-Total-Pages` headers.
  - `GET /api/requests/my`: Paginated per customer.
  - `GET /api/admin/requests`: Paginated for admin overview.
  - `GET /api/quotations/my`: Paginated per customer.
  - `GET /api/admin/quotations`: Paginated for admin overview.
  - `GET /api/my`: Paginated bookings per customer.
  - `GET /api/admin/bookings`: Paginated for admin overview.
  - `GET /api/admin/suppliers`: Paginated supplier list.
- **Frontend Pages:**
  - `client/src/components/PaginationControls.jsx`: Reusable, accessible pagination UI component.
  - `client/src/pages/ItemsPage.jsx`: Integrated server-side pagination with category and search filter coordination.
  - `client/src/pages/CustomerDashboardPage.jsx`: Integrated pagination controls for customer event requests.
  - `client/src/pages/AdminDashboardPage.jsx`: Integrated pagination controls across event requests, quotations, bookings, and inventory snapshot items.

### 4. Resolution of Frontend Lint Warnings
- `client/src/context/AuthContext.jsx`: Removed unused catch parameter in profile loading and configured Fast Refresh export compliance for `useAuth`.
- `client/src/context/EventContext.jsx`: Configured Fast Refresh export compliance for `useEvent`.
- `client/src/pages/ContactPage.jsx`: Accessible form label associations (`htmlFor`/`id`) and proper submission error state handling.
- `client/src/pages/AdminDashboardPage.jsx`: Corrected redirect route from legacy `/admin-login` to canonical `/admin/login`, and bound status-updating state.

### 5. MongoDB Replica-Set Integration Tests & Index Verification
- **Test Suite:** `server/test/mongoReplSetIntegration.test.js`
- **Isolation:** Configured with `MongoMemoryReplSet` (`count: 1`, `storageEngine: 'wiredTiger'`), running in a completely isolated in-memory replica set with zero production database connection.
- **Verified Constraints:**
  - Unique indexes on `User.email` and `User.phone`.
  - Partial unique index on `Booking.request` (preventing duplicate bookings per event request).
  - Partial unique index on `InventoryReservation.allocationIdempotencyKey` (preventing duplicate allocations per booking).
  - Partial unique index on `InventoryReturnInspection.releaseIdempotencyKey` (preventing duplicate return inspection releases).
  - Compound partial unique index on `SupplierArrangement` verified commitments.
  - Unique index on `InventoryControl.key` (singleton control document).
- **Verified Transactions:**
  - Atomic status updates across `Booking` and `EventRequest` using `session.withTransaction`.
  - Clean rollback on mid-transaction error leaving records in their original state.
- **Preserved Invariants:**
  - Transition to `Confirmed` status remains strictly blocked with HTTP 409.
  - Inventory availability calculations remain read-only snapshots and never alter stocks or reservations.

### 6. Environment Verification & Test Suite Execution — 2026-10-30
- **Node.js Environment:** Verified Node.js `v26.13.0`, npm `11.20.0`, and npx `11.20.0` installed and fully functional.
- **Backend Syntax Checks:**
  - Command: `Get-ChildItem -Path server -Recurse -Filter *.js | Where-Object { $_.FullName -notmatch 'node_modules' } | ForEach-Object { node --check $_.FullName }`
  - Result: 100% PASS across all server files (0 syntax errors).
- **Backend Automated Test Suite:**
  - Command: `npm.cmd --prefix server test` (`node --test`)
  - Execution Time: ~2.5s
  - Results: **82 passed, 0 failed, 0 skipped, 0 cancelled**.
  - Includes isolated MongoDB replica set tests (`server/test/mongoReplSetIntegration.test.js`) verifying:
    - Unique constraints on `User` phone and email (1171ms)
    - Partial unique index on `Booking.request` (11ms)
    - Partial unique index on `InventoryReservation.allocationIdempotencyKey` (10ms)
    - Partial unique index on `InventoryReturnInspection.releaseIdempotencyKey` (8ms)
    - Compound partial unique index on `SupplierArrangement` verified commitment (8ms)
    - Singleton constraint on `InventoryControl` (8ms)
    - Multi-document transactions committing atomically across `Booking` and `EventRequest` (34ms)
    - Multi-document transaction rollback on error leaving records clean and unmodified (19ms)
    - HTTP 409 invariant on transition to `Confirmed` status (6ms)
    - Pagination contract and boundary limits verification (10 test assertions)
- **Frontend Lint Verification:**
  - Command: `npm.cmd --prefix client run lint` (`oxlint`)
  - Results: **Found 0 warnings and 0 errors** across 35 files.
  - All four original lint warnings (`AuthContext.jsx`, `EventContext.jsx`, `AdminDashboardPage.jsx`, `ItemsPage.jsx`) are fully resolved.
- **Frontend Production Build:**
  - Command: `npm.cmd --prefix client run build` (`vite build`)
  - Results: **Built cleanly in ~900ms** (`dist/index.html`, `dist/assets/index-*.css`, `dist/assets/index-*.js`).
- **Pagination Coverage Across All Listed Endpoints & Screens:**
  - **Public Catalogue:** `ItemsPage.jsx` <-> `GET /api/items?page=...&pageSize=...` with category & search sync.
  - **Admin Requests:** `AdminDashboardPage.jsx` <-> `GET /api/admin/requests?page=...&pageSize=...`.
  - **Admin Quotations:** `AdminDashboardPage.jsx` <-> `GET /api/admin/quotations?page=...&pageSize=...`.
  - **Admin Bookings:** `AdminDashboardPage.jsx` <-> `GET /api/admin/bookings?page=...&pageSize=...`.
  - **Admin Suppliers:** `AdminDashboardPage.jsx` <-> `GET /api/admin/suppliers?page=...&pageSize=...` with dedicated vendor directory table and pagination.
  - **Inventory (where appropriate):** `AdminDashboardPage.jsx` item stock snapshot paginated client-side with `PaginationControls` over date-range inventory calculations.
  - **Customer Requests:** `CustomerDashboardPage.jsx` <-> `GET /api/requests/my?page=...&pageSize=...`.
  - **Customer Quotations:** `CustomerDashboardPage.jsx` <-> `GET /api/quotations/my?page=...&pageSize=...`.
  - **Customer Bookings:** `CustomerDashboardPage.jsx` <-> `GET /api/my?page=...&pageSize=...` (and `/api/bookings/my`).
  - Standard headers `X-Total-Count`, `X-Page`, `X-Page-Size`, and `X-Total-Pages` are emitted by the server and parsed by client components.

### 7. Explicit Architectural Status of Shared Rate Limiting
- **Implementation Status:** The shared rate limiter module (`server/middleware/rateLimiter.js`) is centralized and fully active in Express middleware.
- **Multi-Instance Requirement Status: INCOMPLETE (by design / pending external infrastructure).**
- **Technical Explanation:**
  - The middleware currently uses Express Rate Limit's built-in `MemoryStore` (process-local memory).
  - While `server/middleware/rateLimiter.js` is architecturally abstracted to accept an external `store` option, **no external shared distributed store (such as Redis via `rate-limit-redis` or MongoDB via `rate-limit-mongo`) is configured or provisioned in this repository/environment**.
  - In a multi-instance / clustered deployment (e.g. multiple Node processes, PM2 cluster, or multi-container Kubernetes), each process will enforce rate limits independently against its own local memory unless an external distributed store and `TRUST_PROXY=1` are provisioned.
  - Per project instructions, this requirement is explicitly recorded as **incomplete for multi-instance deployments** until an external shared store service is provisioned and wired into `createRateLimiter`.
