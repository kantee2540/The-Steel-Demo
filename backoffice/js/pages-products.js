// ระบบจัดการสินค้า: categories, stock, stock edit, import/export, pricing.
(function () {
  const { esc, fmt, $, $$, badge, pageHead, searchInput, selectHtml, pagerHtml, simpleTable, modal, confirmDelete, toast, validate, bindDropzone, downloadCsv, nowThai } = UI;

  // ---------- จัดการสินค้า (category accordion) ----------
  PAGES.products = function (root) {
    const open = new Set([4]);
    let q = '';
    root.innerHTML = `
      ${pageHead('จัดการสินค้า', `<a class="btn btn-primary" href="#/products/category/new">${icon('plus', 18)} เพิ่มหมวดหมู่ใหม่</a>`)}
      <div class="filters"><div class="field"><label for="cat-q">ค้นหาหมวดหมู่สินค้า หรือรายการสินค้า</label>${searchInput('cat-q', 'ชื่อหมวดหมู่สินค้า / ชื่อสินค้า')}</div></div>
      <div class="card"><div class="table-wrap"><table class="tbl">
        <thead><tr><th style="width:40%">ชื่อหมวดหมู่สินค้า</th><th style="width:30%">จำนวนสินค้า</th><th>จัดการ</th></tr></thead><tbody></tbody></table></div>
        ${pagerHtml(DB.categories.length, 1, 10)}</div>`;
    const tbody = $('tbody', root);

    function render() {
      const ql = q.trim().toLowerCase();
      const cats = DB.categories.filter((c) => !ql || c.name.toLowerCase().includes(ql) || c.items.some((it) => (it[0] + it[1]).toLowerCase().includes(ql)));
      tbody.innerHTML = cats.map((c) => {
        const isOpen = open.has(c.id) || (ql && c.items.some((it) => (it[0] + it[1]).toLowerCase().includes(ql)));
        const items = c.items.filter((it) => !ql || c.name.toLowerCase().includes(ql) || (it[0] + it[1]).toLowerCase().includes(ql));
        return `<tr class="cat-row row-click${isOpen ? ' open' : ''}" data-cat="${c.id}">
            <td><span class="tog">${icon('chevDown', 18, 2)}</span>${esc(c.name)}</td>
            <td class="muted">${c.count} รายการ</td>
            <td class="actions-cell"><a href="#/products/category/${c.id}">แก้ไข</a><a class="link-danger" data-del-cat="${c.id}">ลบ</a></td></tr>
          ${isOpen ? `<tr class="cat-detail"><td colspan="3">
            <div style="display:flex;justify-content:flex-end;padding:16px 0"><button class="btn btn-primary" data-add-item="${c.id}">เพิ่มรายการสินค้า</button></div>
            <div class="inner">${items.length ? `<table class="tbl"><thead><tr><th>ชื่อสินค้า (ไทย)</th><th>ชื่อสินค้า (อังกฤษ)</th><th>จำนวนสินค้าย่อย</th><th>จัดการ</th></tr></thead><tbody>
              ${items.map((it) => `<tr><td>${esc(it[0])}</td><td>${esc(it[1])}</td><td>${it[2] ? it[2] + ' รายการ' : 'ไม่มีสินค้าย่อย'}</td>
                <td class="actions-cell"><a data-edit-item="${c.id}|${esc(it[0])}">แก้ไข</a><a class="link-danger" data-del-item="${c.id}|${esc(it[0])}">ลบ</a></td></tr>`).join('')}
              </tbody></table>` : '<p class="placeholder" style="padding:24px">ยังไม่มีรายการสินค้าในหมวดหมู่นี้</p>'}</div>
          </td></tr>` : ''}`;
      }).join('') || `<tr><td class="empty" colspan="3">ไม่พบหมวดหมู่หรือสินค้าที่ค้นหา</td></tr>`;
    }

    $('#cat-q', root).addEventListener('input', (e) => { q = e.target.value; render(); });
    root.addEventListener('click', (e) => {
      const t = e.target;
      const del = t.closest('[data-del-cat]');
      if (del) { const c = DB.categories.find((x) => x.id == del.dataset.delCat); return confirmDelete(c.name, () => { DB.categories.splice(DB.categories.indexOf(c), 1); render(); toast('ลบหมวดหมู่แล้ว'); }); }
      const di = t.closest('[data-del-item]');
      if (di) {
        const [cid, name] = di.dataset.delItem.split('|');
        const c = DB.categories.find((x) => x.id == cid);
        return confirmDelete(name, () => { c.items = c.items.filter((it) => it[0] !== name); c.count = Math.max(0, c.count - 1); render(); toast('ลบรายการสินค้าแล้ว'); });
      }
      const ai = t.closest('[data-add-item]');
      if (ai) {
        const c = DB.categories.find((x) => x.id == ai.dataset.addItem);
        return UI.productModal(c, null, (it) => { c.items.unshift(it); c.count++; render(); });
      }
      const ei = t.closest('[data-edit-item]');
      if (ei) {
        const [cid, name] = ei.dataset.editItem.split('|');
        const c = DB.categories.find((x) => x.id == cid);
        const it = c.items.find((x) => x[0] === name);
        return UI.productModal(c, it, (v) => { it[0] = v[0]; it[1] = v[1]; it[2] = v[2]; render(); });
      }
      const row = t.closest('.cat-row');
      if (row && !t.closest('a')) { const id = +row.dataset.cat; open.has(id) ? open.delete(id) : open.add(id); render(); }
    });
    render();
  };

  // ---------- จัดการสต็อก ----------
  PAGES.stock = function (root) {
    const cats = [...new Set(DB.stock.map((s) => s.category))];
    let sortDir = 0; // 0 none, 1 asc, -1 desc
    UI.listPage(root, {
      title: 'จัดการสต็อก',
      search: { label: 'ค้นหาหมวดหมู่สินค้า หรือรายการสินค้า', placeholder: 'ชื่อหมวดหมู่สินค้า / ชื่อสินค้า / SKU', keys: ['sku', 'name', 'category'] },
      extraFilters: `<div class="field"><label for="f-cat">หมวดหมู่</label>${selectHtml('f-cat', ['ทั้งหมด', ...cats], 'ทั้งหมด')}</div>`,
      filterCols: '2fr 1fr',
      extraMatch: (r) => { const v = $('#f-cat', root).value; return v === 'ทั้งหมด' || r.category === v; },
      cardTitle: () => 'รายการสินค้าทั้งหมด (แยกตาม SKU)',
      cardRight: `<span class="muted" data-total></span>`,
      rows: () => {
        const list = DB.stock.slice();
        if (sortDir) list.sort((a, b) => (a.qty - b.qty) * sortDir);
        return list;
      },
      cols: [
        { label: 'SKU', cell: (r) => `<span class="muted">${r.sku}</span>` },
        { label: 'ชื่อสินค้า', cell: (r) => esc(r.name) },
        { label: 'กว้าง (มม.)', cell: (r) => r.w },
        { label: 'ยาว (มม.)', cell: (r) => r.l },
        { label: 'สูง (มม.)', cell: (r) => `<span class="subtle">${r.h}</span>` },
        { label: 'น้ำหนัก (กก./ม.)', cell: (r) => r.weight },
        { label: 'ราคา', cell: (r) => fmt(r.price, 2) },
        { label: `<span class="th-sort" data-sort>คงเหลือ ${icon('chevUp', 16, 2)}</span>`, cell: (r) => fmt(r.qty) },
        { label: 'สถานะ', cell: (r) => badge(r.status) },
        { label: 'จัดการ', cell: (r) => `<a href="#/stock/${r.sku}">แก้ไข</a>` },
      ],
      onRowClick: (r) => (location.hash = `#/stock/${r.sku}`),
      after: (el, render) => {
        $('[data-total]', el).textContent = `ทั้งหมด ${DB.stock.length} SKU`;
        $('[data-sort]', el).addEventListener('click', (e) => {
          sortDir = sortDir === 1 ? -1 : 1;
          e.currentTarget.innerHTML = `คงเหลือ ${icon(sortDir === 1 ? 'chevUp' : 'chevDown', 16, 2)}`;
          render();
        });
      },
    });
  };

  // ---------- แก้ไข รายการสเปคและราคารายขนาด ----------
  PAGES.stockEdit = function (root, { sku }) {
    const p = DB.stock.find((s) => s.sku === sku);
    if (!p) { root.innerHTML = `${pageHead('ไม่พบสินค้า')}<div class="card placeholder"><h2>ไม่พบ SKU ${esc(sku)}</h2><p><a href="#/stock">กลับไปหน้าจัดการสต็อก</a></p></div>`; return; }
    let mode = 'in';
    root.innerHTML = `
      ${pageHead('แก้ไข รายการสเปคและราคารายขนาด', `<a class="btn" href="#/stock">${icon('arrowLeft', 16)} กลับ</a>`)}
      <div class="card" data-spec>
        <h2 class="card-title">แก้ไขข้อมูลสินค้า</h2>
        <div class="kv" style="margin:10px 0 16px"><div class="k">ชื่อสินค้า</div><div class="v">${esc(p.name)} <a href="#/products" style="margin-left:6px">แก้ไขรายการสินค้า</a> <span class="subtle" style="margin-left:8px">SKU: ${p.sku}</span></div></div>
        <div class="form-grid cols-5">
          ${[['กว้าง (มม.)', 'w'], ['ยาว (มม.)', 'l'], ['สูง (มม.)', 'h'], ['น้ำหนัก (กก./ม.)', 'weight']].map(([l, k]) => `<div class="field"><label>${l}<span class="req">*</span></label><input class="input" data-k="${k}" value="${esc(p[k])}" required></div>`).join('')}
          <div class="field"><label>สถานะสินค้า<span class="req">*</span></label>${selectHtml('sp-status', ['เปิดขาย', 'ปิดการขาย', 'หมดสต็อก'], p.status)}</div>
        </div>
        <div class="form-footer"><button class="btn btn-primary" data-save-spec>บันทึกข้อมูล</button></div>
      </div>

      <div class="card">
        <h2 class="card-title">รายละเอียดการปรับปรุงยอดคงคลัง</h2>
        <p class="card-sub">ระบุข้อมูลการปรับสต็อกอย่างชัดเจนเพื่อความแม่นยำ</p>
        <div class="field" style="margin-top:20px"><span class="field-label">ประเภทการปรับปรุง</span>
          <div class="seg"><button class="in on" data-mode="in">${icon('plus', 18)} รับสินค้าเข้าคลัง (+)</button><button class="out" data-mode="out">${icon('minus', 18)} เบิก/จ่ายออกคลัง (-)</button></div></div>
        <div class="field" style="margin-top:16px"><label for="adj-qty">จำนวน</label><input class="input" id="adj-qty" type="number" min="0" value="150"></div>
        <div class="field" style="margin-top:16px"><label for="adj-note">หมายเหตุ</label><input class="input" id="adj-note" value="PO-2569-0456"></div>
        <div class="calc">
          <div><div class="c-label">สต็อกคงเหลือก่อนหน้า</div><div class="c-val muted" data-before>${fmt(p.qty)}</div></div>
          <div><div class="c-label">จำนวนที่ปรับปรุง<span data-word>เพิ่ม</span></div><div class="c-val" data-delta></div></div>
          <div class="eq">=</div>
          <div><div class="c-label">สต็อกสุทธิหลังบันทึกผล</div><div class="c-val" style="color:var(--link)" data-after></div></div>
        </div>
        <div class="form-footer" style="margin-top:0"><button class="btn btn-primary" data-commit>ยืนยันและอัปเดตสต็อก</button></div>
      </div>

      <div class="card">
        <div class="card-head"><h2 class="card-title">ประวัติความเคลื่อนไหวสต็อกล่าสุดของสินค้านี้</h2><span class="muted">รายการประวัติย้อนหลัง 5 ครั้งล่าสุด</span></div>
        <div data-moves></div>
      </div>`;

    const qtyEl = $('#adj-qty', root);
    function calc() {
      const n = Math.max(0, parseInt(qtyEl.value || '0', 10));
      const after = mode === 'in' ? p.qty + n : p.qty - n;
      const delta = after - p.qty;
      $('[data-before]', root).textContent = fmt(p.qty);
      $('[data-word]', root).textContent = delta >= 0 ? 'เพิ่ม' : 'ลด';
      const d = $('[data-delta]', root);
      d.textContent = `${delta >= 0 ? '+' : '−'} ${fmt(Math.abs(delta))}`;
      d.style.color = delta >= 0 ? '#16a34a' : '#dc2626';
      const a = $('[data-after]', root);
      a.textContent = fmt(after);
      a.style.color = after < 0 ? '#dc2626' : 'var(--link)';
      return { n, after, delta };
    }
    function renderMoves() {
      $('[data-moves]', root).innerHTML = simpleTable([
        { label: 'วันที่/เวลา', cell: (m) => m.at },
        { label: 'สินค้า', cell: (m) => esc(m.product) },
        { label: 'SKU', cell: (m) => m.sku },
        { label: 'คลัง', cell: (m) => m.wh },
        { label: 'ประเภท', cell: (m) => badge(m.type) },
        { label: 'ปรับ', cell: (m) => `<span style="color:${m.qty.startsWith('+') ? '#16a34a' : '#dc2626'}">${m.qty}</span>` },
        { label: 'คงเหลือ', cell: (m) => fmt(m.left) },
        { label: 'ผู้ดำเนินการ', cell: (m) => m.by },
        { label: 'หมายเหตุ', cell: (m) => `<span class="muted">${esc(m.note)}</span>` },
      ], DB.stockMoves.slice(0, 5), 'compact');
    }

    root.addEventListener('click', (e) => {
      const m = e.target.closest('[data-mode]');
      if (m) { mode = m.dataset.mode; $$('[data-mode]', root).forEach((b) => b.classList.toggle('on', b === m)); calc(); }
      if (e.target.closest('[data-save-spec]')) {
        const card = $('[data-spec]', root);
        if (!validate(card)) return;
        $$('[data-k]', card).forEach((i) => (p[i.dataset.k] = i.value));
        p.status = $('#sp-status', root).value;
        toast('บันทึกข้อมูลสินค้าแล้ว');
      }
      if (e.target.closest('[data-commit]')) {
        const { n, after, delta } = calc();
        if (!n) return toast('กรุณาระบุจำนวนที่ต้องการปรับปรุง', 'warn');
        if (after < 0) return toast('จำนวนที่เบิกออกมากกว่าสต็อกคงเหลือ', 'warn');
        p.qty = after;
        if (after === 0) p.status = 'หมดสต็อก';
        else if (p.status === 'หมดสต็อก') p.status = 'เปิดขาย';
        DB.stockMoves.unshift({ at: nowThai(), product: p.name, sku: p.sku, wh: 'คลังหลัก (กรุงเทพ)', type: mode === 'in' ? 'รับเข้า' : 'เบิกออก', qty: (delta >= 0 ? '+' : '-') + Math.abs(delta), left: after, by: DB.user.name, note: $('#adj-note', root).value || '-' });
        calc(); renderMoves();
        const label = { in: '<span style="color:#16a34a">+ รับสินค้าเข้าคลัง</span>', out: '<span style="color:#dc2626">- เบิก/จ่ายออกคลัง</span>' }[mode];
        const back = document.createElement('div');
        back.className = 'modal-back';
        back.innerHTML = `<div class="modal center" role="dialog" aria-modal="true"><div class="ok-icon">${icon('check', 34, 2.6)}</div>
          <h3>อัปเดตสต็อกสินค้าสำเร็จ</h3><p class="muted">ระบบได้บันทึกข้อมูลการปรับปรุงจำนวนสินค้า<br>และประวัติการเคลื่อนไหวล่าสุดเรียบร้อยแล้ว</p>
          <div class="sumbox"><div class="row"><span>สินค้า / ขนาด</span><span>${esc(p.name)} ${esc(p.w)}x${esc(p.l)}x${esc(p.h)}</span></div><div class="row"><span>ประเภทการปรับปรุง</span>${label}</div>
            <hr style="border:0;border-top:1px solid var(--border);margin:6px 0"><div class="row"><span>จำนวนสต็อกสุทธิ</span><b style="color:var(--link);font-size:20px">${fmt(after)}</b></div></div>
          <div class="foot2"><button class="btn" data-hist>ดูประวัติสต็อก</button><button class="btn btn-primary" data-ok>ตกลง</button></div></div>`;
        back.addEventListener('click', (ev) => {
          if (ev.target === back || ev.target.closest('[data-ok]')) back.remove();
          if (ev.target.closest('[data-hist]')) { back.remove(); $('[data-moves]', root).scrollIntoView({ behavior: 'smooth', block: 'center' }); }
        });
        document.body.appendChild(back);
        $('[data-ok]', back).focus();
      }
    });
    qtyEl.addEventListener('input', calc);
    calc(); renderMoves();
  };

  // ---------- Shared: upload + export cards ----------
  function uploadExportCards(o) {
    return `<div class="grid-2" style="margin-bottom:24px">
      <div class="card">
        <h2 class="card-title" style="margin-bottom:16px">${o.uploadTitle}</h2>
        <div class="dropzone" data-dz>${icon('upload', 32, 2)}<div class="dz-title">${o.dzTitle}</div><div class="dz-hint">${o.dzHint}</div><div class="dz-file" data-fname></div></div>
        <a style="display:inline-block;margin-top:16px" data-template>${o.templateLabel}</a>
        <div class="form-footer" style="margin-top:8px"><button class="btn btn-primary" data-upload>${o.uploadBtn}</button></div>
      </div>
      <div class="card" style="display:flex;flex-direction:column">
        <h2 class="card-title">${o.exportTitle}</h2>
        <p class="muted" style="margin:12px 0">${o.exportHint}</p>
        ${selectHtml('exp-cat', ['หมวดหมู่ทั้งหมด', ...DB.categories.map((c) => c.name)], 'หมวดหมู่ทั้งหมด')}
        <div class="form-footer" style="margin-top:auto;padding-top:24px"><button class="btn btn-primary" data-export>${o.exportBtn}</button></div>
      </div></div>`;
  }

  function historyTable(list) {
    return simpleTable([
      { label: 'ไฟล์', cell: (h) => `<span class="ellipsis" style="max-width:220px">${esc(h.file)}</span>` },
      { label: 'ประเภท', cell: (h) => h.type },
      { label: 'วันที่', cell: (h) => h.at },
      { label: 'สถานะ', cell: (h) => badge(h.status) },
      { label: 'ผู้ดำเนินการ', cell: (h) => h.by },
    ], list);
  }

  function stockCsvRows(cat) {
    const list = DB.stock.filter((s) => cat === 'หมวดหมู่ทั้งหมด' || s.category === cat);
    return [['SKU', 'ชื่อสินค้า', 'หมวดหมู่', 'กว้าง', 'ยาว', 'สูง', 'น้ำหนัก', 'ราคา', 'คงเหลือ', 'สถานะ'], ...list.map((s) => [s.sku, s.name, s.category, s.w, s.l, s.h, s.weight, s.price, s.qty, s.status])];
  }

  // ---------- นำเข้า/ส่งออกข้อมูลสินค้า ----------
  PAGES.importExport = function (root) {
    let file = null;
    root.innerHTML = `${pageHead('นำเข้า/ส่งออกข้อมูลสินค้า')}
      ${uploadExportCards({
        uploadTitle: 'นำเข้าข้อมูลสินค้า', dzTitle: 'ลากไฟล์ Excel มาวาง หรือคลิกเพื่ออัปโหลด', dzHint: 'รองรับไฟล์ .xlsx, .csv ขนาดไม่เกิน 10MB',
        templateLabel: 'ดาวน์โหลดเทมเพลต Excel', uploadBtn: 'นำเข้าข้อมูล',
        exportTitle: 'ส่งออกข้อมูลสินค้า', exportHint: 'เลือกหมวดหมู่ที่ต้องการส่งออกข้อมูลเป็นไฟล์ Excel', exportBtn: 'ส่งออกเป็น Excel',
      })}
      <div class="card"><h2 class="card-title" style="margin-bottom:16px">ประวัติการนำเข้า/ส่งออก</h2><div data-hist></div></div>`;
    const hist = () => ($('[data-hist]', root).innerHTML = historyTable(DB.fileHistory));
    bindDropzone($('[data-dz]', root), '.xlsx,.xls,.csv', (f) => { file = f; $('[data-fname]', root).textContent = `ไฟล์ที่เลือก: ${f.name}`; });
    root.addEventListener('click', (e) => {
      if (e.target.closest('[data-template]')) { downloadCsv('product_template.csv', [stockCsvRows('')[0]]); toast('ดาวน์โหลดเทมเพลตแล้ว'); }
      if (e.target.closest('[data-upload]')) {
        if (!file) return toast('กรุณาเลือกไฟล์ก่อนนำเข้าข้อมูล', 'warn');
        const rec = { file: file.name, type: 'นำเข้า', at: nowThai(), status: 'กำลังดำเนินการ', by: DB.user.name };
        DB.fileHistory.unshift(rec); hist();
        toast('กำลังนำเข้าข้อมูล...');
        setTimeout(() => { rec.status = 'สำเร็จ'; if (root.isConnected) hist(); toast(`นำเข้า ${file.name} สำเร็จ`); }, 1600);
      }
      if (e.target.closest('[data-export]')) {
        const cat = $('#exp-cat', root).value;
        const name = `product_export_${Date.now()}.csv`;
        downloadCsv(name, stockCsvRows(cat));
        DB.fileHistory.unshift({ file: name, type: 'ส่งออก', at: nowThai(), status: 'สำเร็จ', by: DB.user.name }); hist();
        toast('ส่งออกข้อมูลสินค้าแล้ว');
      }
    });
    hist();
  };

  // ---------- ปรับปรุงราคา ----------
  PAGES.pricing = function (root) {
    let file = null;
    root.innerHTML = `${pageHead('ปรับปรุงราคา')}
      ${uploadExportCards({
        uploadTitle: 'ปรับราคาสินค้า', dzTitle: 'ลากไฟล์ Excel ราคาใหม่มาวาง หรือคลิกเพื่ออัปโหลด', dzHint: 'รองรับไฟล์ .xlsx ขนาดไม่เกิน 10MB',
        templateLabel: 'ดาวน์โหลดเทมเพลตปรับราคาสินค้า', uploadBtn: 'ตรวจสอบไฟล์',
        exportTitle: 'ส่งออกราคาปัจจุบัน', exportHint: 'เลือกหมวดหมู่ที่ต้องการส่งออกราคาปัจจุบันเป็นไฟล์ Excel', exportBtn: 'ส่งออกราคาเป็น Excel',
      })}
      <div class="card" data-verify style="margin-bottom:24px">
        <div class="card-head"><h2 class="card-title">ตรวจสอบและยืนยันการปรับราคา</h2>
          <div style="display:flex;gap:20px;font-weight:500"><span style="color:#16a34a">✓ ถูกต้อง 46 รายการ</span><span style="color:#dc2626">✕ พบข้อผิดพลาด 2 รายการ</span></div></div>
        ${simpleTable([
          { label: 'ประเภทสินค้า', cell: (r) => r.type },
          { label: 'Base Price เดิม', cell: (r) => `<span class="muted">${r.old}</span>` },
          { label: 'Base Price ใหม่', cell: (r) => r.next },
          { label: 'ผลต่าง', cell: (r) => r.diff },
          { label: 'สถานะ', cell: (r) => `<span style="color:${r.ok ? '#16a34a' : '#dc2626'}">${r.msg}</span>` },
        ], DB.priceCheck, 'compact')}
        <div class="alert-warn">⚠ เมื่อยืนยันการปรับราคา ระบบจะคำนวณราคาสินค้าที่เกี่ยวข้องทั้งหมดใหม่โดยอัตโนมัติตามสูตร และจะแก้ไขเฉพาะ 46 รายการที่ถูกต้องเท่านั้น รายการที่พบข้อผิดพลาดจะไม่ถูกปรับ</div>
        <div class="form-footer" style="margin-top:0"><button class="btn" data-cancel>ยกเลิก</button><button class="btn btn-primary" data-confirm>ยืนยันปรับราคา 46 รายการ</button></div>
      </div>
      <div class="card"><h2 class="card-title" style="margin-bottom:16px">ประวัติการปรับราคาสินค้า</h2><div data-hist></div></div>`;
    const verify = $('[data-verify]', root);
    const hist = () => ($('[data-hist]', root).innerHTML = historyTable(DB.priceHistory));
    bindDropzone($('[data-dz]', root), '.xlsx,.xls', (f) => { file = f; $('[data-fname]', root).textContent = `ไฟล์ที่เลือก: ${f.name}`; });
    root.addEventListener('click', (e) => {
      if (e.target.closest('[data-template]')) { downloadCsv('price_template.csv', [['ประเภทสินค้า', 'Base Price ใหม่ (บาท/กก.)']]); toast('ดาวน์โหลดเทมเพลตแล้ว'); }
      if (e.target.closest('[data-upload]')) { verify.style.display = ''; verify.scrollIntoView({ behavior: 'smooth', block: 'start' }); toast(file ? `ตรวจสอบไฟล์ ${file.name} แล้ว` : 'แสดงผลการตรวจสอบไฟล์ตัวอย่าง'); }
      if (e.target.closest('[data-cancel]')) { verify.style.display = 'none'; toast('ยกเลิกการปรับราคาแล้ว'); }
      if (e.target.closest('[data-confirm]')) {
        verify.style.display = 'none';
        DB.priceHistory.unshift({ file: file ? file.name : 'price_update_sample.xlsx', type: 'นำเข้า', at: nowThai(), status: 'สำเร็จ', by: DB.user.name }); hist();
        toast('ปรับราคาสำเร็จ 46 รายการ');
      }
      if (e.target.closest('[data-export]')) {
        const cat = $('#exp-cat', root).value;
        const list = DB.stock.filter((s) => cat === 'หมวดหมู่ทั้งหมด' || s.category === cat);
        downloadCsv('current_prices.csv', [['SKU', 'ชื่อสินค้า', 'ราคา'], ...list.map((s) => [s.sku, s.name, s.price])]);
        toast('ส่งออกราคาปัจจุบันแล้ว');
      }
    });
    hist();
  };
})();
