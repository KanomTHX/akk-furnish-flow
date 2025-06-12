
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProductReport } from '@/types/reports';
import { formatCurrency } from '@/utils/dateUtils';

interface ProductReportCardProps {
  productReport: ProductReport[];
}

const ProductReportCard: React.FC<ProductReportCardProps> = ({ productReport }) => {
  if (productReport.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-black">รายงานสินค้าขายดี</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-black py-8">ไม่มีข้อมูลการขายสินค้าในช่วงเวลานี้</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-black">รายงานสินค้าขายดี</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {productReport.slice(0, 10).map((item, index) => (
            <div key={index} className="flex justify-between items-center p-3 border rounded">
              <div>
                <p className="font-medium text-black">{item.product_name}</p>
                <p className="text-sm text-black">{item.product_code}</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-black">{item.total_quantity} ชิ้น</p>
                <p className="text-sm text-black">{formatCurrency(item.total_amount)}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductReportCard;
