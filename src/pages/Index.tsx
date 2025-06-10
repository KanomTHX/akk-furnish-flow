
import React, { useState } from 'react';
import Layout from '@/components/Layout';
import Dashboard from '@/components/Dashboard';
import UserManagement from '@/components/UserManagement';
import CustomerManagement from '@/components/CustomerManagement';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'users':
        return <UserManagement />;
      case 'customers':
        return <CustomerManagement />;
      case 'sales':
        return (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-slate-900 mb-2">ระบบขายสด</h3>
            <p className="text-slate-600">กำลังพัฒนา...</p>
          </div>
        );
      case 'hire-purchase':
        return (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-slate-900 mb-2">ระบบเช่าซื้อ</h3>
            <p className="text-slate-600">กำลังพัฒนา...</p>
          </div>
        );
      case 'inventory':
        return (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-slate-900 mb-2">ระบบคลังสินค้า</h3>
            <p className="text-slate-600">กำลังพัฒนา...</p>
          </div>
        );
      case 'accounting':
        return (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-slate-900 mb-2">ระบบบัญชี</h3>
            <p className="text-slate-600">กำลังพัฒนา...</p>
          </div>
        );
      case 'reports':
        return (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-slate-900 mb-2">ระบบรายงาน</h3>
            <p className="text-slate-600">กำลังพัฒนา...</p>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </Layout>
  );
};

export default Index;
