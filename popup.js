
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

=======
/**
 * Logique principale de l'extension Quick Reply Manager
 */

class QuickReplyApp {
    constructor() {
        this.currentCategoryId = null;
        this.currentReplyId = null;
        this.isSearchMode = false;
        this.searchResults = [];
        
        this.initializeApp();
    }

    /**
     * Initialise l'application
     */
    async initializeApp() {
        try {
            // Initialiser le stockage
            await storageManager.initialize();
            
            // Charger les données
            await this.loadCategories();
            
            // Configurer les événements
            this.setupEventListeners();
            
            // Afficher la première catégorie si disponible
            const categories = await storageManager.getCategories();
            if (categories.length > 0) {
                this.switchToCategory(categories[0].id);
            } else {
                this.showEmptyState();
            }
            
        } catch (error) {
            console.error('Erreur lors de l\'initialisation:', error);
            this.showToast('Erreur lors du chargement des données', 'error');
        }
    }

    /**
     * Configure tous les écouteurs d'événements
     */
    setupEventListeners() {
        // Recherche
        const searchInput = document.getElementById('searchInput');
        const clearSearch = document.getElementById('clearSearch');
        
        searchInput.addEventListener('input', this.handleSearch.bind(this));
        clearSearch.addEventListener('click', this.clearSearch.bind(this));
        
        // Boutons d'action
        document.getElementById('addCategoryBtn').addEventListener('click', this.showAddCategoryModal.bind(this));
        document.getElementById('addFirstReplyBtn').addEventListener('click', this.showAddReplyModal.bind(this));
        document.getElementById('settingsBtn').addEventListener('click', this.showSettingsModal.bind(this));
        
        // Modales - Catégorie
        document.getElementById('closeCategoryModal').addEventListener('click', this.hideCategoryModal.bind(this));
        document.getElementById('cancelCategoryBtn').addEventListener('click', this.hideCategoryModal.bind(this));
        document.getElementById('saveCategoryBtn').addEventListener('click', this.saveCategory.bind(this));
        
        // Modales - Réponse
        document.getElementById('closeReplyModal').addEventListener('click', this.hideReplyModal.bind(this));
        document.getElementById('cancelReplyBtn').addEventListener('click', this.hideReplyModal.bind(this));
        document.getElementById('saveReplyBtn').addEventListener('click', this.saveReply.bind(this));
        
        // Modales - Paramètres
        document.getElementById('closeSettingsModal').addEventListener('click', this.hideSettingsModal.bind(this));
        document.getElementById('exportDataBtn').addEventListener('click', this.exportData.bind(this));
        document.getElementById('importDataBtn').addEventListener('click', this.importData.bind(this));
        document.getElementById('importFileInput').addEventListener('change', this.handleImportFile.bind(this));
        document.getElementById('clearAllDataBtn').addEventListener('click', this.clearAllData.bind(this));
        
        // Actions sur les réponses
        document.getElementById('copyBtn').addEventListener('click', this.copyToClipboard.bind(this));
        document.getElementById('editReplyBtn').addEventListener('click', this.editCurrentReply.bind(this));
        document.getElementById('deleteReplyBtn').addEventListener('click', this.deleteCurrentReply.bind(this));
        
        // Fermer les modales en cliquant à l'extérieur
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.hideAllModals();
            }
        });
        
        // Raccourcis clavier
        document.addEventListener('keydown', this.handleKeyboard.bind(this));
    }

    /**
     * Charge et affiche les catégories
     */
    async loadCategories() {
        try {
            const categories = await storageManager.getCategories();
            this.renderCategories(categories);
        } catch (error) {
            console.error('Erreur lors du chargement des catégories:', error);
            this.showToast('Erreur lors du chargement des catégories', 'error');
        }
    }

    /**
     * Affiche les catégories sous forme d'onglets
     */
    renderCategories(categories) {
        const tabsContainer = document.getElementById('categoryTabs');
        tabsContainer.innerHTML = '';
        
        categories.forEach(category => {
            const tab = document.createElement('button');
            tab.className = 'tab';
            tab.textContent = category.name;
            tab.dataset.categoryId = category.id;
            
            // Actions sur l'onglet
            const actions = document.createElement('button');
            actions.className = 'tab-actions';
            actions.innerHTML = '×';
            actions.title = 'Supprimer la catégorie';
            actions.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteCategory(category.id);
            });
            
            tab.appendChild(actions);
            tab.addEventListener('click', () => this.switchToCategory(category.id));
            tabsContainer.appendChild(tab);
        });
    }

    /**
     * Bascule vers une catégorie
     */
    async switchToCategory(categoryId) {
        try {
            this.currentCategoryId = categoryId;
            this.currentReplyId = null;
            this.isSearchMode = false;
            
            // Mettre à jour l'onglet actif
            document.querySelectorAll('.tab').forEach(tab => {
                tab.classList.toggle('active', tab.dataset.categoryId === categoryId);
            });
            
            // Charger et afficher les réponses
            const replies = await storageManager.getReplies(categoryId);
            this.renderReplies(replies);
            
            // Masquer les détails et les résultats de recherche
            document.getElementById('replyDetail').style.display = 'none';
            document.getElementById('searchResults').style.display = 'none';
            document.getElementById('repliesContainer').style.display = 'block';
            
            // Afficher l'état vide si nécessaire
            if (replies.length === 0) {
                this.showEmptyState();
            } else {
                document.getElementById('emptyState').style.display = 'none';
            }
            
        } catch (error) {
            console.error('Erreur lors du changement de catégorie:', error);
            this.showToast('Erreur lors du changement de catégorie', 'error');
        }
    }

    /**
     * Affiche les réponses d'une catégorie
     */
    renderReplies(replies) {
        const repliesList = document.getElementById('repliesList');
        repliesList.innerHTML = '';
        
        if (replies.length === 0) {
            this.showEmptyState();
            return;
        }
        
        replies.forEach(reply => {
            const replyItem = document.createElement('div');
            replyItem.className = 'reply-item';
            replyItem.dataset.replyId = reply.id;
            
            replyItem.innerHTML = `
                <div class="reply-item-title">${this.escapeHtml(reply.title)}</div>
                <div class="reply-item-preview">${this.escapeHtml(reply.text.substring(0, 100))}${reply.text.length > 100 ? '...' : ''}</div>
            `;
            
            replyItem.addEventListener('click', () => this.showReplyDetail(reply));
            repliesList.appendChild(replyItem);
        });
    }

    /**
     * Affiche les détails d'une réponse
     */
    showReplyDetail(reply) {
        this.currentReplyId = reply.id;
        
        document.getElementById('detailTitle').textContent = reply.title;
        document.getElementById('detailText').textContent = reply.text;
        
        document.getElementById('repliesContainer').style.display = 'none';
        document.getElementById('replyDetail').style.display = 'block';
        document.getElementById('searchResults').style.display = 'none';
    }

    /**
     * Gère la recherche
     */
    async handleSearch(e) {
        const query = e.target.value.trim();
        
        if (query.length === 0) {
            this.clearSearch();
            return;
        }
        
        if (query.length < 2) {
            return;
        }
        
        try {
            this.searchResults = await storageManager.searchReplies(query);
            this.renderSearchResults();
            this.isSearchMode = true;
            
            // Masquer les autres vues
            document.getElementById('repliesContainer').style.display = 'none';
            document.getElementById('replyDetail').style.display = 'none';
            document.getElementById('emptyState').style.display = 'none';
            
        } catch (error) {
            console.error('Erreur lors de la recherche:', error);
            this.showToast('Erreur lors de la recherche', 'error');
        }
    }

    /**
     * Affiche les résultats de recherche
     */
    renderSearchResults() {
        const searchResults = document.getElementById('searchResults');
        const resultsList = document.getElementById('searchResultsList');
        const resultsCount = document.getElementById('resultsCount');
        
        resultsCount.textContent = `${this.searchResults.length} résultat${this.searchResults.length > 1 ? 's' : ''}`;
        resultsList.innerHTML = '';
        
        if (this.searchResults.length === 0) {
            resultsList.innerHTML = '<div class="empty-state"><p>Aucun résultat trouvé</p></div>';
        } else {
            this.searchResults.forEach(result => {
                const resultItem = document.createElement('div');
                resultItem.className = 'search-result-item';
                
                resultItem.innerHTML = `
                    <div class="search-result-category">${this.escapeHtml(result.categoryName)}</div>
                    <div class="search-result-title">${this.escapeHtml(result.title)}</div>
                    <div class="search-result-preview">${this.escapeHtml(result.text.substring(0, 100))}${result.text.length > 100 ? '...' : ''}</div>
                `;
                
                resultItem.addEventListener('click', () => {
                    this.switchToCategory(result.categoryId);
                    setTimeout(() => {
                        const replyElement = document.querySelector(`[data-reply-id="${result.id}"]`);
                        if (replyElement) {
                            replyElement.click();
                        }
                    }, 100);
                });
                
                resultsList.appendChild(resultItem);
            });
        }
        
        searchResults.style.display = 'block';
    }

    /**
     * Efface la recherche
     */
    clearSearch() {
        document.getElementById('searchInput').value = '';
        this.isSearchMode = false;
        this.searchResults = [];
        
        document.getElementById('searchResults').style.display = 'none';
        document.getElementById('repliesContainer').style.display = 'block';
        
        if (this.currentCategoryId) {
            this.switchToCategory(this.currentCategoryId);
        }
    }

    /**
     * Affiche l'état vide
     */
    showEmptyState() {
        document.getElementById('emptyState').style.display = 'flex';
        document.getElementById('repliesContainer').style.display = 'none';
        document.getElementById('replyDetail').style.display = 'none';
        document.getElementById('searchResults').style.display = 'none';
    }

    /**
     * Affiche la modale d'ajout de catégorie
     */
    showAddCategoryModal() {
        document.getElementById('categoryModalTitle').textContent = 'Nouvelle catégorie';
        document.getElementById('categoryName').value = '';
        document.getElementById('categoryModal').classList.add('show');
        document.getElementById('categoryName').focus();
    }

    /**
     * Masque la modale de catégorie
     */
    hideCategoryModal() {
        document.getElementById('categoryModal').classList.remove('show');
    }

    /**
     * Sauvegarde une catégorie
     */
    async saveCategory() {
        const name = document.getElementById('categoryName').value.trim();
        
        if (!name) {
            this.showToast('Le nom de la catégorie est requis', 'error');
            return;
        }
        
        try {
            await storageManager.addCategory(name);
            await this.loadCategories();
            this.hideCategoryModal();
            this.showToast('Catégorie créée avec succès', 'success');
        } catch (error) {
            console.error('Erreur lors de la création de la catégorie:', error);
            this.showToast('Erreur lors de la création de la catégorie', 'error');
        }
    }

    /**
     * Supprime une catégorie
     */
    async deleteCategory(categoryId) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ? Toutes les réponses qu\'elle contient seront également supprimées.')) {
            return;
        }
        
        try {
            await storageManager.deleteCategory(categoryId);
            await this.loadCategories();
            
            // Si c'était la catégorie active, basculer vers la première disponible
            if (this.currentCategoryId === categoryId) {
                const categories = await storageManager.getCategories();
                if (categories.length > 0) {
                    this.switchToCategory(categories[0].id);
                } else {
                    this.showEmptyState();
                }
            }
            
            this.showToast('Catégorie supprimée avec succès', 'success');
        } catch (error) {
            console.error('Erreur lors de la suppression de la catégorie:', error);
            this.showToast('Erreur lors de la suppression de la catégorie', 'error');
        }
    }

    /**
     * Affiche la modale d'ajout de réponse
     */
    showAddReplyModal() {
        if (!this.currentCategoryId) {
            this.showToast('Veuillez d\'abord sélectionner une catégorie', 'error');
            return;
        }
        
        document.getElementById('replyModalTitle').textContent = 'Nouvelle réponse';
        document.getElementById('replyTitle').value = '';
        document.getElementById('replyText').value = '';
        document.getElementById('replyModal').classList.add('show');
        document.getElementById('replyTitle').focus();
    }

    /**
     * Masque la modale de réponse
     */
    hideReplyModal() {
        document.getElementById('replyModal').classList.remove('show');
    }

    /**
     * Sauvegarde une réponse
     */
    async saveReply() {
        const title = document.getElementById('replyTitle').value.trim();
        const text = document.getElementById('replyText').value.trim();
        
        if (!title || !text) {
            this.showToast('Le titre et le texte sont requis', 'error');
            return;
        }
        
        try {
            await storageManager.addReply(this.currentCategoryId, title, text);
            await this.switchToCategory(this.currentCategoryId);
            this.hideReplyModal();
            this.showToast('Réponse créée avec succès', 'success');
        } catch (error) {
            console.error('Erreur lors de la création de la réponse:', error);
            this.showToast('Erreur lors de la création de la réponse', 'error');
        }
    }

    /**
     * Modifie la réponse actuelle
     */
    editCurrentReply() {
        if (!this.currentReplyId) return;
        
        // Récupérer les données actuelles
        const title = document.getElementById('detailTitle').textContent;
        const text = document.getElementById('detailText').textContent;
        
        document.getElementById('replyModalTitle').textContent = 'Modifier la réponse';
        document.getElementById('replyTitle').value = title;
        document.getElementById('replyText').value = text;
        document.getElementById('replyModal').classList.add('show');
        document.getElementById('replyTitle').focus();
    }

    /**
     * Supprime la réponse actuelle
     */
    async deleteCurrentReply() {
        if (!this.currentReplyId || !this.currentCategoryId) return;
        
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette réponse ?')) {
            return;
        }
        
        try {
            await storageManager.deleteReply(this.currentCategoryId, this.currentReplyId);
            await this.switchToCategory(this.currentCategoryId);
            this.showToast('Réponse supprimée avec succès', 'success');
        } catch (error) {
            console.error('Erreur lors de la suppression de la réponse:', error);
            this.showToast('Erreur lors de la suppression de la réponse', 'error');
        }
    }

    /**
     * Copie le texte dans le presse-papier
     */
    async copyToClipboard() {
        const text = document.getElementById('detailText').textContent;
        
        try {
            await navigator.clipboard.writeText(text);
            this.showToast('Texte copié dans le presse-papier', 'success');
        } catch (error) {
            // Fallback pour les navigateurs plus anciens
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showToast('Texte copié dans le presse-papier', 'success');
        }
    }

    /**
     * Affiche la modale des paramètres
     */
    showSettingsModal() {
        document.getElementById('settingsModal').classList.add('show');
    }

    /**
     * Masque la modale des paramètres
     */
    hideSettingsModal() {
        document.getElementById('settingsModal').classList.remove('show');
    }

    /**
     * Exporte les données
     */
    async exportData() {
        try {
            const data = await storageManager.exportData();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `quick-reply-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showToast('Données exportées avec succès', 'success');
        } catch (error) {
            console.error('Erreur lors de l\'export:', error);
            this.showToast('Erreur lors de l\'export des données', 'error');
        }
    }

    /**
     * Importe les données
     */
    importData() {
        document.getElementById('importFileInput').click();
    }

    /**
     * Gère l'import de fichier
     */
    async handleImportFile(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            await storageManager.importData(data);
            await this.loadCategories();
            
            // Basculer vers la première catégorie
            const categories = await storageManager.getCategories();
            if (categories.length > 0) {
                this.switchToCategory(categories[0].id);
            }
            
            this.showToast('Données importées avec succès', 'success');
        } catch (error) {
            console.error('Erreur lors de l\'import:', error);
            this.showToast('Erreur lors de l\'import des données', 'error');
        }
        
        // Réinitialiser l'input
        e.target.value = '';
    }

    /**
     * Efface toutes les données
     */
    async clearAllData() {
        if (!confirm('Êtes-vous sûr de vouloir effacer toutes les données ? Cette action est irréversible.')) {
            return;
        }
        
        try {
            await storageManager.saveData({ categories: [] });
            await this.loadCategories();
            this.showEmptyState();
            this.showToast('Toutes les données ont été effacées', 'success');
        } catch (error) {
            console.error('Erreur lors de l\'effacement:', error);
            this.showToast('Erreur lors de l\'effacement des données', 'error');
        }
    }

    /**
     * Masque toutes les modales
     */
    hideAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('show');
        });
    }

    /**
     * Gère les raccourcis clavier
     */
    handleKeyboard(e) {
        // Échap pour fermer les modales
        if (e.key === 'Escape') {
            this.hideAllModals();
        }
        
        // Ctrl/Cmd + K pour la recherche
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            document.getElementById('searchInput').focus();
        }
        
        // Ctrl/Cmd + N pour nouvelle réponse
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            this.showAddReplyModal();
        }
    }

    /**
     * Affiche une notification toast
     */
    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');
        
        toastMessage.textContent = message;
        toast.className = `toast show ${type}`;
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    /**
     * Échappe le HTML pour éviter les injections
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialiser l'application quand le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
    new QuickReplyApp();
});
