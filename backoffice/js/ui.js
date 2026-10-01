// Shared UI helpers: escaping, badges, tables, list pages, modal, toast.
(function () {
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = (n, d = 0) => Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const BADGE = {
    green: ['เปิดขาย', 'สำเร็จ', 'ว่าง', 'พร้อมให้บริการ', 'ใช้งาน', 'เผยแพร่แล้ว', 'เผยแพร่', 'ส่งแล้ว', 'เปิดรับคำสั่งซื้อ', 'เปิดใช้งาน', 'รับเข้า'],
    amber: ['รอดำเนินการ', 'ใกล้หมด', 'ตั้งเวลาไว้', 'ระงับชั่วคราว', 'ยืนยันแล้ว'],
    sky: ['กำลังจัดส่ง'],
    purple: ['เตรียมสินค้าแล้ว', 'กำลังจัดเตรียมสินค้า'],
    red: ['หมดสต็อก', 'ล้มเหลว', 'ไม่ให้บริการ', 'ไม่พร้อมให้บริการ', 'เบิกออก'],
    gray: ['ยกเลิก', 'ปิดการขาย', 'ฉบับร่าง', 'หมดอายุ', 'ระงับ', 'ปิดรับชั่วคราว', 'ปิดใช้งาน'],
    blue: ['กำลังใช้งาน', 'กำลังดำเนินการ', 'จองเต็มแล้ว', 'ตั้งเวลาเผยแพร่', 'จัดส่งแล้ว'],
  };
  const badgeTone = {};
  Object.entries(BADGE).forEach(([tone, list]) => list.forEach((t) => (badgeTone[t] = tone)));
  // Notification "ตั้งเวลาไว้" uses the blue tone in the design; callers can force a tone.
  const badge = (text, tone) => `<span class="badge b-${tone || badgeTone[text] || 'gray'}">${esc(text)}</span>`;

  function pageHead(title, actions = '') {
    return `<div class="page-head"><h1 class="page-title">${esc(title)}</h1>${actions ? `<div class="page-actions">${actions}</div>` : ''}</div>`;
  }

  function searchInput(id, placeholder, value = '') {
    return `<div class="input-icon left">${icon('search', 18)}<input class="input" id="${id}" placeholder="${esc(placeholder)}" value="${esc(value)}" autocomplete="off"></div>`;
  }

  function selectHtml(id, options, value) {
    return `<select class="select" id="${id}">${options.map((o) => {
      const [v, l] = Array.isArray(o) ? o : [o, o];
      return `<option value="${esc(v)}"${v === value ? ' selected' : ''}>${esc(l)}</option>`;
    }).join('')}</select>`;
  }

  function dateInput(id, value, placeholder = '') {
    return `<div class="input-icon right"><input class="input" id="${id}" value="${esc(value)}" placeholder="${esc(placeholder)}">${icon('calendar', 20)}</div>`;
  }

  function pagerHtml(total, page, size) {
    const pages = Math.max(1, Math.ceil(total / size));
    const from = total ? (page - 1) * size + 1 : 0;
    const to = Math.min(total, page * size);
    let nums = '';
    for (let i = 1; i <= Math.min(pages, 5); i++) nums += `<button data-page="${i}" class="${i === page ? 'on' : ''}">${i}</button>`;
    return `<div class="pager">
      <div class="info">แสดงรายการ ${from}-${to} จากทั้งหมด ${fmt(total)} รายการ
        <select class="select" data-size>${[10, 20, 50].map((n) => `<option value="${n}"${n === size ? ' selected' : ''}>${n} รายการต่อหน้า</option>`).join('')}</select>
      </div>
      <div class="pages">
        <button class="nav" data-page="${page - 1}" ${page <= 1 ? 'disabled' : ''}>ก่อนหน้า</button>
        ${nums}
        <button class="nav" data-page="${page + 1}" ${page >= pages ? 'disabled' : ''}>ถัดไป</button>
      </div>
    </div>`;
  }

  /**
   * Generic searchable/filterable/paginated list page.
   * cfg: { title, actions, search:{label,placeholder,keys}, status:{label,key,options}, extraFilters,
   *        filterCols, cardTitle, cardRight, rows: () => array, cols:[{label, cell(row), cls}], onRowClick, after(root) }
   */
  function listPage(root, cfg) {
    const state = { q: '', status: 'ทั้งหมด', page: 1, size: 10 };
    const filtersCols = cfg.filterCols || (cfg.status ? '2fr 1fr' : '1fr');
    root.innerHTML = `
      ${pageHead(cfg.title, cfg.actions || '')}
      <div class="filters" style="grid-template-columns:${filtersCols}">
        <div class="field"><label for="f-q">${esc(cfg.search.label)}</label>${searchInput('f-q', cfg.search.placeholder)}</div>
        ${cfg.extraFilters || ''}
        ${cfg.status ? `<div class="field"><label for="f-status">${esc(cfg.status.label || 'สถานะ')}</label>${selectHtml('f-status', ['ทั้งหมด', ...cfg.status.options], 'ทั้งหมด')}</div>` : ''}
      </div>
      <div class="card">
        ${cfg.cardTitle ? `<div class="card-head"><h2 class="card-title" data-card-title>${esc(cfg.cardTitle(0))}</h2>${cfg.cardRight || ''}</div>` : ''}
        <div class="table-wrap"><table class="tbl"><thead><tr>${cfg.cols.map((c) => `<th class="${c.cls || ''}">${c.label}</th>`).join('')}</tr></thead><tbody></tbody></table></div>
        <div data-pager></div>
      </div>`;

    const tbody = $('tbody', root);
    const pagerEl = $('[data-pager]', root);

    function filtered() {
      const q = state.q.trim().toLowerCase();
      return cfg.rows().filter((r) => {
        if (cfg.status && state.status !== 'ทั้งหมด' && r[cfg.status.key] !== state.status) return false;
        if (cfg.extraMatch && !cfg.extraMatch(r)) return false;
        if (!q) return true;
        return cfg.search.keys.some((k) => String(r[k]).toLowerCase().includes(q));
      });
    }

    function render() {
      const list = filtered();
      const pages = Math.max(1, Math.ceil(list.length / state.size));
      state.page = Math.min(state.page, pages);
      const slice = list.slice((state.page - 1) * state.size, state.page * state.size);
      tbody.innerHTML = slice.length
        ? slice.map((r) => `<tr${cfg.onRowClick ? ' class="row-click"' : ''} data-idx="${cfg.rows().indexOf(r)}">${cfg.cols.map((c) => `<td class="${c.cls || ''}">${c.cell(r)}</td>`).join('')}</tr>`).join('')
        : `<tr><td class="empty" colspan="${cfg.cols.length}">ไม่พบรายการที่ตรงกับเงื่อนไข</td></tr>`;
      pagerEl.innerHTML = pagerHtml(list.length, state.page, state.size);
      const t = $('[data-card-title]', root);
      if (t) t.textContent = cfg.cardTitle(list.length);
    }

    $('#f-q', root).addEventListener('input', (e) => { state.q = e.target.value; state.page = 1; render(); });
    if (cfg.status) $('#f-status', root).addEventListener('change', (e) => { state.status = e.target.value; state.page = 1; render(); });
    root.addEventListener('change', (e) => {
      if (e.target.matches('[data-size]')) { state.size = +e.target.value; state.page = 1; render(); }
      if (e.target.closest('.filters') && e.target.id !== 'f-status') { state.page = 1; render(); }
    });
    root.addEventListener('click', (e) => {
      const p = e.target.closest('[data-page]');
      if (p && !p.disabled) { state.page = +p.dataset.page; render(); return; }
      const act = e.target.closest('[data-act]');
      if (act) {
        e.preventDefault();
        const row = cfg.rows()[+act.closest('tr').dataset.idx];
        cfg.onAction && cfg.onAction(act.dataset.act, row, render);
        return;
      }
      if (cfg.onRowClick && !e.target.closest('a,button')) {
        const tr = e.target.closest('tr[data-idx]');
        if (tr) cfg.onRowClick(cfg.rows()[+tr.dataset.idx]);
      }
    });
    render();
    cfg.after && cfg.after(root, render);
    return { render };
  }

  function simpleTable(cols, rows, cls = '') {
    return `<div class="table-wrap"><table class="tbl ${cls}"><thead><tr>${cols.map((c) => `<th class="${c.cls || ''}">${c.label}</th>`).join('')}</tr></thead>
      <tbody>${rows.map((r) => `<tr>${cols.map((c) => `<td class="${c.cls || ''}">${c.cell(r)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }

  // ---------- Modal ----------
  function modal({ title, body = '', confirm = 'ยืนยัน', cancel = 'ยกเลิก', danger = false, onConfirm, onOpen, wide = false }) {
    const back = document.createElement('div');
    back.className = 'modal-back';
    back.innerHTML = `<div class="modal${wide ? ' wide' : ''}" role="dialog" aria-modal="true">
      <h3>${esc(title)}</h3><div class="m-body">${body}</div>
      <div class="form-footer">${cancel ? `<button class="btn" data-x>${esc(cancel)}</button>` : ''}
      <button class="btn ${danger ? 'btn-danger-outline' : 'btn-primary'}" data-ok>${esc(confirm)}</button></div></div>`;
    const close = () => back.remove();
    back.addEventListener('click', (e) => { if (e.target === back || e.target.closest('[data-x]')) close(); });
    $('[data-ok]', back).addEventListener('click', () => { if (!onConfirm || onConfirm(back) !== false) close(); });
    document.body.appendChild(back);
    onOpen && onOpen(back);
    const first = $('input,select,textarea', back);
    (first || $('[data-ok]', back)).focus();
    return back;
  }

  function confirmDelete(name, onYes) {
    modal({ title: 'ยืนยันการลบ', body: `ต้องการลบ “${esc(name)}” ใช่หรือไม่? การลบไม่สามารถย้อนกลับได้`, confirm: 'ลบ', danger: true, onConfirm: onYes });
  }

  // ---------- Toast ----------
  function toast(msg, tone = 'ok') {
    let host = $('.toast-host');
    if (!host) { host = document.createElement('div'); host.className = 'toast-host'; document.body.appendChild(host); }
    const t = document.createElement('div');
    t.className = `toast ${tone}`;
    t.innerHTML = `${icon(tone === 'ok' ? 'check' : 'x', 18, 2.4)}<span>${esc(msg)}</span>`;
    host.appendChild(t);
    setTimeout(() => t.remove(), 2800);
  }

  // Validate required fields inside a container; returns true when all are filled.
  function validate(root) {
    let ok = true;
    $$('[required]', root).forEach((el) => {
      const empty = !String(el.value || '').trim();
      el.classList.toggle('invalid', empty);
      if (empty) ok = false;
    });
    if (!ok) toast('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน', 'warn');
    return ok;
  }

  // Dropzone wiring: click/drag to pick a file and show its name.
  function bindDropzone(dz, accept, onFile) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.hidden = true;
    dz.appendChild(input);
    const set = (f) => { if (!f) return; onFile(f); };
    dz.addEventListener('click', (e) => { if (e.target !== input) input.click(); });
    input.addEventListener('change', () => set(input.files[0]));
    dz.addEventListener('dragover', (e) => { e.preventDefault(); dz.classList.add('drag'); });
    dz.addEventListener('dragleave', () => dz.classList.remove('drag'));
    dz.addEventListener('drop', (e) => { e.preventDefault(); dz.classList.remove('drag'); set(e.dataTransfer.files[0]); });
  }

  function downloadCsv(filename, rows) {
    const csv = '﻿' + rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function nowThai() {
    const m = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    return `${p(d.getDate())} ${m[d.getMonth()]} ${d.getFullYear() + 543} ${p(d.getHours())}:${p(d.getMinutes())}`;
  }

  window.UI = { esc, fmt, $, $$, badge, pageHead, searchInput, selectHtml, dateInput, pagerHtml, listPage, simpleTable, modal, confirmDelete, toast, validate, bindDropzone, downloadCsv, nowThai };
})();
