
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const UserManagement = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    role: 'sales',
    phone: ''
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        variant: "destructive",
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลผู้ใช้งานได้",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingUser) {
        // Update user
        const { error } = await supabase
          .from('profiles')
          .update(formData)
          .eq('id', editingUser.id);

        if (error) throw error;

        toast({
          title: "อัปเดตสำเร็จ",
          description: "ข้อมูลผู้ใช้งานถูกอัปเดตแล้ว",
        });
      }

      setIsDialogOpen(false);
      setEditingUser(null);
      setFormData({ full_name: '', email: '', role: 'sales', phone: '' });
      loadUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      toast({
        variant: "destructive",
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกข้อมูลได้",
      });
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      phone: user.phone || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (userId) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบผู้ใช้งานนี้?')) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "ลบสำเร็จ",
        description: "ผู้ใช้งานถูกลบแล้ว",
      });
      loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        variant: "destructive",
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบผู้ใช้งานได้",
      });
    }
  };

  const filteredUsers = users.filter(user =>
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadge = (role) => {
    const roleNames = {
      admin: { label: 'แอดมิน', variant: 'destructive' },
      sales: { label: 'พนักงานขาย', variant: 'default' },
      cashier: { label: 'พนักงานเก็บเงิน', variant: 'secondary' },
      credit: { label: 'ฝ่ายสินเชื่อ', variant: 'outline' },
      warehouse: { label: 'ฝ่ายคลังสินค้า', variant: 'secondary' },
      manager: { label: 'ผู้บริหาร', variant: 'default' }
    };
    
    const roleInfo = roleNames[role] || { label: role, variant: 'default' };
    return <Badge variant={roleInfo.variant}>{roleInfo.label}</Badge>;
  };

  if (userProfile?.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-slate-900 mb-2">ไม่มีสิทธิ์เข้าถึง</h3>
        <p className="text-slate-600">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>จัดการผู้ใช้งาน</CardTitle>
              <CardDescription>
                จัดการบัญชีผู้ใช้งานและสิทธิการเข้าถึงในระบบ
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="ค้นหาผู้ใช้งาน..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ชื่อ-นามสกุล</TableHead>
                  <TableHead>อีเมล</TableHead>
                  <TableHead>บทบาท</TableHead>
                  <TableHead>เบอร์โทร</TableHead>
                  <TableHead>วันที่สร้าง</TableHead>
                  <TableHead className="text-right">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6">
                      กำลังโหลด...
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                      ไม่พบข้อมูลผู้ใช้งาน
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.full_name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>{user.phone || '-'}</TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString('th-TH')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(user)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(user.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>แก้ไขข้อมูลผู้ใช้งาน</DialogTitle>
            <DialogDescription>
              แก้ไขข้อมูลและสิทธิการเข้าถึงของผู้ใช้งาน
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">ชื่อ-นามสกุล</label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="กรอกชื่อ-นามสกุล"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">อีเมล</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="กรอกอีเมล"
                  required
                  disabled={!!editingUser}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">บทบาท</label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกบทบาท" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">แอดมิน</SelectItem>
                    <SelectItem value="sales">พนักงานขาย</SelectItem>
                    <SelectItem value="cashier">พนักงานเก็บเงิน</SelectItem>
                    <SelectItem value="credit">ฝ่ายสินเชื่อ</SelectItem>
                    <SelectItem value="warehouse">ฝ่ายคลังสินค้า</SelectItem>
                    <SelectItem value="manager">ผู้บริหาร</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">เบอร์โทร</label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="กรอกเบอร์โทร"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                ยกเลิก
              </Button>
              <Button type="submit">
                บันทึก
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
