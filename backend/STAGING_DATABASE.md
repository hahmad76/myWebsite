# Staging Database Verification

## Purpose

Staging must prove the production SQL adapter, schema, migrations, authentication sessions, forms, quotes/orders and administration APIs work against a real isolated database before production traffic is enabled.

## Required environment

- `NODE_ENV=staging`
- `DATABASE_URL` pointing only to the staging database
- `ADMIN_PASSWORD_HASH` set through the hosting secret manager
- `CORS_ORIGIN` set to the staging frontend origin

## Verification checklist

1. Apply `data/schema.sql` to an empty staging database.
2. Start the API using the SQL adapter.
3. Verify `/api/health`.
4. Submit each public frontend form and confirm the corresponding database record.
5. Create a quote and order; verify notification records.
6. Login as administrator and verify `/api/auth/me` and dashboard access.
7. Restart the application and verify durable session behavior.
8. Update a permitted administrative field and verify an audit record.
9. Attempt unauthorized admin access and verify HTTP 401.
10. Attempt invalid payloads and verify HTTP 422.
11. Verify rate limiting and request-size protection.
12. Verify backups and a restore into a separate test database.
13. Run the complete automated test suite.

Production traffic must not be switched until all items pass and rollback has been rehearsed.
