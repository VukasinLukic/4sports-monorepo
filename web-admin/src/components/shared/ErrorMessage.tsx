import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ErrorMessageProps {
  message?: string;
  onRetry?: () => void;
}

export const ErrorMessage = ({
  message = 'Failed to load data',
  onRetry
}: ErrorMessageProps) => {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="bg-destructive/10 p-3 rounded-full">
            <AlertCircle size={32} className="text-destructive" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1">Error</h3>
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
          {onRetry && (
            <Button onClick={onRetry} variant="outline" size="sm">
              <RefreshCw size={16} className="mr-2" />
              Retry
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
