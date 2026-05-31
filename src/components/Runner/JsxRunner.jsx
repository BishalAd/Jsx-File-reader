import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, AlertTriangle, Terminal, Eye, X, RefreshCw } from 'lucide-react';
import { transpileJsx } from '../../utils/transpiler';
import './Runner.css';

export default function JsxRunner({ file, onClose }) {
  const [transpiledCode, setTranspiledCode] = useState('');
  const [compileError, setCompileError] = useState(null);
  const [runtimeError, setRuntimeError] = useState(null);
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('preview'); // 'preview' | 'logs'
  const [key, setKey] = useState(0); // For reloading the iframe
  const iframeRef = useRef(null);

  useEffect(() => {
    if (file) {
      // Transpile the file content when loaded
      const { code, error } = transpileJsx(file.content);
      if (error) {
        setCompileError(error);
        setTranspiledCode('');
      } else {
        setCompileError(null);
        setTranspiledCode(code);
      }
      // Reset runner state
      setRuntimeError(null);
      setLogs([]);
      setActiveTab('preview');
    }
  }, [file, key]);

  // Handle messages sent from the iframe sandbox
  useEffect(() => {
    const handleMessage = (event) => {
      if (!event.data || typeof event.data !== 'object') return;

      const { type, message, error, data } = event.data;

      if (type === 'CONSOLE_LOG') {
        setLogs((prev) => [...prev, { type: 'info', text: data, time: new Date().toLocaleTimeString() }]);
      } else if (type === 'CONSOLE_WARN') {
        setLogs((prev) => [...prev, { type: 'warn', text: data, time: new Date().toLocaleTimeString() }]);
      } else if (type === 'CONSOLE_ERROR') {
        setLogs((prev) => [...prev, { type: 'error', text: data, time: new Date().toLocaleTimeString() }]);
      } else if (type === 'RUNTIME_ERROR') {
        setRuntimeError({ message, stack: error });
        setActiveTab('logs'); // Auto switch to show logs/errors
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleRestart = () => {
    setKey((prev) => prev + 1);
  };

  // Generate the HTML for the sandboxed iframe
  const getSandboxHtml = () => {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            margin: 0;
            padding: 16px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #0b0f19;
            color: #f1f5f9;
            min-height: 100vh;
            box-sizing: border-box;
          }
          * {
            box-sizing: border-box;
          }
          /* Custom scrollbar for preview */
          ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          ::-webkit-scrollbar-track {
            background: #0f172a;
          }
          ::-webkit-scrollbar-thumb {
            background: #334155;
            border-radius: 4px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: #475569;
          }
        </style>
        <!-- Offline-cached UMD versions of React and ReactDOM -->
        <script src="/react.production.min.js"></script>
        <script src="/react-dom.production.min.js"></script>
      </head>
      <body>
        <div id="root"></div>
        <script>
          // Redirect console outputs to the parent window
          const _log = console.log;
          const _error = console.error;
          const _warn = console.warn;
          
          console.log = (...args) => {
            _log(...args);
            window.parent.postMessage({ 
              type: 'CONSOLE_LOG', 
              data: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') 
            }, '*');
          };
          
          console.warn = (...args) => {
            _warn(...args);
            window.parent.postMessage({ 
              type: 'CONSOLE_WARN', 
              data: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') 
            }, '*');
          };
          
          console.error = (...args) => {
            _error(...args);
            window.parent.postMessage({ 
              type: 'CONSOLE_ERROR', 
              data: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') 
            }, '*');
          };

          window.addEventListener('error', (event) => {
            window.parent.postMessage({ 
              type: 'RUNTIME_ERROR', 
              message: event.message, 
              error: event.error ? event.error.stack : null 
            }, '*');
          });

          // Define window.render helper to paint components
          window.render = (element) => {
            const rootEl = document.getElementById('root');
            try {
              if (window.ReactDOM && window.ReactDOM.createRoot) {
                if (!window.reactRoot) {
                  window.reactRoot = window.ReactDOM.createRoot(rootEl);
                }
                window.reactRoot.render(element);
              } else {
                window.ReactDOM.render(element, rootEl);
              }
            } catch (err) {
              window.parent.postMessage({ type: 'RUNTIME_ERROR', message: err.message, error: err.stack }, '*');
            }
          };
        </script>
        <script type="module">
          try {
            ${transpiledCode}
          } catch (err) {
            window.parent.postMessage({ type: 'RUNTIME_ERROR', message: err.message, error: err.stack }, '*');
          }
        </script>
      </body>
      </html>
    `;
  };

  return (
    <div className="runner-overlay">
      <div className="runner-container">
        {/* Runner Header */}
        <div className="runner-header">
          <div className="runner-title-group">
            <Play size={18} className="runner-icon-play" />
            <h2 className="runner-filename">{file.name}</h2>
            <span className="runner-badge">Preview Mode</span>
          </div>
          <div className="runner-actions">
            <button className="runner-btn-restart" onClick={handleRestart} title="Restart sandbox">
              <RotateCcw size={16} />
              <span>Restart</span>
            </button>
            <button className="runner-btn-close" onClick={onClose} title="Close runner">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="runner-tabs">
          <button 
            className={`runner-tab ${activeTab === 'preview' ? 'active' : ''}`}
            onClick={() => setActiveTab('preview')}
          >
            <Eye size={14} />
            <span>Interactive View</span>
          </button>
          <button 
            className={`runner-tab ${activeTab === 'logs' ? 'active' : ''} ${runtimeError || compileError ? 'tab-error' : ''}`}
            onClick={() => setActiveTab('logs')}
          >
            <Terminal size={14} />
            <span>Console & Logs</span>
            {logs.length > 0 && <span className="logs-count">{logs.length}</span>}
            {(runtimeError || compileError) && <span className="error-dot" />}
          </button>
        </div>

        {/* Tab Content */}
        <div className="runner-content">
          {activeTab === 'preview' ? (
            <div className="runner-preview-pane">
              {compileError ? (
                <div className="runner-error-card">
                  <AlertTriangle className="error-icon" size={32} />
                  <h3>Compilation Failed</h3>
                  <p className="error-message">{compileError}</p>
                  <div className="error-hint">
                    Check your JSX syntax. Ensure tags are correctly opened and closed, and all React components are valid.
                  </div>
                </div>
              ) : (
                <iframe
                  key={key}
                  ref={iframeRef}
                  srcDoc={getSandboxHtml()}
                  title="JSX Execution Sandbox"
                  sandbox="allow-scripts"
                  className="runner-iframe"
                />
              )}
            </div>
          ) : (
            <div className="runner-logs-pane">
              {compileError && (
                <div className="log-item log-error">
                  <span className="log-time">[COMPILE]</span>
                  <pre className="log-text">{compileError}</pre>
                </div>
              )}
              {runtimeError && (
                <div className="log-item log-error">
                  <span className="log-time">[CRASH]</span>
                  <div className="log-text">
                    <strong>Runtime Error:</strong> {runtimeError.message}
                    {runtimeError.stack && (
                      <pre className="error-stack">{runtimeError.stack}</pre>
                    )}
                  </div>
                </div>
              )}
              {logs.length === 0 && !compileError && !runtimeError ? (
                <div className="logs-empty">
                  <Terminal size={24} />
                  <p>Console is empty. Logs from console.log() will appear here.</p>
                </div>
              ) : (
                <div className="logs-list">
                  {logs.map((log, idx) => (
                    <div key={idx} className={`log-item log-${log.type}`}>
                      <span className="log-time">{log.time}</span>
                      <span className="log-text">{log.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
