// InventoryManagement.tsx
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
  is_active: boolean;
}

interface Movement {
  id: string;
  product_id: string;
  product: { name: string; code: string };
  movement_type: 'receive' | 'sale' | 'adjustment_in' | 'adjustment_out' | 'transfer_out' | 'transfer_in';
  quantity: number; // Quantity should be a number
  notes?: string;
  created_at: string;
  created_by?: string;
  created_by_profile?: { full_name: string };
  from_branch?: { name: string };
  to_branch?: { name: string };
  transfer_status?: string;
}

const InventoryManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductCode, setNewProductCode] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('');
  const [newProductPrice, setNewProductPrice] = useState<number | ''>('');
  const [newProductCost, setNewProductCost] = useState<number | ''>('');
  const [newProductMinStock, setNewProductMinStock] = useState<number | ''>('');

  const [isEditProductModalOpen, setIsEditProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editProductName, setEditProductName] = useState('');
  const [editProductCode, setEditProductCode] = useState('');
  const [editProductCategory, setEditProductCategory] = useState('');
  const [editProductPrice, setEditProductPrice] = useState<number | ''>('');
  const [editProductCost, setEditProductCost] = useState<number | ''>('');
  const [editProductMinStock, setEditProductMinStock] = useState<number | ''>('');

  const [isReceiveProductModalOpen, setIsReceiveProductModalOpen] = useState(false);
  const [receiveProductId, setReceiveProductId] = useState('');
  const [receiveQuantity, setReceiveQuantity] = useState<number | ''>('');
  const [receiveCost, setReceiveCost] = useState<number | ''>('');
  const [receiveNotes, setReceiveNotes] = useState('');

  const [movements, setMovements] = useState<Movement[]>([]);

  const loadProducts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      setProducts(data as Product[]);
    } catch (error: any) {
      console.error("Error loading products:", error.message);
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลสินค้าได้",
        variant: "destructive",
      });
    }
  }, [toast]);

  const loadMovements = useCallback(async () => {
    try {
      const { data: inventoryMovements, error: inventoryMovementsError } = await supabase
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
        .limit(50);

      if (inventoryMovementsError) {
        console.error("Supabase Error loading inventory movements:", inventoryMovementsError);
        throw inventoryMovementsError;
      }

      const { data: productTransfers, error: productTransfersError } = await supabase
        .from('product_transfers')
        .select(`
          id,
          product_id,
          products(name, code),
          from_branch:branches!from_branch_id(name),
          to_branch:branches!to_branch_id(name),
          transfer_date,
          quantity,
          status,
          notes,
          transferred_by_profile:profiles!transferred_by(full_name)
        `)
        .order('transfer_date', { ascending: false })
        .limit(50);

      if (productTransfersError) {
        console.error("Supabase Error loading product transfers:", productTransfersError);
        throw productTransfersError;
      }

      const transferMovements: Movement[] = (productTransfers || []).flatMap((transfer: any) => {
        const productInfo = transfer.products || { name: 'Unknown Product', code: 'N/A' };
        const createdByProfile = transfer.transferred_by_profile || { full_name: 'Unknown User' };

        const movements: Movement[] = [];

        // Cast quantity to number if it might be null or undefined from DB to satisfy TypeScript
        const transferQuantityNum = typeof transfer.quantity === 'number' ? transfer.quantity : 0;

        // รายการโอนออก (จากสาขาต้นทาง)
        movements.push({
          id: transfer.id + '-out',
          product_id: transfer.product_id,
          product: { name: productInfo.name, code: productInfo.code },
          movement_type: 'transfer_out',
          quantity: transferQuantityNum,
          notes: transfer.notes || `โอนออกไปสาขา ${transfer.to_branch?.name}`,
          created_at: transfer.transfer_date,
          created_by_profile: createdByProfile,
          from_branch: transfer.from_branch,
          to_branch: transfer.to_branch,
          transfer_status: transfer.status,
        });

        // รายการโอนเข้า (ไปยังสาขาปลายทาง)
        // คุณอาจต้องการกรองตรงนี้ถ้าต้องการแสดงเฉพาะการโอนเข้าที่เกี่ยวข้องกับสาขาปัจจุบัน
        movements.push({
          id: transfer.id + '-in',
          product_id: transfer.product_id,
          product: { name: productInfo.name, code: productInfo.code },
          movement_type: 'transfer_in',
          quantity: transferQuantityNum,
          notes: transfer.notes || `รับโอนจากสาขา ${transfer.from_branch?.name}`,
          created_at: transfer.transfer_date,
          created_by_profile: createdByProfile,
          from_branch: transfer.from_branch,
          to_branch: transfer.to_branch,
          transfer_status: transfer.status,
        });

        return movements;
      });

      const allMovements = [
        ...(inventoryMovements as Movement[]),
        ...transferMovements
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setMovements(allMovements);

    } catch (error: any) {
      console.error("Error loading movements:", error.message);
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถโหลดประวัติการเคลื่อนไหวได้: " + error.message,
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    loadProducts();
    loadMovements();
  }, [loadProducts, loadMovements]);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddProduct = async () => {
    if (!newProductName || !newProductCode || !newProductCategory || newProductPrice === '' || newProductMinStock === '') {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณากรอกข้อมูลสินค้าให้ครบถ้วน",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .insert({
          name: newProductName,
          code: newProductCode,
          category: newProductCategory,
          price: newProductPrice,
          cost: newProductCost === '' ? null : newProductCost,
          stock_quantity: 0,
          min_stock_level: newProductMinStock,
          is_active: true,
        })
        .select();

      if (error) throw error;

      toast({
        title: "เพิ่มสินค้าสำเร็จ",
        description: `${newProductName} ถูกเพิ่มเข้าสู่ระบบแล้ว`,
      });
      setIsAddProductModalOpen(false);
      setNewProductName('');
      setNewProductCode('');
      setNewProductCategory('');
      setNewProductPrice('');
      setNewProductCost('');
      setNewProductMinStock('');
      loadProducts();
    } catch (error: any) {
      console.error("Error adding product:", error.message);
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถเพิ่มสินค้าได้: " + error.message,
        variant: "destructive",
      });
    }
  };

  const handleEditProduct = async () => {
    if (!editingProduct || !editProductName || !editProductCode || !editProductCategory || editProductPrice === '' || editProductMinStock === '') {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณากรอกข้อมูลสินค้าให้ครบถ้วน",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .update({
          name: editProductName,
          code: editProductCode,
          category: editProductCategory,
          price: editProductPrice,
          cost: editProductCost === '' ? null : editProductCost,
          min_stock_level: editProductMinStock,
        })
        .eq('id', editingProduct.id)
        .select();

      if (error) throw error;

      toast({
        title: "แก้ไขสินค้าสำเร็จ",
        description: `${editProductName} ถูกแก้ไขแล้ว`,
      });
      setIsEditProductModalOpen(false);
      setEditingProduct(null);
      loadProducts();
    } catch (error: any) {
      console.error("Error editing product:", error.message);
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถแก้ไขสินค้าได้: " + error.message,
        variant: "destructive",
      });
    }
  };

  const openEditProductModal = (product: Product) => {
    setEditingProduct(product);
    setEditProductName(product.name);
    setEditProductCode(product.code);
    setEditProductCategory(product.category);
    setEditProductPrice(product.price);
    setEditProductCost(product.cost || '');
    setEditProductMinStock(product.min_stock_level);
    setIsEditProductModalOpen(true);
  };

  const receiveProduct = async () => {
    if (!receiveProductId || receiveQuantity === '' || receiveCost === '') {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณากรอกข้อมูลรับเข้าให้ครบถ้วน",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: currentProductData, error: currentProductError } = await supabase
        .from('products')
        .select('stock_quantity, cost')
        .eq('id', receiveProductId)
        .single();

      if (currentProductError) throw currentProductError;

      const currentStock = currentProductData.stock_quantity;
      const currentCost = currentProductData.cost || 0;

      const newTotalQuantity = currentStock + receiveQuantity;
      const newTotalCost = (currentStock * currentCost) + (receiveQuantity * receiveCost);
      const newAverageCost = newTotalQuantity > 0 ? newTotalCost / newTotalQuantity : 0;

      const { error: updateError } = await supabase
        .from('products')
        .update({
          stock_quantity: newTotalQuantity,
          cost: newAverageCost,
        })
        .eq('id', receiveProductId);

      if (updateError) throw updateError;

      const { error: movementError } = await supabase
        .from('inventory_movements')
        .insert({
          product_id: receiveProductId,
          movement_type: 'receive',
          quantity: receiveQuantity,
          notes: receiveNotes,
          created_by: user?.id,
          branch_id: user?.branch_id,
        });

      if (movementError) throw movementError;

      toast({
        title: "รับสินค้าเข้าสำเร็จ",
        description: `สินค้าถูกรับเข้าจำนวน ${receiveQuantity} ชิ้น`,
      });
      setIsReceiveProductModalOpen(false);
      setReceiveProductId('');
      setReceiveQuantity('');
      setReceiveCost('');
      setReceiveNotes('');
      loadProducts();
      loadMovements();
    } catch (error: any) {
      console.error("Error receiving product:", error.message);
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถรับสินค้าเข้าได้: " + error.message,
        variant: "destructive",
      });
    }
  };

  const exportProductsToCsv = () => {
    const dataToExport = products.map(product => ({
      'รหัสสินค้า': product.code,
      'ชื่อสินค้า': product.name,
      'หมวดหมู่': product.category,
      'ราคาขาย': product.price,
      'ต้นทุนเฉลี่ย': product.cost || '-',
      'สต็อกคงเหลือ': product.stock_quantity,
      'ระดับสต็อกต่ำสุด': product.min_stock_level,
      'ยี่ห้อ': product.brand || '-',
      'รุ่น': product.model || '-',
      'รายละเอียด': product.description || '-',
    }));

    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'products_inventory.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getMovementColor = (type: string) => {
    switch (type) {
      case 'receive':
      case 'adjustment_in':
      case 'transfer_in':
        return 'text-green-600';
      case 'sale':
      case 'adjustment_out':
      case 'transfer_out':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">การจัดการคลังสินค้า</h1>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">รายการสินค้า</CardTitle>
          <div className="flex items-center space-x-2">
            <Button onClick={exportProductsToCsv} variant="outline">
              <Download className="h-4 w-4 mr-2" /> ส่งออก CSV
            </Button>
            <Dialog open={isReceiveProductModalOpen} onOpenChange={setIsReceiveProductModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <PlusCircle className="h-4 w-4 mr-2" /> รับสินค้าเข้า
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>รับสินค้าเข้าคลัง</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <Label htmlFor="product-select">สินค้า</Label>
                  <Select onValueChange={setReceiveProductId} value={receiveProductId}>
                    <SelectTrigger id="product-select">
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

            <Dialog open={isAddProductModalOpen} onOpenChange={setIsAddProductModalOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" /> เพิ่มสินค้าใหม่
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>เพิ่มสินค้าใหม่</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <Label htmlFor="new-product-name">ชื่อสินค้า</Label>
                  <Input
                    id="new-product-name"
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    required
                  />
                  <Label htmlFor="new-product-code">รหัสสินค้า</Label>
                  <Input
                    id="new-product-code"
                    value={newProductCode}
                    onChange={(e) => setNewProductCode(e.target.value)}
                    required
                  />
                  <Label htmlFor="new-product-category">หมวดหมู่</Label>
                  <Input
                    id="new-product-category"
                    value={newProductCategory}
                    onChange={(e) => setNewProductCategory(e.target.value)}
                    required
                  />
                  <Label htmlFor="new-product-price">ราคาขาย</Label>
                  <Input
                    id="new-product-price"
                    type="number"
                    step="0.01"
                    value={newProductPrice}
                    onChange={(e) => setNewProductPrice(parseFloat(e.target.value) || '')}
                    required
                  />
                  <Label htmlFor="new-product-cost">ต้นทุน (ถ้ามี)</Label>
                  <Input
                    id="new-product-cost"
                    type="number"
                    step="0.01"
                    value={newProductCost}
                    onChange={(e) => setNewProductCost(parseFloat(e.target.value) || '')}
                  />
                  <Label htmlFor="new-product-min-stock">ระดับสต็อกต่ำสุด</Label>
                  <Input
                    id="new-product-min-stock"
                    type="number"
                    value={newProductMinStock}
                    onChange={(e) => setNewProductMinStock(parseInt(e.target.value) || '')}
                    required
                  />
                </div>
                <DialogFooter>
                  <Button onClick={handleAddProduct}>เพิ่มสินค้า</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="ค้นหาสินค้าด้วยชื่อ, รหัส, หมวดหมู่..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="grid gap-4">
            {filteredProducts.length === 0 ? (
              <p className="text-center text-gray-500">ไม่พบสินค้า</p>
            ) : (
              filteredProducts.map((product) => (
                <Card key={product.id} className="p-4 flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-lg">{product.name} ({product.code})</h3>
                    <p className="text-sm text-gray-600">หมวดหมู่: {product.category}</p>
                    <p className="text-sm text-gray-600">ราคาขาย: {product.price.toFixed(2)} บาท</p>
                    {product.cost !== null && product.cost !== undefined && (
                      <p className="text-sm text-gray-600">ต้นทุนเฉลี่ย: {product.cost.toFixed(2)} บาท</p>
                    )}
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline">สต็อก: {product.stock_quantity}</Badge>
                      {product.stock_quantity <= product.min_stock_level && (
                        <Badge variant="destructive" className="flex items-center">
                          <AlertTriangle className="h-3 w-3 mr-1" /> สต็อกต่ำ
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => openEditProductModal(product)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {editingProduct && (
        <Dialog open={isEditProductModalOpen} onOpenChange={setIsEditProductModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>แก้ไขสินค้า: {editingProduct.name}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Label htmlFor="edit-product-name">ชื่อสินค้า</Label>
              <Input
                id="edit-product-name"
                value={editProductName}
                onChange={(e) => setEditProductName(e.target.value)}
                required
              />
              <Label htmlFor="edit-product-code">รหัสสินค้า</Label>
              <Input
                id="edit-product-code"
                value={editProductCode}
                onChange={(e) => setEditProductCode(e.target.value)}
                required
              />
              <Label htmlFor="edit-product-category">หมวดหมู่</Label>
              <Input
                id="edit-product-category"
                value={editProductCategory}
                onChange={(e) => setEditProductCategory(e.target.value)}
                required
              />
              <Label htmlFor="edit-product-price">ราคาขาย</Label>
              <Input
                id="edit-product-price"
                type="number"
                step="0.01"
                value={editProductPrice}
                onChange={(e) => setEditProductPrice(parseFloat(e.target.value) || '')}
                required
              />
              <Label htmlFor="edit-product-cost">ต้นทุน (ถ้ามี)</Label>
              <Input
                id="edit-product-cost"
                type="number"
                step="0.01"
                value={editProductCost}
                onChange={(e) => setEditProductCost(parseFloat(e.target.value) || '')}
              />
              <Label htmlFor="edit-product-min-stock">ระดับสต็อกต่ำสุด</Label>
              <Input
                id="edit-product-min-stock"
                type="number"
                value={editProductMinStock}
                onChange={(e) => setNewProductMinStock(parseInt(e.target.value) || '')}
                required
              />
            </div>
            <DialogFooter>
              <Button onClick={handleEditProduct}>บันทึกการแก้ไข</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Inventory Movement History */}
      <Card>
        <CardHeader>
          <CardTitle>ประวัติการเคลื่อนไหวสินค้า</CardTitle>
        </CardHeader>
        <CardContent>
          {movements.length === 0 ? (
            <p className="text-center text-gray-500">ยังไม่มีประวัติการเคลื่อนไหวสินค้า</p>
          ) : (
            <div className="space-y-4">
              {movements.map((movement) => (
                <div key={movement.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {movement.movement_type === 'receive' || movement.movement_type === 'adjustment_in' ? (
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    ) : movement.movement_type === 'transfer_in' ? (
                      <PlusCircle className="h-5 w-5 text-blue-600" />
                    ) : movement.movement_type === 'transfer_out' ? (
                      <MinusCircle className="h-5 w-5 text-orange-600" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-red-600" />
                    )}
                    <div>
                      <p className="font-medium">
                        {movement.movement_type === 'receive' && `รับเข้า: `}
                        {movement.movement_type === 'sale' && `ขายออก: `}
                        {movement.movement_type === 'adjustment_in' && `ปรับสต็อกเพิ่ม: `}
                        {movement.movement_type === 'adjustment_out' && `ปรับสต็อกลด: `}
                        {movement.movement_type === 'transfer_out' && `โอนออก: `}
                        {movement.movement_type === 'transfer_in' && `โอนเข้า: `}
                        {movement.product.name} ({movement.product.code})
                      </p>
                      <div className="flex items-center space-x-2 text-sm text-slate-600">
                        <Badge variant="outline">
                          {movement.movement_type === 'receive' && 'รับสินค้า'}
                          {movement.movement_type === 'sale' && 'ขายสินค้า'}
                          {movement.movement_type === 'adjustment_in' && 'ปรับสต็อกเพิ่ม'}
                          {movement.movement_type === 'adjustment_out' && 'ปรับสต็อกลด'}
                          {movement.movement_type === 'transfer_out' && 'โอนออก'}
                          {movement.movement_type === 'transfer_in' && 'โอนเข้า'}
                        </Badge>
                        <span>จำนวน: {movement.quantity || 0} ชิ้น</span>
                        {movement.movement_type.startsWith('transfer_') && (
                          <>
                            {movement.from_branch && <span>จาก: {movement.from_branch.name}</span>}
                            {movement.to_branch && <span>ไป: {movement.to_branch.name}</span>}
                            {movement.transfer_status && <Badge variant="secondary">สถานะ: {movement.transfer_status}</Badge>}
                          </>
                        )}
                        {movement.notes && <span className="italic">({movement.notes})</span>}
                        <span className="text-sm text-slate-600">
                          {new Date(movement.created_at).toLocaleDateString('th-TH')}
                        </span>
                        {movement.created_by_profile && (
                          <span className="text-sm text-slate-500">
                            (โดย: {movement.created_by_profile.full_name})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${getMovementColor(movement.movement_type)}`}>
                      {movement.movement_type === 'receive' || movement.movement_type === 'adjustment_in' || movement.movement_type === 'transfer_in'
                        ? `+${movement.quantity || 0}`
                        : `-${movement.quantity || 0}`} ชิ้น
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

export default InventoryManagement;