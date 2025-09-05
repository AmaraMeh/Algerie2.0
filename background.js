
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

=======
/**
 * Service Worker pour Quick Reply Manager
 * Gère la persistance des données et les événements de l'extension
 */

// Initialisation du service worker
chrome.runtime.onInstalled.addListener((details) => {
    console.log('Quick Reply Manager installé');
    
    // Créer un contexte de menu pour les actions rapides
    chrome.contextMenus.create({
        id: 'quickReply',
        title: 'Quick Reply Manager',
        contexts: ['editable']
    });
    
    // Sous-menu pour les actions rapides
    chrome.contextMenus.create({
        id: 'openQuickReply',
        parentId: 'quickReply',
        title: 'Ouvrir Quick Reply',
        contexts: ['editable']
    });
});

// Gestion des messages entre les composants
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
        case 'getData':
            handleGetData(sendResponse);
            return true; // Indique que la réponse sera asynchrone
            
        case 'saveData':
            handleSaveData(request.data, sendResponse);
            return true;
            
        case 'searchReplies':
            handleSearchReplies(request.query, sendResponse);
            return true;
            
        case 'copyToClipboard':
            handleCopyToClipboard(request.text, sendResponse);
            return true;
            
        default:
            sendResponse({ error: 'Action non reconnue' });
    }
});

/**
 * Récupère toutes les données
 */
async function handleGetData(sendResponse) {
    try {
        const result = await chrome.storage.local.get(['quickReplyData']);
        const data = result.quickReplyData || {
            categories: [
                {
                    id: 'default',
                    name: 'Général',
                    replies: [
                        {
                            id: 'welcome',
                            title: 'Message de bienvenue',
                            text: 'Bonjour,\n\nMerci pour votre message. Je vous répondrai dans les plus brefs délais.\n\nCordialement'
                        }
                    ]
                }
            ]
        };
        
        sendResponse({ success: true, data });
    } catch (error) {
        console.error('Erreur lors de la récupération des données:', error);
        sendResponse({ success: false, error: error.message });
    }
}

/**
 * Sauvegarde les données
 */
async function handleSaveData(data, sendResponse) {
    try {
        await chrome.storage.local.set({ quickReplyData: data });
        sendResponse({ success: true });
    } catch (error) {
        console.error('Erreur lors de la sauvegarde des données:', error);
        sendResponse({ success: false, error: error.message });
    }
}

/**
 * Recherche dans les réponses
 */
async function handleSearchReplies(query, sendResponse) {
    try {
        const result = await chrome.storage.local.get(['quickReplyData']);
        const data = result.quickReplyData || { categories: [] };
        const results = [];
        const searchTerm = query.toLowerCase().trim();

        data.categories.forEach(category => {
            category.replies.forEach(reply => {
                if (reply.title.toLowerCase().includes(searchTerm) || 
                    reply.text.toLowerCase().includes(searchTerm)) {
                    results.push({
                        ...reply,
                        categoryName: category.name,
                        categoryId: category.id
                    });
                }
            });
        });

        sendResponse({ success: true, results });
    } catch (error) {
        console.error('Erreur lors de la recherche:', error);
        sendResponse({ success: false, error: error.message });
    }
}

/**
 * Copie du texte dans le presse-papier
 */
async function handleCopyToClipboard(text, sendResponse) {
    try {
        // Note: Le service worker ne peut pas accéder directement au presse-papier
        // Cette fonctionnalité doit être gérée dans le popup ou content script
        sendResponse({ success: true, message: 'Copie gérée par le popup' });
    } catch (error) {
        console.error('Erreur lors de la copie:', error);
        sendResponse({ success: false, error: error.message });
    }
}

// Gestion des événements de l'extension
chrome.action.onClicked.addListener((tab) => {
    // Cette fonction est appelée quand l'utilisateur clique sur l'icône de l'extension
    // Le popup s'ouvre automatiquement grâce au manifest
    console.log('Extension cliquée');
});

// Gestion des mises à jour de l'extension
chrome.runtime.onUpdateAvailable.addListener((details) => {
    console.log('Mise à jour disponible:', details.version);
    // Optionnel: notifier l'utilisateur de la mise à jour
});

// Gestion des erreurs
chrome.runtime.onSuspend.addListener(() => {
    console.log('Service worker suspendu');
});

// Fonction utilitaire pour nettoyer les données anciennes (optionnel)
async function cleanupOldData() {
    try {
        const result = await chrome.storage.local.get(null);
        const keys = Object.keys(result);
        
        // Supprimer les données de plus de 30 jours (exemple)
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        
        for (const key of keys) {
            if (key.startsWith('quickReply_') && result[key].timestamp < thirtyDaysAgo) {
                await chrome.storage.local.remove(key);
            }
        }
    } catch (error) {
        console.error('Erreur lors du nettoyage:', error);
    }
}

// Nettoyage périodique (optionnel)
setInterval(cleanupOldData, 24 * 60 * 60 * 1000); // Toutes les 24 heures

// Gestion des notifications (optionnel)
function showNotification(title, message) {
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiByeD0iOCIgZmlsbD0iIzQyODVGNCIvPgo8cGF0aCBkPSJNMjQgMTJIMThWMjRIMjRWMjBIMjJWMTRIMjRWMjBIMjZWMTRIMjRWMjBaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMzAgMThIMjRWMjBIMzBWMThaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMjQgMjJIMThWMjRIMjRWMjJaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K',
        title: title,
        message: message
    });
}

// Export des fonctions pour les tests (optionnel)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        handleGetData,
        handleSaveData,
        handleSearchReplies,
        cleanupOldData
    };
}

