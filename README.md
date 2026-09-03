# SCHOOLS SOLUTIONS HUB PAKISTAN

## Production Website & Shared-Hosting System

This repository contains the consolidated public website and production-ready shared-hosting integration for **SCHOOLS SOLUTIONS HUB PAKISTAN (SSHP)**.

## Current architecture

SSHP V1.0 is designed to run on ordinary cPanel/LiteSpeed shared hosting without a VPS or external backend service:

**Browser → PHP 8.x API → MySQL/MariaDB on the same hosting account**

The production path does **not** require Node.js, npm, PostgreSQL, Neon, port 5432, or a separate API server. The frontend already uses `/api` by default, so the website and API can operate on the same domain.

## Public website

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
- BISE Saidu Sharif Swat Omni payment-reference pathway

## Production API features

The PHP API supports:
- Service requests
- Teacher interests
- Private-school requirements
- Community content submissions
- Quotes and orders
- Omni payment-reference submissions
- Resources and announcements
- Administrator login/logout/session expiry
- Administrative dashboard and collection views
- Administrative record updates
- Notifications
- Audit logging
- Request validation and rate limiting
- MySQL/MariaDB persistence

## Hosting requirements

A normal shared-hosting plan should be sufficient when it provides:
- PHP 8.x
- MySQL or MariaDB
- PDO MySQL
- Apache/LiteSpeed with `.htaccess` rewrite support
- HTTPS/SSL
- phpMyAdmin/cPanel access is strongly preferred

No external database connection is required.

## Deployment

See `PHP_HOSTING_DEPLOYMENT.md` for the exact cPanel deployment procedure and `database.sql` for the database schema. Copy `api/config.example.php` to `api/config.php` on the hosting account and enter the real database credentials and administrator password hash. `api/config.php` is excluded from Git by `.gitignore` and blocked from direct web access by `api/.htaccess`.

## GitHub Pages

GitHub Pages can still display the static frontend, but PHP APIs are executed only by a PHP-capable web host. For the full production website, upload the repository's public files and `api/` directory to the shared host.

## Security rule

Never commit real database credentials, administrator passwords, API tokens, or payment credentials. The Omni payment form accepts only a transaction/reference number; users must never enter an Omni PIN, OTP or password on the website.

## Development rule

The approved SSHP implementation remains the project foundation. Production verification, bug fixing, QA, security verification and deployment consolidation should improve the existing system without replacing the project or creating artificial Build 101+ stages.
