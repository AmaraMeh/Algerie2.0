// Hybrid storage service that syncs between local storage and Firebase

const QRM_KEY = "qrmData";
const SYNC_KEY = "qrmLastSync";

class HybridStorage {
  constructor() {
    this.isOnline = navigator.onLine;
    this.syncInProgress = false;
    this.setupEventListeners();
  }

  setupEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncIfNeeded();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  async waitForFirebase() {
    if (window.FirebaseService) {
      await window.FirebaseService.init();
      return window.FirebaseService.isAuthenticated();
    }
    return false;
  }

  async getData() {
    try {
      // First, try to get data from local storage
      const localData = await this.getLocalData();
      
      // If user is authenticated and online, try to sync with Firebase
      if (this.isOnline && await this.waitForFirebase()) {
        try {
          const firebaseData = await window.FirebaseService.getUserData();
          // Merge Firebase data with local data (Firebase takes precedence)
          const mergedData = this.mergeData(localData, firebaseData);
          // Save merged data locally
          await this.setLocalData(mergedData);
          return mergedData;
        } catch (error) {
          console.warn('Failed to sync with Firebase, using local data:', error);
        }
      }
      
      return localData;
    } catch (error) {
      console.error('Error getting data:', error);
      return this.getDefaultData();
    }
  }

  async setData(data) {
    try {
      // Save to local storage first
      await this.setLocalData(data);
      
      // If user is authenticated and online, sync to Firebase
      if (this.isOnline && await this.waitForFirebase()) {
        try {
          await window.FirebaseService.syncData(data);
          await this.setLastSyncTime();
        } catch (error) {
          console.warn('Failed to sync to Firebase:', error);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error setting data:', error);
      throw error;
    }
  }

  async syncIfNeeded() {
    if (this.syncInProgress || !this.isOnline) return;
    
    this.syncInProgress = true;
    try {
      const lastSync = await this.getLastSyncTime();
      const now = Date.now();
      const syncInterval = 5 * 60 * 1000; // 5 minutes
      
      if (now - lastSync > syncInterval && await this.waitForFirebase()) {
        const localData = await this.getLocalData();
        await window.FirebaseService.syncData(localData);
        await this.setLastSyncTime();
      }
    } catch (error) {
      console.warn('Background sync failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  mergeData(localData, firebaseData) {
    // Simple merge strategy: Firebase data takes precedence
    // In a more sophisticated implementation, you might want to handle conflicts
    return {
      ...localData,
      ...firebaseData,
      categories: firebaseData.categories || localData.categories || []
    };
  }

  getDefaultData() {
    return {
      categories: [
        {
          id: crypto.randomUUID(),
          name: "Exemples",
          templates: [
            { id: crypto.randomUUID(), title: "Bienvenue", text: "Bonjour, comment puis-je vous aider ?" },
            { id: crypto.randomUUID(), title: "Infos Carte Étudiant", text: "Merci de fournir votre numéro d'étudiant et une pièce d'identité." }
          ]
        }
      ]
    };
  }

  async getLocalData() {
    return new Promise((resolve) => {
      chrome.storage.local.get([QRM_KEY], (res) => {
        const data = res[QRM_KEY] || this.getDefaultData();
        resolve(this.withDefaults(data));
      });
    });
  }

  async setLocalData(data) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [QRM_KEY]: data }, () => resolve());
    });
  }

  withDefaults(data) {
    if (!data || typeof data !== "object") data = {};
    if (!Array.isArray(data.categories)) {
      data.categories = this.getDefaultData().categories;
    }
    return data;
  }

  async getLastSyncTime() {
    return new Promise((resolve) => {
      chrome.storage.local.get([SYNC_KEY], (res) => {
        resolve(res[SYNC_KEY] || 0);
      });
    });
  }

  async setLastSyncTime() {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [SYNC_KEY]: Date.now() }, () => resolve());
    });
  }

  async upsertCategory(category) {
    const data = await this.getData();
    const index = data.categories.findIndex((c) => c.id === category.id);
    if (index >= 0) {
      data.categories[index] = category;
    } else {
      data.categories.push(category);
    }
    await this.setData(data);
    return category;
  }

  async deleteCategory(categoryId) {
    const data = await this.getData();
    data.categories = data.categories.filter((c) => c.id !== categoryId);
    await this.setData(data);
  }

  async upsertTemplate(categoryId, template) {
    const data = await this.getData();
    const category = data.categories.find((c) => c.id === categoryId);
    if (!category) throw new Error("Catégorie introuvable");
    const index = category.templates.findIndex((t) => t.id === template.id);
    if (index >= 0) {
      category.templates[index] = template;
    } else {
      category.templates.push(template);
    }
    await this.setData(data);
    return template;
  }

  async deleteTemplate(categoryId, templateId) {
    const data = await this.getData();
    const category = data.categories.find((c) => c.id === categoryId);
    if (!category) return;
    category.templates = category.templates.filter((t) => t.id !== templateId);
    await this.setData(data);
  }

  async shareTemplate(template, categoryName) {
    if (this.isOnline && await this.waitForFirebase()) {
      try {
        return await window.FirebaseService.shareTemplate(template, categoryName);
      } catch (error) {
        console.error('Failed to share template:', error);
        throw error;
      }
    } else {
      throw new Error('Cannot share template: offline or not authenticated');
    }
  }

  async getSharedTemplates() {
    if (this.isOnline && await this.waitForFirebase()) {
      try {
        return await window.FirebaseService.getSharedTemplates();
      } catch (error) {
        console.error('Failed to get shared templates:', error);
        return [];
      }
    }
    return [];
  }
}

// Create and export the hybrid storage instance
const hybridStorage = new HybridStorage();

// Export for use in other files
window.QRMStorage = hybridStorage;

export default hybridStorage;