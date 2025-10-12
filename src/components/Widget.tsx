import { useEffect, useState } from 'react';
import { CurrencyImage } from './CurrencyImage';
import { WidgetButton } from './DollarSignButton';
import { setWidgetSize } from '@/lib/services/window';

export default function Widget() {
  const [open, setOpen] = useState(false);

  // Handle widget size changes when open state changes
  useEffect(() => {
    if (open) {
      setWidgetSize(500, 560);
    } else {
      setWidgetSize(36, 36);
    }
  }, [open]);

  const handleToggle = () => {
    setOpen((v) => !v);
  };

  return (
    <div className="h-screen w-screen absolute flex overflow-clip bg-transparent select-none gap-2">
      <WidgetButton onToggle={handleToggle} />
      {open && <CurrencyImage />}
    </div>
  );
}
