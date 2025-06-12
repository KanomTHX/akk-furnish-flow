import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// ตรวจสอบให้แน่ใจว่า Dialog, DialogContent, DialogHeader, DialogTitle ถูก import อย่างถูกต้อง
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Plus, Search, Minus, Trash2, CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

// นำเข้าคอมโพเนนต์ ReceiptDisplay ที่เราสร้างขึ้น
import ReceiptDisplay from './ReceiptDisplay';

// Interfaces ที่จำเป็น (หากยังไม่มีในไฟล์นี้ ให้เพิ่มเข้าไป)
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

// Interface สำหรับข้อมูล Sale (การขาย)
interface Sale {
    id: string;
    sale_number: string;
    customer_id: string | null;
    sales_person_id: string | null;
    cashier_id: string | null;
    subtotal: number;
    total_amount: number;
    payment_method: string;
    payment_status: string;
    created_at: string;
}

const CashSaleManagement: React.FC = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [isProcessingSale, setIsProcessingSale] = useState(false);

  // **** State ใหม่สำหรับจัดการ Dialog ใบเสร็จ ****
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
  const [lastSaleData, setLastSaleData] = useState<Sale | null>(null);
  const [lastSaleItemsData, setLastSaleItemsData] = useState<SaleItem[]>([]);

  useEffect(() => {
    loadProducts();
    loadCustomers();
  }, []);

  const loadProducts = async () => {
    const { data, error } = await supabase.from('products').select('*');
    if (error) {
      toast({ title: "ข้อผิดพลาด", description: error.message, variant: "destructive" });
    } else {
      setProducts(data);
    }
  };

  const loadCustomers = async () => {
    const { data, error } = await supabase.from('customers').select('*');
    if (error) {
      toast({ title: "ข้อผิดพลาด", description: error.message, variant: "destructive" });
    } else {
      setCustomers(data);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    customer.phone.includes(customerSearchTerm)
  );

  const handleAddProductToSale = () => {
    if (selectedProduct && quantity > 0) {
      if (quantity > selectedProduct.stock_quantity) {
        toast({
          title: "แจ้งเตือน",
          description: `สินค้า ${selectedProduct.name} มีในสต็อก ${selectedProduct.stock_quantity} ชิ้นเท่านั้น`,
          variant: "destructive"
        });
        return;
      }

      const existingItemIndex = saleItems.findIndex(item => item.product.id === selectedProduct.id);

      if (existingItemIndex > -1) {
        const updatedItems = [...saleItems];
        const updatedQuantity = updatedItems[existingItemIndex].quantity + quantity;

        if (updatedQuantity > selectedProduct.stock_quantity) {
            toast({
                title: "แจ้งเตือน",
                description: `จำนวนรวมของ ${selectedProduct.name} เกินสต็อก (มี ${selectedProduct.stock_quantity} ชิ้น)`,
                variant: "destructive"
            });
            return;
        }

        updatedItems[existingItemIndex].quantity = updatedQuantity;
        updatedItems[existingItemIndex].total_price = updatedItems[existingItemIndex].unit_price * updatedQuantity;
        setSaleItems(updatedItems);
      } else {
        setSaleItems([
          ...saleItems,
          {
            product: selectedProduct,
            quantity: quantity,
            unit_price: selectedProduct.price,
            total_price: selectedProduct.price * quantity,
          },
        ]);
      }
      setSelectedProduct(null);
      setQuantity(1);
      setSearchTerm('');
    } else {
      toast({ title: "แจ้งเตือน", description: "กรุณาเลือกสินค้าและระบุจำนวน", variant: "destructive" });
    }
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setSaleItems(prevItems =>
      prevItems.map(item => {
        if (item.product.id === productId) {
          const newQuantity = item.quantity + delta;
          if (newQuantity <= 0) {
            return item; // Prevent quantity from going to 0 or negative via buttons
          }
          if (newQuantity > item.product.stock_quantity) {
            toast({
                title: "แจ้งเตือน",
                description: `สินค้า ${item.product.name} มีในสต็อก ${item.product.stock_quantity} ชิ้นเท่านั้น`,
                variant: "destructive"
            });
            return item;
          }
          return {
            ...item,
            quantity: newQuantity,
            total_price: item.unit_price * newQuantity,
          };
        }
        return item;
      }).filter(item => item.quantity > 0) // Remove if quantity becomes 0
    );
  };

  const handleRemoveItem = (productId: string) => {
    setSaleItems(prevItems => prevItems.filter(item => item.product.id !== productId));
  };

  const calculateTotal = () => {
    return saleItems.reduce((sum, item) => sum + item.total_price, 0);
  };

  const processSale = async () => {
    if (saleItems.length === 0) {
      toast({ title: "แจ้งเตือน", description: "กรุณาเลือกสินค้า", variant: "destructive" });
      return;
    }

    setIsProcessingSale(true);

    try {
      const total = calculateTotal();
      const saleNumber = `CS${Date.now()}`; // สร้างเลขที่ใบเสร็จง่ายๆ

      // สร้างรายการขายในตาราง cash_sales
      const { data: sale, error: saleError } = await supabase
        .from('cash_sales')
        .insert({
          sale_number: saleNumber,
          customer_id: selectedCustomer?.id, // สามารถเป็น null ได้
          sales_person_id: userProfile?.id, // ID ของพนักงานขายที่เข้าสู่ระบบ
          cashier_id: userProfile?.id, // ID ของแคชเชียร์ (ในที่นี้คือคนเดียวกัน)
          subtotal: total,
          total_amount: total,
          payment_method: paymentMethod,
          payment_status: 'completed' // สถานะการชำระเงิน
        })
        .select()
        .single(); // คาดหวังผลลัพธ์เดียว

      if (saleError) throw saleError;

      // เตรียมข้อมูลสำหรับรายการสินค้าที่ขาย (cash_sale_items)
      const saleItemsData = saleItems.map(item => ({
        cash_sale_id: sale.id,
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price
      }));

      // บันทึกรายการสินค้าที่ขาย
      const { error: itemsError } = await supabase
        .from('cash_sale_items')
        .insert(saleItemsData);

      if (itemsError) throw itemsError;

      // อัปเดตสต็อกสินค้าและบันทึกการเคลื่อนไหวสต็อก
      for (const item of saleItems) {
        // อัปเดต stock_quantity ในตาราง products
        const { error: stockError } = await supabase
          .from('products')
          .update({
            stock_quantity: item.product.stock_quantity - item.quantity
          })
          .eq('id', item.product.id);

        if (stockError) throw stockError;

        // บันทึกการเคลื่อนไหวสต็อกในตาราง inventory_movements
        await supabase
          .from('inventory_movements')
          .insert({
            product_id: item.product.id,
            movement_type: 'out', // การเคลื่อนไหวออก (ขาย)
            quantity: -item.quantity, // จำนวนติดลบ
            reference_type: 'sale', // อ้างอิงถึงการขาย
            reference_id: sale.id, // ID ของการขาย
            created_by: userProfile?.id // ผู้สร้างรายการเคลื่อนไหว
          });
      }

      toast({
        title: "สำเร็จ",
        description: `ขายสำเร็จ หมายเลขใบเสร็จ: ${saleNumber}`
      });

      // **** ส่วนที่เพิ่มเข้ามา: เก็บข้อมูลการขายล่าสุดและเปิด Dialog ใบเสร็จ ****
      setLastSaleData(sale); // เก็บข้อมูล Sale ที่เพิ่งสร้าง
      setLastSaleItemsData(saleItems); // เก็บรายการสินค้าที่ขายใน Sale นี้
      setIsReceiptDialogOpen(true); // เปิด Dialog ใบเสร็จ

      // รีเซ็ตฟอร์มหลังจากขายสำเร็จ
      setSaleItems([]);
      setSelectedCustomer(null);
      loadProducts(); // โหลดข้อมูลสินค้าใหม่เพื่ออัปเดตสต็อกที่แสดง
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

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-6 text-furniture-700">จัดการการขายเงินสด</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* คอลัมน์ซ้าย: ค้นหาสินค้าและจัดการรายการขาย */}
        <div className="lg:col-span-2 space-y-6">
          {/* ค้นหาสินค้า */}
          <Card>
            <CardHeader>
              <CardTitle>ค้นหาสินค้า</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="ค้นหาสินค้าด้วยชื่อหรือรหัส..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="max-h-60 overflow-y-auto border rounded-md">
                {searchTerm && filteredProducts.length > 0 ? (
                  filteredProducts.map(product => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                      onClick={() => setSelectedProduct(product)}
                    >
                      <div>
                        <p className="font-medium">{product.name} ({product.code})</p>
                        <p className="text-sm text-gray-500">ราคา: ฿{product.price.toLocaleString()} | สต็อก: {product.stock_quantity}</p>
                      </div>
                      {selectedProduct?.id === product.id && (
                        <Badge variant="secondary">เลือกแล้ว</Badge>
                      )}
                    </div>
                  ))
                ) : (
                  searchTerm && <p className="p-3 text-gray-500">ไม่พบสินค้า</p>
                )}
              </div>

              {selectedProduct && (
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    placeholder="จำนวน"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-24"
                  />
                  <Button onClick={handleAddProductToSale} className="bg-furniture-500 hover:bg-furniture-600">
                    <Plus className="h-4 w-4 mr-2" />
                    เพิ่มเข้าตะกร้า
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* รายการสินค้าที่ขาย */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShoppingCart className="h-5 w-5 mr-2" />
                รายการสินค้าในตะกร้า ({saleItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {saleItems.length === 0 ? (
                <p className="text-center text-gray-500">ยังไม่มีสินค้าในตะกร้า</p>
              ) : (
                <div className="space-y-4">
                  {saleItems.map(item => (
                    <div key={item.product.id} className="flex items-center justify-between border-b pb-3 last:pb-0 last:border-b-0">
                      <div>
                        <p className="font-medium">{item.product.name}</p>
                        <p className="text-sm text-gray-500">฿{item.unit_price.toLocaleString()} x {item.quantity} = ฿{item.total_price.toLocaleString()}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleUpdateQuantity(item.product.id, -1)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="font-bold w-6 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleUpdateQuantity(item.product.id, 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => handleRemoveItem(item.product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* คอลัมน์ขวา: ข้อมูลลูกค้าและชำระเงิน */}
        <div className="space-y-6">
          {/* ข้อมูลลูกค้า */}
          <Card>
            <CardHeader>
              <CardTitle>ข้อมูลลูกค้า</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="ค้นหาลูกค้าด้วยชื่อหรือเบอร์โทร..."
                  className="pl-9"
                  value={customerSearchTerm}
                  onChange={(e) => setCustomerSearchTerm(e.target.value)}
                />
              </div>
              <div className="max-h-40 overflow-y-auto border rounded-md">
                {customerSearchTerm && filteredCustomers.length > 0 ? (
                  filteredCustomers.map(customer => (
                    <div
                      key={customer.id}
                      className="flex items-center justify-between p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                      onClick={() => setSelectedCustomer(customer)}
                    >
                      <div>
                        <p className="font-medium">{customer.name}</p>
                        <p className="text-sm text-gray-500">{customer.phone}</p>
                      </div>
                      {selectedCustomer?.id === customer.id && (
                        <Badge variant="secondary">เลือกแล้ว</Badge>
                      )}
                    </div>
                  ))
                ) : (
                  customerSearchTerm && <p className="p-3 text-gray-500">ไม่พบลูกค้า</p>
                )}
              </div>
              {selectedCustomer ? (
                <div className="flex items-center justify-between p-3 border rounded-md bg-green-50">
                  <p>ลูกค้าที่เลือก: <span className="font-bold">{selectedCustomer.name}</span></p>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedCustomer(null)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">ไม่เลือกลูกค้า = ลูกค้าทั่วไป</p>
              )}
            </CardContent>
          </Card>

          {/* สรุปการชำระเงิน */}
          <Card>
            <CardHeader>
              <CardTitle>สรุปการชำระเงิน</CardTitle>
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

      {/* **** Dialog สำหรับแสดงใบเสร็จ **** */}
      <Dialog open={isReceiptDialogOpen} onOpenChange={setIsReceiptDialogOpen}>
          <DialogContent className="max-w-4xl p-0 overflow-hidden"> {/* ปรับ max-w เพื่อให้ Dialog กว้างพอ */}
              <DialogHeader className="p-4 border-b">
                  <DialogTitle>ใบเสร็จรับเงิน</DialogTitle>
              </DialogHeader>
              <div className="p-4">
                  {/* แสดง ReceiptDisplay หากมีข้อมูลการขายล่าสุด */}
                  {lastSaleData && lastSaleItemsData.length > 0 && (
                      <ReceiptDisplay
                          sale={lastSaleData}
                          saleItems={lastSaleItemsData}
                          customer={selectedCustomer} // ส่งข้อมูลลูกค้าปัจจุบันที่เลือก (อาจเป็น null)
                          salesPersonName={userProfile?.full_name || userProfile?.email || 'ไม่ระบุ'} // ส่งชื่อพนักงานขาย
                      />
                  )}
              </div>
              <div className="flex justify-end p-4 border-t">
                  <Button onClick={() => setIsReceiptDialogOpen(false)}>ปิด</Button>
                  {/* คุณสามารถเพิ่มปุ่มพิมพ์ที่นี่ได้ หากต้องการ (เช่น ใช้ window.print()) */}
                  {/* <Button onClick={() => window.print()} className="ml-2">พิมพ์ใบเสร็จ</Button> */}
              </div>
          </DialogContent>
      </Dialog>
    </div>
  );
};

export default CashSaleManagement;