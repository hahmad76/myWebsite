# SCHOOLS SOLUTIONS HUB PAKISTAN — Deployment & Security

## Current implementation

The repository now contains a frontend-to-API integration layer and a Node.js backend foundation.
The backend supports public form submissions, quote requests, service orders, administrator authentication,
administrative collection access, notifications, audit records, rate limiting and security response headers.

## Production requirements

1. Run Node.js 20+.
2. Set `CORS_ORIGIN` to the exact production frontend origin. Do not use `*` in production.
3. Set `ADMIN_PASSWORD_HASH` to a strong scrypt password hash. Never commit a plaintext password.
4. Put the API behind HTTPS and a reverse proxy/load balancer.
5. Persist `/app/data` outside the container when the JSON adapter is used.
6. Replace the JSON adapter with the relational schema in `backend/data/schema.sql` before high-volume production use.
7. Keep authentication secrets and runtime configuration in the deployment secret manager.
8. Back up the database/storage and audit logs.
9. Restrict administrative access and monitor authentication failures.

## Docker

Build from the repository root:

```bash
docker build -f backend/Dockerfile -t schools-solutions-hub-backend .
```

Run with a persistent data volume and environment configuration supplied by the deployment platform.

## Reverse proxy

Terminate TLS at the reverse proxy and forward requests to the backend on port 3000. Preserve the
original client IP only through a trusted proxy configuration; do not trust arbitrary public
`X-Forwarded-For` headers.

## Authentication

Admin login is disabled until `ADMIN_PASSWORD_HASH` is configured. The current session implementation
uses signed-random bearer tokens held in process memory. For multi-instance production deployment,
move sessions to a shared durable session store before enabling multiple backend replicas.

## Database migration path

The current adapter is intentionally dependency-free for the implementation/testing foundation.
`backend/data/schema.sql` defines the relational target model. A managed PostgreSQL/MySQL deployment
should become the production persistence layer before scaling beyond the foundation stage.

## Notifications

Notifications are currently persisted as internal records. Email, SMS, WhatsApp or push delivery
providers should be connected as separate adapters so provider credentials never enter frontend code.
