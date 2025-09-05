import { QRMStorage } from "./storage.js";

const categorySelect = document.getElementById("categorySelect");
const addCategoryBtn = document.getElementById("addCategoryBtn");
const editCategoryBtn = document.getElementById("editCategoryBtn");
const deleteCategoryBtn = document.getElementById("deleteCategoryBtn");
const addTemplateBtn = document.getElementById("addTemplateBtn");
const searchInput = document.getElementById("searchInput");
const searchResults = document.getElementById("searchResults");

const templatesList = document.getElementById("templatesList");
const viewer = document.getElementById("templateViewer");
const viewerTitle = document.getElementById("viewerTitle");
const viewerText = document.getElementById("viewerText");
const viewerCopyBtn = document.getElementById("copyBtn");
const editTemplateBtn = document.getElementById("editTemplateBtn");
const deleteTemplateBtn = document.getElementById("deleteTemplateBtn");

const categoryDialog = document.getElementById("categoryDialog");
const categoryForm = document.getElementById("categoryForm");
const categoryDialogTitle = document.getElementById("categoryDialogTitle");
const categoryNameInput = document.getElementById("categoryNameInput");

const templateDialog = document.getElementById("templateDialog");
const templateForm = document.getElementById("templateForm");
const templateDialogTitle = document.getElementById("templateDialogTitle");
const templateTitleInput = document.getElementById("templateTitleInput");
const templateTextInput = document.getElementById("templateTextInput");

let categories = [];
let selectedCategoryId = null;
let selectedTemplateId = null;

async function init() {
  categories = await QRMStorage.getCategories();
  if (categories.length > 0) {
    selectedCategoryId = categories[0].id;
  }
  renderCategories();
  renderTemplates();
  wireEvents();
}

function wireEvents() {
  searchInput.addEventListener("input", handleSearchInput);

  categorySelect.addEventListener("change", () => {
    selectedCategoryId = categorySelect.value;
    selectedTemplateId = null;
    renderTemplates();
    renderViewer(null);
  });

  addCategoryBtn.addEventListener("click", () => openCategoryDialog());
  editCategoryBtn.addEventListener("click", () => openCategoryDialog(selectedCategoryId));
  deleteCategoryBtn.addEventListener("click", async () => {
    if (!selectedCategoryId) return;
    if (!confirm("Supprimer cette catégorie ?")) return;
    await QRMStorage.removeCategory(selectedCategoryId);
    categories = await QRMStorage.getCategories();
    selectedCategoryId = categories[0]?.id || null;
    renderCategories();
    renderTemplates();
    renderViewer(null);
  });

  addTemplateBtn.addEventListener("click", () => openTemplateDialog());
  viewerCopyBtn.addEventListener("click", copyCurrentTemplate);
  editTemplateBtn.addEventListener("click", () => {
    if (!selectedTemplateId) return;
    openTemplateDialog(selectedTemplateId);
  });
  deleteTemplateBtn.addEventListener("click", async () => {
    if (!selectedTemplateId) return;
    if (!confirm("Supprimer ce modèle ?")) return;
    await QRMStorage.removeTemplate(selectedCategoryId, selectedTemplateId);
    categories = await QRMStorage.getCategories();
    selectedTemplateId = null;
    renderTemplates();
    renderViewer(null);
  });

  // Synchroniser quand le stockage change
  QRMStorage.onChanged(async () => {
    categories = await QRMStorage.getCategories();
    if (!categories.find((c) => c.id === selectedCategoryId)) {
      selectedCategoryId = categories[0]?.id || null;
      selectedTemplateId = null;
    }
    renderCategories();
    renderTemplates();
    const tpl = getCurrentTemplate();
    renderViewer(tpl || null);
  });
}

function getCurrentCategory() {
  return categories.find((c) => c.id === selectedCategoryId) || null;
}

function getCurrentTemplate() {
  const cat = getCurrentCategory();
  if (!cat) return null;
  return cat.templates.find((t) => t.id === selectedTemplateId) || null;
}

function renderCategories() {
  categorySelect.innerHTML = "";
  for (const cat of categories) {
    const opt = document.createElement("option");
    opt.value = cat.id;
    opt.textContent = cat.name;
    if (cat.id === selectedCategoryId) opt.selected = true;
    categorySelect.appendChild(opt);
  }
  const disable = categories.length === 0;
  editCategoryBtn.disabled = disable || !selectedCategoryId;
  deleteCategoryBtn.disabled = disable || !selectedCategoryId;
  addTemplateBtn.disabled = disable || !selectedCategoryId;
}

