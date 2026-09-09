/* SSHP Direct Recruitment: teacher-school contact is direct and notification-free. */
document.addEventListener('DOMContentLoaded',()=>{
  const API='/api/career-contacts.php', tokenKey='sshpCareerToken';
  const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const enhance=()=>{
    document.querySelectorAll('#direct-recruitment [data-apply]').forEach(btn=>{
      if(btn.dataset.directContactReady)return;
      btn.dataset.directContactReady='1';
      const vacancyId=btn.dataset.apply;
      btn.removeAttribute('data-apply');
      btn.textContent='Contact School Directly';
      btn.onclick=async()=>{
        const token=localStorage.getItem(tokenKey);
        if(!token){alert('Please create a teacher account and sign in to contact the school directly.');return;}
        btn.disabled=true;
        const old=btn.textContent;
        btn.textContent='Loading contact…';
        try{
          const r=await fetch(API+'?vacancy_id='+encodeURIComponent(vacancyId),{headers:{Authorization:'Bearer '+token}});
          const j=await r.json();
          if(!r.ok)throw new Error(j.error||'Unable to load school contact details.');
          const v=j.data||{};
          const box=document.createElement('div');
          box.className='career-direct-contact';
          box.style.cssText='margin-top:9px;padding:10px;border-radius:9px;background:#f4f8fc;border:1px solid #dce7f0;font-size:13px;line-height:1.6';
          box.innerHTML='<b>Direct School Contact</b><br>School: '+esc(v.school_name)+'<br>Phone / WhatsApp: <a href="tel:'+encodeURIComponent(v.school_phone||'')+'">'+esc(v.school_phone||'Not provided')+'</a><br>Email: '+(v.school_email?'<a href="mailto:'+encodeURIComponent(v.school_email)+'">'+esc(v.school_email)+'</a>':'Not provided');
          btn.parentNode.querySelector('.career-direct-contact')?.remove();
          btn.parentNode.appendChild(box);
          btn.textContent='Contact School Directly';
        }catch(err){alert(err.message);btn.textContent=old}finally{btn.disabled=false}
      };
    });
  };
  enhance();
  new MutationObserver(enhance).observe(document.body,{childList:true,subtree:true});
});
