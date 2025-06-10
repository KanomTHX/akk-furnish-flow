
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, PieChart, TrendingUp, Download, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useReportsData } from '@/hooks/useReportsData';
import { getDateRange } from '@/utils/dateUtils';
import { ReportType, PeriodType } from '@/types/reports';
import SalesReportCard from '@/components/reports/SalesReportCard';
import ProductReportCard from '@/components/reports/ProductReportCard';
import CustomerReportCard from '@/components/reports/CustomerReportCard';
import HirePurchaseReportCard from '@/components/reports/HirePurchaseReportCard';

const ReportsManagement: React.FC = () => {
  const { toast } = useToast();
  const [selectedReport, setSelectedReport] = useState<ReportType>('sales');
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('thisMonth');
  
  const {
    salesReport,
    productReport,
    customerReport,
    hirePurchaseReport,
    loading,
    loadReportData
  } = useReportsData();

  useEffect(() => {
    const handleLoadData = async () => {
      try {
        const { start, end } = getDateRange(selectedPeriod);
        await loadReportData(selectedReport, start, end);
      } catch (error: any) {
        toast({
          title: "ข้อผิดพลาด",
          description: error.message || "ไม่สามารถโหลดข้อมูลรายงานได้",
          variant: "destructive"
        });
      }
    };

    handleLoadData();
  }, [selectedReport, selectedPeriod, loadReportData, toast]);

  const exportReport = () => {
    toast({
      title: "กำลังส่งออกรายงาน",
      description: "ฟีเจอร์นี้จะพร้อมใช้งานในอนาคต"
    });
  };

  const reportTypes = [
    { key: 'sales' as ReportType, label: 'รายงานการขาย', icon: TrendingUp },
    { key: 'products' as ReportType, label: 'รายงานสินค้า', icon: PieChart },
    { key: 'customers' as ReportType, label: 'รายงานลูกค้า', icon: Calendar },
    { key: 'hirePurchase' as ReportType, label: 'รายงานเช่าซื้อ', icon: BarChart3 }
  ];

  const renderReportContent = () => {
    if (loading) {
      return (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center py-8">กำลังโหลดรายงาน...</p>
          </CardContent>
        </Card>
      );
    }

    switch (selectedReport) {
      case 'sales':
        return <SalesReportCard salesReport={salesReport} />;
      case 'products':
        return <ProductReportCard productReport={productReport} />;
      case 'customers':
        return <CustomerReportCard customerReport={customerReport} />;
      case 'hirePurchase':
        return hirePurchaseReport ? (
          <HirePurchaseReportCard hirePurchaseReport={hirePurchaseReport} />
        ) : null;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <BarChart3 className="h-6 w-6 text-furniture-500" />
          <h2 className="text-2xl font-bold text-slate-900">ระบบรายงาน</h2>
        </div>
        
        <div className="flex space-x-2">
          <Select value={selectedPeriod} onValueChange={(value: PeriodType) => setSelectedPeriod(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">วันนี้</SelectItem>
              <SelectItem value="thisWeek">สัปดาห์นี้</SelectItem>
              <SelectItem value="thisMonth">เดือนนี้</SelectItem>
              <SelectItem value="thisYear">ปีนี้</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={exportReport}>
            <Download className="h-4 w-4 mr-2" />
            ส่งออก
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {reportTypes.map((report) => {
          const Icon = report.icon;
          return (
            <Button
              key={report.key}
              variant={selectedReport === report.key ? "default" : "outline"}
              onClick={() => setSelectedReport(report.key)}
              className={`h-16 ${selectedReport === report.key ? "bg-furniture-500 hover:bg-furniture-600" : ""}`}
            >
              <div className="text-center">
                <Icon className="h-6 w-6 mx-auto mb-1" />
                <p className="text-sm">{report.label}</p>
              </div>
            </Button>
          );
        })}
      </div>

      {renderReportContent()}
    </div>
  );
};

export default ReportsManagement;