function renderTemplates() {
  templatesList.innerHTML = "";
  const cat = getCurrentCategory();
  if (!cat) return;
  for (const tpl of cat.templates) {
    const item = document.createElement("div");
    item.className = "template-item";
    item.addEventListener("click", (e) => {
      if (e.shiftKey) {
        // Shift+Click = Copier direct
        copyText(tpl.text);
        return;
      }
      selectedTemplateId = tpl.id;
      renderViewer(tpl);
    });

    const title = document.createElement("p");
    title.className = "template-item-title";
    title.textContent = tpl.title;
    item.appendChild(title);

    const actions = document.createElement("div");
    actions.className = "template-item-actions";

    const btnOpen = document.createElement("button");
    btnOpen.className = "btn";
    btnOpen.textContent = "Ouvrir";
    btnOpen.addEventListener("click", (e) => {
      e.stopPropagation();
      selectedTemplateId = tpl.id;
      renderViewer(tpl);
    });

    const btnCopy = document.createElement("button");
    btnCopy.className = "btn primary";
    btnCopy.textContent = "Copier";
    btnCopy.addEventListener("click", (e) => {
      e.stopPropagation();
      copyText(tpl.text);
    });

    const btnEdit = document.createElement("button");
    btnEdit.className = "btn";
    btnEdit.textContent = "Modifier";
    btnEdit.addEventListener("click", (e) => {
      e.stopPropagation();
      selectedTemplateId = tpl.id;
      openTemplateDialog(tpl.id);
    });

    const btnDelete = document.createElement("button");
    btnDelete.className = "btn btn-danger";
    btnDelete.textContent = "Supprimer";
    btnDelete.addEventListener("click", async (e) => {
      e.stopPropagation();
      if (!confirm("Supprimer ce modèle ?")) return;
      await QRMStorage.removeTemplate(selectedCategoryId, tpl.id);
      categories = await QRMStorage.getCategories();
      if (tpl.id === selectedTemplateId) selectedTemplateId = null;
      renderTemplates();
      renderViewer(null);
    });

    actions.appendChild(btnOpen);
    actions.appendChild(btnCopy);
    actions.appendChild(btnEdit);
    actions.appendChild(btnDelete);
    item.appendChild(actions);

    templatesList.appendChild(item);
  }
}

function renderViewer(tpl) {
  const placeholder = viewer.querySelector(".placeholder");
  const content = viewer.querySelector(".viewer-content");
  if (!tpl) {
    placeholder.classList.remove("hidden");
    content.classList.add("hidden");
    return;
  }
  placeholder.classList.add("hidden");
  content.classList.remove("hidden");
  viewerTitle.textContent = tpl.title;
  viewerText.value = tpl.text;
}

async function copyCurrentTemplate() {
  const tpl = getCurrentTemplate();
  if (!tpl) return;
  await copyText(tpl.text);
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast("Copié dans le presse-papier");
  } catch (_) {
    // Fallback
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    toast("Copié dans le presse-papier");
  }
}

function toast(message) {
  // simple ephemeral banner
  const el = document.createElement("div");
  el.textContent = message;
  el.style.position = "fixed";
  el.style.bottom = "10px";
  el.style.left = "50%";
  el.style.transform = "translateX(-50%)";
  el.style.background = "#10b981";
  el.style.color = "white";
  el.style.padding = "6px 10px";
  el.style.borderRadius = "6px";
  el.style.fontSize = "12px";
  el.style.zIndex = "9999";
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1200);
}

async function handleSearchInput() {
  const q = searchInput.value.trim();
  if (!q) {
    searchResults.classList.add("hidden");
    searchResults.innerHTML = "";
    return;
  }
  const results = await QRMStorage.searchTemplates(q);
  searchResults.innerHTML = "";
  searchResults.classList.remove("hidden");
  for (const r of results) {
    const row = document.createElement("div");
    row.className = "search-result";
    row.innerHTML = `<strong>${escapeHtml(r.title)}</strong><br><small>${escapeHtml(r.categoryName)}</small>`;
    row.addEventListener("click", () => {
      selectedCategoryId = r.categoryId;
      selectedTemplateId = r.templateId;
      renderCategories();
      renderTemplates();
      renderViewer({ title: r.title, text: r.text });
    });
    searchResults.appendChild(row);
  }
}

function escapeHtml(str) {
  return (str || "").replace(/[&<>"]|'/g, (c) => {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c];
  });
}

function openCategoryDialog(categoryId) {
  const editing = Boolean(categoryId);
  categoryDialogTitle.textContent = editing
    ? "Modifier la catégorie"
    : "Nouvelle catégorie";
  categoryNameInput.value = editing
    ? (categories.find((c) => c.id === categoryId)?.name || "")
    : "";
  categoryDialog.showModal();

  categoryForm.onsubmit = async (e) => {
    e.preventDefault();
    const name = categoryNameInput.value.trim();
    if (!name) return;
    if (editing) {
      await QRMStorage.updateCategory(categoryId, name);
    } else {
      const cat = await QRMStorage.addCategory(name);
      selectedCategoryId = cat.id;
    }
    categories = await QRMStorage.getCategories();
    renderCategories();
    renderTemplates();
    categoryDialog.close();
  };
}

function openTemplateDialog(templateId) {
  const editing = Boolean(templateId);
  templateDialogTitle.textContent = editing ? "Modifier le modèle" : "Nouveau modèle";
  if (editing) {
    const tpl = getCurrentCategory()?.templates.find((t) => t.id === templateId);
    templateTitleInput.value = tpl?.title || "";
    templateTextInput.value = tpl?.text || "";
  } else {
    templateTitleInput.value = "";
    templateTextInput.value = "";
  }
  templateDialog.showModal();

  templateForm.onsubmit = async (e) => {
    e.preventDefault();
    const title = templateTitleInput.value.trim();
    const text = templateTextInput.value;
    if (!title || !text) return;
    if (editing) {
      await QRMStorage.updateTemplate(selectedCategoryId, templateId, { title, text });
    } else {
      const tpl = await QRMStorage.addTemplate(selectedCategoryId, { title, text });
      selectedTemplateId = tpl.id;
    }
    categories = await QRMStorage.getCategories();
    renderTemplates();
    renderViewer(getCurrentTemplate());
    templateDialog.close();
  };
}

// Init
init();

