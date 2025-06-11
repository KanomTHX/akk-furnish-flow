import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FileText, Calendar, DollarSign, TrendingUp, TrendingDown, MinusCircle } from 'lucide-react'; // เพิ่ม MinusCircle สำหรับค่าใช้จ่าย
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  date: string;
  reference_type?: string;
  reference_id?: string;
}

interface Summary {
  totalIncome: number;
  totalExpense: number; // เพิ่ม totalExpense
  netProfit: number;
  salesCount: number;
  hirePurchaseIncome: number;
}

const AccountingManagement: React.FC = () => {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<Summary>({
    totalIncome: 0,
    totalExpense: 0,
    netProfit: 0,
    salesCount: 0,
    hirePurchaseIncome: 0
  });
  const [selectedPeriod, setSelectedPeriod] = useState('thisMonth');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAccountingData();
  }, [selectedPeriod]);

  const getDateRange = () => {
    const now = new Date();
    let startDate: Date;
    let endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0); // สิ้นเดือน

    switch (selectedPeriod) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1); // สำหรับวันนี้ วันสิ้นสุดควรเป็นตอนต้นของวันถัดไป
        break;
      case 'thisWeek':
        const weekStart = now.getDate() - now.getDay();
        startDate = new Date(now.getFullYear(), now.getMonth(), weekStart);
        // สิ้นสุดสัปดาห์จะเป็นวันอาทิตย์ถัดไป
        endDate = new Date(now.getFullYear(), now.getMonth(), weekStart + 6);
        break;
      case 'thisMonth':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'thisYear':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }
    // ตรวจสอบให้แน่ใจว่า endDate อยู่ที่สิ้นสุดของวัน
    endDate.setHours(23, 59, 59, 999);

    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    };
  };

  const loadAccountingData = async () => {
    setLoading(true);
    try {
      const { start, end } = getDateRange();
      
      // โหลดข้อมูลการขายสด
      const { data: salesData, error: salesError } = await supabase
        .from('cash_sales')
        .select('*')
        .gte('sale_date', start)
        .lte('sale_date', end)
        .eq('payment_status', 'completed');

      if (salesError) throw salesError;

      // โหลดข้อมูลการชำระเช่าซื้อ
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('installment_payments')
        .select('*')
        .gte('payment_date', start)
        .lte('payment_date', end)
        .eq('status', 'paid');

      if (paymentsError) throw paymentsError;

      // ใหม่: โหลดข้อมูลค่าใช้จ่ายสาขา (สมมติว่ามีตาราง 'branch_expenses')
      const { data: expensesData, error: expensesError } = await supabase
        .from('branch_expenses') // คุณต้องมีตารางชื่อ 'branch_expenses' ใน Supabase
        .select('*')
        .gte('expense_date', start) // สมมติว่ามีคอลัมน์ 'expense_date' สำหรับวันที่
        .lte('expense_date', end);

      if (expensesError) throw expensesError;


      // คำนวณข้อมูลสรุป
      const totalSalesIncome = salesData?.reduce((sum, sale) => sum + sale.total_amount, 0) || 0;
      const totalHirePurchaseIncome = paymentsData?.reduce((sum, payment) => sum + payment.amount_paid, 0) || 0;
      const totalIncome = totalSalesIncome + totalHirePurchaseIncome;

      const totalExpense = expensesData?.reduce((sum, expense) => sum + expense.amount, 0) || 0; // รวมค่าใช้จ่าย
      const netProfit = totalIncome - totalExpense; // คำนวณกำไรสุทธิ

      // สร้างรายการธุรกรรม
      const salesTransactions: Transaction[] = salesData?.map(sale => ({
        id: sale.id,
        type: 'income' as const,
        category: 'ขายสด',
        amount: sale.total_amount,
        description: `ขายสด #${sale.sale_number}`,
        date: sale.sale_date,
        reference_type: 'cash_sale',
        reference_id: sale.id
      })) || [];

      const paymentTransactions: Transaction[] = paymentsData?.map(payment => ({
        id: payment.id,
        type: 'income' as const,
        category: 'เช่าซื้อ',
        amount: payment.amount_paid,
        description: `ชำระงวดเช่าซื้อ งวดที่ ${payment.installment_number}`,
        date: payment.payment_date,
        reference_type: 'hire_purchase_payment',
        reference_id: payment.id
      })) || [];

      // ใหม่: แปลงค่าใช้จ่ายเป็นรายการธุรกรรม
      const expenseTransactions: Transaction[] = expensesData?.map(expense => ({
        id: expense.id,
        type: 'expense' as const,
        category: expense.category || 'ทั่วไป', // สมมติว่ามีคอลัมน์ 'category' สำหรับค่าใช้จ่าย
        amount: expense.amount,
        description: expense.description || 'ค่าใช้จ่ายสาขา', // สมมติว่ามีคอลัมน์ 'description'
        date: expense.expense_date,
        reference_type: 'branch_expense',
        reference_id: expense.id
      })) || [];

      const allTransactions = [
        ...salesTransactions, 
        ...paymentTransactions, 
        ...expenseTransactions // รวมรายการค่าใช้จ่าย
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setTransactions(allTransactions);
      setSummary({
        totalIncome,
        totalExpense, // ตั้งค่า totalExpense
        netProfit,    // ตั้งค่า netProfit
        salesCount: salesData?.length || 0,
        hirePurchaseIncome: totalHirePurchaseIncome
      });

    } catch (error: any) {
      toast({
        title: "ข้อผิดพลาด",
        description: error.message || "ไม่สามารถโหลดข้อมูลบัญชีได้",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `฿${amount.toLocaleString()}`;
  };

  const getTransactionIcon = (transaction: Transaction) => {
    return transaction.type === 'income' ? 
      <TrendingUp className="h-4 w-4 text-green-600" /> :
      <MinusCircle className="h-4 w-4 text-red-600" />; // เปลี่ยนเป็น MinusCircle สำหรับค่าใช้จ่าย
  };

  const getTransactionColor = (transaction: Transaction) => {
    return transaction.type === 'income' ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <FileText className="h-6 w-6 text-furniture-500" />
          <h2 className="text-2xl font-bold text-slate-900">ระบบบัญชี</h2>
        </div>
        
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">วันนี้</SelectItem>
            <SelectItem value="thisWeek">สัปดาห์นี้</SelectItem>
            <SelectItem value="thisMonth">เดือนนี้</SelectItem>
            <SelectItem value="thisYear">ปีนี้</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* สรุปข้อมูลทางการเงิน */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">รายได้รวม</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalIncome)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">ค่าใช้จ่ายรวม</p> {/* เปลี่ยนชื่อหัวข้อ */}
                <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalExpense)}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">กำไรสุทธิ</p>
                <p className="text-2xl font-bold text-furniture-600">{formatCurrency(summary.netProfit)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-furniture-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">ยอดขาย</p>
                <p className="text-2xl font-bold text-slate-900">{summary.salesCount}</p>
                <p className="text-xs text-slate-500">รายการ</p>
              </div>
              <Calendar className="h-8 w-8 text-slate-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* แยกตามประเภทรายได้ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>รายได้จากการขายสด</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">
                {formatCurrency(summary.totalIncome - summary.hirePurchaseIncome)}
              </p>
              <p className="text-sm text-slate-600">
                จาก {summary.salesCount} รายการ
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>รายได้จากเช่าซื้อ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">
                {formatCurrency(summary.hirePurchaseIncome)}
              </p>
              <p className="text-sm text-slate-600">
                จากการชำระงวด
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* รายการ Transaction */}
      <Card>
        <CardHeader>
          <CardTitle>รายการธุรกรรม</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8">กำลังโหลด...</p>
          ) : transactions.length === 0 ? (
            <p className="text-center text-slate-500 py-8">ไม่มีรายการธุรกรรมในช่วงเวลานี้</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getTransactionIcon(transaction)}
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{transaction.category}</Badge>
                        <span className="text-sm text-slate-600">
                          {new Date(transaction.date).toLocaleDateString('th-TH')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${getTransactionColor(transaction)}`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountingManagement;
