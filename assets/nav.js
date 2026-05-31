/* Injects shared top navigation into every page.
   data-nav keys: home | concept | bec | tot | micro | closing | calendar | day | master */
(function(){
  const items = [
    { key:'home',     href:'index.html',     label:'Home' },
    { key:'concept',  href:'concept.html',   label:'The Idea' },
    { key:'bec',      href:'layer-1.html',   label:'BEC Foundation' },
    { key:'tot',      href:'layer-2.html',   label:'Process & Disaster TOT' },
    { key:'micro',    href:'layer-3.html',   label:'Hospital Microlearning' },
    { key:'closing',  href:'layer-4.html',   label:'Program Closings' },
    { key:'calendar', href:'calendar.html',  label:'Calendar' },
    { key:'day',      href:'day-level.html', label:'Day-level' },
    { key:'master',   href:'combined.html',  label:'Master plan' },
  ];
  const active = document.body.getAttribute('data-nav') || '';
  const nav = document.createElement('nav');
  nav.className = 'site-nav';
  nav.innerHTML = `
    <div class="site-nav-inner">
      <a href="index.html" class="brand">
        <span class="mark">EC · DP</span>
        <span class="name">Timeline 2026<span class="sub">WHO Egypt</span></span>
      </a>
      <ul>
        ${items.map(i => `<li><a href="${i.href}" class="${i.key===active?'active':''}">${i.label}</a></li>`).join('')}
      </ul>
      <span class="nav-meta">Jun 14 → Dec 17</span>
    </div>
  `;
  document.body.insertBefore(nav, document.body.firstChild);
})();
