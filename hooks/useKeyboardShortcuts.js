import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const useKeyboardShortcuts = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyPress = (e) => {
      // Ignore if user is typing in an input/textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      // Ctrl/Cmd + Key shortcuts
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'd':
            e.preventDefault();
            navigate('/dashboard');
            break;
          case 'm':
            e.preventDefault();
            navigate('/members');
            break;
          case 'p':
            e.preventDefault();
            navigate('/payments');
            break;
          case 'r':
            e.preventDefault();
            navigate('/reports');
            break;
          case 'e':
            e.preventDefault();
            navigate('/expenses');
            break;
          case 't':
            e.preventDefault();
            navigate('/transactions');
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [navigate]);
};

export default useKeyboardShortcuts;
