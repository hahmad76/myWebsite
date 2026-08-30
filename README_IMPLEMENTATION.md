# Backend & System Integration — SCHOOLS SOLUTIONS HUB PAKISTAN

The repository now contains an executable frontend-to-backend integration foundation while preserving the public website structure.

## Implemented

- Node.js 20+ HTTP API with no third-party runtime dependency
- `/api/health`
- `/api/services`
- `/api/resources`
- `/api/announcements`
- `/api/service-requests`
- `/api/teacher-interests`
- `/api/school-requirements`
- `/api/content-submissions`
- `/api/submissions`
- `/api/quotes`
- `/api/orders`
- `/api/auth/login`
- `/api/auth/logout`
- `/api/auth/me`
- Protected administrator dashboard and collection endpoints
- Administrator status/metadata updates with protected record fields
- Internal notification records for submissions, quotes and orders
- Audit-log records
- Input sanitization and validation
- Request-size protection
- Basic per-IP rate limiting
- Security response headers
- Configurable CORS
- Replaceable storage/database adapter
- Relational target schema in `backend/data/schema.sql`
- Production Dockerfile and deployment/security runbook
- Automated API and integration tests using Node's built-in test runner
- Frontend service actions connected to service, quote and order APIs

## Current architecture

Public frontend → API → validation/sanitization → repository/storage adapter → persistent records → audit/notification layer.

Administrator access is server-side and requires an explicitly configured password hash. No plaintext administrator password is stored in the repository.

## Run locally

From `backend/`:

```bash
npm test
npm start
```

The development API listens on port 3000 by default.

## Production status

This is the implementation/integration foundation, not a declaration of full production readiness.
The next production-hardening work is to connect a managed relational database, durable shared sessions,
external notification providers, payment processing where required, deployment secrets, HTTPS/reverse-proxy
configuration, monitoring, backups and full end-to-end QA.
