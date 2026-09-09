# SSHP Universal Owner Email System

Every normal public customer submission is copied to the owner email through the universal endpoint. School–Teacher Direct Recruitment workflows remain excluded.

### Upload to cPanel
- `universal-owner-email.js` → `public_html/`
- `api/owner-email-public.php` → `public_html/api/`
- Replace `public_html/.htaccess` with the latest GitHub version.

Do not replace `api/config.php`.

### Test
1. Upload the three files above.
2. Press Ctrl+F5 on the live website.
3. Submit a Students Corner request and check `hahmad76@gmail.com`.
4. Submit an Educational Services request and check the same mailbox.
5. Test other normal public customer forms.
6. Test School–Teacher recruitment separately and confirm it does not send an owner-order email.

Remove the temporary `mail-test.php` diagnostic file after testing is complete.
