
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Plus, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import CreateContractForm from './hire-purchase/CreateContractForm';

interface Contract {
  id: string;
  contract_number: string;
  customer: {
    name: string;
    phone: string;
  };
  total_amount: number;
  down_payment: number;
  remaining_amount: number;
  monthly_payment: number;
  status: string;
  contract_date: string;
  first_payment_date: string;
}

interface Payment {
  id: string;
  installment_number: number;
  due_date: string;
  amount_due: number;
  amount_paid: number;
  status: string;
  payment_date?: string;
  payment_details?: string;
}

const HirePurchaseManagement: React.FC = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);

  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    const { data, error } = await supabase
      .from('hire_purchase_contracts')
      .select(`
        *,
        customer:customers(name, phone)
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      toast({ title: "ข้อผิดพลาด", description: "ไม่สามารถโหลดข้อมูลสัญญาได้", variant: "destructive" });
      return;
    }
    setContracts(data || []);
  };

  const loadPayments = async (contractId: string) => {
    const { data, error } = await supabase
      .from('installment_payments')
      .select('*')
      .eq('contract_id', contractId)
      .order('installment_number');
    
    if (error) {
      toast({ title: "ข้อผิดพลาด", description: "ไม่สามารถโหลดข้อมูลการชำระได้", variant: "destructive" });
      return;
    }
    setPayments(data || []);
  };

  const selectContract = (contract: Contract) => {
    setSelectedContract(contract);
    loadPayments(contract.id);
  };

  const processPayment = async (paymentId: string) => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast({ title: "ข้อผิดพลาด", description: "กรุณาระบุจำนวนเงินที่ถูกต้อง", variant: "destructive" });
      return;
    }

    setIsProcessingPayment(true);
    
    try {
      const amount = parseFloat(paymentAmount);
      const payment = payments.find(p => p.id === paymentId);
      
      if (!payment) {
        throw new Error('ไม่พบข้อมูลการชำระ');
      }

      const newAmountPaid = payment.amount_paid + amount;
      const isFullyPaid = newAmountPaid >= payment.amount_due;

      // อัปเดตการชำระ
      const { error: paymentError } = await supabase
        .from('installment_payments')
        .update({
          amount_paid: newAmountPaid,
          payment_date: new Date().toISOString().split('T')[0],
          payment_method: paymentMethod,
          status: isFullyPaid ? 'paid' : 'partial',
          cashier_id: userProfile?.id
        })
        .eq('id', paymentId);

      if (paymentError) throw paymentError;

      // อัปเดตยอดคงเหลือในสัญญา
      if (selectedContract) {
        const { error: contractError } = await supabase
          .from('hire_purchase_contracts')
          .update({
            remaining_amount: selectedContract.remaining_amount - amount
          })
          .eq('id', selectedContract.id);

        if (contractError) throw contractError;
      }

      toast({ 
        title: "สำเร็จ", 
        description: `รับชำระเงินจำนวน ฿${amount.toLocaleString()} เรียบร้อย` 
      });

      setPaymentAmount('');
      loadPayments(selectedContract!.id);
      loadContracts();

    } catch (error: any) {
      toast({ 
        title: "ข้อผิดพลาด", 
        description: error.message || "ไม่สามารถบันทึกการชำระได้", 
        variant: "destructive" 
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">ใช้งาน</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800">เสร็จสิ้น</Badge>;
      case 'defaulted':
        return <Badge className="bg-red-100 text-red-800">ผิดนัด</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-100 text-gray-800">ยกเลิก</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">ชำระแล้ว</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-100 text-yellow-800">ชำระบางส่วน</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800">เกินกำหนด</Badge>;
      default:
        return <Badge variant="outline">รอชำระ</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <CreditCard className="h-6 w-6 text-furniture-500" />
          <h2 className="text-2xl font-bold text-black">ระบบเช่าซื้อ</h2>
        </div>
        <Button 
          onClick={() => setIsCreateFormOpen(true)}
          className="bg-furniture-500 hover:bg-furniture-600"
        >
          <Plus className="h-4 w-4 mr-2" />
          สร้างสัญญาใหม่
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* รายการสัญญา */}
        <Card>
          <CardHeader>
            <CardTitle className="text-black">รายการสัญญาเช่าซื้อ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {contracts.length === 0 ? (
                <p className="text-center text-black py-8">ยังไม่มีสัญญาเช่าซื้อ</p>
              ) : (
                contracts.map((contract) => (
                  <div
                    key={contract.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedContract?.id === contract.id ? 'bg-furniture-50 border-furniture-300' : 'hover:bg-slate-50'
                    }`}
                    onClick={() => selectContract(contract)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium text-black">{contract.contract_number}</h3>
                        <p className="text-sm text-black">{contract.customer.name}</p>
                        <p className="text-xs text-black">{contract.customer.phone}</p>
                      </div>
                      {getStatusBadge(contract.status)}
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-black">ยอดรวม: ฿{contract.total_amount.toLocaleString()}</p>
                        <p className="text-black">คงเหลือ: ฿{contract.remaining_amount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-black">งวดละ: ฿{contract.monthly_payment.toLocaleString()}</p>
                        <p className="text-black">วันทำสัญญา: {new Date(contract.contract_date).toLocaleDateString('th-TH')}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* รายการการชำระ */}
        <Card>
          <CardHeader>
            <CardTitle className="text-black">
              {selectedContract ? `การชำระงวด - ${selectedContract.contract_number}` : 'เลือกสัญญาเพื่อดูรายการชำระ'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedContract ? (
              <div className="space-y-4">
                <div className="bg-slate-50 p-3 rounded-lg">
                  <h4 className="font-medium mb-2 text-black">{selectedContract.customer.name}</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <p className="text-black">ยอดรวม: ฿{selectedContract.total_amount.toLocaleString()}</p>
                    <p className="text-black">เงินดาวน์: ฿{selectedContract.down_payment.toLocaleString()}</p>
                    <p className="text-black">คงเหลือ: ฿{selectedContract.remaining_amount.toLocaleString()}</p>
                    <p className="text-black">งวดละ: ฿{selectedContract.monthly_payment.toLocaleString()}</p>
                  </div>
                </div>

                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {payments.map((payment) => (
                    <div key={payment.id} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium text-black">งวดที่ {payment.installment_number}</h4>
                          <p className="text-sm text-black">
                            กำหนดชำระ: {new Date(payment.due_date).toLocaleDateString('th-TH')}
                          </p>
                        </div>
                        {getPaymentStatusBadge(payment.status)}
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-black">ยอดที่ต้องชำระ:</span>
                          <span className="text-black">฿{payment.amount_due.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-black">ยอดที่ชำระแล้ว:</span>
                          <span className="text-black">฿{payment.amount_paid.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm font-medium">
                          <span className="text-black">คงเหลือ:</span>
                          <span className="text-red-600">฿{(payment.amount_due - payment.amount_paid).toLocaleString()}</span>
                        </div>

                        {payment.status !== 'paid' && (
                          <div className="pt-2 border-t space-y-2">
                            <div className="flex space-x-2">
                              <Input
                                type="number"
                                placeholder="จำนวนเงิน"
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value)}
                                className="flex-1"
                              />
                              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="cash">เงินสด</SelectItem>
                                  <SelectItem value="transfer">โอนเงิน</SelectItem>
                                  <SelectItem value="credit_card">บัตรเครดิต</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => processPayment(payment.id)}
                              disabled={isProcessingPayment}
                              className="w-full bg-furniture-500 hover:bg-furniture-600"
                            >
                              <DollarSign className="h-4 w-4 mr-2" />
                              {isProcessingPayment ? 'กำลังประมวลผล...' : 'รับชำระ'}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-center text-black py-8">กรุณาเลือกสัญญาจากรายการด้านซ้าย</p>
            )}
          </CardContent>
        </Card>
      </div>

      <CreateContractForm 
        isOpen={isCreateFormOpen}
        onClose={() => setIsCreateFormOpen(false)}
        onContractCreated={loadContracts}
      />
    </div>
  );
};

export default HirePurchaseManagement;
