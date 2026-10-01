// Front End UI helpers: icons, cards, order summary, checkout stepper, modal, toast.
(function () {
  const { esc, money, num, product, category, totals, state } = SHOP;

  const P = {
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    chevDown: '<path d="m6 9 6 6 6-6"/>',
    chevRight: '<path d="m9 18 6-6-6-6"/>',
    chevLeft: '<path d="m15 18-6-6 6-6"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    cart: '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
    heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
    trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M10 11v6M14 11v6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    card: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
    qr: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3zM18 18h3v3h-3zM14 18v3M18 14h3"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    porter: '<circle cx="12" cy="4" r="2"/><path d="M12 6v7l-3 8M12 13l3 8M8 9h8M7 2l-3 5h6"/>',
    lift: '<path d="M3 21h4l2-6h6l2 6h4"/><circle cx="7" cy="18" r="1.5"/><circle cx="17" cy="18" r="1.5"/><path d="M9 15V5h3l3 10"/>',
  };
  const icon = (n, s = 24, sw = 1.8) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] || ''}</svg>`;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const A = (f) => `assets/${f}`;

  function crumbs(list) {
    return `<nav class="crumbs" aria-label="breadcrumb">${list.map(([label, href], i) =>
      `${i ? '<span class="sep">/</span>' : ''}${href ? `<a href="${href}">${esc(label)}</a>` : `<span class="cur">${esc(label)}</span>`}`).join('')}</nav>`;
  }

  function productCard(p) {
    const s = SHOP.state;
    const cmp = s.compare.includes(p.id), fav = s.fav.includes(p.id);
    return `<article class="product-card">
      <div class="img"><img src="${A(p.img)}" alt="${esc(p.name)}" loading="lazy">
        <div class="acts"><button class="compare-pill${cmp ? ' on' : ''}" data-compare="${p.id}">${cmp ? '✓ เปรียบเทียบ' : 'เปรียบเทียบ'}</button>
        <button class="fav-btn${fav ? ' on' : ''}" data-fav="${p.id}" aria-label="รายการโปรด">${icon('heart', 22)}</button></div></div>
      <div class="info">
        <div><a class="name" href="#/product/${p.id}">${esc(p.name)}</a><div class="sku">SKU : ${p.sku}</div></div>
        <div class="rec"><small>แนะนำ :</small><div class="pills">${p.tags.map((t) => `<span class="pill">${esc(t)}</span>`).join('')}</div></div>
        <div class="price-row"><div><small>ราคา (บาท)</small><span class="price">${money(p.price)}</span>${p.stock <= 0 ? '<div class="oos">สินค้าหมด</div>' : ''}</div>
          <a class="btn-detail" href="#/product/${p.id}">ดูรายละเอียด</a></div>
      </div></article>`;
  }

  function postCard(x, withTag) {
    return `<a class="post-card${withTag ? '' : ' no-tag'}" href="${withTag ? '#/products' : `#/articles/${x.id}`}"><img src="${A(x.img)}" alt="" loading="lazy">
      ${withTag ? `<span class="tag">สิ้นสุด ${x.end}</span>` : ''}
      <div class="body"><b>${esc(x.title)}</b><span>${esc(x.sub)}</span></div></a>`;
  }

  // Checkout stepper; step is 1-based index of the current step.
  function stepper(step) {
    const labels = ['ที่อยู่จัดส่ง', 'บริการเสริม', 'ชำระเงิน', 'สถานะ<br>การชำระเงิน'];
    return `<div class="stepper"><div class="top"><span>กระบวนการสั่งซื้อ</span><span>${step}/4 ขั้นตอน</span></div>
      <div class="steps">${labels.map((l, i) => `<div class="s ${i + 1 < step ? 'done' : i + 1 === step ? 'cur' : ''}${i + 1 === step && step === 4 ? ' done' : ''}"><div class="dot">${i + 1}</div><div class="lbl">${l}</div></div>`).join('')}</div></div>`;
  }

  // Order summary sidebar. opts: { addons: bool, fee: bool, shippingHighlight: bool, addonsBreakdown: bool, note }
  function summary(opts = {}) {
    const t = totals();
    const showAdd = opts.addons;
    const net = showAdd ? t.total : t.beforeAddons;
    return `<div class="${opts.bare ? '' : 'panel '}summary">
      <h3>สรุปคำสั่งซื้อ</h3>
      ${opts.addonsBreakdown && t.addonLines.length ? `<div class="green-box" style="margin-bottom:12px">
        ${t.addonLines.map(([n, p, q]) => `<div class="kv" style="font-size:14px"><span class="muted">${n}<br>${money(p)} x ${q}</span><span class="pos">+${money(p * q)}</span></div>`).join('')}
        <div class="kv pos" style="font-weight:700"><span>บริการเสริม (บาท)</span><span>${money(t.addons)} บาท</span></div></div>` : ''}
      <div class="kv"><span>น้ำหนักรวม (กก.)</span><span>${num(t.weight, 2)}</span></div>
      <div class="kv"><span>จำนวนรายการ</span><span>${t.count}</span></div>
      <hr class="divider">
      <div class="kv"><span>ราคาสินค้าทั้งหมด (บาท)</span><span>${money(t.subtotal)}</span></div>
      <div class="kv"><span>ส่วนลด (บาท)</span><span>-${money(t.discount)}</span></div>
      ${opts.shipping === false ? '' : `<hr class="divider"><div class="grp">ราคาขนส่ง</div>
      <div class="kv ${opts.shippingHighlight ? 'green-row' : ''}"><span>ค่าจัดส่ง (บาท)</span><span>${t.shipping ? money(t.shipping) : 'ฟรี'}</span></div>`}
      ${showAdd ? `<hr class="divider"><div class="grp">ราคาบริการเสริม</div>
      <div class="kv ${opts.addonsHighlight ? 'green-row' : ''}"><span>บริการเสริม (บาท)</span><span>${money(t.addons)}</span></div>
      <div class="kv"><span>ค่าธรรมเนียม 7% (บาท)</span><span>${money(t.fee)}</span></div>` : ''}
      <hr class="divider">
      <div class="net"><span>ยอดรวมสุทธิ (บาท)</span><span>${money(opts.shipping === false ? t.subtotal - t.discount : net)}</span></div>
      ${opts.note ? `<p class="muted" style="margin-top:8px">${opts.note}</p>` : ''}
    </div>`;
  }

  function itemsTable(lines) {
    return `<div class="table-wrap"><table class="table items"><thead><tr><th>รูป</th><th style="text-align:left">รายการ</th><th>ความหนา</th><th>ความยาว (เมตร)</th><th>น้ำหนักรวม (กก.)</th><th>จำนวน</th><th>ราคารวม (บาท)</th></tr></thead><tbody>
      ${lines.map((l) => `<tr><td><img src="${A(l.img)}" alt=""></td><td style="text-align:left;font-weight:700">${esc(l.name)}</td><td>${l.t} mm</td><td>6</td><td>${num(l.kg, 2)}</td><td>${l.qty}</td><td class="amt">${money(l.price * l.qty)}</td></tr>`).join('')}
    </tbody></table></div>`;
  }
  const linesFromCart = () => totals().lines.map((l) => { const i = SHOP.lineInfo(l); return { img: i.p.img, name: i.p.name, t: l.t, kg: i.kg, qty: l.qty, price: i.p.price }; });

  // ---------- modal / toast ----------
  function modal({ title, sub = '', body = '', ok = 'ยืนยัน', cancel = 'ยกเลิก', onOk, danger }) {
    const back = document.createElement('div');
    back.className = 'modal-back';
    back.innerHTML = `<div class="modal" role="dialog" aria-modal="true"><h3>${esc(title)}</h3>${sub ? `<p class="muted">${sub}</p>` : ''}<div style="margin-top:16px">${body}</div>
      <div class="foot">${cancel ? `<button class="btn" data-x>${esc(cancel)}</button>` : ''}<button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-ok>${esc(ok)}</button></div></div>`;
    const close = () => back.remove();
    back.addEventListener('click', (e) => { if (e.target === back || e.target.closest('[data-x]')) close(); });
    $('[data-ok]', back).addEventListener('click', () => { if (!onOk || onOk(back) !== false) close(); });
    document.body.appendChild(back);
    ($('input', back) || $('[data-ok]', back)).focus();
    return back;
  }
  function formModal(title, fields, onSave) {
    modal({
      title, ok: 'บันทึก',
      body: fields.map(([k, label, ph]) => `<div class="field"><label>${label}</label><input class="input" data-k="${k}" placeholder="${esc(ph || '')}"></div>`).join(''),
      onOk: (m) => {
        const out = {}; let ok = true;
        $$('[data-k]', m).forEach((i) => { out[i.dataset.k] = i.value.trim(); i.classList.toggle('invalid', !i.value.trim()); if (!i.value.trim()) ok = false; });
        if (!ok) { toast('กรุณากรอกข้อมูลให้ครบ', 'warn'); return false; }
        onSave(out);
      },
    });
  }
  function toast(msg, tone = 'ok', html = '') {
    let host = $('.toasts');
    if (!host) { host = document.createElement('div'); host.className = 'toasts'; document.body.appendChild(host); }
    const t = document.createElement('div');
    t.className = `toast ${tone}`;
    t.innerHTML = `${icon(tone === 'ok' ? 'check' : 'info', 18, 2.4)}<span>${esc(msg)}${html}</span>`;
    host.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  }

  function requireLogin(then) {
    if (SHOP.state.user) return then();
    modal({
      title: 'เข้าสู่ระบบ / สมัครสมาชิก', sub: 'เข้าสู่ระบบเพื่อดำเนินการสั่งซื้อและติดตามคำสั่งซื้อ', ok: 'เข้าสู่ระบบ',
      body: `<div class="field"><label>อีเมลหรือเบอร์โทรศัพท์</label><input class="input" value="mrSteel@hotmail.com"></div>
        <div class="field"><label>รหัสผ่าน</label><input class="input" type="password" value="password"></div>
        <p class="muted" style="font-size:14px;margin-top:10px">ต้นแบบ: กดเข้าสู่ระบบได้ทันทีด้วยบัญชีตัวอย่าง</p>`,
      onOk: () => { SHOP.actions.login(); toast('เข้าสู่ระบบแล้ว'); then && setTimeout(then, 0); },
    });
  }

  window.UI = { icon, $, $$, A, crumbs, productCard, postCard, stepper, summary, itemsTable, linesFromCart, modal, formModal, toast, requireLogin };
})();
