// Front End pages.
(function () {
  const { esc, money, num, product, category, totals, actions, CATEGORIES, PRODUCTS, FEATURED, PROMOS, ARTICLES, COUPONS, tubeSpec, kgPerM } = SHOP;
  const { icon, $, $$, A, crumbs, productCard, postCard, stepper, summary, itemsTable, linesFromCart, modal, formModal, toast, requireLogin } = UI;
  const S = () => SHOP.state;
  const refresh = () => APP.refresh();

  // ---------- หน้าแรก ----------
  const HERO = [
    { k: 'ข่าวสาร', h: 'วัสดุก่อสร้างคุณภาพสูง<br>ราคาส่งตรงจากโรงงาน', p: 'เหล็กโครงสร้าง เหล็กเส้น เหล็กกล่อง ท่อ PVC และอุปกรณ์ก่อสร้างครบวงจร พร้อมบริการจัดส่งทั่วประเทศ' },
    { k: 'โปรโมชัน', h: 'ซื้อครบ 5,000 บาท<br>ลดทันที 5%', p: 'สำหรับหมวดเหล็กโครงสร้างทุกประเภท ตั้งแต่วันนี้ถึง 30 พ.ย. 2569' },
    { k: 'บริการ', h: 'จัดส่งทั่วประเทศ<br>ภายใน 3-5 วันทำการ', p: 'ส่งฟรีสำหรับคำสั่งซื้อ 10,000 บาทขึ้นไปในเขตกรุงเทพฯ และปริมณฑล' },
    { k: 'สมาชิก', h: 'สมัครสมาชิกวันนี้<br>รับส่วนลดเพิ่ม 2%', p: 'ติดตามคำสั่งซื้อ บันทึกที่อยู่ และขอใบกำกับภาษีได้สะดวกยิ่งขึ้น' },
  ];
  let heroIdx = 0, heroTimer = null;

  PAGES.home = function (root) {
    root.innerHTML = `<div class="container page">
      ${crumbs([['หน้าหลัก']])}
      <section class="hero" data-hero><img src="${A('hero.jpg')}" alt="">
        <div data-hero-text></div>
        <div class="stats"><div><small>สินค้าพร้อมส่ง</small><b>+12,000 รายการ</b></div><div><small>สาขาบริการ</small><b>ทั่วประเทศ</b></div><div><small>ส่วนลดสูงสุด</small><b>สูงสุด 15%</b></div></div>
      </section>
      <div class="dots" data-dots>${HERO.map((_, i) => `<button data-hero-dot="${i}" aria-label="สไลด์ ${i + 1}"></button>`).join('')}</div>

      <div class="section-head"><h2>โปรโมชัน</h2><a href="#/products">ดูทั้งหมด ${icon('chevRight', 22, 2.4)}</a></div>
      <div class="grid-4">${PROMOS.map((p) => postCard(p, true)).join('')}</div>

      <div class="section-head"><h2>หมวดหมู่สินค้า</h2></div>
      <div class="grid-5">${CATEGORIES.map((c) => `<a class="cat-card" href="#/products?cat=${c.id}"><img src="${A(c.img)}" alt=""><b>${c.name}</b><span>${c.desc}</span></a>`).join('')}</div>

      <div class="section-head"><h2>สินค้าแนะนำ</h2><a href="#/products">ดูทั้งหมด ${icon('chevRight', 22, 2.4)}</a></div>
      <div class="grid-4">${FEATURED.map((id) => productCard(product(id))).join('')}</div>

      <div class="section-head"><h2>บทความ</h2><a href="#/articles">ดูทั้งหมด ${icon('chevRight', 22, 2.4)}</a></div>
      <div class="grid-4">${ARTICLES.slice(0, 4).map((a) => postCard(a, false)).join('')}</div>
    </div>`;
    const showHero = (i) => {
      heroIdx = i;
      const h = HERO[i];
      $('[data-hero-text]', root).innerHTML = `<span class="kicker">${h.k}</span><h1>${h.h}</h1><p>${h.p}</p>`;
      $$('[data-hero-dot]', root).forEach((d, j) => d.classList.toggle('on', j === i));
    };
    showHero(heroIdx);
    clearInterval(heroTimer);
    heroTimer = setInterval(() => { if (!root.isConnected || !$('[data-hero]', root)) return clearInterval(heroTimer); showHero((heroIdx + 1) % HERO.length); }, 5000);
    root.addEventListener('click', (e) => {
      const d = e.target.closest('[data-hero-dot]');
      if (d) showHero(+d.dataset.heroDot);
    });
  };

  // ---------- สินค้าทั้งหมด ----------
  const F = { key: '', usage: new Set(), types: new Set(), stds: new Set(), size: 'ทั้งหมด', sort: 'rec', inStock: true, q: '', page: 1, more: {} };
  PAGES.products = function (root, _p, query) {
    const key = `${query.cat || ''}|${query.q || ''}`;
    if (F.key !== key) Object.assign(F, { key, usage: new Set(), types: new Set(), stds: new Set(), size: 'ทั้งหมด', q: query.q || '', page: 1 });
    const cat = category(query.cat);
    const base = PRODUCTS.filter((p) => !cat || p.cat === cat.id);
    const uniq = (f) => [...new Set(base.flatMap(f))];
    const usages = uniq((p) => p.tags), types = uniq((p) => [p.type]), stds = uniq((p) => [p.standard]);
    const sizes = uniq((p) => (p.size ? [p.size] : []));
    const title = cat ? cat.name : F.q ? `ผลการค้นหา “${F.q}”` : 'สินค้าทั้งหมด';

    function list() {
      const q = F.q.trim().toLowerCase();
      let r = base.filter((p) =>
        (!q || (p.name + p.sku + p.type).toLowerCase().includes(q)) &&
        (!F.usage.size || p.tags.some((t) => F.usage.has(t))) &&
        (!F.types.size || F.types.has(p.type)) &&
        (!F.stds.size || F.stds.has(p.standard)) &&
        (F.size === 'ทั้งหมด' || p.size === F.size) &&
        (!F.inStock || p.stock > 0));
      if (F.sort === 'asc') r = r.slice().sort((a, b) => a.price - b.price);
      if (F.sort === 'desc') r = r.slice().sort((a, b) => b.price - a.price);
      return r;
    }
    const checks = (name, items, set) => {
      const show = F.more[name] ? items : items.slice(0, 3);
      return show.map((v) => `<label class="check"><input type="checkbox" data-f="${name}" value="${esc(v)}" ${set.has(v) ? 'checked' : ''}> ${esc(v)}</label>`).join('') +
        (items.length > 3 ? `<button class="link" style="margin-top:4px;font-weight:500" data-more="${name}">${icon(F.more[name] ? 'chevDown' : 'chevDown', 16)} ${F.more[name] ? 'แสดงน้อยลง' : 'แสดงทั้งหมด'}</button>` : '');
    };

    const r = list();
    const per = 6, pages = Math.max(1, Math.ceil(r.length / per));
    F.page = Math.min(F.page, pages);
    const slice = r.slice((F.page - 1) * per, F.page * per);

    root.innerHTML = `<div class="container page">
      ${crumbs([['หน้าหลัก', '#/'], [title]])}
      <div style="display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;align-items:flex-end;margin-bottom:24px">
        <div><h1 class="page-title">${esc(title)}</h1><p class="page-sub" style="color:var(--text)">พบสินค้าทั้งหมด ${num(r.length)} รายการ</p></div>
        <div><div class="toolbar">
          <label class="search">${icon('search', 20)}<input data-q placeholder="ค้นหาสินค้า เช่น เหล็กเส้น 6มม., เหล็กกล่อง 2x2 นิ้ว" value="${esc(F.q)}"></label>
          <span class="muted">เรียงตาม</span>
          <select class="select primary" data-sort style="width:172px">${[['rec', 'สินค้าแนะนำ'], ['asc', 'ราคา ต่ำ → สูง'], ['desc', 'ราคา สูง → ต่ำ']].map(([v, l]) => `<option value="${v}" ${F.sort === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
        </div><label class="check" style="justify-content:flex-end;margin-top:12px"><input type="checkbox" data-instock ${F.inStock ? 'checked' : ''}> แสดงเฉพาะรายการที่มีสินค้า</label></div>
      </div>
      <div class="list-layout">
        <aside class="filters">
          <h3>ตัวกรอง</h3>
          <h4>การใช้งาน</h4>${checks('usage', usages, F.usage)}
          <h4>ประเภทเหล็ก</h4>${checks('types', types, F.types)}
          ${sizes.length ? `<h4>ขนาดหน้าตัด (มม.)</h4><small class="muted">* ขึ้นอยู่กับประเภทเหล็ก</small>
            <select class="select primary" data-size style="margin-top:8px">${['ทั้งหมด', ...sizes].map((s) => `<option ${F.size === s ? 'selected' : ''}>${s}</option>`).join('')}</select>` : ''}
          <h4>ความยาว (ม.)</h4><select class="select primary"><option>6</option></select>
          <h4>มาตรฐาน</h4>${checks('stds', stds, F.stds)}
          <button class="btn btn-block" style="margin-top:18px" data-reset>ล้างตัวกรอง</button>
        </aside>
        <div>${slice.length ? `<div class="grid-3">${slice.map(productCard).join('')}</div>` : `<div class="empty">ไม่พบสินค้าที่ตรงกับเงื่อนไข<br><button class="link" data-reset style="margin-top:8px">ล้างตัวกรอง</button></div>`}
          ${pages > 1 ? `<div class="pager"><button data-pg="${F.page - 1}" ${F.page === 1 ? 'disabled' : ''}>‹</button>${Array.from({ length: pages }, (_, i) => `<button data-pg="${i + 1}" class="${i + 1 === F.page ? 'on' : ''}">${i + 1}</button>`).join('')}<button data-pg="${F.page + 1}" ${F.page === pages ? 'disabled' : ''}>›</button></div>` : ''}
        </div>
      </div></div>`;

    root.addEventListener('change', (e) => {
      const t = e.target;
      if (t.dataset.f) { F[t.dataset.f][t.checked ? 'add' : 'delete'](t.value); F.page = 1; }
      if (t.matches('[data-sort]')) F.sort = t.value;
      if (t.matches('[data-size]')) { F.size = t.value; F.page = 1; }
      if (t.matches('[data-instock]')) { F.inStock = t.checked; F.page = 1; }
      refresh();
    });
    root.addEventListener('click', (e) => {
      const m = e.target.closest('[data-more]');
      if (m) { F.more[m.dataset.more] = !F.more[m.dataset.more]; refresh(); }
      if (e.target.closest('[data-reset]')) { Object.assign(F, { usage: new Set(), types: new Set(), stds: new Set(), size: 'ทั้งหมด', q: '', page: 1 }); refresh(); }
      const pg = e.target.closest('[data-pg]');
      if (pg && !pg.disabled) { F.page = +pg.dataset.pg; APP.refresh(); window.scrollTo(0, 0); }
    });
    let deb;
    $('[data-q]', root).addEventListener('input', (e) => { clearTimeout(deb); deb = setTimeout(() => { F.q = e.target.value; F.page = 1; refresh(); const i = $('[data-q]'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 300); });
  };

  // ---------- รายละเอียดสินค้า ----------
  const pick = {};
  PAGES.detail = function (root, { id }) {
    const p = product(id);
    if (!p) { root.innerHTML = `<div class="container page"><div class="empty">ไม่พบสินค้า <a class="link" href="#/products">กลับไปหน้ารายการสินค้า</a></div></div>`; return; }
    const st = pick[id] = pick[id] || { t: p.thicknesses[0], qty: 1, img: 0 };
    const cat = category(p.cat);
    const kgm = kgPerM(p, st.t);
    const fav = S().fav.includes(p.id);
    const related = PRODUCTS.filter((x) => x.cat === p.cat && x.id !== p.id).slice(0, 4);
    const rows = p.family === 'tube'
      ? p.thicknesses.map((t) => { const s = tubeSpec(p.side, t); return [p.size, t, s.kgm.toFixed(2), s.area.toFixed(3), s.I.toFixed(2), s.Z.toFixed(2), s.r.toFixed(2)]; })
      : [[p.name.match(/\d[\d x./]*\d/)?.[0] || '-', p.thicknesses[0], p.kgm.toFixed(2), '-', '-', '-', '-']];
    const positions = ['center', 'left', 'right', 'top'];

    root.innerHTML = `<div class="container page">
      ${crumbs([[cat.name, `#/products?cat=${cat.id}`], ['รายละเอียดสินค้า']])}
      <h1 class="page-title" style="margin-bottom:20px">รายละเอียดสินค้า</h1>
      <section class="panel detail-top">
        <div class="gallery"><img class="main" src="${A(p.img)}" alt="${esc(p.name)}" style="object-position:${positions[st.img]}">
          <div class="thumbs">${[0, 1, 2].map((i) => `<button data-img="${i}" class="${st.img === i ? 'on' : ''}" aria-label="รูปที่ ${i + 1}"><img src="${A(p.img)}" alt="" style="object-position:${positions[i]}"></button>`).join('')}</div></div>
        <div>
          <h2 class="detail-title">${esc(p.name)}</h2>
          <div class="sku">SKU : ${p.sku}</div>
          <div class="rec" style="margin-top:14px"><small>แนะนำ :</small><div class="pills">${p.tags.map((t) => `<span class="pill">${esc(t)}</span>`).join('')}</div></div>
          <div class="opt-label">ความหนา (มม.)</div>
          <div class="chip-opts">${p.thicknesses.map((t) => `<button class="chip-opt ${st.t === t ? 'on' : ''}" data-t="${t}">${t}</button>`).join('')}</div>
          ${p.family === 'tube' ? `<div class="opt-label">ขนาด (มม.)</div>
          <div class="chip-opts">${SHOP.TUBE_SIZES.map((s) => { const q = product('tube-' + s.split('x')[0]); return `<a class="chip-opt ${q.id === p.id ? 'on' : ''} ${q.stock <= 0 ? 'disabled' : ''}" href="#/product/${q.id}" style="display:inline-flex;align-items:center" title="${q.stock <= 0 ? 'สินค้าหมด' : ''}">${s}</a>`; }).join('')}</div>` : ''}
        </div>
        <div class="buybox">
          <button class="fav-btn${fav ? ' on' : ''}" data-fav="${p.id}" style="align-self:flex-end;background:${fav ? 'var(--primary)' : 'transparent'};color:${fav ? '#fff' : 'var(--primary)'}" aria-label="รายการโปรด">${icon('heart', 26)}</button>
          <div style="color:var(--primary);font-weight:700;margin-top:10px">สรุปรายการ</div>
          <div class="kv muted"><span>ความยาวรวม (ม.)</span><b style="color:var(--text)">${6 * st.qty}</b></div>
          <div class="kv muted"><span>น้ำหนักรวม (กก.)</span><b style="color:var(--text)">${num(kgm * 6 * st.qty, 2)}</b></div>
          <div class="kv" style="align-items:center;margin-top:8px"><span class="muted">ราคารวม (บาท)</span><span class="total">${money(p.price * st.qty)}</span></div>
          <div class="muted" style="margin-top:12px">คงเหลือ : <b style="color:${p.stock ? 'var(--text)' : 'var(--danger)'}">${p.stock || 'สินค้าหมด'}</b></div>
          <div class="buy-row"><div class="qty ${p.stock ? '' : 'disabled'}"><button data-q="-1" aria-label="ลด">-</button><input value="${st.qty}" data-qty inputmode="numeric" aria-label="จำนวน"><button data-q="1" aria-label="เพิ่ม">+</button></div>
            <button class="btn btn-primary" style="height:48px;border-radius:10px" data-add ${p.stock ? '' : 'disabled'}>เพิ่มเข้าตะกร้า</button></div>
        </div>
      </section>

      <div style="display:flex;justify-content:space-between;align-items:center;margin:24px 24px 16px;gap:12px;flex-wrap:wrap">
        <h2 class="h-sec">รายละเอียดสินค้า</h2>
        <div style="display:flex;gap:8px"><button class="btn" data-dl="ใบอนุญาต">ดาวน์โหลดใบอนุญาต</button><button class="btn" data-dl="เอกสารสินค้า">ดาวน์โหลดเอกสารสินค้า</button></div>
      </div>
      <section class="panel">
        <div class="spec-grid">
          <div class="spec-box">${[['หมวดหมู่', cat.name], ['ประเภทเหล็ก', p.type], ['กระบวนการผลิต', p.process], ['ผิวเหล็ก', p.finish], ['หน่วยขาย', p.unit]].map(([k, v]) => `<div class="kv" style="font-size:18px"><span>${k}</span><span>${esc(v)}</span></div>`).join('')}</div>
          <p class="muted" style="font-size:18px;line-height:1.5">${esc(p.desc)}</p>
        </div>
        <h3 class="h-sec" style="margin:24px 0 12px">ตารางรายละเอียดข้อมูลสินค้า</h3>
        <div class="table-wrap"><table class="table"><thead><tr><th>ขนาด<br>(กว้างxยาวxสูง)</th><th>ความหนา<br>(Thickness) (มม.)</th><th>น้ำหนัก<br>(Weight) (กก./ม.)</th><th>พื้นที่หน้าตัด<br>(ซม.²)</th><th>โมเมนต์ความเฉื่อย<br>(Ix, Iy) (ซม.⁴)</th><th>โมดูลัสหน้าตัด<br>(Zx, Zy) (ซม.³)</th><th>รัศมีไจเรชั่น<br>(ix, iy) (ซม.)</th></tr></thead>
          <tbody>${rows.map((r) => `<tr${+r[1] === st.t ? ' style="background:var(--primary-soft)"' : ''}>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
        <h3 class="h-sec" style="margin:24px 0 12px">มาตรฐานที่รองรับ</h3>
        <div class="table"><div class="std-row"><span>${esc(p.standard)}</span><span>มาตรฐานผลิตภัณฑ์อุตสาหกรรม ท่อเหล็กกล้าสำหรับงานโครงสร้างทั่วไป</span></div></div>
        <h3 class="h-sec" style="margin:24px 0 12px">เกรดที่รองรับ</h3>
        <div class="table"><div class="std-row"><span>SS400</span><span>ความยาวมาตรฐาน 6 ม.</span></div><div class="std-row"><span>STKR400</span><span>ความยาวมาตรฐาน 6 ม.</span></div></div>
      </section>
      ${related.length ? `<div class="section-head"><h2>สินค้าที่เกี่ยวข้อง</h2><a href="#/products?cat=${cat.id}">ดูทั้งหมด ${icon('chevRight', 22, 2.4)}</a></div>
      <div class="grid-4">${related.map(productCard).join('')}</div>` : ''}
    </div>`;

    root.addEventListener('click', (e) => {
      const t = e.target.closest('[data-t]');
      if (t) { st.t = +t.dataset.t; refresh(); }
      const im = e.target.closest('[data-img]');
      if (im) { st.img = +im.dataset.img; refresh(); }
      const q = e.target.closest('[data-q]');
      if (q) { st.qty = Math.max(1, Math.min(p.stock, st.qty + +q.dataset.q)); refresh(); }
      if (e.target.closest('[data-add]')) {
        actions.addToCart(p.id, st.t, st.qty);
        toast(`เพิ่ม ${st.qty} เส้นเข้าตะกร้าแล้ว`, 'ok', ' <a href="#/cart">ดูตะกร้า</a>');
        st.qty = 1; refresh();
      }
      const dl = e.target.closest('[data-dl]');
      if (dl) toast(`ดาวน์โหลด${dl.dataset.dl} (ต้นแบบ — ยังไม่มีไฟล์จริง)`, 'warn');
    });
    $('[data-qty]', root).addEventListener('change', (e) => { st.qty = Math.max(1, Math.min(p.stock, parseInt(e.target.value, 10) || 1)); refresh(); });
  };

  // ---------- เปรียบเทียบสินค้า ----------
  const STD_INFO = {
    'มอก. 107-2533': 'มาตรฐานอุตสาหกรรมไทย เหมาะกับงานโครงสร้างทั่วไป ราคาประหยัด รับรองโดย สมอ. (สำนักงานมาตรฐานผลิตภัณฑ์อุตสาหกรรม)',
    'JIS G3466': 'มาตรฐานอุตสาหกรรมญี่ปุ่น สำหรับท่อเหล็กกล้าคาร์บอนรูปสี่เหลี่ยมสำหรับงานโครงสร้าง',
    'ASTM A500': 'มาตรฐานอเมริกัน สำหรับท่อเหล็กโครงสร้างขึ้นรูปเย็น ทนแรงดึงสูง',
  };
  PAGES.compare = function (root) {
    const items = S().compare.map(product);
    const minPrice = Math.min(...items.map((p) => p.price));
    const rows = [
      ['ราคา (บาท)', (p) => `<b class="${items.length > 1 && p.price === minPrice ? 'best' : ''}" style="color:var(--primary)">${money(p.price)}</b>${items.length > 1 && p.price === minPrice ? ' <span class="pill" style="border-color:var(--success);color:var(--success)">ถูกที่สุด</span>' : ''}`],
      ['รหัสสินค้า', (p) => `<span class="muted">${p.sku}</span>`],
      ['เกรด', (p) => p.grade],
      ['ความหนา', (p) => p.thicknesses.map((t) => t + ' มม.').join(', ')],
      ['มาตรฐาน', (p) => `${esc(p.standard)}<span class="tip" tabindex="0">${icon('info', 16)}<span class="bubble"><b>${esc(p.standard)}</b>${esc(STD_INFO[p.standard] || 'มาตรฐานผลิตภัณฑ์อุตสาหกรรม')}</span></span>`],
      ['การเคลือบผิว', (p) => p.coating],
      ['หน่วยขาย', (p) => p.unit],
      ['คงเหลือ', (p) => (p.stock ? num(p.stock) + ' เส้น' : '<span style="color:var(--danger);font-weight:700">สินค้าหมด</span>')],
      ['การใช้งาน', (p) => p.use],
    ];
    root.innerHTML = `<div class="container page">
      ${crumbs([['หน้าหลัก', '#/'], ['เปรียบเทียบสินค้า']])}
      <h1 class="page-title">เปรียบเทียบสินค้า (${items.length} รายการ)</h1>
      <p class="page-sub" style="margin-bottom:24px">เลือกสินค้าเพื่อเปรียบเทียบได้มากสุด 4 รายการ</p>
      ${items.length ? `<div class="cmp-cards">
        ${items.map((p) => `<div class="cmp-col">${productCard(p).replace(/<button class="compare-pill[^>]*>[^<]*<\/button>/, '')}<button class="remove" data-compare="${p.id}">${icon('trash', 18)} ลบรายการ</button></div>`).join('')}
        ${items.length < 4 ? `<a class="cmp-add" href="#/products">${icon('plus', 40, 1.2)}เพิ่มสินค้าเปรียบเทียบ</a>` : ''}
      </div>
      <h2 style="font-size:26px;margin:32px 0 16px">ข้อมูลเปรียบเทียบ</h2>
      <div class="table-wrap"><table class="cmp-table"><thead><tr><th>ข้อมูล</th>${items.map((p) => `<th>${esc(p.name)}</th>`).join('')}</tr></thead>
        <tbody>${rows.map(([l, f]) => `<tr><td>${l}</td>${items.map((p) => `<td>${f(p)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`
      : `<div class="empty">ยังไม่มีสินค้าในรายการเปรียบเทียบ<br><a class="btn btn-primary" href="#/products" style="margin-top:16px">เลือกสินค้า</a></div>`}
    </div>`;
  };

  // ---------- ตะกร้าของฉัน ----------
  PAGES.cart = function (root) {
    const s = S();
    const t = totals();
    const c = s.coupon && COUPONS[s.coupon];
    root.innerHTML = `<div class="container page">
      ${crumbs([['หน้าหลัก', '#/'], ['ตะกร้าของฉัน']])}
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;gap:12px;flex-wrap:wrap">
        <h1 class="page-title">ตะกร้าของฉัน (${s.cart.length} รายการ)</h1>
        ${s.cart.length ? `<div style="display:flex;gap:16px"><button class="btn" data-all>เลือกทั้งหมด</button><button class="btn btn-danger" data-clear>ล้างทั้งหมด</button></div>` : ''}
      </div>
      ${s.cart.length ? `<div class="two-col"><div>
        ${s.cart.map((l, i) => { const x = SHOP.lineInfo(l); const p = x.p; return `
        <div class="cart-item ${l.sel && !x.out ? '' : 'dim'}">
          <label class="sel"><input type="checkbox" data-sel="${i}" ${l.sel && !x.out ? 'checked' : ''} ${x.out ? 'disabled' : ''} aria-label="เลือกรายการ"></label>
          <a href="#/product/${p.id}"><img class="thumb" src="${A(p.img)}" alt=""></a>
          <div class="props"><a href="#/product/${p.id}" style="font-size:20px;font-weight:700">${esc(p.name)}</a>
            <div class="kv"><span>SKU</span><span>${p.sku}</span></div>
            ${p.size ? `<div class="kv"><span>ขนาด</span><span>${p.size}</span></div>` : ''}
            <div class="kv"><span>เกรด</span><span>${p.grade}</span></div>
            <div class="kv"><span>มาตรฐาน</span><span>${esc(p.standard)}</span></div>
            <div class="kv"><span>ราคาต่อหน่วย</span><span class="unit">${money(p.price)} บาท</span></div>
            <div class="muted" style="margin:8px 0 6px">ตัวเลือกที่เลือก</div>
            <div style="display:flex;gap:6px;flex-wrap:wrap"><span class="opt-pill">ความหนา(มม.) : ${l.t}</span>${p.size ? `<span class="opt-pill">ขนาด(มม.) : ${p.size}</span>` : ''}</div>
          </div>
          <div class="sum"><h4>สรุปรายการ</h4>
            <div class="kv muted"><span>ความยาวรวม (ม.)</span><b style="color:var(--text)">${6 * l.qty}</b></div>
            <div class="kv muted"><span>น้ำหนักรวม (กก.)</span><b style="color:var(--text)">${num(x.kg, 2)}</b></div>
            <div class="line-total">${money(x.total)} บาท</div>
            <div style="text-align:right;color:var(--primary)">${p.unit}</div>
            <hr class="divider" style="margin:8px 0">
            <div style="text-align:right;color:var(--primary);font-weight:700">สินค้าคงเหลือ : ${x.out ? '<span style="color:var(--danger)">สินค้าหมด</span>' : p.stock}</div>
            <div class="qty ${x.out ? 'disabled' : ''}" style="margin-top:8px"><button data-dq="${i}|-1" aria-label="ลด">-</button><input value="${l.qty}" data-qi="${i}" aria-label="จำนวน"><button data-dq="${i}|1" aria-label="เพิ่ม">+</button></div>
          </div>
          <button class="trash" data-rm="${i}" aria-label="ลบรายการ">${icon('trash', 18)}</button>
        </div>`; }).join('')}
      </div>
      <div>
        <div class="panel"><h3 style="font-size:26px;margin-bottom:16px">ส่วนลด</h3>
          <form class="coupon-row" data-coupon><input class="input" name="code" placeholder="กรอกโค้ดส่วนลด" value="${esc(s.coupon || '')}"><button class="btn btn-primary">เพิ่ม</button></form>
          ${c ? `<div class="blue-box" style="margin-top:16px"><b style="color:var(--primary)">${c.label}</b><div class="muted">ขั้นต่ำ ${money(c.min)} บาท</div><div class="muted" style="font-size:13px">ใช้ได้ถึง : ${c.until}</div>
            ${t.subtotal < c.min ? '<div style="color:var(--danger);font-size:14px;margin-top:4px">ยอดสั่งซื้อยังไม่ถึงขั้นต่ำ</div>' : ''}
            <div style="display:flex;gap:16px;margin-top:6px"><button class="link" data-terms>เงื่อนไข</button><button class="link" style="color:var(--danger)" data-rmcoupon>ลบโค้ด</button></div></div>` : '<p class="muted" style="margin-top:10px;font-size:14px">ลองใช้โค้ด SALE10</p>'}
        </div>
        <div class="panel">
          ${t.lines.length ? `<div class="green-box" style="margin-bottom:16px">${t.lines.map((l) => { const x = SHOP.lineInfo(l); return `<div class="kv" style="font-size:14px"><span class="muted">${esc(x.p.name)}</span><span class="pos">+${money(x.total)}</span></div>`; }).join('')}
            <div class="kv pos" style="font-weight:700"><span>ราคารวม (บาท)</span><span>${money(t.subtotal)}</span></div></div>` : ''}
          ${summary({ shipping: false, bare: true, note: '(ไม่รวมค่าจัดส่งและค่าบริการเสริม)' })}
        </div>
        <button class="btn btn-primary btn-block btn-lg" style="margin-top:16px" data-next ${t.lines.length ? '' : 'disabled'}>ถัดไป</button>
      </div></div>`
      : `<div class="empty">ตะกร้าของคุณว่างอยู่<br><a class="btn btn-primary" href="#/products" style="margin-top:16px">เลือกซื้อสินค้า</a></div>`}
    </div>`;

    root.addEventListener('click', (e) => {
      const d = e.target.closest('[data-dq]');
      if (d) { const [i, n] = d.dataset.dq.split('|').map(Number); actions.setQty(i, s.cart[i].qty + n); return refresh(); }
      const rm = e.target.closest('[data-rm]');
      if (rm) return modal({ title: 'ลบสินค้าออกจากตะกร้า', body: `ต้องการลบ “${esc(product(s.cart[+rm.dataset.rm].pid).name)}” ใช่หรือไม่?`, ok: 'ลบ', danger: true, onOk: () => { actions.removeLine(+rm.dataset.rm); refresh(); } });
      if (e.target.closest('[data-all]')) { actions.selectAll(); return refresh(); }
      if (e.target.closest('[data-clear]')) return modal({ title: 'ล้างตะกร้าทั้งหมด', body: 'ต้องการลบสินค้าทั้งหมดออกจากตะกร้าใช่หรือไม่?', ok: 'ล้างทั้งหมด', danger: true, onOk: () => { actions.clearCart(); refresh(); } });
      if (e.target.closest('[data-rmcoupon]')) { actions.removeCoupon(); return refresh(); }
      if (e.target.closest('[data-terms]')) return modal({ title: 'เงื่อนไขโค้ด SALE10', body: '<ul class="ship-notes"><li>ลด 10% สูงสุด 100 บาท</li><li>ขั้นต่ำ 1,000 บาท (ไม่รวมค่าจัดส่ง)</li><li>ใช้ได้ถึง 30 ธันวาคม 2569</li><li>ใช้ได้ 1 ครั้งต่อคำสั่งซื้อ</li></ul>', ok: 'ปิด', cancel: '' });
      if (e.target.closest('[data-next]')) requireLogin(() => (location.hash = '#/checkout/address'));
    });
    root.addEventListener('change', (e) => {
      if (e.target.dataset.sel !== undefined) { actions.toggleSel(+e.target.dataset.sel); refresh(); }
      if (e.target.dataset.qi !== undefined) { actions.setQty(+e.target.dataset.qi, parseInt(e.target.value, 10) || 1); refresh(); }
    });
    const f = $('[data-coupon]', root);
    f && f.addEventListener('submit', (e) => { e.preventDefault(); actions.applyCoupon(f.code.value) ? toast('ใช้โค้ดส่วนลดแล้ว') : toast('ไม่พบโค้ดส่วนลดนี้', 'warn'); refresh(); });
  };

  function needLines(root) {
    if (totals().lines.length) return false;
    root.innerHTML = `<div class="container page"><div class="empty">ยังไม่มีสินค้าที่เลือกสำหรับสั่งซื้อ<br><a class="btn btn-primary" href="#/cart" style="margin-top:16px">กลับไปที่ตะกร้า</a></div></div>`;
    return true;
  }
  const checkoutCrumbs = (upto) => crumbs([['หน้าหลัก', '#/'], ['ตะกร้าของฉัน', '#/cart'], ['ที่อยู่จัดส่ง', '#/checkout/address'], ['บริการเสริม', '#/checkout/addons'], ['ชำระเงิน', '#/checkout/payment'], ['สถานะการชำระเงิน']].slice(0, upto + 2).map((c, i, a) => (i === a.length - 1 ? [c[0]] : c)));

  // ---------- ที่อยู่จัดส่ง ----------
  PAGES.address = function (root) {
    if (needLines(root)) return;
    const s = S(), k = s.checkout, u = s.user;
    const radios = (name, list, sel, title, sub) => list.map((x, i) => `<label class="radio-opt ${sel === i ? 'on' : ''}"><input type="radio" name="${name}" value="${i}" ${sel === i ? 'checked' : ''}><div><div class="t">${esc(title(x, i))}</div><small>${esc(sub(x))}</small></div></label>`).join('');
    root.innerHTML = `<div class="container page">
      ${checkoutCrumbs(1)}
      <h1 class="page-title">ที่อยู่จัดส่ง</h1>
      ${stepper(1)}
      <div class="two-col"><div>
        <div class="panel">
          <div class="sec-row" style="display:block"><h3>ข้อมูลผู้สั่งซื้อ</h3><small class="muted">* (สามารถแก้ไขข้อมูลได้ที่ แก้ไขโปรไฟล์)</small></div>
          <div style="padding:16px 24px;font-size:18px;line-height:1.5">คุณ ${esc(u.name)}<br>เบอร์โทรศัพท์ : ${u.phone}<br>อีเมล : ${u.email}</div>
          <div class="sec-row"><h3>ข้อมูลผู้รับ</h3><button class="link" data-add="recipient">เพิ่มข้อมูลผู้รับ</button></div>
          ${radios('recipient', s.recipients, k.recipient, (r) => r.name, (r) => `เบอร์โทรศัพท์ : ${r.phone}`)}
          <div class="sec-row"><h3>ที่อยู่จัดส่ง</h3><button class="link" data-add="address">เพิ่มที่อยู่</button></div>
          ${radios('address', s.addresses, k.address, (a, i) => a.title + (i === 0 ? ' (ค่าเริ่มต้น)' : ''), (a) => a.full)}
          <div class="sec-row"><div><h3>ขอใบกำกับภาษี</h3><label class="check" style="margin-top:8px"><input type="checkbox" data-taxwanted ${k.taxWanted ? 'checked' : ''}> ต้องการใบกำกับภาษี</label></div><button class="link" data-add="tax">เพิ่มข้อมูลใบกำกับภาษี</button></div>
          <div style="${k.taxWanted ? '' : 'opacity:.4;pointer-events:none'}">${radios('tax', s.taxes, k.tax, (x) => x.name, (x) => `เลขประจำตัวผู้เสียภาษี : ${x.taxId}`)}</div>
        </div>
        <div class="panel"><div style="display:flex;justify-content:space-between;margin-bottom:16px"><h3 class="h-sec" style="font-size:20px">รายการสินค้า</h3><span class="muted">${totals().count} รายการ</span></div>${itemsTable(linesFromCart())}</div>
      </div>
      <div>${summary({ shippingHighlight: true, note: '(ไม่รวมค่าบริการเสริม)' })}
        <a class="btn btn-primary btn-block btn-lg" style="margin-top:16px" href="#/checkout/addons">ถัดไป</a>
        <h3 class="h-sec" style="font-size:18px;margin-top:28px">บริการจัดส่ง</h3>
        <ul class="ship-notes"><li>จัดส่งทั่วประเทศ ภายใน 3-5 วันทำการ</li><li>จัดส่งฟรี สำหรับคำสั่งซื้อ 10,000 บาทขึ้นไป (ในเขตกรุงเทพฯ และปริมณฑล)</li><li>ค่าจัดส่งคำนวณตามน้ำหนักรวมและระยะทาง</li><li>รับสินค้าด้วยตัวเองที่คลังสินค้าได้ ไม่มีค่าจัดส่ง</li><li>ตรวจสอบสถานะจัดส่งได้ตลอด 24 ชั่วโมง</li></ul>
      </div></div></div>`;
    root.addEventListener('change', (e) => {
      const t = e.target;
      if (['recipient', 'address', 'tax'].includes(t.name)) actions.setCheckout({ [t.name]: +t.value });
      if (t.matches('[data-taxwanted]')) actions.setCheckout({ taxWanted: t.checked });
      refresh();
    });
    root.addEventListener('click', (e) => {
      const a = e.target.closest('[data-add]');
      if (!a) return;
      const kind = a.dataset.add;
      if (kind === 'recipient') formModal('เพิ่มข้อมูลผู้รับ', [['name', 'ชื่อ-นามสกุล', 'คุณ ...'], ['phone', 'เบอร์โทรศัพท์', '08x-xxx-xxxx'], ['email', 'อีเมล', 'name@email.com']], (v) => { actions.addRecipient(v); refresh(); toast('เพิ่มข้อมูลผู้รับแล้ว'); });
      if (kind === 'address') formModal('เพิ่มที่อยู่จัดส่ง', [['title', 'ชื่อที่อยู่', 'เช่น โกดัง บางนา'], ['full', 'ที่อยู่เต็ม', 'บ้านเลขที่ ถนน เขต จังหวัด รหัสไปรษณีย์']], (v) => { actions.addAddress(v); refresh(); toast('เพิ่มที่อยู่แล้ว'); });
      if (kind === 'tax') formModal('เพิ่มข้อมูลใบกำกับภาษี', [['name', 'ชื่อบริษัท / ชื่อบุคคล', ''], ['taxId', 'เลขประจำตัวผู้เสียภาษี', '13 หลัก']], (v) => { actions.addTax(v); refresh(); toast('เพิ่มข้อมูลใบกำกับภาษีแล้ว'); });
    });
  };

  // ---------- บริการเสริม ----------
  PAGES.addons = function (root) {
    if (needLines(root)) return;
    const k = S().checkout;
    const off = k.addonsWanted ? '' : 'opacity:.4;pointer-events:none';
    root.innerHTML = `<div class="container page">
      ${checkoutCrumbs(2)}
      <h1 class="page-title">บริการเสริม</h1>
      ${stepper(2)}
      <div class="two-col"><div>
        <div class="panel">
          <h3 style="font-size:18px;margin-bottom:12px">บริการเสริม</h3>
          <label class="check" style="font-size:17px"><input type="radio" name="want" value="1" ${k.addonsWanted ? 'checked' : ''}> ต้องการบริการเสริม</label>
          <div class="grid-2-ad" style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:16px 0;${off}">
            <div class="addon-box"><div class="hint">แนะนำ : คนยกสินค้า 2-3 คน</div>
              <label class="check" style="color:var(--primary);font-weight:600"><input type="checkbox" data-k="porter" ${k.porter ? 'checked' : ''}>${icon('porter', 22)} คนยกสินค้า <span class="muted" style="font-weight:400">(${money(SHOP.ADDON_PRICES.porter)} บาท/คน)</span></label>
              <div style="display:flex;justify-content:space-between;align-items:center;margin:14px 0 0 28px;${k.porter ? '' : 'opacity:.4;pointer-events:none'}"><span>จำนวน</span><input class="addon-qty" type="number" min="1" max="10" value="${k.porterQty}" data-porterqty aria-label="จำนวนคนยกสินค้า"></div>
            </div>
            <div class="addon-box"><div class="hint">แนะนำ : อุปกรณ์ยกสินค้า 1</div>
              <label class="check" style="color:var(--primary);font-weight:600"><input type="checkbox" data-k="equip" ${k.equip ? 'checked' : ''}>${icon('lift', 22)} อุปกรณ์ยกสินค้า</label>
              <div style="margin:10px 0 0 28px;display:grid;gap:8px;${k.equip ? '' : 'opacity:.4;pointer-events:none'}">
                <label class="check"><input type="checkbox" data-k="equip1" ${k.equip1 ? 'checked' : ''}> อุปกรณ์ยกสินค้า 1 <span class="muted">(${money(SHOP.ADDON_PRICES.equip1)} บาท)</span></label>
                <label class="check"><input type="checkbox" data-k="equip2" ${k.equip2 ? 'checked' : ''}> อุปกรณ์ยกสินค้า 2 <span class="muted">(${money(SHOP.ADDON_PRICES.equip2)} บาท)</span></label>
              </div>
            </div>
          </div>
          <label class="check" style="font-size:17px"><input type="radio" name="want" value="0" ${k.addonsWanted ? '' : 'checked'}> ไม่ต้องการบริการเสริม</label>
        </div>
        <div class="panel"><div style="display:flex;justify-content:space-between;margin-bottom:16px"><h3 class="h-sec" style="font-size:20px">รายการสินค้า</h3><span class="muted">${totals().count} รายการ</span></div>${itemsTable(linesFromCart())}</div>
      </div>
      <div>${summary({ addons: true, addonsBreakdown: true, addonsHighlight: true })}
        <a class="btn btn-primary btn-block btn-lg" style="margin-top:16px" href="#/checkout/payment">ชำระเงิน</a>
        <button class="btn btn-block btn-lg" style="margin-top:8px" data-quote>ขอใบเสนอราคา</button>
      </div></div></div>`;
    root.addEventListener('change', (e) => {
      const t = e.target;
      if (t.name === 'want') actions.setCheckout({ addonsWanted: t.value === '1' });
      if (t.dataset.k) actions.setCheckout({ [t.dataset.k]: t.checked });
      if (t.matches('[data-porterqty]')) actions.setCheckout({ porterQty: Math.max(1, Math.min(10, parseInt(t.value, 10) || 1)) });
      refresh();
    });
    root.addEventListener('click', (e) => {
      if (e.target.closest('[data-quote]')) modal({ title: 'ขอใบเสนอราคา', sub: 'ระบบจะส่งใบเสนอราคาไปยังอีเมลของคุณ', body: `<div class="field"><label>อีเมล</label><input class="input" value="${esc(S().user.email)}"></div>`, ok: 'ส่งคำขอ', onOk: () => toast('ส่งคำขอใบเสนอราคาแล้ว') });
    });
  };

  // ---------- ชำระเงิน ----------
  let qrTimer = null;
  PAGES.payment = function (root) {
    if (needLines(root)) return;
    const k = S().checkout, t = totals();
    const card = k.method === 'card';
    root.innerHTML = `<div class="container page">
      ${checkoutCrumbs(3)}
      <h1 class="page-title">ชำระเงิน</h1>
      ${stepper(3)}
      <div class="two-col"><div class="panel">
        <h3 style="font-size:18px;margin-bottom:12px">วิธีการชำระเงิน</h3>
        <div class="pay-tabs"><button class="pay-tab ${card ? 'on' : ''}" data-m="card"><span class="r"></span>บัตรเครดิต/เดบิต</button><button class="pay-tab ${card ? '' : 'on'}" data-m="qr"><span class="r"></span>โมบายแบงก์กิ้ง</button></div>
        ${card ? `
        <div style="display:flex;justify-content:space-between;align-items:center;margin:20px 0 12px"><b style="font-size:18px;display:flex;gap:10px;align-items:center"><span class="icon-circle" style="width:32px;height:32px;border-radius:6px;background:var(--primary-soft)">${icon('card', 18)}</span>บัตรเครดิต/เดบิต</b><div class="brands"><span>VISA</span><span>MASTERCARD</span><span>JCB</span></div></div>
        <form data-cardform novalidate>
          <div class="field"><label>ชื่อผู้ถือบัตร (ตามที่ปรากฏบนบัตร) *</label><input class="input" name="name" placeholder="SOMCHAI YODWISAWAKORN" autocomplete="cc-name"></div>
          <div class="field" style="margin-top:14px"><label>หมายเลขบัตรเครดิต *</label><input class="input" name="num" placeholder="4111 2222 3333 4444" inputmode="numeric" autocomplete="cc-number" maxlength="19"></div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:14px">
            <div class="field"><label>วันหมดอายุ (MM/YY) *</label><input class="input" name="exp" placeholder="12 / 29" autocomplete="cc-exp" maxlength="7"></div>
            <div class="field"><label>รหัสปลอดภัย (CVC/CVV) *</label><input class="input" name="cvv" placeholder="•••" type="password" inputmode="numeric" maxlength="4" autocomplete="cc-csc"></div>
          </div>
          <h4 style="margin:20px 0 8px">ข้อมูลการชำระเงิน</h4>
          <div class="kv muted"><span>วิธีการชำระ</span><span style="color:var(--text)">บัตรเครดิต / เดบิต</span></div>
          <div class="kv muted"><span>ยอดรวมสุทธิ</span><b style="color:var(--primary)">${money(t.total)} บาท</b></div>
          <button class="btn btn-primary btn-block btn-lg" style="margin-top:16px">ชำระเงิน</button>
          <p class="muted" style="font-size:13px;margin-top:8px;text-align:center">ต้นแบบ: ไม่มีการตัดเงินจริง กรอกหมายเลขบัตร 16 หลักใดก็ได้</p>
        </form>` : `
        <b style="font-size:18px;display:flex;gap:10px;align-items:center;margin:20px 0 12px"><span class="icon-circle" style="width:32px;height:32px;border-radius:6px;background:var(--primary-soft)">${icon('qr', 18)}</span>โมบายแบงก์กิ้ง</b>
        <div class="qr-box"><div class="qr-grid">
          <div style="text-align:center"><div class="qr-img"><img src="${A('qr.png')}" alt="QR Code สำหรับชำระเงิน" width="180" height="180"></div>
            <a class="btn" style="margin-top:8px;height:34px" href="${A('qr.png')}" download="thesteel-qr-payment.png">${icon('download', 16)} บันทึก QR Code</a></div>
          <div><img src="${A('promptpay.jpg')}" alt="PromptPay" style="width:100px;height:39px;object-fit:cover"><div class="muted" style="margin-top:8px">ยอดเงินที่ต้องชำระ</div>
            <div style="font-size:36px;font-weight:700;color:var(--primary)">${money(t.total)} บาท</div>
            <div style="font-weight:600">ชื่อบัญชี: บริษัท เดอะ สตีล จำกัด (มหาชน)</div><div class="muted" style="font-size:14px">เลขประจำตัวผู้เสียภาษี: 0-1234-56789-01-2</div>
            <div class="timer" data-timer>${icon('clock', 16)} <span>กรุณาชำระเงินภายใน 15:00 นาที</span></div></div>
        </div>
        <hr class="divider"><ol class="muted" style="margin:0;padding-left:20px;line-height:1.9"><li>เปิดแอปพลิเคชันธนาคารที่ท่านใช้งาน (เช่น K-My, SCB Easy, Krungthai NEXT)</li><li>เลือกเมนู "สแกนจ่าย" หรือ "สแกน QR" เพื่อสแกนรูปภาพด้านบน</li><li>ตรวจสอบยอดเงินและชื่อผู้รับเงินปลายทาง ก่อนกดยืนยันการทำรายการ</li></ol></div>
        <button class="btn btn-primary btn-block btn-lg" style="margin-top:16px" data-paid>ฉันชำระเงินเรียบร้อยแล้ว</button>
        <p class="muted" style="text-align:center;margin-top:8px">ระบบจะตรวจสอบการชำระเงินโดยอัตโนมัติภายใน 1-2 นาทีหลังจากคุณชำระเงินเสร็จสิ้น</p>`}
      </div>
      <div>${summary({ addons: true })}</div></div></div>`;

    clearInterval(qrTimer);
    if (!card) {
      let left = 15 * 60;
      const tick = () => {
        const el = $('[data-timer]', root);
        if (!el) return clearInterval(qrTimer);
        left--;
        if (left <= 0) { clearInterval(qrTimer); el.classList.add('expired'); el.lastElementChild.textContent = 'QR Code หมดอายุ — กรุณาเลือกวิธีชำระเงินใหม่'; $('[data-paid]', root).disabled = true; return; }
        el.lastElementChild.textContent = `กรุณาชำระเงินภายใน ${String(Math.floor(left / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')} นาที`;
      };
      qrTimer = setInterval(tick, 1000);
    }
    root.addEventListener('click', (e) => {
      const m = e.target.closest('[data-m]');
      if (m) { actions.setCheckout({ method: m.dataset.m }); refresh(); }
      if (e.target.closest('[data-paid]')) { clearInterval(qrTimer); const o = actions.placeOrder('qr'); location.hash = `#/checkout/status/${o.id}`; }
    });
    const form = $('[data-cardform]', root);
    if (form) {
      form.num.addEventListener('input', () => { form.num.value = form.num.value.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 '); });
      form.exp.addEventListener('input', () => { const d = form.exp.value.replace(/\D/g, '').slice(0, 4); form.exp.value = d.length > 2 ? `${d.slice(0, 2)} / ${d.slice(2)}` : d; });
      form.cvv.addEventListener('input', () => { form.cvv.value = form.cvv.value.replace(/\D/g, ''); });
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const exp = form.exp.value.replace(/\D/g, '');
        const checks = {
          name: form.name.value.trim().length > 2,
          num: form.num.value.replace(/\D/g, '').length === 16,
          exp: exp.length === 4 && +exp.slice(0, 2) >= 1 && +exp.slice(0, 2) <= 12,
          cvv: form.cvv.value.length >= 3,
        };
        Object.entries(checks).forEach(([k2, ok]) => form[k2].classList.toggle('invalid', !ok));
        if (!Object.values(checks).every(Boolean)) return toast('กรุณากรอกข้อมูลบัตรให้ถูกต้องครบถ้วน', 'warn');
        const btn = form.querySelector('button');
        btn.disabled = true; btn.textContent = 'กำลังดำเนินการ...';
        setTimeout(() => { const o = actions.placeOrder('card'); location.hash = `#/checkout/status/${o.id}`; }, 900);
      });
    }
  };

  // ---------- สถานะการชำระเงิน ----------
  const orderMoney = (o) => [['ยอดสินค้า', o.totals.subtotal], ['ส่วนลด', -o.totals.discount], ['ค่าจัดส่ง', o.totals.shipping], ['บริการเสริม', o.totals.addons], ['ค่าธรรมเนียม 7%', o.totals.fee]];
  PAGES.status = function (root, { id }) {
    const o = S().orders.find((x) => x.id === id);
    if (!o) { root.innerHTML = `<div class="container page"><div class="empty">ไม่พบคำสั่งซื้อ</div></div>`; return; }
    root.innerHTML = `<div class="container page">
      ${checkoutCrumbs(4)}
      <div style="display:flex;justify-content:space-between;align-items:center"><h1 class="page-title">สถานะการชำระเงิน</h1><a class="btn btn-primary" href="#/">กลับหน้าหลัก</a></div>
      ${stepper(4)}
      <section class="panel" style="padding:48px">
        <div style="display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap">
          <div class="success-head"><div class="ok">${icon('check', 40, 3)}</div><div><h2 style="font-size:30px;color:var(--primary)">ชำระเงินสำเร็จ</h2><span class="muted">ชำระด้วย${esc(o.method)}</span></div></div>
          <div style="text-align:right"><b>#${o.id}</b><div class="muted">วันที่สั่งซื้อ: ${o.date}</div></div>
        </div>
        <hr class="divider" style="margin:24px 0">
        <div style="display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap"><div><b style="color:var(--primary)">วิธีชำระเงิน</b><div class="muted">${esc(o.method)}</div></div>
          <div style="text-align:right"><b style="color:var(--primary)">ยอดรวมสุทธิ</b><div class="order-total">${money(o.totals.total)} บาท</div></div></div>
        <b style="color:var(--primary);display:block;margin:20px 0 8px">สรุปค่าใช้จ่าย</b>
        ${orderMoney(o).map(([k2, v]) => `<div class="kv"><span class="muted">${k2}</span><span>${money(v)} บาท</span></div>`).join('')}
        <hr class="divider" style="margin:24px 0">
        <a class="btn btn-block btn-lg" href="#/account/orders">ติดตามคำสั่งซื้อ</a>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px"><button class="btn btn-lg" data-print>ดาวน์โหลดใบเสร็จรับเงิน</button><button class="btn btn-lg" data-print>ดาวน์โหลดใบกำกับภาษี</button></div>
        <hr class="divider" style="margin:24px 0">
        <div style="display:flex;justify-content:space-between;margin-bottom:16px"><b style="color:var(--primary);font-size:18px">รายการสินค้า</b><span class="muted">${o.items.length} รายการ</span></div>
        ${itemsTable(o.items)}
        <hr class="divider" style="margin:24px 0">
        <b style="color:var(--primary);font-size:18px">ที่อยู่จัดส่ง</b>
        <div style="display:grid;grid-template-columns:110px 1fr;gap:6px;margin-top:10px"><span class="muted">ชื่อผู้รับ</span><span>${esc(o.recipient.name)}</span><span class="muted">โทร</span><span>${o.recipient.phone}</span><span class="muted">อีเมล</span><span>${esc(o.recipient.email)}</span><span class="muted">ที่อยู่</span><span>${esc(o.address)}</span></div>
      </section></div>`;
    root.addEventListener('click', (e) => { if (e.target.closest('[data-print]')) window.print(); });
  };

  // ---------- บัญชี: รายการคำสั่งซื้อ ----------
  function acctNav(active) {
    const link = (href, label) => `<a href="#${href}" class="${active === href ? 'on' : ''}">${label}</a>`;
    return `<aside class="acct-nav"><div class="me"><span class="icon-circle" style="background:var(--primary);color:#fff">${icon('user', 24, 2)}</span>${esc(S().user.name)}</div>
      <div class="grp"><small>เมนูบัญชี</small>${link('/account/recipients', 'ข้อมูลผู้รับสินค้า')}${link('/account/addresses', 'ข้อมูลที่อยู่จัดส่ง')}${link('/account/taxes', 'ข้อมูลสำหรับขอรับใบกำกับภาษี')}
      <small>เมนูคำสั่งซื้อ</small>${link('/account/favorites', 'รายการโปรดของฉัน')}${link('/account/quotes', 'ประวัติการขอใบเสนอราคา')}${link('/account/orders', 'รายการคำสั่งซื้อ')}
      <small>ระบบ</small>${link('/account/contact', 'ติดต่อเรา')}<button data-logout>ออกจากระบบ</button></div></aside>`;
  }
  const badgeCls = (s) => (s === 'สำเร็จ' ? 'done' : s === 'กำลังจัดส่ง' ? 'ship' : 'wait');
  let orderTab = 'ทั้งหมด', orderQ = '';
  PAGES.orders = function (root) {
    const all = S().orders;
    const tabs = ['ทั้งหมด', ...SHOP.ORDER_STATUSES];
    const count = (t) => (t === 'ทั้งหมด' ? all.length : all.filter((o) => o.status === t).length);
    const list = all.filter((o) => (orderTab === 'ทั้งหมด' || o.status === orderTab) && (!orderQ || o.id.toLowerCase().includes(orderQ.toLowerCase())));
    root.innerHTML = `<div class="container page">
      ${crumbs([['หน้าหลัก', '#/'], ['บัญชีของฉัน', '#/account/orders'], ['รายการคำสั่งซื้อ']])}
      <div class="acct">${acctNav('/account/orders')}
      <div><h1 style="font-size:24px">รายการคำสั่งซื้อ</h1>
        <form data-osearch style="display:flex;gap:8px;background:#fff;border:1px solid var(--border-soft);border-radius:10px;padding:6px 6px 6px 18px;margin-top:16px"><input name="q" style="flex:1;border:0;outline:0" placeholder="ค้นหาเลขคำสั่งซื้อ" value="${esc(orderQ)}"><button class="btn btn-primary" style="height:36px">ค้นหา</button></form>
        <div class="status-tabs">${tabs.map((t) => `<button data-tab="${t}" class="${orderTab === t ? 'on' : ''}">${t}<span class="n">${count(t)}</span></button>`).join('')}</div>
        <section class="panel"><h2 class="h-sec" style="margin-bottom:16px">รายการ</h2>
          ${list.length ? list.map((o) => `<div class="order-card">
            <div><b>เลขคำสั่งซื้อ: #${o.id}</b> <span class="muted" style="margin-left:12px">วันที่สั่งซื้อ: ${o.date}</span></div>
            <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap"><div class="muted">ยอดชำระสุทธิ<br>ชำระด้วย ${esc(o.method)}</div>
              <div style="display:flex;gap:16px;align-items:center"><span class="order-total">${money(o.totals.total)} บาท</span><button class="btn" style="height:36px" data-reorder="${o.id}">สั่งซื้ออีกครั้ง</button></div></div>
            <div class="track"><div style="display:flex;justify-content:space-between"><b>ติดตามการจัดส่ง</b><span class="status-badge ${badgeCls(o.status)}">${o.status}</span></div>
              <ul class="timeline">${o.timeline.map(([s2, d]) => `<li><b>${s2}</b><span>${d}</span></li>`).join('')}</ul>
              <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px 16px">
                <div style="grid-column:1/-1"><span class="muted">ข้อมูลผู้รับสินค้า</span><div>${esc(o.recipient.name)}</div></div>
                <div style="grid-column:1/-1"><span class="muted">ทะเบียนรถ</span><div>${esc(o.vehicle.plate)}</div></div>
                <div><span class="muted">ประเภทรถ</span><div>${esc(o.vehicle.type)}</div></div><div><span class="muted">น้ำหนักที่รองรับ (กก.)</span><div>${num(o.vehicle.capacity)}</div></div><div><span class="muted">น้ำหนักสินค้ารวม (กก.)</span><div>${num(o.totals.weight, 1)}</div></div>
                <div style="grid-column:1/3"><span class="muted">ที่อยู่จัดส่ง</span><div>${esc(o.address)}</div></div><div><span class="muted">วันที่นัดหมาย</span><div>${esc(o.vehicle.appointment)}</div></div>
              </div></div>
            ${o.items.map((it) => `<div class="item-row"><img src="${A(it.img)}" alt=""><div class="grow"><b>${esc(it.name)} ×${it.qty}</b><div class="muted">เกรด ${it.grade} • ${esc(it.standard)}</div></div>
              <div style="text-align:right"><span class="muted">จำนวน</span><br><b>${it.qty} เส้น</b></div><div style="text-align:right;min-width:110px"><span class="muted">ยอดรวม</span><br><b>${num(it.qty * it.price)} บาท</b></div></div>`).join('')}
            <div class="track"><b style="color:var(--primary)">สรุปรายละเอียด</b>${orderMoney(o).map(([k2, v]) => `<div class="kv"><span class="muted">${k2}</span><span>${money(v)} บาท</span></div>`).join('')}</div>
            <div style="display:flex;gap:8px;justify-content:flex-end"><button class="btn" data-print>ดาวน์โหลดใบเสร็จรับเงิน</button><button class="btn" data-print>ดาวน์โหลดใบกำกับภาษี</button></div>
          </div>`).join('') : '<div class="empty">ไม่มีคำสั่งซื้อในสถานะนี้</div>'}
        </section></div></div></div>`;
    root.addEventListener('click', (e) => {
      const tb = e.target.closest('[data-tab]');
      if (tb) { orderTab = tb.dataset.tab; refresh(); }
      const ro = e.target.closest('[data-reorder]');
      if (ro) { actions.reorder(ro.dataset.reorder); toast('เพิ่มสินค้าเข้าตะกร้าแล้ว', 'ok', ' <a href="#/cart">ดูตะกร้า</a>'); refresh(); }
      if (e.target.closest('[data-print]')) window.print();
    });
    $('[data-osearch]', root).addEventListener('submit', (e) => { e.preventDefault(); orderQ = e.target.q.value.trim(); refresh(); });
  };

  PAGES.favorites = function (root) {
    const favs = S().fav.map(product).filter(Boolean);
    root.innerHTML = `<div class="container page">${crumbs([['หน้าหลัก', '#/'], ['บัญชีของฉัน', '#/account/orders'], ['รายการโปรดของฉัน']])}
      <div class="acct">${acctNav('/account/favorites')}<div><h1 style="font-size:24px;margin-bottom:16px">รายการโปรดของฉัน (${favs.length})</h1>
        ${favs.length ? `<div class="grid-3">${favs.map(productCard).join('')}</div>` : '<div class="empty">ยังไม่มีสินค้าในรายการโปรด<br>กดรูปหัวใจบนการ์ดสินค้าเพื่อบันทึก</div>'}</div></div></div>`;
  };

  PAGES.accountInfo = function (root, { section }) {
    const s = S();
    const map = {
      recipients: ['ข้อมูลผู้รับสินค้า', s.recipients.map((r) => [r.name, `${r.phone} • ${r.email}`]), 'recipient'],
      addresses: ['ข้อมูลที่อยู่จัดส่ง', s.addresses.map((a) => [a.title, a.full]), 'address'],
      taxes: ['ข้อมูลสำหรับขอรับใบกำกับภาษี', s.taxes.map((t) => [t.name, `เลขประจำตัวผู้เสียภาษี : ${t.taxId}`]), 'tax'],
      quotes: ['ประวัติการขอใบเสนอราคา', [], null],
      contact: ['ติดต่อเรา', [['บริษัท เดอะ สตีล จำกัด (มหาชน)', 'โทร 02-123-4567 • อีเมล contact@thesteel.co.th • จันทร์–เสาร์ 08:00–17:00 น.']], null],
    };
    const [title, rows, kind] = map[section] || map.recipients;
    root.innerHTML = `<div class="container page">${crumbs([['หน้าหลัก', '#/'], ['บัญชีของฉัน', '#/account/orders'], [title]])}
      <div class="acct">${acctNav('/account/' + section)}<div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px"><h1 style="font-size:24px">${title}</h1>${kind ? '<button class="btn btn-primary" data-addinfo>เพิ่มข้อมูล</button>' : ''}</div>
        <section class="panel">${rows.length ? rows.map(([a, b]) => `<div style="padding:14px 0;border-bottom:1px solid var(--border-soft)"><b>${esc(a)}</b><div class="muted">${esc(b)}</div></div>`).join('') : '<div class="empty" style="border:0">ยังไม่มีข้อมูล</div>'}</section>
      </div></div></div>`;
    const btn = $('[data-addinfo]', root);
    btn && btn.addEventListener('click', () => {
      if (kind === 'recipient') formModal('เพิ่มข้อมูลผู้รับ', [['name', 'ชื่อ-นามสกุล'], ['phone', 'เบอร์โทรศัพท์'], ['email', 'อีเมล']], (v) => { actions.addRecipient(v); refresh(); });
      if (kind === 'address') formModal('เพิ่มที่อยู่จัดส่ง', [['title', 'ชื่อที่อยู่'], ['full', 'ที่อยู่เต็ม']], (v) => { actions.addAddress(v); refresh(); });
      if (kind === 'tax') formModal('เพิ่มข้อมูลใบกำกับภาษี', [['name', 'ชื่อบริษัท / ชื่อบุคคล'], ['taxId', 'เลขประจำตัวผู้เสียภาษี']], (v) => { actions.addTax(v); refresh(); });
    });
  };
})();

// ---------- บทความ (list + detail) ----------
(function () {
  const { esc, product, ARTICLES } = SHOP;
  const { icon, $, $$, A, crumbs, productCard, toast } = UI;
  const TOPICS = ['ทั้งหมด', ...new Set(ARTICLES.map((a) => a.topic))];
  const meta = (a) => `<span>${icon('clock', 16)} ${a.date}</span><span>อ่าน ${a.read} นาที</span><span>โดย ${esc(a.author)}</span>`;
  const card = (a) => `<a class="article-card" href="#/articles/${a.id}"><img src="${A(a.img)}" alt="" loading="lazy">
    <div class="ac-body"><span class="topic">${esc(a.topic)}</span><b>${esc(a.title)}</b><p>${esc(a.sub)}</p><div class="meta">${meta(a)}</div></div></a>`;

  let topic = 'ทั้งหมด', q = '';
  PAGES.articles = function (root) {
    root.innerHTML = `<div class="container page">
      ${crumbs([['หน้าหลัก', '#/'], ['บทความ']])}
      <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:16px;flex-wrap:wrap;margin-bottom:20px">
        <div><h1 class="page-title">บทความ</h1><p class="page-sub">ความรู้เรื่องเหล็กและงานก่อสร้าง จากทีมวิศวกร The Steel</p></div>
        <label class="toolbar"><span class="search">${icon('search', 20)}<input data-q placeholder="ค้นหาบทความ" value="${esc(q)}" aria-label="ค้นหาบทความ"></span></label>
      </div>
      <div class="topic-chips">${TOPICS.map((t) => `<button class="${t === topic ? 'on' : ''}" data-topic="${esc(t)}">${esc(t)}</button>`).join('')}</div>
      <div data-list></div></div>`;
    function draw() {
      const ql = q.trim().toLowerCase();
      const list = ARTICLES.filter((a) => (topic === 'ทั้งหมด' || a.topic === topic) && (!ql || (a.title + a.sub + a.topic).toLowerCase().includes(ql)));
      const [lead, ...rest] = list;
      $('[data-list]', root).innerHTML = !lead ? '<div class="empty">ไม่พบบทความที่ค้นหา</div>'
        : `<a class="article-lead" href="#/articles/${lead.id}"><img src="${A(lead.img)}" alt=""><div><span class="topic">${esc(lead.topic)}</span><h2>${esc(lead.title)}</h2><p>${esc(lead.sub)}</p><div class="meta">${meta(lead)}</div><span class="btn btn-primary" style="margin-top:20px;align-self:flex-start">อ่านบทความ</span></div></a>
          ${rest.length ? `<div class="grid-3" style="margin-top:24px">${rest.map(card).join('')}</div>` : ''}`;
      $$('[data-topic]', root).forEach((b) => b.classList.toggle('on', b.dataset.topic === topic));
    }
    root.addEventListener('click', (e) => { const t = e.target.closest('[data-topic]'); if (t) { topic = t.dataset.topic; draw(); } });
    $('[data-q]', root).addEventListener('input', (e) => { q = e.target.value; draw(); });
    draw();
  };

  const block = ([type, a, b]) => {
    if (type === 'h') return `<h2>${esc(a)}</h2>`;
    if (type === 'p') return `<p>${esc(a)}</p>`;
    if (type === 'ul') return `<ul>${a.map((li) => `<li>${esc(li)}</li>`).join('')}</ul>`;
    if (type === 'tip') return `<aside class="tip-box">${icon('info', 20)}<div><b>เคล็ดลับ</b><p>${esc(a)}</p></div></aside>`;
    if (type === 'table') return `<div class="table-wrap"><table class="table left"><thead><tr>${a.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${b.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    return '';
  };

  PAGES.article = function (root, { id }) {
    const i = ARTICLES.findIndex((a) => a.id === id);
    if (i < 0) { root.innerHTML = `<div class="container page"><div class="empty">ไม่พบบทความ<br><a class="btn btn-primary" href="#/articles" style="margin-top:16px">ดูบทความทั้งหมด</a></div></div>`; return; }
    const a = ARTICLES[i], prev = ARTICLES[i - 1], next = ARTICLES[i + 1];
    const others = ARTICLES.filter((x) => x.id !== a.id).sort((x, y) => (y.topic === a.topic) - (x.topic === a.topic)).slice(0, 3);
    root.innerHTML = `<div class="container page">
      ${crumbs([['หน้าหลัก', '#/'], ['บทความ', '#/articles'], [a.title]])}
      <div class="article-layout">
        <article class="article">
          <span class="topic">${esc(a.topic)}</span>
          <h1>${esc(a.title)}</h1>
          <p class="lede">${esc(a.sub)}</p>
          <div class="meta">${meta(a)}</div>
          <img class="cover" src="${A(a.img)}" alt="">
          <div class="article-body">${a.body.map(block).join('')}</div>
          <div class="share"><span class="muted">แชร์บทความ</span><button class="btn" data-copy>คัดลอกลิงก์</button><button class="btn" data-print>พิมพ์</button></div>
          <nav class="prev-next">${prev ? `<a href="#/articles/${prev.id}"><small>← บทความก่อนหน้า</small><b>${esc(prev.title)}</b></a>` : '<span></span>'}
            ${next ? `<a href="#/articles/${next.id}" style="text-align:right"><small>บทความถัดไป →</small><b>${esc(next.title)}</b></a>` : '<span></span>'}</nav>
        </article>
        <aside class="article-side">
          <div class="panel"><h3 class="h-sec" style="font-size:20px;margin-bottom:12px">บทความอื่นที่น่าสนใจ</h3>
            ${others.map((o) => `<a class="side-article" href="#/articles/${o.id}"><img src="${A(o.img)}" alt=""><div><b>${esc(o.title)}</b><small class="muted">${o.date} · อ่าน ${o.read} นาที</small></div></a>`).join('')}
            <a class="btn btn-block" href="#/articles" style="margin-top:12px">ดูบทความทั้งหมด</a></div>
        </aside>
      </div>
      <div class="section-head"><h2>สินค้าที่เกี่ยวข้องกับบทความ</h2><a href="#/products">ดูทั้งหมด ${icon('chevRight', 22, 2.4)}</a></div>
      <div class="grid-3">${a.products.map(product).filter(Boolean).map(productCard).join('')}</div>
    </div>`;
    document.title = `${a.title} · Easy Steel`;
    root.addEventListener('click', (e) => {
      if (e.target.closest('[data-print]')) window.print();
      if (e.target.closest('[data-copy]')) {
        const url = location.href;
        (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(() => toast('คัดลอกลิงก์บทความแล้ว'), () => toast('คัดลอกไม่สำเร็จ — คัดลอกจากแถบที่อยู่แทน', 'warn'));
      }
    });
  };
})();
