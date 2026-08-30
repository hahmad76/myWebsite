# Production Administration Console

`/admin.html` is the first operational administration interface. It authenticates against the backend, loads dashboard counts, notifications and protected collections.

## Security requirements

- Serve the console only over HTTPS in production.
- Configure `ADMIN_PASSWORD_HASH` through a secret manager.
- Do not commit administrator credentials.
- Restrict the production admin URL at the reverse proxy/WAF if appropriate.
- Replace the current simple console styling with the final role-aware administration UX during UI hardening.

## Current capabilities

- Administrator sign-in/sign-out
- Protected dashboard
- Collection browsing
- Notification viewing
- Session token held in browser `sessionStorage`

The backend remains the authority for authorization; hiding UI elements is never used as a security boundary.
