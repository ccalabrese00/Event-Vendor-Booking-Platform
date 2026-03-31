'use client';

import { getPaymentStatusColor } from '@/lib/utils/formatters';

interface PaymentStatusBadgeProps {
  status: string;
}

export function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  return (
    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(status)}`}>
      {status}
    </span>
  );
}
