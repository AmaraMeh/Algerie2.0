const { app, BrowserWindow, globalShortcut, ipcMain, clipboard, shell } = require('electron');
const path = require('path');
const Store = require('electron-store');

const store = new Store();

let mainWindow;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 400,
    height: 600,
    minWidth: 300,
    minHeight: 400,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'icon.png'),
    title: 'Student Page Helper'
  });

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../build/index.html'));
  }

  // Make window draggable
  mainWindow.setMovable(true);

  // Handle window close
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Prevent window from being closed accidentally
  mainWindow.on('close', (event) => {
    if (!app.isQuiting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  // Register global shortcuts
  registerGlobalShortcuts();
}

function registerGlobalShortcuts() {
  // Get saved replies for shortcuts
  const replies = store.get('replies', []);
  
  replies.forEach((reply, index) => {
    if (index < 9) { // Limit to 9 shortcuts (Ctrl+1 to Ctrl+9)
      globalShortcut.register(`CommandOrControl+${index + 1}`, () => {
        clipboard.writeText(reply.text);
        // Auto-paste functionality
        mainWindow.webContents.send('auto-paste', reply.text);
      });
    }
  });
}

// App event handlers
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', () => {
  app.isQuiting = true;
});

// IPC handlers
ipcMain.handle('get-store-value', (event, key) => {
  return store.get(key);
});

ipcMain.handle('set-store-value', (event, key, value) => {
  store.set(key, value);
  // Re-register shortcuts if replies changed
  if (key === 'replies') {
    globalShortcut.unregisterAll();
    registerGlobalShortcuts();
  }
  return true;
});

ipcMain.handle('open-external', (event, url) => {
  shell.openExternal(url);
});

ipcMain.handle('copy-to-clipboard', (event, text) => {
  clipboard.writeText(text);
  return true;
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('minimize-window', () => {
  mainWindow.minimize();
});

ipcMain.handle('close-window', () => {
  app.quit();
});

ipcMain.handle('toggle-always-on-top', () => {
  const isAlwaysOnTop = mainWindow.isAlwaysOnTop();
  mainWindow.setAlwaysOnTop(!isAlwaysOnTop);
  return !isAlwaysOnTop;
});