
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SalesReport } from '@/types/reports';
import { formatCurrency } from '@/utils/dateUtils';

interface SalesReportCardProps {
  salesReport: SalesReport[];
}

const SalesReportCard: React.FC<SalesReportCardProps> = ({ salesReport }) => {
  if (salesReport.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>รายงานการขาย</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-slate-500 py-8">ไม่มีข้อมูลการขายในช่วงเวลานี้</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>รายงานการขาย</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600">ยอดขายรวม</p>
              <p className="text-2xl font-bold text-green-700">
                {salesReport.reduce((sum, item) => sum + item.totalSales, 0)} รายการ
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600">มูลค่ารวม</p>
              <p className="text-2xl font-bold text-blue-700">
                {formatCurrency(salesReport.reduce((sum, item) => sum + item.totalAmount, 0))}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-purple-600">ค่าเฉลี่ยต่อรายการ</p>
              <p className="text-2xl font-bold text-purple-700">
                {formatCurrency(
                  salesReport.reduce((sum, item) => sum + item.totalAmount, 0) /
                  salesReport.reduce((sum, item) => sum + item.totalSales, 0) || 0
                )}
              </p>
            </div>
          </div>
          <div className="space-y-2">
            {salesReport.map((item, index) => (
              <div key={index} className="flex justify-between items-center p-3 border rounded">
                <span>{item.period}</span>
                <div className="text-right">
                  <p className="font-medium">{item.totalSales} รายการ</p>
                  <p className="text-sm text-slate-600">{formatCurrency(item.totalAmount)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SalesReportCard;
