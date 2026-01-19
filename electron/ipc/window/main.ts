import { BrowserWindow, screen } from 'electron';
import $try from '@utils/try';
import { IPCRegisterFunction } from '../types';

import { saveWindowPosition } from '../../lib/config';
import {
  DRAG_END_CHANNEL,
  DRAG_MOVE_CHANNEL,
  DRAG_START_CHANNEL,
  GET_WINDOW_POSITION_CHANNEL,
  HIDE_WINDOW_CHANNEL,
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

    // Adjust position if the new size would go off-screen
    if (widget) {
      const [currentX, currentY] = widget.getPosition();
      const primaryDisplay = screen.getPrimaryDisplay();
      const {
        x: screenX,
        y: screenY,
        width: screenWidth,
        height: screenHeight,
      } = primaryDisplay.bounds;

      let newX = currentX;
      let newY = currentY;

      // Adjust if exceeds right
      if (currentX + width > screenX + screenWidth) {
        newX = screenX + screenWidth - width;
      }
      // Adjust if exceeds bottom
      if (currentY + height > screenY + screenHeight) {
        newY = screenY + screenHeight - height;
      }
      // Ensure not less than left
      if (newX < screenX) {
        newX = screenX;
      }
      // Ensure not less than top
      if (newY < screenY) {
        newY = screenY;
      }

      widget.setPosition(newX, newY);
    }
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

const onDragEnd = async (widget: BrowserWindow | null) => {
  if (!widget) return;
  log('Drag end');
  const [winX, winY] = widget.getPosition();

  // Use the config system to save position
  await saveWindowPosition({ x: winX, y: winY });

  dragging = false;
};

const onDragMove = (widget: BrowserWindow | null) => {
  if (!dragging || !widget || !startCursor || !startWindow) return;
  const cursor = screen.getCursorScreenPoint();
  const dx = cursor.x - startCursor.x;
  const dy = cursor.y - startCursor.y;
  log(`Drag move ${dx} x ${dy}`);

  const primaryDisplay = screen.getPrimaryDisplay();
  const {
    x: screenX,
    y: screenY,
    width: screenWidth,
    height: screenHeight,
  } = primaryDisplay.bounds;
  const [winWidth, winHeight] = widget.getSize();

  let newX = startWindow.x + dx;
  let newY = startWindow.y + dy;

  // Clamp X position
  newX = Math.max(screenX, Math.min(screenX + screenWidth - winWidth, newX));
  // Clamp Y position
  newY = Math.max(screenY, Math.min(screenY + screenHeight - winHeight, newY));

  widget.setPosition(newX, newY);
};

export const windowRegister: IPCRegisterFunction = (ipcMain, widget) => {
  ipcMain.handle(RESIZE_WINDOW_CHANNEL, (_, width, height) => onResize(widget, width, height));
  ipcMain.handle(GET_WINDOW_POSITION_CHANNEL, () => widget?.getPosition() || [0, 0]);
  ipcMain.handle(DRAG_START_CHANNEL, () => onDragStart(widget));
  ipcMain.handle(DRAG_END_CHANNEL, () => onDragEnd(widget));
  ipcMain.handle(DRAG_MOVE_CHANNEL, () => onDragMove(widget));
  ipcMain.handle(HIDE_WINDOW_CHANNEL, (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) win.hide();
  });
};
