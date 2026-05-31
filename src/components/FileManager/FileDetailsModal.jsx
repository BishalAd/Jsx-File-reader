import React, { useState, useEffect } from 'react';
import { X, Play, Copy, Calendar, Tag, Check, Edit2, Save, Download } from 'lucide-react';
import './FileDetailsModal.css';

export default function FileDetailsModal({ isOpen, file, onClose, onRun, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [tags, setTags] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (file) {
      setName(file.name);
      setTags(file.tags.join(', '));
      setIsEditing(false);
      setCopied(false);
    }
  }, [file]);

  if (!isOpen || !file) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(file.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([file.content], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSaveMetadata = () => {
    if (!name.trim()) return;

    let finalName = name.trim();
    if (!finalName.endsWith('.jsx') && !finalName.endsWith('.js')) {
      finalName += '.jsx';
    }

    const tagArray = tags
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    onUpdate({
      ...file,
      name: finalName,
      tags: tagArray
    });
    setIsEditing(false);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container details-modal-container">
        {/* Modal Header */}
        <div className="modal-header">
          <div className="details-title-container">
            {isEditing ? (
              <input
                type="text"
                className="details-edit-name-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="File name"
              />
            ) : (
              <h2 className="details-filename">{file.name}</h2>
            )}
            
            <div className="details-header-meta">
              <Calendar size={12} />
              <span>Updated: {formatDate(file.updatedAt)}</span>
            </div>
          </div>
          
          <div className="details-header-actions">
            {isEditing ? (
              <button className="details-icon-btn save-btn" onClick={handleSaveMetadata} title="Save changes">
                <Save size={16} />
                <span>Save</span>
              </button>
            ) : (
              <button className="details-icon-btn edit-btn" onClick={() => setIsEditing(true)} title="Edit details">
                <Edit2 size={16} />
                <span>Edit</span>
              </button>
            )}
            <button className="modal-close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="details-modal-body">
          {/* Tags */}
          <div className="details-tags-section">
            <div className="details-section-label">
              <Tag size={14} />
              <span>Tags</span>
            </div>
            
            {isEditing ? (
              <input
                type="text"
                className="details-edit-tags-input"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="comma-separated tags"
              />
            ) : (
              <div className="details-tags-list">
                {file.tags.length === 0 ? (
                  <span className="no-tags-placeholder">No tags assigned</span>
                ) : (
                  file.tags.map((tag, idx) => (
                    <span key={idx} className="details-tag-badge">{tag}</span>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Code Viewer Panel */}
          <div className="code-viewer-container">
            <div className="code-viewer-header">
              <span className="code-viewer-title">JSX Source Code</span>
              <div className="code-viewer-actions">
                <button className="code-viewer-btn" onClick={handleCopyCode}>
                  {copied ? <Check size={14} className="copied-icon" /> : <Copy size={14} />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
                <button className="code-viewer-btn" onClick={handleDownload} title="Download file to device">
                  <Download size={14} />
                  <span>Download</span>
                </button>
              </div>
            </div>
            <div className="code-viewer-body">
              <pre className="code-viewer-pre">
                <code>
                  {file.content.split('\n').map((line, idx) => (
                    <div key={idx} className="code-line">
                      <span className="code-line-number">{idx + 1}</span>
                      <span className="code-line-text">{line || ' '}</span>
                    </div>
                  ))}
                </code>
              </pre>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer details-modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Back
          </button>
          <button 
            className="btn-primary run-action-btn" 
            onClick={() => {
              onRun(file);
            }}
          >
            <Play size={16} fill="currentColor" />
            <span>Run Component</span>
          </button>
        </div>
      </div>
    </div>
  );
}
