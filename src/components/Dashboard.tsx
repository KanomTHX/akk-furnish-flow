
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, CreditCard, Package, TrendingUp, Users, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const Dashboard = () => {
  const { userProfile } = useAuth();
  const [stats, setStats] = useState({
    totalSales: 0,
    todaySales: 0,
    activeContracts: 0,
    lowStockProducts: 0,
    totalCustomers: 0,
    overduePayments: 0
  });
  const [recentSales, setRecentSales] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // โหลดสถิติต่างๆ
      const [salesData, contractsData, customersData, productsData, paymentsData] = await Promise.all([
        supabase.from('cash_sales').select('total_amount, sale_date'),
        supabase.from('hire_purchase_contracts').select('*').eq('status', 'active'),
        supabase.from('customers').select('id'),
        supabase.from('products').select('*'),
        supabase.from('installment_payments').select('*').eq('status', 'overdue')
      ]);

      // คำนวณยอดขายรวมและวันนี้
      const today = new Date().toISOString().split('T')[0];
      const totalSales = salesData.data?.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0;
      const todaySales = salesData.data?.filter(sale => 
        sale.sale_date?.startsWith(today)
      ).reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0;

      // สินค้าใกล้หมด
      const lowStock = productsData.data?.filter(product => 
        product.stock_quantity <= product.min_stock_level
      ) || [];

      setStats({
        totalSales,
        todaySales,
        activeContracts: contractsData.data?.length || 0,
        lowStockProducts: lowStock.length,
        totalCustomers: customersData.data?.length || 0,
        overduePayments: paymentsData.data?.length || 0
      });

      setLowStockProducts(lowStock.slice(0, 5));

      // โหลดการขายล่าสุด
      const { data: recentSalesData } = await supabase
        .from('cash_sales')
        .select(`
          *,
          customers(name),
          profiles!sales_person_id(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentSales(recentSalesData || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-furniture-500 to-furniture-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          ยินดีต้อนรับ, {userProfile?.full_name || 'ผู้ใช้งาน'}
        </h1>
        <p className="opacity-90">
          บทบาท: <Badge variant="secondary" className="text-furniture-900 bg-white/20">{userProfile?.role}</Badge>
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ยอดขายวันนี้</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-furniture-600">
              {formatCurrency(stats.todaySales)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ยอดขายรวม</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.totalSales)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">สัญญาเช่าซื้อที่ใช้งาน</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeContracts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ลูกค้าทั้งหมด</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">สินค้าใกล้หมด</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.lowStockProducts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ค่างวดค้างชำระ</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overduePayments}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sales & Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>การขายล่าสุด</CardTitle>
            <CardDescription>รายการขายสด 5 รายการล่าสุด</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{sale.customers?.name || 'ลูกค้าทั่วไป'}</p>
                    <p className="text-sm text-muted-foreground">
                      โดย: {sale.profiles?.full_name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(sale.total_amount)}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(sale.created_at).toLocaleDateString('th-TH')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>สินค้าใกล้หมด</CardTitle>
            <CardDescription>สินค้าที่ต้องเติมสต็อก</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lowStockProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">รหัส: {product.code}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={product.stock_quantity === 0 ? "destructive" : "secondary"}>
                      {product.stock_quantity} ชิ้น
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
