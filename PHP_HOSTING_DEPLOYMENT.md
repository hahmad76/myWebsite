# SSHP PHP + MySQL Production Deployment

SCHOOLS SOLUTIONS HUB PAKISTAN now has a shared-hosting production path that does not require Node.js, npm, PostgreSQL, Neon, port 5432, a VPS, or a separate backend service.

## Target architecture

Browser → same-domain `/api` PHP endpoint → MySQL/MariaDB on the same cPanel account.

The existing frontend already defaults to `/api`, so no separate API hostname or CORS configuration is needed when the site and API are on the same domain.

## cPanel setup

1. Create a MySQL/MariaDB database and database user in cPanel.
2. Import `database.sql` with phpMyAdmin.
3. Upload the website files to `public_html`.
4. Upload the `api` directory and rename `api/config.example.php` to `api/config.php`.
5. Put the real database name, user and password in `api/config.php`.
6. Generate an administrator password hash with PHP `password_hash()` and place only the hash in `api/config.php`.
7. Keep `api/config.php` out of GitHub. The included `api/.htaccess` blocks direct web access to it.
8. Visit `/api/health`. It should return JSON with `status: "ok"` and `persistence: "mysql"`.
9. Open `admin.html`, log in, and test the dashboard and collections.
10. Submit one service request, one teacher interest, one school requirement, one community contribution, one quote/order, and one Omni payment reference as a smoke test.

## Hosting requirements

- PHP 8.x
- MySQL 8.x or MariaDB 10.5+
- PDO MySQL extension
- Apache/LiteSpeed with `.htaccess` rewrite support
- HTTPS/SSL
- cPanel/phpMyAdmin is strongly preferred

No external database connection is required.

## Security

Never commit real database credentials, administrator passwords, API tokens, or payment credentials. The Omni form accepts only transaction references; it must never be used for a PIN, OTP or password.
