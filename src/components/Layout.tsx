import React, { useState, useEffect } from 'react';
import { Users, ShoppingCart, CreditCard, Package, FileText, BarChart3, Settings, Store, LogOut, Building2, ArrowRightLeft } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'dashboard', label: 'แดชบอร์ด', icon: BarChart3 },
  { id: 'users', label: 'ผู้ใช้งาน', icon: Users },
  { id: 'customers', label: 'ลูกค้า', icon: Users },
  { id: 'sales', label: 'ขายสด', icon: ShoppingCart },
  { id: 'hire-purchase', label: 'เช่าซื้อ', icon: CreditCard },
  { id: 'inventory', label: 'คลังสินค้า', icon: Package },
  { id: 'transfers', label: 'โอนสินค้า', icon: ArrowRightLeft },
  { id: 'branches', label: 'สาขา', icon: Building2 },
  { id: 'accounting', label: 'บัญชี', icon: FileText },
  { id: 'reports', label: 'รายงาน', icon: BarChart3 },
];

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange }) => {
  const { userProfile, signOut } = useAuth();
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  const handleSignOut = async () => {
    await signOut();
  };

  const formatDateTime = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'Asia/Bangkok'
    };
    return date.toLocaleDateString('th-TH', options);
  };

  return (
    <div className="min-h-screen bg-neutral-100">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              {/* Logo */}
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-900 rounded-lg flex items-center justify-center">
                  <Store className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">AKK Sell and Service</h1>
                  <p className="text-sm text-gray-700">ระบบขายและเช่าซื้อเฟอร์นิเจอร์</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-800">
                ยินดีต้อนรับ, <span className="font-medium text-gray-900">{userProfile?.full_name}</span>
                <div className="text-xs text-gray-600">
                  {userProfile?.role === 'admin' && 'แอดมิน'}
                  {userProfile?.role === 'sales' && 'พนักงานขาย'}
                  {userProfile?.role === 'cashier' && 'พนักงานเก็บเงิน'}
                  {userProfile?.role === 'manager' && 'ผู้จัดการ'} {/* <-- เพิ่มส่วนนี้ให้สมบูรณ์ */}
                  {/* เพิ่มบทบาทอื่นๆ ที่นี่ตามต้องการ */}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-700">{formatDateTime(currentDateTime)}</div>
                <div className="text-xs text-gray-500">
                  <span className="font-medium">สาขา:</span> {userProfile?.branch_name || 'ไม่ระบุ'}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                onClick={() => onTabChange('settings')}
              >
                <Settings className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-red-500 hover:text-red-700 hover:bg-red-100"
                onClick={handleSignOut}
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-col lg:flex-row max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6">
        {/* Sidebar Navigation */}
        <nav className="w-full lg:w-64 flex-shrink-0">
          <Card className="p-4 flex flex-col space-y-2">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant="ghost"
                className={cn(
                  "justify-start px-4 py-2 text-base font-medium rounded-md transition-colors duration-200",
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md hover:from-blue-600 hover:to-blue-700"
                    : "text-gray-700 hover:bg-gray-200 hover:text-gray-900"
                )}
                onClick={() => onTabChange(tab.id)}
              >
                <tab.icon className={cn("mr-3 h-5 w-5", activeTab === tab.id ? "text-white" : "text-gray-500")} />
                {tab.label}
              </Button>
            ))}
          </Card>
        </nav>

        {/* Page Content */}
        <main className="flex-1 min-w-0">
          <Card className="p-6 h-full">
            {children}
          </Card>
        </main>
      </div>
    </div>
  );
};

export default Layout;
