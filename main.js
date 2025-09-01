const { app, BrowserWindow, ipcMain, globalShortcut, clipboard, shell, nativeTheme } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const Store = require('electron-store');

const isMac = process.platform === 'darwin';
const isWin = process.platform === 'win32';
const isLinux = process.platform === 'linux';

const store = new Store({
  name: 'student-page-helper',
  defaults: {
    settings: {
      theme: 'dark',
      accentColor: '#7c3aed',
      autoPaste: false,
      alwaysOnTop: true
    },
    categories: ['Scholarships', 'Exams', 'General', 'Memes'],
    replies: [],
    links: [
      { id: 'eminha', label: 'E-Minha', url: 'https://eminha.gov' },
      { id: 'telegram', label: 'Telegram', url: 'https://web.telegram.org' },
      { id: 'drive', label: 'Google Drive', url: 'https://drive.google.com' },
      { id: 'ecampus', label: 'E-Campus', url: 'https://ecampus.edu' }
    ],
    notes: ''
  }
});

/**
 * Attempts to send Ctrl/Cmd+V to the active application using platform tools.
 * This is a best-effort approach and may require assistive access (macOS) or xdotool (Linux).
 */
function attemptSystemPaste() {
  return new Promise((resolve, reject) => {
    if (isWin) {
      const ps = `powershell -NoProfile -WindowStyle Hidden -Command "$wshell = New-Object -ComObject WScript.Shell; Start-Sleep -Milliseconds 80; $wshell.SendKeys('^v')"`;
      exec(ps, (err) => (err ? reject(err) : resolve()));
      return;
    }
    if (isMac) {
      const osa = `osascript -e 'tell application "System Events" to keystroke "v" using {command down}'`;
      exec(osa, (err) => (err ? reject(err) : resolve()));
      return;
    }
    if (isLinux) {
      // Requires xdotool on X11. On Wayland this may not work.
      const cmd = `sh -c "command -v xdotool >/dev/null 2>&1 && xdotool key ctrl+v || true"`;
      exec(cmd, (err) => (err ? reject(err) : resolve()));
      return;
    }
    resolve();
  });
}

let mainWindow = null;

function getAllRepliesFlattened() {
  const replies = store.get('replies') || [];
  // Keep insertion order
  return replies;
}

function sendStoreToRenderer() {
  if (mainWindow) {
    mainWindow.webContents.send('store:updated', {
      settings: store.get('settings'),
      categories: store.get('categories'),
      replies: store.get('replies'),
      links: store.get('links'),
      notes: store.get('notes')
    });
  }
}

function registerGlobalShortcuts() {
  // Unregister previous first
  globalShortcut.unregisterAll();

  for (let i = 1; i <= 9; i += 1) {
    const accelerator = `CommandOrControl+${i}`;
    globalShortcut.register(accelerator, async () => {
      const list = getAllRepliesFlattened();
      const reply = list[i - 1];
      if (!reply) return;
      clipboard.writeText(reply.text);
      if (store.get('settings.autoPaste')) {
        try {
          await attemptSystemPaste();
        } catch (_) {
          // ignore
        }
      }
    });
  }
}

function createWindow() {
  const { theme, alwaysOnTop } = store.get('settings');
  nativeTheme.themeSource = theme === 'dark' ? 'dark' : 'light';

  mainWindow = new BrowserWindow({
    width: 420,
    height: 560,
    minWidth: 360,
    minHeight: 420,
    alwaysOnTop: !!alwaysOnTop,
    resizable: true,
    movable: true,
    title: 'Student Page Helper',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  mainWindow.setAlwaysOnTop(!!alwaysOnTop, 'floating');
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();
  registerGlobalShortcuts();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// IPC: Store getters
ipcMain.handle('store:get', () => ({
  settings: store.get('settings'),
  categories: store.get('categories'),
  replies: store.get('replies'),
  links: store.get('links'),
  notes: store.get('notes')
}));

// IPC: Settings
ipcMain.handle('settings:update', (event, partialSettings) => {
  const current = store.get('settings');
  const next = { ...current, ...partialSettings };
  store.set('settings', next);
  if (typeof next.theme === 'string') {
    nativeTheme.themeSource = next.theme === 'dark' ? 'dark' : 'light';
  }
  if (mainWindow && typeof next.alwaysOnTop === 'boolean') {
    mainWindow.setAlwaysOnTop(!!next.alwaysOnTop, 'floating');
  }
  sendStoreToRenderer();
});

// IPC: Categories
ipcMain.handle('categories:add', (event, categoryName) => {
  const categories = store.get('categories') || [];
  if (!categoryName || categories.includes(categoryName)) return;
  categories.push(categoryName);
  store.set('categories', categories);
  sendStoreToRenderer();
});

ipcMain.handle('categories:delete', (event, categoryName) => {
  let categories = store.get('categories') || [];
  categories = categories.filter((c) => c !== categoryName);
  store.set('categories', categories);
  // Also remove replies in that category
  const replies = (store.get('replies') || []).filter((r) => r.category !== categoryName);
  store.set('replies', replies);
  sendStoreToRenderer();
});

// IPC: Replies
ipcMain.handle('replies:add', (event, reply) => {
  const replies = store.get('replies') || [];
  const newReply = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    text: reply.text || '',
    category: reply.category || 'General',
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  replies.push(newReply);
  store.set('replies', replies);
  sendStoreToRenderer();
  return newReply;
});

ipcMain.handle('replies:update', (event, updated) => {
  const replies = store.get('replies') || [];
  const idx = replies.findIndex((r) => r.id === updated.id);
  if (idx !== -1) {
    replies[idx] = { ...replies[idx], ...updated, updatedAt: Date.now() };
    store.set('replies', replies);
    sendStoreToRenderer();
  }
});

ipcMain.handle('replies:delete', (event, id) => {
  const replies = store.get('replies') || [];
  const next = replies.filter((r) => r.id !== id);
  store.set('replies', next);
  sendStoreToRenderer();
});

// IPC: Links
ipcMain.handle('links:add', (event, link) => {
  const links = store.get('links') || [];
  const item = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    label: link.label || link.url,
    url: link.url
  };
  links.push(item);
  store.set('links', links);
  sendStoreToRenderer();
  return item;
});

ipcMain.handle('links:delete', (event, id) => {
  const links = store.get('links') || [];
  store.set('links', links.filter((l) => l.id !== id));
  sendStoreToRenderer();
});

ipcMain.handle('links:open', (event, url) => {
  if (url) shell.openExternal(url);
});

// IPC: Notes
ipcMain.handle('notes:save', (event, text) => {
  store.set('notes', text || '');
  sendStoreToRenderer();
});

// IPC: Copy & Paste
ipcMain.handle('clipboard:copyReply', async (event, text, options = {}) => {
  clipboard.writeText(text || '');
  const shouldPaste = options.autoPaste ?? store.get('settings.autoPaste');
  if (shouldPaste) {
    try {
      await attemptSystemPaste();
    } catch (_) {
      // ignore best-effort
    }
  }
});

