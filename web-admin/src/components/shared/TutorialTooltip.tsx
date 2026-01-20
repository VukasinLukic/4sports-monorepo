import { useEffect, useState, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOnboarding } from '@/context/OnboardingContext';
import { cn } from '@/lib/utils';

interface Position {
  top: number;
  left: number;
}

export function TutorialTooltip() {
  const {
    currentTutorial,
    currentTooltipIndex,
    isShowingTutorial,
    nextTooltip,
    prevTooltip,
    skipTutorial,
  } = useOnboarding();

  const [position, setPosition] = useState<Position>({ top: 0, left: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const currentTooltip = currentTutorial?.tooltips[currentTooltipIndex];
  const totalTooltips = currentTutorial?.tooltips.length || 0;
  const isLastTooltip = currentTooltipIndex === totalTooltips - 1;

  useEffect(() => {
    if (!isShowingTutorial || !currentTooltip) {
      setIsVisible(false);
      return;
    }

    const positionTooltip = () => {
      const targetElement = document.querySelector(currentTooltip.targetSelector);
      const tooltipElement = tooltipRef.current;

      if (!targetElement || !tooltipElement) {
        // If target not found, show tooltip in center
        setPosition({
          top: window.innerHeight / 2 - 100,
          left: window.innerWidth / 2 - 150,
        });
        setIsVisible(true);
        return;
      }

      const targetRect = targetElement.getBoundingClientRect();
      const tooltipRect = tooltipElement.getBoundingClientRect();
      const padding = 12;

      let top = 0;
      let left = 0;

      switch (currentTooltip.position || 'bottom') {
        case 'top':
          top = targetRect.top - tooltipRect.height - padding;
          left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
          break;
        case 'bottom':
          top = targetRect.bottom + padding;
          left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
          break;
        case 'left':
          top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
          left = targetRect.left - tooltipRect.width - padding;
          break;
        case 'right':
          top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
          left = targetRect.right + padding;
          break;
      }

      // Keep within viewport
      const viewportPadding = 16;
      top = Math.max(viewportPadding, Math.min(top, window.innerHeight - tooltipRect.height - viewportPadding));
      left = Math.max(viewportPadding, Math.min(left, window.innerWidth - tooltipRect.width - viewportPadding));

      setPosition({ top, left });

      // Highlight target element
      targetElement.classList.add('tutorial-highlight');

      setIsVisible(true);
    };

    // Wait for render
    setTimeout(positionTooltip, 100);

    // Cleanup highlight
    return () => {
      if (currentTooltip) {
        const targetElement = document.querySelector(currentTooltip.targetSelector);
        targetElement?.classList.remove('tutorial-highlight');
      }
    };
  }, [currentTooltip, isShowingTutorial, currentTooltipIndex]);

  if (!isShowingTutorial || !currentTooltip) {
    return null;
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-[9998]"
        onClick={skipTutorial}
      />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className={cn(
          'fixed z-[9999] w-80 bg-card border border-border rounded-lg shadow-xl transition-all duration-200',
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        )}
        style={{
          top: position.top,
          left: position.left,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm font-medium text-muted-foreground">
              {currentTooltipIndex + 1} / {totalTooltips}
            </span>
          </div>
          <button
            onClick={skipTutorial}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-foreground mb-2">
            {currentTooltip.title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {currentTooltip.description}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/50 rounded-b-lg">
          <Button
            variant="ghost"
            size="sm"
            onClick={skipTutorial}
            className="text-muted-foreground"
          >
            <SkipForward className="h-4 w-4 mr-1" />
            Preskoči
          </Button>

          <div className="flex items-center gap-2">
            {currentTooltipIndex > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={prevTooltip}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            <Button
              size="sm"
              onClick={nextTooltip}
            >
              {isLastTooltip ? 'Završi' : 'Dalje'}
              {!isLastTooltip && <ChevronRight className="h-4 w-4 ml-1" />}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
