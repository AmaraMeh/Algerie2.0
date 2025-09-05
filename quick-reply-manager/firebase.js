// Lightweight Firebase integration via REST to avoid bundling SDK in MV3
// Uses Realtime Database REST API with anonymous auth via Identity Toolkit.

(function(){
  const CONFIG = {
    apiKey: "AIzaSyAtscANFcA8pwPFCMtpLsqUIuQDG93VPL0",
    projectId: "amara-8a16f",
    databaseURL: "https://amara-8a16f-default-rtdb.firebaseio.com",
  };

  const AUTH_STORAGE_KEY = 'qrmFirebaseAuth';
  const USER_PATH = () => `users/${state.uid}/qrm.json`;

  const state = {
    idToken: null,
    uid: null,
    expiresAt: 0
  };

  function nowSeconds(){ return Math.floor(Date.now()/1000); }

  async function loadAuth(){
    try {
      const res = await chrome.storage.local.get({ [AUTH_STORAGE_KEY]: null });
      const saved = res[AUTH_STORAGE_KEY];
      if (saved && saved.idToken && saved.uid && saved.expiresAt > nowSeconds()+60) {
        Object.assign(state, saved);
        return true;
      }
    } catch(_) {}
    return false;
  }

  async function saveAuth(){
    try { await chrome.storage.local.set({ [AUTH_STORAGE_KEY]: { ...state } }); } catch(_) {}
  }

  async function ensureAuth(){
    if (await loadAuth()) return state;
    // Anonymous sign-in
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${encodeURIComponent(CONFIG.apiKey)}`;
    const resp = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ returnSecureToken: true }) });
    if (!resp.ok) throw new Error('Firebase auth failed');
    const data = await resp.json();
    state.idToken = data.idToken;
    state.uid = data.localId;
    state.expiresAt = nowSeconds() + parseInt(data.expiresIn || '3600', 10) - 60;
    await saveAuth();
    return state;
  }

  async function push(payload){
    try { await ensureAuth(); } catch(_) { return; }
    const url = `${CONFIG.databaseURL}/${USER_PATH()}?auth=${encodeURIComponent(state.idToken)}`;
    await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  }

  async function pull(){
    try { await ensureAuth(); } catch(_) { return null; }
    const url = `${CONFIG.databaseURL}/${USER_PATH()}?auth=${encodeURIComponent(state.idToken)}`;
    const resp = await fetch(url, { method: 'GET' });
    if (!resp.ok) return null;
    return await resp.json();
  }

  window.QRMFirebase = { push, pull };
})();

