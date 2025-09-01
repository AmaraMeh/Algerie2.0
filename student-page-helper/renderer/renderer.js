/* global api */

const state = {
  replies: [],
  categories: [],
  links: [],
  notes: '',
  settings: { theme: 'dark', accentColor: '#7c3aed', alwaysOnTop: true, autoPaste: false }
};

const el = {
  tabs: document.querySelector('.tabs'),
  tabButtons: Array.from(document.querySelectorAll('.tabs button')),
  tabSections: {
    replies: document.getElementById('tab-replies'),
    links: document.getElementById('tab-links'),
    notes: document.getElementById('tab-notes'),
    settings: document.getElementById('tab-settings')
  },
  minimizeBtn: document.getElementById('minimizeBtn'),
  closeBtn: document.getElementById('closeBtn'),
  status: document.getElementById('status'),
  // Replies
  categoryFilter: document.getElementById('categoryFilter'),
  searchInput: document.getElementById('searchInput'),
  addReplyBtn: document.getElementById('addReplyBtn'),
  repliesList: document.getElementById('repliesList'),
  // Links
  addLinkBtn: document.getElementById('addLinkBtn'),
  linksList: document.getElementById('linksList'),
  // Notes
  notesArea: document.getElementById('notesArea'),
  // Settings
  themeSelect: document.getElementById('themeSelect'),
  accentColorInput: document.getElementById('accentColorInput'),
  alwaysOnTopToggle: document.getElementById('alwaysOnTopToggle'),
  autoPasteToggle: document.getElementById('autoPasteToggle')
};

function setStatus(message) {
  el.status.textContent = message || '';
  if (!message) return;
  setTimeout(() => {
    if (el.status.textContent === message) el.status.textContent = '';
  }, 2000);
}

function setTheme(theme, accentColor) {
  const root = document.documentElement;
  if (theme === 'light') {
    root.setAttribute('data-theme', 'light');
  } else {
    root.removeAttribute('data-theme');
  }
  if (accentColor) {
    root.style.setProperty('--accent', accentColor);
  }
}

function mountTabs() {
  el.tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      el.tabButtons.forEach((b) => b.classList.toggle('active', b === btn));
      Object.entries(el.tabSections).forEach(([key, section]) => {
        section.classList.toggle('active', key === target);
      });
    });
  });
}

function renderCategoryFilter() {
  const current = el.categoryFilter.value;
  el.categoryFilter.innerHTML = '';
  const allOption = document.createElement('option');
  allOption.value = '__ALL__';
  allOption.textContent = 'All Categories';
  el.categoryFilter.appendChild(allOption);
  state.categories.forEach((name) => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    el.categoryFilter.appendChild(option);
  });
  el.categoryFilter.value = state.categories.includes(current) ? current : '__ALL__';
}

function makeReplyElement(reply) {
  const tpl = document.getElementById('replyItemTemplate');
  const node = tpl.content.cloneNode(true);
  const root = node.querySelector('.reply-item');
  root.dataset.id = reply.id;
  root.querySelector('.category').textContent = reply.category;
  root.querySelector('.text').textContent = reply.text;
  const btnCopy = root.querySelector('.btn-copy');
  const btnEdit = root.querySelector('.btn-edit');
  const btnDelete = root.querySelector('.btn-delete');

  btnCopy.addEventListener('click', async () => {
    await api.copy(reply.text, state.settings.autoPaste);
    setStatus('Copied');
  });
  btnEdit.addEventListener('click', () => {
    const newText = prompt('Edit reply text:', reply.text);
    if (newText == null) return;
    const newCat = prompt('Edit category:', reply.category);
    if (newCat == null) return;
    api.updateReply(reply.id, newText, newCat);
  });
  btnDelete.addEventListener('click', () => {
    if (confirm('Delete this reply?')) {
      api.deleteReply(reply.id);
    }
  });
  return node;
}

