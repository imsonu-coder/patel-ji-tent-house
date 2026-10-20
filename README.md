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
   - `JWT_SECRET=` a long, random secret (do not use the example placeholder).
   - `PORT=5001` and `CLIENT_URL=http://localhost:5173` are optional defaults.
4. Start the app:
   - `npm run dev`

The dev script runs the backend and frontend concurrently.

The server requires both `MONGODB_URI` and `JWT_SECRET`; startup fails with a clear error if either is missing or MongoDB cannot be reached. It does not silently fall back to an in-memory database. For explicitly temporary local testing only, set `MONGODB_MODE=memory`, unset `MONGODB_URI`, and keep `NODE_ENV` different from `production`. The health endpoint (`/api/health`) reports the connection mode and status. In-memory data is lost when the server stops and is not persistent storage.

## Account provisioning

No demo account credentials are shipped. The admin login page requires credentials to be entered.

The destructive seed script requires `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PHONE`, and a unique `SEED_ADMIN_PASSWORD` of at least 12 characters. Set them in `server/.env` before running `npm --prefix server run seed`. The script drops and recreates the selected database, so do not run it against a database containing data you need or against production.

In explicitly temporary `MONGODB_MODE=memory` development mode, an admin is created only when all of `DEV_ADMIN_EMAIL`, `DEV_ADMIN_PHONE`, and `DEV_ADMIN_PASSWORD` are configured. Use a unique password of at least 12 characters. No development account is created by default; a customer can register through the normal registration flow.

## Main workflow

- Browse the home page and rental catalog
- Build a custom event requirement from the event builder
- Submit details and view request confirmation
- Use the customer request dashboard to review saved requirements

## Notes

- The app intentionally does not auto-confirm bookings. It follows the requirement review workflow used by local event businesses.
- A persistent MongoDB service is required for durable customer, event request, and business data.
- `npm --prefix server run seed` drops and recreates the selected database; do not run it against a database containing data you need to preserve.
