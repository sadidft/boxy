/**
 * Boxy - Your Offline Clipboard Manager
 * @version 1.0.23
 * 
 * Main application component
 */

import { useEffect } from 'react';
import { AppProvider, useApp } from '@/store/AppContext';
import { MultiBoxView } from '@/components/layout/BoxContainer';
import { ModalController } from '@/components/modals/ModalController';
import { ToastContainer } from '@/components/ui/Toast';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

function AppContent() {
  const { state } = useApp();
  
  // Initialize keyboard shortcuts
  useKeyboardShortcuts();
  
  // Apply theme on mount and when settings change
  useEffect(() => {
    const applyTheme = () => {
      const { theme } = state.settings;
      
      if (theme === 'dark') {
        document.documentElement.classList.remove('light');
      } else if (theme === 'light') {
        document.documentElement.classList.add('light');
      } else {
        // System preference
        if (window.matchMedia('(prefers-color-scheme: light)').matches) {
          document.documentElement.classList.add('light');
        } else {
          document.documentElement.classList.remove('light');
        }
      }
    };
    
    applyTheme();
    
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
    const handleChange = () => {
      if (state.settings.theme === 'system') {
        applyTheme();
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [state.settings.theme]);

  // Apply primary color as CSS variable
  useEffect(() => {
    document.documentElement.style.setProperty('--primary', state.settings.primaryColor);
  }, [state.settings.primaryColor]);

  return (
    <div className="h-full flex flex-col bg-[var(--bg-main)]">
      {/* Always use MultiBoxView - it handles all box states:
          - Single box (renders full UI)
          - Multiple boxes (renders stacked view)
          - Minimized boxes (renders collapsed bar)
          - Maximized box (renders only that box full screen)
      */}
      <MultiBoxView />
      
      {/* Modals */}
      <ModalController />
      
      {/* Toasts */}
      <ToastContainer />
    </div>
  );
}

export function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
