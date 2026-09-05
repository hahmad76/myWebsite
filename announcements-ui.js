document.addEventListener('DOMContentLoaded', () => {
  const updates = document.getElementById('updates');
  if (!updates) return;

  const API_BASE = (window.SSHP_API_BASE || '/api').replace(/\/$/, '');
  const esc = (v) => String(v ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  const formatDate = (v) => {
    if (!v) return '';
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return esc(v);
    return d.toLocaleDateString('en-GB', {day:'numeric', month:'short', year:'numeric'});
  };
  const categoryIcon = (category) => {
    const c = String(category || '').toLowerCase();
    if (c.includes('result')) return '📢';
    if (c.includes('admission')) return '🎓';
    if (c.includes('exam')) return '📝';
    if (c.includes('job') || c.includes('career')) return '💼';
    return '📄';
  };

  const style = document.createElement('style');
  style.textContent = `
    #updates .announcement-ticker{display:flex;align-items:center;gap:0;margin:0 0 24px;border:1px solid #dbe5ef;border-radius:12px;overflow:hidden;background:#102b52;box-shadow:0 8px 24px rgba(20,50,80,.08)}
    #updates .announcement-ticker-label{flex:0 0 auto;background:#e63946;color:#fff;font-weight:800;font-size:12px;padding:12px 16px;white-space:nowrap}
    #updates .announcement-ticker-window{position:relative;overflow:hidden;flex:1;min-width:0}
    #updates .announcement-ticker-track{display:flex;width:max-content;animation:sshpTicker 28s linear infinite;padding:0}
    #updates .announcement-ticker:hover .announcement-ticker-track{animation-play-state:paused}
    #updates .announcement-ticker-item{display:flex;align-items:center;color:#fff;font-size:13px;font-weight:650;white-space:nowrap;padding:12px 22px}
    #updates .announcement-ticker-item::after{content:'•';opacity:.5;margin-left:22px}
    #updates .announcement-controls{display:flex;gap:4px;padding:5px;background:#102b52}
    #updates .announcement-controls button{border:0;background:rgba(255,255,255,.12);color:#fff;border-radius:6px;width:30px;height:30px;cursor:pointer;font-size:16px}
    #updates .announcement-controls button:hover{background:rgba(255,255,255,.22)}
    #updates .announcement-list{display:grid;gap:12px}
    #updates .announcement-item{display:grid;grid-template-columns:48px minmax(0,1fr) auto 24px;align-items:center;gap:15px;padding:16px 18px;background:#fff;border:1px solid #e1e8ef;border-radius:12px;box-shadow:0 5px 18px rgba(25,55,85,.06);transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease}
    #updates .announcement-item:hover{transform:translateY(-2px);box-shadow:0 10px 24px rgba(25,55,85,.10);border-color:#c9d9e8}
    #updates .announcement-icon{width:44px;height:44px;border-radius:50%;display:grid;place-items:center;background:#edf5ff;font-size:21px}
    #updates .announcement-main{min-width:0}
    #updates .announcement-category{display:inline-block;margin-bottom:4px;padding:3px 8px;border-radius:5px;background:#edf5ff;color:#0b5cab;font-size:9px;font-weight:900;letter-spacing:.6px;text-transform:uppercase}
    #updates .announcement-title{margin:0 0 3px;color:#172b4d;font-size:17px;line-height:1.25;font-weight:800}
    #updates .announcement-description{margin:0;color:#56677d;font-size:13px;line-height:1.5}
    #updates .announcement-date{white-space:nowrap;color:#62738a;font-size:12px;font-weight:650}
    #updates .announcement-arrow{color:#0b5cab;font-size:20px;font-weight:700}
    #updates .announcement-empty{padding:22px;background:#f7fafc;border:1px dashed #cfdbe7;border-radius:12px;color:#68788c;text-align:center}
    @keyframes sshpTicker{from{transform:translateX(0)}to{transform:translateX(-50%)}}
    @media(max-width:700px){
      #updates .announcement-ticker{display:block}
      #updates .announcement-ticker-label{display:block;text-align:center}
      #updates .announcement-controls{justify-content:center}
      #updates .announcement-item{grid-template-columns:40px minmax(0,1fr);gap:11px;padding:13px}
      #updates .announcement-icon{width:38px;height:38px;font-size:18px}
      #updates .announcement-date{grid-column:2;font-size:11px}
      #updates .announcement-arrow{display:none}
      #updates .announcement-title{font-size:15px}
      #updates .announcement-description{font-size:12px}
    }
  `;
  document.head.appendChild(style);

  const heading = updates.querySelector('.section-heading');
  if (!heading) return;
  let ui = updates.querySelector('.announcement-ui');
  if (!ui) {
    ui = document.createElement('div');
    ui.className = 'announcement-ui';
    heading.insertAdjacentElement('afterend', ui);
  }

  async function loadAnnouncements() {
    try {
      const res = await fetch(`${API_BASE}/announcements`, {headers:{'Accept':'application/json'}, cache:'no-store'});
      const json = await res.json();
      const rows = Array.isArray(json?.data) ? json.data : [];
      const announcements = rows.filter(x => String(x.status ?? 'published').toLowerCase() !== 'draft' && String(x.status ?? 'published').toLowerCase() !== 'inactive');
      if (!announcements.length) {
        ui.innerHTML = '<div class="announcement-empty">No announcements are available at the moment.</div>';
        return;
      }

      const tickerItems = announcements.map(a => `<span class="announcement-ticker-item">${esc(a.title)}${a.description ? ` — ${esc(a.description)}` : ''}</span>`).join('');
      const tickerTrack = tickerItems + tickerItems;
      const list = announcements.map(a => `
        <article class="announcement-item">
          <div class="announcement-icon" aria-hidden="true">${categoryIcon(a.category)}</div>
          <div class="announcement-main">
            ${a.category ? `<span class="announcement-category">${esc(a.category)}</span>` : ''}
            <h3 class="announcement-title">${esc(a.title)}</h3>
            ${a.description ? `<p class="announcement-description">${esc(a.description)}</p>` : ''}
          </div>
          <time class="announcement-date">📅 ${formatDate(a.created_at || a.updated_at)}</time>
          <span class="announcement-arrow" aria-hidden="true">›</span>
        </article>`).join('');

      ui.innerHTML = `
        <div class="announcement-ticker" aria-label="Latest announcements">
          <div class="announcement-ticker-label">📢 LATEST</div>
          <div class="announcement-ticker-window"><div class="announcement-ticker-track">${tickerTrack}</div></div>
          <div class="announcement-controls">
            <button type="button" class="ticker-prev" aria-label="Previous announcement">‹</button>
            <button type="button" class="ticker-next" aria-label="Next announcement">›</button>
          </div>
        </div>
        <div class="announcement-list">${list}</div>`;

      const track = ui.querySelector('.announcement-ticker-track');
      const prev = ui.querySelector('.ticker-prev');
      const next = ui.querySelector('.ticker-next');
      let shift = 0;
      const move = (dir) => {
        shift += dir * 220;
        track.style.animation = 'none';
        track.style.transform = `translateX(${shift}px)`;
      };
      prev?.addEventListener('click', () => move(1));
      next?.addEventListener('click', () => move(-1));
    } catch (err) {
      console.error('SSHP announcements could not be loaded:', err);
      ui.innerHTML = '<div class="announcement-empty">Announcements are temporarily unavailable. Please try again shortly.</div>';
    }
  }

  loadAnnouncements();
});
