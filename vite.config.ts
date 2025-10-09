import tailwindcss from '@tailwindcss/vite'; // import here
import react from '@vitejs/plugin-react';
import path, { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import electron from 'vite-plugin-electron/simple';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    watch: {
      ignored: ['**/data/pos.json'],
    },
  },
  plugins: [
    tailwindcss(),
    react(),
    electron({
      main: {
        // Shortcut of `build.lib.entry`.
        entry: 'electron/main.ts',
        vite: {
          build: {
            rollupOptions: {
              external: ['node-window-manager', 'extract-file-icon', /\.node$/],
            },
          },
          resolve: {
            alias: {
              '@': resolve(__dirname, './src'),
              '@utils': resolve(__dirname, './utils'),
            },
          },
        },
      },
      preload: {
        // Shortcut of `build.rollupOptions.input`.
        // Preload scripts may contain Web assets, so use the `build.rollupOptions.input` instead `build.lib.entry`.
        input: path.join(__dirname, 'electron/preload.ts'),
        vite: {
          build: {
            rollupOptions: {
              external: ['node-window-manager', 'extract-file-icon', /\.node$/],
            },
          },
          resolve: {
            alias: {
              '@': resolve(__dirname, './src'),
              '@utils': resolve(__dirname, './utils'),
            },
          },
        },
      },
      // Ployfill the Electron and Node.js API for Renderer process.
      // If you want use Node.js in Renderer process, the `nodeIntegration` needs to be enabled in the Main process.
      // See 👉 https://github.com/electron-vite/vite-plugin-electron-renderer
      renderer:
        process.env.NODE_ENV === 'test'
          ? // https://github.com/electron-vite/vite-plugin-electron-renderer/issues/78#issuecomment-2053600808
            undefined
          : {},
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@electron': resolve(__dirname, './electron'),
      '@utils': resolve(__dirname, './utils'),
    },
  },
});
