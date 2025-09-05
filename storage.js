
const STORAGE_KEY = "qrm_data_v1";

function getFromStorage(keys) {
  return new Promise((resolve) => {
    chrome.storage.local.get(keys, (result) => resolve(result));
  });
}

function setToStorage(obj) {
  return new Promise((resolve) => {
    chrome.storage.local.set(obj, () => resolve());
  });
}

function generateId(prefix = "id") {
  try {
    if (crypto && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch (_) {}
  return (
    prefix +
    "_" +
    Math.random().toString(36).slice(2) +
    Date.now().toString(36)
  );
}

async function getAll() {
  const data = (await getFromStorage([STORAGE_KEY]))[STORAGE_KEY];
  if (data && data.categories) {
    return data;
  }
  const seed = {
    categories: [
      {
        id: generateId("cat"),
        name: "Exemples",
        templates: [
          {
            id: generateId("tpl"),
            title: "Bienvenue",
            text:
              "Bonjour,\nMerci pour votre message. Comment puis-je vous aider ?",
            updatedAt: Date.now(),
          },
        ],
      },
    ],
    updatedAt: Date.now(),
  };
  await setToStorage({ [STORAGE_KEY]: seed });
  return seed;
}

async function saveAll(data) {
  data.updatedAt = Date.now();
  await setToStorage({ [STORAGE_KEY]: data });
  return data;
}

export const QRMStorage = {
  async getCategories() {
    const data = await getAll();
    return data.categories;
  },
  async addCategory(name) {
    const data = await getAll();
    const newCat = { id: generateId("cat"), name, templates: [] };
    data.categories.push(newCat);
    await saveAll(data);
    return newCat;
  },
  async updateCategory(categoryId, name) {
    const data = await getAll();
    const cat = data.categories.find((c) => c.id === categoryId);
    if (!cat) return null;
    cat.name = name;
    await saveAll(data);
    return cat;
  },
  async removeCategory(categoryId) {
    const data = await getAll();
    const idx = data.categories.findIndex((c) => c.id === categoryId);
    if (idx === -1) return false;
    data.categories.splice(idx, 1);
    await saveAll(data);
    return true;
  },
  async addTemplate(categoryId, { title, text }) {
    const data = await getAll();
    const cat = data.categories.find((c) => c.id === categoryId);
    if (!cat) return null;
    const tpl = { id: generateId("tpl"), title, text, updatedAt: Date.now() };
    cat.templates.push(tpl);
    await saveAll(data);
    return tpl;
  },
  async updateTemplate(categoryId, templateId, { title, text }) {
    const data = await getAll();
    const cat = data.categories.find((c) => c.id === categoryId);
    if (!cat) return null;
    const tpl = cat.templates.find((t) => t.id === templateId);
    if (!tpl) return null;
    if (typeof title === "string") tpl.title = title;
    if (typeof text === "string") tpl.text = text;
    tpl.updatedAt = Date.now();
    await saveAll(data);
    return tpl;
  },
  async removeTemplate(categoryId, templateId) {
    const data = await getAll();
    const cat = data.categories.find((c) => c.id === categoryId);
    if (!cat) return false;
    const idx = cat.templates.findIndex((t) => t.id === templateId);
    if (idx === -1) return false;
    cat.templates.splice(idx, 1);
    await saveAll(data);
    return true;
  },
  async searchTemplates(query) {
    const q = (query || "").trim().toLowerCase();
    if (!q) return [];
    const categories = await this.getCategories();
    const results = [];
    for (const cat of categories) {
      for (const tpl of cat.templates) {
        if (
          tpl.title.toLowerCase().includes(q) ||
          tpl.text.toLowerCase().includes(q) ||
          cat.name.toLowerCase().includes(q)
        ) {
          results.push({
            categoryId: cat.id,
            categoryName: cat.name,
            templateId: tpl.id,
            title: tpl.title,
            text: tpl.text,
          });
        }
      }
    }
    return results;
  },
  onChanged(listener) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "local") return;
      if (STORAGE_KEY in changes) {
        listener(changes[STORAGE_KEY].newValue);
      }
    });
  },
};

export default QRMStorage;

=======
/**
 * Gestionnaire de stockage pour Quick Reply Manager
 * Utilise chrome.storage.local pour persister les données
 */

