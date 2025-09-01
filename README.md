# Student Page Helper

A floating, always-on-top desktop helper to manage quick replies, links, and notes for your student Instagram/Telegram page.

## Features
- **Always-on-top window**: small, draggable, resizable.
- **Quick Reply Manager**: add/edit/delete, categorize (Scholarships, Exams, General, Memes), one-click copy, optional auto-paste.
- **Global shortcuts**: Ctrl+1..9 to copy/paste the first nine replies.
- **Saved Links & Resources**: open your frequently used links in the default browser.
- **Post Ideas & Notes**: simple notes area with auto-save.
- **Customization**: dark/light mode, accent color, always-on-top toggle.
- **Local persistence**: powered by `electron-store`.

## Tech Stack
- Electron.js (Main/Preload)
- Vanilla HTML/CSS/JS for renderer (simple and lightweight)
- electron-store for local storage

## Prerequisites
1. Install Node.js (LTS recommended):
   - Windows/macOS: download from `https://nodejs.org`
   - Linux: use your distro’s package manager or NodeSource
2. Verify installation:
```bash
node -v
npm -v
```

## Install Dependencies
```bash
npm install
```

## Run in Development
```bash
npm start
```

## Build a Production App
This project uses `electron-builder`.

- Windows (NSIS installer):
```bash
npm run build
```
- Linux (AppImage):
```bash
npm run build
```

Artifacts are saved to the `dist/` folder. To add platform-specific icons, place them in the `build/` directory and configure optional `icon` fields in `package.json > build` (e.g., `.ico` for Windows, `.png` for Linux).

## Keyboard Shortcuts
- **Ctrl+1..9**: Copy (and if enabled, auto-paste) the nth quick reply.

## Auto-Paste Notes
Auto-paste tries to send Cmd/Ctrl+V to the active app using platform tools:
- Windows: PowerShell WScript SendKeys
- macOS: AppleScript via `osascript` (may require Accessibility permissions)
- Linux: `xdotool` on X11 (Wayland may not support this)

If it doesn’t work, grant permissions or install `xdotool`, or disable the feature in Settings.

## Project Structure
```
.
├─ main.js            # Electron main process
├─ preload.js         # Secure IPC bridge
├─ renderer/
│  ├─ index.html
│  ├─ renderer.js
│  └─ styles.css
├─ build/             # Packager resources (icons, etc.)
├─ package.json
└─ README.md
```

## License
MIT