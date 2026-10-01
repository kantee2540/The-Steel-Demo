// Login, dashboards (admin + warehouse) and placeholder pages.
(function () {
  const { esc, fmt, $, $$, badge, pageHead, simpleTable, modal, toast, downloadCsv } = UI;

  // ---------- Login ----------
  PAGES.login = function (app) {
    app.innerHTML = `
      <div class="login">
        <section class="login-brand">
          <img src="assets/logo.png" alt="Easy Steel">
          <h1>ระบบจัดการข้อมูลหลังบ้าน</h1>
          <p>จัดการสินค้า สต็อก คำสั่งซื้อ และข้อมูลลูกค้าของ The Steel ได้ในที่เดียว ปลอดภัย รวดเร็ว และเชื่อมต่อกับระบบ SAP แบบเรียลไทม์</p>
        </section>
        <section class="login-form">
          <form novalidate>
            <h2>เข้าสู่ระบบ</h2>
            <p class="lead">เข้าสู่ระบบเพื่อจัดการระบบหลังบ้าน The Steel</p>
            <div class="field"><label for="lg-user">อีเมลหรือชื่อผู้ใช้งาน</label><input class="input" id="lg-user" placeholder="name@thesteel.com" required autocomplete="username"></div>
            <div class="field"><label for="lg-pass">รหัสผ่าน</label><input class="input" id="lg-pass" type="password" placeholder="••••••••" required autocomplete="current-password"></div>
            <div class="login-row">
              <label class="check"><input type="checkbox" id="lg-remember"> จดจำการเข้าสู่ระบบ</label>
              <a href="#/forgot">ลืมรหัสผ่าน?</a>
            </div>
            <button class="btn btn-primary btn-block" type="submit">เข้าสู่ระบบ</button>
            <p class="err" data-err>กรุณากรอกอีเมลและรหัสผ่าน</p>
            <p class="subtle" style="font-size:13px;margin-top:16px;text-align:center">ต้นแบบ: กรอกอีเมลและรหัสผ่านใดก็ได้เพื่อเข้าสู่ระบบ<br>(อีเมลที่ขึ้นต้นด้วย guest จะเห็นหน้า “ไม่มีสิทธิ์เข้าใช้งาน”)</p>
          </form>
        </section>
      </div>`;
    const form = $('form', app);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const u = $('#lg-user', app), p = $('#lg-pass', app);
      const ok = u.value.trim() && p.value.trim();
      u.classList.toggle('invalid', !u.value.trim());
      p.classList.toggle('invalid', !p.value.trim());
      $('[data-err]', app).style.display = ok ? 'none' : 'block';
      if (!ok) return;
      if (/^guest/i.test(u.value.trim())) { location.hash = '#/no-access'; return; }
      SESSION.login($('#lg-remember', app).checked);
      location.hash = '#/dashboard';
    });
  };

  // ---------- Dashboard ----------
  PAGES.dashboard = function (root) {
    if (SESSION.role === 'warehouse') return warehouseDashboard(root);
    adminDashboard(root);
  };

  function adminDashboard(root) {
    const D = DB.dashboard;
    const period = ['7 วัน', '30 วัน', '3 เดือน', '6 เดือน', '1 ปี'];
    root.innerHTML = `
      ${pageHead('ภาพรวม', '<button class="btn" data-xls>Export Excel</button><button class="btn btn-primary" data-pdf>Export PDF</button>')}
      <div class="card">
        <div class="card-head">
          <h2 class="card-title">ภาพรวมยอดขาย ประจำปี 2569</h2>
          <div class="chips" data-period>
            ${period.map((p) => `<button class="chip${p === '1 ปี' ? ' on' : ''}">${p}</button>`).join('')}
            <button class="chip">${icon('calendar', 14)} กำหนดเอง</button>
          </div>
        </div>
        <div class="stats-4">
          ${D.kpis.map((k) => `<div class="stat"><div class="s-label">${esc(k.label)}</div><div class="s-value">${esc(k.value)}</div><span class="delta">▲ ${esc(k.delta)}</span></div>`).join('')}
        </div>

        <div class="card-head"><h2 class="card-title">ยอดขายรายปี</h2>
          <div class="legend"><span><i style="background:var(--primary)"></i>ปีนี้ (2569)</span><span><i style="background:#f26b1d"></i>ปีที่แล้ว (2568)</span></div></div>
        <div class="chart-box" data-chart>${lineChart(D)}<div class="chart-tip"></div></div>

        <div class="card-head"><h2 class="card-title">ยอดขายแยกตามหมวดหมู่</h2>
          <div class="chips" data-split><button class="chip">สาขา</button><button class="chip on">หมวดสินค้า</button></div></div>
        <div class="donut-wrap" data-donut></div>

        <div class="card-head"><h2 class="card-title">สินค้าขายดี Top 10</h2></div>
        ${simpleTable([
          { label: 'อันดับ', cell: (r) => `<b style="color:var(--primary)">${r.i}</b>` },
          { label: 'สินค้า', cell: (r) => esc(r[0]) },
          { label: 'ยอดขายเทียบสูงสุด', cell: (r) => `<div class="bar-track"><div class="bar-fill" style="width:${(r[2] / D.top10[0][2]) * 100}%"></div></div>`, cls: 'w-bar' },
          { label: 'จำนวนที่ขาย (ชิ้น)', cell: (r) => `${r[1]} ชิ้น`, cls: 'num' },
          { label: 'ยอดขาย', cell: (r) => `<b>${r[2].toFixed(2)} ล้าน</b>`, cls: 'num' },
        ], D.top10.map((r, i) => Object.assign([...r], { i: i + 1 })), 'compact')}
      </div>`;

    $$('.w-bar', root).forEach((td) => (td.style.width = '40%'));
    const donutEl = $('[data-donut]', root);
    const drawDonut = (list) => (donutEl.innerHTML = donut(list));
    drawDonut(D.byCategory);

    root.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (chip) {
        const group = chip.parentElement;
        $$('.chip', group).forEach((c) => c.classList.toggle('on', c === chip));
        if (group.matches('[data-split]')) drawDonut(chip.textContent.trim() === 'สาขา' ? D.byBranch : D.byCategory);
      }
      if (e.target.closest('[data-xls]')) {
        downloadCsv('sales-overview-2569.csv', [['เดือน', 'ปี 2569 (บาท)', 'ปี 2568 (บาท)'], ...D.months.map((m, i) => [m, D.thisYear[i], D.lastYear[i]])]);
        toast('ส่งออกไฟล์ Excel (CSV) แล้ว');
      }
      if (e.target.closest('[data-pdf]')) window.print();
    });
    bindChartHover($('[data-chart]', root), D);
  }

  // Smooth line through points using Catmull-Rom -> cubic Bezier.
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

  const CH = { w: 1060, h: 270, l: 48, r: 1050, t: 16, b: 228, max: 2750000 };
  const xAt = (i) => CH.l + 40 + (i * (CH.r - CH.l - 60)) / 11;
  const yAt = (v) => CH.b - (v / CH.max) * (CH.b - CH.t);

  function lineChart(D) {
    const ticks = [0, 500000, 1000000, 1500000, 2000000, 2500000];
    const grid = ticks.map((t) => `<line x1="${CH.l}" x2="${CH.r}" y1="${yAt(t)}" y2="${yAt(t)}" stroke="#ececf1"/>
      <text x="${CH.l - 8}" y="${yAt(t) + 4}" text-anchor="end" font-size="11" fill="#8e8e99">${t === 0 ? '0' : t >= 1000000 ? (t / 1e6).toFixed(1) + 'M' : t / 1000 + 'K'}</text>`).join('');
    const xl = D.months.map((m, i) => `<text x="${xAt(i)}" y="${CH.b + 20}" text-anchor="middle" font-size="11" fill="#8e8e99">${m}</text>`).join('');
    const p1 = D.thisYear.map((v, i) => [xAt(i), yAt(v)]);
    const p2 = D.lastYear.map((v, i) => [xAt(i), yAt(v)]);
    return `<svg viewBox="0 0 ${CH.w} ${CH.h}" role="img" aria-label="กราฟยอดขายรายเดือน ปี 2569 เทียบ 2568">
      ${grid}${xl}
      <path d="${smooth(p2)}" fill="none" stroke="#f26b1d" stroke-width="2" stroke-dasharray="4 4"/>
      <path d="${smooth(p1)}" fill="none" stroke="#181871" stroke-width="3"/>
      <line data-guide x1="0" x2="0" y1="${CH.t}" y2="${CH.b}" stroke="#c9c9d2" stroke-dasharray="3 3" visibility="hidden"/>
      <circle data-dot1 r="5" fill="#181871" stroke="#fff" stroke-width="2" visibility="hidden"/>
      <circle data-dot2 r="4" fill="#f26b1d" stroke="#fff" stroke-width="2" visibility="hidden"/>
      <rect data-hit x="${CH.l}" y="0" width="${CH.r - CH.l}" height="${CH.b}" fill="transparent"/>
    </svg>`;
  }

  function bindChartHover(box, D) {
    const svg = $('svg', box), tip = $('.chart-tip', box), hit = $('[data-hit]', svg);
    const guide = $('[data-guide]', svg), d1 = $('[data-dot1]', svg), d2 = $('[data-dot2]', svg);
    const show = (on) => [guide, d1, d2].forEach((el) => el.setAttribute('visibility', on ? 'visible' : 'hidden'));
    hit.addEventListener('mousemove', (e) => {
      const r = svg.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * CH.w;
      let i = Math.round(((x - CH.l - 40) / (CH.r - CH.l - 60)) * 11);
      i = Math.max(0, Math.min(11, i));
      const cx = xAt(i);
      guide.setAttribute('x1', cx); guide.setAttribute('x2', cx);
      d1.setAttribute('cx', cx); d1.setAttribute('cy', yAt(D.thisYear[i]));
      d2.setAttribute('cx', cx); d2.setAttribute('cy', yAt(D.lastYear[i]));
      show(true);
      tip.innerHTML = `<div class="subtle" style="font-size:12px">${D.months[i]} 2569</div><div>2569: <b>${fmt(D.thisYear[i])}</b></div><div>2568: <b>${fmt(D.lastYear[i])}</b></div>`;
      tip.style.display = 'block';
      const px = (cx / CH.w) * r.width + 16;
      const left = px + tip.offsetWidth + 24 > box.clientWidth ? px - tip.offsetWidth - 32 : px;
      tip.style.left = left + 'px';
      tip.style.top = Math.max(8, (yAt(D.thisYear[i]) / CH.h) * r.height - 20) + 'px';
    });
    hit.addEventListener('mouseleave', () => { tip.style.display = 'none'; show(false); });
  }

  function donut(list) {
    const R = 66, C = 2 * Math.PI * R;
    let acc = 0;
    const segs = list.filter((s) => s.pct > 0).map((s) => {
      const len = (s.pct / 100) * C;
      const seg = `<circle r="${R}" cx="110" cy="110" fill="none" stroke="${s.color}" stroke-width="34" stroke-dasharray="${len} ${C - len}" stroke-dashoffset="${-acc}" transform="rotate(-90 110 110)"><title>${esc(s.name)} ${s.pct}%</title></circle>`;
      acc += len;
      return seg;
    }).join('');
    return `<svg width="220" height="220" viewBox="0 0 220 220" role="img" aria-label="สัดส่วนยอดขาย">${segs}</svg>
      <div class="donut-list">${list.map((s) => `<div class="row"><span><i style="background:${s.color}"></i>${esc(s.name)}</span><span>${fmt(s.amount)} บาท (${s.pct.toFixed(1)}%)</span></div>`).join('')}</div>`;
  }

  function warehouseDashboard(root) {
    const pending = DB.orders.filter((o) => ['รอดำเนินการ', 'เตรียมสินค้าแล้ว', 'กำลังจัดส่ง'].includes(o.status)).slice(0, 5);
    const count = (s) => DB.orders.filter((o) => o.status === s).length;
    const label = (s) => (DB.lowStock.find((r) => r[1] === s.sku) || [`${s.name} ${s.w}${s.l !== '-' ? 'x' + s.l : ''} มม.`])[0];
    const lowList = (t) => DB.stock.filter((s) => s.qty < t && s.status !== 'ปิดการขาย').sort((a, b) => a.qty - b.qty);
    root.innerHTML = `
      ${pageHead('ภาพรวม')}
      <div class="kpi-row">
        ${[['คำสั่งซื้อวันนี้', DB.orders.filter((o) => o.date === '10 ก.ย. 2569').length], ['คำสั่งซื้อที่รอดำเนินการ', count('รอดำเนินการ')], ['กำลังจัดส่ง', count('กำลังจัดส่ง')], ['คำสั่งซื้อที่ถูกยกเลิก', count('ยกเลิก')]]
          .map(([l, v]) => `<div class="kpi"><div class="k-label">${l}</div><div class="k-value">${v}</div></div>`).join('')}
      </div>
      <div class="card">
        <div class="card-head"><h2 class="card-title">คำสั่งซื้อที่ต้องเตรียมจัดส่ง</h2><a href="#/orders" style="font-size:14px">ดูทั้งหมด &gt;</a></div>
        ${simpleTable([
          { label: 'เลขที่คำสั่งซื้อ', cell: (o) => '#' + o.id },
          { label: 'ลูกค้า', cell: (o) => esc(o.customer) },
          { label: 'สถานะ', cell: (o) => badge(o.status) },
          { label: 'ยอดรวม (บาท)', cell: (o) => fmt(o.total) },
          { label: 'วันที่', cell: (o) => o.date },
          { label: 'จัดการ', cell: (o) => `<a href="#/orders/${o.id}">ดูรายละเอียด</a>` },
        ], pending)}
      </div>
      <div class="card" data-low></div>`;
    function drawLow() {
      const t = DB.stockAlertThreshold;
      $('[data-low]', root).innerHTML = `
        <div class="card-head"><div><h2 class="card-title">แจ้งเตือนสต็อกใกล้หมด</h2><p class="card-sub">สินค้าที่มีจำนวนคงเหลือต่ำกว่า ${fmt(t)} ชิ้น ต้องเติมสต็อก</p></div>
          <div style="display:flex;gap:16px;align-items:center"><button class="btn" data-threshold>ตั้งค่าแจ้งเตือน</button><a href="#/stock" style="font-size:14px">ดูทั้งหมด</a></div></div>
        ${lowList(t).length ? simpleTable([
          { label: 'สินค้า', cell: (s) => esc(label(s)) },
          { label: 'SKU', cell: (s) => `<span class="muted">${s.sku}</span>` },
          { label: 'คงเหลือ (ชิ้น)', cell: (s) => fmt(s.qty) },
          { label: 'สถานะ', cell: (s) => badge(s.qty === 0 ? 'หมดสต็อก' : 'ใกล้หมด') },
          { label: 'จัดการ', cell: (s) => `<a href="#/stock/${s.sku}">ปรับปรุงสต็อก</a>` },
        ], lowList(t)) : '<p class="placeholder" style="padding:24px">ไม่มีสินค้าที่ต่ำกว่าเกณฑ์</p>'}`;
    }
    root.addEventListener('click', (e) => {
      if (!e.target.closest('[data-threshold]')) return;
      const summary = (t) => { const l = lowList(t); const out = l.filter((s) => s.qty === 0).length; return `<b>ตามเกณฑ์นี้ มีสินค้าที่ต้องแจ้งเตือน ${l.length} รายการ</b><div class="muted" style="font-size:13px">หมดสต็อก ${out} รายการ · ใกล้หมด ${l.length - out} รายการ</div>`; };
      modal({
        title: 'ตั้งค่าแจ้งเตือนสต็อกต่ำ',
        body: `ระบบจะแจ้งเตือนบน Dashboard เมื่อสินค้ามีจำนวนคงเหลือต่ำกว่าค่าที่กำหนด
          <div class="form-grid"><div class="field"><label for="th-in">แจ้งเตือนเมื่อจำนวนคงเหลือต่ำกว่า (ชิ้น)<span class="req">*</span></label><input class="input" id="th-in" type="number" min="1" value="${DB.stockAlertThreshold}" required></div>
          <div data-sum style="background:#f8f9fb;border-radius:8px;padding:12px 16px;color:var(--text)">${summary(DB.stockAlertThreshold)}</div></div>`,
        confirm: 'บันทึก',
        onOpen: (m) => $('#th-in', m).addEventListener('input', (ev) => { const v = +ev.target.value; if (v > 0) $('[data-sum]', m).innerHTML = summary(v); }),
        onConfirm: (m) => {
          const v = +$('#th-in', m).value;
          if (!(v > 0)) { $('#th-in', m).classList.add('invalid'); toast('กรุณาระบุจำนวนมากกว่า 0', 'warn'); return false; }
          DB.stockAlertThreshold = v; drawLow();
          toast('บันทึกการตั้งค่าแจ้งเตือนแล้ว');
        },
      });
    });
    drawLow();
  }

  // ---------- Placeholder for menu items that have no screen in Figma ----------
  PAGES.placeholder = function (root, _p, label) {
    root.innerHTML = `${pageHead(label)}<div class="card placeholder">${icon('file', 48, 1.2)}<h2>ยังไม่มีหน้าจอนี้ในไฟล์ Figma</h2><p>เมนู “${esc(label)}” อยู่ในโครงสร้างเมนูของดีไซน์ แต่ยังไม่มีการออกแบบหน้าจอ</p></div>`;
  };
})();
