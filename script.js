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
  const serviceForm = document.getElementById("service-request");
  const actionInput = serviceForm
    ? Object.assign(document.createElement("input"), {type: "hidden", name: "request_action", value: "service"})
    : null;
  if (serviceForm && actionInput) serviceForm.appendChild(actionInput);

  document.querySelectorAll(".service-action").forEach(button => {
    button.addEventListener("click", () => {
      const service = button.dataset.service || "";
      const label = (button.textContent || "").trim().toLowerCase();
      const action = label.includes("quote") ? "quote" : label.includes("order") ? "order" : "service";
      if (serviceSelect) serviceSelect.value = service;
      if (selectedService) selectedService.value = service;
      if (actionInput) actionInput.value = action;
      const request = document.getElementById("start");
      if (request) request.scrollIntoView({behavior:"smooth", block:"start"});
      setTimeout(() => { if (serviceSelect) serviceSelect.focus(); }, 450);
    });
  });

  if (serviceSelect) {
    serviceSelect.addEventListener("change", () => {
      if (selectedService) selectedService.value = serviceSelect.value;
    });
  }

  // The API is same-origin by default. Set window.SSHP_API_BASE before this script loads
  // when the API is hosted on another domain.
  const API_BASE = (window.SSHP_API_BASE || "/api").replace(/\/$/, "");

  const endpointFor = (type, action) => {
    if (type === "Service Request") {
      if (action === "quote") return "/quotes";
      if (action === "order") return "/orders";
      return "/service-requests";
    }
    return ({
      "Teacher Career Interest": "/teacher-interests",
      "Private School Requirement": "/school-requirements",
      "Community Content Contribution": "/content-submissions"
    }[type] || "/submissions");
  };

  const submitToBackend = async (type, data) => {
    const action = data.request_action || "service";
    let payload = data;
    if (type === "Service Request" && (action === "quote" || action === "order")) {
      payload = {
        service: data.service_select,
        name: data.name,
        phone: data.phone,
        email: data.email,
        requirement: data.requirement,
        request_action: action
      };
    }
    const response = await fetch(`${API_BASE}${endpointFor(type, action)}`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(type === "Website Form" ? {type, data: payload} : payload)
    });
    let result = {};
    try { result = await response.json(); } catch {}
    if (!response.ok) {
      const detail = Array.isArray(result.details) ? ` ${result.details.join("; ")}` : "";
      throw new Error((result.error || "The server could not process the submission.") + detail);
    }
    return result;
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
        const result = await submitToBackend(type, data);
        const action = data.request_action || "service";
        const successText = action === "quote"
          ? "Your quote request has been received successfully."
          : action === "order"
            ? "Your service order has been received successfully."
            : "Your request has been received successfully.";
        if (message) message.textContent = result.message || successText;
        form.reset();
        if (selectedService) selectedService.value = "";
        if (actionInput) actionInput.value = "service";
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
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting).sort((a,b) => b.intersectionRatio-a.intersectionRatio)[0];
      if (!visible) return;
      const link = navLinks.find(a => a.getAttribute("href") === "#" + visible.target.id);
      if (!link) return;
      navLinks.forEach(a => a.classList.remove("active"));
      link.classList.add("active");
    }, {rootMargin:"-35% 0px -55% 0px", threshold:[0,0.2,0.5]});
    sections.forEach(section => observer.observe(section));
  }
});
