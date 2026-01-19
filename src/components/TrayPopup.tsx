import { CurrencyImage } from './CurrencyImage';

export function TrayPopup() {
  const handleBackgroundClick = () => {
    window.ipc.window_hide();
  };

  return (
    <div
      className="h-screen w-screen absolute flex overflow-clip bg-transparent select-none cursor-default"
      onClick={handleBackgroundClick}
    >
      <CurrencyImage
        className="w-full h-full"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      />
    </div>
  );
}
