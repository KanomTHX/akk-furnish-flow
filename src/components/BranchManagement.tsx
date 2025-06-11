
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Building2, Plus, Edit, Phone, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Branch {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  manager_id: string | null;
  manager_name?: string;
  created_at: string;
}

const BranchManagement = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select(`
          *,
          profiles!manager_id(full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const branchesWithManager = data?.map(branch => ({
        ...branch,
        manager_name: branch.profiles?.full_name || null
      })) || [];

      setBranches(branchesWithManager);
    } catch (error) {
      console.error('Error loading branches:', error);
      toast({
        variant: "destructive",
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลสาขาได้",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingBranch) {
        const { error } = await supabase
          .from('branches')
          .update(formData)
          .eq('id', editingBranch.id);

        if (error) throw error;
        
        toast({
          title: "อัปเดตสำเร็จ",
          description: "ข้อมูลสาขาได้รับการอัปเดตแล้ว",
        });
      } else {
        const { error } = await supabase
          .from('branches')
          .insert([formData]);

        if (error) throw error;
        
        toast({
          title: "เพิ่มสำเร็จ",
          description: "เพิ่มสาขาใหม่เรียบร้อยแล้ว",
        });
      }

      setFormData({ name: '', address: '', phone: '' });
      setEditingBranch(null);
      setIsCreateDialogOpen(false);
      loadBranches();
    } catch (error) {
      console.error('Error saving branch:', error);
      toast({
        variant: "destructive",
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกข้อมูลได้",
      });
    }
  };

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name,
      address: branch.address || '',
      phone: branch.phone || ''
    });
    setIsCreateDialogOpen(true);
  };

  const handleCreateNew = () => {
    setEditingBranch(null);
    setFormData({ name: '', address: '', phone: '' });
    setIsCreateDialogOpen(true);
  };

  if (loading) {
    return <div className="flex justify-center p-8">กำลังโหลด...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-black">จัดการสาขา</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreateNew} className="bg-red-600 hover:bg-red-700">
              <Plus className="h-4 w-4 mr-2" />
              เพิ่มสาขาใหม่
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingBranch ? 'แก้ไขสาขา' : 'เพิ่มสาขาใหม่'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  ชื่อสาขา
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="กรอกชื่อสาขา"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  ที่อยู่
                </label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="กรอกที่อยู่สาขา"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  เบอร์โทรศัพท์
                </label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="กรอกเบอร์โทรศัพท์"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="bg-red-600 hover:bg-red-700">
                  {editingBranch ? 'อัปเดต' : 'เพิ่ม'}
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {branches.map((branch) => (
          <Card key={branch.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5 text-red-600" />
                  <CardTitle className="text-lg text-black">{branch.name}</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(branch)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {branch.address && (
                <div className="flex items-start space-x-2">
                  <MapPin className="h-4 w-4 text-gray-600 mt-0.5" />
                  <span className="text-sm text-black">{branch.address}</span>
                </div>
              )}
              {branch.phone && (
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-600" />
                  <span className="text-sm text-black">{branch.phone}</span>
                </div>
              )}
              {branch.manager_name && (
                <div>
                  <Badge variant="secondary">
                    ผู้จัดการ: {branch.manager_name}
                  </Badge>
                </div>
              )}
              <div className="text-xs text-gray-500">
                สร้างเมื่อ: {new Date(branch.created_at).toLocaleDateString('th-TH')}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BranchManagement;
