// Shared shop model for the Steel D storefront prototypes (Front End + Mobile).
// Catalog, cart, coupon, add-ons, totals and orders. State persists in localStorage.
(function () {
  const CATEGORIES = [
    { id: 'foundation', name: 'เหล็กเพื่องานฐานราก', desc: 'สำหรับเสริมคอนกรีต ฐานราก เสา คาน', img: 'cat-1.png' },
    { id: 'structural', name: 'เหล็กเพื่องานโครงสร้าง', desc: 'สำหรับรับน้ำหนัก โครงหลังคาและอาคาร', img: 'cat-2.png' },
    { id: 'hollow', name: 'เหล็กโครงสร้างรูปพรรณกลวง', desc: 'สำหรับท่อเหล็กสำหรับรั้ว ประตู งานโครง', img: 'cat-3.png' },
    { id: 'general', name: 'เหล็กอเนกประสงค์', desc: 'แผ่นและแบนเหล็ก ใช้งานได้หลากหลาย', img: 'cat-4.png' },
    { id: 'ready', name: 'เหล็กสำเร็จรูป', desc: 'เหล็กปลอก ฟุตติ้ง เสาเอ็น พร้อมใช้', img: 'cat-5.png' },
  ];

  const TUBE_SIZES = ['25x25', '32x32', '34x34', '36x36', '38x38', '40x40'];
  const TUBE_PRICES = { '25x25': 1200, '32x32': 1850, '34x34': 2000, '36x36': 2200, '38x38': 2400, '40x40': 3200 };
  const TUBE_STOCK = { '25x25': 25, '32x32': 10, '34x34': 18, '36x36': 12, '38x38': 0, '40x40': 8 };
  const TUBE_SPEC = {
    '25x25': ['SS400', 'มอก. 107-2533'], '32x32': ['SS400', 'มอก. 107-2533'], '34x34': ['STK400', 'มอก. 107-2533'],
    '36x36': ['STK400', 'JIS G3466'], '38x38': ['Grade B', 'ASTM A500'], '40x40': ['SS400', 'มอก. 107-2533'],
  };

  const DESC_TUBE = 'เหล็กตัวซี มีความคงทน น้ำหนักเบา ขึ้นโครงง่ายเมื่อเทียบกับงานคอนกรีต ทำให้ช่วยย่นระยะเวลาทำงานได้ดี และควบคุมน้ำหนักตัวโครงสร้างได้ดียิ่งขึ้น จึงนิยมใช้ในงานโครงสร้างและการนำไปใช้งานในที่สูง ไม่ว่าจะเป็นโครงหลังคาตามบ้านเรือน อาคารต่าง ๆ โครงสร้างของอาคาร ที่อยู่อาศัย โครงสร้างสะพาน แปหลังคา หรือนำมาใช้เป็นเหล็กโครงสร้างรองประเภทเสริม ค้ำยัน อีกทั้งนำมาใช้ทดแทนไม้เนื้อแข็งเนื่องจากมีคุณสมบัติที่คล้ายคลึงกันได้ นอกจากนี้ยังสามารถนำมาใช้กับงานตกแต่งได้ ทั้งนี้ควรเลือกใช้เหล็กตัวซีที่ได้รับมาตรฐาน มอก. เพื่อความแข็งแรง และความปลอดภัยในงานก่อสร้าง';

  const PRODUCTS = [
    ...TUBE_SIZES.map((s) => ({
      id: 'tube-' + s.split('x')[0], family: 'tube', size: s, side: +s.split('x')[0],
      name: `ท่อเหล็กรูปสี่เหลี่ยมจัตุรัส มอก. ${s}`, sku: `TSL-SQ${s.replace('x', '')}`, cat: 'hollow', type: 'ท่อเหล็กรูปสี่เหลี่ยม',
      img: 'p-tube.png', price: TUBE_PRICES[s], stock: TUBE_STOCK[s], tags: ['โครงสร้างทั่วไป', 'งานตกแต่งทั่วไป'],
      thicknesses: [1.6, 2, 2.3, 3.2], grade: TUBE_SPEC[s][0], standard: TUBE_SPEC[s][1], process: 'ขึ้นรูปเย็น', finish: 'เหล็กดำ',
      coating: 'ผิวดำไม่เคลือบ', unit: '6 เมตร/เส้น', use: 'งานโครงสร้างทั่วไป', desc: DESC_TUBE,
    })),
    { id: 'c-channel', name: 'เหล็กตัวซีมีขอบ 2.3 มม. มอก. ขนาด 150 x 50 x 20 มม.', sku: 'TSL-CC1505020', cat: 'structural', type: 'เหล็กตัวซี', img: 'p-cchannel.png', price: 600, stock: 120, tags: ['งานแปหลังคา', 'งานประกอบทั่วไป'], thicknesses: [2.3], kgm: 5.5 },
    { id: 'flat-bar', name: 'เหล็กแบน ขนาด 25 x 3 มม. ยาว 6 เมตร', sku: 'TSL-FB2503', cat: 'general', type: 'เหล็กแบน', img: 'p-flatbar.png', price: 1200, stock: 80, tags: ['งานเชื่อมทำเหล็กดัด', 'งานฝาท่อ'], thicknesses: [3], kgm: 0.59 },
    { id: 'i-beam', name: 'เหล็ก I-Beam ขนาด 75 x 150 x 5.5 x 9.5 มม. ยาว 6 เมตร', sku: 'TSL-IB75150', cat: 'structural', type: 'เหล็ก H-Beam', img: 'p-ibeam.png', price: 1200, stock: 40, tags: ['โครงสร้างอาคาร', 'คาน'], thicknesses: [5.5], kgm: 14 },
    { id: 'angle', name: 'เหล็กฉาก 3 มม. มอก. ขนาด 1 1/2 x 1 1/2 นิ้ว', sku: 'TSL-AG3838-30', cat: 'structural', type: 'เหล็กฉาก', img: 'p-angle.png', price: 900, stock: 65, tags: ['โครงสร้างหลังคา'], thicknesses: [3], kgm: 1.77 },
    { id: 'rebar-12', name: 'เหล็กเส้นกลม SR24 ขนาด 12 มม.', sku: 'TSL-RB12', cat: 'foundation', type: 'เหล็กเส้นกลม', img: 'cat-1.png', price: 285, stock: 640, tags: ['งานฐานราก', 'เสา คาน'], thicknesses: [12], kgm: 0.888 },
    { id: 'deformed-16', name: 'เหล็กข้ออ้อย SD40 ขนาด 16 มม.', sku: 'TSL-DB16', cat: 'foundation', type: 'เหล็กข้ออ้อย', img: 'cat-1.png', price: 320, stock: 410, tags: ['งานฐานราก'], thicknesses: [16], kgm: 1.58 },
    { id: 'wire-mesh', name: 'ตะแกรงเหล็กไวร์เมช 4 มม. ช่อง 20x20 ซม.', sku: 'TSL-WM4-20', cat: 'ready', type: 'ไวร์เมช', img: 'cat-5.png', price: 750, stock: 90, tags: ['งานพื้น', 'งานถนน'], thicknesses: [4], kgm: 1.2 },
  ].map((p) => Object.assign({ grade: 'SS400', standard: 'มอก. 107-2533', process: 'รีดร้อน', finish: 'เหล็กดำ', coating: 'ผิวดำไม่เคลือบ', unit: '6 เมตร/เส้น', use: p.tags ? p.tags[0] : '', desc: DESC_TUBE }, p));

  const FEATURED = ['c-channel', 'flat-bar', 'i-beam', 'angle'];

  // Each promotion has a coupon code (see COUPONS) that customers copy and apply in the cart.
  const PROMOS = [
    {
      id: 'structural-5', code: 'STEEL5K', badge: 'ลด 5%', title: 'ซื้อครบ 5,000 บาท ลด 5%', sub: 'สำหรับหมวดเหล็กโครงสร้างทุกประเภท', img: 'promo-1.jpg', start: '1 ก.ย. 2569', end: '30 พ.ย. 2569',
      desc: 'รับส่วนลดทันที 5% เมื่อซื้อสินค้าหมวดเหล็กเพื่องานโครงสร้างและเหล็กโครงสร้างรูปพรรณกลวงครบ 5,000 บาทขึ้นไป เหมาะสำหรับงานโครงหลังคา รั้ว และโครงสร้างอาคาร',
      conditions: ['ยอดซื้อสินค้าในหมวดที่ร่วมรายการรวมกันตั้งแต่ 5,000 บาทขึ้นไป (ไม่รวมค่าจัดส่งและบริการเสริม)', 'ส่วนลดสูงสุด 2,000 บาทต่อคำสั่งซื้อ', 'คิดส่วนลดเฉพาะสินค้าในหมวดเหล็กเพื่องานโครงสร้างและเหล็กโครงสร้างรูปพรรณกลวง', 'ใช้ได้ 1 โค้ดต่อคำสั่งซื้อ ไม่สามารถใช้ร่วมกับโค้ดอื่น'],
      products: ['tube-25', 'tube-32', 'c-channel', 'i-beam', 'angle', 'tube-40'],
    },
    {
      id: 'free-shipping', code: 'FREESHIP', badge: 'ส่งฟรี', title: 'ส่งฟรีไม่มีขั้นต่ำ', sub: 'สำหรับออเดอร์ภายในเขตกรุงเทพฯ และปริมณฑล', img: 'promo-2.jpg', start: '1 ก.ย. 2569', end: '30 พ.ย. 2569',
      desc: 'ไม่ต้องรอสั่งครบยอด จัดส่งฟรีทุกคำสั่งซื้อเมื่อที่อยู่จัดส่งอยู่ในกรุงเทพฯ นนทบุรี ปทุมธานี สมุทรปราการ สมุทรสาคร หรือนครปฐม',
      conditions: ['ที่อยู่จัดส่งต้องอยู่ในเขตกรุงเทพฯ และปริมณฑล (6 จังหวัด)', 'ยกเว้นค่าจัดส่งปกติ ไม่รวมค่าบริการเสริม เช่น คนยกสินค้า', 'จัดส่งภายใน 3–5 วันทำการ', 'ใช้ได้ 1 โค้ดต่อคำสั่งซื้อ'],
      products: ['rebar-12', 'deformed-16', 'wire-mesh', 'flat-bar'],
    },
    {
      id: 'member-2', code: 'MEMBER2', badge: 'สมาชิก', title: 'ส่วนลดเพิ่ม 2% สำหรับสมาชิก', sub: 'สำหรับลูกค้าที่สมัครสมาชิกภายในเดือนนี้', img: 'promo-3.jpg', start: '1 ก.ย. 2569', end: '30 พ.ย. 2569',
      desc: 'สมัครสมาชิกและเข้าสู่ระบบ รับส่วนลดเพิ่ม 2% จากยอดสินค้าทุกชิ้นในตะกร้า ไม่มีขั้นต่ำ',
      conditions: ['ต้องเข้าสู่ระบบด้วยบัญชีสมาชิกก่อนใช้โค้ด', 'ลด 2% จากราคาสินค้า ไม่รวมค่าจัดส่งและบริการเสริม', 'ส่วนลดสูงสุด 1,000 บาทต่อคำสั่งซื้อ', 'ใช้ได้ 1 โค้ดต่อคำสั่งซื้อ'],
      products: ['tube-25', 'rebar-12', 'angle', 'flat-bar'],
    },
    {
      id: 'lifting-5', code: 'LIFT5', badge: 'บริการเสริม', title: 'ส่วนลดบริการยกสินค้า 5%', sub: 'สำหรับลูกค้าที่สมัครสมาชิกภายในเดือนนี้', img: 'promo-4.jpg', start: '1 ก.ย. 2569', end: '30 พ.ย. 2569',
      desc: 'ลด 5% สำหรับบริการเสริมทุกรายการ เช่น คนยกสินค้าและอุปกรณ์ยกสินค้า เลือกบริการได้ในขั้นตอน “บริการเสริม” ระหว่างสั่งซื้อ',
      conditions: ['ลด 5% จากค่าบริการเสริมที่เลือก', 'ส่วนลดจะแสดงเมื่อเลือกบริการเสริมในขั้นตอนที่ 2 ของการสั่งซื้อ', 'ไม่รวมค่าสินค้าและค่าจัดส่ง', 'ใช้ได้ 1 โค้ดต่อคำสั่งซื้อ'],
      products: ['i-beam', 'tube-40', 'deformed-16'],
    },
  ];
  // Articles: body is a list of blocks — ['h', text] heading, ['p', text], ['ul', [items]], ['tip', text], ['table', [head], [[row]...]].
  const ARTICLES = [
    {
      id: 'first-home', title: 'สร้างบ้านครั้งแรกต้องรู้', sub: 'จุดเช็กลิสต์เลือกเหล็กโครงสร้างยังไงให้บ้านไม่ร้าว ไม่ทรุด', img: 'promo-1.jpg',
      topic: 'คู่มือเลือกซื้อ', date: '12 ก.ย. 2569', author: 'ทีมวิศวกร The Steel', read: 6, products: ['rebar-12', 'deformed-16', 'wire-mesh'],
      body: [
        ['p', 'บ้านหลังแรกคือการลงทุนก้อนใหญ่ และโครงสร้างเหล็กเป็นส่วนที่มองไม่เห็นเมื่อบ้านเสร็จ แต่เป็นตัวตัดสินว่าบ้านจะแข็งแรงไปอีกหลายสิบปีหรือไม่ บทความนี้สรุปจุดที่เจ้าของบ้านควรเช็กเองได้ แม้ไม่ใช่วิศวกร'],
        ['h', '1. ตรวจว่าเหล็กตรงตามแบบวิศวกร'],
        ['p', 'แบบโครงสร้างจะระบุชนิดและขนาดเหล็กไว้ชัดเจน เช่น เหล็กเสริมฐานรากใช้เหล็กข้ออ้อย SD40 ขนาด 16 มม. ระยะห่าง 15 ซม. ควรเทียบกับใบส่งของทุกครั้งที่เหล็กเข้าหน้างาน'],
        ['ul', ['เหล็กเส้นกลม (RB) ใช้กับงานปลอกเสา ปลอกคาน', 'เหล็กข้ออ้อย (DB) ใช้เป็นเหล็กยืนในเสา คาน และฐานราก', 'ขนาดและจำนวนเส้นต้องตรงกับแบบ ห้ามลดขนาดเพื่อประหยัด']],
        ['h', '2. ดูตรา มอก. และป้ายบนมัดเหล็ก'],
        ['p', 'เหล็กเส้นที่ได้มาตรฐานจะมีป้ายระบุผู้ผลิต ขนาด ชั้นคุณภาพ และเลข มอก. ติดอยู่ที่มัด เหล็กข้ออ้อยยังมีตัวอักษรนูนบนเนื้อเหล็กด้วย หากไม่มีข้อมูลเหล่านี้ควรสอบถามผู้ขายก่อนรับของ'],
        ['tip', 'ลองชั่งน้ำหนักเหล็กตัวอย่าง 1 เส้นเทียบกับน้ำหนักมาตรฐาน หากเบากว่ามากผิดปกติ อาจเป็นเหล็กที่ขนาดไม่เต็ม'],
        ['h', '3. ระยะหุ้มคอนกรีตและการจัดเก็บ'],
        ['p', 'เหล็กต้องมีคอนกรีตหุ้มตามระยะในแบบ (มักใช้ลูกปูนรองหนุน) เพื่อป้องกันสนิม และควรเก็บเหล็กบนไม้หมอน ไม่วางกับพื้นดินโดยตรง หากมีสนิมขุมลึกหรือเหล็กบิดงอควรเปลี่ยนเส้นใหม่'],
        ['h', 'สรุปเช็กลิสต์'],
        ['ul', ['ชนิดและขนาดตรงตามแบบ', 'มีป้าย มอก. และข้อมูลผู้ผลิต', 'มีลูกปูนรองหนุนครบทุกจุด', 'จัดเก็บเหล็กยกพ้นพื้นและคลุมกันฝน']],
      ],
    },
    {
      id: 'budget-tips', title: 'เคล็ดลับเลือกเหล็กให้คุ้มงบอยู่หมัด', sub: '3 เทคนิคคุมงบและเลือกเหล็กให้งานราบรื่น', img: 'promo-2.jpg',
      topic: 'คู่มือเลือกซื้อ', date: '05 ก.ย. 2569', author: 'ฝ่ายขาย The Steel', read: 4, products: ['tube-25', 'tube-32', 'c-channel'],
      body: [
        ['p', 'งบบานปลายในงานเหล็กส่วนใหญ่ไม่ได้มาจากราคาต่อเส้น แต่มาจากการสั่งผิดขนาด สั่งเกิน และค่าขนส่งซ้ำซ้อน สามเทคนิคนี้ช่วยให้ควบคุมต้นทุนได้ตั้งแต่ก่อนสั่งซื้อ'],
        ['h', 'เทคนิคที่ 1: ถอดปริมาณจากแบบก่อนสั่ง'],
        ['p', 'คำนวณความยาวรวมของเหล็กแต่ละขนาด แล้วหารด้วยความยาวมาตรฐาน 6 เมตร เผื่อเศษตัดประมาณ 5–10% จะได้จำนวนเส้นที่ใกล้เคียงความจริงที่สุด'],
        ['table', ['รายการ', 'ความยาวรวม (ม.)', 'จำนวนเส้น (6 ม.)', 'เผื่อเศษ 8%'], [['ท่อเหล็ก 25x25', '84', '14', '16'], ['ท่อเหล็ก 32x32', '45', '8', '9'], ['เหล็กตัวซี', '120', '20', '22']]],
        ['h', 'เทคนิคที่ 2: เลือกความหนาให้เหมาะกับงาน'],
        ['p', 'งานรั้วหรือโครงตกแต่งที่ไม่รับน้ำหนักมาก อาจใช้ท่อหนา 1.6 มม. ได้ ขณะที่งานโครงหลังคาควรใช้ตามที่วิศวกรกำหนด การเลือกหนาเกินจำเป็นทำให้ทั้งราคาและน้ำหนักขนส่งสูงขึ้น'],
        ['h', 'เทคนิคที่ 3: รวมออเดอร์เพื่อประหยัดค่าส่ง'],
        ['p', 'ค่าขนส่งคิดตามน้ำหนักรวมและระยะทาง การสั่งครั้งเดียวให้ครบตามงวดงานช่วยลดจำนวนเที่ยวรถ และคำสั่งซื้อตั้งแต่ 10,000 บาทในเขตกรุงเทพฯ และปริมณฑลจัดส่งฟรี'],
        ['tip', 'ใช้ปุ่ม “เปรียบเทียบ” บนหน้าสินค้า เพื่อดูราคา เกรด และมาตรฐานของหลายขนาดพร้อมกันก่อนตัดสินใจ'],
      ],
    },
    {
      id: 'steel-grades', title: 'เหล็กแต่ละเกรดต่างกันยังไง', sub: 'เหล็กหน้าตาเหมือนกันแต่อาจมีความลับบางอย่างซ่อนอยู่', img: 'promo-3.jpg',
      topic: 'ความรู้เรื่องเหล็ก', date: '28 ส.ค. 2569', author: 'ทีมวิศวกร The Steel', read: 5, products: ['tube-34', 'tube-38', 'i-beam'],
      body: [
        ['p', 'เหล็กสองเส้นที่ขนาดเท่ากันอาจรับแรงได้ไม่เท่ากัน เพราะผลิตตามเกรดหรือมาตรฐานต่างกัน การรู้จักชื่อเกรดที่พบบ่อยช่วยให้อ่านใบเสนอราคาและแบบก่อสร้างได้เข้าใจขึ้น'],
        ['h', 'เกรดที่พบบ่อยในงานก่อสร้าง'],
        ['table', ['เกรด', 'ใช้กับ', 'มาตรฐานอ้างอิง'], [['SR24', 'เหล็กเส้นกลม งานปลอก', 'มอก. 20'], ['SD40', 'เหล็กข้ออ้อย งานเสา คาน ฐานราก', 'มอก. 24'], ['SS400', 'เหล็กรูปพรรณทั่วไป', 'JIS G3101'], ['STKR400', 'ท่อเหล็กสี่เหลี่ยมงานโครงสร้าง', 'JIS G3466'], ['Grade B', 'ท่อโครงสร้างขึ้นรูปเย็น', 'ASTM A500']]],
        ['h', 'ตัวเลขในชื่อเกรดบอกอะไร'],
        ['p', 'ตัวเลขมักบอกกำลังของเหล็ก เช่น SD40 หมายถึงเหล็กข้ออ้อยที่มีกำลังจุดคราก 4,000 กก./ตร.ซม. ส่วน SS400 หมายถึงกำลังดึงประมาณ 400 MPa ยิ่งตัวเลขสูง เหล็กยิ่งรับแรงได้มากขึ้น'],
        ['tip', 'อย่าเปลี่ยนเกรดเองหน้างาน แม้เกรดสูงกว่าจะแข็งแรงกว่า แต่การเปลี่ยนเกรดควรผ่านการตรวจสอบของวิศวกรผู้ออกแบบเสมอ'],
        ['h', 'ตรวจสอบเกรดอย่างไร'],
        ['ul', ['ดูป้ายที่มัดเหล็กหรือใบรับรองคุณภาพ (Mill Certificate)', 'ตรวจตัวอักษรนูนบนเหล็กข้ออ้อย', 'ดูข้อมูลเกรดและมาตรฐานในหน้ารายละเอียดสินค้าบนเว็บไซต์']],
      ],
    },
    {
      id: 'structural-shapes', title: 'เหล็กรูปพรรณต่างกันยังไง?', sub: 'หลายคนมักสับสนระหว่างเหล็ก H-Beam, I-Beam ว่าควรใช้อะไรกับงานแบบไหน', img: 'promo-4.jpg',
      topic: 'ความรู้เรื่องเหล็ก', date: '20 ส.ค. 2569', author: 'ทีมวิศวกร The Steel', read: 5, products: ['i-beam', 'angle', 'c-channel'],
      body: [
        ['p', 'เหล็กรูปพรรณคือเหล็กที่ขึ้นรูปเป็นหน้าตัดต่าง ๆ เพื่อรับน้ำหนักในงานโครงสร้าง รูปทรงของหน้าตัดเป็นตัวกำหนดว่าเหล็กแต่ละแบบเหมาะกับงานแบบไหน'],
        ['h', 'H-Beam กับ I-Beam'],
        ['p', 'ทั้งสองแบบมีหน้าตัดคล้ายตัว H แต่ H-Beam มีปีกกว้างและหนาเท่ากันตลอด จึงรับแรงได้ดีทั้งสองทิศทาง นิยมใช้เป็นเสาและคานหลัก ส่วน I-Beam มีปีกแคบกว่าและมักเรียวลงที่ขอบ เหมาะกับงานคานที่รับแรงในแนวดิ่งเป็นหลัก เช่น คานรางเครน'],
        ['h', 'เหล็กรูปพรรณแบบอื่นที่ควรรู้จัก'],
        ['table', ['ชนิด', 'ลักษณะ', 'งานที่เหมาะ'], [['เหล็กตัวซี (C-Channel)', 'หน้าตัดรูปตัว C ขึ้นรูปเย็น', 'แปหลังคา โครงเบา'], ['เหล็กฉาก (Angle)', 'หน้าตัดรูปตัว L', 'โครงถัก ค้ำยัน ขาตั้ง'], ['ท่อเหล็กสี่เหลี่ยม', 'หน้าตัดกลวงปิด', 'รั้ว ประตู โครงหลังคา'], ['เหล็กแบน', 'แผ่นแบนหน้าตัดสี่เหลี่ยม', 'งานเชื่อม ตกแต่ง เหล็กดัด']]],
        ['tip', 'งานโครงสร้างหลัก เช่น เสาและคานรับพื้น ควรเลือกชนิดและขนาดตามที่วิศวกรคำนวณ ไม่ควรใช้ความเคยชินหน้างานแทน'],
      ],
    },
    {
      id: 'rust-care', title: 'ดูแลเหล็กอย่างไรไม่ให้เป็นสนิม', sub: 'วิธีจัดเก็บและป้องกันสนิมตั้งแต่รับของจนติดตั้งเสร็จ', img: 'hero.jpg',
      topic: 'งานก่อสร้าง', date: '14 ส.ค. 2569', author: 'ทีมคลังสินค้า The Steel', read: 4, products: ['tube-25', 'flat-bar', 'angle'],
      body: [
        ['p', 'สนิมทำให้เหล็กสูญเสียเนื้อและกำลัง โดยเฉพาะเหล็กผิวดำที่ไม่ได้เคลือบ การดูแลตั้งแต่วันที่รับของช่วยยืดอายุงานได้มาก'],
        ['h', 'การจัดเก็บหน้างาน'],
        ['ul', ['วางเหล็กบนไม้หมอนให้สูงจากพื้นอย่างน้อย 15 ซม.', 'คลุมผ้าใบกันฝนแต่เปิดให้อากาศถ่ายเท', 'แยกกองตามขนาดเพื่อลดการขนย้ายซ้ำ']],
        ['h', 'การป้องกันหลังติดตั้ง'],
        ['p', 'ทำความสะอาดผิวเหล็ก ขัดสนิมผิว แล้วทาสีรองพื้นกันสนิมก่อนทาสีจริง สำหรับงานภายนอกหรือใกล้ทะเล ควรพิจารณาเหล็กชุบสังกะสีตั้งแต่แรก'],
        ['tip', 'สนิมผิวบาง ๆ สีส้มเป็นเรื่องปกติของเหล็กดำ ขัดออกได้ แต่หากเป็นสนิมขุมลึกหรือหลุดเป็นแผ่น ควรเปลี่ยนเหล็กเส้นนั้น'],
      ],
    },
    {
      id: 'tube-weight', title: 'คำนวณน้ำหนักท่อเหล็กด้วยตัวเอง', sub: 'สูตรง่าย ๆ สำหรับประเมินน้ำหนักและค่าขนส่งก่อนสั่งซื้อ', img: 'p-tube.png',
      topic: 'ความรู้เรื่องเหล็ก', date: '02 ส.ค. 2569', author: 'ทีมวิศวกร The Steel', read: 3, products: ['tube-25', 'tube-32', 'tube-40'],
      body: [
        ['p', 'การรู้น้ำหนักเหล็กช่วยให้ประเมินค่าขนส่งและเลือกขนาดรถได้ถูกต้อง สำหรับท่อเหล็กสี่เหลี่ยมจัตุรัสสามารถคำนวณคร่าว ๆ ได้จากขนาดและความหนา'],
        ['h', 'สูตรคำนวณ'],
        ['p', 'น้ำหนัก (กก./ม.) ≈ [ด้าน² − (ด้าน − 2 × ความหนา)²] × 0.00785 โดยใช้หน่วยมิลลิเมตร เช่น ท่อ 25x25 หนา 1.6 มม. จะได้ประมาณ 1.18 กก./ม. หรือราว 7 กก. ต่อเส้นยาว 6 เมตร'],
        ['table', ['ขนาด', 'หนา 1.6 มม.', 'หนา 2.3 มม.', 'หนา 3.2 มม.'], [['25x25', '1.18', '1.64', '2.19'], ['32x32', '1.53', '2.15', '2.89'], ['40x40', '1.93', '2.72', '3.70']]],
        ['tip', 'ตัวเลขข้างต้นเป็นค่าโดยประมาณ (กก./ม.) น้ำหนักจริงอาจต่างเล็กน้อยตามมุมโค้งของท่อและพิกัดการผลิต'],
      ],
    },
  ];

  // type: 'pct' = % off products (optionally only some categories), 'ship' = free shipping, 'addon' = % off add-on services.
  const COUPONS = {
    SALE10: { label: 'ส่วนลด 10% สูงสุด 100.00 บาท', type: 'pct', min: 1000, pct: 0.1, max: 100, until: '30 ธันวาคม 2569' },
    STEEL5K: { label: 'ลด 5% หมวดเหล็กโครงสร้าง สูงสุด 2,000 บาท', type: 'pct', min: 5000, pct: 0.05, max: 2000, cats: ['structural', 'hollow'], until: '30 พฤศจิกายน 2569' },
    FREESHIP: { label: 'ส่งฟรีในเขตกรุงเทพฯ และปริมณฑล', type: 'ship', min: 0, until: '30 พฤศจิกายน 2569' },
    MEMBER2: { label: 'สมาชิกลดเพิ่ม 2% สูงสุด 1,000 บาท', type: 'pct', min: 0, pct: 0.02, max: 1000, member: true, until: '30 พฤศจิกายน 2569' },
    LIFT5: { label: 'ลด 5% ค่าบริการเสริม', type: 'addon', min: 0, pct: 0.05, until: '30 พฤศจิกายน 2569' },
  };
  const METRO = ['กรุงเทพ', 'นนทบุรี', 'ปทุมธานี', 'สมุทรปราการ', 'สมุทรสาคร', 'นครปฐม'];
  const ADDON_PRICES = { porter: 200, equip1: 450, equip2: 600 };
  const FEE_RATE = 0.07;
  const ORDER_STATUSES = ['รอดำเนินการ', 'กำลังจัดเตรียมสินค้า', 'เตรียมสินค้าแล้ว', 'กำลังจัดส่ง', 'สำเร็จ'];

  const USER = { name: 'สตีล ซื้อเหล็ก', phone: '081-234-5678', email: 'mrSteel@hotmail.com' };

  function seed() {
    return {
      user: null,
      cart: [
        { pid: 'tube-25', t: 1.6, qty: 3, sel: true },
        { pid: 'tube-32', t: 2.3, qty: 2, sel: true },
        { pid: 'tube-38', t: 2.3, qty: 1, sel: false },
      ],
      coupon: 'SALE10',
      compare: [],
      fav: ['c-channel'],
      recipients: [
        { name: 'คุณ สตีล ซื้อเหล็ก1', phone: '081-234-5678', email: 'mrSteel1@hotmail.com' },
        { name: 'คุณ สตีล ซื้อเหล็ก2', phone: '081-234-5678', email: 'mrSteel2@hotmail.com' },
      ],
      addresses: [
        { title: 'บ้านเลขที่ 123 ถ.สุขุมวิท 45', full: 'บ้านเลขที่ 123 ถ.สุขุมวิท 45 เขตคลองเตย กรุงเทพมหานคร 10110' },
        { title: 'อาคารสำนักงาน 456 ถ.รัชดาภิเษก', full: 'อาคารสำนักงาน 456 ถ.รัชดาภิเษก เขตดินแดง กรุงเทพมหานคร 10400' },
      ],
      taxes: [
        { name: 'บริษัท สตีล1 จำกัด', taxId: '0-1055-61234-56-7' },
        { name: 'คุณ สตีล ซื้อเหล็ก2', taxId: '3-1001-00456-78-9' },
      ],
      checkout: { recipient: 0, address: 0, taxWanted: true, tax: 0, addonsWanted: true, porter: true, porterQty: 2, equip: true, equip1: true, equip2: false, method: 'card' },
      orders: [demoOrder()],
      quotes: [{ id: 'QT-20260905-0007', date: '5 กันยายน 2569', email: 'mrSteel@hotmail.com', status: 'ส่งใบเสนอราคาแล้ว', total: 5590,
        items: [{ name: 'ท่อเหล็กรูปสี่เหลี่ยมจัตุรัส มอก. 34x34', qty: 2, price: 2000 }, { name: 'เหล็กฉาก 3 มม. มอก. ขนาด 1 1/2 x 1 1/2 นิ้ว', qty: 1, price: 900 }] }],
    };
  }

  function demoOrder() {
    const items = [
      { pid: 'tube-25', name: 'ท่อเหล็กรูปสี่เหลี่ยมจัตุรัส มอก. 25x25', t: 1.6, qty: 3, price: 1200, kg: 3.36, img: 'p-tube.png', grade: 'SS400', standard: 'มอก. 107-2533' },
      { pid: 'tube-32', name: 'ท่อเหล็กรูปสี่เหลี่ยมจัตุรัส มอก. 32x32', t: 2.3, qty: 2, price: 1850, kg: 4.08, img: 'p-tube.png', grade: 'STK400', standard: 'JIS G3466' },
    ];
    return {
      id: 'ORD-20260911-0042', date: '11 กันยายน 2569', method: 'บัตรเครดิต/เดบิต', status: 'สำเร็จ', items,
      totals: { subtotal: 7300, discount: 100, shipping: 450, addons: 850, fee: 59.5, total: 8559.5, weight: 77.4, count: 2 },
      recipient: { name: 'คุณ สตีล ซื้อเหล็ก1', phone: '081-234-5678', email: 'mrSteel1@hotmail.com' },
      address: 'บ้านเลขที่ 123 ถ.สุขุมวิท 45 เขตคลองเตย กรุงเทพมหานคร 10110',
      vehicle: { plate: '7ฒก-1234 กรุงเทพมหานคร', type: 'รถบรรทุก 6 ล้อ', capacity: 5000, appointment: '15 กันยายน 2569' },
      timeline: [
        ['สำเร็จ', '15 กันยายน 2569 • 10:30 น.'], ['กำลังจัดส่ง', '13 กันยายน 2569 • 08:00 น.'], ['เตรียมสินค้าแล้ว', '12 กันยายน 2569 • 14:00 น.'],
        ['กำลังจัดเตรียมสินค้า', '11 กันยายน 2569 • 16:30 น.'], ['รอดำเนินการ', '11 กันยายน 2569 • 09:00 น.'],
      ],
    };
  }

  const KEY = 'easy-steel-shop-v1';
  let state;
  try { state = JSON.parse(localStorage.getItem(KEY)) || seed(); } catch { state = seed(); }
  if (!state.quotes) state.quotes = seed().quotes; // saved before quotes existed
  const listeners = new Set();
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
    listeners.forEach((fn) => fn(state));
  }

  const product = (id) => PRODUCTS.find((p) => p.id === id);
  const category = (id) => CATEGORIES.find((c) => c.id === id);

  // Square hollow section geometry: weight (kg/m), area (cm²), inertia (cm⁴), modulus (cm³), radius (cm).
  function tubeSpec(side, t) {
    const a = side, inner = a - 2 * t;
    const areaMm = a * a - inner * inner;
    const I = (a ** 4 - inner ** 4) / 12 / 1e4;
    return { kgm: areaMm * 7.85e-3, area: areaMm / 100, I, Z: I / (a / 20), r: Math.sqrt(I / (areaMm / 100)) };
  }
  function kgPerM(p, t) { return p.family === 'tube' ? tubeSpec(p.side, t).kgm : p.kgm; }

  function lineInfo(line) {
    const p = product(line.pid);
    const kg = kgPerM(p, line.t) * 6 * line.qty;
    return { p, kg, total: p.price * line.qty, out: p.stock <= 0 };
  }

  function totals(s = state) {
    const lines = s.cart.filter((l) => l.sel && product(l.pid).stock > 0);
    const subtotal = lines.reduce((a, l) => a + product(l.pid).price * l.qty, 0);
    const weight = lines.reduce((a, l) => a + lineInfo(l).kg, 0);
    const k = s.checkout;
    const baseShipping = lines.length ? (subtotal >= 10000 ? 0 : 450) : 0;
    const addonLines = [];
    if (k.addonsWanted) {
      if (k.porter && k.porterQty > 0) addonLines.push(['คนยกสินค้า', ADDON_PRICES.porter, k.porterQty]);
      if (k.equip && k.equip1) addonLines.push(['อุปกรณ์ยกสินค้า 1', ADDON_PRICES.equip1, 1]);
      if (k.equip && k.equip2) addonLines.push(['อุปกรณ์ยกสินค้า 2', ADDON_PRICES.equip2, 1]);
    }
    const addons = addonLines.reduce((a, [, p, q]) => a + p * q, 0);

    // Coupon: work out what it applies to, and why it doesn't when it can't be used.
    const c = s.coupon && COUPONS[s.coupon];
    let discount = 0, addonDiscount = 0, shipping = baseShipping, couponNote = '';
    if (c) {
      const eligible = c.cats ? lines.filter((l) => c.cats.includes(product(l.pid).cat)).reduce((a, l) => a + product(l.pid).price * l.qty, 0) : subtotal;
      const address = (s.addresses[k.address] || {}).full || '';
      if (c.member && !s.user) couponNote = 'ต้องเข้าสู่ระบบสมาชิกก่อนใช้โค้ดนี้';
      else if (eligible < c.min) couponNote = c.cats ? `ซื้อสินค้าในหมวดที่ร่วมรายการอีก ${(c.min - eligible).toLocaleString('en-US')} บาท เพื่อใช้โค้ดนี้` : 'ยอดสั่งซื้อยังไม่ถึงขั้นต่ำ';
      else if (c.type === 'pct') discount = Math.min(c.max, Math.round(eligible * c.pct * 100) / 100);
      else if (c.type === 'ship') { if (METRO.some((m) => address.includes(m))) shipping = 0; else couponNote = 'ที่อยู่จัดส่งอยู่นอกเขตกรุงเทพฯ และปริมณฑล'; }
      else if (c.type === 'addon') { addonDiscount = Math.round(addons * c.pct * 100) / 100; if (!addons) couponNote = 'ส่วนลดจะใช้เมื่อเลือกบริการเสริมในขั้นตอนถัดไป'; }
    }
    const netAddons = addons - addonDiscount;
    const fee = Math.round(netAddons * FEE_RATE * 100) / 100;
    return { lines, count: lines.length, subtotal, weight, discount, shipping, baseShipping, addonLines, addons, addonDiscount, fee, couponNote,
      beforeAddons: subtotal - discount + shipping, total: subtotal - discount + shipping + netAddons + fee };
  }

  const actions = {
    login(name) { state.user = Object.assign({}, USER, name ? { name } : {}); save(); },
    logout() { state.user = null; save(); },
    addToCart(pid, t, qty) {
      const ex = state.cart.find((l) => l.pid === pid && l.t === t);
      if (ex) ex.qty += qty; else state.cart.unshift({ pid, t, qty, sel: true });
      save();
    },
    setQty(i, qty) { const l = state.cart[i]; l.qty = Math.max(1, Math.min(qty, product(l.pid).stock || 1)); save(); },
    toggleSel(i) { state.cart[i].sel = !state.cart[i].sel; save(); },
    selectAll() { const all = state.cart.filter((l) => product(l.pid).stock > 0).every((l) => l.sel); state.cart.forEach((l) => { if (product(l.pid).stock > 0) l.sel = !all; }); save(); },
    removeLine(i) { state.cart.splice(i, 1); save(); },
    clearCart() { state.cart = []; save(); },
    applyCoupon(code) { code = (code || '').trim().toUpperCase(); if (!COUPONS[code]) return false; state.coupon = code; save(); return true; },
    removeCoupon() { state.coupon = null; save(); },
    toggleCompare(pid) {
      const i = state.compare.indexOf(pid);
      if (i >= 0) state.compare.splice(i, 1);
      else { if (state.compare.length >= 4) return 'full'; state.compare.push(pid); }
      save(); return i >= 0 ? 'removed' : 'added';
    },
    clearCompare() { state.compare = []; save(); },
    toggleFav(pid) { const i = state.fav.indexOf(pid); i >= 0 ? state.fav.splice(i, 1) : state.fav.push(pid); save(); return i < 0; },
    setCheckout(patch) { Object.assign(state.checkout, patch); save(); },
    addRecipient(r) { state.recipients.push(r); state.checkout.recipient = state.recipients.length - 1; save(); },
    addAddress(a) { state.addresses.push(a); state.checkout.address = state.addresses.length - 1; save(); },
    addTax(t) { state.taxes.push(t); state.checkout.tax = state.taxes.length - 1; save(); },
    placeOrder(method) {
      const t = totals();
      const now = new Date();
      const p = (n) => String(n).padStart(2, '0');
      const id = `ORD-${now.getFullYear()}${p(now.getMonth() + 1)}${p(now.getDate())}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
      const k = state.checkout;
      const order = {
        id, date: thaiDate(now), method: method === 'qr' ? 'โมบายแบงก์กิ้ง (QR PromptPay)' : 'บัตรเครดิต/เดบิต', status: 'รอดำเนินการ',
        items: t.lines.map((l) => { const i = lineInfo(l); return { pid: l.pid, name: i.p.name, t: l.t, qty: l.qty, price: i.p.price, kg: +i.kg.toFixed(2), img: i.p.img, grade: i.p.grade, standard: i.p.standard }; }),
        totals: { subtotal: t.subtotal, discount: t.discount + t.addonDiscount, shipping: t.shipping, addons: t.addons, fee: t.fee, total: t.total, weight: +t.weight.toFixed(2), count: t.count },
        recipient: state.recipients[k.recipient], address: state.addresses[k.address].full, tax: k.taxWanted ? state.taxes[k.tax] : null,
        vehicle: { plate: 'รอจัดสรรรถ', type: t.weight > 1000 ? 'รถบรรทุก 10 ล้อ' : 'รถบรรทุก 6 ล้อ', capacity: t.weight > 1000 ? 15000 : 5000, appointment: 'รอยืนยัน' },
        timeline: [['รอดำเนินการ', `${thaiDate(now)} • ${p(now.getHours())}:${p(now.getMinutes())} น.`]],
      };
      state.orders.unshift(order);
      state.cart = state.cart.filter((l) => !t.lines.includes(l));
      save();
      return order;
    },
    // Record a quote request for the currently selected cart lines and add-ons.
    requestQuote(email) {
      const t = totals();
      const now = new Date();
      const p = (n) => String(n).padStart(2, '0');
      const q = {
        id: `QT-${now.getFullYear()}${p(now.getMonth() + 1)}${p(now.getDate())}-${String(state.quotes.length + 1).padStart(4, '0')}`,
        date: thaiDate(now), email, status: 'รอใบเสนอราคา', total: t.total,
        items: t.lines.map((l) => { const i = lineInfo(l); return { name: i.p.name, qty: l.qty, price: i.p.price }; }),
      };
      state.quotes.unshift(q); save();
      return q;
    },
    reorder(id) {
      const o = state.orders.find((x) => x.id === id);
      o.items.forEach((it) => actions.addToCart(it.pid, it.t, it.qty));
    },
    reset() { state = seed(); save(); },
  };

  function thaiDate(d) {
    const m = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
    return `${d.getDate()} ${m[d.getMonth()]} ${d.getFullYear() + 543}`;
  }

  const money = (n) => Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const num = (n, d = 0) => Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  window.SHOP = {
    CATEGORIES, PRODUCTS, FEATURED, PROMOS, ARTICLES, METRO, COUPONS, ADDON_PRICES, ORDER_STATUSES, TUBE_SIZES,
    get state() { return state; }, product, category, tubeSpec, kgPerM, lineInfo, totals, actions,
    onChange: (fn) => listeners.add(fn), money, num, esc,
  };
})();
