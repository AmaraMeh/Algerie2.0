import React, { useState } from 'react';
import './Resources.css';

const Resources = ({ resources, onSave, theme }) => {
  const [editingId, setEditingId] = useState(null);
  const [newResource, setNewResource] = useState({ name: '', url: '', category: 'Academic' });
  const [showAddForm, setShowAddForm] = useState(false);

  const categories = ['Academic', 'Communication', 'Storage', 'Social', 'Other'];

  const handleAddResource = () => {
    if (newResource.name.trim() && newResource.url.trim()) {
      const resource = {
        id: Date.now(),
        name: newResource.name.trim(),
        url: newResource.url.trim(),
        category: newResource.category
      };
      onSave([...resources, resource]);
      setNewResource({ name: '', url: '', category: 'Academic' });
      setShowAddForm(false);
    }
  };

  const handleEditResource = (id, updatedName, updatedUrl, updatedCategory) => {
    const updatedResources = resources.map(resource => 
      resource.id === id 
        ? { ...resource, name: updatedName, url: updatedUrl, category: updatedCategory }
        : resource
    );
    onSave(updatedResources);
    setEditingId(null);
  };

  const handleDeleteResource = (id) => {
    const updatedResources = resources.filter(resource => resource.id !== id);
    onSave(updatedResources);
  };

  const handleOpenResource = async (url) => {
    try {
      await window.electronAPI.openExternal(url);
    } catch (error) {
      console.error('Error opening external link:', error);
    }
  };

  const handleCopyUrl = async (url, event) => {
    try {
      await window.electronAPI.copyToClipboard(url);
      // Show feedback
      const button = event.target;
      const originalText = button.textContent;
      button.textContent = 'Copied!';
      setTimeout(() => {
        button.textContent = originalText;
      }, 1000);
    } catch (error) {
      console.error('Error copying URL:', error);
    }
  };

  return (
    <div className="resources">
      <div className="section-header">
        <h3>Quick Resources</h3>
        <button 
          className="add-button"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Cancel' : '+ Add Resource'}
        </button>
      </div>

      {showAddForm && (
        <div className="add-form">
          <input
            type="text"
            value={newResource.name}
            onChange={(e) => setNewResource({ ...newResource, name: e.target.value })}
            placeholder="Resource name..."
            className="resource-input"
          />
          <input
            type="url"
            value={newResource.url}
            onChange={(e) => setNewResource({ ...newResource, url: e.target.value })}
            placeholder="https://..."
            className="resource-input"
          />
          <select
            value={newResource.category}
            onChange={(e) => setNewResource({ ...newResource, category: e.target.value })}
            className="category-select"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <button onClick={handleAddResource} className="save-button">
            Save Resource
          </button>
        </div>
      )}

      <div className="resources-grid">
        {resources.map((resource) => (
          <div key={resource.id} className="resource-card">
            {editingId === resource.id ? (
              <div className="edit-form">
                <input
                  type="text"
                  value={resource.name}
                  onChange={(e) => handleEditResource(resource.id, e.target.value, resource.url, resource.category)}
                  className="resource-input"
                />
                <input
                  type="url"
                  value={resource.url}
                  onChange={(e) => handleEditResource(resource.id, resource.name, e.target.value, resource.category)}
                  className="resource-input"
                />
                <select
                  value={resource.category}
                  onChange={(e) => handleEditResource(resource.id, resource.name, resource.url, e.target.value)}
                  className="category-select"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <div className="edit-actions">
                  <button onClick={() => setEditingId(null)} className="cancel-button">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="resource-header">
                  <span className="resource-category">{resource.category}</span>
                </div>
                <h4 className="resource-name">{resource.name}</h4>
                <div className="resource-url">{resource.url}</div>
                <div className="resource-actions">
                  <button 
                    onClick={() => handleOpenResource(resource.url)}
                    className="open-button"
                  >
                    Open
                  </button>
                  <button 
                    onClick={(e) => handleCopyUrl(resource.url, e)}
                    className="copy-button"
                  >
                    Copy URL
                  </button>
                  <button 
                    onClick={() => setEditingId(resource.id)}
                    className="edit-button"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDeleteResource(resource.id)}
                    className="delete-button"
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {resources.length === 0 && (
        <div className="empty-state">
          <p>No resources yet. Add your first one above!</p>
        </div>
      )}
    </div>
  );
};

export default Resources;