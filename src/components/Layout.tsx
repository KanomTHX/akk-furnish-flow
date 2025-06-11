
import React, { useState } from 'react';
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

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              {/* Logo */}
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-lg flex items-center justify-center">
                  <Store className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-black">AKK Sell and Service</h1>
                  <p className="text-sm text-black">ระบบขายและเช่าซื้อเฟอร์นิเจอร์</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-black">
                ยินดีต้อนรับ, <span className="font-medium text-black">{userProfile?.full_name}</span>
                <div className="text-xs text-red-600">
                  {userProfile?.role === 'admin' && 'แอดมิน'}
                  {userProfile?.role === 'sales' && 'พนักงานขาย'}
                  {userProfile?.role === 'cashier' && 'พนักงานเก็บเงิน'}
                  {userProfile?.role === 'credit' && 'ฝ่ายสินเชื่อ'}
                  {userProfile?.role === 'warehouse' && 'ฝ่ายคลังสินค้า'}
                  {userProfile?.role === 'manager' && 'ผู้บริหาร'}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-black hover:text-black"
              >
                <LogOut className="h-4 w-4 mr-2" />
                ออกจากระบบ
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={cn(
                    "flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm whitespace-nowrap transition-colors",
                    activeTab === tab.id
                      ? "border-red-500 text-red-600"
                      : "border-transparent text-black hover:text-black hover:border-slate-300"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
