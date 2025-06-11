
import React, { useState } from 'react';
import Layout from '@/components/Layout';
import Dashboard from '@/components/Dashboard';
import UserManagement from '@/components/UserManagement';
import CustomerManagement from '@/components/CustomerManagement';
import CashSaleManagement from '@/components/CashSaleManagement';
import HirePurchaseManagement from '@/components/HirePurchaseManagement';
import InventoryManagement from '@/components/InventoryManagement';
import ProductTransferManagement from '@/components/ProductTransferManagement';
import BranchManagement from '@/components/BranchManagement';
import AccountingManagement from '@/components/AccountingManagement';
import ReportsManagement from '@/components/ReportsManagement';

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
        return <CashSaleManagement />;
      case 'hire-purchase':
        return <HirePurchaseManagement />;
      case 'inventory':
        return <InventoryManagement />;
      case 'transfers':
        return <ProductTransferManagement />;
      case 'branches':
        return <BranchManagement />;
      case 'accounting':
        return <AccountingManagement />;
      case 'reports':
        return <ReportsManagement />;
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
