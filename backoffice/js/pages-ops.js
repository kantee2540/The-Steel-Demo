// Orders, logistics, branches, members, users, reports.
(function () {
  const { esc, fmt, $, $$, badge, pageHead, selectHtml, dateInput, simpleTable, modal, confirmDelete, toast, validate, downloadCsv, pagerHtml } = UI;

  const editDel = (lockDelete) => `<span class="actions-cell"><a data-act="edit">แก้ไข</a><a class="link-danger${lockDelete ? ' disabled' : ''}" data-act="delete">ลบ</a></span>`;

  // Edit opens the record's form page; delete confirms and removes the row.
  function rowActions(list, label, nameKey, editHref) {
    return (act, row, render) => {
      if (act === 'edit') location.hash = editHref(row);
      if (act === 'delete') confirmDelete(row[nameKey], () => { list.splice(list.indexOf(row), 1); render(); toast(`ลบ${label}แล้ว`); });
    };
  }

  // ---------- จัดการคำสั่งซื้อ ----------
  const ORDER_STATUSES = ['รอดำเนินการ', 'เตรียมสินค้าแล้ว', 'กำลังจัดส่ง', 'สำเร็จ', 'ยกเลิก'];
  PAGES.orders = function (root) {
    UI.listPage(root, {
      title: 'จัดการคำสั่งซื้อ',
      search: { label: 'ค้นหาคำสั่งซื้อ', placeholder: 'เลขที่คำสั่งซื้อ / ลูกค้า', keys: ['id', 'customer'] },
      status: { key: 'status', options: ORDER_STATUSES },
      extraFilters: `<div class="field" style="order:3"><label for="f-date">ช่วงวันที่เริ่มต้น - สิ้นสุด</label>${dateInput('f-date', '1 ก.ย. 2569 - 10 ก.ย.2569')}</div>`,
      filterCols: '1fr 1fr 1fr',
      rows: () => DB.orders,
      cols: [
        { label: 'เลขที่คำสั่งซื้อ', cell: (o) => '#' + o.id },
        { label: 'ลูกค้า', cell: (o) => esc(o.customer) },
        { label: 'สถานะ', cell: (o) => badge(o.status) },
        { label: 'ยอดรวม (บาท)', cell: (o) => fmt(o.total) },
        { label: 'วันที่', cell: (o) => o.date },
        { label: 'จัดการ', cell: (o) => `<a href="#/orders/${o.id}">ดูรายละเอียด</a>` },
      ],
      onRowClick: (o) => (location.hash = `#/orders/${o.id}`),
    });
  };

  const STEPS = ['รอดำเนินการ', 'กำลังจัดเตรียมสินค้า', 'เตรียมจัดส่ง', 'กำลังจัดส่ง', 'สำเร็จ'];
  // step = index of the current (orange) step; steps before it are done; 5 = all done.
  const stepFromStatus = { 'รอดำเนินการ': 0, 'เตรียมสินค้าแล้ว': 2, 'กำลังจัดส่ง': 3, 'สำเร็จ': 5 };
  const statusFromStep = ['รอดำเนินการ', 'รอดำเนินการ', 'เตรียมสินค้าแล้ว', 'กำลังจัดส่ง', 'สำเร็จ', 'สำเร็จ'];

  PAGES.orderDetail = function (root, { id }) {
    const o = DB.orders.find((x) => x.id === id);
    if (!o) { root.innerHTML = `${pageHead('ไม่พบคำสั่งซื้อ')}<div class="card placeholder"><h2>ไม่พบคำสั่งซื้อ #${esc(id)}</h2><p><a href="#/orders">กลับไปหน้าจัดการคำสั่งซื้อ</a></p></div>`; return; }
    o.times = o.times || ['10 ก.ย. 2569 - 10:31', '10 ก.ย. 2569 - 11:23', '10 ก.ย. 2569 - 13:05', '10 ก.ย. 2569 - 14:40', '10 ก.ย. 2569 - 17:10'];
    if (o.step === undefined) o.step = stepFromStatus[o.status] ?? 0;
    if (o.status === 'ยกเลิก' && o.refund === undefined) { o.refund = 1; o.ctimes = [`${o.date} - 14:32`]; }
    const items = DB.orderItems;
    const sum = items.reduce((s, [, q, p]) => s + q * p, 0);

    function render() {
      const step = o.step;
      const cancelled = o.status === 'ยกเลิก';
      const accepted = step >= 1 && !cancelled;
      const C = ['ดำเนินการยกเลิกรายการ', 'กำลังคืนเงิน', 'สำเร็จ'];
      const tracker = cancelled
        ? `<div class="card"><h2 class="card-title">ติดตามสถานะการยกเลิก</h2>
            <div class="stepper cancel-steps">${C.map((s, i) => `<div class="step ${i < o.refund ? 'done' : i === o.refund ? 'current' : ''}${i === 2 && o.refund > 2 ? ' ok' : ''}">
              <div class="circle">${i === 2 && o.refund > 2 ? icon('check', 18, 3) : i + 1}</div><div class="s-name">${s}</div>${i < o.refund && o.ctimes[i] ? `<div class="s-time">${o.ctimes[i]}</div>` : ''}</div>`).join('')}</div></div>`
        : `<div class="card"><h2 class="card-title">การจัดส่ง / ติดตามสถานะ</h2>
            <div class="stepper">${STEPS.map((s, i) => {
              const cls = i < step ? 'done' : i === step ? 'current' : '';
              const last = i === 4 && step >= 5;
              return `<div class="step ${cls}${last ? ' ok' : ''}"><div class="circle">${last ? icon('check', 18, 3) : i + 1}</div><div class="s-name">${s}</div>${i < step && i < 4 && o.times[i] ? `<div class="s-time">${o.times[i]}</div>` : ''}</div>`;
            }).join('')}</div></div>`;
      root.innerHTML = `
        ${pageHead(`คำสั่งซื้อ #${o.id}`, `<a class="btn" href="#/orders">← กลับ</a>`)}
        <div class="stack">
        ${tracker}
        ${step >= 5 && !cancelled ? `<div class="card"><h2 class="card-title" style="margin-bottom:12px">จัดส่งเมื่อ</h2><div class="kv-grid c2">
          <div class="kv"><div class="k">วันที่ / เวลา จัดส่งสำเร็จ</div><div class="v">${o.times[3]}</div></div>
          <div class="kv"><div class="k">ผู้รับสินค้า</div><div class="v">${esc(o.customer)}</div></div></div></div>` : ''}

        <div class="card"><h2 class="card-title" style="margin-bottom:12px">ข้อมูลลูกค้า</h2>
          <div class="kv-grid c2">
            <div class="kv"><div class="k">ชื่อลูกค้า</div><div class="v">${esc(o.customer)}</div></div>
            <div class="kv"><div class="k">เบอร์โทรศัพท์</div><div class="v">089-765-4321</div></div>
            <div class="kv"><div class="k">อีเมล</div><div class="v">wipawadee.s@thaiconst.co.th</div></div>
            <div class="kv"><div class="k">ที่อยู่</div><div class="v">123/45 ถ.พระราม 9 แขวงห้วยขวาง<br>เขตห้วยขวาง กรุงเทพฯ 10310</div></div>
          </div></div>

        ${accepted && step >= 2 ? `<div class="card"><h2 class="card-title" style="margin-bottom:12px">รถขนส่ง</h2>
          <div class="kv-grid c3">
            <div class="kv"><div class="k">ประเภทรถขนส่ง</div><div class="v">รถบรรทุก 6 ล้อ</div></div>
            <div class="kv"><div class="k">ทะเบียนรถ</div><div class="v">8กก-1234 กรุงเทพมหานคร</div></div>
            <div class="kv"><div class="k">ชื่อคนขับรถ</div><div class="v">สมชาย แสวงบุญ</div></div>
          </div></div>` : ''}

        <div class="card"><h2 class="card-title" style="margin-bottom:12px">รายการสินค้า</h2>
          <div class="table-wrap"><table class="tbl compact"><thead><tr><th>สินค้า / สเปค</th><th>จำนวน</th><th>ราคาต่อหน่วย (บาท)</th><th>ราคารวม (บาท)</th></tr></thead><tbody>
            ${items.map(([n, q, p]) => `<tr><td>${esc(n)}</td><td>${fmt(q)}</td><td>${fmt(p)}</td><td>${fmt(q * p)}</td></tr>`).join('')}
            <tr class="total-row"><td colspan="3">ราคาสินค้ารวม (บาท)</td><td class="big">${fmt(sum)}</td></tr>
          </tbody></table></div>
          <div class="kv-grid c2" style="margin-top:16px">
            <div class="kv"><div class="k">วันที่ชำระ</div><div class="v">30 ก.ย. 2569 - 12:30</div></div>
            <div class="kv"><div class="k">ช่องทาง</div><div class="v">QR PromptPay</div></div>
          </div></div>

        ${accepted || cancelled ? `<div class="card"><h2 class="card-title" style="margin-bottom:12px">พนักงานรับผิดชอบ</h2>
          <div class="kv-grid c3">
            <div class="kv"><div class="k">รหัสพนักงาน</div><div class="v">${DB.user.empId}</div></div>
            <div class="kv"><div class="k">ชื่อพนักงาน</div><div class="v">${DB.user.name}</div></div>
            <div class="kv"><div class="k">เบอร์โทรศัพท์</div><div class="v">${DB.user.phone}</div></div>
          </div></div>` : ''}

        ${accepted && step < 5 ? `<div class="card"><h2 class="card-title" style="margin-bottom:12px">พิมพ์เอกสาร</h2>
          <button class="btn btn-block" data-print>พิมพ์ใบส่งของ</button></div>` : ''}

        ${cancelled ? (o.refund < 3 ? `<div class="card"><h2 class="card-title" style="margin-bottom:12px">ยืนยันการคืนเงิน</h2>
          <button class="btn btn-primary" style="min-width:215px" data-refund>ยืนยันคืนเงินสำเร็จ</button></div>` : '')
          : step >= 5 ? '' : `<div class="card"><h2 class="card-title" style="margin-bottom:12px">${step === 0 ? 'ดำเนินการรับออเดอร์สินค้า' : step >= 3 ? 'ยืนยันการจัดส่งสำเร็จ' : 'ยืนยันเริ่มการจัดส่งสินค้า'}</h2>
          <div style="display:flex;gap:12px;flex-wrap:wrap"><button class="btn btn-primary" style="min-width:215px" data-next>${step === 0 ? 'รับออเดอร์และดำเนินการต่อ' : step >= 3 ? 'ยืนยันจัดส่งสำเร็จ' : 'ดำเนินการต่อ'}</button>
          <button class="btn btn-danger-outline" data-cancel>ยกเลิกรายการนี้</button></div></div>`}
        </div>`;
    }

    root.addEventListener('click', (e) => {
      if (e.target.closest('[data-print]')) window.print();
      if (e.target.closest('[data-next]')) {
        o.times[o.step] = UI.nowThai().replace(/ (\d\d:\d\d)$/, ' - $1');
        o.step = o.step >= 3 ? 5 : o.step + 1;
        o.status = statusFromStep[o.step];
        render();
        toast(o.step === 5 ? 'จัดส่งสำเร็จ' : `อัปเดตสถานะเป็น “${STEPS[o.step]}”`);
      }
      if (e.target.closest('[data-cancel]')) {
        modal({ title: 'ยกเลิกคำสั่งซื้อ', body: `ต้องการยกเลิกคำสั่งซื้อ #${o.id} ใช่หรือไม่?`, confirm: 'ยกเลิกคำสั่งซื้อ', cancel: 'ไม่ใช่', danger: true,
          onConfirm: () => { o.status = 'ยกเลิก'; o.refund = 1; o.ctimes = [UI.nowThai().replace(/ (\d\d:\d\d)$/, ' - $1')]; render(); toast('ยกเลิกคำสั่งซื้อแล้ว — เริ่มขั้นตอนคืนเงิน'); } });
      }
      if (e.target.closest('[data-refund]')) {
        o.ctimes[1] = UI.nowThai().replace(/ (\d\d:\d\d)$/, ' - $1');
        o.refund = 3; render(); toast('คืนเงินสำเร็จ');
      }
    });
    render();
  };

  // ---------- จัดการรถขนส่ง ----------
  PAGES.fleet = function (root) {
    const types = [...new Set(DB.fleet.map((f) => f.type))];
    UI.listPage(root, {
      title: 'จัดการรถขนส่ง',
      actions: `<a class="btn btn-primary" href="#/fleet/form/new">${icon('plus', 18)} เพิ่มรายการรถขนส่ง</a>`,
      search: { label: 'ค้นหาทะเบียนรถ', placeholder: 'ทะเบียนรถ', keys: ['plate'] },
      extraFilters: `<div class="field"><label for="f-type">ประเภทรถ</label>${selectHtml('f-type', ['ทั้งหมด', ...types], 'ทั้งหมด')}</div>`,
      extraMatch: (r) => { const v = $('#f-type', root).value; return v === 'ทั้งหมด' || r.type === v; },
      status: { key: 'status', options: ['ว่าง', 'กำลังใช้งาน', 'ไม่ให้บริการ'] },
      filterCols: '1.6fr 1fr 1fr',
      rows: () => DB.fleet,
      cols: [
        { label: 'ทะเบียนรถ', cell: (r) => esc(r.plate) },
        { label: 'ประเภทรถ', cell: (r) => r.type },
        { label: 'น้ำหนักบรรทุก (กก.)', cell: (r) => fmt(r.load) },
        { label: 'สถานะ', cell: (r) => badge(r.status) },
        { label: 'จัดการ', cell: (r) => editDel(r.status === 'กำลังใช้งาน') },
      ],
      onAction: rowActions(DB.fleet, 'รถขนส่ง', 'plate', (r) => `#/fleet/form/${DB.fleet.indexOf(r)}`),
    });
  };

  // ---------- บริการเสริม ----------
  PAGES.addons = function (root) {
    UI.listPage(root, {
      title: 'บริการเสริม',
      actions: `<a class="btn btn-primary" href="#/addons/form/new">${icon('plus', 18)} เพิ่มบริการเสริม</a>`,
      search: { label: 'ชื่อบริการเสริม', placeholder: 'ค้นหาบริการเสริม', keys: ['name'] },
      status: { key: 'status', options: ['พร้อมให้บริการ', 'ไม่พร้อมให้บริการ', 'จองเต็มแล้ว'] },
      filterCols: '3fr 1fr',
      rows: () => DB.addons,
      cols: [
        { label: 'บริการเสริม', cell: (r) => esc(r.name) },
        { label: 'อัตราค่าบริการ (บาท)', cell: (r) => fmt(r.rate) },
        { label: 'การจองบริการ<br>(จองแล้ว / จองสูงสุด)', cell: (r) => r.booked },
        { label: 'สถานะ', cell: (r) => badge(r.status) },
        { label: 'จัดการ', cell: () => editDel() },
      ],
      onAction: rowActions(DB.addons, 'บริการเสริม', 'name', (r) => `#/addons/form/${DB.addons.indexOf(r)}`),
    });
  };

  // ---------- สาขาและคลังสินค้า ----------
  PAGES.branches = function (root) {
    UI.listPage(root, {
      title: 'จัดการข้อมูลสาขาและคลังสินค้า',
      actions: `<a class="btn btn-primary" href="#/branches/new">${icon('plus', 18)} เพิ่มสาขาใหม่</a>`,
      search: { label: 'ค้นหารหัสสาขา', placeholder: 'รหัสสาขา / ชื่อสาขา', keys: ['code', 'name'] },
      status: { key: 'status', options: ['เปิดรับคำสั่งซื้อ', 'ปิดรับชั่วคราว'] },
      filterCols: '2fr 1fr',
      cardTitle: (n) => `รายการสาขาทั้งหมด (${n} สาขา)`,
      rows: () => DB.branches,
      cols: [
        { label: 'รหัสสาขา', cell: (r) => r.code },
        { label: 'ชื่อสาขา', cell: (r) => esc(r.name) },
        { label: 'เบอร์โทรศัพท์', cell: (r) => r.phone },
        { label: 'รัศมีจัดส่ง', cell: (r) => `${r.radius} กม.` },
        { label: 'สถานะรับคำสั่งซื้อ', cell: (r) => badge(r.status) },
        { label: 'จัดการ', cell: (r) => `<span class="actions-cell"><a href="#/branches/${r.code}">แก้ไข</a></span>` },
      ],
      onRowClick: (r) => (location.hash = `#/branches/${r.code}`),
    });
  };

  // ---------- ข้อมูลสมาชิก ----------
  PAGES.members = function (root) {
    UI.listPage(root, {
      title: 'ข้อมูลสมาชิก',
      search: { label: 'ค้นหาสมาชิก', placeholder: 'ชื่อสมาชิก / รหัสสมาชิก', keys: ['id', 'name'] },
      status: { key: 'status', options: ['เปิดใช้งาน', 'ระงับชั่วคราว', 'ปิดใช้งาน'] },
      filterCols: '3fr 1fr',
      rows: () => DB.members,
      cols: [
        { label: 'รหัสสมาชิก', cell: (r) => r.id },
        { label: 'ชื่อสมาชิก', cell: (r) => esc(r.name) },
        { label: 'เบอร์โทรศัพท์', cell: (r) => r.phone },
        { label: 'สถานะบัญชี', cell: (r) => badge(r.status) },
        { label: 'จัดการ', cell: (r) => `<a href="#/members/${r.id}">ดูข้อมูล</a>` },
      ],
      onRowClick: (r) => (location.hash = `#/members/${r.id}`),
    });
  };

  // ---------- ผู้ใช้งาน ----------
  const USER_TEMPLATE = ['รหัสพนักงาน', 'ชื่อ', 'นามสกุล', 'อีเมล', 'Role', 'สาขา/คลังสินค้า'];
  PAGES.users = function (root) {
    UI.listPage(root, {
      title: 'ผู้ใช้งาน',
      actions: `<button class="btn" data-import>นำเข้ารายชื่อผู้ใช้งาน</button><button class="btn" data-template>ดาวน์โหลดรูปแบบการนำเข้าผู้ใช้งาน</button><a class="btn btn-primary" href="#/users/form/new">เพิ่มผู้ใช้งาน</a>`,
      search: { label: 'ค้นหาผู้ใช้งาน', placeholder: 'รหัสพนักงาน / ชื่อ / นามสกุล', keys: ['id', 'name', 'email'] },
      status: { key: 'status', options: ['ใช้งาน', 'ระงับ'] },
      filterCols: '3fr 1fr',
      rows: () => DB.users,
      cols: [
        { label: 'รหัสพนักงาน', cell: (r) => r.id },
        { label: 'ชื่อ-นามสกุล', cell: (r) => esc(r.name) },
        { label: 'อีเมล', cell: (r) => `<span class="ellipsis" style="max-width:180px">${esc(r.email)}</span>` },
        { label: 'Role', cell: (r) => `<span class="pill-outline">${esc(r.role)}</span>` },
        { label: 'สาขา/คลังสินค้า', cell: (r) => esc(r.branch) },
        { label: 'สถานะ', cell: (r) => badge(r.status) },
        { label: 'จัดการ', cell: (r) => `<span class="actions-cell"><a href="#/users/form/${r.id}">แก้ไข</a></span>` },
      ],
    });
    root.addEventListener('click', (e) => {
      if (e.target.closest('[data-template]')) { downloadCsv('user_import_template.csv', [USER_TEMPLATE]); toast('ดาวน์โหลดรูปแบบการนำเข้าแล้ว'); }
      if (e.target.closest('[data-import]')) {
        const input = document.createElement('input');
        input.type = 'file'; input.accept = '.csv,.xlsx';
        input.onchange = () => input.files[0] && toast(`นำเข้า ${input.files[0].name} แล้ว (ต้นแบบ)`);
        input.click();
      }
    });
  };

})();
