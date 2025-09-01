import React, { useState } from 'react';
import './Notes.css';

const Notes = ({ notes, onSave, theme }) => {
  const [editingId, setEditingId] = useState(null);
  const [newNote, setNewNote] = useState({ title: '', content: '', category: 'General' });
  const [showAddForm, setShowAddForm] = useState(false);

  const categories = ['General', 'Post Ideas', 'Captions', 'Tasks', 'Memes', 'Reminders'];

  const handleAddNote = () => {
    if (newNote.title.trim() && newNote.content.trim()) {
      const note = {
        id: Date.now(),
        title: newNote.title.trim(),
        content: newNote.content.trim(),
        category: newNote.category,
        createdAt: new Date().toISOString(),
        completed: false
      };
      onSave([...notes, note]);
      setNewNote({ title: '', content: '', category: 'General' });
      setShowAddForm(false);
    }
  };

  const handleEditNote = (id, updatedTitle, updatedContent, updatedCategory) => {
    const updatedNotes = notes.map(note => 
      note.id === id 
        ? { ...note, title: updatedTitle, content: updatedContent, category: updatedCategory }
        : note
    );
    onSave(updatedNotes);
    setEditingId(null);
  };

  const handleDeleteNote = (id) => {
    const updatedNotes = notes.filter(note => note.id !== id);
    onSave(updatedNotes);
  };

  const handleToggleComplete = (id) => {
    const updatedNotes = notes.map(note => 
      note.id === id 
        ? { ...note, completed: !note.completed }
        : note
    );
    onSave(updatedNotes);
  };

  const handleCopyNote = async (content, event) => {
    try {
      await window.electronAPI.copyToClipboard(content);
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
      console.error('Error copying note:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div className="notes">
      <div className="section-header">
        <h3>Notes & Ideas</h3>
        <button 
          className="add-button"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Cancel' : '+ Add Note'}
        </button>
      </div>

      {showAddForm && (
        <div className="add-form">
          <input
            type="text"
            value={newNote.title}
            onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
            placeholder="Note title..."
            className="note-input"
          />
          <textarea
            value={newNote.content}
            onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
            placeholder="Note content..."
            className="note-textarea"
          />
          <select
            value={newNote.category}
            onChange={(e) => setNewNote({ ...newNote, category: e.target.value })}
            className="category-select"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <button onClick={handleAddNote} className="save-button">
            Save Note
          </button>
        </div>
      )}

      <div className="notes-list">
        {notes.map((note) => (
          <div key={note.id} className={`note-item ${note.completed ? 'completed' : ''}`}>
            {editingId === note.id ? (
              <div className="edit-form">
                <input
                  type="text"
                  value={note.title}
                  onChange={(e) => handleEditNote(note.id, e.target.value, note.content, note.category)}
                  className="note-input"
                />
                <textarea
                  value={note.content}
                  onChange={(e) => handleEditNote(note.id, note.title, e.target.value, note.category)}
                  className="note-textarea"
                />
                <select
                  value={note.category}
                  onChange={(e) => handleEditNote(note.id, note.title, note.content, e.target.value)}
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
                <div className="note-header">
                  <span className="note-category">{note.category}</span>
                  <span className="note-date">{formatDate(note.createdAt)}</span>
                </div>
                <h4 className="note-title">{note.title}</h4>
                <div className="note-content">{note.content}</div>
                <div className="note-actions">
                  <button 
                    onClick={() => handleToggleComplete(note.id)}
                    className={`complete-button ${note.completed ? 'completed' : ''}`}
                  >
                    {note.completed ? '✓ Done' : 'Mark Done'}
                  </button>
                  <button 
                    onClick={(e) => handleCopyNote(note.content, e)}
                    className="copy-button"
                  >
                    Copy
                  </button>
                  <button 
                    onClick={() => setEditingId(note.id)}
                    className="edit-button"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDeleteNote(note.id)}
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

      {notes.length === 0 && (
        <div className="empty-state">
          <p>No notes yet. Add your first one above!</p>
        </div>
      )}
    </div>
  );
};

export default Notes;