# SSHP Career Portal — Live Database Setup & E2E Test

## Database setup
1. In cPanel open **phpMyAdmin** and select the same MySQL database used by `api/config.php`.
2. Import `career-schema.sql` once.
3. Import `career-migration-v2.sql` once.
4. On the server copy `api/config.example.php` to `api/config.php` and enter the real database name, user and password. Never commit `api/config.php` to GitHub.
5. Open `/api/career.php/health`. Expected JSON: `success: true`, `service: SSHP Career Portal`, `status: ok`.

## End-to-end test
### School
- Create a school account with name, address and WhatsApp/phone.
- Sign in.
- Publish a vacancy with post, subject, qualification, location, optional salary range, number required and description.

### Teacher
- Create a teacher account with name, qualification, address, experience, WhatsApp/phone, optional salary range and description.
- Sign in.
- Browse/search open vacancies and apply.

### Direct connection
- School dashboard receives the application.
- School can view the teacher profile and change status to shortlisted/interview/accepted/rejected.
- After shortlisting/interview, direct contact details and portal messaging become available.
- Teacher dashboard shows the application status and school contact details when direct contact is enabled.

### Two-way search
- A teacher can browse/search vacancies by keyword, location and subject.
- A signed-in school can search teacher profiles by keyword, location and qualification.
- Teacher contact details are shown to authenticated school accounts, not anonymous visitors.

## Expected Super Admin role
Super Admin is not required for routine matching. Super Admin retains oversight and may correct, manage, disable or intervene on records when necessary.
