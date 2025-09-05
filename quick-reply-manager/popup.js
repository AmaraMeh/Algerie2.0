// UI logic for Quick Reply Manager popup

(function () {
  const categorySelect = document.getElementById('categorySelect');
  const searchInput = document.getElementById('searchInput');
  const templateList = document.getElementById('templateList');
  const detail = document.getElementById('detail');
  const addCategoryBtn = document.getElementById('addCategoryBtn');
  const renameCategoryBtn = document.getElementById('renameCategoryBtn');
  const deleteCategoryBtn = document.getElementById('deleteCategoryBtn');
  const addTemplateBtn = document.getElementById('addTemplateBtn');
  const authBtn = document.getElementById('authBtn');
  const userInfo = document.getElementById('userInfo');
  const sharedTemplatesBtn = document.getElementById('sharedTemplatesBtn');
  const shareTemplateBtn = document.getElementById('shareTemplateBtn');

  let state = { 
    categories: [], 
    currentCategoryId: null, 
    query: '', 
    isAuthenticated: false,
    currentUser: null,
    sharedTemplates: [],
    currentTemplate: null
  };

  function setState(partial) {
    state = { ...state, ...partial };
    render();
  }

  async function load() {
    try {
      // Wait for Firebase to initialize
      if (window.FirebaseService) {
        await window.FirebaseService.init();
        const user = window.FirebaseService.getCurrentUser();
        setState({ 
          isAuthenticated: !!user, 
          currentUser: user 
        });
        updateAuthUI();
      }
      
      const data = await window.QRMStorage.getData();
      const categories = data.categories || [];
      const currentCategoryId = categories[0]?.id ?? null;
      setState({ categories, currentCategoryId });
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  function updateAuthUI() {
    if (state.isAuthenticated && state.currentUser) {
      userInfo.textContent = state.currentUser.email;
      authBtn.textContent = 'Se déconnecter';
      authBtn.onclick = handleSignOut;
    } else {
      userInfo.textContent = '';
      authBtn.textContent = 'Se connecter';
      authBtn.onclick = handleSignIn;
    }
  }

  async function handleSignIn() {
    try {
      authBtn.textContent = 'Connexion...';
      authBtn.disabled = true;
      
      const user = await window.FirebaseService.signInWithGoogle();
      setState({ 
        isAuthenticated: true, 
        currentUser: user 
      });
      updateAuthUI();
      
      // Reload data after authentication
      await load();
    } catch (error) {
      console.error('Sign in error:', error);
      alert('Erreur de connexion: ' + error.message);
    } finally {
      authBtn.disabled = false;
    }
  }

  async function handleSignOut() {
    try {
      await window.FirebaseService.signOut();
      setState({ 
        isAuthenticated: false, 
        currentUser: null 
      });
      updateAuthUI();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }

  function saveCategories(categories) {
    return window.QRMStorage.setData({ categories });
  }

  function currentCategory() {
    return state.categories.find(c => c.id === state.currentCategoryId) || null;
  }

  function renderCategories() {
    categorySelect.innerHTML = '';
    for (const cat of state.categories) {
      const opt = document.createElement('option');
      opt.value = cat.id;
      opt.textContent = cat.name;
      if (cat.id === state.currentCategoryId) opt.selected = true;
      categorySelect.appendChild(opt);
    }
  }

  function renderList() {
    const cat = currentCategory();
    templateList.innerHTML = '';
    if (!cat) return;
    const query = state.query.trim().toLowerCase();
    const matches = (t) => {
      if (!query) return true;
      return t.title.toLowerCase().includes(query) || t.text.toLowerCase().includes(query);
    };
    for (const tmpl of cat.templates.filter(matches)) {
      const item = document.createElement('button');
      item.className = 'list-item';
      item.textContent = tmpl.title;
      item.addEventListener('click', () => showTemplate(tmpl));
      templateList.appendChild(item);
    }
  }

  function showTemplate(tmpl) {
    setState({ currentTemplate: tmpl });
    detail.innerHTML = '';
    const header = document.createElement('div');
    header.className = 'detail-header';
    const h3 = document.createElement('h3');
    h3.textContent = tmpl.title;
    const actions = document.createElement('div');
    actions.className = 'detail-actions';

    const copyBtn = document.createElement('button');
    copyBtn.className = 'btn primary';
    copyBtn.textContent = 'Copier';
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(tmpl.text);
        copyBtn.textContent = 'Copié!';
        copyBtn.style.background = '#10b981';
        setTimeout(() => {
          copyBtn.textContent = 'Copier';
          copyBtn.style.background = '';
        }, 1200);
      } catch (e) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = tmpl.text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        copyBtn.textContent = 'Copié!';
        copyBtn.style.background = '#10b981';
        setTimeout(() => {
          copyBtn.textContent = 'Copier';
          copyBtn.style.background = '';
        }, 1200);
      }
    });

    const pasteBtn = document.createElement('button');
    pasteBtn.className = 'btn secondary';
    pasteBtn.textContent = 'Coller dans la conversation';
    pasteBtn.addEventListener('click', async () => {
      try {
        // Send message to content script to paste the text
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.id) {
          await chrome.tabs.sendMessage(tab.id, { 
            type: "PASTE_TEXT", 
            text: tmpl.text 
          });
          pasteBtn.textContent = 'Collé!';
          pasteBtn.style.background = '#10b981';
          setTimeout(() => {
            pasteBtn.textContent = 'Coller dans la conversation';
            pasteBtn.style.background = '';
          }, 1200);
        }
      } catch (e) {
        console.error('Error pasting text:', e);
        pasteBtn.textContent = 'Erreur';
        pasteBtn.style.background = '#ef4444';
        setTimeout(() => {
          pasteBtn.textContent = 'Coller dans la conversation';
          pasteBtn.style.background = '';
        }, 1200);
      }
    });

    const editBtn = document.createElement('button');
    editBtn.className = 'btn';
    editBtn.textContent = 'Éditer';
    editBtn.addEventListener('click', () => openTemplateEditor(tmpl));

    const delBtn = document.createElement('button');
    delBtn.className = 'btn btn-ghost';
    delBtn.textContent = 'Supprimer';
    delBtn.addEventListener('click', async () => {
      if (!confirm('Supprimer ce modèle ?')) return;
      await window.QRMStorage.deleteTemplate(state.currentCategoryId, tmpl.id);
      const data = await window.QRMStorage.getData();
      setState({ categories: data.categories });
      detail.innerHTML = '';
    });

    const shareBtn = document.createElement('button');
    shareBtn.className = 'btn secondary';
    shareBtn.textContent = 'Partager';
    shareBtn.style.display = state.isAuthenticated ? 'inline-block' : 'none';
    shareBtn.addEventListener('click', async () => {
      try {
        const category = currentCategory();
        if (!category) return;
        
        shareBtn.textContent = 'Partage...';
        shareBtn.disabled = true;
        
        await window.QRMStorage.shareTemplate(tmpl, category.name);
        
        shareBtn.textContent = 'Partagé!';
        shareBtn.style.background = '#10b981';
        setTimeout(() => {
          shareBtn.textContent = 'Partager';
          shareBtn.style.background = '';
          shareBtn.disabled = false;
        }, 2000);
      } catch (error) {
        console.error('Error sharing template:', error);
        shareBtn.textContent = 'Erreur';
        shareBtn.style.background = '#ef4444';
        setTimeout(() => {
          shareBtn.textContent = 'Partager';
          shareBtn.style.background = '';
          shareBtn.disabled = false;
        }, 2000);
      }
    });

    actions.append(copyBtn, pasteBtn, shareBtn, editBtn, delBtn);
    header.append(h3, actions);

    const pre = document.createElement('textarea');
    pre.className = 'detail-text';
    pre.value = tmpl.text;
    pre.readOnly = true;

    detail.append(header, pre);
  }

  function openTemplateEditor(tmpl) {
    const isNew = !tmpl;
    tmpl = tmpl || { id: crypto.randomUUID(), title: '', text: '' };
    detail.innerHTML = '';

    const form = document.createElement('form');
    form.className = 'form';

    const titleLabel = document.createElement('label');
    titleLabel.textContent = 'Titre du message';
    const titleInput = document.createElement('input');
    titleInput.className = 'input';
    titleInput.required = true;
    titleInput.value = tmpl.title;

    const textLabel = document.createElement('label');
    textLabel.textContent = 'Texte de réponse';
    const textArea = document.createElement('textarea');
    textArea.className = 'textarea';
    textArea.required = true;
    textArea.value = tmpl.text;

    const buttons = document.createElement('div');
    buttons.className = 'form-actions';
    const cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.className = 'btn btn-ghost';
    cancel.textContent = 'Annuler';
    cancel.addEventListener('click', () => { detail.innerHTML = ''; });
    const save = document.createElement('button');
    save.type = 'submit';
    save.className = 'btn primary';
    save.textContent = 'Enregistrer';

    buttons.append(cancel, save);
    form.append(titleLabel, titleInput, textLabel, textArea, buttons);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const updated = { ...tmpl, title: titleInput.value.trim(), text: textArea.value };
      await window.QRMStorage.upsertTemplate(state.currentCategoryId, updated);
      const data = await window.QRMStorage.getData();
      setState({ categories: data.categories });
      showTemplate(updated);
    });

    detail.append(form);
  }

  async function onAddCategory() {
    const name = prompt('Nom de la nouvelle catégorie :');
    if (!name) return;
    const newCat = { id: crypto.randomUUID(), name, templates: [] };
    const categories = [...state.categories, newCat];
    await saveCategories(categories);
    setState({ categories, currentCategoryId: newCat.id });
  }

  async function onRenameCategory() {
    const cat = currentCategory();
    if (!cat) return;
    const name = prompt('Nouveau nom de la catégorie :', cat.name);
    if (!name) return;
    const categories = state.categories.map(c => c.id === cat.id ? { ...c, name } : c);
    await saveCategories(categories);
    setState({ categories });
  }

  async function onDeleteCategory() {
    const cat = currentCategory();
    if (!cat) return;
    if (!confirm('Supprimer cette catégorie et tous ses modèles ?')) return;
    await window.QRMStorage.deleteCategory(cat.id);
    const data = await window.QRMStorage.getData();
    const nextId = data.categories[0]?.id ?? null;
    setState({ categories: data.categories, currentCategoryId: nextId });
    detail.innerHTML = '';
  }

  function renderDetailEmpty() {
    if (detail.innerHTML.trim()) return;
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.textContent = 'Sélectionnez un modèle à droite ou créez-en un nouveau.';
    detail.append(empty);
  }

  async function loadSharedTemplates() {
    try {
      // Show loading state
      detail.innerHTML = '';
      const loading = document.createElement('div');
      loading.className = 'loading';
      loading.textContent = 'Chargement des modèles partagés...';
      detail.append(loading);
      
      const sharedTemplates = await window.QRMStorage.getSharedTemplates();
      setState({ sharedTemplates });
      showSharedTemplates();
    } catch (error) {
      console.error('Error loading shared templates:', error);
      detail.innerHTML = '';
      const error = document.createElement('div');
      error.className = 'empty';
      error.textContent = 'Erreur lors du chargement des modèles partagés.';
      detail.append(error);
    }
  }

  function showSharedTemplates() {
    detail.innerHTML = '';
    const header = document.createElement('div');
    header.className = 'detail-header';
    const h3 = document.createElement('h3');
    h3.textContent = 'Modèles partagés';
    const backBtn = document.createElement('button');
    backBtn.className = 'btn btn-ghost';
    backBtn.textContent = '← Retour';
    backBtn.addEventListener('click', () => {
      detail.innerHTML = '';
      renderDetailEmpty();
    });
    header.append(h3, backBtn);

    const list = document.createElement('div');
    list.className = 'shared-templates-list';
    
    if (state.sharedTemplates.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty';
      empty.textContent = 'Aucun modèle partagé disponible.';
      list.append(empty);
    } else {
      for (const template of state.sharedTemplates) {
        const item = document.createElement('div');
        item.className = 'shared-template-item';
        
        const title = document.createElement('div');
        title.className = 'shared-template-title';
        title.textContent = template.title;
        
        const meta = document.createElement('div');
        meta.className = 'shared-template-meta';
        meta.textContent = `${template.categoryName} • Par ${template.sharedByEmail}`;
        
        const actions = document.createElement('div');
        actions.className = 'shared-template-actions';
        
        const importBtn = document.createElement('button');
        importBtn.className = 'btn primary';
        importBtn.textContent = 'Importer';
        importBtn.addEventListener('click', async () => {
          try {
            const category = currentCategory();
            if (!category) {
              alert('Veuillez sélectionner une catégorie d\'abord.');
              return;
            }
            
            const newTemplate = {
              id: crypto.randomUUID(),
              title: template.title,
              text: template.text
            };
            
            await window.QRMStorage.upsertTemplate(category.id, newTemplate);
            const data = await window.QRMStorage.getData();
            setState({ categories: data.categories });
            showTemplate(newTemplate);
          } catch (error) {
            console.error('Error importing template:', error);
            alert('Erreur lors de l\'importation du modèle.');
          }
        });
        
        actions.append(importBtn);
        item.append(title, meta, actions);
        list.append(item);
      }
    }
    
    detail.append(header, list);
  }

  function render() {
    renderCategories();
    renderList();
    renderDetailEmpty();
  }

  // Event bindings
  categorySelect.addEventListener('change', () => setState({ currentCategoryId: categorySelect.value }));
  searchInput.addEventListener('input', () => setState({ query: searchInput.value }));
  addCategoryBtn.addEventListener('click', onAddCategory);
  renameCategoryBtn.addEventListener('click', onRenameCategory);
  deleteCategoryBtn.addEventListener('click', onDeleteCategory);
  addTemplateBtn.addEventListener('click', () => openTemplateEditor());
  sharedTemplatesBtn.addEventListener('click', loadSharedTemplates);

  // Initialize
  load();
})();

