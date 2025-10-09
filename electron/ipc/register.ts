import { BrowserWindow } from 'electron';
import { pingRegister } from './ping/main';
import { windowRegister } from './window/main';
import { dailyImageRegister } from './daily-image/main';

export default function registerIPCs(
  ipcMain: Electron.IpcMain,
  widget: BrowserWindow | null
): void {
  [pingRegister, windowRegister, dailyImageRegister].forEach((registerFn) =>
    registerFn(ipcMain, widget)
  );
}
