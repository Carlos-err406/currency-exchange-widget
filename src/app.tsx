import { DollarSign } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from './components/ui/button';
import { getDailyImageUrl } from './lib/services/daily-image';
import {
  setWidgetSize,
  widgetDragMove,
  widgetEndDrag,
  widgetStartDrag,
} from './lib/services/window';
import { cn } from './lib/utils';

export default function App() {
  const [open, setOpen] = useState(false);
  const [scaled, setScaled] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const [imageSrc, setImageSrc] = useState('https://wa.cambiocuba.money/trmi.png');
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

  useEffect(() => {
    if (open) setWidgetSize(500, 560);
    else {
      setTimeout(() => setWidgetSize(36, 36), 200);
    }
  }, [open]);

  useEffect(() => {
    const fetchImagePath = async () => {
      try {
        const [err, path] = await getDailyImageUrl();
        if (err) throw err;
        setImageSrc(path);
      } catch (error) {
        console.error('Failed to get image path:', error);
      }
    };
    fetchImagePath();
  }, []);

  const startDrag = (e: React.MouseEvent) => {
    if (e.button !== 1 && !e.altKey) return; // right-click drag
    e.preventDefault();
    dragging.current = true;
    widgetStartDrag();
  };

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setOrigin({ x, y });
    setScaled((v) => !v);
  };
  return (
    <div
      onMouseDown={startDrag}
      onContextMenu={(e) => e.preventDefault()}
      className="h-screen w-screen absolute flex overflow-clip bg-transparent select-none"
    >
      <Button
        type="button"
        size={'icon'}
        onClick={(e) => {
          if (!e.altKey) {
            setOrigin({ x: 0, y: 0 });
            setOpen((v) => !v);
          }
        }}
        className={cn('ring-0! relative')}
      >
        <DollarSign />
      </Button>

      <div className="overflow-clip rounded-2xl">
        <img
          onClick={handleImageClick}
          src={imageSrc}
          style={{
            transformOrigin: `${origin.x}% ${origin.y}%`,
            transform: !open ? 'scale(0)' : scaled ? 'scale(2)' : 'scale(1)',
          }}
          className={cn('size-full select-none transition-transform')}
        />
      </div>
    </div>
  );
}
