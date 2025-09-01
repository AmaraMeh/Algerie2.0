const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getData: () => ipcRenderer.invoke('get-data'),

  // Quick replies
  addReply: (text, category) => ipcRenderer.invoke('add-reply', { text, category }),
  updateReply: (id, text, category) => ipcRenderer.invoke('update-reply', { id, text, category }),
  deleteReply: (id) => ipcRenderer.invoke('delete-reply', id),

  // Categories
  addCategory: (name) => ipcRenderer.invoke('add-category', name),
  deleteCategory: (name) => ipcRenderer.invoke('delete-category', name),

  // Links
  addLink: (title, url) => ipcRenderer.invoke('add-link', { title, url }),
  updateLink: (id, title, url) => ipcRenderer.invoke('update-link', { id, title, url }),
  deleteLink: (id) => ipcRenderer.invoke('delete-link', id),

  // Notes & Settings
  saveNotes: (text) => ipcRenderer.invoke('save-notes', text),
  setSettings: (patch) => ipcRenderer.invoke('set-settings', patch),

  // Utils
  copy: (text, withAutoPaste = false) => ipcRenderer.invoke('copy', { text, withAutoPaste }),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),

  // Window controls
  minimize: () => ipcRenderer.invoke('window:minimize'),
  close: () => ipcRenderer.invoke('window:close'),

  // Events
  onDataUpdated: (cb) => {
    ipcRenderer.on('data-updated', (_event, data) => cb(data));
  }
});

