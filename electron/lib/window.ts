import { BrowserWindow, screen } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getWindowPosition, getPreloadPath } from './config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Environment variables
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
const getRendererDist = () => {
  const appRoot = process.env.APP_ROOT || path.join(__dirname, '..', '..');
  return path.join(appRoot, 'dist');
};

const getBaseWindowConfig = () => {
  return {
    width: 36,
    height: 36,
    webPreferences: {
      devTools: false,
      nodeIntegration: true,
      enableWebSQL: false,
      preload: getPreloadPath(),
    },
  };
};

export async function createWindow(visible: boolean = true): Promise<BrowserWindow> {
  const lastPosition = await getWindowPosition();
  const baseWindowConfig = getBaseWindowConfig();

  const config = visible
    ? {
        ...baseWindowConfig,
        ...lastPosition,
        frame: false,
        title: 'Currency Exchange Widget',
        transparent: true,
        alwaysOnTop: false,
        skipTaskbar: true,
        resizable: false,
        minimizable: false,
        center: true,
        maximizable: false,
      }
    : {
        ...baseWindowConfig,
        show: false,
      };

  const window = new BrowserWindow(config);

  if (VITE_DEV_SERVER_URL) {
    window.loadURL(VITE_DEV_SERVER_URL);
  } else {
    window.loadFile(path.join(getRendererDist(), 'index.html'));
  }

  return window;
}

interface PopupPosition {
  x: number;
  y: number;
}

interface TrayBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

function calculatePopupPosition(
  trayBounds: TrayBounds,
  popupSize: { width: number; height: number },
  screenBounds: { x: number; y: number; width: number; height: number }
): PopupPosition {
  const { x: trayX, y: trayY, width: trayWidth, height: trayHeight } = trayBounds;
  const { width: popupWidth, height: popupHeight } = popupSize;
  const { x: screenX, y: screenY, width: screenWidth, height: screenHeight } = screenBounds;

  // Calculate tray center
  const trayCenterX = trayX + trayWidth / 2;
  const trayCenterY = trayY + trayHeight / 2;

  // Default position: center popup on tray icon
  let popupX = trayCenterX - popupWidth / 2;
  let popupY = trayCenterY - popupHeight / 2;

  // Determine tray position and adjust popup accordingly
  const isBottomTray = trayY > screenHeight / 2;
  const isTopTray = trayY < screenHeight / 2;

  // Position popup based on tray location
  if (isBottomTray) {
    // Tray at bottom - show popup above
    popupY = trayY - popupHeight - 10;
  } else if (isTopTray) {
    // Tray at top - show popup below
    popupY = trayY + trayHeight + 10;
  }

  // Ensure popup stays within screen bounds
  if (popupX < screenX) {
    popupX = screenX + 10;
  } else if (popupX + popupWidth > screenX + screenWidth) {
    popupX = screenX + screenWidth - popupWidth - 10;
  }

  if (popupY < screenY) {
    popupY = screenY + 10;
  } else if (popupY + popupHeight > screenY + screenHeight) {
    popupY = screenY + screenHeight - popupHeight - 10;
  }

  return { x: Math.round(popupX), y: Math.round(popupY) };
}

export function createPopupWindow(trayBounds?: TrayBounds): BrowserWindow {
  const popupSize = { width: 500, height: 560 };

  // Get primary display bounds
  const primaryDisplay = screen.getPrimaryDisplay();
  const screenBounds = primaryDisplay.workAreaSize;
  const screenPosition = primaryDisplay.workArea;

  // Calculate position
  let position: PopupPosition;
  if (trayBounds) {
    position = calculatePopupPosition(trayBounds, popupSize, {
      x: screenPosition.x,
      y: screenPosition.y,
      width: screenBounds.width,
      height: screenBounds.height,
    });
  } else {
    // Default to center if no tray bounds provided
    position = {
      x: screenPosition.x + (screenBounds.width - popupSize.width) / 2,
      y: screenPosition.y + (screenBounds.height - popupSize.height) / 2,
    };
  }

  const popup = new BrowserWindow({
    width: popupSize.width,
    height: popupSize.height,
    x: position.x,
    y: position.y,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    minimizable: false,
    maximizable: false,
    show: true, // Show immediately but will be positioned correctly
    thickFrame: false, // Disable Windows window animations
    webPreferences: {
      devTools: false,
      nodeIntegration: true,
      enableWebSQL: false,
      preload: getPreloadPath(),
    },
  });

  // Load the same content but we'll handle routing in React
  if (VITE_DEV_SERVER_URL) {
    popup.loadURL(`${VITE_DEV_SERVER_URL}?popup=true`);
  } else {
    popup.loadFile(path.join(getRendererDist(), 'index.html'), {
      query: { popup: 'true' },
    });
  }

  return popup;
}
