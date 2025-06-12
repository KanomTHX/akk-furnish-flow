
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SalesReport, ProductReport, CustomerReport, HirePurchaseReport } from '@/types/reports';

export const useReportsData = () => {
  const [salesReport, setSalesReport] = useState<SalesReport[]>([]);
  const [productReport, setProductReport] = useState<ProductReport[]>([]);
  const [customerReport, setCustomerReport] = useState<CustomerReport[]>([]);
  const [hirePurchaseReport, setHirePurchaseReport] = useState<HirePurchaseReport | null>(null);
  const [loading, setLoading] = useState(false);

  const loadSalesReport = async (start: string, end: string) => {
    console.log('Loading sales report for period:', start, 'to', end);
    
    const { data, error } = await supabase
      .from('cash_sales')
      .select('*')
      .gte('sale_date', start)
      .lte('sale_date', end)
      .eq('payment_status', 'completed')
      .order('sale_date');

    if (error) {
      console.error('Sales report error:', error);
      throw error;
    }

    console.log('Sales data:', data);

    const groupedData = data?.reduce((acc: any, sale) => {
      const date = new Date(sale.sale_date).toLocaleDateString('th-TH');
      if (!acc[date]) {
        acc[date] = { totalSales: 0, totalAmount: 0 };
      }
      acc[date].totalSales += 1;
      acc[date].totalAmount += sale.total_amount;
      return acc;
    }, {});

    const reportData: SalesReport[] = Object.entries(groupedData || {}).map(([period, data]: [string, any]) => ({
      period,
      totalSales: data.totalSales,
      totalAmount: data.totalAmount,
      averagePerSale: data.totalAmount / data.totalSales
    }));

    console.log('Processed sales report:', reportData);
    setSalesReport(reportData);
  };

  const loadProductReport = async (start: string, end: string) => {
    console.log('Loading product report for period:', start, 'to', end);
    
    const { data, error } = await supabase
      .from('cash_sale_items')
      .select(`
        quantity,
        total_price,
        product:products(name, code),
        cash_sale:cash_sales!inner(sale_date, payment_status)
      `)
      .gte('cash_sale.sale_date', start)
      .lte('cash_sale.sale_date', end)
      .eq('cash_sale.payment_status', 'completed');

    if (error) {
      console.error('Product report error:', error);
      throw error;
    }

    console.log('Product data:', data);

    interface ProductGroup {
      product_name: string;
      product_code: string;
      total_quantity: number;
      total_amount: number;
    }

    const groupedData = data?.reduce((acc: Record<string, ProductGroup>, item: any) => {
      if (item.product) {
        const productKey = `${item.product.code}-${item.product.name}`;
        if (!acc[productKey]) {
          acc[productKey] = {
            product_name: item.product.name,
            product_code: item.product.code,
            total_quantity: 0,
            total_amount: 0
          };
        }
        acc[productKey].total_quantity += item.quantity;
        acc[productKey].total_amount += item.total_price;
      }
      return acc;
    }, {} as Record<string, ProductGroup>);

    const reportData: ProductReport[] = Object.values(groupedData || {}) as ProductReport[];
    reportData.sort((a, b) => b.total_amount - a.total_amount);

    console.log('Processed product report:', reportData);
    setProductReport(reportData);
  };

  const loadCustomerReport = async (start: string, end: string) => {
    console.log('Loading customer report for period:', start, 'to', end);
    
    const { data, error } = await supabase
      .from('cash_sales')
      .select(`
        total_amount,
        sale_date,
        customer:customers(name, phone)
      `)
      .gte('sale_date', start)
      .lte('sale_date', end)
      .eq('payment_status', 'completed')
      .not('customer_id', 'is', null);

    if (error) {
      console.error('Customer report error:', error);
      throw error;
    }

    console.log('Customer data:', data);

    interface CustomerGroup {
      customer_name: string;
      customer_phone: string;
      total_purchases: number;
      last_purchase: string;
    }

    const groupedData = data?.reduce((acc: Record<string, CustomerGroup>, sale: any) => {
      if (sale.customer) {
        const customerKey = sale.customer.phone;
        if (!acc[customerKey]) {
          acc[customerKey] = {
            customer_name: sale.customer.name,
            customer_phone: sale.customer.phone,
            total_purchases: 0,
            last_purchase: sale.sale_date
          };
        }
        acc[customerKey].total_purchases += sale.total_amount;
        if (new Date(sale.sale_date) > new Date(acc[customerKey].last_purchase)) {
          acc[customerKey].last_purchase = sale.sale_date;
        }
      }
      return acc;
    }, {} as Record<string, CustomerGroup>);

    const reportData: CustomerReport[] = Object.values(groupedData || {}) as CustomerReport[];
    reportData.sort((a, b) => b.total_purchases - a.total_purchases);

    console.log('Processed customer report:', reportData);
    setCustomerReport(reportData);
  };

  const loadHirePurchaseReport = async (start: string, end: string) => {
    console.log('Loading hire purchase report for period:', start, 'to', end);
    
    const { data: contracts, error: contractsError } = await supabase
      .from('hire_purchase_contracts')
      .select('*')
      .gte('contract_date', start)
      .lte('contract_date', end);

    if (contractsError) {
      console.error('Hire purchase contracts error:', contractsError);
      throw contractsError;
    }

    const { data: overduePayments, error: overdueError } = await supabase
      .from('installment_payments')
      .select('*')
      .lt('due_date', new Date().toISOString().split('T')[0])
      .eq('status', 'pending');

    if (overdueError) {
      console.error('Overdue payments error:', overdueError);
      throw overdueError;
    }

    const { data: allPayments, error: paymentsError } = await supabase
      .from('installment_payments')
      .select('*');

    if (paymentsError) {
      console.error('All payments error:', paymentsError);
      throw paymentsError;
    }

    const totalContracts = contracts?.length || 0;
    const totalAmount = contracts?.reduce((sum, contract) => sum + contract.total_amount, 0) || 0;
    const activeContracts = contracts?.filter(c => c.status === 'active').length || 0;
    const overdueCount = overduePayments?.length || 0;
    
    const paidPayments = allPayments?.filter(p => p.status === 'paid').length || 0;
    const totalPayments = allPayments?.length || 0;
    const collectionRate = totalPayments > 0 ? (paidPayments / totalPayments) * 100 : 0;

    const reportData: HirePurchaseReport = {
      total_contracts: totalContracts,
      total_amount: totalAmount,
      active_contracts: activeContracts,
      overdue_payments: overdueCount,
      collection_rate: collectionRate
    };

    console.log('Processed hire purchase report:', reportData);
    setHirePurchaseReport(reportData);
  };

  const loadReportData = async (reportType: string, start: string, end: string) => {
    setLoading(true);
    try {
      console.log('Loading report type:', reportType, 'from', start, 'to', end);
      
      switch (reportType) {
        case 'sales':
          await loadSalesReport(start, end);
          break;
        case 'products':
          await loadProductReport(start, end);
          break;
        case 'customers':
          await loadCustomerReport(start, end);
          break;
        case 'hirePurchase':
          await loadHirePurchaseReport(start, end);
          break;
        default:
          console.log('Unknown report type:', reportType);
      }
    } catch (error) {
      console.error('Error loading report data:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    salesReport,
    productReport,
    customerReport,
    hirePurchaseReport,
    loading,
    loadReportData
  };
};
