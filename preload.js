const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getStore: () => ipcRenderer.invoke('store:get'),

  onStoreUpdated: (callback) => {
    const listener = (_, payload) => callback(payload);
    ipcRenderer.on('store:updated', listener);
    return () => ipcRenderer.removeListener('store:updated', listener);
  },

  // Settings
  updateSettings: (partialSettings) => ipcRenderer.invoke('settings:update', partialSettings),

  // Categories
  addCategory: (name) => ipcRenderer.invoke('categories:add', name),
  deleteCategory: (name) => ipcRenderer.invoke('categories:delete', name),

  // Replies
  addReply: (reply) => ipcRenderer.invoke('replies:add', reply),
  updateReply: (reply) => ipcRenderer.invoke('replies:update', reply),
  deleteReply: (id) => ipcRenderer.invoke('replies:delete', id),
  copyReply: (text, options) => ipcRenderer.invoke('clipboard:copyReply', text, options),

  // Links
  addLink: (link) => ipcRenderer.invoke('links:add', link),
  deleteLink: (id) => ipcRenderer.invoke('links:delete', id),
  openLink: (url) => ipcRenderer.invoke('links:open', url),

  // Notes
  saveNotes: (text) => ipcRenderer.invoke('notes:save', text),
});

