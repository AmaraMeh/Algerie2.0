import React, { useState, useEffect } from 'react';
import './App.css';
import QuickReplies from './components/QuickReplies';
import Resources from './components/Resources';
import Notes from './components/Notes';
import Settings from './components/Settings';
import TitleBar from './components/TitleBar';

function App() {
  const [activeTab, setActiveTab] = useState('replies');
  const [theme, setTheme] = useState('dark');
  const [replies, setReplies] = useState([]);
  const [resources, setResources] = useState([]);
  const [notes, setNotes] = useState([]);
  const [settings, setSettings] = useState({});

  useEffect(() => {
    loadData();
    setupAutoPasteListener();
  }, []);

  const loadData = async () => {
    try {
      const savedReplies = await window.electronAPI.getStoreValue('replies');
      const savedResources = await window.electronAPI.getStoreValue('resources');
      const savedNotes = await window.electronAPI.getStoreValue('notes');
      const savedSettings = await window.electronAPI.getStoreValue('settings');

      if (savedReplies) setReplies(savedReplies);
      if (savedResources) setResources(savedResources);
      if (savedNotes) setNotes(savedNotes);
      if (savedSettings) {
        setSettings(savedSettings);
        setTheme(savedSettings.theme || 'dark');
      }

      // Set default resources if none exist
      if (!savedResources || savedResources.length === 0) {
        const defaultResources = [
          { name: 'E-Minha', url: 'https://e-minha.ufmg.br/', category: 'Academic' },
          { name: 'Telegram', url: 'https://web.telegram.org/', category: 'Communication' },
          { name: 'Google Drive', url: 'https://drive.google.com/', category: 'Storage' },
          { name: 'E-Campus', url: 'https://ecampus.ufmg.br/', category: 'Academic' }
        ];
        setResources(defaultResources);
        await window.electronAPI.setStoreValue('resources', defaultResources);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const setupAutoPasteListener = () => {
    if (window.electronAPI && window.electronAPI.onAutoPaste) {
      window.electronAPI.onAutoPaste((event, text) => {
        // This will be handled by the QuickReplies component
        console.log('Auto-paste triggered:', text);
      });
    }
  };

  const saveReplies = async (newReplies) => {
    setReplies(newReplies);
    await window.electronAPI.setStoreValue('replies', newReplies);
  };

  const saveResources = async (newResources) => {
    setResources(newResources);
    await window.electronAPI.setStoreValue('resources', newResources);
  };

  const saveNotes = async (newNotes) => {
    setNotes(newNotes);
    await window.electronAPI.setStoreValue('notes', newNotes);
  };

  const saveSettings = async (newSettings) => {
    setSettings(newSettings);
    setTheme(newSettings.theme || 'dark');
    await window.electronAPI.setStoreValue('settings', newSettings);
  };

  const tabs = [
    { id: 'replies', label: 'Quick Replies', icon: '💬' },
    { id: 'resources', label: 'Resources', icon: '🔗' },
    { id: 'notes', label: 'Notes', icon: '📝' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ];

  return (
    <div className={`app ${theme}`}>
      <TitleBar />
      
      <div className="tab-navigation">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="content-area">
        {activeTab === 'replies' && (
          <QuickReplies 
            replies={replies} 
            onSave={saveReplies}
            theme={theme}
          />
        )}
        {activeTab === 'resources' && (
          <Resources 
            resources={resources} 
            onSave={saveResources}
            theme={theme}
          />
        )}
        {activeTab === 'notes' && (
          <Notes 
            notes={notes} 
            onSave={saveNotes}
            theme={theme}
          />
        )}
        {activeTab === 'settings' && (
          <Settings 
            settings={settings} 
            onSave={saveSettings}
            theme={theme}
          />
        )}
      </div>
    </div>
  );
}

export default App;