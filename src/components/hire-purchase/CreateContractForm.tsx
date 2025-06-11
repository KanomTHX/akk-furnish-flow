
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
}

interface Product {
  id: string;
  name: string;
  code: string;
  price: number;
  stock_quantity: number;
}

interface ContractItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface CreateContractFormProps {
  isOpen: boolean;
  onClose: () => void;
  onContractCreated: () => void;
}

const CreateContractForm: React.FC<CreateContractFormProps> = ({
  isOpen,
  onClose,
  onContractCreated
}) => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [contractItems, setContractItems] = useState<ContractItem[]>([]);
  const [downPayment, setDownPayment] = useState('');
  const [installmentMonths, setInstallmentMonths] = useState('12');
  const [interestRate, setInterestRate] = useState('12');
  const [contractDate, setContractDate] = useState(new Date().toISOString().split('T')[0]);
  const [firstPaymentDate, setFirstPaymentDate] = useState('');

  // Product selection
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('1');

  useEffect(() => {
    if (isOpen) {
      loadCustomers();
      loadProducts();
      generateFirstPaymentDate();
    }
  }, [isOpen]);

  const generateFirstPaymentDate = () => {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setFirstPaymentDate(nextMonth.toISOString().split('T')[0]);
  };

  const loadCustomers = async () => {
    const { data, error } = await supabase
      .from('customers')
      .select('id, name, phone, address')
      .order('name');
    
    if (error) {
      toast({ title: "ข้อผิดพลาด", description: "ไม่สามารถโหลดข้อมูลลูกค้าได้", variant: "destructive" });
      return;
    }
    setCustomers(data || []);
  };

  const loadProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, code, price, stock_quantity')
      .gt('stock_quantity', 0)
      .order('name');
    
    if (error) {
      toast({ title: "ข้อผิดพลาด", description: "ไม่สามารถโหลดข้อมูลสินค้าได้", variant: "destructive" });
      return;
    }
    setProducts(data || []);
  };

  const addProduct = () => {
    if (!selectedProductId || !quantity) {
      toast({ title: "ข้อผิดพลาด", description: "กรุณาเลือกสินค้าและจำนวน", variant: "destructive" });
      return;
    }

    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    const qty = parseInt(quantity);
    if (qty > product.stock_quantity) {
      toast({ title: "ข้อผิดพลาด", description: "จำนวนสินค้าไม่เพียงพอ", variant: "destructive" });
      return;
    }

    const existingItem = contractItems.find(item => item.product_id === selectedProductId);
    if (existingItem) {
      toast({ title: "ข้อผิดพลาด", description: "สินค้านี้ได้ถูกเพิ่มแล้ว", variant: "destructive" });
      return;
    }

    const newItem: ContractItem = {
      product_id: selectedProductId,
      product_name: product.name,
      quantity: qty,
      unit_price: product.price,
      total_price: qty * product.price
    };

    setContractItems([...contractItems, newItem]);
    setSelectedProductId('');
    setQuantity('1');
  };

  const removeProduct = (productId: string) => {
    setContractItems(contractItems.filter(item => item.product_id !== productId));
  };

  const calculateTotals = () => {
    const subtotal = contractItems.reduce((sum, item) => sum + item.total_price, 0);
    const downPaymentAmount = parseFloat(downPayment) || 0;
    const financedAmount = subtotal - downPaymentAmount;
    const interest = (financedAmount * parseFloat(interestRate) / 100) * (parseInt(installmentMonths) / 12);
    const totalAmount = subtotal + interest;
    const monthlyPayment = financedAmount > 0 ? (financedAmount + interest) / parseInt(installmentMonths) : 0;

    return {
      subtotal,
      downPaymentAmount,
      financedAmount,
      interest,
      totalAmount,
      monthlyPayment
    };
  };

  const createContract = async () => {
    if (!selectedCustomerId || contractItems.length === 0 || !downPayment) {
      toast({ title: "ข้อผิดพลาด", description: "กรุณากรอกข้อมูลให้ครบถ้วน", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const totals = calculateTotals();
      const contractNumber = `HP${Date.now()}`;

      // สร้างสัญญา
      const { data: contract, error: contractError } = await supabase
        .from('hire_purchase_contracts')
        .insert({
          customer_id: selectedCustomerId,
          sales_person_id: userProfile?.id,
          contract_number: contractNumber,
          contract_date: contractDate,
          total_amount: totals.totalAmount,
          down_payment: totals.downPaymentAmount,
          remaining_amount: totals.totalAmount - totals.downPaymentAmount,
          monthly_payment: totals.monthlyPayment,
          installment_months: parseInt(installmentMonths),
          interest_rate: parseFloat(interestRate),
          first_payment_date: firstPaymentDate,
          status: 'active'
        })
        .select()
        .single();

      if (contractError) throw contractError;

      // เพิ่มรายการสินค้า
      const contractItemsData = contractItems.map(item => ({
        contract_id: contract.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price
      }));

      const { error: itemsError } = await supabase
        .from('hire_purchase_items')
        .insert(contractItemsData);

      if (itemsError) throw itemsError;

      // สร้างตารางการชำระ
      const payments = [];
      const paymentDate = new Date(firstPaymentDate);
      
      for (let i = 1; i <= parseInt(installmentMonths); i++) {
        payments.push({
          contract_id: contract.id,
          installment_number: i,
          due_date: new Date(paymentDate).toISOString().split('T')[0],
          amount_due: totals.monthlyPayment,
          status: 'pending'
        });
        paymentDate.setMonth(paymentDate.getMonth() + 1);
      }

      const { error: paymentsError } = await supabase
        .from('installment_payments')
        .insert(payments);

      if (paymentsError) throw paymentsError;

      // อัปเดตสต็อกสินค้า
      for (const item of contractItems) {
        const { error: stockError } = await supabase
          .from('products')
          .update({ 
            stock_quantity: products.find(p => p.id === item.product_id)!.stock_quantity - item.quantity 
          })
          .eq('id', item.product_id);

        if (stockError) throw stockError;
      }

      toast({ 
        title: "สำเร็จ", 
        description: `สร้างสัญญาเช่าซื้อ ${contractNumber} เรียบร้อยแล้ว` 
      });

      resetForm();
      onContractCreated();
      onClose();

    } catch (error: any) {
      toast({ 
        title: "ข้อผิดพลาด", 
        description: error.message || "ไม่สามารถสร้างสัญญาได้", 
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedCustomerId('');
    setContractItems([]);
    setDownPayment('');
    setInstallmentMonths('12');
    setInterestRate('12');
    setContractDate(new Date().toISOString().split('T')[0]);
    generateFirstPaymentDate();
    setSelectedProductId('');
    setQuantity('1');
  };

  const totals = calculateTotals();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>สร้างสัญญาเช่าซื้อใหม่</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* ข้อมูลลูกค้า */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">ข้อมูลลูกค้า</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customer">เลือกลูกค้า</Label>
                  <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกลูกค้า" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map(customer => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name} - {customer.phone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="contract_date">วันที่ทำสัญญา</Label>
                  <Input
                    type="date"
                    value={contractDate}
                    onChange={(e) => setContractDate(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* เพิ่มสินค้า */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">เพิ่มสินค้า</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="md:col-span-2">
                  <Label htmlFor="product">เลือกสินค้า</Label>
                  <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกสินค้า" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map(product => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} - ฿{product.price.toLocaleString()} (คงเหลือ: {product.stock_quantity})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="quantity">จำนวน</Label>
                  <Input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={addProduct} className="w-full">
                    เพิ่มสินค้า
                  </Button>
                </div>
              </div>

              {/* รายการสินค้า */}
              {contractItems.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">รายการสินค้าในสัญญา</h4>
                  {contractItems.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 border rounded">
                      <div>
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity} ชิ้น × ฿{item.unit_price.toLocaleString()} = ฿{item.total_price.toLocaleString()}
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeProduct(item.product_id)}
                      >
                        ลบ
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* เงื่อนไขการเช่าซื้อ */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">เงื่อนไขการเช่าซื้อ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="down_payment">เงินดาวน์ (บาท)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={downPayment}
                    onChange={(e) => setDownPayment(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="installment_months">จำนวนงวด (เดือน)</Label>
                  <Select value={installmentMonths} onValueChange={setInstallmentMonths}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6">6 เดือน</SelectItem>
                      <SelectItem value="12">12 เดือน</SelectItem>
                      <SelectItem value="18">18 เดือน</SelectItem>
                      <SelectItem value="24">24 เดือน</SelectItem>
                      <SelectItem value="36">36 เดือน</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="interest_rate">อัตราดอกเบี้ย (% ต่อปี)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="first_payment_date">วันชำระงวดแรก</Label>
                  <Input
                    type="date"
                    value={firstPaymentDate}
                    onChange={(e) => setFirstPaymentDate(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* สรุปการคำนวณ */}
          {contractItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">สรุปการคำนวณ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">ราคาสินค้ารวม:</p>
                    <p className="font-medium">฿{totals.subtotal.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">เงินดาวน์:</p>
                    <p className="font-medium">฿{totals.downPaymentAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">ยอดผ่อน:</p>
                    <p className="font-medium">฿{totals.financedAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">ดอกเบี้ยรวม:</p>
                    <p className="font-medium">฿{totals.interest.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">ยอดรวมทั้งสิ้น:</p>
                    <p className="font-medium text-lg">฿{totals.totalAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">ค่างวดต่อเดือน:</p>
                    <p className="font-medium text-lg">฿{totals.monthlyPayment.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ปุ่มบันทึก */}
          <div className="flex justify-end space-x-4">
            <Button variant="outline" onClick={onClose}>
              ยกเลิก
            </Button>
            <Button 
              onClick={createContract}
              disabled={isLoading || contractItems.length === 0}
              className="bg-furniture-500 hover:bg-furniture-600"
            >
              {isLoading ? 'กำลังบันทึก...' : 'บันทึกสัญญา'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateContractForm;
