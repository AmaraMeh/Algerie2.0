const { app, BrowserWindow, ipcMain, shell, clipboard, globalShortcut, nativeTheme } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const crypto = require('crypto');
const Store = require('electron-store');

/**
 * Persistent storage with sensible defaults
 */
const defaultData = () => ({
  replies: [
    { id: crypto.randomUUID(), text: 'Hi! Thanks for reaching out 🙌', category: 'General' },
    { id: crypto.randomUUID(), text: 'Scholarship deadlines are in Highlights. Check them out!', category: 'Scholarships' },
    { id: crypto.randomUUID(), text: 'Exam schedules are posted by the faculty. Please check the portal.', category: 'Exams' }
  ],
  categories: ['General', 'Scholarships', 'Exams', 'Memes'],
  links: [
    { id: crypto.randomUUID(), title: 'E-Minha', url: 'https://example.com/e-minha' },
    { id: crypto.randomUUID(), title: 'Telegram', url: 'https://web.telegram.org' },
    { id: crypto.randomUUID(), title: 'Google Drive', url: 'https://drive.google.com' },
    { id: crypto.randomUUID(), title: 'E-Campus', url: 'https://example.com/e-campus' }
  ],
  notes: '',
  settings: {
    theme: 'dark',
    accentColor: '#7c3aed',
    alwaysOnTop: true,
    autoPaste: false
  }
});

const store = new Store({ name: 'student-page-helper', defaults: defaultData() });

/** @type {BrowserWindow | null} */
let mainWindow = null;

function getData() {
  return {
    replies: store.get('replies'),
    categories: store.get('categories'),
    links: store.get('links'),
    notes: store.get('notes'),
    settings: store.get('settings')
  };
}

function createMainWindow() {
  const settings = store.get('settings');

  mainWindow = new BrowserWindow({
    width: 420,
    height: 640,
    minWidth: 360,
    minHeight: 480,
    title: 'Student Page Helper',
    alwaysOnTop: Boolean(settings.alwaysOnTop),
    frame: false,
    resizable: true,
    transparent: false,
    show: true,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.setAlwaysOnTop(Boolean(settings.alwaysOnTop), 'floating');
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  // Optional: open devtools in dev mode
  if (!app.isPackaged) {
    // mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function sendDataUpdated() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('data-updated', getData());
  }
}

async function attemptAutoPaste() {
  const platform = process.platform;
  return await new Promise((resolve) => {
    if (platform === 'linux') {
      exec('command -v xdotool', (err) => {
        if (err) {
          resolve(false);
          return;
        }
        exec('xdotool key --clearmodifiers ctrl+v', (err2) => {
          resolve(!err2);
        });
      });
    } else if (platform === 'darwin') {
      const script = "osascript -e 'tell application \"System Events\" to keystroke \"v\" using command down'";
      exec(script, (err) => resolve(!err));
    } else if (platform === 'win32') {
      const ps = "powershell -NoProfile -Command \"$ws = New-Object -ComObject WScript.Shell; $ws.SendKeys('^v')\"";
      exec(ps, { windowsHide: true }, (err) => resolve(!err));
    } else {
      resolve(false);
    }
  });
}

function registerShortcuts() {
  globalShortcut.unregisterAll();
  const settings = store.get('settings');
  const replies = store.get('replies') || [];

  // Register Ctrl+Alt+1..9
  for (let i = 1; i <= 9; i++) {
    const accelerator = `Control+Alt+${i}`; // Works on Linux/Windows. On macOS, user can remap.
    try {
      globalShortcut.register(accelerator, async () => {
        const currentReplies = store.get('replies') || [];
        const index = i - 1;
        if (currentReplies[index]) {
          const text = currentReplies[index].text;
          clipboard.writeText(text || '');
          if (settings.autoPaste) {
            await attemptAutoPaste();
          }
        }
      });
    } catch (_e) {
      // ignore registration errors
    }
  }
}

// IPC handlers
ipcMain.handle('get-data', () => getData());

ipcMain.handle('add-reply', (_e, { text, category }) => {
  const replies = store.get('replies') || [];
  const newReply = { id: crypto.randomUUID(), text: String(text || ''), category: String(category || 'General') };
  store.set('replies', [...replies, newReply]);
  registerShortcuts();
  sendDataUpdated();
  return newReply;
});

ipcMain.handle('update-reply', (_e, { id, text, category }) => {
  const replies = store.get('replies') || [];
  const updated = replies.map(r => r.id === id ? { ...r, text: String(text ?? r.text), category: String(category ?? r.category) } : r);
  store.set('replies', updated);
  sendDataUpdated();
  return true;
});

ipcMain.handle('delete-reply', (_e, id) => {
  const replies = store.get('replies') || [];
  store.set('replies', replies.filter(r => r.id !== id));
  registerShortcuts();
  sendDataUpdated();
  return true;
});

ipcMain.handle('add-category', (_e, name) => {
  const categories = store.get('categories') || [];
  if (!categories.includes(name)) {
    store.set('categories', [...categories, name]);
    sendDataUpdated();
  }
  return true;
});

ipcMain.handle('delete-category', (_e, name) => {
  const categories = store.get('categories') || [];
  store.set('categories', categories.filter(c => c !== name));
  sendDataUpdated();
  return true;
});

ipcMain.handle('add-link', (_e, { title, url }) => {
  const links = store.get('links') || [];
  const newLink = { id: crypto.randomUUID(), title: String(title || 'Untitled'), url: String(url || '') };
  store.set('links', [...links, newLink]);
  sendDataUpdated();
  return newLink;
});

ipcMain.handle('update-link', (_e, { id, title, url }) => {
  const links = store.get('links') || [];
  const updated = links.map(l => l.id === id ? { ...l, title: String(title ?? l.title), url: String(url ?? l.url) } : l);
  store.set('links', updated);
  sendDataUpdated();
  return true;
});

ipcMain.handle('delete-link', (_e, id) => {
  const links = store.get('links') || [];
  store.set('links', links.filter(l => l.id !== id));
  sendDataUpdated();
  return true;
});

ipcMain.handle('save-notes', (_e, text) => {
  store.set('notes', String(text || ''));
  sendDataUpdated();
  return true;
});

ipcMain.handle('set-settings', (_e, patch) => {
  const current = store.get('settings') || {};
  const next = { ...current, ...patch };
  store.set('settings', next);

  if (typeof next.alwaysOnTop === 'boolean' && mainWindow) {
    mainWindow.setAlwaysOnTop(next.alwaysOnTop, 'floating');
  }
  if (next.theme) {
    const source = next.theme === 'dark' ? 'dark' : next.theme === 'light' ? 'light' : 'system';
    try { nativeTheme.themeSource = source; } catch (_e) {}
  }
  registerShortcuts();
  sendDataUpdated();
  return next;
});

ipcMain.handle('copy', async (_e, { text, withAutoPaste }) => {
  clipboard.writeText(String(text || ''));
  if (withAutoPaste) {
    await attemptAutoPaste();
  }
  return true;
});

ipcMain.handle('open-external', (_e, url) => shell.openExternal(String(url)));

// Window controls for frameless UI
ipcMain.handle('window:minimize', () => { if (mainWindow) mainWindow.minimize(); return true; });
ipcMain.handle('window:close', () => { app.quit(); return true; });

app.on('ready', () => {
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.student.page.helper');
  }
  createMainWindow();
  registerShortcuts();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  // On Linux/Windows, quit when all windows are closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

