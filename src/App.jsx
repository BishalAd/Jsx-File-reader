import React, { useState, useEffect } from 'react';
import Header from './components/UI/Header';
import FileManager from './components/FileManager/FileManager';
import AddFileModal from './components/FileManager/AddFileModal';
import FileDetailsModal from './components/FileManager/FileDetailsModal';
import JsxRunner from './components/Runner/JsxRunner';
import { getFiles, saveFile, deleteFile, seedInitialFiles } from './utils/storage';
import { FileCode, AlertCircle, Sparkles } from 'lucide-react';
import './App.css';

export default function App() {
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [runningFile, setRunningFile] = useState(null);

  // Toast notifications state
  const [toast, setToast] = useState(null);

  // Load files on mount
  useEffect(() => {
    async function loadInitialData() {
      try {
        setIsLoading(true);
        // Seed default sandbox items if database is empty
        await seedInitialFiles();
        const data = await getFiles();
        setFiles(data);
      } catch (err) {
        showToast('error', 'Failed to load local storage.');
      } finally {
        setIsLoading(false);
      }
    }
    loadInitialData();
  }, []);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddFile = async (newFileData) => {
    try {
      const saved = await saveFile(newFileData);
      setFiles((prev) => [saved, ...prev]);
      showToast('success', `"${saved.name}" added successfully.`);
    } catch (err) {
      showToast('error', 'Failed to save JSX file.');
    }
  };

  const handleUpdateFile = async (updatedFileData) => {
    try {
      const saved = await saveFile(updatedFileData);
      setFiles((prev) =>
        prev.map((f) => (f.id === saved.id ? saved : f))
      );
      // Update selected file view state if open
      if (selectedFile && selectedFile.id === saved.id) {
        setSelectedFile(saved);
      }
      showToast('success', `"${saved.name}" updated successfully.`);
    } catch (err) {
      showToast('error', 'Failed to update file.');
    }
  };

  const handleDeleteFile = async (id) => {
    try {
      const fileToDelete = files.find((f) => f.id === id);
      const name = fileToDelete ? fileToDelete.name : 'File';
      const success = await deleteFile(id);
      
      if (success) {
        setFiles((prev) => prev.filter((f) => f.id !== id));
        if (selectedFile && selectedFile.id === id) {
          setSelectedFile(null);
        }
        showToast('success', `"${name}" was deleted.`);
      } else {
        showToast('error', 'Failed to delete file.');
      }
    } catch (err) {
      showToast('error', 'An error occurred during deletion.');
    }
  };

  return (
    <div className="app-layout">
      {/* Premium Toast Alerts */}
      {toast && (
        <div className={`toast-notification toast-${toast.type}`}>
          {toast.type === 'error' ? <AlertCircle size={16} /> : <Sparkles size={16} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* App Header */}
      <Header />

      {/* Main Content Area */}
      <main className="app-main-content">
        <div className="container">
          {isLoading ? (
            <div className="app-loading-screen">
              <div className="spinner" />
              <p>Initializing sandbox storage...</p>
            </div>
          ) : (
            <FileManager
              files={files}
              onSelectFile={setSelectedFile}
              onRunFile={setRunningFile}
              onDeleteFile={handleDeleteFile}
              onAddNewClick={() => setIsAddModalOpen(true)}
            />
          )}
        </div>
      </main>

      {/* Add New Modal */}
      <AddFileModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddFile}
      />

      {/* File Details / Code Viewer Modal */}
      <FileDetailsModal
        isOpen={!!selectedFile}
        file={selectedFile}
        onClose={() => setSelectedFile(null)}
        onRun={(file) => {
          setSelectedFile(null); // close details modal
          setRunningFile(file);  // open runner
        }}
        onUpdate={handleUpdateFile}
      />

      {/* Live JSX Sandbox Runner */}
      {runningFile && (
        <JsxRunner
          file={runningFile}
          onClose={() => setRunningFile(null)}
        />
      )}
    </div>
  );
}
