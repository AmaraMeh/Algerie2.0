/* global api */
(function () {
  const state = {
    settings: { theme: 'dark', accentColor: '#7c3aed', autoPaste: false, alwaysOnTop: true },
    categories: [],
    replies: [],
    links: [],
    notes: ''
  };

  // Elements
  const rootEl = document.documentElement;
  const tabs = Array.from(document.querySelectorAll('.tab'));
  const tabPanels = {
    replies: document.getElementById('tab-replies'),
    links: document.getElementById('tab-links'),
    notes: document.getElementById('tab-notes'),
    settings: document.getElementById('tab-settings')
  };

  // Quick Replies elements
  const categoryFilter = document.getElementById('categoryFilter');
  const replyText = document.getElementById('replyText');
  const replyCategory = document.getElementById('replyCategory');
  const addReplyBtn = document.getElementById('addReplyBtn');
  const repliesList = document.getElementById('repliesList');

  // Links elements
  const linkLabel = document.getElementById('linkLabel');
  const linkUrl = document.getElementById('linkUrl');
  const addLinkBtn = document.getElementById('addLinkBtn');
  const linksList = document.getElementById('linksList');

  // Notes elements
  const notesText = document.getElementById('notesText');

  // Settings elements
  const themeSelect = document.getElementById('themeSelect');
  const accentColor = document.getElementById('accentColor');
  const alwaysOnTopToggle = document.getElementById('alwaysOnTopToggle');
  const autoPasteToggle = document.getElementById('autoPasteToggle');
  const categoriesList = document.getElementById('categoriesList');
  const newCategoryName = document.getElementById('newCategoryName');
  const addCategoryBtn = document.getElementById('addCategoryBtn');

  // Tabs behavior
  tabs.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      tabs.forEach((b) => b.classList.toggle('active', b === btn));
      Object.entries(tabPanels).forEach(([key, panel]) => panel.classList.toggle('active', key === tab));
    });
  });

  function applyTheme() {
    const theme = state.settings.theme;
    const accent = state.settings.accentColor;
    if (theme === 'light') {
      rootEl.setAttribute('data-theme', 'light');
    } else {
      rootEl.removeAttribute('data-theme');
    }
    rootEl.style.setProperty('--accent', accent);
  }

  // Renderers
  function renderCategoriesOptions() {
    const all = ['All', ...state.categories];
    categoryFilter.innerHTML = all.map((c) => `<option>${c}</option>`).join('');
    replyCategory.innerHTML = state.categories.map((c) => `<option>${c}</option>`).join('');
  }

  function renderReplies() {
    const selected = categoryFilter.value || 'All';
    const list = state.replies.filter((r) => selected === 'All' || r.category === selected);
    repliesList.innerHTML = '';
    list.forEach((reply, idx) => {
      const li = document.createElement('li');
      const left = document.createElement('div');
      left.style.display = 'flex';
      left.style.flexDirection = 'column';
      left.style.gap = '6px';
      const topRow = document.createElement('div');
      topRow.className = 'row';
      const chip = document.createElement('span');
      chip.className = 'chip';
      chip.textContent = reply.category;
      const hint = document.createElement('span');
      hint.className = 'muted';
      if (idx < 9) hint.textContent = `Ctrl+${idx + 1}`;
      topRow.appendChild(chip);
      topRow.appendChild(hint);
      const text = document.createElement('div');
      text.className = 'reply-text';
      text.textContent = reply.text;
      left.appendChild(topRow);
      left.appendChild(text);

      const actions = document.createElement('div');
      actions.className = 'actions';
      const copyBtn = document.createElement('button');
      copyBtn.className = 'primary';
      copyBtn.textContent = 'Copy';
      copyBtn.addEventListener('click', () => api.copyReply(reply.text));

      const editBtn = document.createElement('button');
      editBtn.textContent = 'Edit';
      editBtn.addEventListener('click', async () => {
        const next = prompt('Edit reply text:', reply.text);
        if (next != null) {
          await api.updateReply({ id: reply.id, text: next });
        }
      });

      const moveBtn = document.createElement('button');
      moveBtn.textContent = 'Move';
      moveBtn.addEventListener('click', async () => {
        const nextCat = prompt('Move to category:', reply.category);
        if (nextCat && state.categories.includes(nextCat)) {
          await api.updateReply({ id: reply.id, category: nextCat });
        }
      });

      const delBtn = document.createElement('button');
      delBtn.textContent = 'Delete';
      delBtn.addEventListener('click', async () => {
        if (confirm('Delete this reply?')) await api.deleteReply(reply.id);
      });

      actions.appendChild(copyBtn);
      actions.appendChild(editBtn);
      actions.appendChild(moveBtn);
      actions.appendChild(delBtn);

      li.appendChild(left);
      li.appendChild(actions);
      repliesList.appendChild(li);
    });
  }

  function renderLinks() {
    linksList.innerHTML = '';
    state.links.forEach((l) => {
      const li = document.createElement('li');
      const left = document.createElement('div');
      left.textContent = `${l.label} — ${l.url}`;
      const actions = document.createElement('div');
      actions.className = 'actions';
      const open = document.createElement('button');
      open.className = 'primary';
      open.textContent = 'Open';
      open.addEventListener('click', () => api.openLink(l.url));
      const del = document.createElement('button');
      del.textContent = 'Delete';
      del.addEventListener('click', () => api.deleteLink(l.id));
      actions.appendChild(open);
      actions.appendChild(del);
      li.appendChild(left);
      li.appendChild(actions);
      linksList.appendChild(li);
    });
  }

  function renderCategoriesManager() {
    categoriesList.innerHTML = '';
    state.categories.forEach((c) => {
      const li = document.createElement('li');
      const label = document.createElement('div');
      label.textContent = c;
      const actions = document.createElement('div');
      actions.className = 'actions';
      const del = document.createElement('button');
      del.textContent = 'Delete';
      del.addEventListener('click', async () => {
        if (confirm('Delete this category and its replies?')) {
          await api.deleteCategory(c);
        }
      });
      actions.appendChild(del);
      li.appendChild(label);
      li.appendChild(actions);
      categoriesList.appendChild(li);
    });
  }

  function renderAll() {
    applyTheme();
    renderCategoriesOptions();
    renderReplies();
    renderLinks();
    renderCategoriesManager();
    notesText.value = state.notes || '';
    // settings
    themeSelect.value = state.settings.theme;
    accentColor.value = state.settings.accentColor;
    alwaysOnTopToggle.checked = !!state.settings.alwaysOnTop;
    autoPasteToggle.checked = !!state.settings.autoPaste;
  }

  // Events
  addReplyBtn.addEventListener('click', async () => {
    const text = (replyText.value || '').trim();
    const cat = replyCategory.value || 'General';
    if (!text) return;
    await api.addReply({ text, category: cat });
    replyText.value = '';
    categoryFilter.value = 'All';
  });
  categoryFilter.addEventListener('change', renderReplies);

  addLinkBtn.addEventListener('click', async () => {
    const url = (linkUrl.value || '').trim();
    const label = (linkLabel.value || '').trim() || url;
    if (!url) return;
    await api.addLink({ label, url });
    linkUrl.value = '';
    linkLabel.value = '';
  });

  // Debounced notes save
  let notesTimer = null;
  notesText.addEventListener('input', () => {
    if (notesTimer) clearTimeout(notesTimer);
    notesTimer = setTimeout(() => api.saveNotes(notesText.value), 400);
  });

  themeSelect.addEventListener('change', () => api.updateSettings({ theme: themeSelect.value }));
  accentColor.addEventListener('input', () => api.updateSettings({ accentColor: accentColor.value }));
  alwaysOnTopToggle.addEventListener('change', () => api.updateSettings({ alwaysOnTop: !!alwaysOnTopToggle.checked }));
  autoPasteToggle.addEventListener('change', () => api.updateSettings({ autoPaste: !!autoPasteToggle.checked }));

  addCategoryBtn.addEventListener('click', async () => {
    const name = (newCategoryName.value || '').trim();
    if (!name) return;
    if (state.categories.includes(name)) return alert('Category exists');
    await api.addCategory(name);
    newCategoryName.value = '';
  });

  // Initialize
  api.getStore().then((data) => {
    Object.assign(state, data);
    // Ensure default category exists
    if (!state.categories.includes('General')) {
      state.categories.unshift('General');
    }
    renderAll();
  });

  api.onStoreUpdated((data) => {
    Object.assign(state, data);
    renderAll();
  });
})();

