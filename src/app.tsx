import { TrayPopup } from './components/TrayPopup';
import Widget from './components/Widget';

export default function App() {
  // Check if we're in popup mode based on URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const isPopupMode = urlParams.get('popup') === 'true';

  return isPopupMode ? <TrayPopup /> : <Widget />;
}
