(() => {
  const CONTAINER_ID = "qrm-overlay-container";

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
    host.style.width = "420px";
    host.style.height = "600px";
    host.style.minWidth = "320px";
    host.style.minHeight = "400px";
    host.style.maxWidth = "800px";
    host.style.maxHeight = "90vh";
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
        bottom: 0;
        right: 0;
        width: 20px;
        height: 20px;
        cursor: se-resize;
        background: linear-gradient(-45deg, transparent 30%, #22d3ee 30%, #22d3ee 40%, transparent 40%, transparent 60%, #22d3ee 60%, #22d3ee 70%, transparent 70%);
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
    let isResizing = false;
    let startX = 0; let startY = 0; let startRight = 0; let startBottom = 0;
    let startWidth = 0; let startHeight = 0;
    
    header.addEventListener("mousedown", (e) => {
      isDragging = true;
      startX = e.clientX; startY = e.clientY;
      startRight = parseInt(host.style.right) || 0;
      startBottom = parseInt(host.style.bottom) || 0;
      e.preventDefault();
    });
    
    resizeHandle.addEventListener("mousedown", (e) => {
      isResizing = true;
      startX = e.clientX; startY = e.clientY;
      startWidth = parseInt(host.style.width) || 420;
      startHeight = parseInt(host.style.height) || 600;
      e.preventDefault();
      e.stopPropagation();
    });
    
    window.addEventListener("mousemove", (e) => {
      if (isDragging) {
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        host.style.right = `${Math.max(0, startRight - dx)}px`;
        host.style.bottom = `${Math.max(0, startBottom - dy)}px`;
      } else if (isResizing) {
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        const newWidth = Math.max(320, Math.min(800, startWidth + dx));
        const newHeight = Math.max(400, Math.min(window.innerHeight * 0.9, startHeight + dy));
        host.style.width = `${newWidth}px`;
        host.style.height = `${newHeight}px`;
      }
    });
    
    window.addEventListener("mouseup", () => { 
      isDragging = false; 
      isResizing = false;
    });

    minimize.addEventListener("click", (e) => {
      e.stopPropagation();
      if (frame.style.display !== "none") {
        frame.style.display = "none";
        host.style.height = "36px";
      } else {
        frame.style.display = "block";
        host.style.height = "600px";
      }
    });
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

  function pasteTextToActiveElement(text) {
    const activeElement = document.activeElement;
    if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.contentEditable === 'true')) {
      // For contentEditable elements
      if (activeElement.contentEditable === 'true') {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.deleteContents();
          range.insertNode(document.createTextNode(text));
          range.collapse(false);
          selection.removeAllRanges();
          selection.addRange(range);
        } else {
          activeElement.textContent = text;
        }
      } else {
        // For input and textarea elements
        const start = activeElement.selectionStart;
        const end = activeElement.selectionEnd;
        const value = activeElement.value;
        activeElement.value = value.substring(0, start) + text + value.substring(end);
        activeElement.selectionStart = activeElement.selectionEnd = start + text.length;
      }
      
      // Trigger input event to notify the page
      activeElement.dispatchEvent(new Event('input', { bubbles: true }));
      activeElement.dispatchEvent(new Event('change', { bubbles: true }));
      activeElement.focus();
      return true;
    }
    return false;
  }

  chrome.runtime.onMessage.addListener((msg) => {
    if (!msg || !msg.type) return;
    if (msg.type === "QRM_SHOW") {
      createOverlay();
    } else if (msg.type === "QRM_HIDE") {
      hideOverlay();
    } else if (msg.type === "PASTE_TEXT") {
      if (!pasteTextToActiveElement(msg.text)) {
        // If no active element, try to find common input fields
        const inputs = document.querySelectorAll('input[type="text"], input[type="email"], textarea, [contenteditable="true"]');
        if (inputs.length > 0) {
          inputs[0].focus();
          pasteTextToActiveElement(msg.text);
        }
      }
    }
  });
})();

