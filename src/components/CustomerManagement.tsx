
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Users, Plus, Search, Edit, Bell, CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import CustomerEditModal from './CustomerEditModal';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  customer_type: string;
  total_purchases?: number;
  last_purchase_date?: string;
  created_at: string;
}

const CustomerManagement: React.FC = () => {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลลูกค้าได้",
        variant: "destructive"
      });
      return;
    }
    setCustomers(data || []);
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.phone.includes(searchTerm) ||
                         (customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesFilter = filterType === 'all' || customer.customer_type === filterType;
    return matchesSearch && matchesFilter;
  });

  const handleAddCustomer = async () => {
    if (!newCustomer.name || !newCustomer.phone) {
      toast({
        title: "ข้อผิดพลาด",
        description: "กรุณากรอกชื่อและเบอร์โทรศัพท์",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('customers')
        .insert({
          name: newCustomer.name,
          phone: newCustomer.phone,
          email: newCustomer.email || null,
          address: newCustomer.address || null,
          customer_type: 'regular'
        });

      if (error) throw error;

      toast({
        title: "สำเร็จ",
        description: "เพิ่มลูกค้าเรียบร้อย"
      });
      
      setNewCustomer({ name: '', phone: '', email: '', address: '' });
      setIsAddDialogOpen(false);
      loadCustomers();
    } catch (error: any) {
      toast({
        title: "ข้อผิดพลาด",
        description: error.message || "ไม่สามารถเพิ่มลูกค้าได้",
        variant: "destructive"
      });
    }
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsEditModalOpen(true);
  };

  const getCustomerTypeBadge = (type: string) => {
    switch (type) {
      case 'vip':
        return <Badge className="bg-yellow-100 text-yellow-800">ลูกค้า VIP</Badge>;
      case 'hire-purchase':
        return <Badge className="bg-blue-100 text-blue-800">เช่าซื้อ</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800">ค้างชำระ</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">ลูกค้าทั่วไป</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Users className="h-6 w-6 text-furniture-500" />
          <h2 className="text-2xl font-bold text-slate-900">จัดการลูกค้า</h2>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-furniture-500 hover:bg-furniture-600">
              <Plus className="h-4 w-4 mr-2" />
              เพิ่มลูกค้าใหม่
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>เพิ่มลูกค้าใหม่</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="customerName">ชื่อ-นามสกุล *</Label>
                <Input
                  id="customerName"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  placeholder="กรอกชื่อ-นามสกุล"
                />
              </div>
              <div>
                <Label htmlFor="customerPhone">เบอร์โทรศัพท์ *</Label>
                <Input
                  id="customerPhone"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  placeholder="กรอกเบอร์โทรศัพท์"
                />
              </div>
              <div>
                <Label htmlFor="customerEmail">อีเมล</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  placeholder="กรอกอีเมล"
                />
              </div>
              <div>
                <Label htmlFor="customerAddress">ที่อยู่</Label>
                <Textarea
                  id="customerAddress"
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                  placeholder="กรอกที่อยู่"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  ยกเลิก
                </Button>
                <Button onClick={handleAddCustomer} className="bg-furniture-500 hover:bg-furniture-600">
                  เพิ่มลูกค้า
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                placeholder="ค้นหาลูกค้า (ชื่อ, เบอร์โทร, อีเมล)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'all', label: 'ทั้งหมด' },
                { key: 'regular', label: 'ทั่วไป' },
                { key: 'vip', label: 'VIP' },
                { key: 'hire-purchase', label: 'เช่าซื้อ' },
                { key: 'overdue', label: 'ค้างชำระ' }
              ].map(filter => (
                <Button
                  key={filter.key}
                  variant={filterType === filter.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterType(filter.key)}
                  className={filterType === filter.key ? "bg-furniture-500 hover:bg-furniture-600" : ""}
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">{customers.length}</div>
              <div className="text-sm text-slate-600">ลูกค้าทั้งหมด</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {customers.filter(c => c.customer_type === 'hire-purchase').length}
              </div>
              <div className="text-sm text-slate-600">ลูกค้าเช่าซื้อ</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {customers.filter(c => c.customer_type === 'overdue').length}
              </div>
              <div className="text-sm text-slate-600">ค้างชำระ</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {customers.filter(c => c.customer_type === 'vip').length}
              </div>
              <div className="text-sm text-slate-600">ลูกค้า VIP</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customers List */}
      <Card>
        <CardHeader>
          <CardTitle>รายชื่อลูกค้า ({filteredCustomers.length} คน)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredCustomers.map((customer) => (
              <div key={customer.id} className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-medium text-slate-900">{customer.name}</h3>
                      {getCustomerTypeBadge(customer.customer_type)}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600">
                      <div>
                        <p>📞 {customer.phone}</p>
                        <p>📧 {customer.email || 'ไม่ระบุ'}</p>
                        <p>📍 {customer.address || 'ไม่ระบุ'}</p>
                      </div>
                      <div>
                        <p>💰 ยอดซื้อรวม: ฿{(customer.total_purchases || 0).toLocaleString()}</p>
                        <p>📅 ซื้อล่าสุด: {customer.last_purchase_date ? new Date(customer.last_purchase_date).toLocaleDateString('th-TH') : 'ยังไม่เคยซื้อ'}</p>
                        <p>📝 เพิ่มเมื่อ: {new Date(customer.created_at).toLocaleDateString('th-TH')}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditCustomer(customer)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      แก้ไข
                    </Button>
                    {customer.customer_type === 'hire-purchase' && (
                      <>
                        <Button variant="outline" size="sm" className="text-green-600">
                          <CreditCard className="h-4 w-4 mr-1" />
                          รับชำระ
                        </Button>
                        <Button variant="outline" size="sm" className="text-blue-600">
                          <Bell className="h-4 w-4 mr-1" />
                          แจ้งเตือน
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <CustomerEditModal
        customer={editingCustomer}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingCustomer(null);
        }}
        onUpdate={loadCustomers}
      />
    </div>
  );
};

export default CustomerManagement;
