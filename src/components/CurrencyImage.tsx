import { useEffect, useState } from 'react';
import { getDailyImageUrl } from '../lib/services/daily-image';
import { cn } from '../lib/utils';

interface CurrencyImageProps {
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

export function CurrencyImage({ className, onClick }: CurrencyImageProps) {
  const [imageSrc, setImageSrc] = useState('https://wa.cambiocuba.money/trmi.png');

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

  return (
    <div className={cn('overflow-clip rounded-2xl', className)} onClick={onClick}>
      <img src={imageSrc} className="size-full select-none" alt="Daily currency exchange rates" />
    </div>
  );
}
