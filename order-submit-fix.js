/* SSHP order submit fix: route Service Request submissions to the dedicated idempotent order API. */
document.addEventListener("DOMContentLoaded",()=>{
  const form=document.getElementById("service-request");
  if(!form)return;
  const button=form.querySelector('button[type="submit"]');
  const message=form.querySelector(".form-message");
  let busy=false;

  form.addEventListener("submit",async e=>{
    const action=form.querySelector('[name="request_action"]')?.value||"service";
    if(action!=="service"&&action!=="order")return;

    e.preventDefault();
    e.stopImmediatePropagation();
    if(busy)return;
    busy=true;
    if(button){button.disabled=true;button.setAttribute("aria-disabled","true");button.dataset.originalText=button.dataset.originalText||button.textContent||"Submit Request →";button.textContent="Submitting securely…";}
    if(message){message.textContent="Submitting securely…";message.removeAttribute("data-error");}

    const data=Object.fromEntries(new FormData(form).entries());
    const payload={
      service:data.service_select,
      name:data.name,
      phone:data.phone,
      email:data.email||"",
      requirement:data.requirement||"",
      request_action:"order"
    };

    try{
      const r=await fetch("/api/orders",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
      let j={};
      try{j=await r.json();}catch{}
      if(!r.ok)throw new Error(j.error||"The server could not process the order.");

      if(message){
        message.textContent=j.duplicate
          ? `This order was already received. Order ID: ${j.id}`
          : `Your order has been received successfully. Order ID: ${j.id}`;
      }
      form.reset();
      const actionInput=form.querySelector('[name="request_action"]');
      if(actionInput)actionInput.value="service";
      if(button){button.disabled=false;button.removeAttribute("aria-disabled");button.textContent=button.dataset.originalText||"Submit Request →";}
      busy=false;
    }catch(err){
      if(message){message.textContent=`Unable to submit right now. ${err.message}`;message.setAttribute("data-error","true");}
      if(button){button.disabled=false;button.removeAttribute("aria-disabled");button.textContent=button.dataset.originalText||"Submit Request →";}
      busy=false;
    }
  },true);
});
