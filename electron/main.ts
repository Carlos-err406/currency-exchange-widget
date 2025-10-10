import { app, BrowserWindow, ipcMain, Menu, Tray } from 'electron';
import fs from 'fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import registerIPCs from './ipc/register';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.env.APP_ROOT = path.join(__dirname, '..');

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron');
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST;

let widget: BrowserWindow | null;
let tray: Tray | null;

if (!fs.existsSync('data/pos.json')) {
  fs.mkdirSync('data');
  fs.writeFileSync('data/pos.json', JSON.stringify({ x: 50, y: 50 }));
}
const lastPosition = JSON.parse(fs.readFileSync('data/pos.json', 'utf8'));

function createWindow() {
  widget = new BrowserWindow({
    frame: false,
    width: 36,
    height: 36,
    ...lastPosition,
    title: 'Currency Exchange Widget',
    transparent: true,
    alwaysOnTop: false,
    skipTaskbar: true,
    resizable: false,
    minimizable: false,
    center: true,
    maximizable: false,
    webPreferences: {
      devTools: true,
      nodeIntegration: true,
      enableWebSQL: false,
      preload: path.join(__dirname, 'preload.mjs'),
    },
  });

  if (VITE_DEV_SERVER_URL) {
    widget.loadURL(VITE_DEV_SERVER_URL);
  } else {
    // win.loadFile('dist/index.html')
    widget.loadFile(path.join(RENDERER_DIST, 'index.html'));
  }
}

function createTray() {
  tray = new Tray(path.join(process.env.VITE_PUBLIC, 'logo192.png'));
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Widget',
      click: () => {
        widget?.show();
      },
    },
    { label: 'Quit', click: () => app.quit() },
  ]);
  tray.setToolTip('Currency Exchange Widget');
  tray.setContextMenu(contextMenu);
  tray.on('click', () => {
    if (!widget) return;
    widget.isVisible() ? widget.hide() : widget.show();
  });
}

app.whenReady().then(async () => {
  createWindow();
  createTray();
  registerIPCs(ipcMain, widget);
});
