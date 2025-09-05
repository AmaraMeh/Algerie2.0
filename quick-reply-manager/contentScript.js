(() => {
  const CONTAINER_ID = "qrm-overlay-container";
  let isMaximized = false;
  let lastKnownSize = { width: 380, height: 520 };

  function createOverlay() {
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
    host.style.width = `${lastKnownSize.width}px`;
    host.style.height = `${lastKnownSize.height}px`;
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
      .qrm-resizer {
        position: absolute;
        right: 0; bottom: 0;
        width: 14px; height: 14px;
        cursor: nwse-resize;
        background: linear-gradient(135deg, transparent 0 50%, rgba(0,0,0,0.2) 50%);
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
    const maximize = document.createElement("button");
    maximize.className = "qrm-btn";
    maximize.title = "Agrandir/Réduire";
    maximize.textContent = "□";
    const close = document.createElement("button");
    close.className = "qrm-btn";
    close.title = "Fermer";
    close.textContent = "×";
    btns.append(minimize, maximize, close);
    header.append(title, btns);

    const frame = document.createElement("iframe");
    frame.className = "qrm-frame";
    frame.src = chrome.runtime.getURL("popup.html") + "?embedded=1";

    const resizer = document.createElement("div");
    resizer.className = "qrm-resizer";
    shadow.append(style, header, frame, resizer);

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
        host.style.height = `${lastKnownSize.height}px`;
      }
    });
    maximize.addEventListener("click", (e) => {
      e.stopPropagation();
      isMaximized = !isMaximized;
      if (isMaximized) {
        // store current size
        lastKnownSize = { width: parseInt(host.style.width) || lastKnownSize.width, height: parseInt(host.style.height) || lastKnownSize.height };
        const w = Math.min(Math.max(Math.floor(window.innerWidth * 0.5), 360), 1000);
        const h = Math.min(Math.max(Math.floor(window.innerHeight * 0.75), 240), window.innerHeight - 32);
        host.style.width = `${w}px`;
        host.style.height = `${h}px`;
      } else {
        host.style.width = `${lastKnownSize.width}px`;
        host.style.height = `${lastKnownSize.height}px`;
      }
    });
    // Resize logic
    let isResizing = false;
    let resizeStartX = 0, resizeStartY = 0, startW = 0, startH = 0;
    resizer.addEventListener("mousedown", (e) => {
      isResizing = true;
      resizeStartX = e.clientX; resizeStartY = e.clientY;
      startW = host.getBoundingClientRect().width;
      startH = host.getBoundingClientRect().height;
      e.preventDefault(); e.stopPropagation();
    });
    window.addEventListener("mousemove", (e) => {
      if (!isResizing) return;
      const dx = e.clientX - resizeStartX;
      const dy = e.clientY - resizeStartY;
      const newW = Math.min(Math.max(320, startW + dx), Math.max(320, window.innerWidth - 16));
      const newH = Math.min(Math.max(240, startH + dy), Math.max(240, window.innerHeight - 16));
      host.style.width = `${newW}px`;
      host.style.height = `${newH}px`;
      lastKnownSize = { width: newW, height: newH };
    });
    window.addEventListener("mouseup", () => { isResizing = false; });
    close.addEventListener("click", (e) => {
      e.stopPropagation();
      try { chrome.runtime.sendMessage({ type: "QRM_CLOSED" }); } catch (_) {}
      host.remove();
    });

    document.documentElement.appendChild(host);
    return host;
  }

  function hideOverlay() {
    const host = document.getElementById(CONTAINER_ID);
    if (host) host.style.display = "none";
  }

  chrome.runtime.onMessage.addListener((msg) => {
    if (!msg || !msg.type) return;
    if (msg.type === "QRM_SHOW") {
      createOverlay();
    } else if (msg.type === "QRM_HIDE") {
      hideOverlay();
    } else if (msg.type === "QRM_PASTE") {
      try {
        const text = String(msg.text || "");
        if (!text) return;
        const active = document.activeElement;
        if (active && (active.tagName === "TEXTAREA" || (active.tagName === "INPUT" && /^(text|search|email|tel|url|number|password)?$/i.test(active.type)))) {
          const el = /** @type {HTMLTextAreaElement|HTMLInputElement} */(active);
          const start = el.selectionStart ?? el.value.length;
          const end = el.selectionEnd ?? el.value.length;
          const before = el.value.slice(0, start);
          const after = el.value.slice(end);
          el.value = before + text + after;
          const pos = start + text.length;
          try { el.setSelectionRange(pos, pos); } catch (_) {}
          el.dispatchEvent(new Event("input", { bubbles: true }));
          return;
        }
        // contentEditable
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          try {
            document.execCommand("insertText", false, text);
          } catch (_) {
            const range = sel.getRangeAt(0);
            range.deleteContents();
            range.insertNode(document.createTextNode(text));
          }
          return;
        }
        // Fallback: append to body as last resort (no-op)
      } catch (_) {}
    }
  });
})();

