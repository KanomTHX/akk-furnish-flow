import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FileText, Calendar as CalendarIcon, DollarSign, TrendingUp, TrendingDown, MinusCircle, PlusCircle, ShoppingCart, Download } from 'lucide-react'; // Changed Calendar to CalendarIcon to avoid name collision
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import AddExpenseModal from './AddExpenseModal';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar'; // Import Calendar component here
import { cn } from '@/lib/utils'; // Assuming you have a utility for class names

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  date: string;
  reference_type?: string;
  reference_id?: string;
  branch_id?: string;
}

interface Summary {
  totalIncome: number;
  totalExpense: number;
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
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [exportStartDate, setExportStartDate] = useState<Date | undefined>(undefined);
  const [exportEndDate, setExportEndDate] = useState<Date | undefined>(undefined);

  const loadAccountingData = useCallback(async () => {
    setLoading(true);
    try {
      const today = new Date();
      let startDate: string | undefined;
      let endDate: string | undefined;

      switch (selectedPeriod) {
        case 'today':
          startDate = today.toISOString().split('T')[0];
          endDate = today.toISOString().split('T')[0];
          break;
        case 'thisWeek':
          const firstDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
          startDate = firstDayOfWeek.toISOString().split('T')[0];
          const lastDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));
          endDate = lastDayOfWeek.toISOString().split('T')[0];
          break;
        case 'thisMonth':
          startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
          endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
          break;
        case 'thisYear':
          startDate = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
          endDate = new Date(today.getFullYear(), 11, 31).toISOString().split('T')[0];
          break;
        default:
          startDate = undefined;
          endDate = undefined;
      }

      // Fetch cash sales
      let { data: cashSales, error: cashSalesError } = await supabase
        .from('cash_sales')
        .select('id, total_amount, sale_date, created_at')
        .gte('sale_date', startDate || '1970-01-01')
        .lte('sale_date', endDate || '2999-12-31');

      if (cashSalesError) throw cashSalesError;

      const cashSaleTransactions: Transaction[] = (cashSales || []).map(sale => ({
        id: sale.id,
        type: 'income',
        category: 'ขายสินค้าเงินสด',
        amount: sale.total_amount,
        description: `ขายสินค้าเงินสด #${sale.id.substring(0, 8)}`,
        date: sale.sale_date,
        reference_type: 'cash_sale',
        reference_id: sale.id,
      }));

      // Fetch hire-purchase payments (simplified for income calculation)
      let { data: hirePurchasePayments, error: hirePurchasePaymentsError } = await supabase
        .from('hire_purchase_payments')
        .select('id, amount_paid, payment_date, created_at')
        .eq('status', 'paid')
        .gte('payment_date', startDate || '1970-01-01')
        .lte('payment_date', endDate || '2999-12-31');

      if (hirePurchasePaymentsError) throw hirePurchasePaymentsError;

      const hirePurchaseTransactions: Transaction[] = (hirePurchasePayments || []).map(payment => ({
        id: payment.id,
        type: 'income',
        category: 'ผ่อนชำระ',
        amount: payment.amount_paid,
        description: `รับชำระผ่อน #${payment.id.substring(0, 8)}`,
        date: payment.payment_date || new Date().toISOString().split('T')[0],
        reference_type: 'hire_purchase_payment',
        reference_id: payment.id,
      }));

      // Fetch general expenses (simplified for now, you might have an 'expenses' table)
      // For now, let's assume 'branch_expenses' is your general expense table
      let { data: branchExpenses, error: branchExpensesError } = await supabase
        .from('branch_expenses')
        .select('id, amount, description, category, expense_date')
        .gte('expense_date', startDate || '1970-01-01')
        .lte('expense_date', endDate || '2999-12-31');

      if (branchExpensesError) throw branchExpensesError;

      const expenseTransactions: Transaction[] = (branchExpenses || []).map(expense => ({
        id: expense.id,
        type: 'expense',
        category: expense.category,
        amount: expense.amount,
        description: expense.description,
        date: expense.expense_date,
        reference_type: 'branch_expense',
        reference_id: expense.id,
      }));

      const allTransactions = [...cashSaleTransactions, ...hirePurchaseTransactions, ...expenseTransactions]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setTransactions(allTransactions);

      // Calculate summary
      const totalIncome = cashSaleTransactions.reduce((sum, t) => sum + t.amount, 0) +
                          hirePurchaseTransactions.reduce((sum, t) => sum + t.amount, 0);
      const totalExpense = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
      const netProfit = totalIncome - totalExpense;
      const salesCount = cashSaleTransactions.length;
      const hirePurchaseIncome = hirePurchaseTransactions.reduce((sum, t) => sum + t.amount, 0);

      setSummary({
        totalIncome,
        totalExpense,
        netProfit,
        salesCount,
        hirePurchaseIncome
      });

    } catch (error: any) {
      toast({
        title: "ข้อผิดพลาดในการโหลดข้อมูล",
        description: error.message,
        variant: "destructive",
      });
      console.error("Error loading accounting data:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod, toast]);

  useEffect(() => {
    loadAccountingData();
  }, [loadAccountingData]);

  const formatCurrency = (amount: number) => {
    return `฿${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getTransactionColor = (transaction: Transaction) => {
    return transaction.type === 'income' ? 'text-green-600' : 'text-red-600';
  };

  const getTransactionIcon = (transaction: Transaction) => {
    if (transaction.type === 'income') {
      return <TrendingUp className="h-5 w-5 text-green-600" />;
    } else {
      return <TrendingDown className="h-5 w-5 text-red-600" />;
    }
  };

  const generateCsv = (data: Transaction[]) => {
    const headers = ["วันที่", "ประเภท", "หมวดหมู่", "รายละเอียด", "จำนวนเงิน (฿)"];
    const rows = data.map(t => [
      new Date(t.date).toLocaleDateString('th-TH'),
      t.type === 'income' ? 'รายรับ' : 'รายจ่าย',
      t.category,
      t.description,
      t.amount.toFixed(2)
    ]);
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');
    return csvContent;
  };

  const handleExportTransactions = async () => {
    if (!exportStartDate || !exportEndDate) {
      toast({
        title: "ข้อผิดพลาด",
        description: "กรุณาเลือกช่วงวันที่สำหรับการส่งออกข้อมูล",
        variant: "destructive",
      });
      return;
    }

    try {
      const start = exportStartDate.toISOString().split('T')[0];
      const end = exportEndDate.toISOString().split('T')[0];

      // Fetch all data for the selected period for export
      let { data: cashSales, error: cashSalesError } = await supabase
        .from('cash_sales')
        .select('id, total_amount, sale_date, created_at')
        .gte('sale_date', start)
        .lte('sale_date', end);
      if (cashSalesError) throw cashSalesError;

      let { data: hirePurchasePayments, error: hirePurchasePaymentsError } = await supabase
        .from('hire_purchase_payments')
        .select('id, amount_paid, payment_date, created_at')
        .eq('status', 'paid')
        .gte('payment_date', start)
        .lte('payment_date', end);
      if (hirePurchasePaymentsError) throw hirePurchasePaymentsError;

      let { data: branchExpenses, error: branchExpensesError } = await supabase
        .from('branch_expenses')
        .select('id, amount, description, category, expense_date')
        .gte('expense_date', start)
        .lte('expense_date', end);
      if (branchExpensesError) throw branchExpensesError;

      const cashSaleTransactions: Transaction[] = (cashSales || []).map(sale => ({
        id: sale.id,
        type: 'income',
        category: 'ขายสินค้าเงินสด',
        amount: sale.total_amount,
        description: `ขายสินค้าเงินสด #${sale.id.substring(0, 8)}`,
        date: sale.sale_date,
        reference_type: 'cash_sale',
        reference_id: sale.id,
      }));

