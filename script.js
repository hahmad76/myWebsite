document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".main-nav");

  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    nav.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    }));
  }

  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  const filters = document.querySelectorAll(".filter");
  const serviceCards = document.querySelectorAll(".service-card[data-category]");
  filters.forEach(filter => {
    filter.addEventListener("click", () => {
      filters.forEach(f => f.classList.remove("active"));
      filter.classList.add("active");
      const wanted = filter.dataset.filter;
      serviceCards.forEach(card => {
        const show = wanted === "all" || card.dataset.category === wanted || card.dataset.category === "all";
        card.classList.toggle("hidden", !show);
      });
    });
  });

  const serviceSelect = document.getElementById("service-select");
  const selectedService = document.getElementById("selected-service");

  document.querySelectorAll(".service-action").forEach(button => {
    button.addEventListener("click", () => {
      const service = button.dataset.service || "";
      if (serviceSelect) serviceSelect.value = service;
      if (selectedService) selectedService.value = service;
      const request = document.getElementById("start");
      if (request) request.scrollIntoView({behavior:"smooth", block:"start"});
      setTimeout(() => {
        if (serviceSelect) serviceSelect.focus();
      }, 450);
    });
  });

  if (serviceSelect) {
    serviceSelect.addEventListener("change", () => {
      if (selectedService) selectedService.value = serviceSelect.value;
    });
  }

  const storageKey = "sshp_frontend_submissions";
  const saveSubmission = (type, data) => {
    const existing = JSON.parse(localStorage.getItem(storageKey) || "[]");
    existing.push({type, data, createdAt: new Date().toISOString()});
    localStorage.setItem(storageKey, JSON.stringify(existing));
  };

  document.querySelectorAll(".interaction-form").forEach(form => {
    form.addEventListener("submit", e => {
      e.preventDefault();
      const message = form.querySelector(".form-message");
      const data = Object.fromEntries(new FormData(form).entries());
      saveSubmission(form.dataset.type || "Website Form", data);
      if (message) {
        message.textContent = "Thank you. Your request has been recorded in this browser. Live account, database and admin processing will be connected in the backend phase.";
      }
      form.reset();
      if (selectedService) selectedService.value = "";
    });
  });

  // Keep the active navigation item aligned with the visible major section.
  const sections = [...document.querySelectorAll("main section[id]")];
  const navLinks = [...document.querySelectorAll(".main-nav a")];
  const observer = new IntersectionObserver(entries => {
    const visible = entries.filter(entry => entry.isIntersecting).sort((a,b) => b.intersectionRatio-a.intersectionRatio)[0];
    if (!visible) return;
    const link = navLinks.find(a => a.getAttribute("href") === "#" + visible.target.id);
    if (!link) return;
    navLinks.forEach(a => a.classList.remove("active"));
    link.classList.add("active");
  }, {rootMargin:"-35% 0px -55% 0px", threshold:[0,0.2,0.5]});
  sections.forEach(section => observer.observe(section));
});
