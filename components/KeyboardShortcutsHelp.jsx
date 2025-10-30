import React, { useState, useEffect } from 'react';
import './KeyboardShortcutsHelp.css';

const KeyboardShortcutsHelp = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          setShow(prev => !prev);
        }
      }
      if (e.key === 'Escape') {
        setShow(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  if (!show) return null;

  return (
    <div className="shortcuts-overlay" onClick={() => setShow(false)}>
      <div className="shortcuts-modal" onClick={(e) => e.stopPropagation()}>
        <div className="shortcuts-header">
          <h2>⌨️ Keyboard Shortcuts</h2>
          <button className="shortcuts-close" onClick={() => setShow(false)}>×</button>
        </div>
        <div className="shortcuts-content">
          <div className="shortcuts-section">
            <h3>Navigation</h3>
            <div className="shortcut-item">
              <kbd>Ctrl</kbd> + <kbd>D</kbd>
              <span>Dashboard</span>
            </div>
            <div className="shortcut-item">
              <kbd>Ctrl</kbd> + <kbd>M</kbd>
              <span>Members</span>
            </div>
            <div className="shortcut-item">
              <kbd>Ctrl</kbd> + <kbd>P</kbd>
              <span>Payments</span>
            </div>
            <div className="shortcut-item">
              <kbd>Ctrl</kbd> + <kbd>E</kbd>
              <span>Expenses</span>
            </div>
            <div className="shortcut-item">
              <kbd>Ctrl</kbd> + <kbd>T</kbd>
              <span>Transactions</span>
            </div>
            <div className="shortcut-item">
              <kbd>Ctrl</kbd> + <kbd>R</kbd>
              <span>Reports</span>
            </div>
          </div>
          <div className="shortcuts-section">
            <h3>General</h3>
            <div className="shortcut-item">
              <kbd>?</kbd>
              <span>Show/Hide shortcuts</span>
            </div>
            <div className="shortcut-item">
              <kbd>Esc</kbd>
              <span>Close modals</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsHelp;
