/* SSHP — connect the Careers navigation to the new School–Teacher Direct Recruitment Portal. */
document.addEventListener('DOMContentLoaded', () => {
  const portal = '#direct-recruitment';

  // Send the main Careers navigation and opportunity buttons to the new portal.
  document.querySelectorAll('a[href="#careers"]').forEach(a => {
    a.setAttribute('href', portal);
  });

  // Retire the old school/candidate form destinations from the main navigation.
  document.querySelectorAll('a[href="#school-request"], a[href="#teacher-interest"]').forEach(a => {
    a.setAttribute('href', portal);
  });

  // Keep the old forms available as legacy/fallback sections, but make the
  // new direct-recruitment portal the primary Career pathway.
  document.querySelectorAll('.career-card a, .path-card a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === '#school-request' || href === '#teacher-interest' || href === '#careers') {
      a.setAttribute('href', portal);
    }
  });
});
