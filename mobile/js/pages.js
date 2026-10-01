// Mobile pages.
(function () {
  const { esc, money, num, product, category, totals, actions, CATEGORIES, PRODUCTS, FEATURED, PROMOS, ARTICLES, COUPONS, tubeSpec, kgPerM } = SHOP;
  const { icon, $, $$, A, pcard, bindCarousel, stepper, summaryCard, sheet, formSheet, toast, requireLogin } = UI;
  const S = () => SHOP.state;
  const refresh = () => APP.refresh();

  // ---------- หน้าหลัก ----------
  PAGES.home = function (root) {
    root.innerHTML = `
      <div class="sec-head"><h2>โปรโมชัน</h2><a href="#/products" aria-label="ดูโปรโมชันทั้งหมด">${icon('chevRight', 26, 2.4)}</a></div>
      <div class="hscroll" data-c="promo">${PROMOS.map((p) => `<a class="post" href="#/products"><img src="${A(p.img)}" alt=""><div class="b"><b>${esc(p.title)}</b><span>${esc(p.sub)}</span><small>สิ้นสุด ${p.end}</small></div></a>`).join('')}</div>
      <div class="dots" data-d="promo"></div>
      <div class="sec-head"><h2>หมวดหมู่</h2><a href="#/products" aria-label="ดูหมวดหมู่ทั้งหมด">${icon('chevRight', 26, 2.4)}</a></div>
      <div class="hscroll" data-c="cat">${CATEGORIES.map((c) => `<a class="cat" href="#/products?cat=${c.id}"><img src="${A(c.img)}" alt=""><b>${c.name}</b><span>${c.desc}</span></a>`).join('')}</div>
      <div class="dots" data-d="cat"></div>
      <div class="sec-head"><h2>สินค้าแนะนำ</h2><a href="#/products" aria-label="ดูสินค้าทั้งหมด">${icon('chevRight', 26, 2.4)}</a></div>
      <div class="pgrid">${FEATURED.map((id) => pcard(product(id))).join('')}</div>
      <div class="sec-head"><h2>บทความ</h2></div>
      <div class="hscroll" data-c="art">${ARTICLES.map((a) => `<div class="post" data-art="${esc(a.title)}"><img src="${A(a.img)}" alt=""><div class="b"><b>${esc(a.title)}</b><span>${esc(a.sub)}</span></div></div>`).join('')}</div>
      <div class="dots" data-d="art"></div>`;
    ['promo', 'cat', 'art'].forEach((k) => bindCarousel($(`[data-c="${k}"]`, root), $(`[data-d="${k}"]`, root)));
    root.addEventListener('click', (e) => {
      const a = e.target.closest('[data-art]');
      if (a) { const x = ARTICLES.find((y) => y.title === a.dataset.art); sheet({ title: x.title, body: `<img src="${A(x.img)}" alt="" style="border-radius:12px;margin-bottom:10px"><p>${esc(x.sub)}</p><p class="muted" style="margin-top:8px;font-size:13px">หน้ารายละเอียดบทความยังไม่มีในไฟล์ Figma</p>`, ok: 'ปิด', cancel: '' }); }
    });
  };

  // ---------- รายการสินค้า ----------
  const L = { key: '', q: '', sort: 'rec', usage: new Set(), types: new Set(), stds: new Set(), size: 'ทั้งหมด', inStock: false, shown: 6 };
  const resetFilters = () => Object.assign(L, { usage: new Set(), types: new Set(), stds: new Set(), size: 'ทั้งหมด', inStock: false, shown: 6 });
  PAGES.products = function (root, _p, query) {
    const key = `${query.cat || ''}|${query.q || ''}`;
    if (L.key !== key) { resetFilters(); Object.assign(L, { key, q: query.q || '' }); }
    const cat = category(query.cat);
    const base = PRODUCTS.filter((p) => !cat || p.cat === cat.id);
    const q = L.q.trim().toLowerCase();
    let r = base.filter((p) => (!q || (p.name + p.sku).toLowerCase().includes(q)) &&
      (!L.usage.size || p.tags.some((t) => L.usage.has(t))) && (!L.types.size || L.types.has(p.type)) &&
      (!L.stds.size || L.stds.has(p.standard)) && (L.size === 'ทั้งหมด' || p.size === L.size) && (!L.inStock || p.stock > 0));
    if (L.sort === 'asc') r = r.slice().sort((a, b) => a.price - b.price);
    if (L.sort === 'desc') r = r.slice().sort((a, b) => b.price - a.price);
    const nf = L.usage.size + L.types.size + L.stds.size + (L.size !== 'ทั้งหมด' ? 1 : 0) + (L.inStock ? 1 : 0);
    root.innerHTML = `
      <div class="field"><label>ค้นหา</label><label class="search-in">${icon('search', 18, 2)}<input data-q placeholder="ค้นหาสินค้า" value="${esc(L.q)}"></label></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px">
        <div class="field"><label>เรียงตาม</label><select class="select" data-sort>${[['rec', 'สินค้าแนะนำ'], ['asc', 'ราคาต่ำ → สูง'], ['desc', 'ราคาสูง → ต่ำ']].map(([v, l]) => `<option value="${v}" ${L.sort === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
        <div class="field" style="margin-top:0"><label>ตัวกรอง</label><button class="select" data-filter style="text-align:left;color:${nf ? 'var(--primary)' : 'var(--muted)'};font-weight:${nf ? 700 : 400}">${nf ? `ตัวกรอง (${nf})` : 'ตัวกรอง'}</button></div>
      </div>
      <hr class="hr" style="margin:16px 0 12px">
      <h2 style="font-size:20px;color:var(--primary)">${esc(cat ? cat.name : L.q ? `ผลการค้นหา “${L.q}”` : 'สินค้าทั้งหมด')}</h2>
      <p class="muted" style="font-size:13px;margin-bottom:12px">ค้นพบ ${num(r.length)} รายการ</p>
      ${r.length ? `<div class="pgrid">${r.slice(0, L.shown).map(pcard).join('')}</div>
        ${r.length > L.shown ? `<button class="btn" style="margin-top:16px" data-more>โหลดเพิ่ม (${r.length - L.shown})</button>` : ''}` : '<div class="empty">ไม่พบสินค้าที่ตรงกับเงื่อนไข</div>'}`;
    const qi = $('[data-q]', root);
    if (query.focus) setTimeout(() => qi.focus(), 50);
    let deb;
    qi.addEventListener('input', () => { clearTimeout(deb); deb = setTimeout(() => { L.q = qi.value; L.shown = 6; refresh(); const i = $('[data-q]'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 350); });
    $('[data-sort]', root).addEventListener('change', (e) => { L.sort = e.target.value; refresh(); });
    root.addEventListener('click', (e) => {
      if (e.target.closest('[data-more]')) { L.shown += 6; refresh(); }
      if (e.target.closest('[data-filter]')) {
        const uniq = (f) => [...new Set(base.flatMap(f))];
        const group = (title, name, items, set) => `<b>${title}</b><div style="display:grid;gap:10px;margin:10px 0 18px">${items.map((v) => `<label class="check"><input type="checkbox" data-g="${name}" value="${esc(v)}" ${set.has(v) ? 'checked' : ''}> ${esc(v)}</label>`).join('')}</div>`;
        const sizes = uniq((p) => (p.size ? [p.size] : []));
        sheet({
          title: 'ตัวกรอง', ok: 'แสดงผล', cancel: 'ล้างตัวกรอง',
          body: group('การใช้งาน', 'usage', uniq((p) => p.tags), L.usage) + group('ประเภทเหล็ก', 'types', uniq((p) => [p.type]), L.types) +
            (sizes.length ? `<b>ขนาดหน้าตัด (มม.)</b><div class="muted" style="font-size:12px">* ขึ้นอยู่กับประเภทเหล็ก</div><select class="select" data-size style="margin:8px 0 18px">${['ทั้งหมด', ...sizes].map((v) => `<option ${v === L.size ? 'selected' : ''}>${v}</option>`).join('')}</select>` : '') +
            `<b>ความยาว (ม.)</b><select class="select" style="margin:8px 0 18px"><option>6</option></select>` +
            group('มาตรฐาน', 'stds', uniq((p) => [p.standard]), L.stds) +
            `<label class="check"><input type="checkbox" data-stock ${L.inStock ? 'checked' : ''}> แสดงเฉพาะรายการที่มีสินค้า</label>`,
          onOk: (m) => {
            for (const g of ['usage', 'types', 'stds']) L[g] = new Set($$(`[data-g="${g}"]`, m).filter((i) => i.checked).map((i) => i.value));
            const sz = $('[data-size]', m); L.size = sz ? sz.value : 'ทั้งหมด';
            L.inStock = $('[data-stock]', m).checked; L.shown = 6; refresh();
          },
        }).querySelector('[data-x]').addEventListener('click', () => { resetFilters(); refresh(); });
      }
    });
  };

  // ---------- รายละเอียดสินค้า ----------
  const pick = {};
  PAGES.detail = function (root, { id }) {
    const p = product(id);
    if (!p) { root.innerHTML = '<div class="empty">ไม่พบสินค้า</div>'; return; }
    const st = pick[id] = pick[id] || { t: p.thicknesses[0], qty: 1, tab: 0 };
    const kg = kgPerM(p, st.t);
    const cat = category(p.cat);
    const pos = ['center', 'left', 'right', 'top'];
    root.innerHTML = `
      <div class="gallery"><div class="hscroll" data-c>${pos.map((o) => `<img src="${A(p.img)}" alt="" style="object-position:${o}">`).join('')}</div><div class="dots" data-d></div></div>
      <h2 class="d-title">${esc(p.name)}</h2>
      <div class="muted" style="font-size:14px">SKU : ${p.sku}</div>
      <div class="muted" style="font-size:14px">แนะนำ : ${p.tags.map(esc).join(', ')}</div>
      <div class="d-label">ความหนา (มม.)</div>
      <div class="chips">${p.thicknesses.map((t) => `<button class="chip ${t === st.t ? 'on' : ''}" data-t="${t}">${t}</button>`).join('')}</div>
      ${p.family === 'tube' ? `<div class="d-label">ขนาด (มม.)</div><div class="chips">${SHOP.TUBE_SIZES.map((s) => { const q = product('tube-' + s.split('x')[0]); return `<a class="chip ${q.id === p.id ? 'on' : ''} ${q.stock ? '' : 'off'}" href="#/product/${q.id}">${s}</a>`; }).join('')}</div>` : ''}
      <hr class="hr" style="margin:16px 0">
      <h3 style="font-size:18px;color:var(--primary);margin-bottom:6px">สรุปรายการ</h3>
      <div class="kv muted"><span>ความยาวรวม (ม.)</span><b style="color:var(--text)">${6 * st.qty}</b></div>
      <div class="kv muted"><span>น้ำหนักรวม (กก.)</span><b style="color:var(--text)">${num(kg * 6 * st.qty, 2)}</b></div>
      <div class="kv" style="align-items:center"><span class="muted">ราคารวม (บาท)</span><b style="font-size:28px;color:var(--primary)">${money(p.price * st.qty)}</b></div>
      <hr class="hr">
      <div class="muted" style="font-size:14px">คงเหลือ: ${p.stock ? p.stock : '<b style="color:var(--danger)">สินค้าหมด</b>'}</div>
      <div style="display:flex;gap:8px;margin-top:6px"><div class="qty ${p.stock ? '' : 'disabled'}"><button data-q="-1" aria-label="ลด">-</button><input value="${st.qty}" data-qty inputmode="numeric" aria-label="จำนวน"><button data-q="1" aria-label="เพิ่ม">+</button></div>
        <button class="btn btn-primary" style="width:66px;height:40px" data-add ${p.stock ? '' : 'disabled'} aria-label="เพิ่มเข้าตะกร้า">${icon('cart', 24, 2)}</button>
        <button class="btn" style="width:48px;height:40px;${S().fav.includes(p.id) ? 'background:var(--primary);color:#fff' : ''}" data-fav="${p.id}" aria-label="รายการโปรด">${icon('heart', 20, 2)}</button></div>
      <button class="btn" style="margin-top:8px;height:40px;font-size:15px;${S().compare.includes(p.id) ? 'background:var(--primary);color:#fff' : ''}" data-compare="${p.id}">${S().compare.includes(p.id) ? '✓ อยู่ในรายการเปรียบเทียบ' : 'เพิ่มในรายการเปรียบเทียบ'}</button>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px"><button class="btn" style="height:40px;font-size:14px" data-dl="ใบอนุญาต">${icon('download', 16)} ดาวน์โหลดใบอนุญาต</button><button class="btn" style="height:40px;font-size:14px" data-dl="เอกสารสินค้า">${icon('download', 16)} ดาวน์โหลดเอกสารสินค้า</button></div>
      <div class="tabs"><button class="${st.tab ? '' : 'on'}" data-tab="0">รายละเอียด</button><button class="${st.tab ? 'on' : ''}" data-tab="1">ข้อมูลเทคนิค</button></div>
      ${st.tab === 0 ? `<div class="spec">${[['หมวดหมู่', cat.name], ['ประเภทเหล็ก', p.type], ['กระบวนการผลิต', p.process], ['ผิวเหล็ก', p.finish], ['หน่วยขาย', p.unit]].map(([k, v]) => `<div class="kv"><span>${k}</span><span>${esc(v)}</span></div>`).join('')}</div>
        <p class="muted" style="font-size:13px;line-height:1.5;margin-top:12px">${esc(p.desc)}</p>`
      : `<h4 style="color:var(--primary);margin-bottom:8px">ตารางการใช้งานสินค้า</h4>
        <table class="mtable"><thead><tr><th>ขนาด<br>(กว้างxยาวxสูง)</th><th>ความหนา<br>(มม.)</th><th>น้ำหนัก<br>(กก./ม.)</th></tr></thead><tbody>
        ${p.thicknesses.map((t) => `<tr${t === st.t ? ' style="background:var(--primary-soft)"' : ''}><td>${p.size || '-'}</td><td>${t}</td><td>${(p.family === 'tube' ? tubeSpec(p.side, t).kgm : p.kgm).toFixed(2)}</td></tr>`).join('')}</tbody></table>
        <h4 style="color:var(--primary);margin:16px 0 8px">มาตรฐานที่รองรับ</h4>
        <div class="mtable"><div class="std"><span>${esc(p.standard)}</span><span>มาตรฐานผลิตภัณฑ์อุตสาหกรรม ท่อเหล็กกล้าสำหรับงานโครงสร้างทั่วไป</span></div></div>
        <h4 style="color:var(--primary);margin:16px 0 8px">เกรดที่รองรับ</h4>
        <div class="mtable"><div class="std"><span>SS400</span><span>ความยาวมาตรฐาน 6 ม.</span></div><div class="std"><span>STKR400</span><span>ความยาวมาตรฐาน 6 ม.</span></div></div>`}`;
    bindCarousel($('[data-c]', root), $('[data-d]', root));
    root.addEventListener('click', (e) => {
      const t = e.target.closest('[data-t]'); if (t) { st.t = +t.dataset.t; refresh(); }
      const tb = e.target.closest('[data-tab]'); if (tb) { st.tab = +tb.dataset.tab; refresh(); }
      const q = e.target.closest('[data-q]'); if (q) { st.qty = Math.max(1, Math.min(p.stock, st.qty + +q.dataset.q)); refresh(); }
      const dl = e.target.closest('[data-dl]'); if (dl) toast(`ดาวน์โหลด${dl.dataset.dl} (ต้นแบบ — ยังไม่มีไฟล์จริง)`, 'warn');
      if (e.target.closest('[data-add]')) { actions.addToCart(p.id, st.t, st.qty); toast(`เพิ่ม ${st.qty} เส้นเข้าตะกร้าแล้ว`, 'ok', ' <a href="#/cart">ดูตะกร้า</a>'); st.qty = 1; refresh(); }
    });
    $('[data-qty]', root).addEventListener('change', (e) => { st.qty = Math.max(1, Math.min(p.stock, parseInt(e.target.value, 10) || 1)); refresh(); });
  };

  // ---------- ตะกร้า ----------
  PAGES.cart = function (root) {
    const s = S(), t = totals(), c = s.coupon && COUPONS[s.coupon];
    root.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><h2 style="font-size:18px;color:var(--primary)">ตะกร้า (${s.cart.length} รายการ)</h2>
        ${s.cart.length ? '<div style="display:flex;gap:6px"><button class="btn btn-sm" data-all>เลือกทั้งหมด</button><button class="btn btn-sm btn-danger" data-clear>ล้างทั้งหมด</button></div>' : ''}</div>
      ${s.cart.length ? `
      <div class="card" style="margin-bottom:12px;padding:20px 24px"><h2 style="font-size:24px;margin-bottom:12px">ส่วนลด</h2>
        <form data-coupon style="display:flex;gap:8px"><input class="input" name="code" style="border-color:var(--primary)" value="${esc(s.coupon || '')}" placeholder="กรอกโค้ดส่วนลด"><button class="btn btn-primary" style="width:60px">เพิ่ม</button></form>
        ${c ? `<div class="blue-box" style="margin-top:12px"><b style="color:var(--primary);font-size:17px">${c.label}</b><div class="muted">ขั้นต่ำ ${money(c.min)} บาท</div>${t.couponNote ? `<div style="color:var(--danger);font-size:13px">${esc(t.couponNote)}</div>` : ''}<div class="muted" style="font-size:12px">ใช้ได้ถึง : ${c.until}</div>
          <div style="display:flex;gap:16px;margin-top:4px"><a style="color:var(--primary);text-decoration:underline" data-terms>เงื่อนไข</a><a style="color:var(--danger);text-decoration:underline" data-rmc>ลบโค้ด</a></div></div>` : '<p class="muted" style="font-size:13px;margin-top:8px">ลองใช้โค้ด SALE10</p>'}
      </div>
      ${s.cart.map((l, i) => { const x = SHOP.lineInfo(l); const on = l.sel && !x.out; return `<div class="citem ${on ? 'sel' : ''} ${x.out ? 'out' : ''}">
        <label class="check"><input type="checkbox" data-sel="${i}" ${on ? 'checked' : ''} ${x.out ? 'disabled' : ''} aria-label="เลือก"></label>
        <img src="${A(x.p.img)}" alt="">
        <div><div class="n"><a href="#/product/${x.p.id}">${esc(x.p.name)}</a><button class="trash" data-rm="${i}" aria-label="ลบ">${icon('trash', 14)}</button></div>
          <div class="s">SKU ${x.p.sku}</div><div class="s" style="margin-top:4px">ตัวเลือกที่เลือก : ความหนา(มม.) : ${l.t}${x.p.size ? `, ขนาด(มม.) : ${x.p.size}` : ''}</div>
          <div class="row"><div><div class="s" style="color:var(--text)">สินค้าคงเหลือ : <b>${x.out ? '<span style="color:var(--danger)">สินค้าหมด</span>' : x.p.stock}</b></div>
            <div class="qty sm ${x.out ? 'disabled' : ''}" style="margin-top:4px"><button data-dq="${i}|-1">-</button><input value="${l.qty}" data-qi="${i}" aria-label="จำนวน"><button data-dq="${i}|1">+</button></div></div>
            <div class="tot"><span style="font-size:13px">${x.p.unit}</span><b>${money(x.total)} บาท</b></div></div></div></div>`; }).join('')}
      ${t.count ? `<div class="cart-bar">
        <button class="cart-bar-sum" data-summary aria-label="ดูสรุปคำสั่งซื้อ"><small>ยอดรวมสุทธิ · ${t.count} รายการ ${icon('chevDown', 14, 2.4).replace('<svg', '<svg style="transform:rotate(180deg);vertical-align:-2px"')}</small><b>${money(t.subtotal - t.discount)} บาท</b>${t.discount ? `<small class="pos">ส่วนลด -${money(t.discount)}</small>` : ''}</button>
        <button class="btn btn-primary" style="width:auto;padding:0 28px;height:44px" data-next>ถัดไป</button>
      </div>` : '<p class="muted" style="text-align:center;margin:20px 0 0;font-size:14px">เลือกสินค้าที่ต้องการสั่งซื้อ เพื่อดูสรุปคำสั่งซื้อ</p>'}
` : '<div class="empty">ตะกร้าของคุณว่างอยู่<a class="btn btn-primary" href="#/products">เลือกซื้อสินค้า</a></div>'}`;
    root.addEventListener('click', (e) => {
      const d = e.target.closest('[data-dq]'); if (d) { const [i, n] = d.dataset.dq.split('|').map(Number); actions.setQty(i, s.cart[i].qty + n); return refresh(); }
      const rm = e.target.closest('[data-rm]'); if (rm) return sheet({ title: 'ลบสินค้าออกจากตะกร้า', body: esc(product(s.cart[+rm.dataset.rm].pid).name), ok: 'ลบ', danger: true, onOk: () => { actions.removeLine(+rm.dataset.rm); refresh(); } });
      if (e.target.closest('[data-all]')) { actions.selectAll(); refresh(); }
      if (e.target.closest('[data-clear]')) sheet({ title: 'ล้างตะกร้าทั้งหมด', body: 'ต้องการลบสินค้าทั้งหมดออกจากตะกร้าใช่หรือไม่?', ok: 'ล้างทั้งหมด', danger: true, onOk: () => { actions.clearCart(); refresh(); } });
      if (e.target.closest('[data-rmc]')) { actions.removeCoupon(); refresh(); }
      if (e.target.closest('[data-terms]')) sheet({ title: `เงื่อนไขโค้ด ${s.coupon}`, body: `<ul style="padding-left:18px;line-height:1.8;margin:0"><li>${esc(c.label)}</li><li>ขั้นต่ำ ${money(c.min)} บาท</li><li>ใช้ได้ถึง ${c.until}</li></ul>`, ok: 'ปิด', cancel: '' });
      if (e.target.closest('[data-next]')) requireLogin(() => (location.hash = '#/checkout/address'));
      if (e.target.closest('[data-summary]')) sheet({
        title: 'สรุปคำสั่งซื้อ', ok: 'ถัดไป', cancel: 'ปิด',
        body: `<div class="kv"><span>โค้ดส่วนลด</span><b style="color:var(--primary)">${esc(s.coupon || '-')}</b></div><hr class="hr">
          <div class="kv"><span>น้ำหนักรวม</span><span>${num(t.weight, 2)} กก.</span></div><div class="kv"><span>จำนวนรายการ</span><span>${t.count} รายการ</span></div><hr class="hr">
          <div class="kv"><span>ราคาสินค้าทั้งหมด (บาท)</span><span>${money(t.subtotal)}</span></div><div class="kv"><span>ส่วนลด (บาท)</span><span>-${money(t.discount)}</span></div>
          <div class="kv" style="font-size:16px"><b>ยอดรวมสุทธิ (บาท)</b><b>${money(t.subtotal - t.discount)}</b></div>
          <p class="muted" style="font-size:12px">(ไม่รวมค่าจัดส่งและค่าบริการเสริม)</p>`,
        onOk: () => requireLogin(() => (location.hash = '#/checkout/address')),
      });
    });
    root.addEventListener('change', (e) => {
      if (e.target.dataset.sel !== undefined) { actions.toggleSel(+e.target.dataset.sel); refresh(); }
      if (e.target.dataset.qi !== undefined) { actions.setQty(+e.target.dataset.qi, parseInt(e.target.value, 10) || 1); refresh(); }
    });
    const f = $('[data-coupon]', root);
    f && f.addEventListener('submit', (e) => { e.preventDefault(); actions.applyCoupon(f.code.value) ? toast('ใช้โค้ดส่วนลดแล้ว') : toast('ไม่พบโค้ดส่วนลดนี้', 'warn'); refresh(); });
  };

  const needLines = (root) => {
    if (totals().count) return false;
    root.innerHTML = '<div class="empty">ยังไม่มีสินค้าที่เลือกสำหรับสั่งซื้อ<a class="btn btn-primary" href="#/cart">กลับไปที่ตะกร้า</a></div>';
    return true;
  };

  // ---------- ที่อยู่จัดส่ง ----------
  PAGES.address = function (root) {
    if (needLines(root)) return;
    const s = S(), k = s.checkout, u = s.user;
    const opts = (name, list, sel, title, sub) => list.map((x, i) => `<label class="opt ${sel === i ? 'on' : ''}"><input type="radio" name="${name}" value="${i}" ${sel === i ? 'checked' : ''}><b>${esc(title(x, i))}</b><small>${sub(x)}</small></label>`).join('');
    root.innerHTML = `${stepper(1)}
      <div class="card"><h3 style="display:block">ข้อมูลผู้สั่งซื้อ<br><small class="muted" style="font-weight:400;font-size:13px">* (สามารถแก้ไขข้อมูลได้ที่ แก้ไขโปรไฟล์)</small></h3>
        <b>คุณ ${esc(u.name)}</b><div class="muted" style="font-size:14px">เบอร์โทรศัพท์ : ${u.phone}<br>อีเมล : ${u.email}</div></div>
      <div class="card"><h3>ข้อมูลผู้รับ <button class="btn btn-sm btn-primary" data-add="recipient">เพิ่มข้อมูล</button></h3>
        ${opts('recipient', s.recipients, k.recipient, (r, i) => r.name + (i === 0 ? ' (ค่าเริ่มต้น)' : ''), (r) => `เบอร์โทรศัพท์ : ${r.phone}<br>อีเมล : ${esc(r.email)}`)}</div>
      <div class="card"><h3>ที่อยู่จัดส่ง <button class="btn btn-sm btn-primary" data-add="address">เพิ่มข้อมูล</button></h3>
        ${opts('address', s.addresses, k.address, (a, i) => a.title + (i === 0 ? ' (ค่าเริ่มต้น)' : ''), (a) => esc(a.full))}</div>
      <div class="card"><h3>ขอใบกำกับภาษี <button class="btn btn-sm btn-primary" data-add="tax">เพิ่มข้อมูล</button></h3>
        <label class="check" style="margin-bottom:6px"><input type="checkbox" data-taxw ${k.taxWanted ? 'checked' : ''}> ต้องการใบกำกับภาษี</label>
        <div style="${k.taxWanted ? '' : 'opacity:.4;pointer-events:none'}">${opts('tax', s.taxes, k.tax, (x) => x.name, (x) => `เลขประจำตัวผู้เสียภาษี : ${x.taxId}`)}</div></div>
      <div class="notes"><b>บริการจัดส่ง โดย The Steel Logistics</b><ul><li>จัดส่งทั่วประเทศ ภายใน 3-5 วันทำการ</li><li>จัดส่งฟรี สำหรับคำสั่งซื้อ 10,000 บาทขึ้นไป</li><li>ค่าจัดส่งคำนวณตามน้ำหนักรวมและระยะทาง</li><li>รับสินค้าด้วยตัวเองได้ที่คลังสินค้า ไม่มีค่าจัดส่ง</li></ul></div>
      <div style="margin-top:16px">${summaryCard({ shipHi: true, action: '<a class="btn btn-primary" style="margin-top:12px" href="#/checkout/addons">ถัดไป</a>' })}</div>`;
    root.addEventListener('change', (e) => {
      const t = e.target;
      if (['recipient', 'address', 'tax'].includes(t.name)) actions.setCheckout({ [t.name]: +t.value });
      if (t.matches('[data-taxw]')) actions.setCheckout({ taxWanted: t.checked });
      refresh();
    });
    root.addEventListener('click', (e) => {
      const a = e.target.closest('[data-add]'); if (!a) return;
      if (a.dataset.add === 'recipient') formSheet('เพิ่มข้อมูลผู้รับ', [['name', 'ชื่อ-นามสกุล'], ['phone', 'เบอร์โทรศัพท์'], ['email', 'อีเมล']], (v) => { actions.addRecipient(v); refresh(); });
      if (a.dataset.add === 'address') formSheet('เพิ่มที่อยู่จัดส่ง', [['title', 'ชื่อที่อยู่'], ['full', 'ที่อยู่เต็ม']], (v) => { actions.addAddress(v); refresh(); });
      if (a.dataset.add === 'tax') formSheet('เพิ่มข้อมูลใบกำกับภาษี', [['name', 'ชื่อบริษัท / ชื่อบุคคล'], ['taxId', 'เลขประจำตัวผู้เสียภาษี']], (v) => { actions.addTax(v); refresh(); });
    });
  };

  // ---------- บริการเสริม ----------
  PAGES.addons = function (root) {
    if (needLines(root)) return;
    const k = S().checkout;
    const dim = (on) => (on ? '' : 'opacity:.4;pointer-events:none');
    root.innerHTML = `${stepper(2)}
      <div class="card"><h3>บริการเสริม</h3>
        <label class="check"><input type="radio" name="want" value="1" ${k.addonsWanted ? 'checked' : ''}> ต้องการบริการเสริม</label>
        <div style="padding-left:16px;${dim(k.addonsWanted)}">
          <div class="hint">แนะนำ : คนยกสินค้า 2-3 คน</div>
          <div style="display:flex;justify-content:space-between;align-items:center"><label class="check" style="color:var(--primary);font-weight:700"><input type="checkbox" data-k="porter" ${k.porter ? 'checked' : ''}>${icon('porter', 20)} คนยกสินค้า</label>
            <input type="number" min="1" max="10" value="${k.porterQty}" data-pq style="width:66px;height:32px;border:1px solid var(--primary);border-radius:8px;text-align:center;font-weight:700;color:var(--primary);${dim(k.porter)}" aria-label="จำนวนคนยกสินค้า"></div>
          <div class="muted" style="font-size:12px;margin-left:30px">${money(SHOP.ADDON_PRICES.porter)} บาท/คน</div>
          <hr class="hr">
          <div class="hint">แนะนำ : อุปกรณ์ยกสินค้า 1</div>
          <label class="check" style="color:var(--primary);font-weight:700"><input type="checkbox" data-k="equip" ${k.equip ? 'checked' : ''}>${icon('lift', 20)} อุปกรณ์ยกสินค้า</label>
          <div style="display:grid;gap:8px;margin:8px 0 0 30px;${dim(k.equip)}">
            <label class="check"><input type="checkbox" data-k="equip1" ${k.equip1 ? 'checked' : ''}> อุปกรณ์ยกสินค้า 1 <span class="muted">(${money(SHOP.ADDON_PRICES.equip1)})</span></label>
            <label class="check"><input type="checkbox" data-k="equip2" ${k.equip2 ? 'checked' : ''}> อุปกรณ์ยกสินค้า 2 <span class="muted">(${money(SHOP.ADDON_PRICES.equip2)})</span></label></div>
        </div>
        <label class="check" style="margin-top:14px"><input type="radio" name="want" value="0" ${k.addonsWanted ? '' : 'checked'}> ไม่ต้องการบริการเสริม</label>
      </div>
      <div style="margin-top:16px">${summaryCard({ addons: true, breakdown: true, addHi: true, action: '<a class="btn btn-primary" style="margin-top:12px" href="#/checkout/payment">ชำระเงิน</a><button class="btn" style="margin-top:8px" data-quote>ขอใบเสนอราคา</button>' })}</div>`;
    root.addEventListener('change', (e) => {
      const t = e.target;
      if (t.name === 'want') actions.setCheckout({ addonsWanted: t.value === '1' });
      if (t.dataset.k) actions.setCheckout({ [t.dataset.k]: t.checked });
      if (t.matches('[data-pq]')) actions.setCheckout({ porterQty: Math.max(1, Math.min(10, parseInt(t.value, 10) || 1)) });
      refresh();
    });
    root.addEventListener('click', (e) => { if (e.target.closest('[data-quote]')) sheet({ title: 'ขอใบเสนอราคา', sub: 'ระบบจะส่งใบเสนอราคาไปยังอีเมลของคุณ', body: `<input class="input" data-qe value="${esc(S().user.email)}">`, ok: 'ส่งคำขอ',
      onOk: (m) => { const q = actions.requestQuote($('[data-qe]', m).value.trim()); toast(`ส่งคำขอ ${q.id} แล้ว`, 'ok', ' <a href="#/account/quotes">ดูประวัติ</a>'); } }); });
  };

  // ---------- ชำระเงิน ----------
  let qrTimer;
  PAGES.payment = function (root) {
    if (needLines(root)) return;
    const k = S().checkout, t = totals(), card = k.method === 'card';
    root.innerHTML = `${stepper(3)}
      <div class="card"><h3>วิธีการชำระเงิน</h3>
        <button class="pay-opt ${card ? 'on' : ''}" data-m="card">บัตรเครดิต/เดบิต</button><button class="pay-opt ${card ? '' : 'on'}" data-m="qr">โมบายแบงก์กิ้ง</button></div>
      ${card ? `<form class="card" data-cf novalidate><h3>ข้อมูลบัตรเครดิต/เดบิต</h3><div class="brands"><span>VISA</span><span>MASTERCARD</span><span>JCB</span></div>
        <div class="field"><label class="muted">ชื่อผู้ถือบัตรเครดิต/เดบิตภาษาอังกฤษ</label><input class="input" name="name" placeholder="SOMCHAI YODWISAWAKORN" autocomplete="cc-name"></div>
        <div class="field"><label class="muted">หมายเลขบัตรเครดิต *</label><input class="input" name="num" placeholder="4111 2222 3333 4444" inputmode="numeric" maxlength="19" autocomplete="cc-number"></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px"><div class="field"><label class="muted">วันหมดอายุ (MM/YY) *</label><input class="input" name="exp" placeholder="12/29" maxlength="5" autocomplete="cc-exp"></div>
          <div class="field" style="margin-top:0"><label class="muted">รหัสผ่านลับ (CVV/CVC) *</label><input class="input" name="cvv" type="password" placeholder="---" maxlength="4" inputmode="numeric" autocomplete="cc-csc"></div></div>
        <p class="muted" style="font-size:12px;margin-top:10px">ต้นแบบ: ไม่มีการตัดเงินจริง กรอกหมายเลขบัตร 16 หลักใดก็ได้</p>
      </form>` : `<div class="card"><img src="${A('promptpay.jpg')}" alt="PromptPay" style="width:90px;height:35px;object-fit:cover">
        <div class="muted" style="margin-top:8px">ยอดเงินที่ต้องชำระ</div><div style="font-size:28px;font-weight:700;color:var(--primary)">${money(t.total)} บาท</div>
        <b style="font-size:14px">ชื่อบัญชี: บริษัท เดอะ สตีล จำกัด (มหาชน)</b><div class="muted" style="font-size:13px">เลขประจำตัวผู้เสียภาษี: 0-1234-56789-01-2</div>
        <div class="qrwrap"><div class="qr"><img src="${A('qr.png')}" alt="QR Code สำหรับชำระเงิน" width="180" height="180"></div><a class="btn" style="height:36px;font-size:15px" href="${A('qr.png')}" download="thesteel-qr-payment.png">${icon('download', 18)} บันทึก QR Code</a></div>
        <hr class="hr" style="margin:14px 0"><ol style="padding-left:18px;margin:0;font-size:14px;line-height:1.6"><li>เปิดแอปพลิเคชันธนาคารที่ท่านใช้งาน (เช่น K-My, SCB Easy, Krungthai NEXT)</li><li>เลือกเมนู "สแกนจ่าย" หรือ "สแกน QR" เพื่อสแกนรูปภาพด้านบน</li><li>ตรวจสอบยอดเงินและชื่อผู้รับเงินปลายทาง ก่อนกดยืนยันการทำรายการ</li></ol>
        <div class="timer" data-timer>${icon('clock', 16)} <span>กรุณาชำระเงินภายใน 15:00 นาที</span></div></div>`}
      <div style="margin-top:16px">${summaryCard({ addons: true, action: `<button class="btn btn-primary" style="margin-top:12px" data-pay>${card ? 'ชำระเงิน' : 'ฉันชำระเงินเรียบร้อยแล้ว'}</button>` })}</div>`;
    clearInterval(qrTimer);
    if (!card) {
      let left = 900;
      qrTimer = setInterval(() => {
        const el = $('[data-timer]', root); if (!el) return clearInterval(qrTimer);
        if (--left <= 0) { clearInterval(qrTimer); el.classList.add('expired'); el.lastElementChild.textContent = 'QR Code หมดอายุ'; $('[data-pay]', root).disabled = true; return; }
        el.lastElementChild.textContent = `กรุณาชำระเงินภายใน ${String(Math.floor(left / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')} นาที`;
      }, 1000);
    }
    const f = $('[data-cf]', root);
    if (f) {
      f.num.addEventListener('input', () => { f.num.value = f.num.value.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 '); });
      f.exp.addEventListener('input', () => { const d = f.exp.value.replace(/\D/g, '').slice(0, 4); f.exp.value = d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d; });
      f.cvv.addEventListener('input', () => { f.cvv.value = f.cvv.value.replace(/\D/g, ''); });
    }
    root.addEventListener('click', (e) => {
      const m = e.target.closest('[data-m]'); if (m) { actions.setCheckout({ method: m.dataset.m }); refresh(); }
      const pay = e.target.closest('[data-pay]');
      if (!pay) return;
      if (f) {
        const exp = f.exp.value.replace(/\D/g, '');
        const ok = { name: f.name.value.trim().length > 2, num: f.num.value.replace(/\D/g, '').length === 16, exp: exp.length === 4 && +exp.slice(0, 2) >= 1 && +exp.slice(0, 2) <= 12, cvv: f.cvv.value.length >= 3 };
        Object.entries(ok).forEach(([n, v]) => f[n].classList.toggle('invalid', !v));
        if (!Object.values(ok).every(Boolean)) { toast('กรุณากรอกข้อมูลบัตรให้ถูกต้องครบถ้วน', 'warn'); f.scrollIntoView({ behavior: 'smooth' }); return; }
      }
      clearInterval(qrTimer);
      pay.disabled = true; pay.textContent = 'กำลังดำเนินการ...';
      setTimeout(() => { const o = actions.placeOrder(card ? 'card' : 'qr'); location.hash = `#/checkout/status/${o.id}`; }, card ? 800 : 300);
    });
  };

  // ---------- สถานะการชำระเงิน ----------
  const money5 = (o) => [['ราคาสินค้าทั้งหมด (บาท)', o.totals.subtotal], ['ส่วนลด (บาท)', -o.totals.discount], ['ค่าจัดส่ง (บาท)', o.totals.shipping], ['บริการเสริม (บาท)', o.totals.addons], ['ค่าธรรมเนียม 7% (บาท)', o.totals.fee]];
  PAGES.status = function (root, { id }) {
    const o = S().orders.find((x) => x.id === id);
    if (!o) { root.innerHTML = '<div class="empty">ไม่พบคำสั่งซื้อ</div>'; return; }
    root.innerHTML = `${stepper(4)}<p class="muted" style="margin-bottom:8px">ผลการดำเนินงาน</p>
      <div class="card">
        <div style="display:flex;align-items:center;gap:14px;padding-bottom:12px;border-bottom:1px solid var(--border-soft)"><span class="ok-badge">${icon('check', 24, 3)}</span><b style="font-size:22px;color:var(--primary)">ชำระเงินสำเร็จ</b></div>
        <div class="kv" style="padding:12px 0;border-bottom:1px solid var(--border-soft)"><span><span class="muted">หมายเลขคำสั่งซื้อ</span><br><b>#${o.id}</b></span><span style="text-align:right"><span class="muted">วันที่สั่งซื้อ</span><br>${o.date}</span></div>
        <div class="kv" style="padding:12px 0;border-bottom:1px solid var(--border-soft)"><span><b style="color:var(--primary)">ยอดรวมสุทธิ</b><br><b style="font-size:24px;color:var(--primary)">${money(o.totals.total)} บาท</b></span><span style="text-align:right"><b style="color:var(--primary)">วิธีชำระเงิน</b><br><span class="muted">${esc(o.method)}</span></span></div>
        <div style="display:grid;gap:8px;padding:12px 0;border-bottom:1px solid var(--border-soft)"><a class="btn" style="height:36px;font-size:15px" href="#/orders">ติดตามคำสั่งซื้อ</a>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><button class="btn" style="height:36px;font-size:15px" data-print>ดาวน์โหลดใบเสร็จ</button><button class="btn" style="height:36px;font-size:15px" data-print>ดาวน์โหลดใบกำกับ</button></div></div>
        <h4 style="color:var(--primary);margin:12px 0 6px">รายการสินค้า</h4>
        ${o.items.map((it) => `<div style="margin-bottom:8px"><span class="muted">${esc(it.name)} x ${it.qty}</span><br><b>${money(it.price * it.qty)} บาท</b></div>`).join('')}
        <hr class="hr"><h4 style="color:var(--primary);margin:6px 0">ที่อยู่จัดส่ง</h4>
        <div style="display:grid;grid-template-columns:90px 1fr;gap:4px;font-size:14px"><span class="muted">ชื่อผู้รับ</span><span>${esc(o.recipient.name)}</span><span class="muted">โทร</span><span>${o.recipient.phone}</span><span class="muted">อีเมล</span><span>${esc(o.recipient.email)}</span><span class="muted">ที่อยู่</span><span>${esc(o.address)}</span></div>
        <hr class="hr"><h4 style="color:var(--primary);margin:6px 0">สรุปค่าใช้จ่าย</h4>
        ${money5(o).map(([a, b]) => `<div class="kv"><span>${a}</span><b>${money(b)}</b></div>`).join('')}
        <div class="kv" style="font-size:16px;margin-top:6px"><b>ยอดรวมสุทธิ (บาท)</b><b>${money(o.totals.total)}</b></div>
      </div>
      <a class="btn btn-primary" style="margin-top:16px" href="#/">กลับหน้าหลัก</a>`;
    root.addEventListener('click', (e) => { if (e.target.closest('[data-print]')) window.print(); });
  };

  // ---------- คำสั่งซื้อ ----------
  const badgeCls = (s) => (s === 'สำเร็จ' ? 'done' : s === 'กำลังจัดส่ง' ? 'ship' : 'wait');
  let otab = 'ทั้งหมด';
  PAGES.orders = function (root) {
    const all = S().orders;
    const tabs = ['ทั้งหมด', ...SHOP.ORDER_STATUSES];
    const list = all.filter((o) => otab === 'ทั้งหมด' || o.status === otab);
    root.innerHTML = `<div class="stabs">${tabs.map((t) => `<button class="${otab === t ? 'on' : ''}" data-tab="${t}">${t} (${t === 'ทั้งหมด' ? all.length : all.filter((o) => o.status === t).length})</button>`).join('')}</div>
      ${list.length ? list.map((o) => `<div class="card">
        <b>เลขคำสั่งซื้อ: #${o.id}</b><div class="muted" style="font-size:13px">วันที่สั่งซื้อ: ${o.date}</div><hr class="hr">
        <div class="kv" style="align-items:flex-end"><span class="muted">ชำระด้วย<br>${esc(o.method)}</span><b style="font-size:24px;color:var(--primary)">${money(o.totals.total)} บาท</b></div>
        <div class="track"><div class="h">ติดตามการจัดส่ง <span class="badge ${badgeCls(o.status)}">${o.status}</span></div>
          <ul class="timeline">${o.timeline.map(([s2, d]) => `<li><b>${s2}</b><span>${d}</span></li>`).join('')}</ul>
          <div class="info" style="border-top:1px solid var(--border-soft)"><div style="grid-column:1/-1"><span class="muted">ทะเบียนรถ</span><b>${esc(o.vehicle.plate)}</b></div>
            <div><span class="muted">ประเภทรถที่จัดส่ง</span><b>${esc(o.vehicle.type)}</b></div><div><span class="muted">วันที่นัดหมาย</span><b>${esc(o.vehicle.appointment)}</b></div>
            <div><span class="muted">น้ำหนักที่รองรับ (กก.)</span><b>${num(o.vehicle.capacity)}</b></div><div><span class="muted">น้ำหนักสินค้ารวม (กก.)</span><b>${num(o.totals.weight, 1)}</b></div>
            <div style="grid-column:1/-1"><span class="muted">ที่อยู่จัดส่ง</span><b>${esc(o.address)}</b></div></div></div>
        <h4 style="color:var(--primary)">รายการสินค้า</h4>
        ${o.items.map((it) => `<div class="irow"><img src="${A(it.img)}" alt=""><div><b>${esc(it.name)}</b><div class="muted">จำนวน: ${it.qty}<br>ยอดรวม: ${num(it.qty * it.price)} บาท</div></div></div>`).join('')}
        <hr class="hr" style="margin:14px 0"><h4 style="color:var(--primary);margin-bottom:6px">สรุปรายละเอียด</h4>
        ${money5(o).map(([a, b]) => `<div class="kv" style="font-size:15px"><span class="muted">${a.replace(' (บาท)', '')}</span><span>${money(b)} บาท</span></div>`).join('')}
        <hr class="hr"><div style="display:grid;gap:8px"><button class="btn" style="height:36px;font-size:15px" data-reorder="${o.id}">สั่งซื้ออีกครั้ง</button><button class="btn" style="height:36px;font-size:15px" data-print>ดาวน์โหลดใบเสร็จรับเงิน</button><button class="btn" style="height:36px;font-size:15px" data-print>ดาวน์โหลดใบกำกับภาษี</button></div>
      </div>`).join('') : '<div class="empty">ไม่มีคำสั่งซื้อในสถานะนี้</div>'}`;
    root.addEventListener('click', (e) => {
      const tb = e.target.closest('[data-tab]'); if (tb) { otab = tb.dataset.tab; refresh(); }
      const ro = e.target.closest('[data-reorder]'); if (ro) { actions.reorder(ro.dataset.reorder); toast('เพิ่มสินค้าเข้าตะกร้าแล้ว', 'ok', ' <a href="#/cart">ดูตะกร้า</a>'); refresh(); }
      if (e.target.closest('[data-print]')) window.print();
    });
  };

  // ---------- บัญชี ----------
  PAGES.account = function (root) {
    const s = S();
    root.innerHTML = s.user ? `
      <div class="card" style="display:flex;align-items:center;gap:14px"><span class="ok-badge" style="width:52px;height:52px">${icon('user', 28, 2)}</span><div><b style="font-size:18px">${esc(s.user.name)}</b><div class="muted" style="font-size:13px">${s.user.email}<br>${s.user.phone}</div></div></div>
      <div class="card menu-list">
        <a href="#/orders">รายการคำสั่งซื้อ ${icon('chevRight', 20)}</a><a href="#/favorites">รายการโปรดของฉัน (${s.fav.length}) ${icon('chevRight', 20)}</a>
        <a href="#/account/quotes">ประวัติการขอใบเสนอราคา (${s.quotes.length}) ${icon('chevRight', 20)}</a>
        <a href="#/account/recipients">ข้อมูลผู้รับสินค้า (${s.recipients.length}) ${icon('chevRight', 20)}</a><a href="#/account/addresses">ข้อมูลที่อยู่จัดส่ง (${s.addresses.length}) ${icon('chevRight', 20)}</a><a href="#/account/taxes">ข้อมูลใบกำกับภาษี (${s.taxes.length}) ${icon('chevRight', 20)}</a>
        <button data-contact>ติดต่อเรา ${icon('chevRight', 20)}</button>
      </div>
      <button class="btn btn-danger" style="margin-top:16px" data-logout>ออกจากระบบ</button>`
      : `<div class="empty"><span class="ok-badge" style="width:64px;height:64px;margin:0 auto 12px">${icon('user', 34, 2)}</span>ยังไม่ได้เข้าสู่ระบบ<button class="btn btn-primary" data-login>เข้าสู่ระบบ / สมัครสมาชิก</button></div>`;
    root.insertAdjacentHTML('beforeend', '<button class="btn" style="margin-top:12px;font-size:14px;height:36px;border-color:var(--border);color:var(--muted)" data-reset>รีเซ็ตข้อมูลตัวอย่างของต้นแบบ</button>');
    root.addEventListener('click', (e) => {
      if (e.target.closest('[data-login]')) requireLogin(refresh);
      if (e.target.closest('[data-logout]')) { actions.logout(); toast('ออกจากระบบแล้ว'); refresh(); }
      if (e.target.closest('[data-reset]')) sheet({ title: 'รีเซ็ตข้อมูลตัวอย่าง', body: 'ตะกร้า คำสั่งซื้อ และข้อมูลที่เพิ่มไว้จะกลับเป็นค่าเริ่มต้นของต้นแบบ', ok: 'รีเซ็ต', danger: true, onOk: () => { actions.reset(); toast('รีเซ็ตแล้ว'); refresh(); } });
      if (e.target.closest('[data-contact]')) sheet({ title: 'ติดต่อเรา', body: 'บริษัท เดอะ สตีล จำกัด (มหาชน)<br>โทร 02-123-4567<br>contact@thesteel.co.th<br>จันทร์–เสาร์ 08:00–17:00 น.', ok: 'ปิด', cancel: '' });
    });
  };

  PAGES.favorites = function (root) {
    const favs = S().fav.map(product).filter(Boolean);
    root.innerHTML = `<div class="page-head"><span class="muted">${favs.length} รายการ</span><a class="btn btn-sm btn-primary" href="#/products">${icon('heart', 14, 2)} เพิ่มรายการโปรด</a></div>
      ${favs.length ? `<div class="pgrid">${favs.map(pcard).join('')}</div>` : '<div class="empty">ยังไม่มีสินค้าในรายการโปรด<br>กดรูปหัวใจบนการ์ดสินค้าเพื่อบันทึก<a class="btn btn-primary" href="#/products">เลือกดูสินค้า</a></div>'}`;
  };

  // ---------- ข้อมูลบัญชี: ผู้รับ / ที่อยู่ / ใบกำกับภาษี / ใบเสนอราคา ----------
  const DATA = {
    recipients: { list: () => S().recipients, row: (r) => [r.name, `${r.phone} · ${r.email}`], add: 'เพิ่มข้อมูลผู้รับ', fields: [['name', 'ชื่อ-นามสกุล'], ['phone', 'เบอร์โทรศัพท์'], ['email', 'อีเมล']], save: (v) => actions.addRecipient(v) },
    addresses: { list: () => S().addresses, row: (a) => [a.title, a.full], add: 'เพิ่มที่อยู่จัดส่ง', fields: [['title', 'ชื่อที่อยู่ เช่น โกดังบางนา'], ['full', 'ที่อยู่เต็ม']], save: (v) => actions.addAddress(v) },
    taxes: { list: () => S().taxes, row: (t) => [t.name, `เลขประจำตัวผู้เสียภาษี : ${t.taxId}`], add: 'เพิ่มข้อมูลใบกำกับภาษี', fields: [['name', 'ชื่อบริษัท / ชื่อบุคคล'], ['taxId', 'เลขประจำตัวผู้เสียภาษี']], save: (v) => actions.addTax(v) },
  };
  PAGES.accountData = function (root, { section }) {
    if (section === 'quotes') {
      const qs = S().quotes;
      root.innerHTML = `<div class="page-head"><span class="muted">${qs.length} รายการ</span><a class="btn btn-sm btn-primary" href="#/cart">ขอใบเสนอราคาใหม่</a></div>
        ${qs.length ? qs.map((q) => `<div class="card"><div class="kv"><b>${q.id}</b><span class="badge ${q.status === 'ส่งใบเสนอราคาแล้ว' ? 'done' : 'wait'}">${q.status}</span></div>
          <div class="muted" style="font-size:13px">${q.date} · ส่งไปที่ ${esc(q.email)}</div><hr class="hr">
          ${q.items.map((i) => `<div class="kv"><span>${esc(i.name)} ×${i.qty}</span><span>${money(i.price * i.qty)}</span></div>`).join('')}
          <hr class="hr"><div class="kv"><b>ยอดรวมโดยประมาณ (บาท)</b><b>${money(q.total)}</b></div></div>`).join('')
        : '<div class="empty">ยังไม่มีประวัติการขอใบเสนอราคา<br>ขอใบเสนอราคาได้ในขั้นตอน “บริการเสริม” ระหว่างสั่งซื้อ</div>'}
        <p class="muted" style="font-size:12px;margin-top:12px">ใบเสนอราคาเป็นการประเมินราคา ยังไม่ใช่คำสั่งซื้อ</p>`;
      return;
    }
    const d = DATA[section];
    if (!d) { root.innerHTML = '<div class="empty">ไม่พบหน้านี้<a class="btn btn-primary" href="#/account">กลับไปหน้าบัญชี</a></div>'; return; }
    root.innerHTML = `<div class="page-head"><span class="muted">${d.list().length} รายการ</span><button class="btn btn-sm btn-primary" data-add>+ เพิ่มข้อมูล</button></div>
      <div class="card">${d.list().length ? d.list().map((x, i) => { const [a, b] = d.row(x); return `<div class="data-row"><b>${esc(a)}${i === 0 ? ' <span class="badge done">ค่าเริ่มต้น</span>' : ''}</b><div class="muted" style="font-size:13px">${esc(b)}</div></div>`; }).join('') : '<div class="empty" style="padding:24px">ยังไม่มีข้อมูล</div>'}</div>`;
    $('[data-add]', root).addEventListener('click', () => formSheet(d.add, d.fields, (v) => { d.save(v); toast('เพิ่มข้อมูลแล้ว'); refresh(); }));
  };

  // ---------- เปรียบเทียบสินค้า ----------
  PAGES.compare = function (root) {
    const items = S().compare.map(product).filter(Boolean);
    if (!items.length) { root.innerHTML = '<div class="empty">ยังไม่มีสินค้าในรายการเปรียบเทียบ<br>กดปุ่ม “เปรียบเทียบ” บนการ์ดสินค้า (สูงสุด 4 รายการ)<a class="btn btn-primary" href="#/products">เลือกสินค้า</a></div>'; return; }
    const min = Math.min(...items.map((p) => p.price));
    const rows = [
      ['ราคา (บาท)', (p) => `<b style="color:var(--primary)">${money(p.price)}</b>${items.length > 1 && p.price === min ? '<div class="best">ถูกที่สุด</div>' : ''}`],
      ['รหัสสินค้า', (p) => p.sku], ['เกรด', (p) => p.grade], ['ความหนา', (p) => p.thicknesses.map((t) => `${t} มม.`).join(', ')],
      ['มาตรฐาน', (p) => esc(p.standard)], ['การเคลือบผิว', (p) => p.coating], ['หน่วยขาย', (p) => p.unit],
      ['คงเหลือ', (p) => (p.stock ? `${num(p.stock)} เส้น` : '<b style="color:var(--danger)">สินค้าหมด</b>')], ['การใช้งาน', (p) => esc(p.use)],
    ];
    root.innerHTML = `<div class="page-head"><span class="muted">${items.length}/4 รายการ</span><button class="btn btn-sm btn-danger" data-clear-compare>ล้างทั้งหมด</button></div>
      <div class="cmp-scroll"><table class="cmp-table"><thead><tr><th></th>${items.map((p) => `<th><a href="#/product/${p.id}"><img src="${A(p.img)}" alt=""><span>${esc(p.name)}</span></a>
        <button class="cmp-rm" data-compare="${p.id}" aria-label="นำออก">${icon('trash', 14)} นำออก</button></th>`).join('')}</tr></thead>
        <tbody>${rows.map(([l, f]) => `<tr><td>${l}</td>${items.map((p) => `<td>${f(p)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
      <p class="muted" style="font-size:12px;margin-top:8px">← เลื่อนตารางไปทางซ้าย-ขวาเพื่อดูสินค้าทั้งหมด</p>
      ${items.length < 4 ? '<a class="btn" style="margin-top:12px" href="#/products">+ เพิ่มสินค้าเปรียบเทียบ</a>' : ''}`;
  };
})();
