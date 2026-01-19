import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import registerIPCs from './ipc/register';
import { createTray, createWindow, getAppConfig } from './lib';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Set up environment
process.env.APP_ROOT = path.join(__dirname, '..');
process.env.VITE_PUBLIC = process.env['VITE_DEV_SERVER_URL']
  ? path.join(process.env.APP_ROOT, 'public')
  : path.join(process.env.APP_ROOT, 'dist');

let widget: BrowserWindow | null;
// let tray: Tray | null;

app.whenReady().then(async () => {
  // Hide from dock on macOS
  if (process.platform === 'darwin') {
    app.dock.hide();
  }

  const config = await getAppConfig();

  // Create window based on mode
  widget = await createWindow(config.mode === 'widget');
  registerIPCs(ipcMain, widget);

  // Create tray if in tray mode
  if (config.mode === 'tray') {
    createTray();
    // tray = createTray();
  }
});
