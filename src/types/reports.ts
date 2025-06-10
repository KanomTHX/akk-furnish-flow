
export interface SalesReport {
  period: string;
  totalSales: number;
  totalAmount: number;
  averagePerSale: number;
}

export interface ProductReport {
  product_name: string;
  product_code: string;
  total_quantity: number;
  total_amount: number;
}

export interface CustomerReport {
  customer_name: string;
  customer_phone: string;
  total_purchases: number;
  last_purchase: string;
}

export interface HirePurchaseReport {
  total_contracts: number;
  total_amount: number;
  active_contracts: number;
  overdue_payments: number;
  collection_rate: number;
}

export type ReportType = 'sales' | 'products' | 'customers' | 'hirePurchase';
export type PeriodType = 'today' | 'thisWeek' | 'thisMonth' | 'thisYear';
