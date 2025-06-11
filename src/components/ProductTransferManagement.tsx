
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
  transfer_date: string;
  notes: string | null;
  products: Product;
  from_branch: Branch | null;
  to_branch: Branch;
  transferred_by_profile: { full_name: string } | null;
}

const ProductTransferManagement = () => {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    product_id: '',
    to_branch_id: '',
    notes: ''
  });
  const { userProfile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [transfersData, productsData, branchesData] = await Promise.all([
        supabase
          .from('product_transfers')
          .select(`
            *,
            products(id, name, code, serial_number),
            from_branch:branches!from_branch_id(id, name),
            to_branch:branches!to_branch_id(id, name),
            transferred_by_profile:profiles!transferred_by(full_name)
          `)
          .order('created_at', { ascending: false }),
        supabase
          .from('products')
          .select('id, name, code, serial_number')
          .order('name'),
        supabase
          .from('branches')
          .select('id, name')
          .order('name')
      ]);

      if (transfersData.error) throw transfersData.error;
      if (productsData.error) throw productsData.error;
      if (branchesData.error) throw branchesData.error;

      setTransfers(transfersData.data || []);
      setProducts(productsData.data || []);
      setBranches(branchesData.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        variant: "destructive",
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลได้",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // หาสาขาปัจจุบันของสินค้า
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('branch_id')
        .eq('id', formData.product_id)
        .single();

      if (productError) throw productError;

      const { error } = await supabase
        .from('product_transfers')
        .insert([{
          ...formData,
          from_branch_id: productData.branch_id,
          transferred_by: userProfile?.id,
        }]);

      if (error) throw error;
      
      toast({
        title: "สร้างคำขอโอนสำเร็จ",
        description: "คำขอโอนสินค้าได้รับการสร้างแล้ว",
      });

      setFormData({ product_id: '', to_branch_id: '', notes: '' });
      setIsCreateDialogOpen(false);
      loadData();
    } catch (error) {
      console.error('Error creating transfer:', error);
      toast({
        variant: "destructive",
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถสร้างคำขอโอนได้",
      });
    }
  };

  const handleCompleteTransfer = async (transferId: string, productId: string, toBranchId: string) => {
    try {
      // อัปเดตสถานะการโอนและสาขาของสินค้า
      const { error: transferError } = await supabase
        .from('product_transfers')
        .update({ 
          status: 'completed',
          received_by: userProfile?.id 
        })
        .eq('id', transferId);

      if (transferError) throw transferError;

      const { error: productError } = await supabase
        .from('products')
        .update({ branch_id: toBranchId })
        .eq('id', productId);

      if (productError) throw productError;

      toast({
        title: "โอนสินค้าสำเร็จ",
        description: "การโอนสินค้าเสร็จสมบูรณ์",
      });

      loadData();
    } catch (error) {
      console.error('Error completing transfer:', error);
      toast({
        variant: "destructive",
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถทำการโอนได้",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">รอดำเนินการ</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">เสร็จสิ้น</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">ยกเลิก</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">กำลังโหลด...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-black">การโอนสินค้า</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-red-600 hover:bg-red-700">
              <Plus className="h-4 w-4 mr-2" />
              สร้างคำขอโอน
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>สร้างคำขอโอนสินค้า</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  เลือกสินค้า
                </label>
                <Select value={formData.product_id} onValueChange={(value) => 
                  setFormData({ ...formData, product_id: value })
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกสินค้า" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} ({product.code}) - SN: {product.serial_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  โอนไปยังสาขา
                </label>
                <Select value={formData.to_branch_id} onValueChange={(value) => 
                  setFormData({ ...formData, to_branch_id: value })
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกสาขาปลายทาง" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  หมายเหตุ
                </label>
                <textarea
                  className="w-full p-2 border rounded-md"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)"
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="bg-red-600 hover:bg-red-700">
                  สร้างคำขอ
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  ยกเลิก
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {transfers.map((transfer) => (
          <Card key={transfer.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ArrowRightLeft className="h-5 w-5 text-red-600" />
                  <CardTitle className="text-lg text-black">
                    {transfer.products.name} ({transfer.products.code})
                  </CardTitle>
                </div>
                {getStatusBadge(transfer.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4 text-gray-600" />
                  <span className="text-sm text-black">
                    Serial: {transfer.products.serial_number}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Building2 className="h-4 w-4 text-gray-600" />
                  <span className="text-sm text-black">
                    จาก: {transfer.from_branch?.name || 'ไม่ระบุ'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Building2 className="h-4 w-4 text-gray-600" />
                  <span className="text-sm text-black">
                    ไป: {transfer.to_branch.name}
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
    </div>
  );
};

export default ProductTransferManagement;
