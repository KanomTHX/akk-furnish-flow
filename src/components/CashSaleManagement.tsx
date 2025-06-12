import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Plus, Search, Minus, Trash2, CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: string;
  name: string;
  code: string;
  price: number;
  stock_quantity: number;
  category: string;
  imageUrl?: string;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

interface SaleItem {
  product: Product;
  quantity: number;
  unit_price: number;
  total_price: number;
}

const CashSaleManagement: React.FC = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [isProcessingSale, setIsProcessingSale] = useState(false);

  useEffect(() => {
    loadProducts();
    loadCustomers();
  }, []);

  const loadProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*, imageUrl')
      .gt('stock_quantity', 0);
    
    if (error) {
      toast({ title: "ข้อผิดพลาด", description: "ไม่สามารถโหลดข้อมูลสินค้าได้", variant: "destructive" });
      return;
    }
    setProducts(data || []);
  };

  const loadCustomers = async () => {
    const { data, error } = await supabase
      .from('customers')
      .select('id, name, phone, email');
    
    if (error) {
      toast({ title: "ข้อผิดพลาด", description: "ไม่สามารถโหลดข้อมูลลูกค้าได้", variant: "destructive" });
      return;
    }
    setCustomers(data || []);
  };

  const addToCart = (product: Product) => {
    const existingItem = saleItems.find(item => item.product.id === product.id);
    
    if (existingItem) {
      if (existingItem.quantity >= product.stock_quantity) {
        toast({ title: "แจ้งเตือน", description: "สินค้าไม่เพียงพอ", variant: "destructive" });
        return;
      }
      setSaleItems(items => items.map(item => 
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1, total_price: (item.quantity + 1) * item.unit_price }
          : item
      ));
    } else {
      setSaleItems(items => [...items, {
        product,
        quantity: 1,
        unit_price: product.price,
        total_price: product.price
      }]);
    }
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setSaleItems(items => items.filter(item => item.product.id !== productId));
      return;
    }

    const product = products.find(p => p.id === productId);
    if (product && newQuantity > product.stock_quantity) {
      toast({ title: "แจ้งเตือน", description: "สินค้าไม่เพียงพอ", variant: "destructive" });
      return;
    }

    setSaleItems(items => items.map(item => 
      item.product.id === productId
        ? { ...item, quantity: newQuantity, total_price: newQuantity * item.unit_price }
        : item
    ));
  };

  const removeFromCart = (productId: string) => {
    setSaleItems(items => items.filter(item => item.product.id !== productId));
  };

  const calculateTotal = () => {
    return saleItems.reduce((total, item) => total + item.total_price, 0);
  };

  const processSale = async () => {
    if (saleItems.length === 0) {
      toast({ title: "แจ้งเตือน", description: "กรุณาเลือกสินค้า", variant: "destructive" });
      return;
    }

    setIsProcessingSale(true);
    
    try {
      const total = calculateTotal();
      const saleNumber = `CS${Date.now()}`;
      
      // สร้างรายการขาย
      const { data: sale, error: saleError } = await supabase
        .from('cash_sales')
        .insert({
          sale_number: saleNumber,
          customer_id: selectedCustomer?.id,
          sales_person_id: userProfile?.id,
          cashier_id: userProfile?.id,
          subtotal: total,
          total_amount: total,
          payment_method: paymentMethod,
          payment_status: 'completed'
        })
        .select()
        .single();

      if (saleError) throw saleError;

      // สร้างรายการสินค้า
      const saleItemsData = saleItems.map(item => ({
        cash_sale_id: sale.id,
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price
      }));

      const { error: itemsError } = await supabase
        .from('cash_sale_items')
        .insert(saleItemsData);

      if (itemsError) throw itemsError;

      // อัปเดตสต็อก
      for (const item of saleItems) {
        const { error: stockError } = await supabase
          .from('products')
          .update({ 
            stock_quantity: item.product.stock_quantity - item.quantity 
          })
          .eq('id', item.product.id);

        if (stockError) throw stockError;

        // บันทึกการเคลื่อนไหวสต็อก
        await supabase
          .from('inventory_movements')
          .insert({
            product_id: item.product.id,
            movement_type: 'out',
            quantity: -item.quantity,
            reference_type: 'sale',
            reference_id: sale.id,
            created_by: userProfile?.id
          });
      }

      toast({ 
        title: "สำเร็จ", 
        description: `ขายสำเร็จ หมายเลขใบเสร็จ: ${saleNumber}` 
      });

      // รีเซ็ตฟอร์ม
      setSaleItems([]);
      setSelectedCustomer(null);
      loadProducts();

    } catch (error: any) {
      toast({ 
        title: "ข้อผิดพลาด", 
        description: error.message || "ไม่สามารถบันทึกการขายได้", 
        variant: "destructive" 
      });
    } finally {
      setIsProcessingSale(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <ShoppingCart className="h-6 w-6 text-furniture-500" />
          <h2 className="text-2xl font-bold text-slate-900">ระบบขายสด</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* รายการสินค้า */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>เลือกสินค้า</CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  placeholder="ค้นหาสินค้า..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="border rounded-lg p-4 hover:bg-slate-50">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="font-medium">{product.name}</h3>
                        <p className="text-sm text-slate-600">{product.code}</p>
                        <p className="text-sm text-slate-600">คงเหลือ: {product.stock_quantity}</p>
                      </div>
                      {product.imageUrl && (
                        <a 
                          href={product.imageUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex-shrink-0" // ทำให้รูปภาพไม่ย่อขนาดเมื่อมีข้อความยาว
                        >
                          <img 
                            src={product.imageUrl} 
                            alt={product.name} 
                            className="w-16 h-16 object-cover rounded-md ml-4" 
                          />
                        </a>
                      )}
                      <Badge variant="outline">{product.category}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-furniture-600">
                        ฿{product.price.toLocaleString()}
                      </span>
                      <Button
                        size="sm"
                        onClick={() => addToCart(product)}
                        disabled={product.stock_quantity === 0}
                        className="bg-furniture-500 hover:bg-furniture-600"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ตะกร้าสินค้าและการชำระเงิน */}
        <div className="space-y-4">
          {/* เลือกลูกค้า */}
          <Card>
            <CardContent className="pt-6">
              <Label>เลือกลูกค้า (ไม่บังคับ)</Label>
              <Select onValueChange={(value) => {
                const customer = customers.find(c => c.id === value);
                setSelectedCustomer(customer || null);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกลูกค้า" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name} - {customer.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* ตะกร้าสินค้า */}
          <Card>
            <CardHeader>
              <CardTitle>ตะกร้าสินค้า ({saleItems.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {saleItems.map((item) => (
                  <div key={item.product.id} className="border rounded p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{item.product.name}</h4>
                        <p className="text-xs text-slate-600">฿{item.unit_price.toLocaleString()}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(item.product.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <span className="font-bold">฿{item.total_price.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
              
              {saleItems.length === 0 && (
                <p className="text-center text-slate-500 py-4">ยังไม่มีสินค้าในตะกร้า</p>
              )}
            </CardContent>
          </Card>

          {/* การชำระเงิน */}
          <Card>
            <CardHeader>
              <CardTitle>การชำระเงิน</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>วิธีชำระเงิน</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">เงินสด</SelectItem>
                    <SelectItem value="transfer">โอนเงิน</SelectItem>
                    <SelectItem value="credit_card">บัตรเครดิต</SelectItem>
                    <SelectItem value="qr_code">QR Code</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>รวมทั้งสิ้น:</span>
                  <span className="text-furniture-600">฿{calculateTotal().toLocaleString()}</span>
                </div>
              </div>

              <Button
                className="w-full bg-furniture-500 hover:bg-furniture-600"
                onClick={processSale}
                disabled={saleItems.length === 0 || isProcessingSale}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                {isProcessingSale ? 'กำลังประมวลผล...' : 'ชำระเงิน'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CashSaleManagement;