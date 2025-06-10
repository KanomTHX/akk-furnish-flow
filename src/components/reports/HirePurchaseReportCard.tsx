
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { HirePurchaseReport } from '@/types/reports';
import { formatCurrency } from '@/utils/dateUtils';

interface HirePurchaseReportCardProps {
  hirePurchaseReport: HirePurchaseReport;
}

const HirePurchaseReportCard: React.FC<HirePurchaseReportCardProps> = ({ hirePurchaseReport }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-sm text-slate-600">สัญญาทั้งหมด</p>
            <p className="text-3xl font-bold text-furniture-600">{hirePurchaseReport.total_contracts}</p>
            <p className="text-sm text-slate-500">สัญญา</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-sm text-slate-600">มูลค่ารวม</p>
            <p className="text-3xl font-bold text-green-600">
              {formatCurrency(hirePurchaseReport.total_amount)}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-sm text-slate-600">สัญญาที่ใช้งาน</p>
            <p className="text-3xl font-bold text-blue-600">{hirePurchaseReport.active_contracts}</p>
            <p className="text-sm text-slate-500">สัญญา</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-sm text-slate-600">งวดเกินกำหนด</p>
            <p className="text-3xl font-bold text-red-600">{hirePurchaseReport.overdue_payments}</p>
            <p className="text-sm text-slate-500">งวด</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-sm text-slate-600">อัตราการชำระ</p>
            <p className="text-3xl font-bold text-purple-600">
              {hirePurchaseReport.collection_rate.toFixed(1)}%
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HirePurchaseReportCard;
