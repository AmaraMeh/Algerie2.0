// Storage helpers for Quick Reply Manager (chrome.storage.local)

const QRM_KEY = "qrmData";

function withDefaults(data) {
  if (!data || typeof data !== "object") data = {};
  if (!Array.isArray(data.categories)) {
    data.categories = [
      {
        id: crypto.randomUUID(),
        name: "Exemples",
        templates: [
          { id: crypto.randomUUID(), title: "Bienvenue", text: "Bonjour, comment puis-je vous aider ?" },
          { id: crypto.randomUUID(), title: "Infos Carte Étudiant", text: "Merci de fournir votre numéro d'étudiant et une pièce d'identité." }
        ]
      }
    ];
  }
  return data;
}

function getData() {
  return new Promise((resolve) => {
    chrome.storage.local.get([QRM_KEY], (res) => {
      resolve(withDefaults(res[QRM_KEY] || {}));
    });
  });
}

function setData(data) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [QRM_KEY]: data }, () => resolve());
  });
}

async function upsertCategory(category) {
  const data = await getData();
  const index = data.categories.findIndex((c) => c.id === category.id);
  if (index >= 0) data.categories[index] = category; else data.categories.push(category);
  await setData(data);
  return category;
}

async function deleteCategory(categoryId) {
  const data = await getData();
  data.categories = data.categories.filter((c) => c.id !== categoryId);
  await setData(data);
}

async function upsertTemplate(categoryId, template) {
  const data = await getData();
  const category = data.categories.find((c) => c.id === categoryId);
  if (!category) throw new Error("Catégorie introuvable");
  const index = category.templates.findIndex((t) => t.id === template.id);
  if (index >= 0) category.templates[index] = template; else category.templates.push(template);
  await setData(data);
  return template;
}

async function deleteTemplate(categoryId, templateId) {
  const data = await getData();
  const category = data.categories.find((c) => c.id === categoryId);
  if (!category) return;
  category.templates = category.templates.filter((t) => t.id !== templateId);
  await setData(data);
}

window.QRMStorage = {
  getData,
  setData,
  upsertCategory,
  deleteCategory,
  upsertTemplate,
  deleteTemplate
};

