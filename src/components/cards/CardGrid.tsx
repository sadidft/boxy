/**
 * Boxy Card Grid Component
 * Masonry grid layout for cards
 */

import React, { useMemo, useState, useCallback } from 'react';
import { useApp, useModal } from '@/store/AppContext';
import { CardItem } from './CardItem';
import { Box, Clipboard, Folder, Search, Plus } from '@/components/icons/Icons';
import { cn } from '@/utils/cn';
import { stripMarkdown } from '@/utils/markdown';

export function CardGrid() {
  const { state, dispatch } = useApp();
  const { openModal } = useModal();
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);

  // Get cards for active tab, filtered by search
  const cards = useMemo(() => {
    let filtered = state.cards.filter(c => c.tabId === state.activeTabId);
    
    // Apply search filter
    if (state.searchQuery || state.searchTags.length > 0) {
      const query = state.searchQuery.toLowerCase();
      
      filtered = filtered.filter(card => {
        // Tag filter
        if (state.searchTags.length > 0) {
          const hasAllTags = state.searchTags.every(tag => 
            card.tags.includes(tag)
          );
          if (!hasAllTags) return false;
        }
        
        // Text search
        if (query) {
          const titleMatch = card.title.toLowerCase().includes(query);
          const contentMatch = stripMarkdown(card.content).toLowerCase().includes(query);
          return titleMatch || contentMatch;
        }
        
        return true;
      });
    }
    
    // Sort: pinned first, then by order
    return filtered.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return a.order - b.order;
    });
  }, [state.cards, state.activeTabId, state.searchQuery, state.searchTags]);

  const handleDragStart = useCallback((cardId: string) => {
    setDraggedCardId(cardId);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedCardId(null);
  }, []);

  const handleDrop = useCallback((targetCardId: string) => {
    if (!draggedCardId || draggedCardId === targetCardId) return;

    const targetCard = cards.find(c => c.id === targetCardId);
    if (!targetCard) return;

    dispatch({ type: 'REORDER_CARDS', payload: { cardId: draggedCardId, newOrder: targetCard.order } });
    setDraggedCardId(null);
  }, [draggedCardId, cards, dispatch]);

  const handleCreateCard = useCallback(() => {
    openModal('createCard');
  }, [openModal]);

  // Empty states
  if (state.boxes.length === 0) {
    return (
      <EmptyState
        icon={<Box size={64} className="text-[var(--text-tertiary)]" />}
        title="Welcome to Boxy"
        subtitle="Your offline clipboard manager"
        action={
          <button
            onClick={() => openModal('createBox')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg transition-colors"
          >
            <Plus size={18} />
            Create First Box
          </button>
        }
      />
    );
  }

  if (!state.activeBoxId || state.tabs.filter(t => t.boxId === state.activeBoxId).length === 0) {
    return (
      <EmptyState
        icon={<Folder size={64} className="text-[var(--text-tertiary)]" />}
        title="No tabs yet"
        subtitle="Create your first tab to start organizing"
        action={
          <button
            onClick={() => openModal('createTab')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg transition-colors"
          >
            <Plus size={18} />
            Create Tab
          </button>
        }
      />
    );
  }

  if (!state.activeTabId || (cards.length === 0 && !state.searchQuery && state.searchTags.length === 0)) {
    return (
      <EmptyState
        icon={<Clipboard size={64} className="text-[var(--text-tertiary)]" />}
        title="No cards yet"
        subtitle="Create your first card to get started"
        action={
          <button
            onClick={handleCreateCard}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg transition-colors"
          >
            <Plus size={18} />
            New Card
          </button>
        }
      />
    );
  }

  if (cards.length === 0 && (state.searchQuery || state.searchTags.length > 0)) {
    return (
      <EmptyState
        icon={<Search size={64} className="text-[var(--text-tertiary)]" />}
        title="No results found"
        subtitle="Try different keywords or clear filters"
        action={
          <button
            onClick={() => {
              dispatch({ type: 'SET_SEARCH_QUERY', payload: '' });
              dispatch({ type: 'SET_SEARCH_TAGS', payload: [] });
              dispatch({ type: 'SET_SEARCH_MODE', payload: false });
            }}
            className="text-[var(--primary)] hover:text-[var(--primary-hover)] text-sm"
          >
            Clear search
          </button>
        }
      />
    );
  }

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4">
      {/* Search results count */}
      {(state.searchQuery || state.searchTags.length > 0) && (
        <div className="mb-3 sm:mb-4 text-sm text-[var(--text-secondary)]">
          {cards.length} result{cards.length !== 1 ? 's' : ''} 
          {state.searchQuery && ` for "${state.searchQuery}"`}
        </div>
      )}

      {/* Card grid */}
      <div 
        className={cn(
          'grid gap-3 sm:gap-4',
          state.settings.features.masonryLayout
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
        )}
        style={state.settings.features.masonryLayout ? { alignItems: 'start' } : undefined}
      >
        {cards.map(card => (
          <CardItem
            key={card.id}
            card={card}
            isSelected={card.id === state.selectedCardId}
            isDragging={card.id === draggedCardId}
            searchQuery={state.searchQuery}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDrop={handleDrop}
          />
        ))}
      </div>

      {/* Floating action button - responsive */}
      <button
        onClick={handleCreateCard}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-full shadow-lg transition-all hover:scale-105 z-40"
        aria-label="New Card"
      >
        <Plus size={20} />
        <span className="font-medium hidden sm:inline">New Card</span>
      </button>
    </div>
  );
}

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}

function EmptyState({ icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div className="mb-4">{icon}</div>
      <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">{title}</h2>
      <p className="text-[var(--text-secondary)] mb-6">{subtitle}</p>
      {action}
    </div>
  );
}
