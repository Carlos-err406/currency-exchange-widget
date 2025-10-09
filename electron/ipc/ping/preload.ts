import { PING_CHANNEL } from './channels';
import type { onPing } from './main';

export const pingInvokerFactory = (ipcRenderer: Electron.IpcRenderer) => ({
  [PING_CHANNEL]: (() => ipcRenderer.invoke(PING_CHANNEL)) as typeof onPing,
});
