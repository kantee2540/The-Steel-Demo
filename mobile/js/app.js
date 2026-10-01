// Mobile shell: top bar, bottom tab bar, hash router.
(function () {
  const { icon, $, A, toast, requireLogin } = UI;
  window.PAGES = window.PAGES || {};

  // [pattern, page, title (null = logo bar), tab, parent for back]
  const ROUTES = [
    ['/', 'home', null, 'home'],
    ['/products', 'products', 'รายการสินค้า', 'home', '#/'],
    ['/product/:id', 'detail', 'รายละเอียดสินค้า', 'home', '#/products'],
    ['/cart', 'cart', null, 'cart'],
    ['/checkout/address', 'address', 'ที่อยู่จัดส่ง', 'cart', '#/cart'],
    ['/checkout/addons', 'addons', 'บริการเสริม', 'cart', '#/checkout/address'],
    ['/checkout/payment', 'payment', 'ชำระเงิน', 'cart', '#/checkout/addons'],
    ['/checkout/status/:id', 'status', 'สถานะการชำระเงิน', 'cart', '#/'],
    ['/orders', 'orders', 'รายการคำสั่งซื้อ', 'orders'],
    ['/account', 'account', 'บัญชีของฉัน', 'account'],
    ['/favorites', 'favorites', 'รายการโปรดของฉัน', 'account', '#/account'],
  ];
  const AUTH = ['address', 'addons', 'payment', 'status', 'orders', 'favorites'];

  function parse() {
    const [path, qs] = (location.hash.replace(/^#/, '') || '/').split('?');
    const query = Object.fromEntries(new URLSearchParams(qs || ''));
    for (const [pattern, key, title, tab, parent] of ROUTES) {
      const pp = pattern.split('/'), sp = path.split('/');
      if (pp.length !== sp.length) continue;
      const params = {};
      if (pp.every((s, i) => (s.startsWith(':') ? ((params[s.slice(1)] = decodeURIComponent(sp[i])), true) : s === sp[i]))) return { key, title, tab, parent, params, query };
    }
    return { key: 'home', title: null, tab: 'home', params: {}, query };
  }

  function topbar(r) {
    if (!r.title) return `<a class="logo" href="#/" aria-label="Easy Steel หน้าแรก"><img src="${A('logo.png')}" alt="Easy Steel"></a>
      <a class="ic right" href="#/products?focus=1" aria-label="ค้นหาสินค้า">${icon('search', 26, 2)}</a>`;
    return `${r.parent ? `<button data-back aria-label="ย้อนกลับ">${icon('back', 26, 2.4)}</button>` : ''}<h1>${r.title}</h1>`;
  }

  function tabbar(r) {
    const n = SHOP.state.cart.length;
    const t = (id, href, ic, label, badge) => `<a href="${href}" class="${r.tab === id ? 'on' : ''}">${icon(ic, 26, r.tab === id ? 2.2 : 1.6)}${badge ? `<span class="badge">${badge}</span>` : ''}${label}</a>`;
    return t('home', '#/', 'home', 'หน้าหลัก') + t('cart', '#/cart', 'cart', 'ตะกร้า', n) + t('orders', '#/orders', 'orders', 'คำสั่งซื้อ') + t('account', '#/account', 'user', 'บัญชี');
  }

  // In the desktop iPhone frame the app scrolls inside .app; on phones the page itself scrolls.
  const framed = () => matchMedia('(min-width: 640px)').matches;
  const scroller = () => (framed() ? $('.app') : document.scrollingElement);

  let current;
  function render(keepScroll) {
    const y = scroller().scrollTop;
    current = parse();
    if (AUTH.includes(current.key) && !SHOP.state.user) {
      const want = location.hash;
      requireLogin(() => { if (location.hash === want) render(); else location.hash = want; });
      current = Object.assign(parse(), { key: 'account', title: 'บัญชีของฉัน', tab: 'account', parent: null });
    }
    $('.topbar').innerHTML = topbar(current);
    $('.tabbar').innerHTML = tabbar(current);
    const page = $('#page').cloneNode(false); // fresh node so listeners never stack
    $('#page').replaceWith(page);
    page.className = 'content';
    PAGES[current.key](page, current.params, current.query);
    scroller().scrollTop = keepScroll ? y : 0;
  }

  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-back]')) {
      // History back after in-app navigation; the status page always returns home (the cart is already paid).
      let navigated = false;
      try { navigated = sessionStorage.getItem('m-nav') === '1'; } catch {}
      if (navigated && current.key !== 'status') history.back();
      else location.hash = current.parent || '#/';
      return;
    }
    const fav = e.target.closest('[data-fav]');
    if (fav) {
      e.preventDefault(); e.stopPropagation();
      toast(SHOP.actions.toggleFav(fav.dataset.fav) ? 'เพิ่มในรายการโปรดแล้ว' : 'นำออกจากรายการโปรดแล้ว');
      render(true);
    }
  });
  window.addEventListener('hashchange', () => { try { sessionStorage.setItem('m-nav', '1'); } catch {} render(); });
  window.addEventListener('DOMContentLoaded', () => render());

  // Fit the iPhone frame to the browser window, and keep the status-bar clock current.
  function fit() {
    const s = Math.min(1, (innerHeight - 40) / 876, (innerWidth - 40) / 417);
    document.documentElement.style.setProperty('--scale', s.toFixed(3));
  }
  function clock() {
    const d = new Date();
    const el = document.querySelector('[data-clock]');
    if (el) el.textContent = `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  }
  window.addEventListener('resize', fit);
  window.addEventListener('DOMContentLoaded', () => { fit(); clock(); setInterval(clock, 15000); });
  window.APP = { refresh: () => render(true) };
})();
