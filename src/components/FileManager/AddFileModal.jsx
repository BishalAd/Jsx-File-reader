import React, { useState, useRef } from 'react';
import { X, Upload, Code, FileText, Plus, AlertCircle } from 'lucide-react';
import './AddFileModal.css';

export default function AddFileModal({ isOpen, onClose, onSave }) {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'paste'
  const [name, setName] = useState('');
  const [tags, setTags] = useState('');
  const [content, setContent] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [error, setError] = useState('');
  
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Read file contents
  const processFile = (file) => {
    if (!file) return;

    // Validate extension
    const extension = file.name.split('.').pop().toLowerCase();
    if (extension !== 'jsx' && extension !== 'js') {
      setError('Please select a valid JSX or JS file (.jsx, .js)');
      return;
    }

    setError('');
    setSelectedFileName(file.name);
    
    // Auto-populate name if empty
    if (!name) {
      setName(file.name);
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setContent(e.target.result);
    };
    reader.onerror = () => {
      setError('Failed to read the file.');
    };
    reader.readAsText(file);
  };

  // Handle drop
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // Handle file select via click
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current.click();
  };

  // Handle submit
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Please enter a file name.');
      return;
    }

    if (!content.trim()) {
      setError('Please add or upload some JSX code.');
      return;
    }

    // Ensure name ends with .jsx
    let finalName = name.trim();
    if (!finalName.endsWith('.jsx') && !finalName.endsWith('.js')) {
      finalName += '.jsx';
    }

    // Split tags by comma
    const tagArray = tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    onSave({
      name: finalName,
      content,
      tags: tagArray
    });

    // Reset and close
    setName('');
    setTags('');
    setContent('');
    setSelectedFileName('');
    setError('');
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <Plus size={20} className="modal-title-icon" />
            <h2>Add JSX File</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="modal-form">
          {/* Method Selector Tabs */}
          <div className="modal-tabs">
            <button
              type="button"
              className={`modal-tab ${activeTab === 'upload' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('upload');
                setError('');
              }}
            >
              <Upload size={16} />
              <span>Import File</span>
            </button>
            <button
              type="button"
              className={`modal-tab ${activeTab === 'paste' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('paste');
                setError('');
              }}
            >
              <Code size={16} />
              <span>Paste JSX Code</span>
            </button>
          </div>

          {/* Form Content */}
          <div className="modal-body">
            {error && (
              <div className="modal-error-banner">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Tab 1: Upload / Drag & Drop */}
            {activeTab === 'upload' && (
              <div className="upload-section">
                <div
                  className={`dropzone ${dragActive ? 'active' : ''} ${selectedFileName ? 'has-file' : ''}`}
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={triggerFileSelect}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jsx,.js"
                    onChange={handleFileChange}
                    className="hidden-file-input"
                  />
                  
                  {selectedFileName ? (
                    <div className="file-selected-info">
                      <FileText className="file-icon animate-bounce" size={40} />
                      <p className="file-name-label">{selectedFileName}</p>
                      <button 
                        type="button" 
                        className="change-file-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFileName('');
                          setContent('');
                        }}
                      >
                        Choose another file
                      </button>
                    </div>
                  ) : (
                    <div className="dropzone-prompt">
                      <Upload className="upload-icon" size={40} />
                      <p className="primary-prompt">Drag & drop your JSX file here</p>
                      <p className="secondary-prompt">or click to browse your device</p>
                      <span className="file-limits">Supports .jsx or .js files</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab 2: Paste JSX Code */}
            {activeTab === 'paste' && (
              <div className="paste-section">
                <label className="input-label">JSX Code Content</label>
                <textarea
                  className="code-textarea"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={`// Paste your React JSX component code here\nfunction MyComponent() {\n  return <div>Hello World</div>;\n}\nrender(<MyComponent />);`}
                  spellCheck="false"
                />
              </div>
            )}

            {/* Common Details Fields */}
            <div className="form-fields">
              <div className="form-group">
                <label className="input-label">Display Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. CounterComponent.jsx"
                  required
                />
              </div>

              <div className="form-group">
                <label className="input-label">Tags (comma-separated)</label>
                <input
                  type="text"
                  className="form-input"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="e.g. dynamic, utility, charts"
                />
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save File
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
