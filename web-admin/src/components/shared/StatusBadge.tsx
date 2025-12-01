import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  status: 'PAID' | 'UNPAID' | 'VALID' | 'EXPIRED';
  type: 'payment' | 'medical';
}

export function StatusBadge({ status, type }: StatusBadgeProps) {
  const isPositive = status === 'PAID' || status === 'VALID';

  return (
    <Badge
      variant={isPositive ? 'default' : 'destructive'}
      className={`uppercase font-semibold ${
        isPositive
          ? 'bg-green-600 hover:bg-green-700 text-white'
          : 'bg-red-600 hover:bg-red-700 text-white'
      }`}
    >
      {status}
    </Badge>
  );
}
