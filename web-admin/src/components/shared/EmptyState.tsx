import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState = ({
  icon: Icon,
  title,
  message,
  actionLabel,
  onAction,
}: EmptyStateProps) => {
  return (
    <Card className="bg-card border-border animate-fade-in">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="rounded-full bg-muted p-6 mb-4 transition-transform hover:scale-110 duration-300">
          <Icon className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground text-center mb-6 max-w-md">
          {message}
        </p>
        {actionLabel && onAction && (
          <Button
            onClick={onAction}
            className="bg-green-600 hover:bg-green-700 transition-all duration-200 hover:scale-105"
          >
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
