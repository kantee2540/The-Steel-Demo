// App shell (header + sidebar) and hash router.
(function () {
  const { esc, $, $$ } = UI;
  window.PAGES = window.PAGES || {};

  const NAV = [
    { label: 'ภาพรวม', icon: 'pie', href: '/dashboard' },
    { label: 'ระบบจัดการสินค้า', icon: 'cart', children: [
      { label: 'จัดการสินค้า', href: '/products' },
      { label: 'จัดการสต็อก', href: '/stock' },
      { label: 'นำเข้า/ส่งออกข้อมูลสินค้า', href: '/import-export' },
      { label: 'ปรับปรุงราคา', href: '/pricing' },
    ] },
    { label: 'จัดการคำสั่งซื้อ', icon: 'bag', href: '/orders' },
    { label: 'จัดการการขนส่ง', icon: 'truck', children: [
      { label: 'จัดการรถขนส่ง', href: '/fleet' },
      { label: 'บริการเสริม', href: '/addons' },
      { label: 'นำเข้า/ส่งออก รถขนส่ง', href: '/fleet-import' },
    ] },
    { label: 'จัดการสาขาและคลังสินค้า', icon: 'home', href: '/branches' },
    { label: 'ข้อมูลสมาชิก', icon: 'award', href: '/members' },
    { label: 'จัดการผู้ใช้งาน', icon: 'user', children: [
      { label: 'ผู้ใช้งาน', href: '/users' },
      { label: 'ตั้งค่าสิทธิการเข้าถึง', href: '/roles' },
    ] },
    { label: 'ออกรายงาน', icon: 'file', children: [
      { label: 'รายงานยอดขาย', href: '/reports/sales' },
      { label: 'รายงานคำสั่งซื้อ', href: '/reports/orders' },
      { label: 'รายงานสมาชิก/ลูกค้า', href: '/reports/members' },
    ] },
    { label: 'จัดการเนื้อหา (CMS)', icon: 'globe', children: [
      { label: 'จัดการประกาศ', href: '/cms/announcements' },
      { label: 'บทความ', href: '/cms/articles' },
      { label: 'จัดการโปรโมชัน', href: '/cms/promotions' },
      { label: 'ตั้งค่า SEO / AEO', href: '/cms/seo' },
    ] },
    { label: 'จัดการการส่งแจ้งเตือน', icon: 'bell', href: '/notifications' },
  ];

  // route pattern -> [page key, nav href to highlight]
  const ROUTES = [
    ['/dashboard', 'dashboard', '/dashboard'],
    ['/products', 'products', '/products'],
    ['/products/category/:id', 'categoryForm', '/products'],
    ['/stock', 'stock', '/stock'],
    ['/stock/:sku', 'stockEdit', '/stock'],
    ['/import-export', 'importExport', '/import-export'],
    ['/pricing', 'pricing', '/pricing'],
    ['/orders', 'orders', '/orders'],
    ['/orders/:id', 'orderDetail', '/orders'],
    ['/fleet', 'fleet', '/fleet'],
    ['/fleet/form/:i', 'fleetForm', '/fleet'],
    ['/addons', 'addons', '/addons'],
    ['/addons/form/:i', 'addonForm', '/addons'],
    ['/fleet-import', 'fleetImport', '/fleet-import'],
    ['/branches', 'branches', '/branches'],
    ['/branches/:code', 'branchForm', '/branches'],
    ['/members', 'members', '/members'],
    ['/members/:id', 'memberDetail', '/members'],
    ['/users', 'users', '/users'],
    ['/users/form/:id', 'userForm', '/users'],
    ['/roles', 'roles', '/roles'],
    ['/roles/:id', 'roleForm', '/roles'],
    ['/reports/sales', 'salesReport', '/reports/sales'],
    ['/reports/orders', 'ordersReport', '/reports/orders'],
    ['/reports/members', 'membersReport', '/reports/members'],
    ['/cms/announcements', 'announcements', '/cms/announcements'],
    ['/cms/announcements/new', 'announcementNew', '/cms/announcements'],
    ['/cms/articles', 'articles', '/cms/articles'],
    ['/cms/articles/new', 'articleNew', '/cms/articles'],
    ['/cms/promotions', 'promotions', '/cms/promotions'],
    ['/cms/promotions/new', 'promotionNew', '/cms/promotions'],
    ['/cms/seo', 'seo', '/cms/seo'],
    ['/notifications', 'notifications', '/notifications'],
    ['/notifications/new', 'notificationNew', '/notifications'],
  ];

  function match(path) {
    for (const [pattern, key, nav] of ROUTES) {
      const pp = pattern.split('/'), sp = path.split('/');
      if (pp.length !== sp.length) continue;
      const params = {};
      if (pp.every((seg, i) => (seg.startsWith(':') ? ((params[seg.slice(1)] = decodeURIComponent(sp[i])), true) : seg === sp[i]))) return { key, nav, params };
    }
    return null;
  }

  const session = {
    get authed() { try { return sessionStorage.getItem('bo-auth') === '1' || localStorage.getItem('bo-auth') === '1'; } catch { return true; } },
    get role() { try { return sessionStorage.getItem('bo-role') || 'admin'; } catch { return 'admin'; } },
    set role(v) { try { sessionStorage.setItem('bo-role', v); } catch {} },
    login(remember) { try { sessionStorage.setItem('bo-auth', '1'); if (remember) localStorage.setItem('bo-auth', '1'); } catch {} },
    logout() { try { sessionStorage.removeItem('bo-auth'); localStorage.removeItem('bo-auth'); } catch {} },
  };
  window.SESSION = session;

  function navLabelFor(href) {
    for (const n of NAV) {
      if (n.href === href) return n.label;
      for (const c of n.children || []) if (c.href === href) return c.label;
    }
    return '';
  }

  function sidebarHtml() {
    return NAV.map((n, i) => {
      if (!n.children) return `<a class="nav-item" href="#${n.href}" data-href="${n.href}">${icon(n.icon)}<span class="label">${esc(n.label)}</span></a>`;
      return `<div class="nav-group" data-group="${i}">
        <button class="nav-item" type="button" data-toggle="${i}">${icon(n.icon)}<span class="label">${esc(n.label)}</span><span class="chev">${icon('chevDown')}</span></button>
        <div class="nav-sub">${n.children.map((c) => `<a href="#${c.href}" data-href="${c.href}">${esc(c.label)}</a>`).join('')}</div>
      </div>`;
    }).join('');
  }

  function shellHtml() {
    const u = DB.user;
    return `
      <header class="header">
        <div class="header-left">
          <button class="icon-btn hamburger" data-burger aria-label="เมนู">${icon('menu', 26)}</button>
          <a class="logo" href="#/dashboard" aria-label="The Steel D หน้าแรก"><img src="assets/logo.svg" alt="The Steel D"></a>
        </div>
        <div class="header-right">
          <div style="position:relative">
            <button class="icon-btn" data-bell aria-label="การแจ้งเตือน">${icon('bell', 32, 1.4)}<span class="dot"></span></button>
          </div>
          <div style="position:relative">
            <button class="user-chip" data-user><span class="name">${esc(u.name)}</span><span class="avatar">${esc(u.initial)}</span></button>
          </div>
        </div>
      </header>
      <nav class="sidebar" aria-label="เมนูหลัก">${sidebarHtml()}</nav>
      <div class="scrim" data-scrim></div>
      <main class="main"><div class="page" id="page"></div></main>`;
  }

  function closeDropdowns() { $$('.dropdown').forEach((d) => d.remove()); }

  function openUserMenu(anchor) {
    const role = session.role;
    const dd = document.createElement('div');
    dd.className = 'dropdown';
    dd.dataset.kind = 'user';
    dd.innerHTML = `
      <div class="dd-label">มุมมองหน้าภาพรวม</div>
      <button data-role="admin" class="${role === 'admin' ? 'on' : ''}">${icon('pie', 18)} แอดมิน</button>
      <button data-role="warehouse" class="${role === 'warehouse' ? 'on' : ''}">${icon('home', 18)} พนักงานคลังสินค้า</button>
      <hr><button data-logout>${icon('logout', 18)} ออกจากระบบ</button>`;
    anchor.parentElement.appendChild(dd);
    dd.addEventListener('click', (e) => {
      const r = e.target.closest('[data-role]');
      if (r) { session.role = r.dataset.role; closeDropdowns(); location.hash = '#/dashboard'; route(); }
      if (e.target.closest('[data-logout]')) { session.logout(); closeDropdowns(); location.hash = '#/login'; }
    });
  }

  function openBellMenu(anchor) {
    const dd = document.createElement('div');
    dd.className = 'dropdown';
    dd.dataset.kind = 'bell';
    dd.style.minWidth = '300px';
    dd.innerHTML = `<div class="dd-label">การแจ้งเตือนล่าสุด</div>
      <a class="notif-item" href="#/orders/SO-10236" style="display:block;color:inherit">คำสั่งซื้อใหม่ #SO-10236<small>บริษัท ไทยก่อสร้าง จำกัด · 186,400 บาท</small></a>
      <a class="notif-item" href="#/stock/TSL-AG100100-100" style="display:block;color:inherit">สต็อกหมด: เหล็กฉาก 100x100 มม.<small>TSL-AG100100-100 · คงเหลือ 0</small></a>
      <a class="notif-item" href="#/import-export" style="display:block;color:inherit">นำเข้าไฟล์ล้มเหลว<small>product_import_2569-09-07.csv</small></a>`;
    anchor.parentElement.appendChild(dd);
  }

  function bindShell() {
    document.addEventListener('click', (e) => {
      const tog = e.target.closest('[data-toggle]');
      if (tog) { tog.parentElement.classList.toggle('open'); return; }
      if (e.target.closest('[data-burger]')) { document.body.classList.toggle('nav-open'); return; }
      if (e.target.closest('[data-scrim]') || e.target.closest('.sidebar a')) document.body.classList.remove('nav-open');
      const user = e.target.closest('[data-user]');
      const bell = e.target.closest('[data-bell]');
      if (!e.target.closest('.dropdown')) {
        const wasUser = !!$('.dropdown[data-kind="user"]');
        const wasBell = !!$('.dropdown[data-kind="bell"]');
        closeDropdowns();
        if (user && !wasUser) openUserMenu(user);
        if (bell && !wasBell) openBellMenu(bell);
      }
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeDropdowns(); $$('.modal-back').forEach((m) => m.remove()); } });
  }

  function setActive(navHref) {
    $$('.sidebar [data-href]').forEach((a) => a.classList.toggle('active', a.dataset.href === navHref));
    $$('.nav-group').forEach((g) => g.classList.toggle('open', !!$(`[data-href="${navHref}"]`, g)));
  }

  let shellMounted = false;
  function route() {
    const path = (location.hash.replace(/^#/, '') || '/dashboard').split('?')[0];
    const app = document.getElementById('app');
    closeDropdowns();

    // Pages shown without the sidebar shell (reachable while logged out).
    const AUTH_PAGES = { '/login': 'login', '/forgot': 'forgot', '/forgot/sent': 'forgotSent', '/reset': 'reset', '/reset/done': 'resetDone', '/no-access': 'noAccess' };
    if (AUTH_PAGES[path] || !session.authed) {
      shellMounted = false;
      if (!AUTH_PAGES[path]) { location.replace('#/login'); return; }
      PAGES[AUTH_PAGES[path]](app);
      document.title = 'เข้าสู่ระบบ · The Steel D Back Office';
      return;
    }
    if (!shellMounted) { app.innerHTML = shellHtml(); shellMounted = true; }

    const m = match(path);
    if (!m) { location.replace('#/dashboard'); return; }
    setActive(m.nav);
    // Fresh node per route so page-level listeners never stack up across visits.
    const page = document.getElementById('page').cloneNode(false);
    document.getElementById('page').replaceWith(page);
    PAGES[m.key](page, m.params, navLabelFor(m.nav));
    document.title = `${navLabelFor(m.nav) || 'ภาพรวม'} · The Steel D Back Office`;
    window.scrollTo(0, 0);
  }

  window.addEventListener('hashchange', route);
  window.addEventListener('DOMContentLoaded', () => { bindShell(); route(); });
  window.ROUTER = { route };
})();
