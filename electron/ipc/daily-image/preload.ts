import { GET_DAILY_IMAGE } from './channels';
import type { onGetDailyImage } from './main';

export const dailyImageInvokerFactory = (ipcRenderer: Electron.IpcRenderer) => ({
  [GET_DAILY_IMAGE]: (() => ipcRenderer.invoke(GET_DAILY_IMAGE)) as typeof onGetDailyImage,
});
