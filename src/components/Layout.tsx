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
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // อัปเดตทุกวินาที
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return date.toLocaleDateString('th-TH', options);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-furniture-50 to-furniture-100 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm z-10 sticky top-0">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          {/* Logo and App Name */}
          <div className="flex items-center space-x-3">
            <Store className="h-8 w-8 text-furniture-600" />
            <span className="text-2xl font-bold text-gray-900">Furniture POS</span>
          </div>

          {/* User Info and Time */}
          <div className="flex items-center space-x-4">
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-gray-700">
                {userProfile?.full_name || 'Guest'}
              </p>
              <p className="text-xs text-gray-500">
                {formatDate(currentTime)} {formatTime(currentTime)}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={signOut}
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      {/* ได้ทำการแก้ไขตรงนี้: เปลี่ยน max-w-7xl เป็น w-full เพื่อขยายให้เต็มพื้นที่ */}
      <div className="flex flex-col lg:flex-row w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6">
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

        {/* Dynamic Content */}
        <main className="flex-1 w-full"> {/* flex-1 จะทำให้ main ขยายเต็มพื้นที่ที่เหลือ */}
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;