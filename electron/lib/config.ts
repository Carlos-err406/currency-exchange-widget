import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'node:url';

// Interface for app configuration
export interface AppConfig {
  mode: 'widget' | 'tray';
}

// Interface for window position
export interface WindowPosition {
  x: number;
  y: number;
}

import { app } from 'electron';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Use app.getPath('userData') for persistent data that survives updates
const getUserDataDir = () => {
  try {
    return app.getPath('userData');
  } catch (e) {
    // Fallback for when app is not ready yet
    return path.join(process.env.APPDATA || process.env.HOME || '.', 'currency-exchange-widget');
  }
};

const CONFIG_FILE = 'config.json';
const POSITION_FILE = 'pos.json';
const getConfigPath = () => path.join(getUserDataDir(), CONFIG_FILE);
const getPositionPath = () => path.join(getUserDataDir(), POSITION_FILE);

// Default configuration
const DEFAULT_CONFIG: AppConfig = {
  mode: 'tray', // Default to tray mode
};

// Default position
const DEFAULT_POSITION: WindowPosition = {
  x: 50,
  y: 50,
};

/**
 * Ensures the user data directory exists
 */
function ensureUserDataDir(): void {
  const userDataDir = getUserDataDir();
  if (!fs.existsSync(userDataDir)) {
    fs.mkdirSync(userDataDir, { recursive: true });
  }
}

/**
 * Reads the app configuration from config file
 * @returns Promise<AppConfig> The app configuration
 */
export async function getAppConfig(): Promise<AppConfig> {
  const configPath = getConfigPath();

  try {
    if (fs.existsSync(configPath)) {
      const configData = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(configData);

      // Validate mode
      if (config.mode === 'widget' || config.mode === 'tray') {
        return { mode: config.mode };
      } else {
        console.log('Invalid mode in config file:', config.mode, 'using default');
      }
    }
  } catch (e) {
    console.log('Error reading config file:', e);
  }

  // Only create config file if it doesn't exist, don't overwrite existing files
  if (!fs.existsSync(configPath)) {
    console.log('No config file found, creating default config');
    await saveAppConfig(DEFAULT_CONFIG);
  }

  return DEFAULT_CONFIG;
}

/**
 * Saves the app configuration to config file
 * @param config The configuration to save
 */
export async function saveAppConfig(config: AppConfig): Promise<void> {
  try {
    ensureUserDataDir();
    fs.writeFileSync(getConfigPath(), JSON.stringify(config, null, 2));
  } catch (e) {
    console.error('Error saving config file:', e);
  }
}

/**
 * Updates the app mode
 * @param mode The new mode to set
 */
export async function setAppMode(mode: 'widget' | 'tray'): Promise<void> {
  const config = await getAppConfig();
  config.mode = mode;
  await saveAppConfig(config);
}

/**
 * Gets the current app mode
 * @returns Promise<"widget" | "tray"> The current mode
 */
export async function getAppMode(): Promise<'widget' | 'tray'> {
  const config = await getAppConfig();
  return config.mode;
}

/**
 * Initializes config with default values only if no config exists
 * Used by installer to set initial configuration
 */
export async function initializeConfig(mode: 'widget' | 'tray'): Promise<void> {
  if (!fs.existsSync(getConfigPath())) {
    await saveAppConfig({ mode });
  }
}

/**
 * Reads the window position from position file
 * @returns Promise<WindowPosition> The window position
 */
export async function getWindowPosition(): Promise<WindowPosition> {
  const positionPath = getPositionPath();

  try {
    if (fs.existsSync(positionPath)) {
      const positionData = fs.readFileSync(positionPath, 'utf8');
      const position = JSON.parse(positionData);

      // Validate position has x and y
      if (typeof position.x === 'number' && typeof position.y === 'number') {
        return { x: position.x, y: position.y };
      }
    }
  } catch (e) {
    console.log('Error reading position file:', e);
  }

  // If no position file exists or invalid position, create one with default values
  await saveWindowPosition(DEFAULT_POSITION);
  return DEFAULT_POSITION;
}

/**
 * Saves the window position to position file
 * @param position The position to save
 */
export async function saveWindowPosition(position: WindowPosition): Promise<void> {
  try {
    ensureUserDataDir();
    fs.writeFileSync(getPositionPath(), JSON.stringify(position, null, 2));
  } catch (e) {
    console.error('Error saving position file:', e);
  }
}

/**
 * Gets the preload script path
 * @returns string The path to the preload script
 */
export function getPreloadPath(): string {
  return path.join(__dirname, 'preload.mjs');
}
