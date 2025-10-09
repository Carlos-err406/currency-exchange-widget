import $try from '@utils/try';
import { type BrowserWindow, screen } from 'electron';
import fs from 'fs';
import { IPCRegisterFunction } from '../types';
import {
  DRAG_END_CHANNEL,
  DRAG_MOVE_CHANNEL,
  DRAG_START_CHANNEL,
  RESIZE_WINDOW_CHANNEL,
} from './channels';
import { log } from './utils';

let dragging = false;
let startCursor: { x: number; y: number } | null = null;
let startWindow: { x: number; y: number } | null = null;

export const onResize = async (widget: BrowserWindow | null, width: number, height: number) => {
  log(`resize request ${width}x${height}`);
  return $try(() => {
    widget?.setResizable(true);
    widget?.setSize(width, height);
    widget?.setResizable(false);
  });
};

const onDragStart = (widget: BrowserWindow | null) => {
  if (!widget) return;
  log('Drag start');
  const cursor = screen.getCursorScreenPoint();
  const [winX, winY] = widget.getPosition();
  startCursor = cursor;
  startWindow = { x: winX, y: winY };
  dragging = true;
};

const onDragEnd = (widget: BrowserWindow | null) => {
  if (!widget) return;
  log('Drag end');
  const [winX, winY] = widget.getPosition();
  fs.writeFileSync('data/pos.json', JSON.stringify({ x: winX, y: winY }));
  dragging = false;
};

const onDragMove = (widget: BrowserWindow | null) => {
  if (!dragging || !widget || !startCursor || !startWindow) return;
  const cursor = screen.getCursorScreenPoint();
  const dx = cursor.x - startCursor.x;
  const dy = cursor.y - startCursor.y;
  log(`Drag move ${dx} x ${dy}`);
  widget.setPosition(startWindow.x + dx, startWindow.y + dy);
};

export const windowRegister: IPCRegisterFunction = (ipcMain, widget) => {
  ipcMain.handle(RESIZE_WINDOW_CHANNEL, (_, width, height) => onResize(widget, width, height));
  ipcMain.handle(DRAG_START_CHANNEL, () => onDragStart(widget));
  ipcMain.handle(DRAG_END_CHANNEL, () => onDragEnd(widget));
  ipcMain.handle(DRAG_MOVE_CHANNEL, () => onDragMove(widget));
};
