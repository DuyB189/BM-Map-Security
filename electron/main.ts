import { app, BrowserWindow, ipcMain, dialog, protocol } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createRequire } from 'module';
import type { DatabaseSync as SQLiteDatabaseSync } from 'node:sqlite';

const requireNode = createRequire(import.meta.url);
const { DatabaseSync } = requireNode('node:sqlite');

// Register the custom mbtiles scheme as privileged before app is ready
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'mbtiles',
    privileges: {
      bypassCSP: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true
    }
  }
]);

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main.js
// │ └─┬ preload.js
// ├─┬ dist
// │ └── index.html

process.env.APP_ROOT = path.join(__dirname, '..');

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron');
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST;

let win: BrowserWindow | null;

async function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 800,
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, fs.existsSync(path.join(__dirname, 'preload.mjs')) ? 'preload.mjs' : 'preload.js'),
      nodeIntegration: true,
      contextIsolation: true
    },
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'));
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
    win = null;
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// --------- IPC Database Handlers for 100% Offline Storage ---------
const getDataPath = () => {
  const userData = app.getPath('userData');
  if (!fs.existsSync(userData)) {
    fs.mkdirSync(userData, { recursive: true });
  }
  return path.join(userData, 'data.json');
};

ipcMain.handle('db:get-data', () => {
  try {
    const filePath = getDataPath();
    if (!fs.existsSync(filePath)) {
      console.log('Offline database file does not exist yet. Path:', filePath);
      return null;
    }
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading offline database:', error);
    return null;
  }
});

