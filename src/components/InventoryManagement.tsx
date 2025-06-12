import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Package,
  Plus,
  Search,
  Edit,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Download,
  Trash2,
  PlusCircle,
  MinusCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import Papa from 'papaparse';

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
  location?: string;
}

interface Movement {
  id: string;
  product_id: string;
  product: { name: string; code: string }; // เพิ่ม product code ด้วย
  movement_type: 'in' | 'out' | 'product_removed'; // เพิ่มประเภทการเคลื่อนไหว 'product_removed'
  quantity: number;
  notes?: string;
  created_at: string;
  created_by: string;
  created_by_profile: { full_name: string };
  reference_type?: string;
  reference_id?: string;
}

interface UserProfile {
  id: string;
  full_name: string;
  role: string;
}

const InventoryManagement: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [isEditProductModalOpen, setIsEditProductModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    stock_quantity: 0,
    min_stock_level: 0,
    location: '',
  });
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isReceivingProduct, setIsReceivingProduct] = useState(false);
  const [receiveQuantity, setReceiveQuantity] = useState<number | ''>('');
  const [receiveNotes, setReceiveNotes] = useState('');
  const [receiveProductId, setReceiveProductId] = useState<string | null>(null);
  const [receiveCost, setReceiveCost] = useState<number | ''>('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Load User Profile
  const loadUserProfile = useCallback(async () => {
    if (!user) {
      setUserProfile(null);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (error: any) {
      console.error("Error loading user profile:", error.message);
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลโปรไฟล์ผู้ใช้ได้",
        variant: "destructive",
      });
    }
  }, [user, toast]);

  // Load Products
  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('products').select('*').order('name', { ascending: true });
      if (error) throw error;
      setProducts(data);
    } catch (error: any) {
      console.error("Error loading products:", error.message);
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถโหลดรายการสินค้าได้",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Load Movements
  const loadMovements = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('inventory_movements')
        .select(`
          id,
          product_id,
          product:products(name, code),
          movement_type,
          quantity,
          notes,
          created_at,
          created_by,
          created_by_profile:profiles(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(10); // แสดงการเคลื่อนไหวล่าสุด 10 รายการ

      if (error) throw error;
      setMovements(data as Movement[]);
    } catch (error: any) {
      console.error("Error loading movements:", error.message);
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถโหลดประวัติการเคลื่อนไหวได้",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    loadUserProfile();
    loadProducts();
    loadMovements();
  }, [loadUserProfile, loadProducts, loadMovements]);

  // Handle Add Product (เปลี่ยนเป็น รับสินค้าเข้าสาขา)
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) {
      toast({ title: "ข้อผิดพลาด", description: "ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่", variant: "destructive" });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .insert({
          ...newProduct,
          stock_quantity: newProduct.stock_quantity || 0,
          min_stock_level: newProduct.min_stock_level || 0,
          created_by: userProfile.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast({ title: "สำเร็จ", description: "เพิ่มสินค้าใหม่เรียบร้อย" });
      setIsAddProductModalOpen(false);
      setNewProduct({});
      loadProducts();
      loadMovements(); // โหลดการเคลื่อนไหวใหม่เพื่อให้ประวัติขึ้นทันที
    } catch (error: any) {
      toast({
        title: "ข้อผิดพลาด",
        description: error.message || "ไม่สามารถเพิ่มสินค้าได้",
        variant: "destructive",
      });
    }
  };

  // Handle Edit Product
  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    try {
      const { error } = await supabase
        .from('products')
        .update({
          name: selectedProduct.name,
          code: selectedProduct.code,
          category: selectedProduct.category,
          price: selectedProduct.price,
          cost: selectedProduct.cost,
          stock_quantity: selectedProduct.stock_quantity,
          min_stock_level: selectedProduct.min_stock_level,
          brand: selectedProduct.brand,
          model: selectedProduct.model,
          description: selectedProduct.description,
          imageUrl: selectedProduct.imageUrl,
          location: selectedProduct.location,
        })
        .eq('id', selectedProduct.id);

      if (error) throw error;

      toast({ title: "สำเร็จ", description: "แก้ไขข้อมูลสินค้าเรียบร้อย" });
      setIsEditProductModalOpen(false);
      setSelectedProduct(null);
      loadProducts();
      loadMovements(); // โหลดการเคลื่อนไหวใหม่ในกรณีมีการเปลี่ยนแปลงที่อาจส่งผล
    } catch (error: any) {
      toast({
        title: "ข้อผิดพลาด",
        description: error.message || "ไม่สามารถแก้ไขข้อมูลสินค้าได้",
        variant: "destructive",
      });
    }
  };

  // Handle Image Upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      toast({ title: "ข้อผิดพลาด", description: "ไม่ได้เลือกรูปภาพ", variant: "destructive" });
      return;
    }

    const file = event.target.files[0];
    const filePath = `product-images/${Date.now()}-${file.name}`;

    setUploadingImage(true);
    try {
      const { data, error } = await supabase.storage
        .from('furniture-images') // ตรวจสอบว่าชื่อ bucket ถูกต้อง
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from('furniture-images')
        .getPublicUrl(filePath);

      if (publicUrlData) {
        if (isAddProductModalOpen) {
          setNewProduct((prev) => ({ ...prev, imageUrl: publicUrlData.publicUrl }));
        } else if (isEditProductModalOpen && selectedProduct) {
          setSelectedProduct((prev) => ({ ...prev!, imageUrl: publicUrlData.publicUrl }));
        }
        toast({ title: "สำเร็จ", description: "อัปโหลดรูปภาพเรียบร้อย" });
      } else {
        throw new Error("ไม่สามารถรับ URL สาธารณะได้");
      }
    } catch (error: any) {
      console.error("ข้อผิดพลาดในการอัปโหลดรูปภาพ:", error.message);
      toast({
        title: "ข้อผิดพลาด",
        description: error.message || "ไม่สามารถอัปโหลดรูปภาพได้",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  // Handle Receive Product (เพิ่มสต็อก)
  const receiveProduct = async () => {
    if (!receiveProductId || receiveQuantity === '' || receiveCost === '') {
      toast({ title: "ข้อผิดพลาด", description: "กรุณากรอกข้อมูลรับสินค้าให้ครบถ้วน", variant: "destructive" });
      return;
    }
    if (!userProfile) {
      toast({ title: "ข้อผิดพลาด", description: "ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่", variant: "destructive" });
      return;
    }

    setIsReceivingProduct(true);
    try {
      const parsedReceivedQuantity = Number(receiveQuantity);
      const parsedReceivedCost = Number(receiveCost);
      const totalCost = parsedReceivedQuantity * parsedReceivedCost;

      const { data: currentProduct, error: productError } = await supabase
        .from('products')
        .select('stock_quantity, name, code, cost')
        .eq('id', receiveProductId)
        .single();

      if (productError) throw productError;

      const newStockQuantity = currentProduct.stock_quantity + parsedReceivedQuantity;

      const { error: updateError } = await supabase
        .from('products')
        .update({ stock_quantity: newStockQuantity })
        .eq('id', receiveProductId);

      if (updateError) throw updateError;

      // บันทึกการเคลื่อนไหว
      const { error: movementError } = await supabase.from('inventory_movements').insert({
        product_id: receiveProductId,
        movement_type: 'in',
        quantity: parsedReceivedQuantity,
        notes: receiveNotes || 'รับสินค้าเข้า',
        reference_type: 'receiving',
        created_by: userProfile.id,
      });

      if (movementError) {
        console.error("Error recording movement:", movementError.message);
        // อาจจะ rollback การอัปเดตสต็อกหรือแค่เตือน
      }

      // บันทึกค่าใช้จ่ายใน branch_expenses (ต้นทุนสินค้า)
      // **สำคัญ**: ต้องมีคอลัมน์ product_id ในตาราง branch_expenses
      const { error: expenseError } = await supabase
        .from('branch_expenses')
        .insert({
          amount: totalCost,
          description: `ต้นทุนสินค้า: ${currentProduct.name} (${currentProduct.code}) จำนวน ${parsedReceivedQuantity} หน่วย`,
          category: 'ต้นทุนสินค้า', // กำหนด Category เป็น 'ต้นทุนสินค้า'
          expense_date: new Date().toISOString().split('T')[0],
          created_by: userProfile.id,
          product_id: receiveProductId // <-- **(เพิ่ม product_id ที่นี่)**
        });

      if (expenseError) {
        console.error("Error recording expense:", expenseError.message);
        // อาจจะ rollback การอัปเดตสต็อกและ movement
      }

      toast({ title: "สำเร็จ", description: "รับสินค้าเข้าเรียบร้อย" });
      setReceiveQuantity('');
      setReceiveNotes('');
      setReceiveCost('');
      setReceiveProductId(null);
      setIsReceivingProduct(false);
      loadProducts();
      loadMovements(); // **(เรียก loadMovements ที่นี่เพื่อให้ประวัติขึ้นทันที)**
    } catch (error: any) {
      toast({
        title: "ข้อผิดพลาด",
        description: error.message || "ไม่สามารถรับสินค้าได้",
        variant: "destructive",
      });
    } finally {
      setIsReceivingProduct(false);
    }
  };

  // ฟังก์ชันสำหรับจัดการการลบสินค้า
  // เพิ่มพารามิเตอร์ deletionNote และ lastKnownStock
  const deleteProduct = async (
    productId: string,
    imageUrl: string | undefined,
    deletionNote: string,
    lastKnownStock: number
  ) => {
    try {
      if (!userProfile) {
        toast({ title: "ข้อผิดพลาด", description: "ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่", variant: "destructive" });
        return;
      }

      // 1. ลบค่าใช้จ่ายสาขาที่เกี่ยวข้อง (Branch Expenses)
      //    **สำคัญ:** แนะนำให้ใช้ product_id ใน branch_expenses เพื่อความถูกต้อง
      const { error: expenseDeleteError } = await supabase
        .from('branch_expenses')
        .delete()
        .eq('product_id', productId); // สมมติว่า branch_expenses มี product_id

      if (expenseDeleteError) {
        console.error("Error deleting associated expenses:", expenseDeleteError.message);
        toast({
          title: "คำเตือน",
          description: `ไม่สามารถลบค่าใช้จ่ายที่เกี่ยวข้องได้: ${expenseDeleteError.message}`,
          variant: "destructive",
        });
      }

      // 2. ลบรูปภาพที่เกี่ยวข้องจาก Storage
      if (imageUrl) {
        const filePath = imageUrl.split('product-images/')[1];
        if (filePath) {
          const { error: storageError } = await supabase.storage
            .from('furniture-images')
            .remove([`product-images/${filePath}`]);

          if (storageError) {
            console.error("ข้อผิดพลาดในการลบรูปภาพจาก storage:", storageError.message);
            toast({
              title: "คำเตือน",
              description: `ไม่สามารถลบรูปภาพได้: ${storageError.message}`,
              variant: "destructive",
            });
          }
        }
      }

      // 3. บันทึกการเคลื่อนไหว (Product Deletion Movement)
      const { error: movementError } = await supabase
        .from('inventory_movements')
        .insert({
          product_id: productId,
          movement_type: 'product_removed', // ประเภทการเคลื่อนไหวใหม่
          quantity: lastKnownStock, // บันทึกปริมาณสต็อกสุดท้ายก่อนลบ
          notes: `สินค้าถูกลบ: ${deletionNote}`, // ใช้หมายเหตุการลบที่บังคับ
          reference_type: 'product_deletion',
          created_by: userProfile.id // บันทึก ID ผู้ใช้ที่ทำการลบ
        });

      if (movementError) {
        console.error("Error recording deletion movement:", movementError.message);
        toast({
          title: "คำเตือน",
          description: `ไม่สามารถบันทึกประวัติการลบได้: ${movementError.message}`,
          variant: "destructive",
        });
      }

      // 4. ลบสินค้าออกจากฐานข้อมูล (Products table)
      const { error: productDeleteError } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (productDeleteError) throw productDeleteError;

      toast({ title: "สำเร็จ", description: "ลบสินค้าเรียบร้อย" });
      loadProducts(); // โหลดรายการสินค้าใหม่
      loadMovements(); // โหลดประวัติการเคลื่อนไหวใหม่
    } catch (error: any) {
      toast({
        title: "ข้อผิดพลาด",
        description: error.message || "ไม่สามารถลบสินค้าได้",
        variant: "destructive",
      });
    }
  };

  // ฟังก์ชันนี้จะถูกเรียกเมื่อผู้ใช้คลิกปุ่มลบ
  const handleDeleteProductClick = (product: Product) => {
    // ใช้ prompt เพื่อขอหมายเหตุการลบ (สามารถปรับเป็น Modal ที่สวยงามกว่านี้ได้)
    const deletionNote = prompt(
      `คุณแน่ใจหรือไม่ว่าต้องการลบสินค้า "${product.name}" (รหัส: ${product.code})?\n\n**กรุณาระบุเหตุผลในการลบ:**`
    );

    if (deletionNote !== null && deletionNote.trim() !== '') {
      // เรียกฟังก์ชัน deleteProduct พร้อมหมายเหตุ
      deleteProduct(product.id, product.imageUrl, deletionNote.trim(), product.stock_quantity);
    } else if (deletionNote === '') {
      toast({
        title: "ข้อผิดพลาด",
        description: "กรุณาระบุเหตุผลในการลบสินค้า",
        variant: "destructive",
      });
    } else {
      // ผู้ใช้กด Cancel ใน prompt
      toast({
        title: "ยกเลิก",
        description: "การลบสินค้าถูกยกเลิก",
      });
    }
  };


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(amount);
  };

  const getStockStatus = (product: Product) => {
    if (product.stock_quantity === 0) {
      return <Badge variant="destructive">หมด</Badge>;
    } else if (product.stock_quantity <= product.min_stock_level) {
      // คุณอาจจะต้องกำหนด `variant="yellow"` หรือใช้ `className` แทนใน Badge component ของคุณ
      return <Badge className="bg-yellow-500 text-white hover:bg-yellow-500/80">ใกล้หมด</Badge>;
    }
    return <Badge variant="default">ปกติ</Badge>;
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleExportCSV = () => {
    const csvData = products.map(product => ({
      ID: product.id,
      ชื่อสินค้า: product.name,
      รหัสสินค้า: product.code,
      หมวดหมู่: product.category,
      ราคา: product.price,
      ต้นทุน: product.cost,
      จำนวนในสต็อก: product.stock_quantity,
      ระดับสต็อกขั้นต่ำ: product.min_stock_level,
      ยี่ห้อ: product.brand,
      รุ่น: product.model,
      คำอธิบาย: product.description,
      URL_รูปภาพ: product.imageUrl,
      ที่ตั้ง: product.location,
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'products_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "สำเร็จ", description: "ส่งออกข้อมูลสินค้าเป็น CSV เรียบร้อย" });
  };


  return (
    <div className="flex flex-col min-h-screen p-4">
      <h1 className="text-3xl font-bold mb-6 text-slate-800">การจัดการสินค้าคงคลัง</h1>

      {/* Product Summary and Actions */}
      <Card className="mb-6 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-medium">ภาพรวมสินค้า</CardTitle>
          <div className="flex space-x-2">
            {/* เปลี่ยนข้อความในปุ่ม Add Product */}
            <Button onClick={() => setIsAddProductModalOpen(true)} className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="h-4 w-4" />
              <span>รับสินค้าเข้าสาขา</span> {/* <-- เปลี่ยนตรงนี้ */}
            </Button>
            <Button onClick={handleExportCSV} variant="outline" className="flex items-center space-x-2 border-blue-600 text-blue-600 hover:bg-blue-50">
              <Download className="h-4 w-4" />
              <span>ส่งออก CSV</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md">
              <CardTitle className="text-md mb-2">จำนวนสินค้าทั้งหมด</CardTitle>
              <p className="text-3xl font-bold">{products.length}</p>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-green-500 to-green-600 text-white shadow-md">
              <CardTitle className="text-md mb-2">มูลค่าสินค้าในสต็อก (ประมาณ)</CardTitle>
              <p className="text-3xl font-bold">
                {formatCurrency(products.reduce((sum, p) => sum + (p.cost || 0) * p.stock_quantity, 0))}
              </p>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-md">
              <CardTitle className="text-md mb-2">สินค้าใกล้หมด</CardTitle>
              <p className="text-3xl font-bold">
                {products.filter(p => p.stock_quantity <= p.min_stock_level).length}
              </p>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Product List and Search */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow">
        <div className="lg:col-span-2 flex flex-col space-y-6">
          <Card className="shadow-lg flex-grow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-medium">รายการสินค้า</CardTitle>
              <Input
                type="text"
                placeholder="ค้นหาสินค้า (ชื่อ, รหัส, หมวดหมู่)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">กำลังโหลดสินค้า...</div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-8 text-slate-500">ไม่พบสินค้า</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredProducts.map((product) => (
                    <Card key={product.id} className="flex p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
                      {product.imageUrl && (
                        <div className="w-24 h-24 mr-4 flex-shrink-0">
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover rounded-md"
                          />
                        </div>
                      )}
                      <div className="flex-grow">
                        <h3 className="font-semibold text-lg text-slate-800">{product.name}</h3>
                        <p className="text-sm text-slate-600">รหัส: {product.code}</p>
                        <p className="text-sm text-slate-600">หมวดหมู่: {product.category}</p>
                        <p className="text-sm text-slate-600">ราคา: {formatCurrency(product.price)}</p>
                        <p className="text-sm text-slate-600">สต็อก: {product.stock_quantity}</p>
                        {product.location && (
                          <p className="text-sm text-slate-600">ที่ตั้ง: {product.location}</p>
                        )}
                        {getStockStatus(product)}
                        <div className="flex space-x-2 mt-3">
                          <Button size="sm" onClick={() => { setSelectedProduct(product); setIsEditProductModalOpen(true); }}>
                            <Edit className="h-4 w-4 mr-1" /> แก้ไข
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setReceiveProductId(product.id);
                              setIsReceivingProduct(true);
                            }}
                          >
                            <PlusCircle className="h-4 w-4 mr-1" /> รับเข้า
                          </Button>
                          {/* ปุ่มลบสินค้า - เรียกใช้ handleDeleteProductClick */}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteProductClick(product)}
                          >
                            <Trash2 className="h-4 w-4" /> ลบ
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Inventory Movement History */}
        <div className="lg:col-span-1 flex flex-col space-y-6">
          <Card className="shadow-lg flex-grow">
            <CardHeader>
              <CardTitle className="text-xl font-medium">ประวัติการเคลื่อนไหวสินค้า</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {movements.length === 0 ? (
                  <p className="text-center text-slate-500">ยังไม่มีการเคลื่อนไหว</p>
                ) : (
                  movements.map((movement) => (
                    <div key={movement.id} className="border-b pb-3 last:border-b-0 last:pb-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {/* แสดงไอคอนตาม movement_type */}
                          {movement.movement_type === 'in' && (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          )}
                          {movement.movement_type === 'out' && (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          )}
                          {movement.movement_type === 'product_removed' && ( // เพิ่มไอคอนสำหรับการลบ
                            <MinusCircle className="h-4 w-4 text-gray-500" />
                          )}
                          <span className="text-sm font-medium">{movement.product.name} ({movement.product.code})</span>
                        </div>
                        <span className={`text-sm font-medium ${
                          movement.movement_type === 'in' ? 'text-green-600' :
                          movement.movement_type === 'out' ? 'text-red-600' :
                          'text-gray-600' // สีสำหรับ 'product_removed'
                        }`}>
                          {/* แสดงปริมาณสำหรับการลบเป็นลบ หรือตามปกติ */}
                          {movement.movement_type === 'product_removed' ? `-${movement.quantity}` :
                           (movement.quantity > 0 ? '+' : '') + movement.quantity}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">
                        {new Date(movement.created_at).toLocaleString('th-TH')}
                      </p>
                      {movement.notes && (
                        <p className="text-xs text-slate-500 mt-1">หมายเหตุ: {movement.notes}</p>
                      )}
                      {movement.created_by_profile && (
                        <p className="text-xs text-slate-500">
                          โดย: {movement.created_by_profile.full_name}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Product Modal (เปลี่ยนเป็น รับสินค้าเข้าสาขา) */}
      <Dialog open={isAddProductModalOpen} onOpenChange={setIsAddProductModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>รับสินค้าเข้าสาขา</DialogTitle> {/* <-- เปลี่ยนตรงนี้ */}
          </DialogHeader>
          <form onSubmit={handleAddProduct} className="grid gap-4 py-4">
            <Label htmlFor="name">ชื่อสินค้า</Label>
            <Input
              id="name"
              value={newProduct.name || ''}
              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              required
            />
            <Label htmlFor="code">รหัสสินค้า</Label>
            <Input
              id="code"
              value={newProduct.code || ''}
              onChange={(e) => setNewProduct({ ...newProduct, code: e.target.value })}
              required
            />
            <Label htmlFor="category">หมวดหมู่</Label>
            <Input
              id="category"
              value={newProduct.category || ''}
              onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
              required
            />
            <Label htmlFor="price">ราคา</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              value={newProduct.price || ''}
              onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) })}
              required
            />
            <Label htmlFor="cost">ต้นทุน (ถ้ามี)</Label>
            <Input
              id="cost"
              type="number"
              step="0.01"
              value={newProduct.cost || ''}
              onChange={(e) => setNewProduct({ ...newProduct, cost: parseFloat(e.target.value) })}
            />
            <Label htmlFor="stock_quantity">จำนวนในสต็อกเริ่มต้น</Label>
            <Input
              id="stock_quantity"
              type="number"
              value={newProduct.stock_quantity || ''}
              onChange={(e) => setNewProduct({ ...newProduct, stock_quantity: parseInt(e.target.value) })}
              required
            />
            <Label htmlFor="min_stock_level">ระดับสต็อกขั้นต่ำ</Label>
            <Input
              id="min_stock_level"
              type="number"
              value={newProduct.min_stock_level || ''}
              onChange={(e) => setNewProduct({ ...newProduct, min_stock_level: parseInt(e.target.value) })}
              required
            />
            <Label htmlFor="brand">ยี่ห้อ</Label>
            <Input
              id="brand"
              value={newProduct.brand || ''}
              onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })}
            />
            <Label htmlFor="model">รุ่น</Label>
            <Input
              id="model"
              value={newProduct.model || ''}
              onChange={(e) => setNewProduct({ ...newProduct, model: e.target.value })}
            />
            <Label htmlFor="description">คำอธิบาย</Label>
            <Textarea
              id="description"
              value={newProduct.description || ''}
              onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
            />
            <Label htmlFor="location">ที่ตั้ง</Label>
            <Input
              id="location"
              value={newProduct.location || ''}
              onChange={(e) => setNewProduct({ ...newProduct, location: e.target.value })}
            />
            <Label htmlFor="imageUrl">รูปภาพสินค้า</Label>
            <Input
              id="imageUrl"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploadingImage}
            />
            {newProduct.imageUrl && (
              <img src={newProduct.imageUrl} alt="Preview" className="w-24 h-24 object-cover mt-2 rounded-md" />
            )}
            <DialogFooter>
              <Button type="submit" disabled={uploadingImage}>เพิ่มสินค้า</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Product Modal */}
      <Dialog open={isEditProductModalOpen} onOpenChange={setIsEditProductModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>แก้ไขสินค้า</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditProduct} className="grid gap-4 py-4">
            <Label htmlFor="edit-name">ชื่อสินค้า</Label>
            <Input
              id="edit-name"
              value={selectedProduct?.name || ''}
              onChange={(e) => setSelectedProduct({ ...selectedProduct!, name: e.target.value })}
              required
            />
            <Label htmlFor="edit-code">รหัสสินค้า</Label>
            <Input
              id="edit-code"
              value={selectedProduct?.code || ''}
              onChange={(e) => setSelectedProduct({ ...selectedProduct!, code: e.target.value })}
              required
            />
            <Label htmlFor="edit-category">หมวดหมู่</Label>
            <Input
              id="edit-category"
              value={selectedProduct?.category || ''}
              onChange={(e) => setSelectedProduct({ ...selectedProduct!, category: e.target.value })}
              required
            />
            <Label htmlFor="edit-price">ราคา</Label>
            <Input
              id="edit-price"
              type="number"
              step="0.01"
              value={selectedProduct?.price || ''}
              onChange={(e) => setSelectedProduct({ ...selectedProduct!, price: parseFloat(e.target.value) })}
              required
            />
            <Label htmlFor="edit-cost">ต้นทุน (ถ้ามี)</Label>
            <Input
              id="edit-cost"
              type="number"
              step="0.01"
              value={selectedProduct?.cost || ''}
              onChange={(e) => setSelectedProduct({ ...selectedProduct!, cost: parseFloat(e.target.value) })}
            />
            <Label htmlFor="edit-stock_quantity">จำนวนในสต็อก</Label>
            <Input
              id="edit-stock_quantity"
              type="number"
              value={selectedProduct?.stock_quantity || ''}
              onChange={(e) => setSelectedProduct({ ...selectedProduct!, stock_quantity: parseInt(e.target.value) })}
              required
              disabled // ไม่สามารถปรับสต็อกผ่านหน้าจอนี้ได้
            />
            <Label htmlFor="edit-min_stock_level">ระดับสต็อกขั้นต่ำ</Label>
            <Input
              id="edit-min_stock_level"
              type="number"
              value={selectedProduct?.min_stock_level || ''}
              onChange={(e) => setSelectedProduct({ ...selectedProduct!, min_stock_level: parseInt(e.target.value) })}
              required
            />
            <Label htmlFor="edit-brand">ยี่ห้อ</Label>
            <Input
              id="edit-brand"
              value={selectedProduct?.brand || ''}
              onChange={(e) => setSelectedProduct({ ...selectedProduct!, brand: e.target.value })}
            />
            <Label htmlFor="edit-model">รุ่น</Label>
            <Input
              id="edit-model"
              value={selectedProduct?.model || ''}
              onChange={(e) => setSelectedProduct({ ...selectedProduct!, model: e.target.value })}
            />
            <Label htmlFor="edit-description">คำอธิบาย</Label>
            <Textarea
              id="edit-description"
              value={selectedProduct?.description || ''}
              onChange={(e) => setSelectedProduct({ ...selectedProduct!, description: e.target.value })}
            />
            <Label htmlFor="edit-location">ที่ตั้ง</Label>
            <Input
              id="edit-location"
              value={selectedProduct?.location || ''}
              onChange={(e) => setSelectedProduct({ ...selectedProduct!, location: e.target.value })}
            />
            <Label htmlFor="edit-imageUrl">รูปภาพสินค้า</Label>
            <Input
              id="edit-imageUrl"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploadingImage}
            />
            {selectedProduct?.imageUrl && (
              <img src={selectedProduct.imageUrl} alt="Preview" className="w-24 h-24 object-cover mt-2 rounded-md" />
            )}
            <DialogFooter>
              <Button type="submit" disabled={uploadingImage}>บันทึกการแก้ไข</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Receive Product Modal */}
      <Dialog open={isReceivingProduct} onOpenChange={setIsReceivingProduct}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>รับสินค้าเข้าสต็อก</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Label htmlFor="product-to-receive">สินค้า</Label>
            <Select onValueChange={(value) => setReceiveProductId(value)} value={receiveProductId || ''}>
              <SelectTrigger id="product-to-receive">
                <SelectValue placeholder="เลือกสินค้า" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name} ({product.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Label htmlFor="receive-quantity">จำนวนที่รับเข้า</Label>
            <Input
              id="receive-quantity"
              type="number"
              value={receiveQuantity}
              onChange={(e) => setReceiveQuantity(parseInt(e.target.value) || '')}
              required
            />
            <Label htmlFor="receive-cost">ต้นทุนต่อหน่วย (สำหรับล็อตนี้)</Label>
            <Input
              id="receive-cost"
              type="number"
              step="0.01"
              value={receiveCost}
              onChange={(e) => setReceiveCost(parseFloat(e.target.value) || '')}
              required
            />
            <Label htmlFor="receive-notes">หมายเหตุ (ถ้ามี)</Label>
            <Textarea
              id="receive-notes"
              value={receiveNotes}
              onChange={(e) => setReceiveNotes(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button onClick={receiveProduct} disabled={!receiveProductId || receiveQuantity === '' || receiveCost === ''}>
              ยืนยันการรับเข้า
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventoryManagement;