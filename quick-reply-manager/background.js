// Background service worker for Quick Reply Manager

const visibleTabs = new Set();

async function loadVisibleTabs() {
  try {
    const res = await chrome.storage.session.get({ visibleTabs: [] });
    const arr = Array.isArray(res.visibleTabs) ? res.visibleTabs : [];
    for (const id of arr) visibleTabs.add(id);
  } catch (_) {}
}

async function saveVisibleTabs() {
  try {
    await chrome.storage.session.set({ visibleTabs: Array.from(visibleTabs) });
  } catch (_) {}
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function ensureContentScriptInjected(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["contentScript.js"],
      injectImmediately: true
    });
  } catch (err) {
    // Ignore errors when already injected or not allowed
  }
}

async function showOverlay(tabId) {
  await ensureContentScriptInjected(tabId);
  try {
    await chrome.tabs.sendMessage(tabId, { type: "QRM_SHOW" });
  } catch (err) {
    // If messaging fails, try reinjecting and resend once
    await ensureContentScriptInjected(tabId);
    try { await chrome.tabs.sendMessage(tabId, { type: "QRM_SHOW" }); } catch (e) {}
  }
}

async function hideOverlay(tabId) {
  try {
    await chrome.tabs.sendMessage(tabId, { type: "QRM_HIDE" });
  } catch (err) {
    // no-op
  }
}

async function toggleOverlayForTab(tabId) {
  if (visibleTabs.has(tabId)) {
    await hideOverlay(tabId);
    visibleTabs.delete(tabId);
    await saveVisibleTabs();
  } else {
    await showOverlay(tabId);
    visibleTabs.add(tabId);
    await saveVisibleTabs();
  }
}

chrome.action.onClicked.addListener(async () => {
  const tab = await getActiveTab();
  if (!tab || tab.id == null) return;
  await toggleOverlayForTab(tab.id);
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command === "toggle_overlay") {
    const tab = await getActiveTab();
    if (!tab || tab.id == null) return;
    await toggleOverlayForTab(tab.id);
  }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && visibleTabs.has(tabId)) {
    await showOverlay(tabId);
  }
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
  if (visibleTabs.delete(tabId)) {
    await saveVisibleTabs();
  }
});

chrome.runtime.onMessage.addListener(async (msg, sender) => {
  if (!msg || !msg.type) return;
  if (msg.type === "QRM_CLOSED") {
    const tabId = sender?.tab?.id;
    if (tabId != null && visibleTabs.delete(tabId)) {
      await saveVisibleTabs();
    }
  } else if (msg.type === "QRM_PASTE_TEXT_REQUEST") {
    try {
      const tab = await getActiveTab();
      if (!tab || tab.id == null) return;
      await chrome.tabs.sendMessage(tab.id, { type: "QRM_PASTE_TEXT", text: msg.text });
    } catch (_) {}
  }
});

// Initialize persisted state
loadVisibleTabs();

