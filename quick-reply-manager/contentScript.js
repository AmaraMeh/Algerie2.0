(() => {
  const CONTAINER_ID = "qrm-overlay-container";
  const STORAGE_SIZE_KEY = "qrmOverlaySize";

  async function createOverlay() {
    let host = document.getElementById(CONTAINER_ID);
    if (host) {
      host.style.display = "block";
      return host;
    }

    host = document.createElement("div");
    host.id = CONTAINER_ID;
    host.style.position = "fixed";
    host.style.right = "16px";
    host.style.bottom = "16px";
    // Load persisted size if available
    try {
      const res = await chrome.storage.local.get({ [STORAGE_SIZE_KEY]: { width: 380, height: 520 } });
      const sz = res[STORAGE_SIZE_KEY] || { width: 380, height: 520 };
      host.style.width = `${Math.max(280, Math.min(720, sz.width))}px`;
      host.style.height = `${Math.max(320, Math.min(900, sz.height))}px`;
    } catch (_) {
      host.style.width = "380px";
      host.style.height = "520px";
    }
    host.style.zIndex = "2147483647";
    host.style.boxShadow = "0 10px 30px rgba(0,0,0,0.25)";
    host.style.borderRadius = "12px";
    host.style.overflow = "hidden";
    host.style.background = "#fff";
    host.style.color = "#111";
    host.style.fontFamily = "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif";

    const shadow = host.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = `
      :host, * { box-sizing: border-box; }
      .qrm-frame { width: 100%; height: calc(100% - 36px); border: 0; }
      .qrm-header {
        height: 36px;
        background: #0f172a;
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 8px 0 12px;
        cursor: move;
        user-select: none;
      }
      .qrm-title { font-size: 13px; font-weight: 600; }
      .qrm-btns { display: flex; gap: 6px; }
      .qrm-btn {
        background: transparent; border: 0; color: #e5e7eb; width: 26px; height: 26px;
        display: grid; place-items: center; border-radius: 6px; cursor: pointer;
      }
      .qrm-btn:hover { background: rgba(255,255,255,0.1); }
      .qrm-resize {
        position: absolute;
        right: 0;
        bottom: 0;
        width: 14px;
        height: 14px;
        cursor: se-resize;
        background: linear-gradient(135deg, transparent 0 50%, rgba(0,0,0,0.2) 50% 100%);
      }
    `;

    const header = document.createElement("div");
    header.className = "qrm-header";
    const title = document.createElement("div");
    title.className = "qrm-title";
    title.textContent = "Quick Reply Manager";
    const btns = document.createElement("div");
    btns.className = "qrm-btns";
    const minimize = document.createElement("button");
    minimize.className = "qrm-btn";
    minimize.title = "Réduire";
    minimize.textContent = "–";
    const close = document.createElement("button");
    close.className = "qrm-btn";
    close.title = "Fermer";
    close.textContent = "×";
    btns.append(minimize, close);
    header.append(title, btns);

    const frame = document.createElement("iframe");
    frame.className = "qrm-frame";
    frame.src = chrome.runtime.getURL("popup.html") + "?embedded=1";

    const resizeHandle = document.createElement("div");
    resizeHandle.className = "qrm-resize";

    shadow.append(style, header, frame, resizeHandle);

    // Drag logic
    let isDragging = false;
    let startX = 0; let startY = 0; let startRight = 0; let startBottom = 0;
    header.addEventListener("mousedown", (e) => {
      isDragging = true;
      startX = e.clientX; startY = e.clientY;
      startRight = parseInt(host.style.right) || 0;
      startBottom = parseInt(host.style.bottom) || 0;
      e.preventDefault();
    });
    window.addEventListener("mousemove", (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      host.style.right = `${Math.max(0, startRight - dx)}px`;
      host.style.bottom = `${Math.max(0, startBottom - dy)}px`;
    });
    window.addEventListener("mouseup", () => { isDragging = false; });

    minimize.addEventListener("click", (e) => {
      e.stopPropagation();
      if (frame.style.display !== "none") {
        frame.style.display = "none";
        host.style.height = "36px";
      } else {
        frame.style.display = "block";
        // Restore from current style height or default
        if (!host.style.height || host.style.height === "36px") {
          host.style.height = "520px";
        }
      }
    });
    close.addEventListener("click", (e) => {
      e.stopPropagation();
      try { chrome.runtime.sendMessage({ type: "QRM_CLOSED" }); } catch (_) {}
      host.remove();
    });

    // Resize logic
    let isResizing = false;
    let startW = 0; let startH = 0; let startClientX = 0; let startClientY = 0;
    resizeHandle.addEventListener("mousedown", (e) => {
      isResizing = true;
      startW = host.getBoundingClientRect().width;
      startH = host.getBoundingClientRect().height;
      startClientX = e.clientX; startClientY = e.clientY;
      e.preventDefault(); e.stopPropagation();
    });
    window.addEventListener("mousemove", (e) => {
      if (!isResizing) return;
      const dx = e.clientX - startClientX;
      const dy = e.clientY - startClientY;
      const newW = Math.max(280, Math.min(720, startW + dx));
      const newH = Math.max(320, Math.min(900, startH + dy));
      host.style.width = `${newW}px`;
      host.style.height = `${newH}px`;
    });
    window.addEventListener("mouseup", async () => {
      if (!isResizing) return;
      isResizing = false;
      try {
        const rect = host.getBoundingClientRect();
        await chrome.storage.local.set({ [STORAGE_SIZE_KEY]: { width: Math.round(rect.width), height: Math.round(rect.height) } });
      } catch (_) {}
    });

    document.documentElement.appendChild(host);
    return host;
  }

  function hideOverlay() {
    const host = document.getElementById(CONTAINER_ID);
    if (host) host.style.display = "none";
  }

  function pasteIntoActive(text) {
    try {
      const active = document.activeElement;
      const isTextInput = (el) => el && (
        (el.tagName === 'TEXTAREA') ||
        (el.tagName === 'INPUT' && ['text','search','email','url','tel','number','password'].includes(el.type))
      );

      if (isTextInput(active)) {
        const start = active.selectionStart ?? active.value.length;
        const end = active.selectionEnd ?? active.value.length;
        const val = active.value || '';
        active.value = val.slice(0, start) + text + val.slice(end);
        const caret = start + text.length;
        active.selectionStart = active.selectionEnd = caret;
        active.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
      }

      // contenteditable
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        range.deleteContents();
        const node = document.createTextNode(text);
        range.insertNode(node);
        // Move caret to end of inserted node
        range.setStartAfter(node);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
        return true;
      }
    } catch (_) {}
    return false;
  }

  chrome.runtime.onMessage.addListener((msg) => {
    if (!msg || !msg.type) return;
    if (msg.type === "QRM_SHOW") {
      createOverlay();
    } else if (msg.type === "QRM_HIDE") {
      hideOverlay();
    } else if (msg.type === "QRM_PASTE_TEXT") {
      pasteIntoActive(String(msg.text || ""));
    }
  });
})();

