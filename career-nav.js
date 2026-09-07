/* SSHP — connect Careers navigation to the School–Teacher Direct Recruitment Portal. */
document.addEventListener('DOMContentLoaded', () => {
  const portal = '#direct-recruitment';
  const teacherJobs = 'teacher-jobs.html';

  // The main Careers entry opens the Direct Recruitment Portal.
  document.querySelectorAll('a[href="#careers"]').forEach(a => {
    a.setAttribute('href', portal);
  });

  // School vacancy links continue to open the Direct Recruitment Portal.
  document.querySelectorAll('a[href="#school-request"]').forEach(a => {
    a.setAttribute('href', portal);
  });

  // Candidate "Find Jobs" links must open the real teacher jobs page,
  // not the old candidate-registration form.
  document.querySelectorAll('a[href="#teacher-interest"]').forEach(a => {
    a.setAttribute('href', teacherJobs);
  });

  // Apply the same routing to the visible Career/pathway cards.
  document.querySelectorAll('.career-card a, .path-card a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === '#school-request') {
      a.setAttribute('href', portal);
    } else if (href === '#teacher-interest') {
      a.setAttribute('href', teacherJobs);
    } else if (href === '#careers') {
      a.setAttribute('href', portal);
    }
  });
});
