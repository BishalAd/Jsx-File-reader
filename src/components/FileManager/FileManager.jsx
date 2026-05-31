import React, { useState } from 'react';
import { Search, Play, Trash2, Calendar, FileCode, Plus, Grid, List, Tag, Eye, ArrowUpDown } from 'lucide-react';
import './FileManager.css';

export default function FileManager({ files, onSelectFile, onRunFile, onDeleteFile, onAddNewClick }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [sortBy, setSortBy] = useState('updatedAt'); // 'updatedAt' | 'createdAt' | 'name'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  // Extract all unique tags
  const allTags = Array.from(
    new Set(files.flatMap((file) => file.tags || []))
  );

  // Filter and sort files
  const filteredFiles = files
    .filter((file) => {
      const matchesSearch = 
        file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.content.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesTag = selectedTag ? file.tags.includes(selectedTag) : true;
      
      return matchesSearch && matchesTag;
    })
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      return new Date(b[sortBy]) - new Date(a[sortBy]);
    });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleDelete = (e, id, name) => {
    e.stopPropagation(); // Stop card click trigger
    if (window.confirm(`Are you sure you want to delete "${name}"? This action is stored locally and cannot be undone.`)) {
      onDeleteFile(id);
    }
  };

  return (
    <div className="file-manager-wrapper">
      {/* Search and Filters Toolbar */}
      <div className="toolbar-section">
        <div className="search-bar-container">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            className="search-input"
            placeholder="Search JSX files by name or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filters-group">
          {/* Tag Filter */}
          <div className="filter-select-wrapper">
            <Tag size={14} className="filter-icon" />
            <select
              className="filter-select"
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
            >
              <option value="">All Tags</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Filter */}
          <div className="filter-select-wrapper">
            <ArrowUpDown size={14} className="filter-icon" />
            <select
              className="filter-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="updatedAt">Recently Updated</option>
              <option value="createdAt">Date Created</option>
              <option value="name">Alphabetical</option>
            </select>
          </div>

          {/* View Toggle */}
          <div className="view-toggle-btns">
            <button
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              <Grid size={16} />
            </button>
            <button
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              <List size={16} />
            </button>
          </div>

          {/* Floating / Desktop Add Button */}
          <button className="add-file-btn" onClick={onAddNewClick}>
            <Plus size={16} />
            <span>Add File</span>
          </button>
        </div>
      </div>

      {/* Files Grid / List */}
      {filteredFiles.length === 0 ? (
        <div className="empty-files-container">
          <FileCode className="empty-files-icon" size={60} />
          <h3>No JSX files found</h3>
          <p>
            {files.length === 0
              ? "Get started by importing a JSX file from your device or writing one from scratch."
              : "Try adjusting your search criteria or tag filters."}
          </p>
          <button className="btn-primary" onClick={onAddNewClick}>
            <Plus size={16} />
            <span>Add your first file</span>
          </button>
        </div>
      ) : (
        <div className={`files-container ${viewMode}-view`}>
          {filteredFiles.map((file) => (
            <div
              key={file.id}
              className="file-card"
              onClick={() => onRunFile(file)}
            >
              <div className="file-card-header">
                <FileCode className="file-card-type-icon" size={24} />
                <div className="file-card-title-meta">
                  <h3 className="file-card-name" title={file.name}>
                    {file.name}
                  </h3>
                  <span className="file-card-date">
                    <Calendar size={12} />
                    {formatDate(file.updatedAt)}
                  </span>
                </div>
              </div>

              {/* Tags list */}
              {file.tags && file.tags.length > 0 && (
                <div className="file-card-tags">
                  {file.tags.map((tag) => (
                    <span 
                      key={tag} 
                      className={`tag-badge ${selectedTag === tag ? 'active-filter' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTag(tag === selectedTag ? '' : tag);
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Hover actions / Footer actions */}
              <div className="file-card-actions">
                <button
                  className="file-action-btn view-action"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectFile(file);
                  }}
                  title="View Source Code"
                >
                  <Eye size={14} />
                  <span>Inspect</span>
                </button>
                
                <div className="card-right-actions">
                  <button
                    className="file-action-btn delete-action"
                    onClick={(e) => handleDelete(e, file.id, file.name)}
                    title="Delete File"
                  >
                    <Trash2 size={14} />
                  </button>
                  <button
                    className="file-action-btn run-action"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRunFile(file);
                    }}
                    title="Run interactive JSX"
                  >
                    <Play size={14} fill="currentColor" />
                    <span>Run</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
