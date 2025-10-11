import { Button } from '@/components/ui/button';
import { MousePointer, Hand } from 'lucide-react';
import { SidebarMode } from '@/hooks/useSidebarPreferences';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SidebarModeToggleProps {
  mode: SidebarMode;
  onToggle: () => void;
}

export function SidebarModeToggle({
  mode,
  onToggle
}: SidebarModeToggleProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="h-8 w-8 p-0 hover:bg-gray-100 transition-colors"
          >
            {mode === 'hover' ? (
              <MousePointer className="h-4 w-4 text-gray-600" />
            ) : (
              <Hand className="h-4 w-4 text-gray-600" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p className="text-sm">
            {mode === 'hover' ? 'Modo: Expandir ao passar mouse' : 'Modo: Expandir ao clicar'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
