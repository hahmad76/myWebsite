# SCHOOLS SOLUTIONS HUB PAKISTAN

## Production Website & System Integration Foundation

This repository contains the consolidated public website and the server-side integration foundation for **SCHOOLS SOLUTIONS HUB PAKISTAN**.

## Current status

The repository is on the `main` branch, which is the default branch.

The public frontend includes:
- Unified homepage and navigation
- Online Services & Orders catalog
- Service category filtering
- Service request, quote and order pathways
- Custom service request
- Teacher career-interest pathway
- Private-school recruitment/support pathway
- Education resources and community section
- Education updates/announcements section
- Responsive layouts and mobile navigation
- Accessibility skip link

The repository also contains the Node.js backend integration foundation for:
- Service requests, quotes and orders
- Teacher interests and school requirements
- Community content submissions
- Resources and announcements
- Administrator authentication and authorization
- Administrative dashboard/collection workflows
- Notifications and audit logging
- Request validation and rate limiting
- JSON development persistence
- PostgreSQL production persistence
- Relational schema and JSON-to-SQL migration support

## Production boundary

GitHub Pages can host the static frontend, but it does not execute the Node.js backend. Full production functionality therefore requires a separate HTTPS Node.js backend deployment and a managed PostgreSQL database.

The frontend uses `/api` by default. When the API is hosted on a separate origin, configure `window.SSHP_API_BASE` before `script.js` loads and allow the exact frontend origin through `CORS_ORIGIN`.

Administrator authentication remains disabled until a secure `ADMIN_PASSWORD_HASH` is configured in the backend deployment environment. Secrets must never be committed to the repository.

## GitHub Pages

The workflow in `.github/workflows/pages.yml` deploys the public frontend from `main` using GitHub Actions. Configure the repository's **Settings → Pages → Build and deployment → Source** as **GitHub Actions**.

## Important deployment requirements

Before declaring the system fully production-live:
1. Deploy the backend on Node.js 20+ behind HTTPS.
2. Configure a managed PostgreSQL database using `DATABASE_URL`.
3. Set the exact production frontend origin in `CORS_ORIGIN`.
4. Configure a strong scrypt `ADMIN_PASSWORD_HASH`.
5. Configure the frontend with the real HTTPS API origin when it is hosted separately.
6. Run the automated tests and end-to-end production verification.
7. Configure database backups, monitoring and restricted administrative access.

## Repository documentation

- `index.html` — public website structure
- `styles.css` — responsive website styling
- `script.js` — navigation, filtering and API submission handling
- `admin.html` — administrator console frontend
- `backend/` — Node.js API, authentication, persistence, notifications and migrations
- `DEPLOYMENT.md` — deployment and security requirements
- `.env.example` — non-secret runtime configuration template
- `.github/workflows/pages.yml` — GitHub Pages deployment workflow

## Development rule

The approved implementation is treated as locked. Production verification, bug fixing, QA, security verification and deployment consolidation should improve the existing system without replacing the project or creating artificial Build 101+ stages.