class StorageManager {
  constructor() {
    this.storageKey = 'quickReplyData';
    this.defaultData = {
      categories: [
        {
          id: 'default',
          name: 'Général',
          replies: [
            {
              id: 'welcome',
              title: 'Message de bienvenue',
              text: 'Bonjour,\n\nMerci pour votre message. Je vous répondrai dans les plus brefs délais.\n\nCordialement'
            }
          ]
        }
      ]
    };
  }

  /**
   * Initialise le stockage avec les données par défaut si nécessaire
   */
  async initialize() {
    try {
      const data = await this.getData();
      if (!data || !data.categories || data.categories.length === 0) {
        await this.saveData(this.defaultData);
      }
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du stockage:', error);
    }
  }

  /**
   * Récupère toutes les données
   */
  async getData() {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get([this.storageKey], (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(result[this.storageKey] || this.defaultData);
        }
      });
    });
  }

  /**
   * Sauvegarde toutes les données
   */
  async saveData(data) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ [this.storageKey]: data }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Récupère toutes les catégories
   */
  async getCategories() {
    const data = await this.getData();
    return data.categories || [];
  }

  /**
   * Ajoute une nouvelle catégorie
   */
  async addCategory(name) {
    const data = await this.getData();
    const newCategory = {
      id: this.generateId(),
      name: name.trim(),
      replies: []
    };
    data.categories.push(newCategory);
    await this.saveData(data);
    return newCategory;
  }

  /**
   * Met à jour une catégorie
   */
  async updateCategory(categoryId, newName) {
    const data = await this.getData();
    const category = data.categories.find(cat => cat.id === categoryId);
    if (category) {
      category.name = newName.trim();
      await this.saveData(data);
      return category;
    }
    throw new Error('Catégorie non trouvée');
  }

  /**
   * Supprime une catégorie
   */
  async deleteCategory(categoryId) {
    const data = await this.getData();
    data.categories = data.categories.filter(cat => cat.id !== categoryId);
    await this.saveData(data);
  }

  /**
   * Récupère les réponses d'une catégorie
   */
  async getReplies(categoryId) {
    const data = await this.getData();
    const category = data.categories.find(cat => cat.id === categoryId);
    return category ? category.replies : [];
  }

  /**
   * Ajoute une nouvelle réponse à une catégorie
   */
  async addReply(categoryId, title, text) {
    const data = await this.getData();
    const category = data.categories.find(cat => cat.id === categoryId);
    if (category) {
      const newReply = {
        id: this.generateId(),
        title: title.trim(),
        text: text.trim()
      };
      category.replies.push(newReply);
      await this.saveData(data);
      return newReply;
    }
    throw new Error('Catégorie non trouvée');
  }

  /**
   * Met à jour une réponse
   */
  async updateReply(categoryId, replyId, title, text) {
    const data = await this.getData();
    const category = data.categories.find(cat => cat.id === categoryId);
    if (category) {
      const reply = category.replies.find(rep => rep.id === replyId);
      if (reply) {
        reply.title = title.trim();
        reply.text = text.trim();
        await this.saveData(data);
        return reply;
      }
    }
    throw new Error('Réponse non trouvée');
  }

  /**
   * Supprime une réponse
   */
  async deleteReply(categoryId, replyId) {
    const data = await this.getData();
    const category = data.categories.find(cat => cat.id === categoryId);
    if (category) {
      category.replies = category.replies.filter(rep => rep.id !== replyId);
      await this.saveData(data);
    }
  }

  /**
   * Recherche dans toutes les réponses
   */
  async searchReplies(query) {
    const data = await this.getData();
    const results = [];
    const searchTerm = query.toLowerCase().trim();

    data.categories.forEach(category => {
      category.replies.forEach(reply => {
        if (reply.title.toLowerCase().includes(searchTerm) || 
            reply.text.toLowerCase().includes(searchTerm)) {
          results.push({
            ...reply,
            categoryName: category.name,
            categoryId: category.id
          });
        }
      });
    });

    return results;
  }

  /**
   * Génère un ID unique
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Exporte toutes les données (pour sauvegarde)
   */
  async exportData() {
    return await this.getData();
  }

  /**
   * Importe des données (pour restauration)
   */
  async importData(data) {
    if (data && data.categories && Array.isArray(data.categories)) {
      await this.saveData(data);
      return true;
    }
    throw new Error('Format de données invalide');
  }
}

// Instance globale
const storageManager = new StorageManager();
