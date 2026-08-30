# Backend Implementation — SCHOOLS SOLUTIONS HUB PAKISTAN

This implementation adds the first executable backend layer while preserving the
existing static front end.

## Included

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
- JSON persistent storage through a replaceable storage adapter
- Input sanitization and validation
- Request-size protection
- Basic per-IP rate limiting
- Security response headers
- CORS configuration
- Audit-log records for received submissions
- Automated API tests using Node's built-in test runner

## Run

From `backend/`:

```bash
npm test
npm start
```

The development API listens on port 3000 by default.

For production, replace the JSON storage adapter with a managed database and place
the API behind HTTPS/reverse-proxy infrastructure. Authentication, role-based
authorization, admin workflows, notifications and payments remain subsequent
integration layers and are intentionally not represented as complete.
