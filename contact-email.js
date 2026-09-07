/* SSHP official contact email */
(function () {
  function addContactEmail() {
    var panel = document.querySelector('#contact .contact-panel');
    if (!panel || panel.querySelector('.sshp-contact-email')) return;

    var email = document.createElement('p');
    email.className = 'sshp-contact-email';
    email.style.margin = '14px 0 0';
    email.style.fontSize = '15px';
    email.innerHTML = '<strong>Email:</strong> <a href="mailto:info@sshpk.com.pk">info@sshpk.com.pk</a>';
    panel.insertBefore(email, panel.querySelector('.btn') || null);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addContactEmail);
  } else {
    addContactEmail();
  }
})();
