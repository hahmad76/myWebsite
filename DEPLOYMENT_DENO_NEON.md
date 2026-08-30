# SCHOOLS SOLUTIONS HUB PAKISTAN — $0 Deployment Plan

This project uses a static frontend plus a Node.js backend. The approved no-card deployment target is:

- Frontend: GitHub Pages
- Backend/API: Deno Deploy Free
- Production database: Neon PostgreSQL Free
- Source: GitHub (`hahmad76/myWebsite`)

## Why this architecture

The backend already targets Node.js 20+ and PostgreSQL through `DATABASE_URL`. Deno supports Node built-ins, `package.json`, npm packages, and Node HTTP servers, so the existing backend can be deployed without a framework rewrite.

## Deno Deploy application settings

Create a new application from the GitHub repository and use:

- Repository: `hahmad76/myWebsite`
- Production branch: `main`
- App directory: `backend`
- Runtime: Dynamic / server
- Entrypoint: `src/server.js`
- Install command: `deno install`
- Build command: leave empty
- Pre-deploy command: leave empty initially; migrations are already applied by backend startup when `DATABASE_URL` is configured.

## Required production environment variables

Set these in Deno Deploy's production environment. Never commit their values to Git.

- `NODE_ENV=production`
- `CORS_ORIGIN=<exact GitHub Pages origin>`
- `ADMIN_USERNAME=<administrator username>`
- `ADMIN_PASSWORD_HASH=<scrypt hash>`
- `DATABASE_URL=<Neon PostgreSQL connection string>`
- `PORT=8000` (only if the platform requires an explicit port; otherwise use its default)

Optional variables may be retained from the existing backend configuration as needed.

## Neon PostgreSQL

Create a free Neon PostgreSQL project and use its pooled/SSL connection string for `DATABASE_URL` when appropriate. Do not commit the connection string.

The backend's production startup applies `backend/data/schema.sql` when PostgreSQL is configured.

## Frontend API URL

The frontend currently defaults to `/api`. After the Deno deployment has a stable HTTPS URL, configure the frontend's `window.SSHP_API_BASE` to:

`https://<deno-app-domain>/api`

This must be placed before `script.js` loads, and `CORS_ORIGIN` must exactly match the GitHub Pages origin.

## Important security rules

- Do not add a credit card to Render/Koyeb merely for this deployment.
- Do not commit `.env` files or database credentials.
- Do not use wildcard `CORS_ORIGIN` in production.
- Keep `ADMIN_PASSWORD_HASH` as a strong scrypt hash.
- Test `/api/health`, login, submissions, admin APIs, quotes/orders and payment-reference flows after deployment.

## Current status

The Deno deployment configuration is isolated on the `deployment/deno-free` branch. The existing production implementation on `main` is not modified by this deployment preparation.
