import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client'; // ใช้ Supabase client จาก integrations
import { ReportType, PeriodType, SalesReport, ProductReport, CustomerReport, HirePurchaseReport } from '@/types/reports'; // นำเข้า Type ที่เกี่ยวข้อง
import { getDateRange } from '@/utils/dateUtils'; // นำเข้าฟังก์ชัน getDateRange

interface UseReportsDataResult {
  salesReport: SalesReport[];
  productReport: ProductReport[];
  customerReport: CustomerReport[];
  hirePurchaseReport: HirePurchaseReport[]; // ต้องเป็น Array ของแต่ละสัญญา
  loading: boolean;
  error: string | null;
  loadReportData: (reportType: ReportType, periodType: PeriodType) => Promise<void>;
}

export const useReportsData = (): UseReportsDataResult => {
  const [salesReport, setSalesReport] = useState<SalesReport[]>([]);
  const [productReport, setProductReport] = useState<ProductReport[]>([]);
  const [customerReport, setCustomerReport] = useState<CustomerReport[]>([]);
  const [hirePurchaseReport, setHirePurchaseReport] = useState<HirePurchaseReport[]>([]); // แก้ตรงนี้ให้เป็น Array
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReportData = useCallback(async (reportType: ReportType, periodType: PeriodType) => {
    setLoading(true);
    setError(null);

    try {
      const { start, end } = getDateRange(periodType);
      console.log(`Fetching ${reportType} report from ${start.toISOString()} to ${end.toISOString()}`);

      switch (reportType) {
        case 'sales':
          // ดึงข้อมูลการขาย (Sales Report)
          const { data: salesData, error: salesError } = await supabase
            .from('cash_sales') // หรือตารางที่คุณใช้เก็บข้อมูลการขาย
            .select('total_amount, sale_date')
            .gte('sale_date', start.toISOString())
            .lte('sale_date', end.toISOString());

          if (salesError) throw salesError;

          // ประมวลผลข้อมูลการขาย
          const salesReportData: SalesReport[] = [];
          const salesByDate: { [key: string]: { totalSales: number; totalAmount: number } } = {};

          salesData.forEach(sale => {
            const date = new Date(sale.sale_date).toLocaleDateString('th-TH'); // ใช้รูปแบบวันที่เดียวกัน
            if (!salesByDate[date]) {
              salesByDate[date] = { totalSales: 0, totalAmount: 0 };
            }
            salesByDate[date].totalSales += 1; // นับเป็น 1 รายการขาย
            salesByDate[date].totalAmount += sale.total_amount;
          });

          for (const date in salesByDate) {
            salesReportData.push({
              period: date,
              totalSales: salesByDate[date].totalSales,
              totalAmount: salesByDate[date].totalAmount,
            });
          }

          setSalesReport(salesReportData);
          break;

        case 'products':
          // ดึงข้อมูลรายงานสินค้า (Product Report)
          const { data: productSalesData, error: productSalesError } = await supabase
            .from('sale_items') // ตารางรายการสินค้าในบิลขาย
            .select('product_id, quantity, unit_price, products(name, code)')
            .filter('sale_id', 'in', supabase.from('cash_sales').select('id').gte('sale_date', start.toISOString()).lte('sale_date', end.toISOString()));

          if (productSalesError) throw productSalesError;

          const productReportMap = new Map<string, { totalQuantity: number; totalRevenue: number; name: string; code: string }>();

          productSalesData.forEach((item: any) => {
            const productId = item.product_id;
            const productName = item.products.name;
            const productCode = item.products.code;
            const quantity = item.quantity;
            const revenue = item.quantity * item.unit_price;

            if (productReportMap.has(productId)) {
              const existing = productReportMap.get(productId)!;
              existing.totalQuantity += quantity;
              existing.totalRevenue += revenue;
            } else {
              productReportMap.set(productId, {
                totalQuantity: quantity,
                totalRevenue: revenue,
                name: productName,
                code: productCode,
              });
            }
          });

          const productReportData: ProductReport[] = Array.from(productReportMap.values()).map(item => ({
            productName: item.name,
            productCode: item.code,
            totalQuantitySold: item.totalQuantity,
            totalRevenue: item.totalRevenue,
          })).sort((a, b) => b.totalRevenue - a.totalRevenue); // เรียงตามรายได้มากสุด

          setProductReport(productReportData);
          break;

        case 'customers':
          // ดึงข้อมูลรายงานลูกค้า (Customer Report)
          const { data: customerSalesData, error: customerSalesError } = await supabase
            .from('cash_sales')
            .select('customer_id, total_amount, customers(name, phone)')
            .gte('sale_date', start.toISOString())
            .lte('sale_date', end.toISOString());

          if (customerSalesError) throw customerSalesError;

          const customerReportMap = new Map<string, { totalPurchases: number; totalAmountSpent: number; customerName: string; customerPhone: string }>();

          customerSalesData.forEach((sale: any) => {
            const customerId = sale.customer_id;
            const customerName = sale.customers.name;
            const customerPhone = sale.customers.phone;
            const totalAmount = sale.total_amount;

            if (customerReportMap.has(customerId)) {
              const existing = customerReportMap.get(customerId)!;
              existing.totalPurchases += 1;
              existing.totalAmountSpent += totalAmount;
            } else {
              customerReportMap.set(customerId, {
                totalPurchases: 1,
                totalAmountSpent: totalAmount,
                customerName: customerName,
                customerPhone: customerPhone,
              });
            }
          });

          const customerReportData: CustomerReport[] = Array.from(customerReportMap.values()).map(item => ({
            customerName: item.customerName,
            customerPhone: item.customerPhone,
            totalPurchases: item.totalPurchases,
            totalAmountSpent: item.totalAmountSpent,
          })).sort((a, b) => b.totalAmountSpent - a.totalAmountSpent); // เรียงตามยอดใช้จ่ายมากสุด

          setCustomerReport(customerReportData);
          break;

        case 'hire-purchase': // ใช้ 'hire-purchase' ตาม ReportsManagement.tsx
          // ดึงข้อมูลรายงานเช่าซื้อ (Hire Purchase Report)
          const { data: hpContractsData, error: hpContractsError } = await supabase
            .from('hire_purchase_contracts')
            .select('*, customers(name, phone), products(name, code)')
            .gte('contract_date', start.toISOString())
            .lte('contract_date', end.toISOString());

          if (hpContractsError) throw hpContractsError;

          const hirePurchaseReportData: HirePurchaseReport[] = hpContractsData.map(contract => ({
            contractNumber: contract.contract_number,
            customerName: contract.customers?.name || 'N/A',
            productName: contract.products?.name || 'N/A',
            totalAmount: contract.total_amount,
            downPayment: contract.down_payment,
            monthlyPayment: contract.monthly_payment,
            status: contract.status,
            contractDate: new Date(contract.contract_date).toLocaleDateString('th-TH'),
          }));

          setHirePurchaseReport(hirePurchaseReportData);
          break;

        default:
          console.warn('Unknown report type:', reportType);
          break;
      }
    } catch (err: any) {
      console.error('Error loading report data in useReportsData:', err);
      setError(err.message || 'ไม่สามารถโหลดข้อมูลรายงานได้');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    salesReport,
    productReport,
    customerReport,
    hirePurchaseReport,
    loading,
    error,
    loadReportData,
  };
};