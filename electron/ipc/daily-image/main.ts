import $try from '@utils/try';
import dayjs from 'dayjs';
import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import { IPCRegisterFunction } from '../types';
import { GET_DAILY_IMAGE } from './channels';
import { log } from './utils';

// Get persistent user data directory for images
const getUserDataDir = () => {
  try {
    return app.getPath('userData');
  } catch (e) {
    // Fallback for when app is not ready yet
    return path.join(process.env.APPDATA || process.env.HOME || '.', 'currency-exchange-widget');
  }
};

const ensureUserDataDir = () => {
  const userDataDir = getUserDataDir();
  if (!fs.existsSync(userDataDir)) {
    fs.mkdirSync(userDataDir, { recursive: true });
  }
  return userDataDir;
};

// Clean up old daily images, keeping only today's image
const cleanupOldImages = (userDataDir: string, todayImageName: string) => {
  try {
    const files = fs.readdirSync(userDataDir);
    const imageFiles = files.filter(
      (file) =>
        file.endsWith('.png') &&
        file.match(/^\d{4}-\d{2}-\d{2}\.png$/) && // Match YYYY-MM-DD.png pattern
        file !== todayImageName
    );

    imageFiles.forEach((file) => {
      const filePath = path.join(userDataDir, file);
      try {
        fs.rmSync(filePath);
        log(`Deleted old image: ${file}`);
      } catch (e) {
        log(`Failed to delete old image ${file}:`, e);
      }
    });

    if (imageFiles.length > 0) {
      log(`Cleaned up ${imageFiles.length} old daily images`);
    }
  } catch (e) {
    log('Error during image cleanup:', e);
  }
};

export const onGetDailyImage = async () => {
  log('Get daily image');
  return $try(async () => {
    const name = dayjs().format('YYYY-MM-DD');
    const todayImageName = `${name}.png`;
    const userDataDir = ensureUserDataDir();
    const imagePath = path.join(userDataDir, todayImageName);

    // Clean up old images first
    cleanupOldImages(userDataDir, todayImageName);

    if (!fs.existsSync(imagePath)) {
      await fetch('https://wa.cambiocuba.money/trmi.png')
        .then((res) => res.arrayBuffer())
        .then((buffer) => fs.writeFileSync(imagePath, Buffer.from(buffer)));
      log(`Downloaded new daily image: ${todayImageName}`);
    }

    const imageBuffer = fs.readFileSync(imagePath);
    const base64 = imageBuffer.toString('base64');
    return `data:image/png;base64,${base64}`;
  });
};

export const dailyImageRegister: IPCRegisterFunction = (ipcMain) =>
  ipcMain.handle(GET_DAILY_IMAGE, onGetDailyImage);
