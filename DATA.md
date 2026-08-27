# DATA — Master Data

แหล่งข้อมูล: `DATA.xlsx`  
ชีตต้นทาง: `DATA`  
วัตถุประสงค์: Master Data สำหรับ Villa, รายการสินค้า/บริการ, ราคา, Package และ Dropdown ในระบบแคชเชียร์

> ไฟล์ Excel ต้นฉบับยังคงอยู่ในโฟลเดอร์เดิม ไฟล์นี้เป็นฉบับ Markdown สำหรับอ่าน ตรวจสอบ และใช้เป็นเอกสารอ้างอิงของ Web App

## โครงสร้างข้อมูล

| กลุ่ม | คอลัมน์/ช่วง | ความหมาย |
|---|---|---|
| Villa และราคา | `A:D` | Villa, Description, Reference และ Price |
| ตัวเลือกการเข้าพัก | `I:J` | จำนวนคืน และ Extra Bed |
| พนักงาน | `N` | รายชื่อ Receptionist |
| Villa สำหรับ Dropdown | `S:Y` | รหัส/ชื่อ Villa และตัวเลือก Extra Bed |
| รายการบริการ | `Z:AJ` | Complimentary, Package, Food & Beverage, BBQ, Afternoon Tea, เครื่องดื่มและเบเกอรี่, Minibar, Miscellaneous, Souvenir และ Activities |

## หัวคอลัมน์จากไฟล์ต้นฉบับ

| เซลล์ | ค่า |
|---|---|
| `A1` | Villa |
| `B1` | Description |
| `C1` | Reference |
| `D1` | Price |
| `N1` | Receptionist |
| `T1` | BathTub_Deluxe |
| `U1` | Jacuzzi |
| `V1` | BathTub |
| `W1` | Jacuzzi_Deluxe |
| `X1` | Villa |
| `Y1` | Extra_Bed |
| `Z1` | Complimentary |
| `AA1` | Package |
| `AB1` | Food_Beverage |
| `AC1` | BBQ |
| `AD1` | Afternoon_Tea |
| `AE1` | เครื่องดื่มและเบเกอรี่ |
| `AF1` | Minibar |
| `AG1` | Miscellaneous |
| `AH1` | Souvenir |
| `AI1` | Activities |
| `AJ1` | กิจกรรมชมสุนัขที่123ไร่ |

## ตัวอย่าง Master Data

### Villa / ห้องพัก

| Villa | Description | Reference |
|---|---|---|
| 02 Pangola | BathTub_Deluxe | 01 Ruzi Villa |
| 03 Hamata | BathTub_Deluxe | 07 Katahdin Villa |
| 04 Barbados | Jacuzzi | 02 Pangola Villa |
| 05 Merino | Jacuzzi | 03 Hamata Villa |
| 06 Corriedale | Jacuzzi | 08 Mulato Villa |
| 07 Katahdin | Jacuzzi | 010 Napier Villa |
| 08 Mulato | Jacuzzi | 011 Setaria Villa |
| 010 Napier | Jacuzzi | 012 Alfalfa Villa |

### ตัวเลือกการเข้าพักและพนักงาน

| กลุ่ม | ตัวอย่างข้อมูล |
|---|---|
| จำนวนคืน | 1 Night, 2 Night, 3 Night, 4 Night, 5 Night |
| Extra Bed | 1 Extra Bed, 2 Extra Bed, 3 Extra Bed, 4 Extra Bed, 5 Extra Bed |
| Receptionist | Now Narit, Mhew Kusu, Nattaya Phung, Nummim, Ple Theresa |

### Package และอาหาร/เครื่องดื่ม

| หมวด | ตัวอย่างรายการ |
|---|---|
| Complimentary | Happy Birthday Waffle (22), Happy Anniversary Waffle (22), Muesli (22), Yogurt (22), Croissant (22), Milk (22) |
| Package | Thai Food Set (22), Europe Food Set (22), E-Voucher Dinner 600 Baht (22), E-Voucher Dinner 800 Baht (22), E-Voucher Dinner 900 Baht (22), E-Voucher Dinner 1200 Baht (22), BBQ 900 (22), BBQ 1200 (22), HT 900 (23), HT1200 (23) |
| Food & Beverage | Discount 10%, Discount 15%, Discount VIP, Service Charge 10%, Breakfast (À la carte), Breakfast (Set), ค่าส่วนต่าง BBQ เนื้อ, ค่าบริการปรุงสุก |
| BBQ | Chicken Set, Pork Set, Meat Set, German Sausage, Buffalo Wings Set, Vegetable Set, Service Charge 10% |
| Minibar | Trentangeli Rosso Wine, Hennessy, Black Label, Red Label, Gordon's Dry Gin, SMIRNOFF, Paulaner Beer, Bubble Bar |
| Souvenir | โลชั่นลาโนลีน, ชาโรสวนิลา, หมอนรองคอน้องแกะ, ชาถัวดาวอินคา, Welcome Drink |
| Activities | ทริปชมพระอาทิตย์ขึ้น-เขากระโจม, ทริปชมพระอาทิตย์ตก-เขากระโจม, ATV ROUTE 123 CAMP, ATV ROUTE ห้วยคอกหมู, กิจกรรม@The Backyard |

## ข้อควรตรวจสอบก่อนนำเข้า SQL

- ทำความสะอาดช่องว่างท้ายข้อความ เช่น `Food_Beverage ` และกำหนด Alias ภาษาไทย/อังกฤษ
- สร้างรหัสกลาง เช่น `product_id`, `room_id`, `category_id` แทนการใช้ชื่อเป็น Key
- ตรวจรายการที่ไม่มีราคา โดยเฉพาะ Package, Activities, เครื่องดื่ม และชุดผู้ใหญ่/เด็ก
- ราคาใน Markdown นี้เป็นเอกสารอ้างอิงจาก Excel ไม่ควรใช้แทนราคาที่ Backend ยืนยันแล้ว
