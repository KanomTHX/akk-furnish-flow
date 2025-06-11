import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Package, Plus, Search, Edit, AlertTriangle, TrendingUp, TrendingDown, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import Papa from 'papaparse'; // ต้องติดตั้ง papaparse เพิ่มเติม

// ตรวจสอบให้แน่ใจว่าได้ติดตั้ง papaparse แล้ว:
// npm install papaparse

interface Product {
  id: string;
  name: string;
  code: string;
  category: string;
  price: number;
  cost?: number;
  stock_quantity: number;
  min_stock_level: number;
  brand?: string;
  model?: string;
  description?: string;
  imageUrl?: string;
}

interface Movement {
  id: string;
  product: Product;
  movement_type: string;
  quantity: number;
  reference_type?: string;
  notes?: string;
  created_at: string;
  created_by_profile?: {
    full_name: string;
  };
}

const InventoryManagement: React.FC = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isAdjustStockOpen, setIsAdjustStockOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustmentQuantity, setAdjustmentQuantity] = useState('');
  const [adjustmentType, setAdjustmentType] = useState('in');
  const [adjustmentNotes, setAdjustmentNotes] = useState('');
  const [newProduct, setNewProduct] = useState({
    name: '',
    code: '',
    category: '',
    price: '',
    cost: '',
    stock_quantity: '',
    min_stock_level: '5',
    brand: '',
    model: '',
    description: ''
  });
  const [newProductImage, setNewProductImage] = useState<File | null>(null);
  const [exportPeriod, setExportPeriod] = useState('1month'); // สถานะใหม่สำหรับช่วงเวลาการส่งออก

  useEffect(() => {
    loadProducts();
    loadMovements();
  }, []);

  const loadProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name');
    
    if (error) {
      toast({ title: "ข้อผิดพลาด", description: "ไม่สามารถโหลดข้อมูลสินค้าได้", variant: "destructive" });
      return;
    }
    setProducts(data || []);
  };

  const loadMovements = async () => {
    const { data, error } = await supabase
      .from('inventory_movements')
      .select(`
        *,
        product:products(*),
        created_by_profile:profiles!inventory_movements_created_by_fkey(full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) {
      toast({ title: "ข้อผิดพลาด", description: "ไม่สามารถโหลดข้อมูลการเคลื่อนไหวได้", variant: "destructive" });
      return;
    }
    setMovements(data || []);
  };

  const addProduct = async () => {
    if (!newProduct.name || !newProduct.code || !newProduct.category || !newProduct.price) {
      toast({ title: "ข้อผิดพลาด", description: "กรุณากรอกข้อมูลที่จำเป็น", variant: "destructive" });
      return;
    }

    try {
      let imageUrl: string | null = null;

      if (newProductImage) {
        const fileExtension = newProductImage.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExtension}`;
        const filePath = `product-images/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('furniture-images')
          .upload(filePath, newProductImage, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          throw new Error(`ไม่สามารถอัปโหลดรูปภาพได้: ${uploadError.message}`);
        }

        const { data: publicUrlData } = supabase.storage
          .from('furniture-images')
          .getPublicUrl(filePath);
        
        imageUrl = publicUrlData?.publicUrl || null;
      }

      const { error } = await supabase
        .from('products')
        .insert({
          name: newProduct.name,
          code: newProduct.code,
          category: newProduct.category,
          price: parseFloat(newProduct.price),
          cost: newProduct.cost ? parseFloat(newProduct.cost) : null,
          stock_quantity: newProduct.stock_quantity ? parseInt(newProduct.stock_quantity) : 0,
          min_stock_level: parseInt(newProduct.min_stock_level),
          brand: newProduct.brand || null,
          model: newProduct.model || null,
          description: newProduct.description || null,
          imageUrl: imageUrl,
        });

      if (error) throw error;

      toast({ title: "สำเร็จ", description: "เพิ่มสินค้าเรียบร้อย" });
      setIsAddProductOpen(false);
      setNewProduct({
        name: '', code: '', category: '', price: '', cost: '', stock_quantity: '',
        min_stock_level: '5', brand: '', model: '', description: ''
      });
      setNewProductImage(null);
      loadProducts();

    } catch (error: any) {
      toast({ 
        title: "ข้อผิดพลาด", 
        description: error.message || "ไม่สามารถเพิ่มสินค้าได้", 
        variant: "destructive" 
      });
    }
  };

  const adjustStock = async () => {
    if (!selectedProduct || !adjustmentQuantity) {
      toast({ title: "ข้อผิดพลาด", description: "กรุณาระบุข้อมูลให้ครบถ้วน", variant: "destructive" });
      return;
    }

    try {
      const quantity = parseInt(adjustmentQuantity);
      if (isNaN(quantity) || quantity <= 0) {
        toast({ title: "ข้อผิดพลาด", description: "กรุณาป้อนจำนวนที่ถูกต้อง", variant: "destructive" });
        return;
      }

      const movementQuantity = adjustmentType === 'in' ? quantity : -quantity;
      const newStockQuantity = selectedProduct.stock_quantity + movementQuantity;

      if (newStockQuantity < 0) {
        toast({ title: "ข้อผิดพลาด", description: "สต็อกไม่เพียงพอ", variant: "destructive" });
        return;
      }

      const { error: stockError } = await supabase
        .from('products')
        .update({ stock_quantity: newStockQuantity })
        .eq('id', selectedProduct.id);

      if (stockError) throw stockError;

      const { error: movementError } = await supabase
        .from('inventory_movements')
        .insert({
          product_id: selectedProduct.id,
          movement_type: adjustmentType,
          quantity: movementQuantity,
          reference_type: 'adjustment',
          notes: adjustmentNotes,
          created_by: userProfile?.id
        });

      if (movementError) throw movementError;

      toast({ title: "สำเร็จ", description: "ปรับปรุงสต็อกเรียบร้อย" });
      setIsAdjustStockOpen(false);
      setSelectedProduct(null);
      setAdjustmentQuantity('');
      setAdjustmentNotes('');
      loadProducts();
      loadMovements();

    } catch (error: any) {
      toast({ 
        title: "ข้อผิดพลาด", 
        description: error.message || "ไม่สามารถปรับปรุงสต็อกได้", 
        variant: "destructive" 
      });
    }
  };

  const getStockStatus = (product: Product) => {
    if (product.stock_quantity === 0) {
      return <Badge className="bg-red-100 text-red-800">หมด</Badge>;
    } else if (product.stock_quantity <= product.min_stock_level) {
      return <Badge className="bg-yellow-100 text-yellow-800">ใกล้หมด</Badge>;
    } else {
      return <Badge className="bg-green-100 text-green-800">ปกติ</Badge>;
    }
  };

  const categories = [...new Set(products.map(p => p.category))];
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || product.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const lowStockProducts = products.filter(p => p.stock_quantity <= p.min_stock_level);

  const exportMovementsToCsv = async () => {
    let startDate: Date;
    const endDate = new Date(); // วันที่ปัจจุบัน

    switch (exportPeriod) {
      case '1month':
        startDate = new Date();
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case '2months':
        startDate = new Date();
        startDate.setMonth(endDate.getMonth() - 2);
        break;
      case '3months':
        startDate = new Date();
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case '6months':
        startDate = new Date();
        startDate.setMonth(endDate.getMonth() - 6);
        break;
      case '1year':
        startDate = new Date();
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      case 'all': // เพิ่มตัวเลือก "ทั้งหมด" เพื่อดึงข้อมูลทั้งหมด
        startDate = new Date(0); // Epoch, เพื่อดึงข้อมูลทั้งหมด
        break;
      default:
        startDate = new Date(0); // ค่าเริ่มต้น: ดึงข้อมูลทั้งหมด
        break;
    }

    const { data, error } = await supabase
      .from('inventory_movements')
      .select(`
        *,
        product:products(name, code, category),
        created_by_profile:profiles!inventory_movements_created_by_fkey(full_name)
      `)
      .gte('created_at', startDate.toISOString()) // กรองตั้งแต่วันที่เริ่มต้น
      .lte('created_at', endDate.toISOString())   // กรองจนถึงวันที่สิ้นสุด (ปัจจุบัน)
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: "ข้อผิดพลาด", description: "ไม่สามารถโหลดข้อมูลการเคลื่อนไหวเพื่อส่งออกได้", variant: "destructive" });
      return;
    }

    if (!data || data.length === 0) {
      toast({ title: "แจ้งเตือน", description: "ไม่มีข้อมูลการเคลื่อนไหวในช่วงเวลาที่เลือก", variant: "default" });
      return;
    }

    // เตรียมข้อมูลสำหรับ CSV
    const csvData = data.map(movement => ({
      'ชื่อสินค้า': movement.product.name,
      'รหัสสินค้า': movement.product.code,
      'หมวดหมู่': movement.product.category,
      'ประเภทการเคลื่อนไหว': movement.movement_type === 'in' ? 'เข้า' : 'ออก',
      'จำนวน': movement.quantity,
      'ประเภทอ้างอิง': movement.reference_type || '',
      'หมายเหตุ': movement.notes || '',
      'วันที่เคลื่อนไหว': new Date(movement.created_at).toLocaleString('th-TH'),
      'สร้างโดย': movement.created_by_profile?.full_name || 'N/A',
    }));

    // แปลงข้อมูลเป็น CSV ด้วย PapaParse
    const csv = Papa.unparse(csvData);

    // สร้าง Blob และ URL สำหรับดาวน์โหลด
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `inventory_movements_${exportPeriod}_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden'; // ซ่อนลิงก์
    document.body.appendChild(link); // เพิ่มลิงก์ลงใน DOM ชั่วคราว
    link.click(); // คลิกเพื่อดาวน์โหลด
    document.body.removeChild(link); // ลบลิงก์ออกจาก DOM
    toast({ title: "สำเร็จ", description: "ส่งออกข้อมูลเรียบร้อย" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Package className="h-6 w-6 text-furniture-500" />
          <h2 className="text-2xl font-bold text-slate-900">ระบบคลังสินค้า</h2>
        </div>
        
        <div className="flex space-x-2">
          {/* ส่วน Dialog ปรับสต็อกที่มีอยู่แล้ว */}
          <Dialog open={isAdjustStockOpen} onOpenChange={setIsAdjustStockOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">ปรับสต็อก</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>ปรับปรุงสต็อกสินค้า</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>เลือกสินค้า</Label>
                  <Select onValueChange={(value) => {
                    const product = products.find(p => p.id === value);
                    setSelectedProduct(product || null);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกสินค้า" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} - คงเหลือ: {product.stock_quantity}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>ประเภท</Label>
                    <Select value={adjustmentType} onValueChange={setAdjustmentType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="in">เพิ่ม</SelectItem>
                        <SelectItem value="out">ลด</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>จำนวน</Label>
                    <Input
                      type="number"
                      value={adjustmentQuantity}
                      onChange={(e) => setAdjustmentQuantity(e.target.value)}
                      placeholder="จำนวน"
                    />
                  </div>
                </div>
                
                <div>
                  <Label>หมายเหตุ</Label>
                  <Textarea
                    value={adjustmentNotes}
                    onChange={(e) => setAdjustmentNotes(e.target.value)}
                    placeholder="หมายเหตุ (ไม่บังคับ)"
                  />
                </div>
                
                <Button onClick={adjustStock} className="w-full bg-furniture-500 hover:bg-furniture-600">
                  ปรับปรุงสต็อก
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* ส่วน Dialog เพิ่มสินค้าที่มีอยู่แล้ว */}
          <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
            <DialogTrigger asChild>
              <Button className="bg-furniture-500 hover:bg-furniture-600">
                <Plus className="h-4 w-4 mr-2" />
                เพิ่มสินค้า
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>เพิ่มสินค้าใหม่</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>ชื่อสินค้า *</Label>
                  <Input
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    placeholder="ชื่อสินค้า"
                  />
                </div>
                <div>
                   <Label>รูปภาพสินค้า (ไม่บังคับ)</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setNewProductImage(e.target.files ? e.target.files[0] : null)}
                  />
                  {newProductImage && (
                    <p className="text-sm text-slate-500 mt-1">ไฟล์ที่เลือก: {newProductImage.name}</p>
                  )}
                </div>
                <div>
                  <Label>รหัสสินค้า *</Label>
                  <Input
                    value={newProduct.code}
                    onChange={(e) => setNewProduct({ ...newProduct, code: e.target.value })}
                    placeholder="รหัสสินค้า"
                  />
                </div>
                <div>
                  <Label>หมวดหมู่ *</Label>
                  <Input
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    placeholder="หมวดหมู่"
                  />
                </div>
                <div>
                  <Label>ราคาขาย *</Label>
                  <Input
                    type="number"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    placeholder="ราคาขาย"
                  />
                </div>
                <div>
                  <Label>ราคาต้นทุน</Label>
                  <Input
                    type="number"
                    value={newProduct.cost}
                    onChange={(e) => setNewProduct({ ...newProduct, cost: e.target.value })}
                    placeholder="ราคาต้นทุน"
                  />
                </div>
                <div>
                  <Label>จำนวนเริ่มต้น</Label>
                  <Input
                    type="number"
                    value={newProduct.stock_quantity}
                    onChange={(e) => setNewProduct({ ...newProduct, stock_quantity: e.target.value })}
                    placeholder="จำนวนเริ่มต้น"
                  />
                </div>
                <div>
                  <Label>สต็อกขั้นต่ำ</Label>
                  <Input
                    type="number"
                    value={newProduct.min_stock_level}
                    onChange={(e) => setNewProduct({ ...newProduct, min_stock_level: e.target.value })}
                    placeholder="สต็อกขั้นต่ำ"
                  />
                </div>
                <div>
                  <Label>ยี่ห้อ</Label>
                  <Input
                    value={newProduct.brand}
                    onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })}
                    placeholder="ยี่ห้อ"
                  />
                </div>
                <div className="col-span-2">
                  <Label>รุ่น</Label>
                  <Input
                    value={newProduct.model}
                    onChange={(e) => setNewProduct({ ...newProduct, model: e.target.value })}
                    placeholder="รุ่น"
                  />
                </div>
                <div className="col-span-2">
                  <Label>รายละเอียด</Label>
                  <Textarea
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    placeholder="รายละเอียดสินค้า"
                  />
                </div>
                <div className="col-span-2">
                  <Button onClick={addProduct} className="w-full bg-furniture-500 hover:bg-furniture-600">
                    เพิ่มสินค้า
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* แจ้งเตือนสต็อกต่ำ */}
      {lowStockProducts.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-yellow-800">
              <AlertTriangle className="h-5 w-5 mr-2" />
              แจ้งเตือนสต็อกต่ำ ({lowStockProducts.length} รายการ)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {lowStockProducts.map((product) => (
                <div key={product.id} className="text-sm text-yellow-700">
                  {product.name} - คงเหลือ: {product.stock_quantity}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ค้นหาและกรอง */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                placeholder="ค้นหาสินค้า..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger>
                <SelectValue placeholder="หมวดหมู่" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกหมวดหมู่</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* รายการสินค้า */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>รายการสินค้า ({filteredProducts.length} รายการ)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="border rounded-lg p-4 flex items-center space-x-4">
                    {product.imageUrl && (
                      <img 
                        src={product.imageUrl} 
                        alt={product.name} 
                        className="w-20 h-20 object-cover rounded-md" 
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h3 className="font-medium">{product.name}</h3>
                          <p className="text-sm text-slate-600">{product.code} • {product.category}</p>
                          {product.brand && <p className="text-sm text-slate-600">{product.brand} {product.model}</p>}
                        </div>
                        {getStockStatus(product)}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-slate-600">ราคาขาย</p>
                          <p className="font-medium">฿{product.price.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-slate-600">คงเหลือ</p>
                          <p className="font-medium">{product.stock_quantity}</p>
                        </div>
                        <div>
                          <p className="text-slate-600">ขั้นต่ำ</p>
                          <p className="font-medium">{product.min_stock_level}</p>
                        </div>
                        <div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedProduct(product);
                              setIsAdjustStockOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            ปรับสต็อก
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ประวัติการเคลื่อนไหว (ส่วนที่มีการเพิ่มฟังก์ชัน Export) */}
        <div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>ประวัติการเคลื่อนไหว</CardTitle>
              <div className="flex space-x-2">
                {/* Dropdown สำหรับเลือกช่วงเวลา */}
                <Select value={exportPeriod} onValueChange={setExportPeriod}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="เลือกช่วงเวลา" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1month">1 เดือน</SelectItem>
                    <SelectItem value="2months">2 เดือน</SelectItem>
                    <SelectItem value="3months">3 เดือน</SelectItem>
                    <SelectItem value="6months">6 เดือน</SelectItem>
                    <SelectItem value="1year">1 ปี</SelectItem>
                    <SelectItem value="all">ทั้งหมด</SelectItem> {/* เพิ่มตัวเลือก "ทั้งหมด" */}
                  </SelectContent>
                </Select>
                {/* ปุ่ม Export CSV */}
                <Button onClick={exportMovementsToCsv} size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-1" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {movements.map((movement) => (
                  <div key={movement.id} className="border rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {movement.movement_type === 'in' ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        )}
                        <span className="text-sm font-medium">{movement.product.name}</span>
                      </div>
                      <span className={`text-sm font-medium ${
                        movement.quantity > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">
                      {new Date(movement.created_at).toLocaleString('th-TH')}
                    </p>
                    {movement.notes && (
                      <p className="text-xs text-slate-500 mt-1">{movement.notes}</p>
                    )}
                    {movement.created_by_profile && (
                      <p className="text-xs text-slate-500">
                        โดย: {movement.created_by_profile.full_name}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default InventoryManagement;