function renderReplies() {
  const filterCat = el.categoryFilter.value;
  const q = el.searchInput.value.toLowerCase().trim();
  el.repliesList.innerHTML = '';
  const filtered = state.replies.filter((r) => {
    const catOk = filterCat === '__ALL__' || r.category === filterCat;
    const textOk = !q || r.text.toLowerCase().includes(q);
    return catOk && textOk;
  });
  filtered.forEach((r) => el.repliesList.appendChild(makeReplyElement(r)));
}

function onAddReply() {
  const text = prompt('Reply text:');
  if (!text) return;
  const category = prompt('Category (existing or new):', state.categories[0] || 'General') || 'General';
  if (!state.categories.includes(category)) {
    api.addCategory(category);
  }
  api.addReply(text, category);
}

function makeLinkElement(link) {
  const tpl = document.getElementById('linkItemTemplate');
  const node = tpl.content.cloneNode(true);
  const root = node.querySelector('.link-item');
  root.dataset.id = link.id;
  root.querySelector('.title').textContent = link.title;
  root.querySelector('.url').textContent = link.url;
  root.querySelector('.btn-open').addEventListener('click', () => api.openExternal(link.url));
  root.querySelector('.btn-edit').addEventListener('click', () => {
    const title = prompt('Link title:', link.title);
    if (title == null) return;
    const url = prompt('URL:', link.url);
    if (url == null) return;
    api.updateLink(link.id, title, url);
  });
  root.querySelector('.btn-delete').addEventListener('click', () => {
    if (confirm('Delete this link?')) api.deleteLink(link.id);
  });
  return node;
}

function renderLinks() {
  el.linksList.innerHTML = '';
  state.links.forEach((l) => el.linksList.appendChild(makeLinkElement(l)));
}

function onAddLink() {
  const title = prompt('Link title:');
  if (!title) return;
  const url = prompt('URL:');
  if (!url) return;
  api.addLink(title, url);
}

function loadAll(data) {
  state.replies = data.replies || [];
  state.categories = data.categories || [];
  state.links = data.links || [];
  state.notes = data.notes || '';
  state.settings = data.settings || state.settings;
  // Theme
  setTheme(state.settings.theme, state.settings.accentColor);
  // UI values
  el.themeSelect.value = state.settings.theme || 'dark';
  el.accentColorInput.value = state.settings.accentColor || '#7c3aed';
  el.alwaysOnTopToggle.checked = !!state.settings.alwaysOnTop;
  el.autoPasteToggle.checked = !!state.settings.autoPaste;
  el.notesArea.value = state.notes;
  renderCategoryFilter();
  renderReplies();
  renderLinks();
}

function wireEvents() {
  // Window controls
  el.minimizeBtn.addEventListener('click', () => api.minimize());
  el.closeBtn.addEventListener('click', () => api.close());

  // Tabs
  mountTabs();

  // Replies
  el.categoryFilter.addEventListener('change', renderReplies);
  el.searchInput.addEventListener('input', renderReplies);
  el.addReplyBtn.addEventListener('click', onAddReply);

  // Links
  el.addLinkBtn.addEventListener('click', onAddLink);

  // Notes (debounced save)
  let notesTimer = null;
  el.notesArea.addEventListener('input', () => {
    clearTimeout(notesTimer);
    notesTimer = setTimeout(() => {
      api.saveNotes(el.notesArea.value);
      setStatus('Notes saved');
    }, 400);
  });

  // Settings
  el.themeSelect.addEventListener('change', async () => {
    const theme = el.themeSelect.value;
    await api.setSettings({ theme });
  });
  el.accentColorInput.addEventListener('input', async () => {
    const accentColor = el.accentColorInput.value;
    document.documentElement.style.setProperty('--accent', accentColor);
    await api.setSettings({ accentColor });
  });
  el.alwaysOnTopToggle.addEventListener('change', async () => {
    await api.setSettings({ alwaysOnTop: el.alwaysOnTopToggle.checked });
  });
  el.autoPasteToggle.addEventListener('change', async () => {
    await api.setSettings({ autoPaste: el.autoPasteToggle.checked });
  });

  // Store updates from main
  api.onDataUpdated(loadAll);
}

async function init() {
  wireEvents();
  const data = await api.getData();
  loadAll(data);
}

init();

