// Mobile UI helpers: icons, product card, stepper, summary card, bottom sheet, toast.
(function () {
  const { esc, money, num, totals } = SHOP;
  const P = {
    back: '<path d="m15 18-6-6 6-6"/>',
    chevRight: '<path d="m9 18 6-6-6-6"/>',
    chevDown: '<path d="m6 9 6 6 6-6"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
    home: '<path d="M3 10 12 3l9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
    cart: '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
    orders: '<rect x="4" y="3" width="13" height="18" rx="2"/><path d="M8 8h5M8 12h5M8 16h3"/><path d="M17 8h3v11a2 2 0 0 1-2 2"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
    trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    porter: '<circle cx="12" cy="4" r="2"/><path d="M12 6v7l-3 8M12 13l3 8M8 9h8M7 2l-3 5h6"/>',
    lift: '<path d="M3 21h4l2-6h6l2 6h4"/><circle cx="7" cy="18" r="1.5"/><circle cx="17" cy="18" r="1.5"/><path d="M9 15V5h3l3 10"/>',
  };
  const icon = (n, s = 24, sw = 1.8) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] || ''}</svg>`;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const A = (f) => `assets/${f}`;
  // Overlays mount inside the phone screen so they stay within the iPhone frame on desktop.
  const layer = () => document.querySelector('.screen') || document.body;

  function pcard(p) {
    const fav = SHOP.state.fav.includes(p.id);
    return `<a class="pcard" href="#/product/${p.id}">
      <div class="im"><img src="${A(p.img)}" alt="" loading="lazy"><button class="fav${fav ? ' on' : ''}" data-fav="${p.id}" aria-label="รายการโปรด">${icon('heart', 15, 2)}</button></div>
      <div class="i"><div class="n">${esc(p.name)}</div><div class="sku">SKU : ${p.sku}</div>
        <div class="rec">แนะนำ :<br>${p.tags.map(esc).join(', ')}</div>
        <div class="pl"><small>ราคา (บาท)</small><b>${money(p.price)}</b>${p.stock <= 0 ? '<div class="oos">สินค้าหมด</div>' : ''}</div></div></a>`;
  }

  // Horizontal carousel with dots synced to scroll position.
  function bindCarousel(track, dots) {
    if (!track || !dots) return;
    const n = track.children.length;
    dots.innerHTML = Array.from({ length: n }, (_, i) => `<i class="${i ? '' : 'on'}"></i>`).join('');
    track.addEventListener('scroll', () => {
      const w = track.children[0].getBoundingClientRect().width + 8;
      const i = Math.min(n - 1, Math.round(track.scrollLeft / w));
      $$('i', dots).forEach((d, j) => d.classList.toggle('on', j === i));
    }, { passive: true });
  }

  function stepper(step) {
    const lbl = ['ที่อยู่จัดส่ง', 'บริการเสริม', 'ชำระเงิน', 'สถานะ'];
    return `<div class="mstepper"><div class="top"><span>กระบวนการสั่งซื้อ</span><span>${step}/4 ขั้นตอน</span></div><div class="msteps">
      ${lbl.map((l, i) => `${i ? `<span class="line ${i < step ? 'on' : ''}"></span>` : ''}<div class="s ${i < step ? 'on' : ''}"><i>${i + 1}</i>${l}</div>`).join('')}</div></div>`;
  }

  function summaryCard(opts = {}) {
    const t = totals();
    const net = opts.addons ? t.total : t.beforeAddons;
    return `<div class="card"><h4 style="font-size:17px;color:var(--primary);margin-bottom:8px">สรุปคำสั่งซื้อ</h4>
      ${opts.breakdown && t.addonLines.length ? `<div class="green-box" style="margin-bottom:10px">${t.addonLines.map(([n, p, q]) => `<div class="kv"><span class="muted">${n}<br>${money(p)} x ${q}</span><span class="pos">+${money(p * q)}</span></div>`).join('')}
        <div class="kv pos"><b>บริการเสริม (บาท)</b><b>${money(t.addons)} บาท</b></div></div>` : ''}
      <div class="kv"><span>น้ำหนักรวม (กก.)</span><span>${num(t.weight, 2)}</span></div>
      <div class="kv"><span>จำนวนรายการ</span><span>${t.count}</span></div><hr class="hr">
      <div class="kv"><span>ราคาสินค้าทั้งหมด (บาท)</span><span>${money(t.subtotal)}</span></div>
      <div class="kv"><span>ส่วนลด (บาท)</span><span>-${money(t.discount)}</span></div><hr class="hr">
      <div class="kv"><b>ราคาขนส่ง</b></div>
      <div class="kv ${opts.shipHi ? 'green-row' : ''}"><span>ค่าจัดส่ง (บาท)</span><b>${t.shipping ? money(t.shipping) : 'ฟรี'}</b></div>
      ${opts.addons ? `<hr class="hr"><div class="kv"><b>ราคาบริการเสริม</b></div>
        <div class="${opts.addHi ? 'green-row' : ''}"><div class="kv"><span>บริการเสริม (บาท)</span><b>${money(t.addons)}</b></div><div class="kv"><span>ค่าธรรมเนียม 7% (บาท)</span><b>${money(t.fee)}</b></div></div>` : ''}
      <hr class="hr"><div class="kv" style="font-size:17px"><b>ยอดรวมสุทธิ (บาท)</b><b>${money(net)}</b></div>
      ${opts.addons ? '' : '<p class="muted" style="font-size:13px">(ไม่รวมค่าบริการเสริม)</p>'}
      ${opts.action || ''}</div>`;
  }

  function sheet({ title, sub = '', body = '', ok = 'ยืนยัน', cancel = 'ยกเลิก', onOk, danger }) {
    const back = document.createElement('div');
    back.className = 'sheet-back';
    back.innerHTML = `<div class="sheet" role="dialog" aria-modal="true"><h3>${esc(title)}</h3>${sub ? `<p class="muted">${sub}</p>` : ''}<div style="margin-top:12px">${body}</div>
      <div class="foot">${cancel ? `<button class="btn" data-x>${esc(cancel)}</button>` : ''}<button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-ok>${esc(ok)}</button></div></div>`;
    const close = () => back.remove();
    back.addEventListener('click', (e) => { if (e.target === back || e.target.closest('[data-x]')) close(); });
    $('[data-ok]', back).addEventListener('click', () => { if (!onOk || onOk(back) !== false) close(); });
    layer().appendChild(back);
    return back;
  }
  function formSheet(title, fields, onSave) {
    sheet({
      title, ok: 'บันทึก',
      body: fields.map(([k, l]) => `<div class="field"><label>${l}</label><input class="input" data-k="${k}"></div>`).join(''),
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
    if (!host) { host = document.createElement('div'); host.className = 'toasts'; layer().appendChild(host); }
    const t = document.createElement('div');
    t.className = `toast ${tone}`;
    t.innerHTML = `${icon(tone === 'ok' ? 'check' : 'info', 18, 2.4)}<span>${esc(msg)}${html}</span>`;
    host.appendChild(t);
    setTimeout(() => t.remove(), 2600);
  }
  function requireLogin(then) {
    if (SHOP.state.user) return then();
    sheet({
      title: 'เข้าสู่ระบบ', sub: 'เข้าสู่ระบบเพื่อสั่งซื้อและติดตามคำสั่งซื้อ', ok: 'เข้าสู่ระบบ',
      body: `<div class="field"><label>อีเมลหรือเบอร์โทรศัพท์</label><input class="input" value="mrSteel@hotmail.com"></div><div class="field"><label>รหัสผ่าน</label><input class="input" type="password" value="password"></div>
        <p class="muted" style="font-size:13px;margin-top:8px">ต้นแบบ: กดเข้าสู่ระบบได้ทันทีด้วยบัญชีตัวอย่าง</p>`,
      onOk: () => { SHOP.actions.login(); toast('เข้าสู่ระบบแล้ว'); setTimeout(then, 0); },
    });
  }

  window.UI = { icon, $, $$, A, pcard, bindCarousel, stepper, summaryCard, sheet, formSheet, toast, requireLogin };
})();
