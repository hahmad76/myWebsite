/* SSHP site-wide Google Tag Manager loader */
(function (window, document) {
  'use strict';

  var containerId = 'GTM-PSM7BTZ5';
  if (!containerId || window.__sshpGtmLoaded) return;
  window.__sshpGtmLoaded = true;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    'gtm.start': new Date().getTime(),
    event: 'gtm.js'
  });

  var script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtm.js?id=' + encodeURIComponent(containerId);
  document.head.appendChild(script);
})(window, document);
