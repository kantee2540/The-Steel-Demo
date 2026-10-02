// Front End shell: header, hash router, compare drawer, global card actions.
(function () {
  const { esc, actions, CATEGORIES, product } = SHOP;
  const { icon, $, A, toast, requireLogin } = UI;
  window.PAGES = window.PAGES || {};

  const ROUTES = [
    ['/', 'home'], ['/products', 'products'], ['/product/:id', 'detail'], ['/compare', 'compare'], ['/articles', 'articles'], ['/articles/:id', 'article'], ['/promotions', 'promotions'], ['/promotions/:id', 'promotion'],
    ['/cart', 'cart'], ['/checkout/address', 'address'], ['/checkout/addons', 'addons'], ['/checkout/payment', 'payment'],
    ['/checkout/status/:id', 'status'], ['/account/orders', 'orders'], ['/account/favorites', 'favorites'], ['/account/:section', 'accountInfo'],
  ];
  const AUTH = ['address', 'addons', 'payment', 'status', 'orders', 'favorites', 'accountInfo'];

  function parse() {
    const raw = location.hash.replace(/^#/, '') || '/';
    const [path, qs] = raw.split('?');
    const query = Object.fromEntries(new URLSearchParams(qs || ''));
    for (const [pattern, key] of ROUTES) {
      const pp = pattern.split('/'), sp = path.split('/');
      if (pp.length !== sp.length) continue;
      const params = {};
      if (pp.every((s, i) => (s.startsWith(':') ? ((params[s.slice(1)] = decodeURIComponent(sp[i])), true) : s === sp[i]))) return { key, params, query, path };
    }
    return { key: 'home', params: {}, query, path: '/' };
  }

  function header() {
    const s = SHOP.state;
    const cartCount = s.cart.length;
    return `<div class="header-inner">
      <a class="logo" href="#/" aria-label="Steel D หน้าแรก"><img src="${A('logo.svg')}" alt="Steel D"></a>
      <div class="searchbar">
        <button class="cat-btn" data-catmenu aria-haspopup="true">${icon('grid', 25)}<span>หมวดหมู่</span>${icon('chevDown', 20, 2.4)}</button>
        <form data-search><input name="q" placeholder="ค้นหาสินค้า เช่น เหล็กแผ่น, เหล็กตัวซี" value="${esc(current.query.q || '')}" aria-label="ค้นหาสินค้า"><button aria-label="ค้นหา">${icon('search', 20, 2)}</button></form>
        <div class="cat-menu">${CATEGORIES.map((c) => `<a href="#/products?cat=${c.id}"><img src="${A(c.img)}" alt="">${c.name}</a>`).join('')}<a href="#/products" style="justify-content:center;color:var(--primary)">ดูสินค้าทั้งหมด</a></div>
      </div>
      <div style="position:relative;margin-left:auto">
        <button class="account-link" data-account><span class="icon-circle">${icon('user', 26, 2)}</span><span>${s.user ? esc(s.user.name) : 'เข้าสู่ระบบ/สมัครสมาชิก'}</span></button>
      </div>
      <div class="head-icons">
        <button aria-label="การแจ้งเตือน" data-bell><span class="icon-circle">${icon('bell', 22, 2)}</span>${s.user ? '<span class="count-badge">2</span>' : ''}</button>
        <a href="#/cart" aria-label="ตะกร้าสินค้า"><span class="icon-circle">${icon('cart', 22, 2)}</span>${cartCount ? `<span class="count-badge">${cartCount}</span>` : ''}</a>
      </div></div>`;
  }

  function compareBar() {
    const s = SHOP.state;
    if (!s.compare.length || current.key === 'compare') return '';
    return `<aside class="compare-bar" aria-label="เปรียบเทียบสินค้า">
      <div><h3>เปรียบเทียบสินค้า</h3><p class="muted">เลือกสินค้าเพื่อเปรียบเทียบได้มากสุด 4 รายการ</p></div>
      <div class="slots">${s.compare.map((id) => { const p = product(id); return `<div class="cmp-mini"><img src="${A(p.img)}" alt=""><b title="${esc(p.name)}">${esc(p.name)}</b><button data-compare="${id}" aria-label="นำ ${esc(p.name)} ออกจากการเปรียบเทียบ" title="ลบรายการ">${icon('x', 16, 2.4)}</button></div>`; }).join('')}</div>
      <div class="acts"><button class="btn btn-danger" data-clear-compare>ลบทั้งหมด</button><a class="btn btn-primary" href="#/compare">เปรียบเทียบ (${s.compare.length})</a></div>
    </aside>`;
  }

  let current = { key: 'home', params: {}, query: {} };

  function render(keepScroll) {
    const y = window.scrollY;
    current = parse();
    if (AUTH.includes(current.key) && !SHOP.state.user) {
      // Show the home page behind the login modal; after login, render the requested route.
      requireLogin(() => render());
      current = { key: 'home', params: {}, query: {} };
    }
    $('.header').innerHTML = header();
    // Fresh node per render so page-level listeners never stack up across renders.
    const page = $('#page').cloneNode(false);
    $('#page').replaceWith(page);
    document.title = 'Steel D — ร้านค้าออนไลน์';
    PAGES[current.key](page, current.params, current.query);
    $('#compare-host').innerHTML = compareBar();
    // Reserve room so the fixed compare bar never covers the end of the page.
    const bar = $('.compare-bar');
    document.body.style.paddingBottom = bar ? bar.offsetHeight + 16 + 'px' : '';
    window.scrollTo(0, keepScroll ? y : 0);
  }
  const refresh = () => render(true);

  document.addEventListener('click', (e) => {
    const t = e.target;
    const menu = $('.cat-menu');
    if (t.closest('[data-catmenu]')) { menu.classList.toggle('open'); return; }
    if (menu && !t.closest('.cat-menu')) menu.classList.remove('open');
    if (!t.closest('.menu-pop')) document.querySelectorAll('.menu-pop').forEach((m) => m.remove());

    const cmp = t.closest('[data-compare]');
    if (cmp) {
      e.preventDefault();
      const r = actions.toggleCompare(cmp.dataset.compare);
      if (r === 'full') toast('เปรียบเทียบได้สูงสุด 4 รายการ', 'warn');
      else toast(r === 'added' ? 'เพิ่มในรายการเปรียบเทียบแล้ว' : 'นำออกจากรายการเปรียบเทียบแล้ว');
      return refresh();
    }
    const fav = t.closest('[data-fav]');
    if (fav) {
      e.preventDefault();
      toast(actions.toggleFav(fav.dataset.fav) ? 'เพิ่มในรายการโปรดแล้ว' : 'นำออกจากรายการโปรดแล้ว');
      return refresh();
    }
    if (t.closest('[data-clear-compare]')) { actions.clearCompare(); return refresh(); }
    if (t.closest('[data-account]')) {
      if (!SHOP.state.user) return requireLogin(refresh);
      const pop = document.createElement('div');
      pop.className = 'menu-pop';
      pop.innerHTML = `<a href="#/account/orders">รายการคำสั่งซื้อ</a><a href="#/account/favorites">รายการโปรดของฉัน</a><a href="#/account/recipients">ข้อมูลผู้รับสินค้า</a><button data-logout>ออกจากระบบ</button>`;
      t.closest('[data-account]').parentElement.appendChild(pop);
      e.stopPropagation();
      return;
    }
    if (t.closest('[data-logout]')) { actions.logout(); toast('ออกจากระบบแล้ว'); location.hash = '#/'; return refresh(); }
    if (t.closest('[data-bell]')) {
      if (!SHOP.state.user) return toast('เข้าสู่ระบบเพื่อดูการแจ้งเตือน', 'warn');
      const pop = document.createElement('div');
      pop.className = 'menu-pop';
      pop.style.minWidth = '300px';
      pop.innerHTML = `<a href="#/account/orders">คำสั่งซื้อ #${esc(SHOP.state.orders[0].id)}<br><small class="muted">สถานะ: ${esc(SHOP.state.orders[0].status)}</small></a><a href="#/products">โปรโมชันใหม่: ซื้อครบ 5,000 บาท ลด 5%<br><small class="muted">สิ้นสุด 30 พ.ย. 2569</small></a>`;
      t.closest('[data-bell]').parentElement.style.position = 'relative';
      t.closest('[data-bell]').parentElement.appendChild(pop);
      e.stopPropagation();
    }
  });
  document.addEventListener('submit', (e) => {
    if (!e.target.matches('[data-search]')) return;
    e.preventDefault();
    const q = e.target.q.value.trim();
    location.hash = `#/products${q ? '?q=' + encodeURIComponent(q) : ''}`;
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') document.querySelectorAll('.modal-back,.menu-pop').forEach((m) => m.remove()); });

  window.addEventListener('hashchange', () => render());
  window.addEventListener('DOMContentLoaded', () => render());
  window.APP = { refresh, get current() { return current; } };
})();
