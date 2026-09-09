# SSHP Owner Email Order Setup

## Purpose

Website customer service requests and website orders are now routed to:

**hahmad76@gmail.com**

School–teacher/job-seeker recruitment interactions are intentionally excluded from this owner-email workflow.

## Files to upload to cPanel

Upload these three files, preserving the `api/` folder structure:

1. `order-submit-fix.js` → website root (replace the existing file)
2. `api/orders.php` → `api/` folder (replace the existing file)
3. `api/service-requests.php` → `api/` folder (replace the existing file)
4. `api/owner-email.php` → `api/` folder (new file)

No database migration is required by this email-routing change, provided the existing `orders.request_text` column is already present.

## What the new workflow does

- Customer submits an order/service request on the website.
- The request is saved to MySQL as before.
- Every field currently submitted by the customer form is forwarded to the owner email.
- Future form fields are also forwarded automatically because the browser sends the complete form field set.
- The owner email is `hahmad76@gmail.com`.
- The old admin/cPanel notification row is no longer created by these two customer endpoints, avoiding duplicate cPanel dashboard notifications.
- The existing 120-second idempotency protection remains, so an accidental repeated submission does not create a second database row or second email.
- Job-seeker/school-teacher recruitment endpoints are not changed and do not send these owner order emails.

## Email requirements on the hosting account

The hosting account should allow PHP `mail()` and the domain should be configured to send mail from `no-reply@sshpk.com.pk`.

The code treats email delivery separately from database saving: a temporary mail-system problem does not erase a successfully saved order.

## Final test after upload

1. Submit one test order from the live website.
2. Confirm the website displays a successful order ID.
3. Confirm the order is saved in MySQL.
4. Check `hahmad76@gmail.com` for the new email.
5. Confirm the email contains the customer's submitted details.
6. Submit the exact same form again immediately and confirm it is identified as a duplicate rather than generating a second email.
7. Test a school/teacher job-seeker interaction separately and confirm it does not generate an owner order email.

## Important

Do not upload or expose `api/config.php`. Keep the existing database credentials and hosting configuration unchanged.
