import React, { useState, useEffect } from 'react';
import { Layers, Wifi, WifiOff, Settings, ShieldCheck } from 'lucide-react';
import './Header.css';

export default function Header() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <header className="app-header">
      <div className="header-brand">
        <div className="brand-logo-container">
          <Layers className="brand-logo-icon animate-pulse" size={24} />
        </div>
        <div className="brand-text">
          <h1 className="brand-title">JSX Sandbox</h1>
          <p className="brand-subtitle">Offline Interactive JSX Viewer & Runner</p>
        </div>
      </div>

      <div className="header-status-group">
        {/* Offline indicator */}
        <div className={`status-badge ${isOnline ? 'status-online' : 'status-offline'}`}>
          {isOnline ? (
            <>
              <Wifi size={14} />
              <span>Online Cache Ready</span>
            </>
          ) : (
            <>
              <WifiOff size={14} />
              <span>Offline Mode Active</span>
            </>
          )}
        </div>

        {/* Sandbox indicator */}
        <div className="status-badge status-secure">
          <ShieldCheck size={14} />
          <span>Sandboxed</span>
        </div>
      </div>
    </header>
  );
}
