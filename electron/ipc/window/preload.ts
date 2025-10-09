import { TryResult } from '@utils/try';
import {
  DRAG_END_CHANNEL,
  DRAG_MOVE_CHANNEL,
  DRAG_START_CHANNEL,
  MOVE_WINDOW_CHANNEL,
  RESIZE_WINDOW_CHANNEL,
} from './channels';

export const windowInvokerFactory = (ipcRenderer: Electron.IpcRenderer) => ({
  [RESIZE_WINDOW_CHANNEL]: ((...args) => ipcRenderer.invoke(RESIZE_WINDOW_CHANNEL, ...args)) as (
    w: number,
    h: number
  ) => Promise<TryResult<void>>,
  [MOVE_WINDOW_CHANNEL]: ((...args) => ipcRenderer.invoke(MOVE_WINDOW_CHANNEL, ...args)) as (
    dx: number,
    dy: number
  ) => Promise<TryResult<void>>,
  [DRAG_START_CHANNEL]: () => ipcRenderer.invoke(DRAG_START_CHANNEL),
  [DRAG_END_CHANNEL]: () => ipcRenderer.invoke(DRAG_END_CHANNEL),
  [DRAG_MOVE_CHANNEL]: () => ipcRenderer.invoke(DRAG_MOVE_CHANNEL),
});
