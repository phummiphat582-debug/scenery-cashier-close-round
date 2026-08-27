# Round 0 — Completion Record

อัปเดตล่าสุด: 12 สิงหาคม 2569

เอกสารนี้เป็นบันทึกปิดงานเชิงซอฟต์แวร์ของ Round 0 สำหรับระบบแคชเชียร์และรายงานปิดรอบ ไม่ใช่เอกสารอนุมัติทางบัญชีแทนผู้มีอำนาจ

## งานที่ปิดได้ในโปรเจ็ค

- หน้าปิดรอบดึงเฉพาะ Invoice ที่ Finalized ตาม Business Date
- แสดง Villa/รหัส/ลูกค้า/In–Out, หมวดรายได้ F–P, ยอดรวม Q, Deposit R, คงเหลือ S, ช่องทางชำระเงิน T–AA และหมายเหตุ AB
- ส่งออกปิดรอบเป็น PDF หน้าเดียว A4 Landscape และ Excel-compatible `.xls` จากข้อมูลชุดเดียวกัน
- Submit และ Lock รอบตาม Business Date; หลัง Lock แล้วแก้ไขรายละเอียดปิดรอบ แก้ไข Invoice และลบ Invoice ไม่ได้
- บันทึก Audit Log สำหรับ Submit/Lock, แก้ไขรายละเอียด, แก้ไข Invoice และลบ Invoice พร้อมก่อน/หลังการเปลี่ยนแปลง
- เชื่อม Audit Log และ Close Round กับ Supabase เมื่อมี session ที่ผ่านการยืนยันตัวตน และยังคงมี local fallback สำหรับการทดสอบ
- ไม่แสดงข้อมูลผู้ใช้งาน/ประวัติ/Audit/Dashboard ตัวอย่างเป็นข้อมูลจริงในหน้า production

## กติกาที่ใช้ใน Prototype รอบนี้

1. `Business Date` เป็นวันที่หลักของการกรอง Invoice และวันที่รายงาน
2. `Q` คือยอดสุทธิหลังส่วนลดของ Invoice
3. `R` คือ Deposit ที่บันทึกใน Invoice
4. `S` คือยอดคงเหลือหลังหัก Deposit; `ค้างชำระ` แสดงแยกตามยอดรอเรียกเก็บ
5. Deposit จากรายการสินค้าใช้ช่องทางที่ระบุในรายการนั้น และไม่ถูกหักซ้ำในระดับสรุป
6. `Submit` เปลี่ยนรอบเป็น `Submitted` และถือเป็นการ Lock แบบป้องกันการแก้ไขใน Prototype
7. การแก้ไขหลัง Lock ต้องทำเป็น Adjustment/Refund/Void ในรอบถัดไปเมื่อ Business Rules ได้รับอนุมัติ

## รายการที่ต้องมีผู้รับรองก่อนเริ่ม Round 1

- VAT/ภาษี, การปัดเศษ, เลขเอกสาร และเวลาตัด Business Date
- นิยาม Deposit, Refund, Void และการจัดสรรยอดชำระหลายช่องทาง
- Data Mapping ของ Master Data: ID, Alias, ราคา และรายการที่ยังไม่มีราคา
- สิทธิ์ Submit/Approve/Reject และ retention ของ Audit Log
- การใช้งานจริงของ Supabase project, RLS policy และบัญชีผู้ใช้งาน

เมื่อรายการข้างต้นได้รับการลงนาม/อนุมัติ ให้บันทึกเวอร์ชันกติกาและ mapping ที่อนุมัติไว้ในโฟลเดอร์เดียวกัน แล้วใช้เป็น input ของ Round 1
