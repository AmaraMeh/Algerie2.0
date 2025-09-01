## Student Page Helper

Floating, always-on-top desktop helper to manage quick replies, links, and notes for Instagram/Telegram/WhatsApp web workflows.

### Features
- Always-on-top frameless window, draggable/resizable
- Quick Replies with categories; one-click copy and optional auto-paste
- Saved Links section (opens in default browser)
- Notes area for captions/ideas/tasks
- Settings: theme, accent color, always-on-top, auto-paste
- Global shortcuts: Ctrl+Alt+1..9 to copy/paste replies 1..9

### Prerequisites
1. Install Node.js (v18+ recommended) and npm
   - Linux: use your distro's package manager or `https://nodejs.org`
2. Linux (optional for auto-paste): install `xdotool` for keystroke simulation
   - Debian/Ubuntu: `sudo apt-get install xdotool`

### Install
```bash
npm install
```

### Run (Development)
```bash
npm start
```

### Build (Production)
- Windows:
```bash
npm run dist:win
```
- Linux:
```bash
npm run dist:linux
```

This uses `electron-builder` and will generate artifacts in `dist/`.

### Notes
- Global shortcuts are `Ctrl+Alt+1..9`. You can rearrange or edit replies to change which one is in slot 1..9.
- Auto-paste relies on OS-specific methods:
  - Linux: `xdotool` (recommended)
  - macOS: AppleScript `osascript`
  - Windows: PowerShell `WScript.Shell` SendKeys
- Data is stored locally using `electron-store` in your user data directory.

