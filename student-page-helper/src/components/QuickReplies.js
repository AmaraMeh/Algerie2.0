import React, { useState } from 'react';
import './QuickReplies.css';

const QuickReplies = ({ replies, onSave, theme }) => {
  const [editingId, setEditingId] = useState(null);
  const [newReply, setNewReply] = useState({ text: '', category: 'General' });
  const [showAddForm, setShowAddForm] = useState(false);

  const categories = ['General', 'Scholarships', 'Exams', 'Memes', 'Academic', 'Social'];

  const handleAddReply = () => {
    if (newReply.text.trim()) {
      const reply = {
        id: Date.now(),
        text: newReply.text.trim(),
        category: newReply.category,
        shortcut: replies.length < 9 ? `Ctrl+${replies.length + 1}` : null
      };
      onSave([...replies, reply]);
      setNewReply({ text: '', category: 'General' });
      setShowAddForm(false);
    }
  };

  const handleEditReply = (id, updatedText, updatedCategory) => {
    const updatedReplies = replies.map(reply => 
      reply.id === id 
        ? { ...reply, text: updatedText, category: updatedCategory }
        : reply
    );
    onSave(updatedReplies);
    setEditingId(null);
  };

  const handleDeleteReply = (id) => {
    const updatedReplies = replies.filter(reply => reply.id !== id);
    // Reassign shortcuts
    const repliesWithShortcuts = updatedReplies.map((reply, index) => ({
      ...reply,
      shortcut: index < 9 ? `Ctrl+${index + 1}` : null
    }));
    onSave(repliesWithShortcuts);
  };

  const handleCopyReply = async (text, event) => {
    try {
      await window.electronAPI.copyToClipboard(text);
      // Show feedback
      const button = event.target;
      const originalText = button.textContent;
      button.textContent = 'Copied!';
      button.style.backgroundColor = '#4CAF50';
      setTimeout(() => {
        button.textContent = originalText;
        button.style.backgroundColor = '';
      }, 1000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const filteredReplies = replies.filter(reply => 
    reply.category === 'All' || reply.category
  );

  return (
    <div className="quick-replies">
      <div className="section-header">
        <h3>Quick Replies</h3>
        <button 
          className="add-button"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Cancel' : '+ Add Reply'}
        </button>
      </div>

      {showAddForm && (
        <div className="add-form">
          <select
            value={newReply.category}
            onChange={(e) => setNewReply({ ...newReply, category: e.target.value })}
            className="category-select"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <textarea
            value={newReply.text}
            onChange={(e) => setNewReply({ ...newReply, text: e.target.value })}
            placeholder="Enter your quick reply..."
            className="reply-textarea"
          />
          <button onClick={handleAddReply} className="save-button">
            Save Reply
          </button>
        </div>
      )}

      <div className="category-filter">
        <button 
          className={`filter-btn ${!filteredReplies.length ? 'active' : ''}`}
          onClick={() => onSave(replies)}
        >
          All
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            className={`filter-btn ${filteredReplies.some(r => r.category === cat) ? 'active' : ''}`}
            onClick={() => onSave(replies.filter(r => r.category === cat))}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="replies-list">
        {replies.map((reply, index) => (
          <div key={reply.id} className="reply-item">
            {editingId === reply.id ? (
              <div className="edit-form">
                <select
                  value={reply.category}
                  onChange={(e) => handleEditReply(reply.id, reply.text, e.target.value)}
                  className="category-select"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <textarea
                  value={reply.text}
                  onChange={(e) => handleEditReply(reply.id, e.target.value, reply.category)}
                  className="reply-textarea"
                />
                <div className="edit-actions">
                  <button onClick={() => setEditingId(null)} className="cancel-button">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="reply-header">
                  <span className="reply-category">{reply.category}</span>
                  {reply.shortcut && (
                    <span className="shortcut-badge">{reply.shortcut}</span>
                  )}
                </div>
                <div className="reply-text">{reply.text}</div>
                <div className="reply-actions">
                  <button 
                    onClick={(e) => handleCopyReply(reply.text, e)}
                    className="copy-button"
                  >
                    Copy
                  </button>
                  <button 
                    onClick={() => setEditingId(reply.id)}
                    className="edit-button"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDeleteReply(reply.id)}
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

      {replies.length === 0 && (
        <div className="empty-state">
          <p>No quick replies yet. Add your first one above!</p>
        </div>
      )}
    </div>
  );
};

export default QuickReplies;