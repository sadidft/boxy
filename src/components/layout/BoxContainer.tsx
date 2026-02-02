/**
 * Boxy BoxContainer Component
 * Renders a single box with its full UI or collapsed bar based on state
 */

import { useApp, useModal } from '@/store/AppContext';
import { TabBar } from './TabBar';
import { AddressBar } from './AddressBar';
import { CardGrid } from '../cards/CardGrid';
import { DynamicIcon, Icon } from '@/components/icons/Icons';
import { Logo } from '@/components/icons/Logo';
import type { Box } from '@/types';

interface BoxContainerProps {
  box: Box;
}

export function BoxContainer({ box }: BoxContainerProps) {
  const { state, dispatch } = useApp();
  const { openModal } = useModal();
  
  const isActive = state.activeBoxId === box.id;
  
  // Get stats for collapsed view
  const tabCount = state.tabs.filter(t => t.boxId === box.id).length;
  const cardCount = state.cards.filter(c => {
    const tab = state.tabs.find(t => t.id === c.tabId);
    return tab?.boxId === box.id;
  }).length;

  const handleActivate = () => {
    if (!isActive) {
      dispatch({ type: 'SET_ACTIVE_BOX', payload: box.id });
    }
    // If minimized, also expand it
    if (box.isMinimized) {
      dispatch({ type: 'TOGGLE_MINIMIZE_BOX', payload: box.id });
    }
  };

  const handleMinimize = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: 'TOGGLE_MINIMIZE_BOX', payload: box.id });
  };

  const handleMaximize = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: 'TOGGLE_MAXIMIZE_BOX', payload: box.id });
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    openModal('deleteConfirm', { type: 'box', id: box.id, name: box.name });
  };

  // Collapsed/Minimized view
  if (box.isMinimized) {
    return (
      <div
        onClick={handleActivate}
        className={`
          flex items-center h-12 px-4 gap-3 cursor-pointer
          bg-[var(--bg-secondary)] border-b border-[var(--border-primary)]
          hover:bg-[var(--bg-tertiary)] transition-colors
          ${isActive ? 'ring-1 ring-[var(--primary)]' : ''}
        `}
      >
        {/* Box Icon */}
        <div className="w-8 h-8 flex items-center justify-center bg-[var(--bg-tertiary)] rounded-lg flex-shrink-0">
          <DynamicIcon name={box.icon} size={18} className="text-[var(--text-primary)]" />
        </div>
        
        {/* Box Name */}
        <span className="font-medium text-[var(--text-primary)] truncate">
          {box.name}
        </span>
        
        {/* Stats */}
        <span className="text-sm text-[var(--text-secondary)] whitespace-nowrap">
          ({tabCount} tabs, {cardCount} cards)
        </span>
        
        {/* Spacer */}
        <div className="flex-1" />
        
        {/* Window Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleMinimize}
            className="w-8 h-8 flex items-center justify-center hover:bg-[var(--bg-main)] rounded transition-colors"
            title="Expand"
          >
            <Icon.ChevronDown size={16} className="text-[var(--text-secondary)]" />
          </button>
          <button
            onClick={handleMaximize}
            className="w-8 h-8 flex items-center justify-center hover:bg-[var(--bg-main)] rounded transition-colors"
            title="Maximize"
          >
            <Icon.Square size={14} className="text-[var(--text-secondary)]" />
          </button>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center hover:bg-[var(--danger)] hover:text-white rounded transition-colors"
            title="Close Box"
          >
            <Icon.X size={16} className="text-[var(--text-secondary)]" />
          </button>
        </div>
      </div>
    );
  }

  // Expanded/Full view - only render full UI for the active box
  // Non-active expanded boxes just show a clickable header
  if (!isActive) {
    return (
      <div
        onClick={handleActivate}
        className={`
          flex items-center h-12 px-4 gap-3 cursor-pointer
          bg-[var(--bg-secondary)] border-b border-[var(--border-primary)]
          hover:bg-[var(--bg-tertiary)] transition-colors
        `}
      >
        {/* Box Icon */}
        <div className="w-8 h-8 flex items-center justify-center bg-[var(--bg-tertiary)] rounded-lg flex-shrink-0">
          <DynamicIcon name={box.icon} size={18} className="text-[var(--text-primary)]" />
        </div>
        
        {/* Box Name */}
        <span className="font-medium text-[var(--text-primary)] truncate">
          {box.name}
        </span>
        
        {/* Stats */}
        <span className="text-sm text-[var(--text-secondary)] whitespace-nowrap">
          ({tabCount} tabs, {cardCount} cards)
        </span>
        
        <span className="text-xs text-[var(--text-tertiary)] ml-2">
          Click to switch
        </span>
        
        {/* Spacer */}
        <div className="flex-1" />
        
        {/* Window Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleMinimize}
            className="w-8 h-8 flex items-center justify-center hover:bg-[var(--bg-main)] rounded transition-colors"
            title="Minimize"
          >
            <Icon.Minus size={16} className="text-[var(--text-secondary)]" />
          </button>
          <button
            onClick={handleMaximize}
            className="w-8 h-8 flex items-center justify-center hover:bg-[var(--bg-main)] rounded transition-colors"
            title="Maximize"
          >
            <Icon.Square size={14} className="text-[var(--text-secondary)]" />
          </button>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center hover:bg-[var(--danger)] hover:text-white rounded transition-colors"
            title="Close Box"
          >
            <Icon.X size={16} className="text-[var(--text-secondary)]" />
          </button>
        </div>
      </div>
    );
  }

  // Full expanded UI for active box
  return (
    <div className={`flex flex-col flex-1 min-h-0 ${box.isMaximized ? 'h-full' : ''}`}>
      <TabBar boxId={box.id} showWindowControls={true} onMinimize={handleMinimize} onMaximize={handleMaximize} onClose={handleClose} />
      <AddressBar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <CardGrid />
      </main>
    </div>
  );
}

/**
 * Empty State Component - Shown when no boxes exist
 */
function EmptyState() {
  const { openModal } = useModal();
  
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-screen bg-[var(--bg-main)]">
      {/* Boxy Logo */}
      <div className="mb-8">
        <Logo size={72} />
      </div>
      
      {/* Welcome Text */}
      <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-3">
        Welcome to Boxy
      </h1>
      <p className="text-lg text-[var(--text-secondary)] mb-2">
        Your offline clipboard manager
      </p>
      <p className="text-[var(--text-tertiary)] mb-8 max-w-md">
        Create your first box to start organizing your snippets, templates, and notes. 
        Everything is stored locally in your browser.
      </p>
      
      {/* Create Box Button */}
      <button
        onClick={() => openModal('createBox')}
        className="flex items-center gap-3 px-8 py-4 bg-[var(--primary)] text-white rounded-xl font-semibold text-lg hover:opacity-90 transition-opacity shadow-lg hover:shadow-xl"
      >
        <Icon.Plus size={24} />
        Create First Box
      </button>
      
      {/* Keyboard shortcut hint */}
      <p className="mt-6 text-sm text-[var(--text-tertiary)]">
        or press <kbd className="px-2 py-1 bg-[var(--bg-secondary)] rounded border border-[var(--border-primary)] font-mono text-xs">Ctrl+B</kbd> to create a box
      </p>
      
      {/* Features list */}
      <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl">
        <div className="flex flex-col items-center p-4">
          <Icon.Shield size={28} className="text-[var(--success)] mb-3" />
          <span className="font-medium text-[var(--text-primary)]">100% Offline</span>
          <span className="text-sm text-[var(--text-tertiary)]">Your data never leaves</span>
        </div>
        <div className="flex flex-col items-center p-4">
          <Icon.Zap size={28} className="text-[var(--warning)] mb-3" />
          <span className="font-medium text-[var(--text-primary)]">Lightning Fast</span>
          <span className="text-sm text-[var(--text-tertiary)]">Copy with one click</span>
        </div>
        <div className="flex flex-col items-center p-4">
          <Icon.Code size={28} className="text-[var(--accent)] mb-3" />
          <span className="font-medium text-[var(--text-primary)]">Markdown Ready</span>
          <span className="text-sm text-[var(--text-tertiary)]">Format your content</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Renders all boxes in multi-box view
 */
export function MultiBoxView() {
  const { state } = useApp();
  
  // If no boxes, show the empty state with welcome message
  if (state.boxes.length === 0) {
    return <EmptyState />;
  }
  
  // Sort boxes by order
  const sortedBoxes = [...state.boxes].sort((a, b) => a.order - b.order);
  
  // Check if any box is maximized
  const maximizedBox = sortedBoxes.find(b => b.isMaximized);
  
  // If a box is maximized, only show that box
  if (maximizedBox) {
    return <BoxContainer box={maximizedBox} />;
  }
  
  // Otherwise, show all boxes in a stacked view
  // Active box gets the most space, others show as headers
  return (
    <div className="flex flex-col h-full">
      {sortedBoxes.map(box => (
        <BoxContainer key={box.id} box={box} />
      ))}
    </div>
  );
}
