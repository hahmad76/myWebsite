# SCHOOLS SOLUTIONS HUB PAKISTAN — Deployment & Security

## Current deployment architecture

The repository contains a static frontend plus a Node.js backend. GitHub Pages can host the static frontend, but it does **not** run the Node.js backend. The backend therefore requires a separate Node-capable hosting service and a managed PostgreSQL database for full production functionality.

### Frontend

GitHub Pages deployment is configured through `.github/workflows/pages.yml` and publishes the public frontend files from `main`.

GitHub Pages settings:

1. Open the repository `hahmad76/myWebsite`.
2. Open **Settings** → **Pages**.
3. Under **Build and deployment → Source**, select **GitHub Actions**.
4. Save if GitHub asks for confirmation.
5. Pushes to `main` will then deploy the frontend automatically.

### Custom domain

No `CNAME` file is currently present on `main`. Do not treat a custom domain as configured until the domain is deliberately configured in GitHub Pages and at the DNS provider. If `www.schoolssolutions.com` is the intended production domain, configure it in GitHub Pages and create the corresponding DNS record before adding the `CNAME` file.

## Full production requirements

1. Run Node.js 20+ for the backend.
2. Set `DATABASE_URL` to a managed PostgreSQL database in production.
3. Set `CORS_ORIGIN` to the exact production frontend origin. Do not use `*` in production.
4. Set `ADMIN_PASSWORD_HASH` to a strong scrypt password hash. Never commit a plaintext password.
5. Put the API behind HTTPS and a reverse proxy/load balancer.
6. Keep authentication secrets and runtime configuration in the deployment secret manager.
7. Back up the database and audit logs.
8. Restrict administrative access and monitor authentication failures.

## Backend

The backend selects PostgreSQL when `DATABASE_URL` is present and refuses a production startup without a configured SQL client/database. Development can use the JSON storage adapter. Startup applies the relational schema when PostgreSQL is configured.

Build from the repository root:

```bash
docker build -f backend/Dockerfile -t schools-solutions-hub-backend .
```

Run with environment configuration supplied by the deployment platform.

## Frontend/API connection

The frontend uses `window.SSHP_API_BASE || "/api"`. When the API is hosted on a different origin from GitHub Pages, the frontend must be configured with the HTTPS backend URL before production forms can work cross-origin.

Example:

```html
<script>
  window.SSHP_API_BASE = "https://api.example.com/api";
</script>
```

That configuration must be placed before `script.js` loads. The final production API origin must be allowed by `CORS_ORIGIN`.

## Reverse proxy

Terminate TLS at the reverse proxy and forward requests to the backend on port 3000. Preserve the original client IP only through a trusted proxy configuration; do not trust arbitrary public `X-Forwarded-For` headers.

## Authentication and sessions

Administrator login is disabled until `ADMIN_PASSWORD_HASH` is configured. Authentication uses scrypt password verification and cryptographically random bearer session tokens. Session persistence uses the active persistence adapter.

## Database migration

`backend/data/schema.sql` is the relational target schema. `backend/src/migrations.js` provides schema application and JSON-to-SQL migration tooling.

## Notifications

Notifications are persisted through the active database adapter. Email, SMS, WhatsApp or push delivery providers should be connected as separate adapters so provider credentials never enter frontend code.

## Production readiness note

A successful GitHub Pages deployment proves only that the static frontend is published. Full production readiness additionally requires the separately hosted backend, PostgreSQL database, HTTPS, exact CORS configuration, secure administrator credentials, backups and end-to-end testing.
