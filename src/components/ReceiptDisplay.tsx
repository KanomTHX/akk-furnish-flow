import React from 'react';

// Interfaces ที่จำเป็นสำหรับข้อมูล Product, Customer, SaleItem, Sale
interface Product {
  id: string;
  name: string;
  code: string;
  price: number;
  stock_quantity: number;
  category: string;
  imageUrl?: string;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

interface SaleItem {
  product: Product;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Sale {
    id: string;
    sale_number: string;
    customer_id: string | null;
    sales_person_id: string | null;
    cashier_id: string | null;
    subtotal: number;
    total_amount: number;
    payment_method: string;
    payment_status: string;
    created_at: string;
}

// Props สำหรับคอมโพเนนต์ ReceiptDisplay
interface ReceiptDisplayProps {
  sale: Sale;
  saleItems: SaleItem[];
  customer: Customer | null;
  salesPersonName: string; // ชื่อพนักงานขาย (จะดึงจาก userProfile)
}

const ReceiptDisplay: React.FC<ReceiptDisplayProps> = ({ sale, saleItems, customer, salesPersonName }) => {
  // ฟังก์ชันช่วยในการจัดรูปแบบวันที่ให้เป็น "วัน เดือน ปี" ในรูปแบบไทย
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // ฟังก์ชันแปลงตัวเลขเป็นข้อความภาษาไทย (ตัวอย่างอย่างง่าย)
  // สำหรับการใช้งานจริง ควรใช้ไลบรารีหรือฟังก์ชันที่ครอบคลุมการแปลงตัวเลขจำนวนมาก
  const numberToThaiText = (num: number) => {
    const units = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน", "ล้าน"];
    const digits = ["", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"];

    if (num === 0) return "ศูนย์บาทถ้วน";

    let text = "";
    let value = Math.floor(num);
    let decimal = Math.round((num - value) * 100);

    if (value === 0 && decimal === 0) return "ศูนย์บาทถ้วน";

    let i = 0;
    while (value > 0) {
      let digit = value % 10;
      if (digit !== 0) {
        if (i === 1 && digit === 2) text = "ยี่" + units[i] + text;
        else if (i === 1 && digit === 1) text = "สิบ" + text;
        else if (i === 0 && digit === 1 && value % 100 !== 11 && value % 100 !== 21) text = "เอ็ด" + units[i] + text;
        else text = digits[digit] + units[i] + text;
      }
      value = Math.floor(value / 10);
      i++;
    }

    if (text === "") text = "ศูนย์"; // กรณีมีแค่ทศนิยม

    let decimalText = "";
    if (decimal > 0) {
        let decStr = decimal.toString();
        if (decStr.length === 1) decStr = "0" + decStr; // Ensure two digits for decimal
        decimalText = "สตางค์";
        if (decimal === 1) decimalText = "หนึ่งสตางค์";
        else if (decimal > 1) {
            let j = 0;
            let tempDec = decimal;
            let currentDecText = "";
            while (tempDec > 0) {
                let digit = tempDec % 10;
                if (digit !== 0) {
                    if (j === 1 && digit === 2) currentDecText = "ยี่" + units[j] + currentDecText;
                    else if (j === 1 && digit === 1) currentDecText = "สิบ" + currentDecText;
                    else if (j === 0 && digit === 1 && tempDec % 100 !== 11 && tempDec % 100 !== 21) currentDecText = "เอ็ด" + units[j] + currentDecText;
                    else currentDecText = digits[digit] + units[j] + currentDecText;
                }
                tempDec = Math.floor(tempDec / 10);
                j++;
            }
            decimalText = currentDecText + "สตางค์";
        }
    }
    
    return text + "บาท" + (decimal > 0 ? decimalText : "ถ้วน");
  };


  return (
    <div className="p-8 bg-white border border-gray-300 shadow-lg max-w-2xl mx-auto font-sans text-sm">
      <div className="flex justify-between items-start mb-6">
        <div className="text-center w-full">
          <h1 className="text-xl font-bold mb-2">ใบเสร็จรับเงิน</h1>
          <div className="border-t border-b border-gray-400 py-1">
            <span className="text-lg font-semibold">ต้นฉบับ</span>
          </div>
        </div>
        <div className="text-right">
          <p>สำนักงานใหญ่</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-y-2 mb-6">
        <div>
          {/* ข้อมูลลูกค้า: แสดงชื่อและ ID ลูกค้า หรือ "ลูกค้าทั่วไป" ถ้าไม่ได้เลือก */}
          <p><strong>นามลูกค้า:</strong> {customer ? `${customer.name} / [${customer.id.substring(0, 7)}]` : 'ลูกค้าทั่วไป'}</p>
          {/* ที่อยู่: ใช้ที่อยู่ตัวอย่าง คุณควรเปลี่ยนเป็นที่อยู่จริงของธุรกิจคุณ */}
          <p><strong>ที่อยู่:</strong> 80/1 ม.9 ต.เสาเปรียก อ.พังงา จ.ภูเก็ต 83000</p>
          <p><strong>โทรศัพท์:</strong> {customer?.phone || '-'}</p>
        </div>
        <div className="text-right">
          <p><strong>เลขที่:</strong> {sale.sale_number}</p>
          <p><strong>วันที่:</strong> {formatDate(sale.created_at)}</p>
          {/* เลขที่ผู้เสียภาษี: ใช้ค่าตัวอย่าง คุณควรเปลี่ยนเป็นเลขผู้เสียภาษีจริงของธุรกิจคุณ */}
          <p><strong>เลขที่ผู้เสียภาษี:</strong> 3670200677071</p>
          <p><strong>พนักงานขาย:</strong> {salesPersonName}</p>
        </div>
      </div>

      <table className="w-full border-collapse mb-6">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2 text-left w-1/2">รายการ</th>
            <th className="border p-2 text-center w-1/6">ยอดที่</th>
            <th className="border p-2 text-right w-1/6">ทุนค่า</th>
            <th className="border p-2 text-left w-1/6">ประเภทชำระ</th>
            <th className="border p-2 text-right w-1/6"></th> {/* สำหรับแสดงยอดเงินในคอลัมน์ประเภทชำระตามตัวอย่างใบเสร็จ */}
          </tr>
        </thead>
        <tbody>
          {saleItems.map((item, index) => (
            <tr key={item.product.id}>
              <td className="border p-2 text-left">{item.product.name}</td>
              <td className="border p-2 text-center">{item.quantity}</td>
              <td className="border p-2 text-right">{item.unit_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              {/* ประเภทชำระและยอดรวมจะแสดงเพียงครั้งเดียวในแถวแรกและครอบคลุมหลายแถว (rowSpan) */}
              {index === 0 && (
                <td rowSpan={saleItems.length} className="border p-2 text-center align-top">
                  {sale.payment_method === 'cash' && 'เงินสด(ขาย)'}
                  {sale.payment_method === 'transfer' && 'โอนเงิน'}
                  {sale.payment_method === 'credit_card' && 'บัตรเครดิต'}
                  {sale.payment_method === 'qr_code' && 'QR Code'}
                </td>
              )}
              {index === 0 && (
                 <td rowSpan={saleItems.length} className="border p-2 text-right align-top">
                   {sale.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                 </td>
              )}
            </tr>
          ))}
          <tr>
            <td colSpan={2} className="border p-2 text-right font-bold bg-gray-100">รวม</td>
            <td className="border p-2 text-right font-bold bg-gray-100">{sale.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td colSpan={2} className="border p-2"></td> {/* เซลล์ว่างสำหรับจัดเลย์เอาต์ให้ตรงกับรูปตัวอย่าง */}
          </tr>
        </tbody>
      </table>

      <div className="flex justify-between items-center mb-10">
        <div className="w-1/2 border p-2 bg-gray-100">
          <strong>จำนวนเงินรวม</strong>
        </div>
        <div className="w-1/2 text-right">
          {/* แสดงจำนวนเงินรวมเป็นข้อความภาษาไทย */}
          ({numberToThaiText(sale.total_amount)})
        </div>
      </div>

      <div className="flex justify-between mt-12">
        <div className="text-center w-1/3">
          <p>_________________________</p>
          <p>ผู้รับเงิน</p>
        </div>
        <div className="text-center w-1/3">
          <p>_________________________</p>
          <p>ผู้อนุมัติ/ลงนาม</p>
        </div>
      </div>
    </div>
  );
};

export default ReceiptDisplay;