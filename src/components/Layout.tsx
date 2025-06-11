import React, { useState, useEffect } from 'react'; // เพิ่ม useEffect
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
  const [currentDateTime, setCurrentDateTime] = useState(new Date()); // เพิ่ม state สำหรับเวลาและวันที่

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date()); // อัปเดตเวลาทุกวินาที
    }, 1000);

    return () => {
      clearInterval(timer); // เคลียร์ timer เมื่อ component ถูก unmount
    };
  }, []); // [] เพื่อให้ useEffect ทำงานแค่ครั้งเดียวตอน mount

  const handleSignOut = async () => {
    await signOut();
  };

  // ฟังก์ชันสำหรับฟอร์แมตวันที่และเวลา
  const formatDateTime = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long', // วันในสัปดาห์ เช่น วันพุธ
      year: 'numeric', // ปี เช่น 2025
      month: 'long',   // เดือน เช่น มิถุนายน
      day: 'numeric',  // วันที่ เช่น 11
      hour: '2-digit', // ชั่วโมง เช่น 04 PM
      minute: '2-digit', // นาที เช่น 19
      second: '2-digit', // วินาที เช่น 24
      hour12: false, // ใช้รูปแบบ 24 ชั่วโมง
      timeZone: 'Asia/Bangkok' // ตั้งค่า Time Zone เป็นประเทศไทย
    };
    return date.toLocaleDateString('th-TH', options); // ใช้ 'th-TH' สำหรับภาษาไทย
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
                  {userProfile?.role ===
