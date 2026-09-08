/* SSHP duplicate-order guard: prevents accidental double submission on the public service form. */
document.addEventListener("DOMContentLoaded",()=>{
  const form=document.getElementById("service-request");
  if(!form)return;
  const button=form.querySelector('button[type="submit"]');
  let locked=false;
  let cooldownTimer=null;

  const unlock=()=>{
    locked=false;
    if(cooldownTimer)clearTimeout(cooldownTimer);
    cooldownTimer=null;
    if(button){button.disabled=false;button.removeAttribute("aria-disabled");button.dataset.originalText=button.dataset.originalText||"Submit Request →";button.textContent=button.dataset.originalText;}
  };

  form.addEventListener("reset",()=>{
    if(cooldownTimer)clearTimeout(cooldownTimer);
    cooldownTimer=setTimeout(unlock,1200);
  });

  form.addEventListener("submit",e=>{
    if(form.querySelector('[name="request_action"]')?.value!=="order")return;
    if(locked){
      e.preventDefault();
      e.stopImmediatePropagation();
      return;
    }
    locked=true;
    if(button){button.dataset.originalText=button.textContent||"Submit Request →";button.disabled=true;button.setAttribute("aria-disabled","true");button.textContent="Submitting securely…";}
  },true);

  const msg=form.querySelector(".form-message");
  if(msg){
    new MutationObserver(()=>{
      if(/^Unable to submit right now\./.test(msg.textContent||""))unlock();
    }).observe(msg,{childList:true,characterData:true,subtree:true});
  }
});
