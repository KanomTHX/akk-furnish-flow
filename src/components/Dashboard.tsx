
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Users, Package, FileText } from 'lucide-react';

const salesData = [
  { month: 'ม.ค.', cash: 120000, hirePurchase: 80000 },
  { month: 'ก.พ.', cash: 150000, hirePurchase: 95000 },
  { month: 'มี.ค.', cash: 180000, hirePurchase: 110000 },
  { month: 'เม.ย.', cash: 140000, hirePurchase: 120000 },
  { month: 'พ.ค.', cash: 200000, hirePurchase: 140000 },
  { month: 'มิ.ย.', cash: 220000, hirePurchase: 160000 },
];

const productData = [
  { name: 'โซฟา', value: 35, color: '#0ea5e9' },
  { name: 'เตียง', value: 25, color: '#06b6d4' },
  { name: 'ตู้', value: 20, color: '#8b5cf6' },
  { name: 'โต๊ะ', value: 15, color: '#10b981' },
  { name: 'เก้าอี้', value: 5, color: '#f59e0b' },
];

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">แดชบอร์ด</h2>
        <div className="text-sm text-slate-600">
          อัปเดตล่าสุด: {new Date().toLocaleDateString('th-TH')}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover-scale">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">ยอดขายวันนี้</CardTitle>
            <DollarSign className="h-4 w-4 text-furniture-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">฿85,420</div>
            <div className="flex items-center text-sm text-green-600 mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +12.5% จากเมื่อวาน
            </div>
          </CardContent>
        </Card>

        <Card className="hover-scale">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">ลูกค้าใหม่</CardTitle>
            <Users className="h-4 w-4 text-furniture-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">24</div>
            <div className="flex items-center text-sm text-green-600 mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +8 คนจากเมื่อวาน
            </div>
          </CardContent>
        </Card>

        <Card className="hover-scale">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">สินค้าในสต็อก</CardTitle>
            <Package className="h-4 w-4 text-furniture-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">1,247</div>
            <div className="flex items-center text-sm text-red-600 mt-1">
              <TrendingDown className="h-3 w-3 mr-1" />
              -15 ชิ้นจากเมื่อวาน
            </div>
          </CardContent>
        </Card>

        <Card className="hover-scale">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">รายการเช่าซื้อ</CardTitle>
            <FileText className="h-4 w-4 text-furniture-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">156</div>
            <div className="flex items-center text-sm text-green-600 mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +3 รายการใหม่
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">ยอดขายรายเดือน</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`฿${value.toLocaleString()}`, '']}
                  labelStyle={{ color: '#1e293b' }}
                />
                <Bar dataKey="cash" fill="#0ea5e9" name="ขายสด" />
                <Bar dataKey="hirePurchase" fill="#06b6d4" name="เช่าซื้อ" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">สินค้าขายดี</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={productData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name} ${value}%`}
                >
                  {productData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900">กิจกรรมล่าสุด</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-3 bg-slate-50 rounded-lg">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">ขายสดสำเร็จ - โซฟา 3 ที่นั่ง</p>
                <p className="text-xs text-slate-600">ลูกค้า: นาย สมชาย ใจดี | ยอด: ฿25,000</p>
              </div>
              <div className="text-xs text-slate-500">5 นาทีที่แล้ว</div>
            </div>

            <div className="flex items-center space-x-4 p-3 bg-slate-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">สัญญาเช่าซื้อใหม่ - ชุดเครื่องนอน</p>
                <p className="text-xs text-slate-600">ลูกค้า: นาง สุดา เก่งงาน | ยอด: ฿45,000</p>
              </div>
              <div className="text-xs text-slate-500">15 นาทีที่แล้ว</div>
            </div>

            <div className="flex items-center space-x-4 p-3 bg-slate-50 rounded-lg">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <Package className="h-4 w-4 text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">เพิ่มสินค้าเข้าสต็อก - โต๊ะทำงาน</p>
                <p className="text-xs text-slate-600">จำนวน: 20 ชิ้น | รหัส: TBL-001</p>
              </div>
              <div className="text-xs text-slate-500">30 นาทีที่แล้ว</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
