
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CustomerReport } from '@/types/reports';
import { formatCurrency } from '@/utils/dateUtils';

interface CustomerReportCardProps {
  customerReport: CustomerReport[];
}

const CustomerReportCard: React.FC<CustomerReportCardProps> = ({ customerReport }) => {
  if (customerReport.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-black">รายงานลูกค้าสำคัญ</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-black py-8">ไม่มีข้อมูลลูกค้าในช่วงเวลานี้</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-black">รายงานลูกค้าสำคัญ</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {customerReport.slice(0, 10).map((item, index) => (
            <div key={index} className="flex justify-between items-center p-3 border rounded">
              <div>
                <p className="font-medium text-black">{item.customer_name}</p>
                <p className="text-sm text-black">{item.customer_phone}</p>
                <p className="text-xs text-black">
                  ซื้อล่าสุด: {new Date(item.last_purchase).toLocaleDateString('th-TH')}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium text-black">{formatCurrency(item.total_purchases)}</p>
                <Badge variant="outline">ลูกค้าสำคัญ</Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomerReportCard;
