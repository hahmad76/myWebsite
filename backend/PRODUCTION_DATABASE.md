# Production Database Cutover

The application now isolates persistence behind `createDatabaseAdapter()` and defines the relational target in `data/schema.sql`.

## Required production cutover

Use a managed PostgreSQL or MySQL instance for production. Do not treat the repository JSON files as a production database or as a substitute for backups.

### Cutover sequence

1. Provision a private managed database.
2. Apply `data/schema.sql` after adapting timestamp/boolean syntax if required by the selected engine.
3. Implement a parameterized SQL adapter matching the existing repository methods (`list`, `append`, `replace`, `update`).
4. Run a migration/import from the current JSON collections if any real records exist.
5. Configure the application with a secret database connection string through the hosting platform's secret manager.
6. Run integration tests against an isolated staging database.
7. Enable automated backups, point-in-time recovery where available, encryption at rest, and least-privilege database credentials.
8. Switch production traffic only after staging and rollback tests pass.

## Data integrity rules

- Never build SQL by string concatenation from request values.
- Use parameterized queries and transactions for multi-record operations.
- Keep audit records append-only for application users.
- Index frequently queried fields such as status, created_at, service and foreign-key columns.
- Apply retention policies only after business/legal requirements are defined.
