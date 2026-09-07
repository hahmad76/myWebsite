/* SSHP Teacher Jobs bridge: adds teacher sign-in and connects Apply Now to the live recruitment API. */
document.addEventListener('DOMContentLoaded',()=>{
  if(!/\/teacher-jobs\.html$/i.test(location.pathname)) return;

  const API='/api/career.php', TOKEN='sshpCareerToken';
  const token=()=>localStorage.getItem(TOKEN);
  const norm=s=>String(s??'').toLowerCase().replace(/&/g,' and ').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();

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
    const titleN=norm(title), textN=norm(text);
    const location=(text.match(/(?:📍|Location)\s*([^\n]+)/i)||[])[1]||'';
    const qualification=(text.match(/(?:🎓|Qualification)\s*([^\n]+)/i)||[])[1]||'';

    const r=await fetch(API+'/vacancies?ts='+Date.now(),{cache:'no-store'});
    const j=await r.json();
    if(!r.ok) throw Error(j.error||'Unable to load vacancies from the recruitment API.');
    const rows=Array.isArray(j.data)?j.data:[];
    if(!rows.length) return null;

    // First try an exact normalized title match.
    let v=rows.find(x=>norm(x.title)===titleN);
    if(v) return v;

    // Then score the live vacancy against the visible card.
    const scored=rows.map(x=>{
      const vt=norm(x.title), vs=norm(x.subject), vl=norm(x.location), vq=norm(x.qualification), vd=norm(x.details);
      let score=0;
      if(titleN && (vt.includes(titleN)||titleN.includes(vt))) score+=60;
      const titleWords=titleN.split(' ').filter(w=>w.length>=4);
      score+=titleWords.filter(w=>vt.includes(w)||vs.includes(w)).length*8;
      if(vs && textN.includes(vs)) score+=15;
      if(vl && textN.includes(vl)) score+=12;
      if(vq && textN.includes(vq)) score+=8;
      if(vd && textN.includes(vd)) score+=2;
      if(location && vl.includes(norm(location))) score+=10;
      if(qualification && vq.includes(norm(qualification))) score+=8;
      return {v:x,score};
    }).sort((a,b)=>b.score-a.score);

    if(scored[0]&&scored[0].score>=8) return scored[0].v;
    // If only one live vacancy exists, it is unambiguous and can safely be used.
    if(rows.length===1) return rows[0];
    return null;
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
      if(!vacancy) throw Error('This vacancy could not be matched to an open vacancy in the recruitment database. Please tell the administrator.');
      const note=prompt('Optional short cover note:','I am interested in this position and would like to apply.');
      if(note===null) return;
      const r=await fetch(API+'/apply',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token()},body:JSON.stringify({vacancy_id:vacancy.id,cover_note:note||''})});
      const j=await r.json();
      if(!r.ok) throw Error(j.error||'Application could not be submitted.');
      alert(j.message||'Application sent. The school has been notified.');
    }catch(x){alert(x.message||'Application could not be submitted.');}
  },true);
});
