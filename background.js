let floatingWindowId = null;

async function createFloatingWindow() {
  return new Promise((resolve) => {
    chrome.windows.create(
      {
        url: chrome.runtime.getURL("popup.html"),
        type: "popup",
        width: 420,
        height: 640,
        top: 100,
        left: 100,
        focused: true,
      },
      (win) => {
        if (!win) {
          resolve(null);
          return;
        }
        floatingWindowId = win.id;
        // Essai best-effort pour activer Always-on-Top si l'API est disponible
        try {
          chrome.windows.update(
            win.id,
            { focused: true, drawAttention: false, alwaysOnTop: true },
            () => {
              void chrome.runtime.lastError;
              resolve(win);
            }
          );
        } catch (e) {
          resolve(win);
        }
      }
    );
  });
}

async function toggleFloatingWindow() {
  if (floatingWindowId) {
    try {
      const w = await chrome.windows.get(floatingWindowId, { populate: false });
      if (w) {
        await chrome.windows.update(floatingWindowId, { focused: true });
        return;
      }
    } catch (e) {
      floatingWindowId = null;
    }
  }
  await createFloatingWindow();
}

chrome.windows.onRemoved.addListener((id) => {
  if (id === floatingWindowId) {
    floatingWindowId = null;
  }
});

// Clic sur l'icône de l'extension : on privilégie le Side Panel si dispo
chrome.action.onClicked.addListener(async (tab) => {
  if (chrome.sidePanel && chrome.sidePanel.open) {
    try {
      if (chrome.sidePanel.setOptions) {
        try {
          await chrome.sidePanel.setOptions({
            tabId: tab?.id,
            path: "popup.html",
            enabled: true,
          });
        } catch (e) {
          // ignore
        }
      }
      try {
        if (tab?.id) {
          await chrome.sidePanel.open({ tabId: tab.id });
          return;
        }
      } catch (e) {
        // fallback si open échoue
      }
    } catch (e) {
      // fallback vers fenêtre flottante
    }
  }
  await toggleFloatingWindow();
});

// Raccourci clavier
chrome.commands?.onCommand?.addListener(async (command) => {
  if (command === "toggle-quick-reply-window") {
    await toggleFloatingWindow();
  }
});

// Au moment de l'installation, configurer le comportement du panel si supporté
chrome.runtime.onInstalled.addListener(async () => {
  if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
    try {
      await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
    } catch (e) {
      // ignore
    }
  }
});

