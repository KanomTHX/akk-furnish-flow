
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BarChart3, PieChart, TrendingUp, Download, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SalesReport {
  period: string;
  totalSales: number;
  totalAmount: number;
  averagePerSale: number;
}

interface ProductReport {
  product_name: string;
  product_code: string;
  total_quantity: number;
  total_amount: number;
}

interface CustomerReport {
  customer_name: string;
  customer_phone: string;
  total_purchases: number;
  last_purchase: string;
}

interface HirePurchaseReport {
  total_contracts: number;
  total_amount: number;
  active_contracts: number;
  overdue_payments: number;
  collection_rate: number;
}

const ReportsManagement: React.FC = () => {
  const { toast } = useToast();
  const [selectedReport, setSelectedReport] = useState('sales');
  const [selectedPeriod, setSelectedPeriod] = useState('thisMonth');
  const [salesReport, setSalesReport] = useState<SalesReport[]>([]);
  const [productReport, setProductReport] = useState<ProductReport[]>([]);
  const [customerReport, setCustomerReport] = useState<CustomerReport[]>([]);
  const [hirePurchaseReport, setHirePurchaseReport] = useState<HirePurchaseReport | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReportData();
  }, [selectedReport, selectedPeriod]);

  const getDateRange = () => {
    const now = new Date();
    let startDate: Date;
    let endDate = new Date();

    switch (selectedPeriod) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'thisWeek':
        const weekStart = now.getDate() - now.getDay();
        startDate = new Date(now.getFullYear(), now.getMonth(), weekStart);
        break;
      case 'thisMonth':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'thisYear':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    };
  };

  const loadReportData = async () => {
    setLoading(true);
    try {
      const { start, end } = getDateRange();

      switch (selectedReport) {
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
      }
    } catch (error: any) {
      toast({
        title: "ข้อผิดพลาด",
        description: error.message || "ไม่สามารถโหลดข้อมูลรายงานได้",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSalesReport = async (start: string, end: string) => {
    const { data, error } = await supabase
      .from('cash_sales')
      .select('*')
      .gte('sale_date', start)
      .lte('sale_date', end)
      .eq('payment_status', 'completed')
      .order('sale_date');

    if (error) throw error;

    // จัดกลุ่มข้อมูลตามวัน
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

    setSalesReport(reportData);
  };

  const loadProductReport = async (start: string, end: string) => {
    const { data, error } = await supabase
      .from('cash_sale_items')
      .select(`
        quantity,
        total_price,
        product:products(name, code),
        cash_sale:cash_sales!inner(sale_date)
      `)
      .gte('cash_sale.sale_date', start)
      .lte('cash_sale.sale_date', end);

    if (error) throw error;

    // จัดกลุ่มข้อมูลตามสินค้า
    const groupedData = data?.reduce((acc: any, item) => {
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
      return acc;
    }, {});

    const reportData: ProductReport[] = Object.values(groupedData || {})
      .sort((a: any, b: any) => b.total_amount - a.total_amount);

    setProductReport(reportData);
  };

  const loadCustomerReport = async (start: string, end: string) => {
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

    if (error) throw error;

    // จัดกลุ่มข้อมูลตามลูกค้า
    const groupedData = data?.reduce((acc: any, sale) => {
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
      return acc;
    }, {});

    const reportData: CustomerReport[] = Object.values(groupedData || {})
      .sort((a: any, b: any) => b.total_purchases - a.total_purchases);

    setCustomerReport(reportData);
  };

  const loadHirePurchaseReport = async (start: string, end: string) => {
    // โหลดข้อมูลสัญญาเช่าซื้อ
    const { data: contracts, error: contractsError } = await supabase
      .from('hire_purchase_contracts')
      .select('*')
      .gte('contract_date', start)
      .lte('contract_date', end);

    if (contractsError) throw contractsError;

    // โหลดข้อมูลการชำระที่เกินกำหนด
    const { data: overduePayments, error: overdueError } = await supabase
      .from('installment_payments')
      .select('*')
      .lt('due_date', new Date().toISOString().split('T')[0])
      .eq('status', 'pending');

    if (overdueError) throw overdueError;

    // โหลดข้อมูลการชำระทั้งหมด
    const { data: allPayments, error: paymentsError } = await supabase
      .from('installment_payments')
      .select('*');

    if (paymentsError) throw paymentsError;

    const totalContracts = contracts?.length || 0;
    const totalAmount = contracts?.reduce((sum, contract) => sum + contract.total_amount, 0) || 0;
    const activeContracts = contracts?.filter(c => c.status === 'active').length || 0;
    const overdueCount = overduePayments?.length || 0;
    
    const paidPayments = allPayments?.filter(p => p.status === 'paid').length || 0;
    const totalPayments = allPayments?.length || 0;
    const collectionRate = totalPayments > 0 ? (paidPayments / totalPayments) * 100 : 0;

    setHirePurchaseReport({
      total_contracts: totalContracts,
      total_amount: totalAmount,
      active_contracts: activeContracts,
      overdue_payments: overdueCount,
      collection_rate: collectionRate
    });
  };

  const formatCurrency = (amount: number) => {
    return `฿${amount.toLocaleString()}`;
  };

  const exportReport = () => {
    toast({
      title: "กำลังส่งออกรายงาน",
      description: "ฟีเจอร์นี้จะพร้อมใช้งานในอนาคต"
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <BarChart3 className="h-6 w-6 text-furniture-500" />
          <h2 className="text-2xl font-bold text-slate-900">ระบบรายงาน</h2>
        </div>
        
        <div className="flex space-x-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">วันนี้</SelectItem>
              <SelectItem value="thisWeek">สัปดาห์นี้</SelectItem>
              <SelectItem value="thisMonth">เดือนนี้</SelectItem>
              <SelectItem value="thisYear">ปีนี้</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={exportReport}>
            <Download className="h-4 w-4 mr-2" />
            ส่งออก
          </Button>
        </div>
      </div>

      {/* เลือกประเภทรายงาน */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { key: 'sales', label: 'รายงานการขาย', icon: TrendingUp },
          { key: 'products', label: 'รายงานสินค้า', icon: PieChart },
          { key: 'customers', label: 'รายงานลูกค้า', icon: Calendar },
          { key: 'hirePurchase', label: 'รายงานเช่าซื้อ', icon: BarChart3 }
        ].map((report) => {
          const Icon = report.icon;
          return (
            <Button
              key={report.key}
              variant={selectedReport === report.key ? "default" : "outline"}
              onClick={() => setSelectedReport(report.key)}
              className={`h-16 ${selectedReport === report.key ? "bg-furniture-500 hover:bg-furniture-600" : ""}`}
            >
              <div className="text-center">
                <Icon className="h-6 w-6 mx-auto mb-1" />
                <p className="text-sm">{report.label}</p>
              </div>
            </Button>
          );
        })}
      </div>

      {loading ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center py-8">กำลังโหลดรายงาน...</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* รายงานการขาย */}
          {selectedReport === 'sales' && (
            <Card>
              <CardHeader>
                <CardTitle>รายงานการขาย</CardTitle>
              </CardHeader>
              <CardContent>
                {salesReport.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">ไม่มีข้อมูลการขายในช่วงเวลานี้</p>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm text-green-600">ยอดขายรวม</p>
                        <p className="text-2xl font-bold text-green-700">
                          {salesReport.reduce((sum, item) => sum + item.totalSales, 0)} รายการ
                        </p>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-blue-600">มูลค่ารวม</p>
                        <p className="text-2xl font-bold text-blue-700">
                          {formatCurrency(salesReport.reduce((sum, item) => sum + item.totalAmount, 0))}
                        </p>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <p className="text-sm text-purple-600">ค่าเฉลี่ยต่อรายการ</p>
                        <p className="text-2xl font-bold text-purple-700">
                          {formatCurrency(
                            salesReport.reduce((sum, item) => sum + item.totalAmount, 0) /
                            salesReport.reduce((sum, item) => sum + item.totalSales, 0) || 0
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {salesReport.map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-3 border rounded">
                          <span>{item.period}</span>
                          <div className="text-right">
                            <p className="font-medium">{item.totalSales} รายการ</p>
                            <p className="text-sm text-slate-600">{formatCurrency(item.totalAmount)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* รายงานสินค้า */}
          {selectedReport === 'products' && (
            <Card>
              <CardHeader>
                <CardTitle>รายงานสินค้าขายดี</CardTitle>
              </CardHeader>
              <CardContent>
                {productReport.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">ไม่มีข้อมูลการขายสินค้าในช่วงเวลานี้</p>
                ) : (
                  <div className="space-y-3">
                    {productReport.slice(0, 10).map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-3 border rounded">
                        <div>
                          <p className="font-medium">{item.product_name}</p>
                          <p className="text-sm text-slate-600">{item.product_code}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{item.total_quantity} ชิ้น</p>
                          <p className="text-sm text-slate-600">{formatCurrency(item.total_amount)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* รายงานลูกค้า */}
          {selectedReport === 'customers' && (
            <Card>
              <CardHeader>
                <CardTitle>รายงานลูกค้าสำคัญ</CardTitle>
              </CardHeader>
              <CardContent>
                {customerReport.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">ไม่มีข้อมูลลูกค้าในช่วงเวลานี้</p>
                ) : (
                  <div className="space-y-3">
                    {customerReport.slice(0, 10).map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-3 border rounded">
                        <div>
                          <p className="font-medium">{item.customer_name}</p>
                          <p className="text-sm text-slate-600">{item.customer_phone}</p>
                          <p className="text-xs text-slate-500">
                            ซื้อล่าสุด: {new Date(item.last_purchase).toLocaleDateString('th-TH')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(item.total_purchases)}</p>
                          <Badge variant="outline">ลูกค้าสำคัญ</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* รายงานเช่าซื้อ */}
          {selectedReport === 'hirePurchase' && hirePurchaseReport && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-slate-600">สัญญาทั้งหมด</p>
                    <p className="text-3xl font-bold text-furniture-600">{hirePurchaseReport.total_contracts}</p>
                    <p className="text-sm text-slate-500">สัญญา</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-slate-600">มูลค่ารวม</p>
                    <p className="text-3xl font-bold text-green-600">
                      {formatCurrency(hirePurchaseReport.total_amount)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-slate-600">สัญญาที่ใช้งาน</p>
                    <p className="text-3xl font-bold text-blue-600">{hirePurchaseReport.active_contracts}</p>
                    <p className="text-sm text-slate-500">สัญญา</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-slate-600">งวดเกินกำหนด</p>
                    <p className="text-3xl font-bold text-red-600">{hirePurchaseReport.overdue_payments}</p>
                    <p className="text-sm text-slate-500">งวด</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-slate-600">อัตราการชำระ</p>
                    <p className="text-3xl font-bold text-purple-600">
                      {hirePurchaseReport.collection_rate.toFixed(1)}%
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ReportsManagement;
