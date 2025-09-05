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

  let state = { categories: [], currentCategoryId: null, query: '' };

  function setState(partial) {
    state = { ...state, ...partial };
    render();
  }

  async function load() {
    const data = await window.QRMStorage.getData();
    const categories = data.categories || [];
    const currentCategoryId = categories[0]?.id ?? null;
    setState({ categories, currentCategoryId });
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
        setTimeout(() => (copyBtn.textContent = 'Copier'), 1200);
      } catch (e) {}
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

    actions.append(copyBtn, editBtn, delBtn);
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

  // Initialize
  load();
})();

