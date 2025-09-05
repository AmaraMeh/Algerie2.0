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

