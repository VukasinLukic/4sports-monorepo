import { useState } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FilterPanelProps {
  children: React.ReactNode;
  onClear: () => void;
  title?: string;
}

export function FilterPanel({ children, onClear, title = 'Filters' }: FilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="border border-border rounded-lg bg-card">
      <div className="w-full px-4 py-3 flex items-center justify-between rounded-t-lg">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 hover:text-primary transition-colors"
        >
          <span className="font-medium">{title}</span>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </button>
        {isExpanded && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-8 text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      <div
        className={cn(
          'overflow-hidden transition-all duration-200',
          isExpanded ? 'max-h-[1000px]' : 'max-h-0'
        )}
      >
        <div className="p-4 space-y-4 border-t border-border">{children}</div>
      </div>
    </div>
  );
}
