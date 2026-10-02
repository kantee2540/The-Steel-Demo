// Screens from Figma "Back Office > Total Features" that were missing from the presale set:
// access groups, user form, order/member reports, vehicle import/export, vehicle/add-on/branch forms,
// member detail, category form, product modal, and the password-reset / no-access auth pages.
(function () {
  const { esc, fmt, $, $$, badge, pageHead, searchInput, selectHtml, dateInput, simpleTable, pagerHtml, modal, confirmDelete, toast, validate, bindDropzone, downloadCsv, nowThai } = UI;
  const req = '<span class="req">*</span>';
  const ALL_PERMS = DB.permGroups.flatMap((g) => g.perms);
  const permSet = (r) => new Set(r.perms === 'all' ? ALL_PERMS.map((_, i) => i) : r.perms);

  // ---------- Thai date helpers for report filters ----------
  const TH_M = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  function parseThai(s) {
    const m = String(s).trim().match(/^(\d{1,2})\s*(\S+?)\s*(\d{4})/);
    if (!m) return null;
    const mi = TH_M.indexOf(m[2]);
    return mi < 0 ? null : new Date(+m[3] - 543, mi, +m[1]).getTime();
  }

  // ---------- Reports (shared: sales / orders / members) ----------
  function reportPage(root, { title, rows, dateKey, cols, csv, totals, from = '01 ก.ย. 2569' }) {
    const st = { from, to: '09 ก.ย. 2569', page: 1, size: 10 };
    root.innerHTML = `
      <div class="page-head" style="align-items:flex-end">
        <div><h1 class="page-title" style="margin-bottom:16px">${title}</h1>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <div class="field" style="width:250px"><label for="r-from">จากวันที่</label>${dateInput('r-from', st.from)}</div>
            <div class="field" style="width:250px"><label for="r-to">ถึงวันที่</label>${dateInput('r-to', st.to)}</div>
          </div></div>
        <div class="page-actions"><button class="btn" data-xls>Export Excel</button><button class="btn btn-primary" data-pdf>Export PDF</button></div>
      </div>
      <div class="card"><div data-body></div><div data-pager></div></div>`;
    const list = () => {
      const f = parseThai(st.from), t = parseThai(st.to);
      return rows().filter((r) => { const d = parseThai(r[dateKey]); return (f == null || d >= f) && (t == null || d <= t); });
    };
    function render() {
      const l = list();
      const pages = Math.max(1, Math.ceil(l.length / st.size));
      st.page = Math.min(st.page, pages);
      $('[data-body]', root).innerHTML = simpleTable(cols, l.slice((st.page - 1) * st.size, st.page * st.size), 'compact') +
        (totals && l.length ? `<div class="table-wrap"><table class="tbl compact"><tbody><tr class="total-row">${totals(l).map((c) => `<td style="width:${100 / cols.length}%">${c}</td>`).join('')}</tr></tbody></table></div>` : '') +
        (l.length ? '' : '<p class="placeholder" style="padding:32px">ไม่พบข้อมูลในช่วงวันที่ที่เลือก</p>');
      $('[data-pager]', root).innerHTML = pagerHtml(l.length, st.page, st.size);
    }
    root.addEventListener('change', (e) => {
      if (e.target.id === 'r-from' || e.target.id === 'r-to') {
        const ok = parseThai(e.target.value) != null;
        e.target.classList.toggle('invalid', !ok);
        if (!ok) return toast('รูปแบบวันที่ไม่ถูกต้อง เช่น 01 ก.ย. 2569', 'warn');
        st[e.target.id === 'r-from' ? 'from' : 'to'] = e.target.value; st.page = 1; render();
      }
      if (e.target.matches('[data-size]')) { st.size = +e.target.value; st.page = 1; render(); }
    });
    root.addEventListener('click', (e) => {
      const p = e.target.closest('[data-page]');
      if (p && !p.disabled) { st.page = +p.dataset.page; render(); }
      if (e.target.closest('[data-xls]')) { downloadCsv(csv.file, [csv.head, ...list().map(csv.row)]); toast('ส่งออกรายงาน (CSV) แล้ว'); }
      if (e.target.closest('[data-pdf]')) window.print();
    });
    render();
  }

  PAGES.salesReport = (root) => reportPage(root, {
    title: 'รายงานยอดขาย', rows: () => DB.salesReport, dateKey: 'date',
    cols: [{ label: 'วันที่', cell: (r) => r.date }, { label: 'จำนวนคำสั่งซื้อ', cell: (r) => fmt(r.orders) }, { label: 'ยอดขายรวม (บาท)', cell: (r) => fmt(r.total) }],
    totals: (l) => ['รวม', fmt(l.reduce((s, r) => s + r.orders, 0)), fmt(l.reduce((s, r) => s + r.total, 0))],
    csv: { file: 'sales_report.csv', head: ['วันที่', 'จำนวนคำสั่งซื้อ', 'ยอดขายรวม (บาท)'], row: (r) => [r.date, r.orders, r.total] },
  });
  PAGES.ordersReport = (root) => reportPage(root, {
    title: 'รายงานคำสั่งซื้อ', rows: () => DB.ordersReport, dateKey: 'date',
    cols: [{ label: 'วันที่', cell: (r) => r.date }, { label: 'เลขที่คำสั่งซื้อ', cell: (r) => '#' + r.id }, { label: 'ลูกค้า', cell: (r) => esc(r.customer) }, { label: 'สถานะ', cell: (r) => badge(r.status, r.status === 'สำเร็จ' ? 'green' : undefined) }, { label: 'ยอดรวม (บาท)', cell: (r) => fmt(r.total) }],
    csv: { file: 'orders_report.csv', head: ['วันที่', 'เลขที่คำสั่งซื้อ', 'ลูกค้า', 'สถานะ', 'ยอดรวม (บาท)'], row: (r) => [r.date, r.id, r.customer, r.status, r.total] },
  });
  PAGES.membersReport = (root) => reportPage(root, {
    title: 'รายงานสมาชิก/ลูกค้า', rows: () => DB.membersReport, dateKey: 'joined', from: '01 ม.ค. 2567', // members joined over several years
    cols: [{ label: 'ชื่อสมาชิก', cell: (r) => esc(r.name) }, { label: 'วันที่สมัคร', cell: (r) => r.joined }, { label: 'จำนวนคำสั่งซื้อ', cell: (r) => `${r.orders} รายการ` }, { label: 'ยอดใช้จ่ายสะสม (บาท)', cell: (r) => fmt(r.spent) }],
    csv: { file: 'members_report.csv', head: ['ชื่อสมาชิก', 'วันที่สมัคร', 'จำนวนคำสั่งซื้อ', 'ยอดใช้จ่ายสะสม (บาท)'], row: (r) => [r.name, r.joined, r.orders, r.spent] },
  });

  // ---------- ตั้งค่าสิทธิการเข้าถึง ----------
  PAGES.roles = function (root) {
    UI.listPage(root, {
      title: 'ตั้งค่าสิทธิการเข้าถึง',
      actions: `<a class="btn btn-primary" href="#/roles/new">${icon('plus', 18)} เพิ่มกลุ่มสิทธิ</a>`,
      search: { label: 'ค้นหาสิทธิการเข้าถึง', placeholder: 'ชื่อกลุ่มสิทธิ', keys: ['name'] },
      rows: () => DB.roles,
      cols: [
        { label: 'ชื่อกลุ่มสิทธิ', cell: (r) => esc(r.name) },
        { label: 'จำนวนสิทธิ', cell: (r) => `${permSet(r).size}/${ALL_PERMS.length} สิทธิ` },
        { label: 'จำนวนผู้ใช้', cell: (r) => `${r.users} คน` },
        { label: 'วันที่สร้าง', cell: (r) => r.created },
        { label: 'วันที่แก้ไข', cell: (r) => r.updated },
        { label: 'จัดการ', cell: (r) => `<span class="actions-cell"><a href="#/roles/${r.id}">แก้ไข</a></span>` },
      ],
      onRowClick: (r) => (location.hash = `#/roles/${r.id}`),
    });
  };

  PAGES.roleForm = function (root, { id }) {
    const r = id === 'new' ? null : DB.roles.find((x) => x.id === +id);
    const sel = r ? permSet(r) : new Set();
    let idx = 0;
    root.innerHTML = `${pageHead(r ? `แก้ไขกลุ่มสิทธิ: ${r.name}` : 'เพิ่มกลุ่มสิทธิใหม่')}
      <div class="form-card">
        <h2>ข้อมูลกลุ่มสิทธิ (Group Information)</h2>
        <div class="field"><label for="rg-name">ชื่อกลุ่มสิทธิ${req}</label><input class="input" id="rg-name" required value="${r ? esc(r.name) : ''}" placeholder="เช่น ผู้จัดการคลังสินค้า"></div>
        <hr>
        <h2>กำหนดสิทธิ (Assign Permissions)</h2>
        <div class="perm-grid">${DB.permGroups.map((g, gi) => `<div class="perm-group" data-g="${gi}">
          <label class="head"><input type="checkbox" data-all="${gi}"> <span>${g.name} (<span data-cnt="${gi}"></span>/${g.perms.length})</span></label>
          <div class="items">${g.perms.map((p) => { const i = idx++; return `<label class="${sel.has(i) ? '' : 'off'}"><input type="checkbox" data-p="${i}" ${sel.has(i) ? 'checked' : ''}> ${esc(p)}</label>`; }).join('')}</div></div>`).join('')}</div>
        <hr>
        <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap">
          <span class="muted">เลือกแล้ว <b data-total></b> จาก ${ALL_PERMS.length} สิทธิ</span>
          <div style="display:flex;gap:12px">${r && r.id !== 1 ? '<button class="btn btn-danger-outline" data-del>ลบกลุ่มสิทธิ</button>' : ''}<a class="btn" href="#/roles">ยกเลิก</a><button class="btn btn-primary" data-save>บันทึกกลุ่มสิทธิ</button></div>
        </div>
      </div>`;
    function sync() {
      DB.permGroups.forEach((g, gi) => {
        const boxes = $$(`[data-g="${gi}"] [data-p]`, root);
        const n = boxes.filter((b) => b.checked).length;
        $(`[data-cnt="${gi}"]`, root).textContent = n;
        const all = $(`[data-all="${gi}"]`, root);
        all.checked = n === boxes.length; all.indeterminate = n > 0 && n < boxes.length;
        boxes.forEach((b) => b.parentElement.classList.toggle('off', !b.checked));
      });
      $('[data-total]', root).textContent = $$('[data-p]:checked', root).length;
    }
    root.addEventListener('change', (e) => {
      if (e.target.dataset.all !== undefined) $$(`[data-g="${e.target.dataset.all}"] [data-p]`, root).forEach((b) => (b.checked = e.target.checked));
      sync();
    });
    root.addEventListener('click', (e) => {
      if (e.target.closest('[data-save]')) {
        if (!validate(root)) return;
        const perms = $$('[data-p]:checked', root).map((b) => +b.dataset.p);
        if (!perms.length) return toast('กรุณาเลือกสิทธิอย่างน้อย 1 รายการ', 'warn');
        const today = nowThai().slice(0, -6);
        const data = { name: $('#rg-name', root).value.trim(), perms: perms.length === ALL_PERMS.length ? 'all' : perms, updated: today };
        if (r) Object.assign(r, data); else DB.roles.push(Object.assign({ id: Math.max(...DB.roles.map((x) => x.id)) + 1, users: 0, created: today, hint: '' }, data));
        toast('บันทึกกลุ่มสิทธิแล้ว'); location.hash = '#/roles';
      }
      if (e.target.closest('[data-del]')) confirmDelete(r.name, () => { DB.roles.splice(DB.roles.indexOf(r), 1); toast('ลบกลุ่มสิทธิแล้ว'); location.hash = '#/roles'; });
    });
    sync();
  };

  // ---------- เพิ่ม/แก้ไขผู้ใช้งาน ----------
  PAGES.userForm = function (root, { id }) {
    const u = id === 'new' ? null : DB.users.find((x) => x.id === id);
    const [first, ...rest] = u ? u.name.split(' ') : ['', ''];
    let role = u ? u.role : '';
    const branches = [...new Set(['สำนักงานใหญ่', ...DB.branches.map((b) => b.name), 'คลังหลัก (กรุงเทพฯ)', 'คลังสาขา 2 (ชลบุรี)', ...DB.users.map((x) => x.branch)])];
    const roleNames = [...new Set([...DB.roles.map((r) => r.name), ...DB.users.map((x) => x.role)])];
    const hints = Object.fromEntries(DB.roles.filter((r) => r.hint).map((r) => [r.name, r.hint]));
    Object.assign(hints, { 'พนักงานขาย': 'จัดการคำสั่งซื้อ', 'ฝ่ายบัญชี': 'ดูรายงานและราคา' });
    root.innerHTML = `${pageHead(u ? `แก้ไขผู้ใช้งาน ${u.id}` : 'เพิ่มผู้ใช้งานใหม่')}
      <div class="form-card">
        <h2>ข้อมูลส่วนตัว (Personal Information)</h2>
        <div class="form-grid cols-2">
          <div class="field"><label for="u-first">ชื่อ${req}</label><input class="input" id="u-first" required value="${esc(first)}"></div>
          <div class="field"><label for="u-last">นามสกุล${req}</label><input class="input" id="u-last" required value="${esc(rest.join(' '))}"></div>
        </div>
        <div class="form-grid" style="margin-top:16px">
          <div class="field"><label for="u-email">อีเมล${req}</label><input class="input" id="u-email" type="email" required placeholder="example@thesteel.co.th" value="${u ? esc(u.email) : ''}"></div>
          <div class="field"><label for="u-branch">เลือกสาขาคลังสินค้า${req}</label><select class="select" id="u-branch" required><option value="">เลือกสาขา</option>${branches.map((b) => `<option ${u && u.branch === b ? 'selected' : ''}>${esc(b)}</option>`).join('')}</select></div>
          ${u ? `<div class="field"><label for="u-status">สถานะ</label>${selectHtml('u-status', ['ใช้งาน', 'ระงับ'], u.status)}</div>` : ''}
          <div class="role-box"><div class="lbl">สิทธิ์การเข้าถึงข้อมูลตามบทบาทที่เลือก:${req}</div>
            <div class="role-chips">${roleNames.map((n) => `<button type="button" class="role-chip ${role === n ? 'on' : ''}" data-role="${esc(n)}">${esc(n)}${hints[n] ? ` <small>(${esc(hints[n])})</small>` : ''}</button>`).join('')}</div></div>
        </div>
        <hr>
        <div class="form-footer" style="margin-top:0"><a class="btn" href="#/users">ยกเลิก</a><button class="btn btn-primary" data-save>${u ? 'บันทึกการแก้ไข' : 'บันทึกและสร้างผู้ใช้งาน'}</button></div>
      </div>`;
    root.addEventListener('click', (e) => {
      const c = e.target.closest('[data-role]');
      if (c) { role = c.dataset.role; $$('[data-role]', root).forEach((b) => b.classList.toggle('on', b === c)); }
      if (e.target.closest('[data-save]')) {
        if (!validate(root)) return;
        const email = $('#u-email', root).value.trim();
        if (!/^\S+@\S+\.\S+$/.test(email)) { $('#u-email', root).classList.add('invalid'); return toast('รูปแบบอีเมลไม่ถูกต้อง', 'warn'); }
        if (!role) return toast('กรุณาเลือกบทบาทของผู้ใช้งาน', 'warn');
        const data = { name: `${$('#u-first', root).value.trim()} ${$('#u-last', root).value.trim()}`, email, branch: $('#u-branch', root).value, role };
        if (u) Object.assign(u, data, { status: $('#u-status', root).value });
        else DB.users.push(Object.assign({ id: `EMP-${String(DB.users.length + 1).padStart(4, '0')}`, status: 'ใช้งาน' }, data));
        toast(u ? 'บันทึกการแก้ไขแล้ว' : 'สร้างผู้ใช้งานแล้ว — ระบบส่งอีเมลตั้งรหัสผ่านให้ผู้ใช้'); location.hash = '#/users';
      }
    });
  };

  // ---------- Simple record forms (รถขนส่ง / บริการเสริม) ----------
  function recordPage(root, { title, back, fields, rec, onSave }) {
    root.innerHTML = `${pageHead(title)}<div class="form-card"><div class="form-grid cols-3">
      ${fields.map(([k, label, type, opts, span]) => `<div class="field ${span ? 'span-' + span : ''}" style="${span === 3 ? 'grid-column:1/-1' : ''}"><label for="f-${k}">${label}${req}</label>${
        type === 'select' ? `<select class="select" id="f-${k}" data-k="${k}">${opts.map((o) => `<option ${rec[k] === o ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`
          : `<input class="input" id="f-${k}" data-k="${k}" type="${type || 'text'}" ${type === 'number' ? 'min="0"' : ''} required value="${esc(rec[k] ?? '')}">`}</div>`).join('')}
      </div><div class="form-footer"><a class="btn" href="${back}">ยกเลิก</a><button class="btn btn-primary" data-save>บันทึกข้อมูล</button></div></div>`;
    $('[data-save]', root).addEventListener('click', () => {
      if (!validate(root)) return;
      const out = {};
      $$('[data-k]', root).forEach((el) => (out[el.dataset.k] = el.type === 'number' ? +el.value : el.value.trim()));
      onSave(out);
      location.hash = back;
    });
  }
  PAGES.fleetForm = function (root, { i }) {
    const rec = i === 'new' ? { status: 'ว่าง', type: 'รถบรรทุก 6 ล้อ' } : DB.fleet[+i];
    recordPage(root, {
      title: i === 'new' ? 'เพิ่มรายการรถขนส่ง' : 'แก้ไขรายการรถขนส่ง', back: '#/fleet', rec,
      fields: [['plate', 'ทะเบียนรถ', 'text', null, 3], ['type', 'ประเภทรถ', 'select', ['รถบรรทุก 4 ล้อ', 'รถบรรทุก 6 ล้อ', 'รถบรรทุก 8 ล้อ', 'รถบรรทุก 10 ล้อ', 'รถบรรทุก 12 ล้อ']], ['load', 'น้ำหนักบรรทุก (กก.)', 'number'], ['status', 'สถานะ', 'select', ['ว่าง', 'กำลังใช้งาน', 'ไม่ให้บริการ']]],
      onSave: (v) => { i === 'new' ? DB.fleet.unshift(v) : Object.assign(rec, v); toast(i === 'new' ? 'เพิ่มรถขนส่งแล้ว' : 'บันทึกการแก้ไขแล้ว'); },
    });
  };
  PAGES.addonForm = function (root, { i }) {
    const rec = i === 'new' ? { status: 'พร้อมให้บริการ', max: 30 } : Object.assign(DB.addons[+i], { max: +DB.addons[+i].booked.split('/')[1] });
    recordPage(root, {
      title: i === 'new' ? 'เพิ่มบริการเสริม' : 'แก้ไขบริการเสริม', back: '#/addons', rec,
      fields: [['name', 'ชื่อบริการเสริม', 'text', null, 3], ['rate', 'อัตราค่าบริการ', 'number'], ['max', 'จำนวนการจองสูงสุด', 'number'], ['status', 'สถานะ', 'select', ['พร้อมให้บริการ', 'ไม่พร้อมให้บริการ', 'จองเต็มแล้ว']]],
      onSave: (v) => {
        const booked = i === 'new' ? 0 : Math.min(+rec.booked.split('/')[0], v.max);
        const row = { name: v.name, rate: v.rate, booked: `${booked}/${v.max}`, status: booked >= v.max ? 'จองเต็มแล้ว' : v.status };
        i === 'new' ? DB.addons.unshift(row) : Object.assign(rec, row);
        toast(i === 'new' ? 'เพิ่มบริการเสริมแล้ว' : 'บันทึกการแก้ไขแล้ว');
      },
    });
  };

  // ---------- นำเข้า/ส่งออก รถขนส่ง ----------
  PAGES.fleetImport = function (root) {
    let file = null;
    const types = [...new Set(DB.fleet.map((f) => f.type))];
    root.innerHTML = `${pageHead('นำเข้า/ส่งออก รถขนส่ง')}
      <div class="grid-2" style="margin-bottom:24px">
        <div class="card"><h2 class="card-title" style="margin-bottom:16px">นำเข้าข้อมูลรถขนส่ง</h2>
          <div class="dropzone" data-dz>${icon('upload', 32, 2)}<div class="dz-title">ลากไฟล์ Excel มาวาง หรือคลิกเพื่ออัปโหลด</div><div class="dz-hint">รองรับไฟล์ .xlsx, .csv ขนาดไม่เกิน 10MB</div><div class="dz-file" data-fname></div></div>
          <div style="background:#f3f4f6;border-radius:8px;padding:10px 14px;margin-top:16px"><div style="font-size:14px">คอลัมน์ที่ต้องมีในไฟล์</div><div class="muted" style="font-size:13px">ทะเบียนรถ, จังหวัด, ประเภทรถ, น้ำหนักบรรทุก (กก.), สถานะ</div></div>
          <label class="check" style="margin-top:14px;font-size:14px"><input type="checkbox" id="fi-upd" checked> อัปเดตข้อมูลเดิม หากทะเบียนรถซ้ำกับที่มีในระบบ</label>
          <a style="display:inline-block;margin-top:12px" data-template>ดาวน์โหลดเทมเพลต Excel</a>
          <div class="form-footer" style="margin-top:8px"><button class="btn btn-primary" data-upload>นำเข้าข้อมูล</button></div></div>
        <div class="card" style="display:flex;flex-direction:column"><h2 class="card-title">ส่งออกข้อมูลรถขนส่ง</h2>
          <p class="muted" style="margin:12px 0">เลือกเงื่อนไขของรถขนส่งที่ต้องการส่งออกเป็นไฟล์ Excel</p>
          <div class="form-grid cols-2"><div class="field"><label for="fx-type">ประเภทรถ</label>${selectHtml('fx-type', ['ทั้งหมด', ...types], 'ทั้งหมด')}</div>
            <div class="field"><label for="fx-status">สถานะ</label>${selectHtml('fx-status', ['ทั้งหมด', 'ว่าง', 'กำลังใช้งาน', 'ไม่ให้บริการ'], 'ทั้งหมด')}</div></div>
          <p class="muted" style="font-size:14px;margin-top:10px" data-count></p>
          <div class="form-footer" style="margin-top:auto;padding-top:24px"><button class="btn btn-primary" data-export>ส่งออกเป็น Excel</button></div></div>
      </div>
      <div class="card"><h2 class="card-title" style="margin-bottom:16px">ประวัติการนำเข้า/ส่งออก</h2><div data-hist></div></div>`;
    const hist = () => ($('[data-hist]', root).innerHTML = simpleTable([
      { label: 'ไฟล์', cell: (h) => esc(h.file) }, { label: 'ประเภท', cell: (h) => h.type }, { label: 'วันที่', cell: (h) => h.at },
      { label: 'สถานะ', cell: (h) => badge(h.status) }, { label: 'ผู้ดำเนินการ', cell: (h) => h.by },
    ], DB.fleetHistory));
    const pick = () => DB.fleet.filter((f) => ['type', 'status'].every((k) => { const v = $(`#fx-${k}`, root).value; return v === 'ทั้งหมด' || f[k] === v; }));
    const count = () => ($('[data-count]', root).textContent = `พบรถขนส่งตามเงื่อนไข ${pick().length} คัน`);
    bindDropzone($('[data-dz]', root), '.xlsx,.xls,.csv', (f) => { file = f; $('[data-fname]', root).textContent = `ไฟล์ที่เลือก: ${f.name}`; });
    root.addEventListener('change', (e) => { if (e.target.id.startsWith('fx-')) count(); });
    root.addEventListener('click', (e) => {
      if (e.target.closest('[data-template]')) { downloadCsv('truck_template.csv', [['ทะเบียนรถ', 'จังหวัด', 'ประเภทรถ', 'น้ำหนักบรรทุก (กก.)', 'สถานะ']]); toast('ดาวน์โหลดเทมเพลตแล้ว'); }
      if (e.target.closest('[data-upload]')) {
        if (!file) return toast('กรุณาเลือกไฟล์ก่อนนำเข้าข้อมูล', 'warn');
        const rec = { file: file.name, type: 'นำเข้า', at: nowThai(), status: 'กำลังดำเนินการ', by: DB.user.name };
        DB.fleetHistory.unshift(rec); hist();
        setTimeout(() => { rec.status = 'สำเร็จ'; if (root.isConnected) hist(); toast(`นำเข้า ${file.name} สำเร็จ${$('#fi-upd', root)?.checked ? ' (อัปเดตทะเบียนซ้ำ)' : ''}`); }, 1500);
      }
      if (e.target.closest('[data-export]')) {
        const name = `truck_export_${Date.now()}.csv`;
        downloadCsv(name, [['ทะเบียนรถ', 'ประเภทรถ', 'น้ำหนักบรรทุก (กก.)', 'สถานะ'], ...pick().map((f) => [f.plate, f.type, f.load, f.status])]);
        DB.fleetHistory.unshift({ file: name, type: 'ส่งออก', at: nowThai(), status: 'สำเร็จ', by: DB.user.name }); hist();
        toast('ส่งออกข้อมูลรถขนส่งแล้ว');
      }
    });
    hist(); count();
  };

  // ---------- เพิ่ม/แก้ไขสาขา ----------
  PAGES.branchForm = function (root, { code }) {
    const isNew = code === 'new';
    const b = isNew ? { code: '', name: '', phone: '', address: '', days: 'จันทร์ - เสาร์', hours: '08:00 - 18:00 น.', lat: '13.756300', lng: '100.501800', radius: 30, status: 'เปิดรับคำสั่งซื้อ', note: '' } : DB.branches.find((x) => x.code === code);
    if (!b) { root.innerHTML = `${pageHead('ไม่พบสาขา')}<div class="card placeholder"><a href="#/branches">กลับไปหน้ารายการสาขา</a></div>`; return; }
    let status = b.status;
    const f = (k, label, span = '') => `<div class="field ${span}"><label for="b-${k}">${label}${req}</label><input class="input" id="b-${k}" data-k="${k}" required value="${esc(b[k])}"></div>`;
    root.innerHTML = `${pageHead(isNew ? 'เพิ่มสาขาใหม่' : 'แก้ไขข้อมูลสาขา')}
      <div class="form-card"><h2>ข้อมูลสาขา</h2>
        <div class="form-grid" style="grid-template-columns:3fr 1fr">${f('name', 'ชื่อสาขา')}${f('code', 'รหัสสาขา')}</div>
        <div class="field" style="margin-top:16px"><label for="b-address">ที่อยู่${req}</label><textarea class="textarea" id="b-address" data-k="address" required>${esc(b.address)}</textarea></div>
        <div class="form-grid cols-3" style="margin-top:16px">${f('phone', 'เบอร์โทรศัพท์')}${f('days', 'วันทำการ')}${f('hours', 'เวลาทำการ')}</div>
      </div>
      <div class="form-card"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;gap:12px;flex-wrap:wrap"><h2 style="margin:0">ตำแหน่งที่ตั้งและพื้นที่ให้บริการจัดส่ง</h2><button class="btn" data-maps>ค้นหาตำแหน่งบนแผนที่</button></div>
        <div class="map" aria-label="แผนที่พื้นที่ให้บริการ"><div class="zone" data-zone></div><span class="pin">${icon('home', 22, 2.2)}</span><span class="coord" data-coord></span></div>
        <div class="form-grid" style="grid-template-columns:2fr 2fr 1fr;margin-top:16px">
          <div class="field"><label for="b-lat">Latitude${req}</label><input class="input" id="b-lat" data-k="lat" required value="${b.lat}" inputmode="decimal"></div>
          <div class="field"><label for="b-lng">Longitude${req}</label><input class="input" id="b-lng" data-k="lng" required value="${b.lng}" inputmode="decimal"></div>
          <div class="field"><label for="b-radius">รัศมีจัดส่ง (กม.)${req}</label><input class="input" id="b-radius" data-k="radius" type="number" min="1" max="200" required value="${b.radius}"></div>
        </div>
        <div class="info-note">${icon('file', 14)} ระบบใช้พิกัดและรัศมีนี้ร่วมกันในการคำนวณระยะทางและค่าขนส่งให้ลูกค้าที่อยู่ในพื้นที่ให้บริการของสาขานี้</div>
      </div>
      <div class="form-card"><div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap"><h2 style="margin:0">สถานะการรับคำสั่งซื้อของสาขา</h2><div style="display:flex;gap:12px;align-items:center" data-status></div></div>
        <div class="field" style="margin-top:16px"><label for="b-note">หมายเหตุ (กรอกเมื่อปิดรับคำสั่งซื้อชั่วคราว)</label><textarea class="textarea" id="b-note" placeholder="เช่น ปิดปรับปรุงคลังสินค้าประจำปี 20-22 ก.ย. 2569">${esc(b.note)}</textarea></div>
      </div>
      <div class="form-footer"><a class="btn" href="#/branches">ยกเลิก</a><button class="btn btn-primary" data-save>บันทึกข้อมูลสาขา</button></div>`;
    const drawStatus = () => ($('[data-status]', root).innerHTML = `${badge(status)}<button class="btn" data-toggle-status>${status === 'เปิดรับคำสั่งซื้อ' ? 'ปิดรับคำสั่งซื้อชั่วคราว' : 'เปิดรับคำสั่งซื้อ'}</button>`);
    const drawMap = () => {
      const r = Math.max(1, Math.min(200, +$('#b-radius', root).value || 1));
      const px = Math.min(240, 40 + r * 4);
      Object.assign($('[data-zone]', root).style, { width: px + 'px', height: px + 'px' });
      $('[data-coord]', root).textContent = `พิกัดสาขา: ${(+$('#b-lat', root).value).toFixed(4)}, ${(+$('#b-lng', root).value).toFixed(4)} · รัศมีจัดส่ง ${r} กม.`;
    };
    root.addEventListener('input', (e) => { if (['b-lat', 'b-lng', 'b-radius'].includes(e.target.id)) drawMap(); });
    root.addEventListener('click', (e) => {
      if (e.target.closest('[data-toggle-status]')) {
        status = status === 'เปิดรับคำสั่งซื้อ' ? 'ปิดรับชั่วคราว' : 'เปิดรับคำสั่งซื้อ';
        drawStatus();
        if (status === 'ปิดรับชั่วคราว') $('#b-note', root).focus();
      }
      if (e.target.closest('[data-maps]')) window.open(`https://www.google.com/maps?q=${encodeURIComponent($('#b-lat', root).value + ',' + $('#b-lng', root).value)}`, '_blank', 'noopener');
      if (e.target.closest('[data-save]')) {
        if (!validate(root)) return;
        const lat = +$('#b-lat', root).value, lng = +$('#b-lng', root).value;
        if (!(Math.abs(lat) <= 90 && Math.abs(lng) <= 180)) return toast('พิกัดไม่ถูกต้อง', 'warn');
        const code2 = $('#b-code', root).value.trim();
        if (DB.branches.some((x) => x !== b && x.code === code2)) { $('#b-code', root).classList.add('invalid'); return toast('รหัสสาขานี้มีอยู่แล้ว', 'warn'); }
        if (status === 'ปิดรับชั่วคราว' && !$('#b-note', root).value.trim()) { $('#b-note', root).classList.add('invalid'); return toast('กรุณาระบุหมายเหตุการปิดรับคำสั่งซื้อ', 'warn'); }
        $$('[data-k]', root).forEach((el) => (b[el.dataset.k] = el.type === 'number' ? +el.value : el.value.trim()));
        Object.assign(b, { status, note: $('#b-note', root).value.trim() });
        if (isNew) DB.branches.push(b);
        toast('บันทึกข้อมูลสาขาแล้ว'); location.hash = '#/branches';
      }
    });
    drawStatus(); drawMap();
  };

  // ---------- รายละเอียดสมาชิก ----------
  PAGES.memberDetail = function (root, { id }) {
    const m = DB.members.find((x) => x.id === id);
    if (!m) { root.innerHTML = `${pageHead('ไม่พบสมาชิก')}<div class="card placeholder"><a href="#/members">กลับไปหน้าข้อมูลสมาชิก</a></div>`; return; }
    function render() {
      const active = m.status === 'เปิดใช้งาน';
      root.innerHTML = `<div class="page-head"><h1 class="page-title" style="display:flex;align-items:center;gap:12px">คุณ${esc(m.name)} ${badge(m.status)}</h1><div class="page-actions"><a class="btn" href="#/members">← กลับ</a></div></div>
        <div class="stack">
        <div class="card"><h2 class="card-title" style="margin-bottom:12px">ข้อมูลส่วนตัว</h2><div class="kv-grid c2">
          <div class="kv"><div class="k">รหัสสมาชิก</div><div class="v">${m.id}</div></div><div class="kv"><div class="k">ชื่อ-นามสกุล</div><div class="v">คุณ${esc(m.name)}</div></div>
          <div class="kv"><div class="k">เบอร์โทรศัพท์</div><div class="v">${m.phone}</div></div><div class="kv"><div class="k">อีเมล</div><div class="v">${esc(m.email)}</div></div></div></div>
        <div class="card"><h2 class="card-title" style="margin-bottom:12px">ประวัติการสั่งซื้อ</h2>
          ${simpleTable([
            { label: 'เลขที่คำสั่งซื้อ', cell: (o) => `<a href="#/orders/${DB.orders.some((x) => x.id === o.id) ? o.id : 'SO-10234'}">#${o.id}</a>` },
            { label: 'วันที่', cell: (o) => o.date }, { label: 'ยอดรวม', cell: (o) => `${fmt(o.total)} บาท` }, { label: 'สถานะ', cell: (o) => badge(o.status) },
            { label: 'จัดการ', cell: (o) => `<a href="#/orders/${DB.orders.some((x) => x.id === o.id) ? o.id : 'SO-10234'}">ดูรายละเอียด</a>` },
          ], DB.memberOrders, 'compact')}${pagerHtml(DB.memberOrders.length, 1, 10)}</div>
        <div class="card"><h2 class="card-title" style="margin-bottom:12px">สถานะบัญชี</h2>
          <div style="display:flex;gap:12px;flex-wrap:wrap">${active ? '<button class="btn" data-st="ระงับชั่วคราว">ระงับชั่วคราว</button>' : '<button class="btn btn-primary" data-st="เปิดใช้งาน">เปิดใช้งานบัญชี</button>'}
          ${m.status !== 'ปิดใช้งาน' ? '<button class="btn btn-danger-outline" data-st="ปิดใช้งาน">ปิดใช้งานบัญชี</button>' : ''}</div></div>
        </div>`;
    }
    root.addEventListener('click', (e) => {
      const b = e.target.closest('[data-st]');
      if (!b) return;
      const to = b.dataset.st;
      modal({ title: 'เปลี่ยนสถานะบัญชี', body: `ต้องการเปลี่ยนสถานะบัญชีของคุณ${esc(m.name)} เป็น “${to}” ใช่หรือไม่?`, confirm: 'ยืนยัน', danger: to !== 'เปิดใช้งาน',
        onConfirm: () => { m.status = to; render(); toast(`เปลี่ยนสถานะเป็น “${to}” แล้ว`); } });
    });
    render();
  };

  // ---------- เพิ่ม/แก้ไขหมวดหมู่ ----------
  function readImage(file, cb) { const r = new FileReader(); r.onload = () => cb(r.result); r.readAsDataURL(file); }
  PAGES.categoryForm = function (root, { id }) {
    const c = id === 'new' ? null : DB.categories.find((x) => x.id === +id);
    let img = c ? `assets/${c.img}` : null, preview = !!c;
    root.innerHTML = `<div class="page-head"><div><h1 class="page-title">${c ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่ใหม่'}</h1><p class="muted">กรอกรายละเอียดหมวดหมู่</p></div></div>
      <div class="form-card"><h2>1. กรอกรายละเอียดหมวดหมู่</h2>
        <div class="field"><label for="c-name">ชื่อหมวดหมู่${req}</label><input class="input" id="c-name" required placeholder="เช่น เหล็กรูปพรรณขึ้นรูปเย็น" value="${c ? esc(c.name) : ''}"></div>
        <div class="field" style="margin-top:16px"><label for="c-desc">ลักษณะการใช้งาน${req}</label><textarea class="textarea" id="c-desc" required placeholder="เช่น นำไปใช้ต่อเติมหลังคา">${c ? esc(c.desc || '') : ''}</textarea></div>
        <div class="field" style="margin-top:16px"><label>รูปประกอบหมวดหมู่${req}</label><div class="hint-red">รองรับ JPG และ PNG จำนวน 1 รูป</div><div data-img style="margin-top:6px"></div></div>
        <div data-preview style="margin-top:16px"></div>
        <div class="form-footer"><button class="btn" data-preview-btn>ดูตัวอย่าง</button><a class="btn" href="#/products">ยกเลิก</a><button class="btn btn-primary" data-save>บันทึกหมวดหมู่</button></div>
      </div>`;
    const val = (sel) => $(sel, root).value.trim();
    function drawImg() {
      const box = $('[data-img]', root);
      box.innerHTML = img ? `<div class="image-box"><img src="${img}" alt="" style="object-fit:contain;height:200px;width:290px"><a class="link-danger" data-rm>ลบรูปประกอบ</a></div>`
        : `<div class="dropzone" data-dz>${icon('upload', 32, 2)}<div class="dz-title">ลากไฟล์รูปภาพมาวาง หรือคลิกเพื่ออัปโหลด</div></div>`;
      if (!img) bindDropzone($('[data-dz]', box), 'image/png,image/jpeg', (f) => readImage(f, (d) => { img = d; drawImg(); drawPreview(); }));
      sync();
    }
    function drawPreview() {
      $('[data-preview]', root).innerHTML = preview && img ? `<label class="muted">ตัวอย่างการแสดงผลบนเว็บไซต์</label><div class="preview-wrap" style="margin-top:6px"><div class="cat-preview"><img src="${img}" alt=""><b>${esc(val('#c-name') || 'ชื่อหมวดหมู่')}</b><span>${esc(val('#c-desc') || 'ลักษณะการใช้งาน')}</span></div></div>` : '';
    }
    const sync = () => ($('[data-save]', root).disabled = !(val('#c-name') && val('#c-desc') && img));
    root.addEventListener('input', () => { sync(); drawPreview(); });
    root.addEventListener('click', (e) => {
      if (e.target.closest('[data-rm]')) { img = null; drawImg(); drawPreview(); }
      if (e.target.closest('[data-preview-btn]')) { if (!img) return toast('กรุณาอัปโหลดรูปประกอบก่อนดูตัวอย่าง', 'warn'); preview = !preview; drawPreview(); }
      if (e.target.closest('[data-save]')) {
        const data = { name: val('#c-name'), desc: val('#c-desc'), img: img.startsWith('assets/') ? img.slice(7) : img };
        if (c) Object.assign(c, data); else DB.categories.unshift(Object.assign({ id: Date.now(), items: [] }, data));
        toast('บันทึกหมวดหมู่แล้ว'); location.hash = '#/products';
      }
    });
    drawImg(); drawPreview();
  };
  // Data-URL images are stored inline; asset images are stored by filename.
  UI.catImg = (c) => (String(c.img || '').startsWith('data:') ? c.img : `assets/${c.img || 'cat-1.png'}`);

  // ---------- เพิ่ม/แก้ไขรายการสินค้า (modal) ----------
  UI.productModal = function (cat, item, onSaved) {
    const editing = !!item;
    const st = {
      images: editing ? [{ name: 'steel-01.jpg', src: 'assets/steel-tube.jpg' }] : [],
      docs: editing ? [{ name: 'มอก. 1228-2549.pdf', size: '2.4 MB' }, { name: `ใบอนุญาต${item[0]} – THE.pdf`, size: '5 MB' }] : [],
      skus: editing ? DB.stock.slice(0, 4).map((s) => [s.w, s.l, s.h, s.weight, s.sku]) : [],
    };
    const m = modal({
      title: editing ? 'แก้ไขรายการสินค้า' : 'เพิ่มรายการสินค้า', wide: true, confirm: 'บันทึกสินค้า',
      body: `<div class="form-grid cols-2" style="margin-top:8px">
          <div class="field"><label>ชื่อสินค้า${req}</label><input class="input" data-f="th" required placeholder="เหล็กตัวซี" value="${editing ? esc(item[0]) : ''}"></div>
          <div class="field"><label>ชื่อสินค้าภาษาอังกฤษ${req}</label><input class="input" data-f="en" required placeholder="LIP CHANNEL STEEL" value="${editing ? esc(item[1]) : ''}"></div></div>
        <div class="form-grid">
          <div class="field"><label>ข้อมูลสินค้า${req}</label><textarea class="textarea" data-f="info" required placeholder="อธิบายคุณสมบัติ วัสดุ และการใช้งานของสินค้า...">${editing ? `${esc(item[0])} (${esc(item[1])}) ผลิตตามมาตรฐาน มอก. ความยาวมาตรฐาน 6 เมตร` : ''}</textarea></div>
          <div class="field"><label>การใช้งาน${req}</label><textarea class="textarea" data-f="usage" required placeholder="อธิบายการใช้งานของสินค้า...">${editing ? 'งานโครงสร้างทั่วไป โครงหลังคา และงานตกแต่ง' : ''}</textarea></div>
          <div class="field"><label>ราคาเริ่มต้น (บาท)${req}</label><input class="input" data-f="price" type="number" min="0" step="0.01" required placeholder="1.00" value="${editing ? '30.5' : ''}"></div>
          <div class="field"><label>หน่วย${req}</label><select class="select" data-f="unit" required><option value="">เลือกหน่วย</option>${['แท่ง', 'เส้น', 'แผ่น', 'ม้วน', 'กิโลกรัม'].map((u) => `<option ${editing && u === 'แท่ง' ? 'selected' : ''}>${u}</option>`).join('')}</select></div>
          <div class="field"><label>มาตรฐาน</label><input class="input" data-f="std" placeholder="เช่น มอก. 2558-100" value="${editing ? 'มอก. 2558-100' : ''}"></div>
          <div class="field"><div style="display:flex;justify-content:space-between"><label>รูปประกอบสินค้า${req}</label><span class="muted" data-imgcount></span></div><div class="hint-red">รองรับ JPG และ PNG สูงสุด 3 รูป</div><div data-images style="margin-top:6px"></div></div>
          <div class="field"><label>เอกสารประกอบ</label><div data-docs></div></div>
        </div>
        <h3 style="margin:20px 0 10px">รายการสินค้าย่อย</h3>
        <div class="table-wrap"><table class="sku-table"><thead><tr><th>กว้าง (มม.)</th><th>ยาว (มม.)</th><th>สูง (มม.)</th><th>น้ำหนัก (กก./ม.)</th><th>SKU</th><th style="width:40px">ลบ</th></tr></thead><tbody data-skus></tbody></table></div>`,
      onConfirm: (el) => {
        if (!validate($('.m-body', el))) return false;
        if (!st.images.length) { toast('กรุณาอัปโหลดรูปประกอบสินค้าอย่างน้อย 1 รูป', 'warn'); return false; }
        const th = $('[data-f="th"]', el).value.trim(), en = $('[data-f="en"]', el).value.trim();
        onSaved([th, en, st.skus.length]);
        toast(editing ? 'บันทึกการแก้ไขสินค้าแล้ว' : 'เพิ่มรายการสินค้าแล้ว');
      },
    });
    const drawImages = () => {
      const box = $('[data-images]', m);
      box.innerHTML = `${st.images.length ? `<div class="thumbs" style="margin-bottom:10px">${st.images.map((im, i) => `<div class="thumb"><img src="${im.src}" alt=""><div><span class="ellipsis" style="max-width:100px">${esc(im.name)}</span><button data-rmimg="${i}" aria-label="ลบรูป">${icon('x', 16)}</button></div></div>`).join('')}</div>` : ''}
        ${st.images.length < 3 ? `<div class="dropzone" data-dzimg>${icon('upload', 28, 2)}<div class="dz-title">ลากไฟล์รูปภาพมาวาง หรือคลิกเพื่ออัปโหลด</div></div>` : ''}`;
      $('[data-imgcount]', m).textContent = `${st.images.length} / 3 รูปภาพ`;
      const dz = $('[data-dzimg]', box);
      dz && bindDropzone(dz, 'image/png,image/jpeg', (f) => readImage(f, (src) => { st.images.push({ name: f.name, src }); drawImages(); }));
    };
    const drawDocs = () => {
      const box = $('[data-docs]', m);
      box.innerHTML = `${st.docs.map((d, i) => `<div class="doc-row"><span class="ic">${icon('file', 18)}</span><div><b>${esc(d.name)}</b><small>ขนาด ${d.size}</small></div><button data-rmdoc="${i}" aria-label="ลบเอกสาร">${icon('x', 18)}</button></div>`).join('')}
        <div class="dropzone" data-dzdoc>${icon('upload', 28, 2)}<div class="dz-title">ลากไฟล์เอกสารมาวาง หรือคลิกเพื่ออัปโหลด</div><div class="dz-hint">รองรับ PDF</div></div>`;
      bindDropzone($('[data-dzdoc]', box), 'application/pdf', (f) => { st.docs.push({ name: f.name, size: `${(f.size / 1048576).toFixed(1)} MB` }); drawDocs(); });
    };
    const drawSkus = () => {
      $('[data-skus]', m).innerHTML = st.skus.map((r, i) => `<tr>${r.map((v, j) => `<td><input value="${esc(v)}" data-sku="${i}|${j}"></td>`).join('')}<td><button class="x" data-rmsku="${i}" aria-label="ลบแถว">×</button></td></tr>`).join('') +
        `<tr data-newrow>${['กว้าง', 'ยาว', 'สูง', 'น้ำหนัก', 'เช่น TSL-RB12'].map((p) => `<td><input placeholder="${p}"></td>`).join('')}<td><button class="add" data-addsku aria-label="เพิ่มแถว">+</button></td></tr>`;
    };
    m.addEventListener('click', (e) => {
      const ri = e.target.closest('[data-rmimg]'); if (ri) { st.images.splice(+ri.dataset.rmimg, 1); drawImages(); }
      const rd = e.target.closest('[data-rmdoc]'); if (rd) { st.docs.splice(+rd.dataset.rmdoc, 1); drawDocs(); }
      const rs = e.target.closest('[data-rmsku]'); if (rs) { st.skus.splice(+rs.dataset.rmsku, 1); drawSkus(); }
      if (e.target.closest('[data-addsku]')) {
        const vals = $$('[data-newrow] input', m).map((i) => i.value.trim());
        if (!vals[4]) return toast('กรุณาระบุ SKU ของสินค้าย่อย', 'warn');
        if (st.skus.some((r) => r[4] === vals[4])) return toast('SKU นี้มีอยู่แล้ว', 'warn');
        st.skus.push(vals.map((v) => v || '-')); drawSkus();
      }
    });
    m.addEventListener('input', (e) => { const k = e.target.dataset.sku; if (k) { const [i, j] = k.split('|').map(Number); st.skus[i][j] = e.target.value; } });
    drawImages(); drawDocs(); drawSkus();
  };

  // ---------- Auth pages (ลืมรหัสผ่าน / ตั้งรหัสผ่านใหม่ / ไม่มีสิทธิ์) ----------
  function authShell(app, inner) {
    app.innerHTML = `<div class="login"><section class="login-brand"><img src="assets/logo.svg" alt="The Steel D"><h1>ระบบจัดการข้อมูลหลังบ้าน</h1>
      <p>จัดการสินค้า สต็อก คำสั่งซื้อ และข้อมูลลูกค้าของ The Steel ได้ในที่เดียว ปลอดภัย รวดเร็ว และเชื่อมต่อกับระบบ SAP แบบเรียลไทม์</p></section>
      <section class="login-form"><div style="width:360px;max-width:100%">${inner}</div></section></div>`;
  }
  let resetEmail = '';
  PAGES.forgot = function (app) {
    authShell(app, `<form novalidate data-f><h2>ลืมรหัสผ่าน?</h2><p class="lead">กรอกอีเมลที่ใช้เข้าสู่ระบบ เราจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ให้คุณ</p>
      <div class="field"><label for="fp-email">อีเมล</label><input class="input" id="fp-email" type="email" placeholder="name@thesteel.com" required value="${esc(resetEmail)}"></div>
      <button class="btn btn-primary btn-block" style="margin-top:20px">ส่งลิงก์รีเซ็ตรหัสผ่าน</button>
      <a class="back-link" href="#/login">← กลับไปหน้าเข้าสู่ระบบ</a></form>`);
    $('[data-f]', app).addEventListener('submit', (e) => {
      e.preventDefault();
      const v = $('#fp-email', app).value.trim();
      const ok = /^\S+@\S+\.\S+$/.test(v);
      $('#fp-email', app).classList.toggle('invalid', !ok);
      if (!ok) return toast('กรุณากรอกอีเมลให้ถูกต้อง', 'warn');
      resetEmail = v; location.hash = '#/forgot/sent';
    });
  };
  PAGES.forgotSent = function (app) {
    authShell(app, `<div class="auth-icon">${icon('bell', 22, 2)}</div><h2 style="font-size:30px;font-weight:700">ตรวจสอบอีเมลของคุณ</h2>
      <p class="lead" style="color:var(--text-muted);margin:4px 0 20px">เราได้ส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปที่ <b>${esc(resetEmail || 'name@thesteel.com')}</b></p>
      <p class="muted">ไม่ได้รับอีเมล? <a data-resend>ส่งอีกครั้ง</a></p>
      <a class="btn btn-block" href="#/login" style="margin-top:16px">กลับไปหน้าเข้าสู่ระบบ</a>
      <p class="subtle" style="font-size:13px;margin-top:16px;text-align:center">ต้นแบบ: <a href="#/reset">เปิดลิงก์จากอีเมล (จำลอง)</a></p>`);
    $('[data-resend]', app).addEventListener('click', () => toast('ส่งอีเมลอีกครั้งแล้ว'));
  };
  PAGES.reset = function (app) {
    authShell(app, `<form novalidate data-f><h2>ตั้งรหัสผ่านใหม่</h2><p class="lead">ตั้งรหัสผ่านใหม่ที่คาดเดายาก ควรมีตัวอักษร ตัวเลข และอักขระพิเศษ อย่างน้อย 8 ตัว</p>
      <div class="field"><label for="np1">รหัสผ่านใหม่</label><input class="input" id="np1" type="password" placeholder="••••••••" autocomplete="new-password"></div>
      <div class="field"><label for="np2">ยืนยันรหัสผ่านใหม่</label><input class="input" id="np2" type="password" placeholder="••••••••" autocomplete="new-password"></div>
      <p class="err" data-err></p>
      <button class="btn btn-primary btn-block" style="margin-top:20px">บันทึกรหัสผ่านใหม่</button></form>`);
    $('[data-f]', app).addEventListener('submit', (e) => {
      e.preventDefault();
      const a = $('#np1', app).value, b = $('#np2', app).value;
      const msg = a.length < 8 ? 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' : !(/[A-Za-z]/.test(a) && /\d/.test(a)) ? 'รหัสผ่านต้องมีทั้งตัวอักษรและตัวเลข' : a !== b ? 'รหัสผ่านทั้งสองช่องไม่ตรงกัน' : '';
      const err = $('[data-err]', app);
      err.textContent = msg; err.style.display = msg ? 'block' : 'none';
      $('#np1', app).classList.toggle('invalid', !!msg && a.length < 8);
      $('#np2', app).classList.toggle('invalid', !!msg && a !== b);
      if (!msg) location.hash = '#/reset/done';
    });
  };
  PAGES.resetDone = function (app) {
    authShell(app, `<div class="auth-icon">${icon('check', 20, 2.4)}</div><h2 style="font-size:24px;font-weight:700">ตั้งรหัสผ่านสำเร็จ</h2>
      <p class="muted" style="margin:6px 0 20px">รหัสผ่านของคุณได้รับการอัปเดตเรียบร้อยแล้ว<br>คุณสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้ทันที</p>
      <a class="btn btn-primary btn-block" href="#/login">กลับไปหน้าเข้าสู่ระบบ</a>`);
  };
  PAGES.noAccess = function (app) {
    authShell(app, `<div class="auth-icon red">${icon('logout', 20, 2)}</div><h2 style="font-size:24px;font-weight:700">ไม่มีสิทธิ์เข้าใช้งาน</h2>
      <p class="muted" style="margin:6px 0 0">บัญชีของคุณไม่มีสิทธิ์ในการเข้าถึงระบบหลังบ้านของ The Steel<br>โปรดติดต่อผู้ดูแลระบบหรือแอดมินหากคุณคิดว่านี่คือข้อผิดพลาด</p>
      <div class="support">${icon('bell', 18)} ติดต่อสนับสนุน: <a href="mailto:admin@thesteel.com">admin@thesteel.com</a></div>
      <a class="btn btn-primary btn-block" href="#/login">กลับไปหน้าเข้าสู่ระบบ</a>`);
  };
})();
