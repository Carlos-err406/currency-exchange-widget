import { IPC } from './ipc';

export async function getDailyImageUrl() {
  return IPC.get_daily_image();
}
