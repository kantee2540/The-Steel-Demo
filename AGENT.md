# AGENT.md — The Steel Prototypes

บันทึกสำหรับคนหรือ AI agent ที่มาทำงานต่อในโปรเจกต์นี้: โครงสร้าง วิธีรัน ลิงก์ Figma และบันทึกการทำงาน

## ลิงก์ Figma

- ไฟล์หลัก: [The Steel](https://www.figma.com/design/ZY7yuUL6N2K6fWAGwfRzUk/The-Steel?node-id=0-1)
- หน้า Pre Sale (ต้นแบบหลักของ 3 ส่วน): [Pre Sale](https://www.figma.com/design/ZY7yuUL6N2K6fWAGwfRzUk/The-Steel?node-id=1263-15264)
  - Section Front End: [1263:15266](https://www.figma.com/design/ZY7yuUL6N2K6fWAGwfRzUk/The-Steel?node-id=1263-15266)
  - Section Mobile: [1263:15267](https://www.figma.com/design/ZY7yuUL6N2K6fWAGwfRzUk/The-Steel?node-id=1263-15267)
  - Section Back Office: [1263:15268](https://www.figma.com/design/ZY7yuUL6N2K6fWAGwfRzUk/The-Steel?node-id=1263-15268)
- หน้า Back Office › Section Total Features (หน้าจอฝั่งหลังบ้านครบชุด): [435:14692](https://www.figma.com/design/ZY7yuUL6N2K6fWAGwfRzUk/The-Steel?node-id=435-14692)

### เฟรมที่ agent สร้างใน Figma

| เฟรม | ลิงก์ | หน้าเว็บที่ตรงกัน |
|---|---|---|
| โปรโมชัน - รายการ (Prototype) | [1515:7251](https://www.figma.com/design/ZY7yuUL6N2K6fWAGwfRzUk/The-Steel?node-id=1515-7251) | `frontend/#/promotions` |
| โปรโมชัน - รายละเอียด (Prototype) | [1515:7342](https://www.figma.com/design/ZY7yuUL6N2K6fWAGwfRzUk/The-Steel?node-id=1515-7342) | `frontend/#/promotions/structural-5` |

ทั้งสองเฟรมอยู่ใน Section Front End แถวเดียวกับเฟรม "โปรโมชัน" (1401:24154) ที่ทีมทำไว้ ชื่อเฟรมลงท้ายด้วย `(Prototype)` เพื่อแยกจากงานของดีไซเนอร์ และไม่ได้แก้เฟรมเดิมของทีม

## โครงสร้างโปรเจกต์

ทั้งหมดเป็น HTML/CSS/JavaScript ล้วน ไม่ต้อง build ใช้ hash routing (`#/...`)

- `index.html` — หน้ารวมลิงก์ไป 3 ต้นแบบ
- `backoffice/` — ระบบหลังบ้าน (เข้าสู่ระบบด้วยอีเมล/รหัสผ่านใดก็ได้)
  - `js/data.js` ข้อมูลตัวอย่าง · `js/app.js` เมนูและ router · `js/dashboard.js` หน้าภาพรวมพร้อมตัวกรอง · `js/pages-*.js` หน้าต่าง ๆ
- `frontend/` — เว็บร้านค้า
  - `js/store.js` ข้อมูลสินค้า/ตะกร้า/โค้ดส่วนลด/คำสั่งซื้อ (เก็บใน localStorage) · `js/app.js` header และ router · `js/pages.js` ทุกหน้า
- `mobile/` — แอปมือถือ (แสดงในกรอบ iPhone เมื่อเปิดบนคอม)
  - `js/store.js` **เป็นสำเนาของ `frontend/js/store.js`** — แก้ไฟล์ใน frontend แล้วคัดลอกมาทับเสมอ

วิธีเปิด: ดับเบิลคลิก `index.html` หรือเปิด `index.html` ของแต่ละโฟลเดอร์

## Repository

- GitHub: `git@github.com:kantee2540/The-Steel-Demo.git` (branch `main`)
- `frontend/` เคยเป็น repo แยก (`hachiiz/TheSteelFrontend`, deploy ที่ thesteelfrontend.vercel.app) ประวัติ git เดิมเก็บไว้ที่ `../TheSteelFrontend-git-backup`

## บันทึกการทำงาน

### 2026-10-01 — หน้าโปรโมชันแยก (Front End) + เฟรม Figma

- หน้าใหม่ `#/promotions` (รายการ) และ `#/promotions/:id` (รายละเอียด) ใน `frontend/js/pages.js`
  - แต่ละโปรโมชันมีหัวข้อ คำอธิบาย เงื่อนไข วิธีใช้ และ **โค้ดส่วนลดพร้อมปุ่มคัดลอก** (`UI.copyText` ใน `frontend/js/ui.js` มี fallback สำหรับเปิดแบบ `file://`)
  - ปุ่ม "ใช้โค้ดนี้กับตะกร้า" ใส่โค้ดให้ทันที; การ์ดโปรโมชันบนหน้าแรกและปุ่ม "ดูทั้งหมด" ลิงก์มาหน้าใหม่
- โค้ดส่วนลดใช้ได้จริงในตะกร้า (`COUPONS` และ `totals()` ใน `store.js`):

  | โค้ด | ผล |
  |---|---|
  | `STEEL5K` | ลด 5% เฉพาะหมวดเหล็กโครงสร้าง/รูปพรรณกลวง เมื่อยอดหมวดนั้นครบ 5,000 บาท สูงสุด 2,000 บาท |
  | `FREESHIP` | ค่าจัดส่งฟรี เมื่อที่อยู่จัดส่งอยู่ในกรุงเทพฯ และปริมณฑล |
  | `MEMBER2` | ลด 2% สูงสุด 1,000 บาท ต้องเข้าสู่ระบบ |
  | `LIFT5` | ลด 5% ค่าบริการเสริม |
  | `SALE10` | (เดิม) ลด 10% สูงสุด 100 บาท ขั้นต่ำ 1,000 บาท |

  ถ้าใช้โค้ดไม่ได้ ตะกร้าจะบอกเหตุผล เช่น ยอดยังไม่ถึงหรือยังไม่ได้เข้าสู่ระบบ
- รายละเอียดโปรโมชัน เงื่อนไข และโค้ดทั้งหมด **ผู้ทำต้นแบบเขียนขึ้นเอง** ยังไม่ได้รับการยืนยันจากฝ่ายการตลาด
- สร้างเฟรม Figma 2 เฟรม (ดูตารางด้านบน) โดยใช้ header-bar instance และรูปโปรโมชันเดิมของไฟล์ การ์ดสินค้าเป็นสำเนาของ product-card ในหน้าสินค้าทั้งหมด

### งานก่อนหน้า (สรุป)

- สร้างต้นแบบ Back Office 25 หน้าจอจาก Pre Sale แล้วเติมหน้าที่ขาดจาก Back Office › Total Features (สิทธิ์ผู้ใช้ รายงาน นำเข้ารถขนส่ง ฟอร์มต่าง ๆ ลืมรหัสผ่าน)
- สร้างต้นแบบ Front End 12 หน้า และ Mobile 10 หน้า แชร์ข้อมูลร้านค้าเดียวกัน
- Mobile แสดงในกรอบ iPhone บนเดสก์ท็อป
- Front End: แยกหน้าบทความ (`#/articles`), แก้เส้นแถบขั้นตอนสั่งซื้อให้ต่อกัน
- Back Office: หน้าภาพรวมกรองตามช่วงเวลา สาขา และหมวดหมู่ได้ (ข้อมูลจำลองแบบคงที่ใน `dashboard.js`)

## ข้อควรระวัง

- ข้อมูลทั้งหมดเป็นข้อมูลจำลอง ยังไม่มี database หรือ API — ข้อมูลหลังบ้านกับหน้าร้านยังไม่เชื่อมกัน
- ตัวเลขบางจุดใน Figma ไม่ตรงกันเอง (เช่น ยอดรวมคำสั่งซื้อ 8,500 vs 8,559.50, สิทธิ์ 42 vs 25 รายการ) ต้นแบบใช้ค่าที่คำนวณได้จริง
