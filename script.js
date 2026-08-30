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

  // The API is same-origin by default. Set window.SSHP_API_BASE before this
  // script loads when the API is hosted on another domain.
  const API_BASE = (window.SSHP_API_BASE || "/api").replace(/\/$/, "");

  const endpointFor = type => ({
    "Service Request": "/service-requests",
    "Teacher Career Interest": "/teacher-interests",
    "Private School Requirement": "/school-requirements",
    "Community Content Contribution": "/content-submissions"
  }[type] || "/submissions");

  const submitToBackend = async (type, data) => {
    const response = await fetch(`${API_BASE}${endpointFor(type)}`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(type === "Website Form" ? {type, data} : data)
    });
    let payload = {};
    try { payload = await response.json(); } catch {}
    if (!response.ok) {
      const detail = Array.isArray(payload.details) ? ` ${payload.details.join("; ")}` : "";
      throw new Error((payload.error || "The server could not process the submission.") + detail);
    }
    return payload;
  };

  document.querySelectorAll(".interaction-form").forEach(form => {
    form.addEventListener("submit", async e => {
      e.preventDefault();
      const message = form.querySelector(".form-message");
      const type = form.dataset.type || "Website Form";
      const data = Object.fromEntries(new FormData(form).entries());

      if (message) {
        message.textContent = "Submitting securely…";
        message.removeAttribute("data-error");
      }

      try {
        await submitToBackend(type, data);
        if (message) message.textContent = "Thank you. Your request has been received successfully.";
        form.reset();
        if (selectedService) selectedService.value = "";
      } catch (error) {
        if (message) {
          message.textContent = `Unable to submit right now. ${error.message}`;
          message.setAttribute("data-error", "true");
        }
      }
    });
  });

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
