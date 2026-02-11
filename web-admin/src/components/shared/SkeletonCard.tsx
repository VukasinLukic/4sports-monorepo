import { Card, CardContent } from '@/components/ui/card';

export const SkeletonCard = () => {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-3">
            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            <div className="h-8 w-32 bg-muted animate-pulse rounded" />
            <div className="h-4 w-16 bg-muted animate-pulse rounded" />
          </div>
          <div className="h-12 w-12 bg-muted animate-pulse rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
};
