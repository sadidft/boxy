/**
 * Boxy - Your Offline Clipboard Manager
 * @version 1.0.23
 * 
 * Main application component
 */

import { useEffect } from 'react';
import { AppProvider, useApp } from '@/store/AppContext';
import { TabBar } from '@/components/layout/TabBar';
import { AddressBar } from '@/components/layout/AddressBar';
import { CardGrid } from '@/components/cards/CardGrid';
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
      {/* Tab Bar */}
      <TabBar />
      
      {/* Address Bar */}
      <AddressBar />
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <CardGrid />
      </main>
      
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
