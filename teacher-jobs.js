/* SSHP Teacher Jobs bridge: adds teacher sign-in and connects Apply Now to the live recruitment API. */
document.addEventListener('DOMContentLoaded',()=>{
  if(!/\/teacher-jobs\.html$/i.test(location.pathname)) return;

  const API='/api/career.php', TOKEN='sshpCareerToken';
  const token=()=>localStorage.getItem(TOKEN);

  const banner=document.createElement('div');
  banner.style.cssText='max-width:1100px;margin:14px auto;padding:12px 16px;background:#eef6fc;border:1px solid #cfe2f2;border-radius:10px;display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap;font-weight:700;box-sizing:border-box';
  banner.innerHTML='<span>👨‍🏫 Teacher account?</span><span style="display:flex;gap:8px;flex-wrap:wrap"><a id="teacherSignIn" href="/teacher-login.html?return=%2Fteacher-jobs.html" style="background:#075f98;color:#fff;padding:9px 13px;border-radius:7px;text-decoration:none">Teacher Sign In</a><a id="teacherPortal" href="/?#direct-recruitment" style="background:#3d4858;color:#fff;padding:9px 13px;border-radius:7px;text-decoration:none">Career Portal</a></span>';
  const main=document.querySelector('main')||document.body;
  main.insertBefore(banner,main.firstChild);

  if(token()){
    const sign=document.getElementById('teacherSignIn');
    sign.textContent='Teacher Dashboard';
    sign.href='/?#direct-recruitment';
  }

  const findVacancy=async(card)=>{
    const title=(card.querySelector('h1,h2,h3,h4')?.textContent||'').trim();
    const text=card.textContent||'';
    const r=await fetch(API+'/vacancies');
    const j=await r.json();
    if(!r.ok) throw Error(j.error||'Unable to load vacancies from the recruitment API.');
    let rows=Array.isArray(j.data)?j.data:[];
    let v=rows.find(x=>String(x.title||'').trim().toLowerCase()===title.toLowerCase());
    if(!v) v=rows.find(x=>title&&String(x.title||'').toLowerCase().includes(title.toLowerCase()));
    if(!v){
      const subject=(text.match(/Mathematics|Physics|Science|English|Urdu|Computer|Biology|Chemistry/i)||[])[0]||'';
      v=rows.find(x=>subject && String(x.subject||'').toLowerCase().includes(subject.toLowerCase()));
    }
    return v;
  };

  document.addEventListener('click',async e=>{
    const btn=e.target.closest('button');
    if(!btn || !/^apply\s*now$/i.test((btn.textContent||'').trim())) return;
    e.preventDefault();
    e.stopPropagation();
    if(e.stopImmediatePropagation) e.stopImmediatePropagation();

    if(!token()){
      alert('Please sign in with your teacher account first.');
      location.href='/teacher-login.html?return=%2Fteacher-jobs.html';
      return;
    }

    const card=btn.closest('article,.job-card,.vacancy-card,.card,section,div');
    try{
      const vacancy=await findVacancy(card||document.body);
      if(!vacancy) throw Error('This vacancy is not yet connected to the live recruitment database. Please tell the administrator to connect this vacancy.');
      const note=prompt('Optional short cover note:','I am interested in this position and would like to apply.');
      if(note===null) return;
      const r=await fetch(API+'/apply',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token()},body:JSON.stringify({vacancy_id:vacancy.id,cover_note:note||''})});
      const j=await r.json();
      if(!r.ok) throw Error(j.error||'Application could not be submitted.');
      alert(j.message||'Application sent. The school has been notified.');
    }catch(x){alert(x.message||'Application could not be submitted.');}
  },true);
});
