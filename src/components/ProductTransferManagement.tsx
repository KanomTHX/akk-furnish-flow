import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ArrowRightLeft, Plus, Package, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: string;
  name: string;
  code: string;
  serial_number: string;
}

interface Branch {
  id: string;
  name: string;
}

interface Transfer {
  id: string;
  product_id: string;
  from_branch_id: string | null;
  to_branch_id: string;
  status: string;
  transfer_quantity: number; // เพิ่ม transfer_quantity
  transfer_date: string;
  notes: string | null;
  products: Product | null; // เปลี่ยนเป็น Product | null
  from_branch: Branch | null;
  to_branch: Branch | null; // สามารถเป็น null ได้ถ้า branch นั้นถูกลบไปแล้ว
  transferred_by_profile: { full_name: string } | null;
}

const ProductTransferManagement = () => {
  const { toast } = useToast();
  const { user, userProfile, loading: authLoading } = useAuth(); // ดึง user และ userProfile มาใช้งาน
  const [products, setProducts] = useState<Product[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [transferQuantity, setTransferQuantity] = useState<number | ''>(1);
  const [toBranchId, setToBranchId] = useState<string>('');
  const [transferNotes, setTransferNotes] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch products (adjust query if needed, e.g., filter by current branch stock)
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, name, code, serial_number');

      if (productsError) throw productsError;
      setProducts(productsData || []);

      // Fetch branches
      const { data: branchesData, error: branchesError } = await supabase
        .from('branches')
        .select('id, name');

      if (branchesError) throw branchesError;
      setBranches(branchesData || []);

      // Fetch transfers
      const { data: transfersData, error: transfersError } = await supabase
        .from('product_transfers')
        .select(`
          id, product_id, from_branch_id, to_branch_id, status, transfer_quantity, transfer_date, notes, transferred_by,
          products (id, name, code, serial_number),
          from_branch:from_branch_id (id, name),
          to_branch:to_branch_id (id, name),
          transferred_by_profile:profiles!transferred_by (full_name)
        `)
        .order('transfer_date', { ascending: false });

      if (transfersError) throw transfersError;
      setTransfers(transfersData || []);

    } catch (error: any) {
      toast({
        title: "ข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      });
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // โหลดข้อมูลเมื่อคอมโพเนนต์ mount หรือเมื่อ userProfile.branch_id เปลี่ยน (เพื่อให้แน่ใจว่าได้ branch_id แล้ว)
    if (!authLoading) { // โหลดข้อมูลหลังจากที่ useAuth โหลดเสร็จแล้ว
      loadData();
    }
  }, [authLoading]); // Trigger เมื่อ authLoading เปลี่ยนแปลง

  const handleCreateTransfer = async () => {
    if (!selectedProductId || transferQuantity === '' || transferQuantity <= 0 || !toBranchId) {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณากรอกข้อมูลให้ครบถ้วนและถูกต้อง (สินค้า, จำนวน > 0, สาขาปลายทาง)",
        variant: "destructive",
      });
      return;
    }

    // ตรวจสอบ branch_id ของผู้ใช้จาก userProfile
    if (!userProfile?.branch_id) { 
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถระบุสาขาต้นทางได้ กรุณาเข้าสู่ระบบใหม่",
        variant: "destructive",
      });
      return;
    }

    const from_branch_id = userProfile.branch_id; // ใช้ branch_id จาก userProfile
    const transferred_by_user_id = user?.id; // ใช้ user.id จาก Supabase auth.user

    if (from_branch_id === toBranchId) {
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถโอนสินค้าไปยังสาขาเดียวกันได้",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // 1. ตรวจสอบสต็อกสินค้าในสาขาต้นทาง
      const { data: productStock, error: stockError } = await supabase
        .from('product_stock')
        .select('quantity')
        .eq('product_id', selectedProductId)
        .eq('branch_id', from_branch_id)
        .single();

      if (stockError && stockError.code !== 'PGRST116') throw stockError; // PGRST116 = no rows found
      if (!productStock || productStock.quantity < transferQuantity) {
        toast({
          title: "สต็อกไม่เพียงพอ",
          description: "จำนวนสินค้าในสต็อกสาขาต้นทางไม่เพียงพอสำหรับการโอน",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // 2. สร้างรายการโอน
      const { data: newTransfer, error: transferError } = await supabase
        .from('product_transfers')
        .insert({
          product_id: selectedProductId,
          from_branch_id: from_branch_id,
          to_branch_id: toBranchId,
          transfer_quantity: transferQuantity,
          status: 'pending', // สถานะเริ่มต้นเป็น 'pending' (รอดำเนินการ)
          transfer_date: new Date().toISOString(),
          notes: transferNotes,
          transferred_by: transferred_by_user_id, // เก็บ User ID ที่โอน
        })
        .select()
        .single();

      if (transferError) throw transferError;

      // 3. ลดสต็อกสินค้าในสาขาต้นทาง
      const { error: updateFromStockError } = await supabase
        .rpc('decrease_product_stock', {
          p_product_id: selectedProductId,
          p_branch_id: from_branch_id,
          p_quantity_to_decrease: transferQuantity,
        });

      if (updateFromStockError) throw updateFromStockError;

      toast({
        title: "สร้างรายการโอนสำเร็จ",
        description: `สร้างรายการโอนสินค้า ${selectedProductId} จำนวน ${transferQuantity} ชิ้นไปยังสาขา ${toBranchId} แล้ว`,
      });

      setIsTransferModalOpen(false); // ปิด modal
      setSelectedProductId('');
      setTransferQuantity(1);
      setToBranchId('');
      setTransferNotes('');
      loadData(); // โหลดข้อมูลใหม่
    } catch (error: any) {
      toast({
        title: "ข้อผิดพลาดในการสร้างรายการโอน",
        description: error.message,
        variant: "destructive",
      });
      console.error("Error creating transfer:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTransfer = async (transferId: string, productId: string, toBranchId: string) => {
    setLoading(true);
    try {
      // 1. รับข้อมูลการโอน
      const { data: transferToComplete, error: fetchTransferError } = await supabase
        .from('product_transfers')
        .select('transfer_quantity, status')
        .eq('id', transferId)
        .single();

      if (fetchTransferError) throw fetchTransferError;

      if (transferToComplete.status !== 'pending') {
        toast({
          title: "สถานะไม่ถูกต้อง",
          description: "รายการโอนนี้ไม่อยู่ในสถานะ 'รอดำเนินการ'",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const quantityToIncrease = transferToComplete.transfer_quantity;

      // 2. เพิ่มสต็อกสินค้าในสาขาปลายทาง
      const { error: updateToStockError } = await supabase
        .rpc('increase_product_stock', {
          p_product_id: productId,
          p_branch_id: toBranchId,
          p_quantity_to_increase: quantityToIncrease,
        });

      if (updateToStockError) throw updateToStockError;

      // 3. อัปเดตสถานะการโอนเป็น 'completed'
      const { error: updateTransferError } = await supabase
        .from('product_transfers')
        .update({ status: 'completed' })
        .eq('id', transferId);

      if (updateTransferError) throw updateTransferError;

      toast({
        title: "ยืนยันการรับสินค้าสำเร็จ",
        description: "รายการโอนได้รับการยืนยันและสต็อกสินค้าในสาขาปลายทางได้รับการอัปเดตแล้ว",
      });
      loadData(); // โหลดข้อมูลใหม่
    } catch (error: any) {
      toast({
        title: "ข้อผิดพลาดในการยืนยันรับสินค้า",
        description: error.message,
        variant: "destructive",
      });
      console.error("Error completing transfer:", error);
    } finally {
      setLoading(false);
    }
  };

  // แสดง loading state รวมของ auth และ data loading
  if (authLoading || loading) {
    return <div className="p-6 text-center text-slate-500">กำลังโหลดข้อมูล...</div>;
  }

  // กรองรายการโอนที่เกี่ยวข้องกับสาขาปัจจุบันของผู้ใช้เท่านั้น
  const currentBranchTransfers = transfers.filter(
    (t) => t.from_branch_id === userProfile?.branch_id || t.to_branch_id === userProfile?.branch_id
  );
  
  const transfersFromCurrentBranch = currentBranchTransfers.filter(
    (t) => t.from_branch_id === userProfile?.branch_id
  );

  const transfersToCurrentBranchPending = currentBranchTransfers.filter(
    (t) => t.to_branch_id === userProfile?.branch_id && t.status === 'pending'
  );


  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <ArrowRightLeft className="h-6 w-6 text-furniture-500" />
          <h2 className="text-2xl font-bold text-slate-900">จัดการการโอนสินค้า</h2>
        </div>
        <Dialog open={isTransferModalOpen} onOpenChange={setIsTransferModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-furniture-500 hover:bg-furniture-600">
              <Plus className="h-4 w-4 mr-2" />
              สร้างรายการโอนสินค้า
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>สร้างรายการโอนสินค้าใหม่</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <label htmlFor="product-select" className="block text-sm font-medium text-gray-700">
                  เลือกสินค้าที่ต้องการโอน
                </label>
                <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                  <SelectTrigger id="product-select" className="w-full">
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
              </div>
              <div>
                <label htmlFor="transfer-quantity" className="block text-sm font-medium text-gray-700">
                  จำนวนชิ้นที่ต้องการโอน
                </label>
                <input
                  id="transfer-quantity"
                  type="number"
                  value={transferQuantity}
                  onChange={(e) => setTransferQuantity(parseInt(e.target.value) || '')}
                  min="1"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-furniture-500 focus:ring-furniture-500 sm:text-sm p-2 border"
                />
              </div>
              <div>
                <label htmlFor="to-branch-select" className="block text-sm font-medium text-gray-700">
                  โอนไปที่สาขา
                </label>
                <Select value={toBranchId} onValueChange={setToBranchId}>
                  <SelectTrigger id="to-branch-select" className="w-full">
                    <SelectValue placeholder="เลือกสาขาปลายทาง" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches
                      .filter(branch => branch.id !== userProfile?.branch_id) // กรองสาขาต้นทางออก
                      .map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label htmlFor="transfer-notes" className="block text-sm font-medium text-gray-700">
                  หมายเหตุ (ถ้ามี)
                </label>
                <textarea
                  id="transfer-notes"
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-furniture-500 focus:ring-furniture-500 sm:text-sm p-2 border"
                ></textarea>
              </div>
              <Button
                onClick={handleCreateTransfer}
                className="w-full bg-green-500 hover:bg-green-600"
                disabled={!selectedProductId || transferQuantity === '' || transferQuantity <= 0 || !toBranchId}
              >
                สร้างรายการโอน
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              รายการโอนสินค้า "ออก" จากสาขาของคุณ
            </CardTitle>
          </CardHeader>
          <CardContent>
            {transfersFromCurrentBranch.length === 0 ? (
              <p className="text-center text-slate-500">ไม่มีรายการโอนออก</p>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {transfersFromCurrentBranch.map((transfer) => (
                  <Card key={transfer.id} className="border-l-4 border-furniture-500">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-lg">{transfer.products?.name} ({transfer.products?.code})</span>
                        <Badge variant={transfer.status === 'completed' ? 'default' : 'secondary'}>
                          {transfer.status === 'pending' ? 'รอดำเนินการ' : 'เสร็จสิ้น'}
                        </Badge>
                      </div>
                      <p className="text-gray-700">จำนวน: {transfer.transfer_quantity} ชิ้น</p>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Building2 className="h-4 w-4 text-gray-600" />
                          <span className="text-sm text-black">
                            จาก: {transfer.from_branch?.name || 'ไม่ระบุ'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Building2 className="h-4 w-4 text-gray-600" />
                          <span className="text-sm text-black">
                            ไป: {transfer.to_branch?.name || 'ไม่ระบุ'}
                          </span>
                        </div>
                      </div>
                      
                      {transfer.notes && (
                        <div className="text-sm text-gray-600">
                          หมายเหตุ: {transfer.notes}
                        </div>
                      )}

                      <div className="text-xs text-gray-500">
                        โอนโดย: {transfer.transferred_by_profile?.full_name || 'ไม่ระบุ'} | 
                        วันที่: {new Date(transfer.transfer_date).toLocaleDateString('th-TH')}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              รายการโอนสินค้า "เข้า" สาขาของคุณ (รอดำเนินการ)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {transfersToCurrentBranchPending.length === 0 ? (
              <p className="text-center text-slate-500">ไม่มีรายการโอนสินค้ารอรับ</p>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {transfersToCurrentBranchPending.map((transfer) => (
                  <Card key={transfer.id} className="border-l-4 border-green-600">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-lg">{transfer.products?.name} ({transfer.products?.code})</span>
                        <Badge variant="secondary">รอดำเนินการ</Badge>
                      </div>
                      <p className="text-gray-700">จำนวน: {transfer.transfer_quantity} ชิ้น</p>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Building2 className="h-4 w-4 text-gray-600" />
                          <span className="text-sm text-black">
                            จาก: {transfer.from_branch?.name || 'ไม่ระบุ'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Building2 className="h-4 w-4 text-gray-600" />
                          <span className="text-sm text-black">
                            ไป: {transfer.to_branch?.name || 'ไม่ระบุ'}
                          </span>
                        </div>
                      </div>
                      
                      {transfer.notes && (
                        <div className="text-sm text-gray-600">
                          หมายเหตุ: {transfer.notes}
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                          โอนโดย: {transfer.transferred_by_profile?.full_name || 'ไม่ระบุ'} | 
                          วันที่: {new Date(transfer.transfer_date).toLocaleDateString('th-TH')}
                        </div>
                        
                        {transfer.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => handleCompleteTransfer(transfer.id, transfer.product_id, transfer.to_branch_id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            ยืนยันรับสินค้า
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProductTransferManagement;