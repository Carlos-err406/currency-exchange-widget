import { BrowserWindow, Menu, Tray, app } from 'electron';
import path from 'path';
import { fileURLToPath } from 'node:url';
import { createPopupWindow } from './window';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createTray(): Tray {
  const getPublicPath = () => {
    return process.env.VITE_PUBLIC || path.join(__dirname, '..', '..', 'public');
  };

  const trayIcon = new Tray(path.join(getPublicPath(), 'trayTemplate.png'));
  let popup: BrowserWindow | null = null;

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Open', click: () => togglePopup() },
    { label: 'Quit', click: () => app.quit() },
  ]);

  let lastHideTime = 0;
  const togglePopup = () => {
    // Prevent double-toggle when clicking tray to close
    if (Date.now() - lastHideTime < 300) {
      return;
    }

    // If popup exists and is not destroyed
    if (popup && !popup.isDestroyed()) {
      if (popup.isVisible()) {
        popup.hide();
        lastHideTime = Date.now();
      } else {
        popup.show();
      }
      return;
    }

    // Create new popup if it doesn't exist
    const trayBounds = trayIcon.getBounds();
    popup = createPopupWindow(trayBounds);

    // Set up event listeners only once when creating
    popup.on('closed', () => {
      popup = null;
    });

    popup.on('blur', () => {
      if (popup && !popup.isDestroyed() && popup.isVisible()) {
        popup.hide();
        lastHideTime = Date.now();
      }
    });

    // Popup is already visible from creation
  };

  trayIcon.setToolTip('Currency Exchange Widget');
  trayIcon.on('click', togglePopup);
  trayIcon.on('right-click', () => {
    trayIcon.popUpContextMenu(contextMenu);
  });

  return trayIcon;
}