ipcMain.handle('db:save-data', (_event, newData) => {
  try {
    const filePath = getDataPath();
    fs.writeFileSync(filePath, JSON.stringify(newData, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Error writing to offline database:', error);
    throw error;
  }
});

// --------- 100% Offline MBTiles Database and Custom Protocol Setup ---------
let mbtilesDb: SQLiteDatabaseSync | null = null;
let mbtilesStmt: any = null;

const getMbtilesPath = () => {
  const userData = app.getPath('userData');
  if (!fs.existsSync(userData)) {
    fs.mkdirSync(userData, { recursive: true });
  }
  return path.join(userData, 'phuongbinhminh.mbtiles');
};

const initMbtilesDb = (filePath: string): boolean => {
  try {
    if (mbtilesDb) {
      mbtilesDb.close();
      mbtilesDb = null;
      mbtilesStmt = null;
    }
    
    if (fs.existsSync(filePath)) {
      mbtilesDb = new DatabaseSync(filePath, { readOnly: true });
      mbtilesStmt = mbtilesDb.prepare(
        'SELECT tile_data FROM tiles WHERE zoom_level = ? AND tile_column = ? AND tile_row = ?'
      );
      console.log('[Offline Map] Opened MBTiles SQLite database successfully at:', filePath);
      return true;
    } else {
      console.warn('[Offline Map] MBTiles file not found at:', filePath);
      return false;
    }
  } catch (err) {
    console.error('[Offline Map] Failed to open MBTiles SQLite database:', err);
    return false;
  }
};

const setupMbtilesFile = () => {
  const targetPath = getMbtilesPath();
  
  if (fs.existsSync(targetPath)) {
    console.log('[Offline Map] Found active MBTiles file in userData:', targetPath);
    initMbtilesDb(targetPath);
    return;
  }
  
  // If not found in userData, search in packaged resources or root
  const defaultMbtilesPath = app.isPackaged
    ? path.join(process.resourcesPath, 'phuongbinhminh.mbtiles')
    : path.join(process.env.APP_ROOT, 'phuongbinhminh.mbtiles');
    
  console.log('[Offline Map] Default packaged MBTiles path:', defaultMbtilesPath);
  
  if (fs.existsSync(defaultMbtilesPath)) {
    try {
      console.log('[Offline Map] Copying default packaged MBTiles file to userData...');
      fs.copyFileSync(defaultMbtilesPath, targetPath);
      console.log('[Offline Map] Successfully copied default MBTiles to:', targetPath);
      initMbtilesDb(targetPath);
    } catch (err) {
      console.error('[Offline Map] Failed to copy default MBTiles file, loading directly:', err);
      initMbtilesDb(defaultMbtilesPath);
    }
  } else {
    console.warn('[Offline Map] Default MBTiles file not found in package. Map will be empty until uploaded.');
  }
};

const registerMbtilesProtocol = () => {
  protocol.handle('mbtiles', async (request) => {
    try {
      const url = new URL(request.url);
      
      // Use robust regex matching /z/x/y anywhere in the URL path
      // This supports mbtiles://tiles/{z}/{x}/{y} as well as mbtiles:///{z}/{x}/{y}
      const match = url.pathname.match(/\/(\d+)\/(\d+)\/(\d+)/);
      if (match) {
        const z = parseInt(match[1], 10);
        const x = parseInt(match[2], 10);
        const y = parseInt(match[3], 10);
        
        // Convert Y coordinate from standard XYZ/slippy layout to Y-flipped TMS layout required by MBTiles
        const tmsY = Math.pow(2, z) - 1 - y;
        
        if (mbtilesStmt) {
          const row = mbtilesStmt.get(z, x, tmsY) as { tile_data: Buffer } | undefined;
          if (row && row.tile_data) {
            return new Response(row.tile_data as any, {
              headers: { 
                'Content-Type': 'image/png',
                'Access-Control-Allow-Origin': '*'
              }
            });
          }
        }
      }
    } catch (err) {
      console.error('[Offline Map Protocol] Error serving mbtiles tile:', err);
    }
    
    // Standard response for empty tiles is 204 No Content
    return new Response(null, { status: 204 });
  });
};

// Quiet fallback to avoid console log clutter when local tile server is not active
ipcMain.handle('get-tile-server-port', () => {
  return null;
});

// Getter to check the status of the offline map file
ipcMain.handle('get-map-status', () => {
  const targetPath = getMbtilesPath();
  const exists = fs.existsSync(targetPath);
  let sizeBytes = 0;
  let modifiedTime = null;
  if (exists) {
    const stats = fs.statSync(targetPath);
    sizeBytes = stats.size;
    modifiedTime = stats.mtime;
  }
  return {
    exists,
    path: targetPath,
    sizeBytes,
    modifiedTime,
    isLoaded: mbtilesDb !== null
  };
});

ipcMain.handle('db:update-map', async () => {
  try {
    const result = await dialog.showOpenDialog(win || undefined, {
      title: 'Chọn tệp bản đồ (.mbtiles) mới',
      filters: [{ name: 'Bản đồ MBTiles', extensions: ['mbtiles'] }],
      properties: ['openFile']
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, reason: 'cancelled' };
    }

    const newFilePath = result.filePaths[0];
    const targetPath = getMbtilesPath();

    console.log('[Offline Map Update] Closing current SQLite connection...');
    if (mbtilesDb) {
      mbtilesDb.close();
      mbtilesDb = null;
      mbtilesStmt = null;
    }

    console.log(`[Offline Map Update] Copying ${newFilePath} to ${targetPath}...`);
    fs.copyFileSync(newFilePath, targetPath);
    console.log('[Offline Map Update] Copy finished. Re-opening SQLite connection...');
    
    const initSuccess = initMbtilesDb(targetPath);
    
    if (initSuccess) {
      console.log('[Offline Map Update] Successfully updated map database!');
      return { success: true, path: targetPath };
    } else {
      return { success: false, reason: 'failed_to_initialize' };
    }
  } catch (error: any) {
    console.error('[Offline Map Update] Error updating map:', error);
    // Attempt to recover the database connection just in case
    setupMbtilesFile();
    return { success: false, reason: error.message || 'unknown_error' };
  }
});

app.whenReady().then(() => {
  setupMbtilesFile();
  registerMbtilesProtocol();
  createWindow();
});

