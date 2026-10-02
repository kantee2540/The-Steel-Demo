// Login, dashboards (admin + warehouse) and placeholder pages.
(function () {
  const { esc, fmt, $, $$, badge, pageHead, simpleTable, modal, toast, downloadCsv } = UI;

  // ---------- Login ----------
  PAGES.login = function (app) {
    app.innerHTML = `
      <div class="login">
        <section class="login-brand">
          <img src="assets/logo.svg" alt="The Steel D">
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
    DASH.admin(root); // see dashboard.js
  };

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
