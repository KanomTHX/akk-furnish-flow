// src/types/reports.ts
export type ReportType = 'sales' | 'products' | 'customers' | 'hire-purchase';
export type PeriodType = 'today' | 'thisWeek' | 'thisMonth' | 'thisYear';

export interface SalesReport {
  period: string; // เช่น '2023-10-26' หรือ 'สัปดาห์ที่ 43'
  totalSales: number; // จำนวนรายการขาย (เช่น จำนวนบิล)
  totalAmount: number; // ยอดรวมเงินที่ขายได้
  // averagePerSale: number; // สามารถคำนวณใน SalesReportCard ได้
}

export interface ProductReport {
  productName: string;
  productCode: string;
  totalQuantitySold: number;
  totalRevenue: number;
}

export interface CustomerReport {
  customerName: string;
  customerPhone: string;
  totalPurchases: number; // จำนวนครั้งที่ซื้อ
  totalAmountSpent: number; // ยอดเงินที่ใช้จ่ายทั้งหมด
  // last_purchase: string; // ถ้าต้องการใช้ ต้องเพิ่มใน useReportsData ด้วย
}

export interface HirePurchaseReport {
  contractNumber: string;
  customerName: string;
  productName: string;
  totalAmount: number;
  downPayment: number;
  monthlyPayment: number;
  status: string; // เช่น 'active', 'completed', 'overdue'
  contractDate: string; // วันที่ทำสัญญา
}