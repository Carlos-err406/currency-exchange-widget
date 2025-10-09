import { BrowserWindow } from 'electron';
import { pingInvokerFactory } from './ping/preload';
import { windowInvokerFactory } from './window/preload';
import { dailyImageInvokerFactory } from './daily-image/preload';

export type IPCRegisterFunction = (ipcMain: Electron.IpcMain, widget: BrowserWindow | null) => void;

export type IPC = ReturnType<typeof pingInvokerFactory> &
  ReturnType<typeof windowInvokerFactory> &
  ReturnType<typeof dailyImageInvokerFactory>;
