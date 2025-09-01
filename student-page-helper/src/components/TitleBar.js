import React from 'react';
import './TitleBar.css';

const TitleBar = () => {
  const handleMinimize = () => {
    window.electronAPI.minimizeWindow();
  };

  const handleClose = () => {
    window.electronAPI.closeWindow();
  };

  return (
    <div className="title-bar">
      <div className="title-bar-content">
        <div className="app-title">
          <span className="app-icon">🎓</span>
          <span className="app-name">Student Page Helper</span>
        </div>
        <div className="window-controls">
          <button className="control-button minimize" onClick={handleMinimize}>
            <span>─</span>
          </button>
          <button className="control-button close" onClick={handleClose}>
            <span>×</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TitleBar;