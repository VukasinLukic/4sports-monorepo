import { HelpCircle } from 'lucide-react';
import { useOnboarding, PAGE_TUTORIALS } from '@/context/OnboardingContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface HelpButtonProps {
  pageKey: string;
}

export function HelpButton({ pageKey }: HelpButtonProps) {
  const { startTutorial, resetTutorial, hasSeenTutorial } = useOnboarding();

  const tutorial = PAGE_TUTORIALS[pageKey];

  if (!tutorial) {
    return null;
  }

  const handleStartTutorial = () => {
    // Reset first if already completed
    if (hasSeenTutorial(pageKey)) {
      resetTutorial(pageKey);
    }
    startTutorial(pageKey);
  };

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="shadow-lg bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
          >
            <HelpCircle className="h-4 w-4 mr-2" />
            Pomoć
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium">{tutorial.pageName}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {tutorial.description}
            </p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleStartTutorial}>
            <HelpCircle className="h-4 w-4 mr-2" />
            {hasSeenTutorial(pageKey) ? 'Ponovo pokreni vodič' : 'Pokreni vodič'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
