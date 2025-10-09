import $try from '@utils/try';
import { IPCRegisterFunction } from '../types';
import { PING_CHANNEL } from './channels';
import { log } from './utils';

export const onPing = async () => {
  log('ping request');
  return $try(() => 'pong');
};

export const pingRegister: IPCRegisterFunction = (ipcMain) =>
  ipcMain.handle(PING_CHANNEL, onPing);