      const hirePurchaseTransactions: Transaction[] = (hirePurchasePayments || []).map(payment => ({
        id: payment.id,
        type: 'income',
        category: 'ผ่อนชำระ',
        amount: payment.amount_paid,
        description: `รับชำระผ่อน #${payment.id.substring(0, 8)}`,
        date: payment.payment_date || new Date().toISOString().split('T')[0],
        reference_type: 'hire_purchase_payment',
        reference_id: payment.id,
      }));

      const expenseTransactions: Transaction[] = (branchExpenses || []).map(expense => ({
        id: expense.id,
        type: 'expense',
        category: expense.category,
        amount: expense.amount,
        description: expense.description,
        date: expense.expense_date,
        reference_type: 'branch_expense',
        reference_id: expense.id,
      }));

      const allTransactionsForExport = [...cashSaleTransactions, ...hirePurchaseTransactions, ...expenseTransactions]
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Sort ascending for CSV

      if (allTransactionsForExport.length === 0) {
        toast({
          title: "ไม่พบข้อมูล",
          description: "ไม่มีรายการธุรกรรมในช่วงวันที่ที่เลือก",
          variant: "default",
        });
        return;
      }

      const csv = generateCsv(allTransactionsForExport);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `transactions_${start}_to_${end}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "ส่งออกสำเร็จ",
        description: "ส่งออกข้อมูลธุรกรรมเป็นไฟล์ CSV เรียบร้อยแล้ว",
      });

    } catch (error: any) {
      toast({
        title: "ข้อผิดพลาดในการส่งออกข้อมูล",
        description: error.message,
        variant: "destructive",
      });
      console.error("Error exporting accounting data:", error);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <FileText className="h-6 w-6 text-furniture-500" />
          <h2 className="text-2xl font-bold text-slate-900">ระบบบัญชี</h2>
        </div>
        <div className="flex items-center space-x-4">
          <Button onClick={() => setIsAddExpenseModalOpen(true)} className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white">
            <PlusCircle className="h-4 w-4" />
            เพิ่มค่าใช้จ่ายสาขา
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !exportStartDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {exportStartDate ? (
                  exportEndDate ? (
                    `${format(exportStartDate, "PPP")} - ${format(exportEndDate, "PPP")}`
                  ) : (
                    format(exportStartDate, "PPP")
                  )
                ) : (
                  <span>เลือกช่วงวันที่ส่งออก</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={{ from: exportStartDate, to: exportEndDate }}
                onSelect={(range) => {
                  setExportStartDate(range?.from);
                  setExportEndDate(range?.to);
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          <Button onClick={handleExportTransactions} className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white">
            <Download className="h-4 w-4" />
            ส่งออก CSV
          </Button>

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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">รายได้รวม</CardTitle>
            <DollarSign className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalIncome)}</div>
            <p className="text-xs text-slate-500 mt-1">
              จากยอดขายเงินสดและการผ่อนชำระ
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ค่าใช้จ่ายรวม</CardTitle>
            <MinusCircle className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalExpense)}</div>
            <p className="text-xs text-slate-500 mt-1">
              ค่าใช้จ่ายสาขา
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">กำไรสุทธิ</CardTitle>
            <TrendingUp className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(summary.netProfit)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              รายได้รวม - ค่าใช้จ่ายรวม
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ยอดขายเงินสด</CardTitle>
            <ShoppingCart className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-furniture-500">{formatCurrency(summary.totalIncome - summary.hirePurchaseIncome)}</div>
            <p className="text-xs text-slate-500 mt-1">
              จำนวน {summary.salesCount} รายการ
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>รายการธุรกรรม</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-slate-500 py-8">กำลังโหลดข้อมูล...</p>
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

      {/* Add Expense Modal */}
      <AddExpenseModal
        isOpen={isAddExpenseModalOpen}
        onClose={() => setIsAddExpenseModalOpen(false)}
        onExpenseAdded={loadAccountingData}
      />
    </div>
  );
};

export default AccountingManagement;