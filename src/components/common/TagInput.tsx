import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { useApp } from '@/store/AppContext';
import { Icon } from '@/components/icons/Icons';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
}

export function TagInput({ 
  tags, 
  onChange, 
  placeholder = 'Add tags...', 
  maxTags = 10 
}: TagInputProps) {
  const { state } = useApp();
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get suggestions based on input
  const suggestions = inputValue.trim()
    ? state.allTags
        .filter(tag => 
          tag.toLowerCase().includes(inputValue.toLowerCase()) &&
          !tags.includes(tag)
        )
        .slice(0, 8)
    : state.allTags
        .filter(tag => !tags.includes(tag))
        .slice(0, 5);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addTag = (tag: string) => {
    const normalizedTag = tag.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '');
    if (normalizedTag && !tags.includes(normalizedTag) && tags.length < maxTags) {
      onChange([...tags, normalizedTag]);
      setInputValue('');
      setSelectedSuggestionIndex(-1);
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (selectedSuggestionIndex >= 0 && suggestions[selectedSuggestionIndex]) {
        addTag(suggestions[selectedSuggestionIndex]);
      } else if (inputValue.trim()) {
        addTag(inputValue);
      }
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }
  };

  const handleInputChange = (value: string) => {
    // Handle comma-separated input
    if (value.includes(',')) {
      const parts = value.split(',');
      parts.forEach((part, index) => {
        if (index < parts.length - 1 && part.trim()) {
          addTag(part);
        }
      });
      setInputValue(parts[parts.length - 1]);
    } else {
      setInputValue(value);
    }
    setSelectedSuggestionIndex(-1);
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Tags Container */}
      <div 
        className="min-h-[42px] p-2 bg-[var(--bg-main)] border border-[var(--border-primary)] rounded-lg flex flex-wrap gap-2 items-center cursor-text focus-within:border-[var(--primary)] focus-within:ring-1 focus-within:ring-[var(--primary)] transition-all"
        onClick={() => inputRef.current?.focus()}
      >
        {/* Existing Tags */}
        {tags.map(tag => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-[var(--primary)] bg-opacity-20 text-[var(--primary)] rounded-full text-sm font-medium group hover:bg-opacity-30 transition-colors"
          >
            <span className="text-[var(--primary)] opacity-60">#</span>
            {tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(tag);
              }}
              className="ml-0.5 p-0.5 rounded-full hover:bg-[var(--primary)] hover:bg-opacity-30 transition-colors"
              aria-label={`Remove ${tag}`}
            >
              <Icon.X size={12} />
            </button>
          </span>
        ))}
        
        {/* Input Field */}
        {tags.length < maxTags && (
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            placeholder={tags.length === 0 ? placeholder : ''}
            className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-[var(--text-primary)] text-sm placeholder:text-[var(--text-tertiary)]"
          />
        )}
      </div>

      {/* Tag Limit Indicator */}
      {tags.length >= maxTags && (
        <p className="mt-1 text-xs text-[var(--text-tertiary)]">
          Maximum {maxTags} tags reached
        </p>
      )}

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 py-1 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg shadow-lg max-h-[200px] overflow-y-auto">
          <div className="px-3 py-1.5 text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide">
            {inputValue ? 'Suggestions' : 'Popular Tags'}
          </div>
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => {
                addTag(suggestion);
                inputRef.current?.focus();
              }}
              className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors ${
                index === selectedSuggestionIndex
                  ? 'bg-[var(--primary)] bg-opacity-20 text-[var(--primary)]'
                  : 'text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
              }`}
            >
              <Icon.Hash size={14} className="text-[var(--text-tertiary)]" />
              <span>{suggestion}</span>
              {index === selectedSuggestionIndex && (
                <span className="ml-auto text-xs text-[var(--text-tertiary)]">
                  Press Enter
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Helper Text */}
      <p className="mt-1.5 text-xs text-[var(--text-tertiary)]">
        Press Enter or comma to add. {tags.length}/{maxTags} tags.
      </p>
    </div>
  );
}
