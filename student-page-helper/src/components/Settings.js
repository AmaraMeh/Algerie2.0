import React, { useState } from 'react';
import './Settings.css';

const Settings = ({ settings, onSave, theme }) => {
  const [localSettings, setLocalSettings] = useState({
    theme: settings.theme || 'dark',
    accentColor: settings.accentColor || '#007AFF',
    fontSize: settings.fontSize || 'medium',
    autoPaste: settings.autoPaste !== false,
    notifications: settings.notifications !== false,
    ...settings
  });

  const handleSettingChange = (key, value) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    onSave(newSettings);
  };

  const handleResetSettings = () => {
    const defaultSettings = {
      theme: 'dark',
      accentColor: '#007AFF',
      fontSize: 'medium',
      autoPaste: true,
      notifications: true
    };
    setLocalSettings(defaultSettings);
    onSave(defaultSettings);
  };

  const fontSizeOptions = [
    { value: 'small', label: 'Small' },
    { value: 'medium', label: 'Medium' },
    { value: 'large', label: 'Large' }
  ];

  const accentColors = [
    '#007AFF', '#34C759', '#FF9500', '#FF3B30', 
    '#AF52DE', '#FF2D92', '#5856D6', '#FF6B22'
  ];

  return (
    <div className="settings">
      <div className="section-header">
        <h3>Settings & Customization</h3>
      </div>

      <div className="settings-section">
        <h4>Appearance</h4>
        
        <div className="setting-item">
          <label>Theme</label>
          <div className="theme-toggle">
            <button
              className={`theme-btn ${localSettings.theme === 'light' ? 'active' : ''}`}
              onClick={() => handleSettingChange('theme', 'light')}
            >
              ☀️ Light
            </button>
            <button
              className={`theme-btn ${localSettings.theme === 'dark' ? 'active' : ''}`}
              onClick={() => handleSettingChange('theme', 'dark')}
            >
              🌙 Dark
            </button>
          </div>
        </div>

        <div className="setting-item">
          <label>Accent Color</label>
          <div className="color-picker">
            {accentColors.map((color) => (
              <button
                key={color}
                className={`color-option ${localSettings.accentColor === color ? 'active' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => handleSettingChange('accentColor', color)}
                title={color}
              />
            ))}
          </div>
        </div>

        <div className="setting-item">
          <label>Font Size</label>
          <select
            value={localSettings.fontSize}
            onChange={(e) => handleSettingChange('fontSize', e.target.value)}
            className="setting-select"
          >
            {fontSizeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="settings-section">
        <h4>Functionality</h4>
        
        <div className="setting-item">
          <label>Auto-paste Replies</label>
          <div className="toggle-switch">
            <input
              type="checkbox"
              id="autoPaste"
              checked={localSettings.autoPaste}
              onChange={(e) => handleSettingChange('autoPaste', e.target.checked)}
            />
            <label htmlFor="autoPaste" className="toggle-label">
              <span className="toggle-slider"></span>
            </label>
          </div>
          <span className="setting-description">
            Automatically paste replies when using keyboard shortcuts
          </span>
        </div>

        <div className="setting-item">
          <label>Notifications</label>
          <div className="toggle-switch">
            <input
              type="checkbox"
              id="notifications"
              checked={localSettings.notifications}
              onChange={(e) => handleSettingChange('notifications', e.target.checked)}
            />
            <label htmlFor="notifications" className="toggle-label">
              <span className="toggle-slider"></span>
            </label>
          </div>
          <span className="setting-description">
            Show notifications for app events
          </span>
        </div>
      </div>

      <div className="settings-section">
        <h4>Keyboard Shortcuts</h4>
        <div className="shortcuts-info">
          <p>Use these keyboard shortcuts to quickly access your replies:</p>
          <div className="shortcuts-grid">
            <div className="shortcut-item">
              <kbd>Ctrl + 1</kbd>
              <span>First reply</span>
            </div>
            <div className="shortcut-item">
              <kbd>Ctrl + 2</kbd>
              <span>Second reply</span>
            </div>
            <div className="shortcut-item">
              <kbd>Ctrl + 3</kbd>
              <span>Third reply</span>
            </div>
            <div className="shortcut-item">
              <kbd>...</kbd>
              <span>Up to 9 replies</span>
            </div>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h4>Data Management</h4>
        <div className="setting-item">
          <button 
            onClick={handleResetSettings}
            className="reset-button"
          >
            Reset to Defaults
          </button>
          <span className="setting-description">
            Reset all settings to their default values
          </span>
        </div>
      </div>

      <div className="settings-section">
        <h4>About</h4>
        <div className="about-info">
          <p><strong>Student Page Helper</strong></p>
          <p>Version 1.0.0</p>
          <p>A floating desktop app to help manage your student social media presence</p>
        </div>
      </div>
    </div>
  );
};

export default Settings;