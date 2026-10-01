// Admin dashboard (ภาพรวม) driven by sample order data, with period / branch / category filters.
// Orders are generated once from a fixed seed so every visit shows the same numbers.
(function () {
  const { esc, fmt, $, $$, pageHead, modal, toast, downloadCsv } = UI;

  // ---------- Sample order data ----------
  const START = new Date(2024, 9, 1);   // 1 ต.ค. 2567 — one extra year so "last year" comparisons have data
  const TODAY = new Date(2026, 8, 30);  // 30 ก.ย. 2569 — the prototype's "today"
  const DAY = 86400000;
  const dayIdx = (d) => Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - START) / DAY);
  const dateAt = (i) => new Date(START.getFullYear(), START.getMonth(), START.getDate() + i);
  const LAST = dayIdx(TODAY);

  const CATS = [
    { name: 'เหล็กเพื่องานฐานราก', color: '#2b7bd8' }, { name: 'เหล็กเพื่องานโครงสร้าง', color: '#ec6a35' },
    { name: 'เหล็กโครงสร้างรูปพรรณกลวง', color: '#f0a500' }, { name: 'เหล็กอเนกประสงค์', color: '#1fb27a' },
    { name: 'เหล็กสำเร็จรูป', color: '#9b8afb' },
  ];
  // [name, category, unit price (บาท), popularity weight]
  const PRODUCTS = [
    ['เหล็กเส้นกลม 12 มม.', 0, 285, 12], ['เหล็กเส้นข้ออ้อย 16 มม.', 0, 320, 9], ['ลวดผูกเหล็ก', 0, 950, 6],
    ['เหล็กฉาก 3x3 นิ้ว', 1, 540, 9], ['เหล็กรางน้ำ C-Channel', 1, 600, 6], ['เหล็กฉาก 2x2 นิ้ว', 1, 380, 5], ['เหล็ก H-Beam 150 มม.', 1, 4800, 3],
    ['เหล็กกล่อง 2x2 นิ้ว', 2, 420, 8], ['ท่อเหล็กกลม 1 นิ้ว', 2, 310, 7], ['ท่อเหล็กกล่องแบน 2x4 นิ้ว', 2, 690, 3],
    ['เหล็กแผ่นดำ 3 มม.', 3, 1250, 6], ['ตะแกรงเหล็กไวร์เมช', 3, 750, 4], ['เหล็กแบน 25x3 มม.', 3, 200, 4],
    ['เหล็กปลอกสำเร็จรูป', 4, 450, 1],
  ];
  const BRANCH_W = { 'BKK-01': 42, 'CHO-01': 23, 'KRT-01': 16, 'RYG-01': 12 }; // others share the remaining 7%

  function rng(seed) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function pickWeighted(r, items, w) { let x = r() * w.reduce((a, b) => a + b, 0); for (let i = 0; i < items.length; i++) { x -= w[i]; if (x <= 0) return items[i]; } return items[items.length - 1]; }
  function poisson(r, l) { let k = 0, p = 1; const L = Math.exp(-l); do { k++; p *= r(); } while (p > L); return k - 1; }

  let ORDERS;
  function orders() {
    if (ORDERS) return ORDERS;
    const r = rng(2569);
    const codes = DB.branches.map((b) => b.code);
    const others = codes.filter((c) => !BRANCH_W[c]);
    const bw = codes.map((c) => BRANCH_W[c] || 7 / others.length);
    const pw = PRODUCTS.map((p) => p[3]);
    const SEASON = [0.8, 0.85, 1.0, 0.9, 1.05, 1.1, 1.0, 1.0, 1.05, 1.1, 1.15, 1.0];
    let nextCustomer = 150; // customers 0..149 already bought before the data window
    ORDERS = [];
    for (let d = 0; d <= LAST; d++) {
      const date = dateAt(d);
      const growth = Math.pow(1.11, d / 365); // ~11% year-on-year growth
      const lambda = 3.1 * SEASON[date.getMonth()] * growth * (date.getDay() === 0 ? 0.35 : 1);
      for (let n = poisson(r, lambda); n > 0; n--) {
        const customer = r() < 0.05 ? nextCustomer++ : Math.floor(r() * nextCustomer);
        const budget = 11965 * (0.3 + 1.4 * r());
        const k = 1 + Math.floor(r() * 3);
        const lines = [];
        for (let j = 0; j < k; j++) {
          const p = pickWeighted(r, PRODUCTS, pw);
          const qty = Math.max(1, Math.round(budget / k / p[2]));
          lines.push({ p: PRODUCTS.indexOf(p), cat: p[1], qty, amount: qty * p[2] });
        }
        ORDERS.push({ day: d, branch: pickWeighted(r, codes, bw), customer, lines });
      }
    }
    // First purchase day per customer, to split new vs returning customers.
    const first = {};
    ORDERS.forEach((o) => { if (!(o.customer in first)) first[o.customer] = o.customer < 150 ? -1 : o.day; });
    ORDERS.first = first;
    return ORDERS;
  }

  // ---------- Aggregation ----------
  // Lines matching the category filter; an order counts only if at least one line matches.
  function matching(o, f) { return f.cat === 'all' ? o.lines : o.lines.filter((l) => l.cat === +f.cat); }
  function inRange(from, to, f) {
    return orders().filter((o) => o.day >= from && o.day <= to && (f.branch === 'all' || o.branch === f.branch))
      .map((o) => ({ o, lines: matching(o, f) })).filter((x) => x.lines.length);
  }
  function kpis(list, from) {
    const sales = list.reduce((s, x) => s + x.lines.reduce((a, l) => a + l.amount, 0), 0);
    const custs = new Set(list.map((x) => x.o.customer));
    let neu = 0;
    custs.forEach((c) => { if (orders().first[c] >= from) neu++; });
    return { sales, count: list.length, avg: list.length ? sales / list.length : 0, neu, ret: custs.size - neu };
  }
  const yearBack = (i) => { const d = dateAt(i); d.setFullYear(d.getFullYear() - 1); return dayIdx(d); };

  // ---------- Formatting ----------
  const TH_M = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const thDate = (i, withYear = true) => { const d = dateAt(i); return `${d.getDate()} ${TH_M[d.getMonth()]}${withYear ? ' ' + (d.getFullYear() + 543) : ''}`; };
  const money = (v) => (v >= 1e6 ? `${(v / 1e6).toFixed(2)} ล้าน` : `${fmt(v)} บาท`);
  const iso = (i) => { const d = dateAt(i); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const fromIso = (s) => { const [y, m, d] = s.split('-').map(Number); return dayIdx(new Date(y, m - 1, d)); };

  // ---------- Periods & buckets ----------
  const PERIODS = { '7 วัน': [0, 0, 7], '30 วัน': [0, 0, 30], '3 เดือน': [0, 3, 0], '6 เดือน': [0, 6, 0], '1 ปี': [1, 0, 0] };
  function periodRange(key) {
    const [y, m, d] = PERIODS[key];
    if (d) return [LAST - d + 1, LAST];
    // Step back from the day after TODAY, so 6 months ending 30 ก.ย. starts on 1 เม.ย.
    const s = new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate() + 1); s.setFullYear(s.getFullYear() - y); s.setMonth(s.getMonth() - m);
    return [dayIdx(s), LAST];
  }
  // Bucket size follows range length: daily ≤ 31 days, weekly ≤ 120 days, otherwise monthly.
  function buckets(from, to) {
    const span = to - from + 1;
    const out = [];
    if (span <= 31) { for (let i = from; i <= to; i++) out.push({ from: i, to: i, label: thDate(i, false) }); return { unit: 'รายวัน', list: out }; }
    if (span <= 120) { for (let i = from; i <= to; i += 7) out.push({ from: i, to: Math.min(i + 6, to), label: thDate(i, false) }); return { unit: 'รายสัปดาห์', list: out }; }
    let d = dateAt(from);
    while (dayIdx(d) <= to) {
      const s = Math.max(dayIdx(d), from);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const yy = String(d.getFullYear() + 543).slice(2);
      out.push({ from: s, to: Math.min(dayIdx(end), to), label: `${TH_M[d.getMonth()]} ${yy}` });
      d = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    }
    return { unit: 'รายเดือน', list: out };
  }

  // ---------- Chart ----------
  function smooth(pts) {
    let d = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
    }
    return d;
  }
  const CH = { w: 1060, h: 270, l: 56, r: 1050, t: 16, b: 228 };
  function niceMax(v) { if (v <= 0) return 1000; const p = Math.pow(10, Math.floor(Math.log10(v))); return [1, 2, 2.5, 5, 10].map((m) => m * p).find((m) => m >= v); }
  const tick = (t) => (t === 0 ? '0' : t >= 1e6 ? `${+(t / 1e6).toFixed(2)}M` : t >= 1000 ? `${+(t / 1000).toFixed(1)}K` : String(t));

  function chart(series) {
    const n = series.cur.length;
    const max = niceMax(Math.max(...series.cur, ...series.prev.filter((v) => v != null)) * 1.05);
    const xAt = (i) => (n === 1 ? (CH.l + CH.r) / 2 : CH.l + 24 + (i * (CH.r - CH.l - 40)) / (n - 1));
    const yAt = (v) => CH.b - (v / max) * (CH.b - CH.t);
    const ticks = [0, 1, 2, 3, 4, 5].map((k) => (max * k) / 5);
    const every = Math.ceil(n / 13);
    const line = (vals, attrs) => {
      const pts = vals.map((v, i) => (v == null ? null : [xAt(i), yAt(v)])).filter(Boolean);
      return pts.length > 1 ? `<path d="${smooth(pts)}" fill="none" ${attrs}/>` : pts.length ? `<circle cx="${pts[0][0]}" cy="${pts[0][1]}" r="4" fill="#181871"/>` : '';
    };
    return {
      xAt, yAt,
      svg: `<svg viewBox="0 0 ${CH.w} ${CH.h}" role="img" aria-label="กราฟยอดขายช่วงที่เลือกเทียบช่วงเดียวกันปีก่อน">
        ${ticks.map((t) => `<line x1="${CH.l}" x2="${CH.r}" y1="${yAt(t)}" y2="${yAt(t)}" stroke="#ececf1"/><text x="${CH.l - 8}" y="${yAt(t) + 4}" text-anchor="end" font-size="11" fill="#8e8e99">${tick(t)}</text>`).join('')}
        ${series.labels.map((l, i) => (i % every === 0 || i === n - 1 ? `<text x="${xAt(i)}" y="${CH.b + 20}" text-anchor="middle" font-size="11" fill="#8e8e99">${l}</text>` : '')).join('')}
        ${line(series.prev, 'stroke="#f26b1d" stroke-width="2" stroke-dasharray="4 4"')}
        ${line(series.cur, 'stroke="#181871" stroke-width="3"')}
        <line data-guide y1="${CH.t}" y2="${CH.b}" stroke="#c9c9d2" stroke-dasharray="3 3" visibility="hidden"/>
        <circle data-dot2 r="4" fill="#f26b1d" stroke="#fff" stroke-width="2" visibility="hidden"/>
        <circle data-dot1 r="5" fill="#181871" stroke="#fff" stroke-width="2" visibility="hidden"/>
        <rect data-hit x="${CH.l}" y="0" width="${CH.r - CH.l}" height="${CH.b}" fill="transparent"/></svg>`,
    };
  }

  function bindHover(box, c, s) {
    const svg = $('svg', box), tip = $('.chart-tip', box);
    const g = $('[data-guide]', svg), d1 = $('[data-dot1]', svg), d2 = $('[data-dot2]', svg);
    const n = s.cur.length;
    const show = (on) => [g, d1, d2].forEach((el) => el.setAttribute('visibility', on ? 'visible' : 'hidden'));
    $('[data-hit]', svg).addEventListener('mousemove', (e) => {
      const r = svg.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * CH.w;
      let i = 0, best = Infinity;
      for (let k = 0; k < n; k++) { const dd = Math.abs(c.xAt(k) - x); if (dd < best) { best = dd; i = k; } }
      const cx = c.xAt(i);
      g.setAttribute('x1', cx); g.setAttribute('x2', cx);
      d1.setAttribute('cx', cx); d1.setAttribute('cy', c.yAt(s.cur[i]));
      if (s.prev[i] != null) { d2.setAttribute('cx', cx); d2.setAttribute('cy', c.yAt(s.prev[i])); }
      show(true);
      if (s.prev[i] == null) d2.setAttribute('visibility', 'hidden');
      tip.innerHTML = `<div class="subtle" style="font-size:12px">${esc(s.ranges[i])}</div><div>ช่วงที่เลือก: <b>${fmt(s.cur[i])}</b></div><div>ปีก่อน: <b>${s.prev[i] == null ? 'ไม่มีข้อมูล' : fmt(s.prev[i])}</b></div>`;
      tip.style.display = 'block';
      const px = (cx / CH.w) * r.width + 16;
      tip.style.left = (px + tip.offsetWidth + 24 > box.clientWidth ? px - tip.offsetWidth - 32 : px) + 'px';
      tip.style.top = Math.max(8, (c.yAt(s.cur[i]) / CH.h) * r.height - 20) + 'px';
    });
    $('[data-hit]', svg).addEventListener('mouseleave', () => { tip.style.display = 'none'; show(false); });
  }

  function donut(list) {
    const total = list.reduce((s, x) => s + x.amount, 0);
    const R = 66, C = 2 * Math.PI * R;
    let acc = 0;
    const segs = total ? list.filter((x) => x.amount > 0).map((x) => {
      const len = (x.amount / total) * C;
      const seg = `<circle r="${R}" cx="110" cy="110" fill="none" stroke="${x.color}" stroke-width="34" stroke-dasharray="${len} ${C - len}" stroke-dashoffset="${-acc}" transform="rotate(-90 110 110)"><title>${esc(x.name)}</title></circle>`;
      acc += len; return seg;
    }).join('') : `<circle r="${R}" cx="110" cy="110" fill="none" stroke="#ececf1" stroke-width="34"/>`;
    return `<svg width="220" height="220" viewBox="0 0 220 220" role="img" aria-label="สัดส่วนยอดขาย">${segs}</svg>
      <div class="donut-list">${list.map((x) => `<div class="row"><span><i style="background:${x.color}"></i>${esc(x.name)}</span><span>${fmt(x.amount)} บาท (${total ? ((x.amount / total) * 100).toFixed(1) : '0.0'}%)</span></div>`).join('')}</div>`;
  }

  // ---------- Page ----------
  // Filter state survives navigating away and back within the session.
  const F = { period: '1 ปี', from: null, to: null, branch: 'all', cat: 'all', split: 'cat' };

  function admin(root) {
    if (!F.from) [F.from, F.to] = periodRange(F.period);
    const branchOpts = [['all', 'ทุกสาขา'], ...DB.branches.map((b) => [b.code, b.name])];
    const catOpts = [['all', 'ทุกหมวดหมู่'], ...CATS.map((c, i) => [String(i), c.name])];
    root.innerHTML = `
      ${pageHead('ภาพรวม', '<button class="btn" data-xls>Export Excel</button><button class="btn btn-primary" data-pdf>Export PDF</button>')}
      <div class="card">
        <div class="card-head" style="align-items:flex-start">
          <div><h2 class="card-title">ภาพรวมยอดขาย</h2><p class="card-sub" data-range></p></div>
          <div class="chips" data-period>
            ${Object.keys(PERIODS).map((p) => `<button class="chip" data-p="${p}">${p}</button>`).join('')}
            <button class="chip" data-p="custom">${icon('calendar', 14)} <span data-custom-label>กำหนดเอง</span></button>
          </div>
        </div>
        <div class="dash-filters">
          <label class="field"><span class="field-label">สาขา</span><select class="select" data-f="branch">${branchOpts.map(([v, l]) => `<option value="${v}" ${F.branch === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></label>
          <label class="field"><span class="field-label">หมวดหมู่สินค้า</span><select class="select" data-f="cat">${catOpts.map(([v, l]) => `<option value="${v}" ${F.cat === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></label>
          <button class="btn" data-clear hidden>${icon('x', 16)} ล้างตัวกรอง</button>
        </div>
        <div data-body></div>
      </div>`;
    const body = $('[data-body]', root);

    function render() {
      $$('[data-p]', root).forEach((c) => c.classList.toggle('on', c.dataset.p === F.period));
      $('[data-custom-label]', root).textContent = F.period === 'custom' ? `${thDate(F.from)} – ${thDate(F.to)}` : 'กำหนดเอง';
      $('[data-clear]', root).hidden = F.branch === 'all' && F.cat === 'all';
      const pf = yearBack(F.from), pt = yearBack(F.to);
      const hasPrev = pf >= 0;
      $('[data-range]', root).textContent = `${thDate(F.from)} – ${thDate(F.to)} · เทียบกับช่วงเดียวกันปีก่อน${hasPrev ? '' : ' (ไม่มีข้อมูลเปรียบเทียบ)'}`;

      const cur = inRange(F.from, F.to, F);
      const prev = hasPrev ? inRange(pf, pt, F) : [];
      const k = kpis(cur, F.from), kp = kpis(prev, pf);
      const delta = (a, b) => {
        if (!hasPrev || !b) return '<span class="delta flat">—</span>';
        const p = ((a - b) / b) * 100;
        return `<span class="delta ${p < 0 ? 'down' : ''}">${p < 0 ? '▼' : '▲'} ${Math.abs(p).toFixed(1)}%</span>`;
      };

      const B = buckets(F.from, F.to);
      const sum = (list, a, b) => list.reduce((s, x) => (x.o.day >= a && x.o.day <= b ? s + x.lines.reduce((t, l) => t + l.amount, 0) : s), 0);
      const series = {
        labels: B.list.map((b) => b.label),
        ranges: B.list.map((b) => (b.from === b.to ? thDate(b.from) : `${thDate(b.from)} – ${thDate(b.to)}`)),
        cur: B.list.map((b) => sum(cur, b.from, b.to)),
        prev: B.list.map((b) => (hasPrev ? sum(prev, yearBack(b.from), yearBack(b.to)) : null)),
      };
      const c = chart(series);

      const split = F.split === 'cat'
        ? CATS.map((cat, i) => ({ name: cat.name, color: cat.color, amount: cur.reduce((s, x) => s + x.lines.filter((l) => l.cat === i).reduce((a, l) => a + l.amount, 0), 0) }))
          .filter((x, i) => F.cat === 'all' || i === +F.cat)
        : (() => {
          const by = {};
          cur.forEach((x) => { by[x.o.branch] = (by[x.o.branch] || 0) + x.lines.reduce((a, l) => a + l.amount, 0); });
          const rows = Object.entries(by).sort((a, b) => b[1] - a[1]);
          const colors = ['#2b7bd8', '#ec6a35', '#f0a500', '#1fb27a', '#b8b8be'];
          const named = rows.slice(0, 4).map(([code, amount], i) => ({ name: DB.branches.find((b) => b.code === code)?.name || code, amount, color: colors[i] }));
          const rest = rows.slice(4).reduce((s, r) => s + r[1], 0);
          return rest ? [...named, { name: 'สาขาอื่น ๆ', amount: rest, color: colors[4] }] : named;
        })();

      const prod = {};
      cur.forEach((x) => x.lines.forEach((l) => { const p = (prod[l.p] = prod[l.p] || { qty: 0, amount: 0 }); p.qty += l.qty; p.amount += l.amount; }));
      const top = Object.entries(prod).map(([i, v]) => ({ name: PRODUCTS[i][0], ...v })).sort((a, b) => b.amount - a.amount).slice(0, 10);

      body.innerHTML = !cur.length ? '<p class="placeholder" style="padding:48px">ไม่มียอดขายตามตัวกรองที่เลือก</p>' : `
        <div class="stats-4">
          <div class="stat"><div class="s-label">ยอดขาย (บาท)</div><div class="s-value">${fmt(k.sales)}</div>${delta(k.sales, kp.sales)}</div>
          <div class="stat"><div class="s-label">จำนวนออเดอร์</div><div class="s-value">${fmt(k.count)}</div>${delta(k.count, kp.count)}</div>
          <div class="stat"><div class="s-label">ยอดเฉลี่ยต่อออเดอร์ (บาท)</div><div class="s-value">${fmt(k.avg)}</div>${delta(k.avg, kp.avg)}</div>
          <div class="stat"><div class="s-label">ลูกค้าใหม่ / ซื้อซ้ำ (คน)</div><div class="s-value">${fmt(k.neu)} / ${fmt(k.ret)}</div>${delta(k.neu + k.ret, kp.neu + kp.ret)}</div>
        </div>
        <div class="card-head"><h2 class="card-title">ยอดขาย${B.unit}</h2>
          <div class="legend"><span><i style="background:var(--primary)"></i>ช่วงที่เลือก</span><span><i style="background:#f26b1d"></i>ช่วงเดียวกันปีก่อน</span></div></div>
        <div class="chart-box" data-chart>${c.svg}<div class="chart-tip"></div></div>
        <div class="card-head"><h2 class="card-title">ยอดขายแยกตาม${F.split === 'cat' ? 'หมวดหมู่' : 'สาขา'}</h2>
          <div class="chips" data-split><button class="chip ${F.split === 'branch' ? 'on' : ''}" data-s="branch">สาขา</button><button class="chip ${F.split === 'cat' ? 'on' : ''}" data-s="cat">หมวดสินค้า</button></div></div>
        <div class="donut-wrap">${donut(split)}</div>
        <div class="card-head"><h2 class="card-title">สินค้าขายดี Top 10</h2></div>
        <div class="table-wrap"><table class="tbl compact"><thead><tr><th>อันดับ</th><th>สินค้า</th><th style="width:40%">ยอดขายเทียบสูงสุด</th><th class="num">จำนวนที่ขาย (ชิ้น)</th><th class="num">ยอดขาย</th></tr></thead><tbody>
          ${top.map((p, i) => `<tr><td><b style="color:var(--primary)">${i + 1}</b></td><td>${esc(p.name)}</td><td><div class="bar-track"><div class="bar-fill" style="width:${(p.amount / top[0].amount) * 100}%"></div></div></td><td class="num">${fmt(p.qty)} ชิ้น</td><td class="num"><b>${money(p.amount)}</b></td></tr>`).join('')}
        </tbody></table></div>`;
      if (cur.length) bindHover($('[data-chart]', body), c, series);
      render.last = { series, k, top };
    }

    function openCustom() {
      modal({
        title: 'กำหนดช่วงวันที่',
        body: `มีข้อมูลตั้งแต่ ${thDate(0)} ถึง ${thDate(LAST)}
          <div class="form-grid cols-2"><div class="field"><label for="dr-from">จากวันที่</label><input class="input" type="date" id="dr-from" min="${iso(0)}" max="${iso(LAST)}" value="${iso(F.from)}"></div>
          <div class="field"><label for="dr-to">ถึงวันที่</label><input class="input" type="date" id="dr-to" min="${iso(0)}" max="${iso(LAST)}" value="${iso(F.to)}"></div></div>`,
        confirm: 'ใช้ช่วงวันที่นี้',
        onConfirm: (m) => {
          const a = $('#dr-from', m).value, b = $('#dr-to', m).value;
          if (!a || !b) { toast('กรุณาเลือกวันที่ให้ครบ', 'warn'); return false; }
          const f = fromIso(a), t = fromIso(b);
          if (f > t) { toast('วันที่เริ่มต้นต้องไม่เกินวันที่สิ้นสุด', 'warn'); return false; }
          if (f < 0 || t > LAST) { toast('อยู่นอกช่วงที่มีข้อมูล', 'warn'); return false; }
          Object.assign(F, { period: 'custom', from: f, to: t }); render();
        },
      });
    }

    root.addEventListener('click', (e) => {
      const p = e.target.closest('[data-p]');
      if (p) { if (p.dataset.p === 'custom') return openCustom(); F.period = p.dataset.p; [F.from, F.to] = periodRange(F.period); render(); }
      const s = e.target.closest('[data-s]');
      if (s) { F.split = s.dataset.s; render(); }
      if (e.target.closest('[data-clear]')) { F.branch = 'all'; F.cat = 'all'; $$('[data-f]', root).forEach((el) => (el.value = 'all')); render(); }
      if (e.target.closest('[data-xls]')) {
        const L = render.last, br = branchOpts.find((o) => o[0] === F.branch)[1], ct = catOpts.find((o) => o[0] === F.cat)[1];
        downloadCsv(`sales-overview_${iso(F.from)}_${iso(F.to)}.csv`, [
          ['ช่วงวันที่', `${thDate(F.from)} – ${thDate(F.to)}`], ['สาขา', br], ['หมวดหมู่', ct], [],
          ['ยอดขาย (บาท)', L.k.sales], ['จำนวนออเดอร์', L.k.count], ['ยอดเฉลี่ยต่อออเดอร์', Math.round(L.k.avg)], ['ลูกค้าใหม่', L.k.neu], ['ลูกค้าซื้อซ้ำ', L.k.ret], [],
          ['ช่วง', 'ยอดขาย (บาท)', 'ช่วงเดียวกันปีก่อน (บาท)'], ...L.series.ranges.map((r, i) => [r, L.series.cur[i], L.series.prev[i] ?? '']), [],
          ['อันดับ', 'สินค้า', 'จำนวน (ชิ้น)', 'ยอดขาย (บาท)'], ...L.top.map((p, i) => [i + 1, p.name, p.qty, p.amount]),
        ]);
        toast('ส่งออกไฟล์ Excel (CSV) ตามตัวกรองแล้ว');
      }
      if (e.target.closest('[data-pdf]')) window.print();
    });
    root.addEventListener('change', (e) => { const f = e.target.dataset.f; if (f) { F[f] = e.target.value; render(); } });
    render();
  }

  window.DASH = { admin };
})();
