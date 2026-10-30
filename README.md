# Patel Ji Tent House

A full-stack local event rental platform for a tent house business. The app includes a public storefront, event-builder workflow, catalog, gallery, contact flow, and a simple customer request dashboard.

## Tech stack

- Frontend: React + Vite + React Router + Tailwind-inspired custom CSS
- Backend: Node.js + Express + MongoDB + Mongoose
- Auth: JWT with role-based customer/admin flows
- Local development: persistent MongoDB by default; temporary in-memory mode is an explicit opt-in

## Local setup

1. Open a terminal in the project root.
2. Run:
   - `npm install`
   - `npm --prefix server install`
3. Configure the backend environment in `server/.env` (copy `server/.env.example`):
   - `MONGODB_MODE=mongodb`
   - `MONGODB_URI=mongodb://localhost:27017/patel_ji_tent_house` for local MongoDB, or your MongoDB Atlas connection string.
   - `JWT_SECRET=` a secret of at least 32 bytes (use a unique, randomly generated value; do not use the example placeholder).
   - `PORT=5001` and `CLIENT_URL=http://localhost:5173` are optional defaults.
4. Start the app:
   - `npm run dev`

The dev script runs the backend and frontend concurrently.

The server requires both `MONGODB_URI` and a `JWT_SECRET` of at least 32 bytes; startup fails with a clear error if configuration is missing or MongoDB cannot be reached. It does not silently fall back to an in-memory database. For explicitly temporary local testing only, set `MONGODB_MODE=memory`, unset `MONGODB_URI`, and keep `NODE_ENV` different from `production`. The health endpoint (`/api/health`) reports only service availability, not database host or name. In-memory data is lost when the server stops and is not persistent storage.

## Development demo data

The optional `npm --prefix server run seed` script is a non-destructive development seeder. It only inserts missing demo categories, items, gallery images, and suppliers; existing matching records are left unchanged. It does not create accounts, requests, quotations, or bookings. The standalone `server/seed/addDemoItems.js` helper is guarded by the same target checks.

To enable it, configure `server/.env` with all of these explicit settings:

- `SEED_ENV=development`
- `SEED_DATABASE_NAME=patel_tent_house_dev`
- `MONGODB_MODE=mongodb`
- `MONGODB_URI=mongodb://127.0.0.1:27017/patel_tent_house_dev`

Both seeders verify the configured URI and connected database host/name. They refuse Atlas, remote hosts, other database names, missing settings, and `NODE_ENV=production`. `NODE_ENV` is an additional safeguard, not proof that a database is safe. Keep seeders pointed only at this local development database; neither has an operation to drop or reset a database. The regular app can use other database settings, but those settings are not permitted for seeders.

No demo account credentials are shipped. Create and manage accounts through the existing account-provisioning process; the seeder does not alter users or authentication data.

In explicitly temporary `MONGODB_MODE=memory` development mode, an admin is created only when all of `DEV_ADMIN_EMAIL`, `DEV_ADMIN_PHONE`, and `DEV_ADMIN_PASSWORD` are configured. Use a unique password of at least 12 characters. No development account is created by default; a customer can register through the normal registration flow.

## Main workflow

- Browse the home page and rental catalog
- Build a custom event requirement from the event builder
- Submit details and view request confirmation
- Use the customer request dashboard to review saved requirements

## Admin analytics and inventory

The admin dashboard includes persisted request and booking trends, category/item demand, cancellation and conversion rates, event-month seasonality, and a short moving-average forecast. The forecast is shown only when the last 12 complete calendar months contain at least six active months and six non-cancelled bookings. It is a planning estimate, not a machine-learning accuracy claim.

Booking value is calculated from persisted confirmed/completed booking amounts; it is not a payment-receipt or cash-collected figure. Inventory shortage indicators compare upcoming request quantities with the read-only verified-capacity snapshot for the selected dates. They do not purchase, reserve, allocate, release, or change stock. Legacy or incomplete inventory remains unverified, and booking confirmation stays blocked until transactional inventory validation is implemented and integration-tested.

## Notes

- The app intentionally does not auto-confirm bookings. It follows the requirement review workflow used by local event businesses.
- A persistent MongoDB service is required for durable customer, event request, and business data.
- The development seeder is restricted to the explicitly configured local `patel_tent_house_dev` database and never drops or resets data.
