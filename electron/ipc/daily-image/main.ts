import $try from '@utils/try';
import dayjs from 'dayjs';
import fs from 'fs';
import path from 'path';
import { IPCRegisterFunction } from '../types';
import { GET_DAILY_IMAGE } from './channels';
import { log } from './utils';

export const onGetDailyImage = async () => {
  log('Get daily image');
  return $try(async () => {
    const name = dayjs().format('YYYY-MM-DD');
    const imagePath = path.join('data', `${name}.png`);
    if (!fs.existsSync(imagePath)) {
      await fetch('https://wa.cambiocuba.money/trmi.png')
        .then((res) => res.arrayBuffer())
        .then((buffer) => fs.writeFileSync(imagePath, Buffer.from(buffer)));
    }
    const imageBuffer = fs.readFileSync(imagePath);
    const base64 = imageBuffer.toString('base64');
    return `data:image/png;base64,${base64}`;
  });
};

export const dailyImageRegister: IPCRegisterFunction = (ipcMain) =>
  ipcMain.handle(GET_DAILY_IMAGE, onGetDailyImage);
