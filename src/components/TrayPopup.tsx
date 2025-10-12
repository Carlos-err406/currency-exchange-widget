import { CurrencyImage } from './CurrencyImage';

export function TrayPopup() {
  return (
    <div className="h-screen w-screen absolute flex overflow-clip bg-transparent select-none">
      <CurrencyImage className="w-full h-full" />
    </div>
  );
}
