import { IPC } from './ipc';

export const setWidgetSize = async (width: number, height: number) => {
  const result = await IPC.window_resize(width, height);
  console.log(result);
};

export const getWidgetPosition = async (): Promise<[number, number]> => {
  const result = await IPC.window_get_position();
  return result;
};

export const widgetStartDrag = async () => {
  const result = await IPC.window_drag_start();
  console.log(result);
};

export const widgetEndDrag = async () => {
  const result = await IPC.window_drag_end();
  console.log(result);
};

export const widgetDragMove = async () => {
  const result = await IPC.window_drag_move();
  console.log(result);
};
