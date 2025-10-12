import { useEffect, useRef } from 'react';
import { widgetDragMove, widgetEndDrag, widgetStartDrag } from '../lib/services/window';
import { cn } from '../lib/utils';
import { Button } from './ui/button';

interface DollarSignButtonProps {
  onToggle: () => void;
  className?: string;
}

export function WidgetButton({ onToggle, className }: DollarSignButtonProps) {
  const dragging = useRef(false);

  useEffect(() => {
    const handleMouseMove = async () => {
      if (!dragging.current) return;
      widgetDragMove();
    };

    const handleMouseUp = () => {
      dragging.current = false;
      widgetEndDrag();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const startDrag = (e: React.MouseEvent) => {
    if (e.button !== 1 && !e.altKey) return; // right-click drag
    e.preventDefault();
    dragging.current = true;
    widgetStartDrag();
  };

  return (
    <Button
      type="button"
      size={'icon'}
      onClick={(e) => {
        if (!e.altKey) {
          onToggle();
        }
      }}
      onMouseDown={startDrag}
      onContextMenu={(e) => e.preventDefault()}
      className={cn('ring-0! relative', className)}
    >
      <svg
        data-v-6433c584=""
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        className="lucide lucide-coins-exchange-icon lucide-coins-exchange"
      >
        <path d="M6 10V5c0-1.7 1.3-3 3-3h1"></path>
        <path d="m3 7 3 3 3-3"></path>
        <circle cx="18" cy="6" r="4"></circle>
        <path d="M18 14v5c0 1.7-1.3 3-3 3h-1"></path>
        <path d="m21 17-3-3-3 3"></path>
        <circle cx="6" cy="18" r="4"></circle>
      </svg>
    </Button>
  );
}
