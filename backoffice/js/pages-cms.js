// จัดการเนื้อหา (CMS) and การส่งแจ้งเตือน.
(function () {
  const { esc, fmt, $, $$, badge, pageHead, selectHtml, dateInput, modal, confirmDelete, toast, validate, bindDropzone, nowThai } = UI;

  const req = '<span class="req">*</span>';
  const addBtn = (label, href) => `<a class="btn btn-primary" href="#${href}">${icon('plus', 18)} ${label}</a>`;

  // Image upload box: shows a dropzone, or a preview + remove link once an image is chosen.
  function imageField(el, removeLabel, initial) {
    let src = initial;
    function render() {
      el.innerHTML = src
        ? `<div class="image-box"><img src="${src}" alt="ตัวอย่างรูปภาพ"><a class="link-danger" data-rm>${removeLabel}</a></div>`
        : `<div class="dropzone" data-dz>${icon('upload', 32, 2)}<div class="dz-title">ลากไฟล์รูปภาพมาวาง หรือคลิกเพื่ออัปโหลด</div><div class="dz-hint">รองรับ JPG และ PNG</div></div>`;
      if (src) $('[data-rm]', el).addEventListener('click', () => { src = null; render(); });
      else bindDropzone($('[data-dz]', el), 'image/png,image/jpeg', (f) => {
        const r = new FileReader();
        r.onload = () => { src = r.result; render(); };
        r.readAsDataURL(f);
      });
    }
    render();
    return { get value() { return src; } };
  }

  // ---------- จัดการประกาศ ----------
  PAGES.announcements = function (root) {
    UI.listPage(root, {
      title: 'จัดการประกาศ',
      actions: addBtn('เพิ่มประกาศ', '/cms/announcements/new'),
      search: { label: 'ค้นหาประกาศ', placeholder: 'หัวข้อประกาศ', keys: ['title'] },
      status: { key: 'status', options: ['เผยแพร่แล้ว', 'ตั้งเวลาไว้', 'ฉบับร่าง'] },
      filterCols: '3fr 1fr',
      cardTitle: () => 'รายการประกาศทั้งหมด',
      rows: () => DB.announcements,
      cols: [
        { label: 'หัวข้อประกาศ', cell: (r) => `<div class="ellipsis">${esc(r.title)}</div>` },
        { label: 'วันที่เผยแพร่ / ตั้งเวลา', cell: (r) => r.publish },
        { label: 'วันหมดอายุ', cell: (r) => `<span class="subtle">${r.expire}</span>` },
        { label: 'สถานะ', cell: (r) => badge(r.status) },
        { label: 'ผู้สร้าง', cell: (r) => r.by },
        { label: 'จัดการ', cell: () => `<span class="actions-cell"><a data-act="edit">แก้ไข</a><a class="link-danger" data-act="delete">ลบ</a></span>` },
      ],
      onAction: (act, r, render) => {
        if (act === 'delete') return confirmDelete(r.title, () => { DB.announcements.splice(DB.announcements.indexOf(r), 1); render(); toast('ลบประกาศแล้ว'); });
        sessionStorage.setItem('edit-ann', DB.announcements.indexOf(r));
        location.hash = '#/cms/announcements/new';
      },
    });
  };

  PAGES.announcementNew = function (root) {
    let idx = null;
    try { idx = sessionStorage.getItem('edit-ann'); sessionStorage.removeItem('edit-ann'); } catch {}
    const a = idx !== null ? DB.announcements[+idx] : null;
    const statuses = [['เผยแพร่แล้ว', 'เผยแพร่แล้ว (Published)'], ['ตั้งเวลาไว้', 'ตั้งเวลาไว้ (Scheduled)'], ['ฉบับร่าง', 'ฉบับร่าง (Draft)']];
    root.innerHTML = `${pageHead(a ? 'แก้ไขประกาศ' : 'สร้างประกาศใหม่')}
      <div class="card"><div class="form-grid">
        <div class="field"><label>หัวข้อประกาศ${req}</label><input class="input" data-title required placeholder="เช่น The Steel เปิดตัวแบรนด์ใหม่ เหล็กคุณภาพมาตรฐานสากล" value="${a ? esc(a.title) : ''}"></div>
        <div class="field"><label>รายละเอียดประกาศ${req}</label><textarea class="textarea" style="min-height:160px" required placeholder="ระบุรายละเอียดของประกาศแบบย่อหรือแบบเต็มสำหรับแสดงผลบนหน้าเว็บไซต์...">${a ? 'รายละเอียดประกาศ: ' + esc(a.title) : ''}</textarea></div>
        <div class="form-grid cols-2">
          <div class="field"><label>วันที่เผยแพร่ / ตั้งเวลา${req}</label><div class="input-icon right"><input class="input" type="datetime-local" data-pub required value="2026-09-09T09:00"></div></div>
          <div class="field"><label>วันหมดอายุ</label><div class="input-icon right"><input class="input" type="date" data-exp></div></div>
        </div>
        <div class="field" style="max-width:320px"><label>สถานะ${req}</label>${selectHtml('ann-status', statuses, a ? a.status : 'เผยแพร่แล้ว')}</div>
        <div class="field"><label>รูปภาพหน้าปกประกาศ</label><div data-img></div></div>
      </div>
      <div class="form-footer"><a class="btn" href="#/cms/announcements">ยกเลิก</a><button class="btn btn-primary" data-save>บันทึกประกาศ</button></div></div>`;
    imageField($('[data-img]', root), 'ลบรูปภาพ');
    $('[data-save]', root).addEventListener('click', () => {
      if (!validate(root)) return;
      const status = $('#ann-status', root).value;
      const d = new Date($('[data-pub]', root).value);
      const pub = isNaN(d) ? '-' : nowThaiFrom(d);
      const expV = $('[data-exp]', root).value;
      const rec = { title: $('[data-title]', root).value, publish: status === 'ฉบับร่าง' ? '-' : pub, expire: expV ? nowThaiFrom(new Date(expV)).slice(0, -6) : '-', status, by: DB.user.name };
      a ? Object.assign(a, rec) : DB.announcements.unshift(rec);
      toast('บันทึกประกาศแล้ว');
      location.hash = '#/cms/announcements';
    });
  };

  function nowThaiFrom(d) {
    const m = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const p = (n) => String(n).padStart(2, '0');
    return `${p(d.getDate())} ${m[d.getMonth()]} ${d.getFullYear() + 543} ${p(d.getHours())}:${p(d.getMinutes())}`;
  }

  // ---------- บทความ ----------
  PAGES.articles = function (root) {
    UI.listPage(root, {
      title: 'บทความ',
      actions: addBtn('เพิ่มบทความ', '/cms/articles/new'),
      search: { label: 'ค้นหาบทความ', placeholder: 'ชื่อบทความ', keys: ['title', 'by'] },
      status: { key: 'status', options: ['เผยแพร่', 'ตั้งเวลาเผยแพร่'] },
      filterCols: '3fr 1fr',
      rows: () => DB.articles,
      cols: [
        { label: 'ชื่อบทความ', cell: (r) => esc(r.title) },
        { label: 'ยอดเยี่ยมชม', cell: (r) => fmt(r.views) },
        { label: 'สถานะ', cell: (r) => badge(r.status) },
        { label: 'ผู้สร้าง', cell: (r) => r.by },
        { label: 'วันที่สร้าง', cell: (r) => r.created },
        { label: 'วันที่เผยแพร่', cell: (r) => r.published },
        { label: 'จัดการ', cell: () => `<span class="actions-cell"><a href="#/cms/articles/new">แก้ไข</a><a class="link-danger" data-act="delete">ลบ</a></span>` },
      ],
      onAction: (act, r, render) => confirmDelete(r.title, () => { DB.articles.splice(DB.articles.indexOf(r), 1); render(); toast('ลบบทความแล้ว'); }),
    });
  };

  PAGES.articleNew = function (root) {
    root.innerHTML = `${pageHead('สร้างบทความ')}
      <div class="stack">
      <div class="card"><h2 class="card-title" style="margin-bottom:12px">รายละเอียดบทความ</h2><div class="form-grid">
        <div class="field"><label>ชื่อบทความ${req}</label><input class="input" data-title required placeholder="เช่น ทำไมเหล็กเส้นกลมจึงเป็นที่นิยมในงานก่อสร้าง"></div>
        <div class="field"><label>รูปประกอบปกบทความ${req}</label><div class="hint-red">รองรับ JPG และ PNG จำนวน 1 รูป</div><div data-img></div></div>
      </div></div>

      <div class="card"><h2 class="card-title" style="margin-bottom:12px">กำหนดเวลาเผยแพร่</h2>
        <div class="radio-row"><label><input type="radio" name="when" value="now"> เผยแพร่ทันที</label><label><input type="radio" name="when" value="later" checked> กำหนดเวลาเผยแพร่</label></div>
        <div class="form-grid cols-2" data-when style="margin-top:16px">
          <div class="field"><label>วันที่เผยแพร่${req}</label>${dateInput('pub-date', '25 ก.ย. 2569')}</div>
          <div class="field"><label>เวลา${req}</label><input class="input" id="pub-time" value="15:00 น."></div>
        </div></div>

      <div class="card"><h2 class="card-title" style="margin-bottom:12px">เนื้อหาบทความ</h2>
        <div class="editor">
          <div class="toolbar">
            <select data-font><option>Sarabun</option><option>Tahoma</option><option>Georgia</option></select>
            <select data-size><option value="3" selected>16</option><option value="2">13</option><option value="4">18</option><option value="5">24</option></select>
            <span class="sep"></span>
            <button data-cmd="bold" title="ตัวหนา">B</button><button data-cmd="italic" title="ตัวเอียง"><i>I</i></button><button data-cmd="underline" title="ขีดเส้นใต้"><u>U</u></button>
            <span class="sep"></span>
            <button data-color="#2563eb" title="สีน้ำเงิน" style="color:#2563eb">A</button><button data-color="#f5a300" title="สีส้ม" style="color:#f5a300">A</button><button data-color="#1f1f29" title="สีดำ">A</button>
          </div>
          <div class="content" contenteditable="true">
            <h2>ทำไมเหล็กเส้นกลมจึงเป็นที่นิยมในงานก่อสร้าง</h2>
            <p>เหล็กเส้นกลมเป็นวัสดุที่ได้รับความนิยมอย่างมากในงานก่อสร้าง เนื่องจากมี<b style="color:#2563eb">คุณภาพสูง</b> และราคาที่ <b style="color:#f5a300">คุ้มค่าที่สุด</b> ในท้องตลาด</p>
            <p class="subtle" style="font-size:13px">อัปเดตล่าสุด: ทีมงาน The Steel</p>
          </div>
        </div></div>
      </div>
      <div class="form-footer"><a class="btn" href="#/cms/articles">ยกเลิก</a><button class="btn btn-primary" data-save>เผยแพร่บทความ</button></div>`;
    const img = imageField($('[data-img]', root), 'ลบรูปประกอบ', 'assets/steel-tube.jpg');
    const editor = $('.content', root);
    root.addEventListener('change', (e) => {
      if (e.target.name === 'when') $('[data-when]', root).style.display = e.target.value === 'later' ? '' : 'none';
      if (e.target.matches('[data-font]')) { editor.focus(); document.execCommand('fontName', false, e.target.value); }
      if (e.target.matches('[data-size]')) { editor.focus(); document.execCommand('fontSize', false, e.target.value); }
    });
    root.addEventListener('mousedown', (e) => {
      const b = e.target.closest('[data-cmd],[data-color]');
      if (!b) return;
      e.preventDefault();
      b.dataset.cmd ? document.execCommand(b.dataset.cmd) : document.execCommand('foreColor', false, b.dataset.color);
    });
    $('[data-save]', root).addEventListener('click', () => {
      if (!validate(root)) return;
      if (!img.value) return toast('กรุณาอัปโหลดรูปประกอบปกบทความ', 'warn');
      const later = $('input[name=when]:checked', root).value === 'later';
      const stamp = nowThai().replace(/ 25(\d\d) /, ' $1 - ');
      DB.articles.unshift({ title: $('[data-title]', root).value, views: 0, status: later ? 'ตั้งเวลาเผยแพร่' : 'เผยแพร่', by: DB.user.name, created: stamp, published: later ? `${$('#pub-date', root).value} - ${$('#pub-time', root).value}` : stamp });
      toast(later ? 'ตั้งเวลาเผยแพร่บทความแล้ว' : 'เผยแพร่บทความแล้ว');
      location.hash = '#/cms/articles';
    });
  };

  // ---------- จัดการโปรโมชั่น ----------
  PAGES.promotions = function (root) {
    UI.listPage(root, {
      title: 'จัดการโปรโมชั่น',
      actions: addBtn('เพิ่มโปรโมชั่น', '/cms/promotions/new'),
      search: { label: 'ค้นหาโปรโมชั่น', placeholder: 'ชื่อโปรโมชั่น', keys: ['title'] },
      status: { key: 'status', options: ['ใช้งาน', 'หมดอายุ'] },
      filterCols: '3fr 1fr',
      rows: () => DB.promotions,
      cols: [
        { label: 'ชื่อโปรโมชั่น', cell: (r) => esc(r.title) },
        { label: 'จำนวนผู้ใช้ที่กดรับ (คน)', cell: (r) => fmt(r.used) },
        { label: 'วันที่ / เวลา เริ่มต้น', cell: (r) => r.start },
        { label: 'วันที่ / เวลา สิ้นสุด', cell: (r) => r.end },
        { label: 'สถานะ', cell: (r) => badge(r.status) },
        { label: 'จัดการ', cell: () => `<span class="actions-cell"><a href="#/cms/promotions/new">แก้ไข</a><a class="link-danger" data-act="delete">ลบ</a></span>` },
      ],
      onAction: (act, r, render) => confirmDelete(r.title, () => { DB.promotions.splice(DB.promotions.indexOf(r), 1); render(); toast('ลบโปรโมชั่นแล้ว'); }),
    });
  };

  PAGES.promotionNew = function (root) {
    root.innerHTML = `${pageHead('สร้างโปรโมชั่น')}
      <div class="stack">
      <div class="card"><h2 class="card-title" style="margin-bottom:12px">รายละเอียดโปรโมชั่น</h2><div class="form-grid">
        <div class="field"><label>ชื่อโปรโมชั่น${req}</label><input class="input" data-title required placeholder="เช่น ลดทันที 5% เมื่อซื้อเหล็กเส้นครบ 50,000 บาท"></div>
        <div class="field"><label>คำอธิบายโปรโมชั่น${req}</label><textarea class="textarea" required placeholder="อธิบายรายละเอียดและเงื่อนไขของโปรโมชัน"></textarea></div>
        <div class="field"><label>รูปปกโปรโมชั่น${req}</label><div class="hint-red">รองรับ JPG และ PNG จำนวน 1 รูป</div><div data-img></div></div>
      </div></div>
      <div class="card"><h2 class="card-title" style="margin-bottom:12px">ระยะเวลาโปรโมชั่น</h2><div class="form-grid cols-2">
        <div class="field"><label>วันที่ / เวลา เริ่มต้น${req}</label><input class="input" type="datetime-local" data-start required></div>
        <div class="field"><label>วันที่ / เวลา สิ้นสุด${req}</label><input class="input" type="datetime-local" data-end required></div>
      </div></div>
      <div class="card"><h2 class="card-title" style="margin-bottom:12px">สถานะโปรโมชั่น</h2>
        <div class="field"><label>สถานะ${req}</label>${selectHtml('pr-status', ['ใช้งาน', 'ปิดใช้งาน'], 'ใช้งาน')}</div></div>
      </div>
      <div class="form-footer"><a class="btn" href="#/cms/promotions">ยกเลิก</a><button class="btn btn-primary" data-save>บันทึกโปรโมชั่น</button></div>`;
    const img = imageField($('[data-img]', root), 'ลบรูปปก', 'assets/steel-tube.jpg');
    $('[data-save]', root).addEventListener('click', () => {
      if (!validate(root)) return;
      if (!img.value) return toast('กรุณาอัปโหลดรูปปกโปรโมชั่น', 'warn');
      const s = new Date($('[data-start]', root).value), e = new Date($('[data-end]', root).value);
      if (e <= s) { $('[data-end]', root).classList.add('invalid'); return toast('วันสิ้นสุดต้องอยู่หลังวันเริ่มต้น', 'warn'); }
      const f = (d) => nowThaiFrom(d).replace(/ 25(\d\d) /, ' $1 - ');
      DB.promotions.unshift({ title: $('[data-title]', root).value, used: 0, start: f(s), end: f(e), status: $('#pr-status', root).value === 'ใช้งาน' ? 'ใช้งาน' : 'หมดอายุ' });
      toast('บันทึกโปรโมชั่นแล้ว');
      location.hash = '#/cms/promotions';
    });
  };

  // ---------- ตั้งค่า SEO / AEO ----------
  PAGES.seo = function (root) {
    const s = DB.seo;
    const L = DB.llms;
    const INC = [['org', 'ข้อมูลองค์กร'], ['cats', 'หมวดหมู่และรายการสินค้า'], ['faq', 'คำถามที่พบบ่อย (FAQ)'], ['articles', 'บทความ'], ['promos', 'โปรโมชั่น']];
    root.innerHTML = `${pageHead('ตั้งค่า SEO / AEO')}
      <div class="tabs" role="tablist"><button class="on" data-tab="seo">SEO พื้นฐาน</button><button data-tab="ai">AI Crawler &amp; llms.txt</button></div>
      <div class="card" data-pane="seo"><div class="form-grid">
        <div class="field"><label>ชื่อหัวข้อ${req}</label><input class="input" data-k="title" required value="${esc(s.title)}"></div>
        <div class="field"><label>คำอธิบาย${req}</label><textarea class="textarea" data-k="description" maxlength="157" required>${esc(s.description)}</textarea><div class="counter" data-count></div></div>
        <div class="field"><label>URL Slug${req}</label><input class="input" data-k="slug" required value="${esc(s.slug)}"></div>
        <div class="field"><label>รูปไอคอน${req}</label><div class="image-box" style="padding:24px"><img src="assets/favicon.png" alt="ไอคอนเว็บไซต์" style="width:32px;height:32px;border:1px solid #000" data-ico><a data-change-ico>เปลี่ยนรูปประกอบ</a></div></div>
        <div class="field"><label>ตัวอย่างการแสดงผลบน Google</label>
          <div class="serp-wrap"><div class="serp">
            <div class="site"><img src="assets/favicon.png" alt="" data-ico><div><div data-p-slug></div><div class="muted" data-p-url></div></div></div>
            <div class="s-title" data-p-title></div><div class="s-desc" data-p-desc></div>
          </div></div></div>
      </div>
      <div class="form-footer"><button class="btn" data-reset>ยกเลิก</button><button class="btn btn-primary" data-save>บันทึกการเปลี่ยนแปลง</button></div></div>

      <div class="card" data-pane="ai" hidden>
        <h2 class="card-title">การเข้าถึงของ AI Crawler</h2><p class="card-sub">เลือกว่าจะอนุญาตให้ AI ใดเข้ามาอ่านข้อมูลเว็บไซต์ ระบบจะอัปเดตไฟล์ robots.txt ให้อัตโนมัติ</p>
        <div class="table-wrap" style="margin-top:16px"><table class="tbl compact"><thead><tr><th>AI Crawler</th><th>ผู้ให้บริการ</th><th>การใช้งาน</th><th>อนุญาต</th></tr></thead><tbody>
          ${L.bots.map((b, i) => `<tr><td>${b.name}</td><td>${b.vendor}</td><td class="muted">${b.use}</td><td><label class="check"><input type="checkbox" data-bot="${i}" ${b.allow ? 'checked' : ''}> อนุญาต</label></td></tr>`).join('')}
        </tbody></table></div>
        <p class="muted" style="font-size:13px;margin:10px 0 0">💡 หากไม่อนุญาต AI นั้นจะไม่สามารถอ้างอิงเว็บไซต์ในคำตอบได้</p>
        <hr style="border:0;border-top:1px solid var(--border);margin:24px 0">
        <h2 class="card-title">ไฟล์ llms.txt</h2><p class="card-sub">ไฟล์สรุปเว็บไซต์สำหรับ AI ช่วยให้ AI เข้าใจโครงสร้างและเนื้อหาสำคัญของเว็บไซต์ได้เร็วและถูกต้องขึ้น</p>
        <label class="check" style="margin:12px 0"><input type="checkbox" data-auto ${L.auto ? 'checked' : ''}> สร้างและอัปเดตไฟล์ llms.txt อัตโนมัติ</label>
        <div class="form-grid cols-2"><div class="field"><label>URL ของไฟล์</label><input class="input" readonly value="https://www.${esc(s.slug.replace(/^www\./, ''))}/llms.txt"></div>
          <div class="field"><label>อัปเดตล่าสุด</label><input class="input" readonly data-updated value="${L.updated}"></div></div>
        <div class="field" style="margin-top:16px"><label>เนื้อหาที่รวมในไฟล์</label><div style="display:flex;gap:20px;flex-wrap:wrap" data-inc>${INC.map(([k, l]) => `<label class="check"><input type="checkbox" data-inc-k="${k}" ${L.include[k] ? 'checked' : ''}> ${l}</label>`).join('')}</div></div>
        <div class="field" style="margin-top:16px"><label>ตัวอย่างไฟล์ llms.txt</label><pre class="mono" data-llms style="background:#f8f9fb;border:1px solid var(--border);border-radius:8px;padding:16px 20px;margin:0;white-space:pre-wrap;line-height:1.6"></pre></div>
        <div class="form-footer"><button class="btn" data-reset-ai>ยกเลิก</button><button class="btn btn-primary" data-save-ai>บันทึกการเปลี่ยนแปลง</button></div>
      </div>`;

    const get = (k) => $(`[data-k="${k}"]`, root).value;
    function preview() {
      $('[data-p-slug]', root).textContent = get('slug');
      $('[data-p-url]', root).textContent = `https://www.${get('slug').replace(/^www\./, '')}/`;
      $('[data-p-title]', root).textContent = get('title') || 'ชื่อหัวข้อ';
      $('[data-p-desc]', root).textContent = get('description');
      $('[data-count]', root).textContent = `${get('description').length} / 157`;
    }
    // llms.txt preview follows the "content to include" checkboxes.
    function llms() {
      const on = (k) => $(`[data-inc-k="${k}"]`, root).checked;
      const lines = ['# The Steel', `> ${get('description') || 'ผู้ผลิตและจำหน่ายเหล็กรูปพรรณ เหล็กกล่อง และท่อเหล็กมาตรฐาน มอก.'}`];
      if (on('org')) lines.push('', '## เกี่ยวกับเรา', '- [ข้อมูลองค์กร](https://www.thesteel.co.th/about)');
      if (on('cats')) lines.push('', '## สินค้า', ...DB.categories.map((c) => `- [${c.name}](https://www.thesteel.co.th/category/${c.id})`));
      if (on('articles')) lines.push('', '## บทความ', ...DB.articles.filter((a) => a.status === 'เผยแพร่').slice(0, 3).map((a) => `- [${a.title}](https://www.thesteel.co.th/articles)`));
      if (on('promos')) lines.push('', '## โปรโมชั่น', ...DB.promotions.filter((p) => p.status === 'ใช้งาน').slice(0, 3).map((p) => `- ${p.title}`));
      if (on('faq')) lines.push('', '## ข้อมูลสำคัญ', '- [คำถามที่พบบ่อย](https://www.thesteel.co.th/faq)', '- [การจัดส่งและค่าขนส่ง](https://www.thesteel.co.th/shipping)');
      $('[data-llms]', root).textContent = lines.join('\n');
      const auto = $('[data-auto]', root).checked;
      $$('[data-inc-k]', root).forEach((c) => (c.disabled = !auto));
    }
    root.addEventListener('input', () => { preview(); llms(); });
    root.addEventListener('change', llms);
    root.addEventListener('click', (e) => {
      const tab = e.target.closest('[data-tab]');
      if (tab) {
        $$('[data-tab]', root).forEach((t) => t.classList.toggle('on', t === tab));
        $$('[data-pane]', root).forEach((p) => (p.hidden = p.dataset.pane !== tab.dataset.tab));
      }
      if (e.target.closest('[data-save]')) { if (!validate($('[data-pane="seo"]', root))) return; ['title', 'description', 'slug'].forEach((k) => (s[k] = get(k))); toast('บันทึกการตั้งค่า SEO แล้ว'); }
      if (e.target.closest('[data-reset]')) { ['title', 'description', 'slug'].forEach((k) => ($(`[data-k="${k}"]`, root).value = s[k])); preview(); }
      if (e.target.closest('[data-save-ai]')) {
        $$('[data-bot]', root).forEach((c) => (L.bots[+c.dataset.bot].allow = c.checked));
        L.auto = $('[data-auto]', root).checked;
        $$('[data-inc-k]', root).forEach((c) => (L.include[c.dataset.incK] = c.checked));
        L.updated = nowThai().replace(/ (\d\d:\d\d)$/, ' - $1 น.');
        $('[data-updated]', root).value = L.updated;
        toast(`บันทึกแล้ว — อนุญาต AI Crawler ${L.bots.filter((b) => b.allow).length}/${L.bots.length} ราย`);
      }
      if (e.target.closest('[data-reset-ai]')) {
        $$('[data-bot]', root).forEach((c) => (c.checked = L.bots[+c.dataset.bot].allow));
        $('[data-auto]', root).checked = L.auto;
        $$('[data-inc-k]', root).forEach((c) => (c.checked = L.include[c.dataset.incK]));
        llms();
      }
      if (e.target.closest('[data-change-ico]')) {
        const input = document.createElement('input');
        input.type = 'file'; input.accept = 'image/png,image/x-icon,image/jpeg';
        input.onchange = () => {
          const f = input.files[0]; if (!f) return;
          const r = new FileReader();
          r.onload = () => $$('[data-ico]', root).forEach((img) => (img.src = r.result));
          r.readAsDataURL(f);
        };
        input.click();
      }
    });
    preview(); llms();
  };

  // ---------- จัดการการส่งแจ้งเตือน ----------
  PAGES.notifications = function (root) {
    UI.listPage(root, {
      title: 'จัดการการส่งแจ้งเตือน',
      actions: addBtn('สร้างการแจ้งเตือนใหม่', '/notifications/new'),
      search: { label: 'ค้นหาการแจ้งเตือน', placeholder: 'หัวข้อการแจ้งเตือน', keys: ['title', 'by'] },
      status: { key: 'status', options: ['ตั้งเวลาไว้', 'ส่งแล้ว'] },
      filterCols: '3fr 1fr',
      cardTitle: () => 'รายการแจ้งเตือนทั้งหมด',
      rows: () => DB.notifications,
      cols: [
        { label: 'หัวข้อแจ้งเตือน', cell: (r) => esc(r.title) },
        { label: 'สถานะ', cell: (r) => badge(r.status, r.status === 'ตั้งเวลาไว้' ? 'blue' : 'green') },
        { label: 'วันที่ส่ง', cell: (r) => r.at },
        { label: 'ผู้สร้าง', cell: (r) => r.by },
        { label: 'จัดการ', cell: () => `<a data-act="view">ดูรายละเอียด &gt;</a>` },
      ],
      onAction: (act, r) => modal({
        title: r.title,
        body: `<div class="kv-grid c2" style="margin-top:8px">
          <div class="kv"><div class="k">สถานะ</div><div class="v">${badge(r.status, r.status === 'ตั้งเวลาไว้' ? 'blue' : 'green')}</div></div>
          <div class="kv"><div class="k">วันที่ส่ง</div><div class="v">${r.at}</div></div>
          <div class="kv"><div class="k">ผู้สร้าง</div><div class="v">${r.by}</div></div>
          <div class="kv"><div class="k">ช่องทาง</div><div class="v">${esc(r.channels || 'Web, Push Notification')}</div></div></div>
          <p style="margin-top:16px;color:var(--text)">${esc(r.body || 'ข้อความแจ้งเตือนถึงสมาชิกทั้งหมด')}</p>`,
        confirm: 'ปิด', cancel: 'ย้อนกลับ',
      }),
    });
  };

  PAGES.notificationNew = function (root) {
    root.innerHTML = `${pageHead('สร้างการแจ้งเตือนใหม่')}
      <div class="stack">
      <div class="card"><h2 class="card-title" style="margin-bottom:12px">ข้อความแจ้งเตือน</h2><div class="form-grid">
        <div class="field"><label>หัวข้อแจ้งเตือน${req}</label><input class="input" data-title required value="โปรโมชั่นเหล็กเส้นลดราคา 10%"></div>
        <div class="field"><label>เนื้อหาข้อความ${req}</label><textarea class="textarea" data-body required>พิเศษเฉพาะสัปดาห์นี้! เหล็กเส้นกลมทุกขนาดลดราคา 10% ช้อปเลยก่อนของหมด</textarea></div>
        <div class="field"><label>ลิงก์ปลายทาง (ถ้ามี)</label><input class="input" type="url" value="https://thesteel.co.th/promotions/september-sale"></div>
      </div></div>

      <div class="card"><h2 class="card-title" style="margin-bottom:12px">กลุ่มเป้าหมายผู้รับการแจ้งเตือน</h2>
        <label class="option-card on"><input type="radio" name="target" value="all" checked><div><b>ส่งถึงสมาชิกทั้งหมด</b><small>ส่งแจ้งเตือนถึงสมาชิกทุกคนในระบบ (1,840 คน)</small></div></label>
        <label class="option-card"><input type="radio" name="target" value="some"><div><b>เลือกเฉพาะกลุ่มเป้าหมาย</b><small>เลือกส่งเฉพาะระดับสมาชิกที่ต้องการ</small>
          <div data-tiers style="display:none;margin-top:10px;gap:16px;flex-wrap:wrap">${['สมาชิกทั่วไป', 'Silver', 'Gold', 'Platinum'].map((t) => `<label class="check"><input type="checkbox" checked> ${t}</label>`).join('')}</div></div></label>
      </div>

      <div class="card"><h2 class="card-title" style="margin-bottom:12px">ช่องทางการส่งแจ้งเตือน</h2>
        <label class="check-block"><input type="checkbox" data-ch="Web" checked><div><b>Web Notification</b><small>แสดงข้อความแจ้งเตือนบนหน้าเว็บไซต์เมื่อลูกค้าเข้าสู่ระบบ</small></div></label>
        <label class="check-block"><input type="checkbox" data-ch="Push Notification" checked><div><b>Push Notification</b><small>ส่งแจ้งเตือนไปยัง Mobile Application ของลูกค้า</small></div></label>
      </div>

      <div class="card"><h2 class="card-title" style="margin-bottom:12px">กำหนดเวลาส่ง</h2>
        <div class="radio-row"><label><input type="radio" name="when" value="now" checked> ส่งทันที</label><label><input type="radio" name="when" value="later"> กำหนดเวลาส่ง</label></div>
        <div class="form-grid cols-2" data-when style="margin-top:16px;display:none">
          <div class="field"><label>วันที่และเวลาส่ง${req}</label><input class="input" type="datetime-local" data-at></div>
        </div></div>
      </div>
      <div class="form-footer"><a class="btn" href="#/notifications">ยกเลิก</a><button class="btn btn-primary" data-send>ส่งการแจ้งเตือน</button></div>`;

    root.addEventListener('change', (e) => {
      if (e.target.name === 'target') {
        $$('.option-card', root).forEach((c) => c.classList.toggle('on', $('input', c).checked));
        $('[data-tiers]', root).style.display = e.target.value === 'some' ? 'flex' : 'none';
      }
      if (e.target.name === 'when') {
        const later = e.target.value === 'later';
        $('[data-when]', root).style.display = later ? '' : 'none';
        $('[data-at]', root).required = later;
        $('[data-send]', root).textContent = later ? 'ตั้งเวลาส่ง' : 'ส่งการแจ้งเตือน';
      }
    });
    $('[data-send]', root).addEventListener('click', () => {
      if (!validate(root)) return;
      const channels = $$('[data-ch]:checked', root).map((c) => c.dataset.ch);
      if (!channels.length) return toast('กรุณาเลือกช่องทางการส่งอย่างน้อย 1 ช่องทาง', 'warn');
      const later = $('input[name=when]:checked', root).value === 'later';
      const at = later ? nowThaiFrom(new Date($('[data-at]', root).value)) : nowThai();
      DB.notifications.unshift({ title: $('[data-title]', root).value, body: $('[data-body]', root).value, channels: channels.join(', '), status: later ? 'ตั้งเวลาไว้' : 'ส่งแล้ว', at: at.replace(/ (\d\d:\d\d)$/, ' · $1 น.'), by: DB.user.name });
      toast(later ? 'ตั้งเวลาส่งการแจ้งเตือนแล้ว' : 'ส่งการแจ้งเตือนแล้ว');
      location.hash = '#/notifications';
    });
  };
})();
