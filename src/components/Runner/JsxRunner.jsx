import React, { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { transpileJsx } from '../../utils/transpiler';
import './Runner.css';

export default function JsxRunner({ file, onClose }) {
  const [transpiledCode, setTranspiledCode] = useState('');
  const [compileError, setCompileError] = useState(null);
  const [runtimeError, setRuntimeError] = useState(null);
  const [key] = useState(0);

  const isHtml = file?.name?.toLowerCase().endsWith('.html') || file?.name?.toLowerCase().endsWith('.htm');

  useEffect(() => {
    if (file) {
      if (isHtml) {
        setTranspiledCode('');
        setCompileError(null);
        setRuntimeError(null);
      } else {
        const { code, error } = transpileJsx(file.content);
        if (error) {
          setCompileError(error);
          setTranspiledCode('');
        } else {
          setCompileError(null);
          setTranspiledCode(code);
        }
        setRuntimeError(null);
      }
    }
  }, [file, key, isHtml]);

  useEffect(() => {
    const handleMessage = (event) => {
      if (!event.data || typeof event.data !== 'object') return;
      const { type, message, error } = event.data;
      if (type === 'RUNTIME_ERROR') {
        setRuntimeError({ message, stack: error });
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

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
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #ffffff;
            color: #000000;
            min-height: 100vh;
            box-sizing: border-box;
          }
          * {
            box-sizing: border-box;
          }
        </style>
        <script src="/react.production.min.js"></script>
        <script src="/react-dom.production.min.js"></script>
      </head>
      <body>
        <div id="root"></div>
        <script>
          window.addEventListener('error', (event) => {
            window.parent.postMessage({ type: 'RUNTIME_ERROR', message: event.message, error: event.error ? event.error.stack : null }, '*');
          });

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
    <div className="runner-overlay-fullscreen">
      <button className="runner-btn-floating-close" onClick={onClose} title="Close Interactive View">
        <X size={24} />
      </button>

      {compileError || runtimeError ? (
        <div className="runner-error-fullscreen">
          <AlertTriangle className="error-icon" size={48} />
          <h3>{compileError ? 'Compilation Failed' : 'Runtime Crash'}</h3>
          <p className="error-message">{compileError || runtimeError.message}</p>
          {runtimeError && runtimeError.stack && (
            <pre className="error-stack">{runtimeError.stack}</pre>
          )}
        </div>
      ) : (
        <iframe
          key={key}
          srcDoc={isHtml ? file.content : getSandboxHtml()}
          title="Execution Sandbox"
          sandbox="allow-scripts allow-same-origin"
          className="runner-iframe-fullscreen"
        />
      )}
    </div>
  );
}
