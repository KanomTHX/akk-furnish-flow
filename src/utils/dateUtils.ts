// src/utils/dateUtils.ts
export const getDateRange = (period: 'today' | 'thisWeek' | 'thisMonth' | 'thisYear') => {
  const now = new Date();
  let start = new Date(now);
  let end = new Date(now);

  switch (period) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'thisWeek':
      start.setDate(now.getDate() - now.getDay()); // Sunday as start of week
      start.setHours(0, 0, 0, 0);
      end.setDate(start.getDate() + 6); // Saturday as end of week
      end.setHours(23, 59, 59, 999);
      break;
    case 'thisMonth':
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(now.getMonth() + 1);
      end.setDate(0); // Last day of current month
      end.setHours(23, 59, 59, 999);
      break;
    case 'thisYear':
      start.setMonth(0, 1); // January 1st
      start.setHours(0, 0, 0, 0);
      end.setMonth(11, 31); // December 31st
      end.setHours(23, 59, 59, 999);
      break;
    default:
      // Fallback to this month if period is unknown
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(now.getMonth() + 1);
      end.setDate(0);
      end.setHours(23, 59, 59, 999);
      break;
  }
  return { start, end }; // คืนค่าเป็น Date objects
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};