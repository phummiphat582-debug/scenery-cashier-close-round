# Supabase setup

ระบบนี้รองรับ 2 โหมด:

- ถ้ายังไม่ตั้งค่า Supabase จะใช้ข้อมูลในเบราว์เซอร์เหมือนเดิม
- ถ้าตั้งค่าแล้ว Invoice, ประวัติ, หลักฐานการปิดยอด และปิดรอบจะบันทึกใน Supabase

## ตั้งค่า

1. สร้างโปรเจกต์ใน Supabase
2. เปิด SQL Editor แล้วรันไฟล์ [supabase-schema.sql](supabase-schema.sql)
3. สร้างผู้ใช้ที่ Authentication > Users โดยใช้อีเมลและรหัสผ่านของพนักงาน
4. เปิดไฟล์ [supabase-config.js](supabase-config.js) แล้วใส่ค่า:

```js
window.SCENERY_SUPABASE_CONFIG = {
  url: 'https://YOUR_PROJECT_REF.supabase.co',
  anonKey: 'YOUR_SUPABASE_ANON_KEY',
  emailDomain: 'your-company.com'
};
```

ถ้าช่องชื่อผู้ใช้เป็นอีเมลอยู่แล้ว ระบบจะใช้ค่านั้นโดยตรง หากกรอกเป็นชื่อสั้น ระบบจะเติม `emailDomain` ให้

## เปิดใช้งาน

ต้องเปิดผ่านเว็บเซิร์ฟเวอร์ ไม่ควรเปิดด้วย `file://` เพราะเบราว์เซอร์จะบล็อกการเรียก API บางส่วน เช่น ใช้คำสั่งนี้ในโฟลเดอร์โปรเจกต์:

```powershell
python -m http.server 8080
```

แล้วเปิด `http://localhost:8080`

เมื่อ Login สำเร็จ ระบบจะดึงข้อมูลจาก Supabase และเปิดการอัปเดตแบบ realtime สำหรับ Invoice และปิดรอบ
