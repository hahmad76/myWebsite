document.addEventListener("DOMContentLoaded", () => {
  const toggle=document.querySelector(".menu-toggle"), nav=document.querySelector(".main-nav"), sidebar=document.querySelector(".side-bar"), sidebarToggle=document.querySelector(".sidebar-toggle");
  if(toggle&&nav){toggle.addEventListener("click",()=>{const open=nav.classList.toggle("open");toggle.setAttribute("aria-expanded",String(open));});nav.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>{if(window.innerWidth<=700&&a.parentElement?.classList.contains("has-menu"))return;nav.classList.remove("open");toggle.setAttribute("aria-expanded","false");}));}
  if(sidebarToggle&&sidebar){const adminLink=sidebar.querySelector('a[href="#admin"]');if(adminLink)adminLink.href="admin.html";sidebarToggle.addEventListener("click",()=>{const open=sidebar.classList.toggle("open");sidebarToggle.setAttribute("aria-expanded",String(open));});sidebar.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>{sidebar.classList.remove("open");sidebarToggle.setAttribute("aria-expanded","false");}));}
  const year=document.getElementById("year"); if(year)year.textContent=new Date().getFullYear();
  const filters=document.querySelectorAll(".filter"),cards=document.querySelectorAll(".service-card[data-category]");
  filters.forEach(f=>f.addEventListener("click",()=>{filters.forEach(x=>x.classList.remove("active"));f.classList.add("active");const w=f.dataset.filter;cards.forEach(c=>c.classList.toggle("hidden",!(w==="all"||c.dataset.category===w||c.dataset.category==="all")));}));
  const serviceSelect=document.getElementById("service-select"),selected=document.getElementById("selected-service"),serviceForm=document.getElementById("service-request");
  const actionInput=serviceForm?Object.assign(document.createElement("input"),{type:"hidden",name:"request_action",value:"service"}):null;if(serviceForm&&actionInput)serviceForm.appendChild(actionInput);
  document.querySelectorAll(".service-action").forEach(b=>b.addEventListener("click",()=>{const s=b.dataset.service||"",label=(b.textContent||"").toLowerCase();if(serviceSelect)serviceSelect.value=s;if(selected)selected.value=s;if(actionInput)actionInput.value=label.includes("quote")?"quote":label.includes("order")?"order":"service";document.getElementById("start")?.scrollIntoView({behavior:"smooth"});setTimeout(()=>serviceSelect?.focus(),450);}));
  serviceSelect?.addEventListener("change",()=>{if(selected)selected.value=serviceSelect.value;});
  const API_BASE=(window.SSHP_API_BASE||"/api").replace(/\/$/,"");
  const endpointFor=(type,action)=>type==="Service Request"?(action==="quote"?"/quotes":action==="order"?"/orders":"/service-requests"):( {"Teacher Career Interest":"/teacher-interests","Private School Requirement":"/school-requirements","Community Content Contribution":"/content-submissions","Content Contribution":"/content-submissions"}[type]||"/submissions");
  async function post(path,payload){const r=await fetch(`${API_BASE}${path}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});let j={};try{j=await r.json();}catch{}if(!r.ok)throw new Error((j.error||"The server could not process the request.")+(Array.isArray(j.details)?` ${j.details.join("; ")}`:""));return j;}
  document.querySelectorAll(".interaction-form").forEach(form=>form.addEventListener("submit",async e=>{e.preventDefault();const msg=form.querySelector(".form-message"),type=form.dataset.type||"Website Form",data=Object.fromEntries(new FormData(form).entries());if(msg){msg.textContent="Submitting securely…";msg.removeAttribute("data-error");}try{let payload=data;if(type==="Service Request"&&(data.request_action==="quote"||data.request_action==="order"))payload={service:data.service_select,name:data.name,phone:data.phone,email:data.email,requirement:data.requirement,request_action:data.request_action};const r=await post(endpointFor(type,data.request_action||"service"),type==="Website Form"?{type,data:payload}:payload);if(msg)msg.textContent=r.message||"Your request has been received successfully.";form.reset();if(selected)selected.value="";if(actionInput)actionInput.value="service";}catch(err){if(msg){msg.textContent=`Unable to submit right now. ${err.message}`;msg.setAttribute("data-error","true");}}}));

  const main=document.querySelector("main");
  if(main&&!document.getElementById("payments")){
    main.insertAdjacentHTML("beforeend",`<section class="section payment-section" id="payments"><div class="container payment-layout"><div class="payment-info"><span class="eyebrow">04 · PAYMENTS</span><h2>Submit an Omni payment reference.</h2><p>Use this experimental payment pathway after placing an order. The Hub will verify the transaction before the order is marked paid.</p><ul><li>Payment method: Omni</li><li>Enter the transaction/reference number exactly as issued.</li><li>Keep your payment receipt until verification is complete.</li></ul><p class="security-note">Never enter your PIN, password, OTP or other confidential banking credentials here.</p></div><form class="payment-form card-form" novalidate><label>Order ID <input name="order_id" required maxlength="100" autocomplete="off" placeholder="Enter your order ID"></label><label>Payment Method <select id="payment-method" name="method" required><option value="">Select payment method</option><option value="omni">Omni</option></select></label><div id="omni-fields"><label>Transaction / Reference Number <input name="transaction_reference" required maxlength="120" autocomplete="off" placeholder="Omni transaction reference"></label><div class="two-col"><label>Sender Name <input name="sender_name" required maxlength="120"></label><label>Sender Phone <input name="sender_phone" required maxlength="30" inputmode="tel"></label></div><div class="two-col"><label>Amount (PKR) <input name="amount_minor" type="number" min="1" step="1" required inputmode="numeric"></label><label>Currency <input name="currency" value="PKR" maxlength="3" pattern="[A-Za-z]{3}" required></label></div><label>Notes (optional) <textarea name="notes" rows="3" maxlength="500" placeholder="Optional payment note"></textarea></div><button class="btn btn-primary" type="submit">Submit Payment Reference →</button><p class="form-message payment-status" role="status" aria-live="polite"></p></form></div></section>`);
  }

  const pm=document.getElementById("payment-method"),of=document.getElementById("omni-fields");
  pm?.addEventListener("change",()=>{if(of)of.hidden=pm.value!=="omni";});
  if(of&&pm&&pm.value!=="omni")of.hidden=true;
  const pf=document.querySelector(".payment-form");pf?.addEventListener("submit",async e=>{e.preventDefault();const msg=pf.querySelector(".form-message"),data=Object.fromEntries(new FormData(pf).entries());if(msg){msg.textContent="Submitting payment reference securely…";msg.removeAttribute("data-error");}try{data.currency=String(data.currency||"").toUpperCase();data.amount_minor=Number(data.amount_minor);const r=await post("/payments",data);if(msg)msg.textContent=r.message||"Payment reference received for administrator verification.";pf.reset();if(of)of.hidden=true;}catch(err){if(msg){msg.textContent=`Unable to submit right now. ${err.message}`;msg.setAttribute("data-error","true");}}});

  /* Students Corner request center. Students submit their details for administrator review. */
  if(main&&!document.getElementById("students-corner")){
    const resourcesSection=document.getElementById("resources");
    const studentMarkup=`<section class="section light students-corner-section" id="students-corner"><div class="container form-layout"><div class="section-heading"><span class="eyebrow">STUDENTS CORNER</span><h2>Student Help &amp; Guidance Request</h2><p>Students can send their question, problem or education-related request directly to the Hub for review.</p><div class="govt-selected-service"><strong>Student Support:</strong> Admission, examinations, results, study problems, guidance, tuition, notes, scholarships and general issues.</div></div><form class="interaction-form card-form student-form" id="student-corner-form" data-type="Student Corner Request"><div class="two-col"><label>Name <input name="name" required autocomplete="name"></label><label>Class <input name="class" required autocomplete="off" placeholder="e.g. 9th, 10th, F.A, B.A"></label></div><label>School <input name="school" required autocomplete="organization"></label><label>Address <textarea name="address" rows="2" required autocomplete="street-address"></textarea></label><label>WhatsApp Number <input name="whatsapp" type="tel" required inputmode="tel" autocomplete="tel" placeholder="03XX XXXXXXX"></label><label>Complete Detail <textarea name="complete_detail" rows="8" required placeholder="Please write your complete question, problem or requirement..."></textarea></label><button class="btn btn-primary" type="submit">Submit →</button><p class="form-message" role="status" aria-live="polite"></p></form></div></section>`;
    if(resourcesSection)resourcesSection.insertAdjacentHTML("beforebegin",studentMarkup);else main.insertAdjacentHTML("beforeend",studentMarkup);
  }

  const sections=[...document.querySelectorAll("main section[id]" )],links=[...document.querySelectorAll(".main-nav a,.side-bar a")];
  if("IntersectionObserver"in window){const ob=new IntersectionObserver(es=>{const v=es.filter(x=>x.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];if(!v)return;links.forEach(a=>a.classList.toggle("active",a.getAttribute("href")==="#"+v.target.id));},{rootMargin:"-35% 0px -55% 0px",threshold:[0,.2,.5]});sections.forEach(s=>ob.observe(s));}

  /* Government Teachers Corner request center. Each dropdown item opens this form with that service pre-selected. */
  if(main&&!document.getElementById("govt-teachers-corner")){
    const resourcesSection=document.getElementById("resources");
    const govtMarkup=`<section class="section light govt-teachers-section" id="govt-teachers-corner"><div class="container govt-teachers-layout"><div class="section-heading"><span class="eyebrow">GOVT. TEACHERS CORNER</span><h2 id="govt-form-title">Government Teachers Service Request</h2><p>Enter your details and the required service. Your request will be submitted to the Hub for processing.</p><div class="govt-selected-service"><strong>Selected Service:</strong> <span id="govt-selected-service">Please select a service from the Govt. Teachers Corner menu.</span></div></div><form class="card-form govt-teacher-form" id="govt-teacher-form"><input type="hidden" name="service" id="govt-service" value=""><label>Name <input name="name" required autocomplete="name"></label><label>Designation &amp; BPS <input name="designation_bps" required></label><label>School Address <textarea name="school_address" rows="2" required></textarea></label><label>Contact No for WhatsApp <input name="whatsapp" type="tel" required inputmode="tel" autocomplete="tel"></label><label>Email Address <input name="email" type="email" required autocomplete="email"></label><label>Request Detail <textarea name="request_detail" rows="7" required placeholder="Please enter the details of your requirement..."></textarea></label><button class="btn btn-primary" type="submit">Submit →</button><p class="form-message" role="status" aria-live="polite"></p></form></div></section>`;
    if(resourcesSection)resourcesSection.insertAdjacentHTML("beforebegin",govtMarkup);else main.insertAdjacentHTML("beforeend",govtMarkup);
  }

  const govtForm=document.getElementById("govt-teacher-form"),govtService=document.getElementById("govt-service"),govtSelected=document.getElementById("govt-selected-service"),govtTitle=document.getElementById("govt-form-title");
  if(govtForm){
    const govtMenuLinks=[...document.querySelectorAll('.main-nav .mega-menu a[href="#govt-teachers-corner"]')];
    govtMenuLinks.forEach(a=>a.addEventListener("click",e=>{
      e.preventDefault();
      const service=(a.textContent||"").trim();
      if(govtService)govtService.value=service;
      if(govtSelected)govtSelected.textContent=service;
      if(govtTitle)govtTitle.textContent=service;
      const wrapper=a.closest(".nav-item");
      wrapper?.classList.remove("menu-open");
      wrapper?.querySelector("a")?.setAttribute("aria-expanded","false");
      nav?.classList.remove("open");
      toggle?.setAttribute("aria-expanded","false");
      document.getElementById("govt-teachers-corner")?.scrollIntoView({behavior:"smooth",block:"start"});
      setTimeout(()=>govtForm.querySelector('input[name="name"]')?.focus(),500);
    }));
    govtForm.addEventListener("submit",async e=>{
      e.preventDefault();
      const msg=govtForm.querySelector(".form-message"),data=Object.fromEntries(new FormData(govtForm).entries());
      if(msg){msg.textContent="Submitting securely…";msg.removeAttribute("data-error");}
      try{
        const payload={type:"Govt Teacher Service Request",service:data.service,name:data.name,designation_bps:data.designation_bps,school_address:data.school_address,whatsapp:data.whatsapp,email:data.email,request_detail:data.request_detail};
        const r=await post("/submissions",payload);
        if(msg)msg.textContent=r.message||"Your request has been received successfully.";
        govtForm.reset();
        if(govtSelected)govtSelected.textContent="Please select a service from the Govt. Teachers Corner menu.";
        if(govtTitle)govtTitle.textContent="Government Teachers Service Request";
      }catch(err){if(msg){msg.textContent=`Unable to submit right now. ${err.message}`;msg.setAttribute("data-error","true");}}
    });
  }

  /* Professional horizontal mega-menu: keep the existing Online Services menu (including Omni) and add matching dropdowns to the other approved navigation sections. */
  const style=document.createElement("style");
  style.textContent=`
    .main-nav{gap:6px;align-items:stretch}.nav-item{position:relative;display:flex;align-items:center}.nav-item>a{display:flex;align-items:center;gap:5px;padding:10px 11px;border-radius:8px;white-space:nowrap}.nav-item.has-menu>a::after{content:"⌄";font-size:12px;line-height:1;opacity:.65;transition:transform .2s ease}.nav-item.has-menu:hover>a::after,.nav-item.has-menu:focus-within>a::after{transform:rotate(180deg)}.nav-item>a:hover,.nav-item>a.active{background:#f1f7fd;color:#0b5cab}
    .mega-menu{position:absolute;left:50%;top:calc(100% + 9px);transform:translate(-50%,-8px);width:300px;padding:10px;background:#fff;border:1px solid #dce6ef;border-radius:13px;box-shadow:0 18px 45px rgba(22,54,88,.16);opacity:0;visibility:hidden;pointer-events:none;transition:opacity .18s ease,transform .18s ease,visibility .18s ease;z-index:80}.mega-menu::before{content:"";position:absolute;top:-6px;left:50%;width:11px;height:11px;background:#fff;border-left:1px solid #dce6ef;border-top:1px solid #dce6ef;transform:translateX(-50%) rotate(45deg)}.nav-item.has-menu:hover .mega-menu,.nav-item.has-menu:focus-within .mega-menu,.nav-item.has-menu.menu-open .mega-menu{opacity:1;visibility:visible;pointer-events:auto;transform:translate(-50%,0)}
    .mega-menu-title{display:block;padding:7px 10px 9px;color:#0b5cab;font-size:10px;font-weight:900;letter-spacing:1.1px;border-bottom:1px solid #edf1f5}.mega-menu a{display:flex!important;align-items:center;gap:9px;padding:9px 10px!important;border-radius:8px;font-size:12px;font-weight:750;color:#40516a;white-space:normal}.mega-menu a::before{content:"→";color:#0b5cab;font-weight:900}.mega-menu a:hover{background:#f5f9fd;color:#0b5cab}.nav-item.simple>a{padding-left:11px;padding-right:11px}
    .govt-teachers-layout{display:grid;grid-template-columns:.85fr 1.15fr;gap:55px;align-items:start}.govt-selected-service{margin-top:20px;padding:13px 15px;background:#fff;border:1px solid #dfe7ef;border-radius:10px;font-size:12px;color:#68758a}.govt-selected-service strong{color:#43536a}.govt-teacher-form label{margin-bottom:14px}.govt-teacher-form .btn{width:100%;margin-top:4px}.govt-teacher-form textarea{resize:vertical}
    .student-form label{margin-bottom:14px}.student-form .btn{width:100%;margin-top:4px}.student-form textarea{resize:vertical}
    @media(min-width:701px){.main-nav>.nav-item:last-child{margin-left:4px}.main-nav>.nav-item:last-child>a{padding:10px 15px}}
    @media(max-width:1000px) and (min-width:701px){.nav-item>a{padding-left:7px;padding-right:7px}.main-nav{gap:2px;font-size:12px}.mega-menu{width:270px}.govt-teachers-layout{grid-template-columns:1fr}}
    @media(max-width:700px){.main-nav{gap:0}.nav-item{display:block}.nav-item>a{justify-content:space-between;width:100%;padding:10px}.mega-menu{position:static;width:100%;transform:none!important;margin:2px 0 5px;padding:5px;box-shadow:none;border-radius:9px;display:none;opacity:1;visibility:visible;pointer-events:auto}.nav-item.has-menu.menu-open .mega-menu{display:block}.mega-menu::before{display:none}.mega-menu a{padding:8px 10px!important}.nav-item.has-menu>a::after{content:"+";font-size:15px}.nav-item.has-menu.menu-open>a::after{content:"−"}.nav-cta{margin-top:5px}.govt-teachers-layout{grid-template-columns:1fr}.govt-selected-service{margin-bottom:5px}}
  `;
  document.head.appendChild(style);

  const menuDefinitions={
    "Careers":{title:"SCHOOLS & CANDIDATES",items:[["Private Schools — Find Employees","#school-request"],["Candidates — Find Jobs","#teacher-interest"],["School Recruitment Requirement","#school-request"],["Candidate Registration","#teacher-interest"]]},
    "Resources":{title:"EDUCATION RESOURCES",items:[["Education Resources","#resources"],["Community Contributions","#content-share"],["Education Updates","#updates"]]},
    "Updates":{title:"LATEST INFORMATION",items:[["Education Updates","#updates"],["Community","#content-share"],["About SSHP","#about"]]},
    "About":{title:"ABOUT SSHP",items:[["About SSHP","#about"],["Contact & Support","#contact"],["Administration","#admin"]]}
  };

  /* The Online Services dropdown is already present in index.html and contains the Omni options. Do not replace it. */
  nav?.querySelectorAll(":scope > .nav-item > a").forEach(link=>{
    const label=(link.textContent||"").trim();
    const def=menuDefinitions[label];
    if(!def)return;
    const wrapper=link.parentElement;
    if(!wrapper)return;
    wrapper.classList.remove("simple");
    wrapper.classList.add("has-menu");
    if(wrapper.querySelector(":scope > .mega-menu"))return;
    const menu=document.createElement("div"); menu.className="mega-menu"; menu.setAttribute("role","menu");
    const title=document.createElement("span"); title.className="mega-menu-title"; title.textContent=def.title; menu.appendChild(title);
    def.items.forEach(([text,href])=>{const a=document.createElement("a");a.href=href;a.textContent=text;a.setAttribute("role","menuitem");menu.appendChild(a);});
    wrapper.appendChild(menu);
    link.setAttribute("aria-haspopup","true"); link.setAttribute("aria-expanded","false");
    link.addEventListener("click",e=>{if(window.innerWidth<=700){e.preventDefault();const open=wrapper.classList.toggle("menu-open");link.setAttribute("aria-expanded",String(open));}});
    wrapper.addEventListener("mouseenter",()=>link.setAttribute("aria-expanded","true"));
    wrapper.addEventListener("mouseleave",()=>link.setAttribute("aria-expanded","false"));
    menu.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>{wrapper.classList.remove("menu-open");link.setAttribute("aria-expanded","false");nav.classList.remove("open");toggle?.setAttribute("aria-expanded","false");}));
  });
});
