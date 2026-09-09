/* SSHP Universal Owner Email System
 * Sends normal public customer submissions to the owner email endpoint.
 * Recruitment/contact workflows are intentionally excluded.
 */
document.addEventListener('DOMContentLoaded',()=>{
  const OWNER_ENDPOINT='/api/owner-email-public.php';
  const EXCLUDED_TYPES=new Set(['Teacher Career Interest','School Vacancy','Recruitment','Career Contact','Direct Recruitment']);
  const forms=[...document.querySelectorAll('form')].filter(form=>{
    if(form.id==='service-request') return false; // handled by order-submit-fix.js
    const type=form.dataset.type||form.getAttribute('data-form-type')||'';
    if(EXCLUDED_TYPES.has(type)) return false;
    if(form.matches('[data-recruitment], .recruitment-form')) return false;
    return true;
  });
  const toObject=form=>Object.fromEntries(new FormData(form).entries());
  forms.forEach(form=>{
    if(form.dataset.ownerEmailBound==='1') return;
    const type=form.dataset.type||form.getAttribute('data-form-type')||form.id||'Website Customer Submission';
    if(!/student|support|request|service|order|teacher|school|career|contact|payment|admission|exam|result|scholar|tuition|guidance|corner/i.test(type+' '+form.id+' '+form.className)) return;
    form.addEventListener('submit',async e=>{
      if(e.defaultPrevented) return;
      const submitter=e.submitter;
      if(submitter?.dataset?.recruitment==='true') return;
      const data=toObject(form);
      if(Object.keys(data).length===0) return;
      const payload={
        subject:`SSHP — ${type}`,
        form_type:type,
        submitted_fields:data,
        source_page:location.href,
        submitted_at:new Date().toISOString()
      };
      try{
        await fetch(OWNER_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),keepalive:true});
      }catch(_){/* Preserve the form's existing submission flow. */}
    },false);
    form.dataset.ownerEmailBound='1';
  });
});
