import { BrowserWindow } from 'electron';
import { pingRegister } from './ping/main';
import { windowRegister } from './window/main';

export default function registerIPCs(ipcMain: Electron.IpcMain, widget: BrowserWindow|null): void {
  [pingRegister, windowRegister].forEach((registerFn) => registerFn(ipcMain, widget));
}
