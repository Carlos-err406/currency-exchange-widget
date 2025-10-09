import { contextBridge, ipcRenderer } from 'electron';
import { pingInvokerFactory } from './ipc/ping/preload';
import { windowInvokerFactory } from './ipc/window/preload';

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipc', {
  ...pingInvokerFactory(ipcRenderer),
  ...windowInvokerFactory(ipcRenderer),
});
