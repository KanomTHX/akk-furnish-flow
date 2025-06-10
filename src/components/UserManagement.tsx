
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Edit, Trash2, Search } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  lastLogin: string;
}

const mockUsers: User[] = [
  { id: '1', name: 'นาย วิชาย แอดมิน', email: 'admin@akk.com', role: 'admin', status: 'active', lastLogin: '2024-06-10 14:30' },
  { id: '2', name: 'นาง สุดา ขายดี', email: 'sales@akk.com', role: 'sales', status: 'active', lastLogin: '2024-06-10 13:45' },
  { id: '3', name: 'นาย สมชาย เก็บเงิน', email: 'cashier@akk.com', role: 'cashier', status: 'active', lastLogin: '2024-06-10 12:20' },
  { id: '4', name: 'นาง มานะ คลังสินค้า', email: 'warehouse@akk.com', role: 'warehouse', status: 'active', lastLogin: '2024-06-10 11:15' },
];

const roleLabels = {
  admin: 'แอดมิน',
  sales: 'พนักงานขาย',
  cashier: 'พนักงานเก็บเงิน',
  credit: 'พนักงานสินเชื่อ',
  warehouse: 'ฝ่ายคลังสินค้า',
  manager: 'หัวหน้า/ผู้บริหาร'
};

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: '',
    password: ''
  });

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddUser = () => {
    if (newUser.name && newUser.email && newUser.role) {
      const user: User = {
        id: (users.length + 1).toString(),
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: 'active',
        lastLogin: 'ยังไม่เคยเข้าใช้งาน'
      };
      setUsers([...users, user]);
      setNewUser({ name: '', email: '', role: '', password: '' });
      setIsAddDialogOpen(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'sales': return 'bg-blue-100 text-blue-800';
      case 'cashier': return 'bg-green-100 text-green-800';
      case 'credit': return 'bg-purple-100 text-purple-800';
      case 'warehouse': return 'bg-orange-100 text-orange-800';
      case 'manager': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Users className="h-6 w-6 text-furniture-500" />
          <h2 className="text-2xl font-bold text-slate-900">จัดการผู้ใช้งาน</h2>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-furniture-500 hover:bg-furniture-600">
              <Plus className="h-4 w-4 mr-2" />
              เพิ่มผู้ใช้ใหม่
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>เพิ่มผู้ใช้งานใหม่</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">ชื่อ-นามสกุล</Label>
                <Input
                  id="name"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="กรอกชื่อ-นามสกุล"
                />
              </div>
              <div>
                <Label htmlFor="email">อีเมล</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="กรอกอีเมล"
                />
              </div>
              <div>
                <Label htmlFor="role">บทบาท</Label>
                <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกบทบาท" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(roleLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="password">รหัสผ่าน</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="กรอกรหัสผ่าน"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  ยกเลิก
                </Button>
                <Button onClick={handleAddUser} className="bg-furniture-500 hover:bg-furniture-600">
                  เพิ่มผู้ใช้
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              placeholder="ค้นหาผู้ใช้งาน..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>รายชื่อผู้ใช้งาน ({filteredUsers.length} คน)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-furniture-100 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-furniture-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900">{user.name}</h3>
                    <p className="text-sm text-slate-600">{user.email}</p>
                    <p className="text-xs text-slate-500">เข้าใช้งานล่าสุด: {user.lastLogin}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Badge className={getRoleBadgeColor(user.role)}>
                    {roleLabels[user.role as keyof typeof roleLabels]}
                  </Badge>
                  <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                    {user.status === 'active' ? 'ใช้งานได้' : 'ระงับการใช้งาน'}
                  </Badge>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* User Permissions */}
      <Card>
        <CardHeader>
          <CardTitle>สิทธิ์การเข้าถึงตามบทบาท</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="p-3 border border-slate-200 rounded-lg">
                <h4 className="font-medium text-slate-900 mb-2">แอดมิน</h4>
                <p className="text-sm text-slate-600">เข้าถึงทุกระบบ และจัดการผู้ใช้งาน</p>
              </div>
              <div className="p-3 border border-slate-200 rounded-lg">
                <h4 className="font-medium text-slate-900 mb-2">พนักงานขาย</h4>
                <p className="text-sm text-slate-600">ขายสด, เช่าซื้อ, จัดการลูกค้า</p>
              </div>
              <div className="p-3 border border-slate-200 rounded-lg">
                <h4 className="font-medium text-slate-900 mb-2">พนักงานเก็บเงิน</h4>
                <p className="text-sm text-slate-600">รับชำระเงิน, บัญชี, ใบเสร็จ</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="p-3 border border-slate-200 rounded-lg">
                <h4 className="font-medium text-slate-900 mb-2">พนักงานสินเชื่อ</h4>
                <p className="text-sm text-slate-600">จัดการสัญญาเช่าซื้อ, ติดตามผ่อน</p>
              </div>
              <div className="p-3 border border-slate-200 rounded-lg">
                <h4 className="font-medium text-slate-900 mb-2">ฝ่ายคลังสินค้า</h4>
                <p className="text-sm text-slate-600">จัดการสต็อกสินค้า, นำเข้า-ส่งออก</p>
              </div>
              <div className="p-3 border border-slate-200 rounded-lg">
                <h4 className="font-medium text-slate-900 mb-2">หัวหน้า/ผู้บริหาร</h4>
                <p className="text-sm text-slate-600">ดูรายงาน, วิเคราะห์ข้อมูล</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;
