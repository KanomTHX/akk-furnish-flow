
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Users, Plus, Search, Edit, Bell, CreditCard } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  type: 'regular' | 'hire-purchase' | 'vip' | 'overdue';
  totalPurchases: number;
  lastPurchase: string;
  hirePurchaseStatus?: {
    contractId: string;
    totalAmount: number;
    remainingAmount: number;
    nextPaymentDate: string;
    installmentAmount: number;
  };
}

const mockCustomers: Customer[] = [
  {
    id: '1',
    name: 'นาย สมชาย ใจดี',
    phone: '081-234-5678',
    email: 'somchai@email.com',
    address: '123 ถ.รามคำแหง เขตบางกะปิ กรุงเทพฯ 10240',
    type: 'vip',
    totalPurchases: 125000,
    lastPurchase: '2024-06-08'
  },
  {
    id: '2',
    name: 'นาง สุดา เก่งงาน',
    phone: '082-345-6789',
    email: 'suda@email.com',
    address: '456 ถ.ลาดพร้าว เขตวังทองหลาง กรุงเทพฯ 10310',
    type: 'hire-purchase',
    totalPurchases: 45000,
    lastPurchase: '2024-05-15',
    hirePurchaseStatus: {
      contractId: 'HP-2024-001',
      totalAmount: 45000,
      remainingAmount: 30000,
      nextPaymentDate: '2024-06-15',
      installmentAmount: 3750
    }
  },
  {
    id: '3',
    name: 'นาย วิชาย รวยดี',
    phone: '083-456-7890',
    email: 'wichai@email.com',
    address: '789 ถ.สุขุมวิท เขตวัฒนา กรุงเทพฯ 10110',
    type: 'overdue',
    totalPurchases: 28000,
    lastPurchase: '2024-04-20',
    hirePurchaseStatus: {
      contractId: 'HP-2024-002',
      totalAmount: 28000,
      remainingAmount: 18000,
      nextPaymentDate: '2024-05-20',
      installmentAmount: 2800
    }
  }
];

const CustomerManagement: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  });

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.phone.includes(searchTerm) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || customer.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const handleAddCustomer = () => {
    if (newCustomer.name && newCustomer.phone) {
      const customer: Customer = {
        id: (customers.length + 1).toString(),
        name: newCustomer.name,
        phone: newCustomer.phone,
        email: newCustomer.email,
        address: newCustomer.address,
        type: 'regular',
        totalPurchases: 0,
        lastPurchase: 'ยังไม่เคยซื้อ'
      };
      setCustomers([...customers, customer]);
      setNewCustomer({ name: '', phone: '', email: '', address: '' });
      setIsAddDialogOpen(false);
    }
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
                {customers.filter(c => c.type === 'hire-purchase').length}
              </div>
              <div className="text-sm text-slate-600">ลูกค้าเช่าซื้อ</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {customers.filter(c => c.type === 'overdue').length}
              </div>
              <div className="text-sm text-slate-600">ค้างชำระ</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {customers.filter(c => c.type === 'vip').length}
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
                      {getCustomerTypeBadge(customer.type)}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600">
                      <div>
                        <p>📞 {customer.phone}</p>
                        <p>📧 {customer.email || 'ไม่ระบุ'}</p>
                        <p>📍 {customer.address || 'ไม่ระบุ'}</p>
                      </div>
                      <div>
                        <p>💰 ยอดซื้อรวม: ฿{customer.totalPurchases.toLocaleString()}</p>
                        <p>📅 ซื้อล่าสุด: {customer.lastPurchase}</p>
                        {customer.hirePurchaseStatus && (
                          <div className="mt-2 p-2 bg-blue-50 rounded border-l-4 border-blue-500">
                            <p className="font-medium text-blue-800">สถานะเช่าซื้อ:</p>
                            <p className="text-blue-700">สัญญา: {customer.hirePurchaseStatus.contractId}</p>
                            <p className="text-blue-700">คงเหลือ: ฿{customer.hirePurchaseStatus.remainingAmount.toLocaleString()}</p>
                            <p className="text-blue-700">งวดต่อไป: {customer.hirePurchaseStatus.nextPaymentDate}</p>
                            <p className="text-blue-700">จำนวนงวดละ: ฿{customer.hirePurchaseStatus.installmentAmount.toLocaleString()}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-2">
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-1" />
                      แก้ไข
                    </Button>
                    {customer.hirePurchaseStatus && (
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
    </div>
  );
};

export default CustomerManagement;
