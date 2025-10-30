import { useEffect } from 'react';
import useKeyboardShortcuts from '../hooks/useKeyboardShortcuts';

const KeyboardShortcutsWrapper = ({ children }) => {
  useKeyboardShortcuts();
  return children;
};

export default KeyboardShortcutsWrapper;
