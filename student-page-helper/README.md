# 🎓 Student Page Helper

A floating desktop application built with Electron.js and React to help you manage your student Instagram/Telegram page with quick replies, resources, and notes.

## ✨ Features

- **Always on Top Window** - Small floating, draggable, resizable window
- **Quick Reply Manager** - Save, edit, and categorize quick replies
- **Keyboard Shortcuts** - Use Ctrl+1, Ctrl+2, etc. to quickly access replies
- **Resource Links** - Quick access to important websites and resources
- **Notes & Ideas** - Save post ideas, captions, and tasks
- **Dark/Light Themes** - Customizable appearance
- **Auto-paste** - Automatically paste replies into text fields
- **Responsive Design** - Works on different screen sizes

## 🚀 Installation

### Prerequisites

- **Node.js** (version 16 or higher)
- **npm** (comes with Node.js)

### Step 1: Install Node.js

1. Download Node.js from [nodejs.org](https://nodejs.org/)
2. Install it on your system
3. Verify installation:
   ```bash
   node --version
   npm --version
   ```

### Step 2: Clone/Download the Project

1. Download the project files to your computer
2. Open terminal/command prompt
3. Navigate to the project folder:
   ```bash
   cd path/to/student-page-helper
   ```

### Step 3: Install Dependencies

```bash
npm install
```

This will install all required packages including Electron.js, React, and electron-store.

## 🏃‍♂️ Running the App

### Development Mode

```bash
npm start
```

This will:
1. Start the React development server
2. Launch the Electron app
3. Open DevTools for debugging

### Production Build

```bash
npm run build
```

This creates an optimized production build in the `build` folder.

## 📦 Building Distributables

### For Windows

```bash
npm run dist:win
```

### For macOS

```bash
npm run dist:mac
```

### For Linux

```bash
npm run dist:linux
```

### For All Platforms

```bash
npm run dist
```

The built applications will be available in the `dist` folder.

## 🎯 Usage Guide

### Quick Replies

1. **Add a Reply**: Click "+ Add Reply" and fill in the text and category
2. **Copy Reply**: Click the "Copy" button to copy text to clipboard
3. **Keyboard Shortcuts**: Use Ctrl+1, Ctrl+2, etc. for the first 9 replies
4. **Categories**: Organize replies by type (General, Scholarships, Exams, etc.)

### Resources

1. **Add Resource**: Click "+ Add Resource" and enter name, URL, and category
2. **Open Link**: Click "Open" to launch in your default browser
3. **Copy URL**: Click "Copy URL" to copy the link to clipboard

### Notes

1. **Add Note**: Click "+ Add Note" to add post ideas, captions, or tasks
2. **Mark Complete**: Use "Mark Done" to track completed items
3. **Copy Content**: Click "Copy" to copy note content to clipboard

### Settings

1. **Theme**: Toggle between Dark and Light modes
2. **Colors**: Choose from 8 accent color options
3. **Font Size**: Adjust text size (Small, Medium, Large)
4. **Auto-paste**: Enable/disable automatic pasting of replies

## ⌨️ Keyboard Shortcuts

- **Ctrl+1** to **Ctrl+9**: Quick access to saved replies
- **Ctrl+Q**: Quit application (standard)
- **Ctrl+M**: Minimize window (standard)

## 🛠️ Development

### Project Structure

```
student-page-helper/
├── public/
│   ├── electron.js          # Main Electron process
│   ├── preload.js           # Preload script for IPC
│   └── index.html           # Main HTML file
├── src/
│   ├── components/          # React components
│   │   ├── QuickReplies.js
│   │   ├── Resources.js
│   │   ├── Notes.js
│   │   ├── Settings.js
│   │   └── TitleBar.js
│   ├── App.js               # Main React component
│   ├── App.css              # Main styles
│   └── index.js             # React entry point
├── package.json             # Dependencies and scripts
└── README.md               # This file
```

### Available Scripts

- `npm start` - Start development mode
- `npm run build` - Build for production
- `npm run dist` - Build distributable packages
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

### Data Storage

The app uses `electron-store` to save all data locally:
- Quick replies
- Resource links
- Notes and ideas
- App settings and preferences

Data is stored in your system's user data directory and persists between app launches.

## 🔧 Troubleshooting

### Common Issues

1. **App won't start**
   - Ensure Node.js version 16+ is installed
   - Delete `node_modules` folder and run `npm install` again
   - Check console for error messages

2. **Keyboard shortcuts not working**
   - Ensure the app has focus
   - Check if shortcuts conflict with other applications
   - Verify replies are saved (first 9 replies get shortcuts)

3. **Window not draggable**
   - Click and drag from the title bar area
   - Ensure the app is not minimized

4. **Build errors**
   - Clear build cache: `npm run build -- --reset-cache`
   - Update dependencies: `npm update`

### Getting Help

If you encounter issues:
1. Check the console for error messages
2. Ensure all dependencies are properly installed
3. Try running in development mode for more detailed logs

## 🚀 Future Features

- Notification system
- AI-powered reply suggestions
- Cloud sync for data
- Multiple language support
- Custom themes and layouts
- Export/import functionality

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Feel free to submit issues, feature requests, or pull requests.

---

**Student Page Helper** - Making student social media management easier! 🎓✨