/**
 * Boxy Icon Picker Component
 * Icon picker with categories, search, navigation arrows, and custom SVG support
 */

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { DynamicIcon, AVAILABLE_ICONS, Icon } from '@/components/icons/Icons';
import { cn } from '@/utils/cn';
import { generateUUID } from '@/utils/helpers';
import { useToast } from '@/store/AppContext';

// Icon categories
const ICON_CATEGORIES: Record<string, string[]> = {
  'Boxy': ['boxy'],
  'General': [
    'box', 'folder', 'file', 'file-text', 'star', 'heart', 'bookmark', 
    'tag', 'tags', 'hash', 'home', 'user', 'users', 'mail', 'calendar',
    'clock', 'camera', 'image', 'video', 'music', 'download', 'upload',
    'link', 'share', 'archive', 'gift', 'shopping-cart', 'credit-card',
    'bar-chart', 'pie-chart', 'trending-up', 'activity', 'map', 'map-pin',
    'globe', 'sun', 'moon', 'cloud', 'zap', 'battery', 'wifi', 'lock',
    'unlock', 'key', 'shield', 'eye', 'eye-off', 'bell', 'phone', 'message-circle',
    'message-square', 'send', 'inbox', 'paperclip', 'flag', 'award', 'target',
    'crosshair', 'compass', 'navigation'
  ],
  'Tech': [
    'code', 'terminal', 'database', 'server', 'cpu', 'hard-drive', 'monitor',
    'smartphone', 'tablet', 'laptop', 'keyboard', 'mouse', 'headphones', 'speaker',
    'printer', 'git-branch', 'git-commit', 'git-merge', 'git-pull-request',
    'package', 'layers', 'grid', 'layout', 'sidebar', 'command', 'bug',
    'tool', 'wrench', 'settings', 'sliders', 'toggle-left', 'toggle-right',
    'power', 'radio', 'rss', 'chrome', 'github', 'gitlab', 'figma'
  ],
  'Actions': [
    'plus', 'minus', 'x', 'check', 'check-square', 'square', 'circle',
    'chevron-up', 'chevron-down', 'chevron-left', 'chevron-right',
    'arrow-up', 'arrow-down', 'arrow-left', 'arrow-right',
    'rotate-cw', 'rotate-ccw', 'refresh-cw', 'repeat', 'shuffle',
    'maximize', 'maximize-2', 'minimize', 'minimize-2', 'move',
    'copy', 'clipboard', 'scissors', 'edit', 'edit-2', 'edit-3',
    'trash', 'trash-2', 'save', 'external-link', 'corner-up-left',
    'corner-up-right', 'log-in', 'log-out', 'play', 'pause', 'stop',
    'skip-back', 'skip-forward', 'fast-forward', 'rewind', 'volume', 
    'volume-1', 'volume-2', 'volume-x', 'mic', 'mic-off'
  ],
  'Shapes': [
    'circle', 'square', 'triangle', 'octagon', 'hexagon', 'pentagon',
    'diamond', 'star', 'heart', 'loader', 'disc', 'aperture'
  ],
  'Arrows': [
    'arrow-up', 'arrow-down', 'arrow-left', 'arrow-right',
    'arrow-up-left', 'arrow-up-right', 'arrow-down-left', 'arrow-down-right',
    'corner-down-left', 'corner-down-right', 'corner-left-down', 'corner-left-up',
    'corner-right-down', 'corner-right-up', 'corner-up-left', 'corner-up-right',
    'chevron-up', 'chevron-down', 'chevron-left', 'chevron-right',
    'chevrons-up', 'chevrons-down', 'chevrons-left', 'chevrons-right'
  ],
  'Communication': [
    'mail', 'inbox', 'send', 'message-circle', 'message-square', 'phone',
    'phone-call', 'phone-forwarded', 'phone-incoming', 'phone-missed',
    'phone-off', 'phone-outgoing', 'video', 'video-off', 'voicemail',
    'at-sign', 'hash', 'link', 'link-2', 'share', 'share-2'
  ],
  'Weather': [
    'sun', 'moon', 'cloud', 'cloud-rain', 'cloud-snow', 'cloud-lightning',
    'cloud-drizzle', 'cloud-off', 'wind', 'droplet', 'umbrella', 'thermometer'
  ],
  'Custom': [] // Will be populated with user custom icons
};

// Get all category names
const CATEGORY_NAMES = Object.keys(ICON_CATEGORIES);

interface IconPickerProps {
  selectedIcon: string;
  onSelect: (iconName: string) => void;
  onClose?: () => void;
  customIcons?: { name: string; svg: string }[];
  onAddCustomIcon?: (name: string, svg: string) => void;
}

export function IconPicker({ 
  selectedIcon, 
  onSelect, 
  onClose,
  customIcons = [],
  onAddCustomIcon 
}: IconPickerProps) {
  const { success, error } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customSvg, setCustomSvg] = useState('');
  
  // Scroll state for category navigation
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Check scroll state
  const checkScrollState = useCallback(() => {
    const container = categoryScrollRef.current;
    if (container) {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(container.scrollLeft < container.scrollWidth - container.clientWidth - 1);
    }
  }, []);

  // Initialize scroll state and listen for changes
  useEffect(() => {
    checkScrollState();
    const container = categoryScrollRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollState);
      window.addEventListener('resize', checkScrollState);
      return () => {
        container.removeEventListener('scroll', checkScrollState);
        window.removeEventListener('resize', checkScrollState);
      };
    }
  }, [checkScrollState]);

  // Scroll category buttons
  const scrollCategories = useCallback((direction: 'left' | 'right') => {
    const container = categoryScrollRef.current;
    if (container) {
      const scrollAmount = 150;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  }, []);

  // Filter icons based on search and category
  const filteredIcons = useMemo(() => {
    let icons: string[] = [];
    
    if (activeCategory === 'All') {
      icons = AVAILABLE_ICONS;
    } else if (activeCategory === 'Custom') {
      icons = customIcons.map(c => c.name);
    } else {
      icons = ICON_CATEGORIES[activeCategory] || [];
      // Filter to only include icons that exist in AVAILABLE_ICONS
      icons = icons.filter(icon => AVAILABLE_ICONS.includes(icon));
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      icons = icons.filter(icon => icon.toLowerCase().includes(query));
    }
    
    return icons;
  }, [activeCategory, searchQuery, customIcons]);

  const handleAddCustomIcon = useCallback(() => {
    if (!customName.trim()) {
      error('Icon name is required');
      return;
    }
    
    if (!customSvg.trim()) {
      error('SVG code is required');
      return;
    }
    
    // Basic SVG validation
    if (!customSvg.trim().startsWith('<svg') || !customSvg.trim().includes('</svg>')) {
      error('Invalid SVG code. Must start with <svg and end with </svg>');
      return;
    }
    
    // Generate unique name if it already exists
    let iconName = customName.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
    if (AVAILABLE_ICONS.includes(iconName) || customIcons.some(c => c.name === iconName)) {
      iconName = `${iconName}-${generateUUID().slice(0, 4)}`;
    }
    
    if (onAddCustomIcon) {
      onAddCustomIcon(iconName, customSvg.trim());
      success(`Custom icon "${iconName}" added`);
      setCustomName('');
      setCustomSvg('');
      setShowCustomForm(false);
      onSelect(iconName);
    }
  }, [customName, customSvg, customIcons, onAddCustomIcon, onSelect, success, error]);

  return (
    <div className="flex flex-col h-full max-h-[70vh] sm:max-h-[500px]">
      {/* Search */}
      <div className="p-3 border-b border-[var(--border-primary)]">
        <input
          type="text"
          placeholder="Search icons..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 bg-[var(--bg-main)] border border-[var(--border-primary)] rounded-lg text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none focus:border-[var(--primary)]"
          autoFocus
        />
      </div>
      
      {/* Categories with Navigation Arrows */}
      <div className="relative flex items-center border-b border-[var(--border-primary)]">
        {/* Left Arrow */}
        {canScrollLeft && (
          <button
            onClick={() => scrollCategories('left')}
            className="absolute left-0 z-10 flex items-center justify-center w-8 h-full bg-gradient-to-r from-[var(--bg-secondary)] via-[var(--bg-secondary)] to-transparent"
            aria-label="Scroll left"
          >
            <Icon.ChevronLeft size={18} className="text-[var(--text-secondary)]" />
          </button>
        )}
        
        {/* Category Buttons */}
        <div 
          ref={categoryScrollRef}
          className="flex items-center gap-1 p-2 overflow-x-auto scrollbar-none scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <button
            onClick={() => setActiveCategory('All')}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors flex-shrink-0',
              activeCategory === 'All'
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-main)]'
            )}
          >
            All ({AVAILABLE_ICONS.length})
          </button>
          {CATEGORY_NAMES.filter(cat => cat !== 'Custom' || customIcons.length > 0).map(category => {
            const count = category === 'Custom' 
              ? customIcons.length 
              : (ICON_CATEGORIES[category] || []).filter(i => AVAILABLE_ICONS.includes(i)).length;
            
            if (count === 0 && category !== 'Custom') return null;
            
            return (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors flex-shrink-0',
                  activeCategory === category
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-main)]'
                )}
              >
                {category} ({count})
              </button>
            );
          })}
        </div>
        
        {/* Right Arrow */}
        {canScrollRight && (
          <button
            onClick={() => scrollCategories('right')}
            className="absolute right-0 z-10 flex items-center justify-center w-8 h-full bg-gradient-to-l from-[var(--bg-secondary)] via-[var(--bg-secondary)] to-transparent"
            aria-label="Scroll right"
          >
            <Icon.ChevronRight size={18} className="text-[var(--text-secondary)]" />
          </button>
        )}
      </div>
      
      {/* Add Custom Icon Section */}
      {onAddCustomIcon && (
        <div className="p-2 border-b border-[var(--border-primary)]">
          {!showCustomForm ? (
            <button
              onClick={() => setShowCustomForm(true)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded-lg transition-colors"
            >
              <Icon.Plus size={16} />
              Add Custom SVG Icon
            </button>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Icon name (e.g., my-icon)"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="flex-1 px-3 py-2 bg-[var(--bg-main)] border border-[var(--border-primary)] rounded-lg text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none focus:border-[var(--primary)]"
                />
              </div>
              <textarea
                placeholder="Paste SVG code here... (e.g., <svg>...</svg>)"
                value={customSvg}
                onChange={(e) => setCustomSvg(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-[var(--bg-main)] border border-[var(--border-primary)] rounded-lg text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none focus:border-[var(--primary)] font-mono resize-none"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCustomForm(false)}
                  className="flex-1 px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddCustomIcon}
                  className="flex-1 px-3 py-2 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
                >
                  Add Icon
                </button>
              </div>
              
              {/* SVG Preview */}
              {customSvg && (
                <div className="p-3 bg-[var(--bg-main)] rounded-lg border border-[var(--border-primary)]">
                  <p className="text-xs text-[var(--text-tertiary)] mb-2">Preview:</p>
                  <div 
                    className="w-8 h-8 flex items-center justify-center text-[var(--text-primary)]"
                    dangerouslySetInnerHTML={{ __html: customSvg }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Icons Grid */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredIcons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-[var(--text-tertiary)]">
            <Icon.Search size={32} className="mb-2" />
            <p className="text-sm">No icons found</p>
          </div>
        ) : (
          <div className="grid grid-cols-6 sm:grid-cols-8 gap-1">
            {filteredIcons.map(iconName => (
              <button
                key={iconName}
                type="button"
                onClick={() => {
                  onSelect(iconName);
                  if (onClose) onClose();
                }}
                className={cn(
                  'p-2 rounded-lg transition-colors flex items-center justify-center',
                  'hover:bg-[var(--bg-tertiary)]',
                  selectedIcon === iconName && 'bg-[var(--primary)]/20 text-[var(--primary)] ring-2 ring-[var(--primary)]'
                )}
                title={iconName}
              >
                <DynamicIcon name={iconName} size={20} />
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Selected icon info */}
      <div className="flex items-center justify-between p-3 border-t border-[var(--border-primary)] bg-[var(--bg-secondary)]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 flex items-center justify-center bg-[var(--bg-tertiary)] rounded-lg">
            <DynamicIcon name={selectedIcon} size={20} className="text-[var(--text-primary)]" />
          </div>
          <span className="text-sm text-[var(--text-secondary)]">
            Selected: <span className="text-[var(--text-primary)] font-medium">{selectedIcon}</span>
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
          >
            Done
          </button>
        )}
      </div>
    </div>
  );
}

// Standalone modal version
interface IconPickerModalProps {
  isOpen: boolean;
  selectedIcon: string;
  onSelect: (iconName: string) => void;
  onClose: () => void;
  customIcons?: { name: string; svg: string }[];
  onAddCustomIcon?: (name: string, svg: string) => void;
}

export function IconPickerModal({
  isOpen,
  selectedIcon,
  onSelect,
  onClose,
  customIcons,
  onAddCustomIcon
}: IconPickerModalProps) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg bg-[var(--bg-secondary)] rounded-xl shadow-xl overflow-hidden z-[101]">
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-primary)]">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Choose Icon</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
          >
            <Icon.X size={20} className="text-[var(--text-secondary)]" />
          </button>
        </div>
        
        <IconPicker
          selectedIcon={selectedIcon}
          onSelect={onSelect}
          onClose={onClose}
          customIcons={customIcons}
          onAddCustomIcon={onAddCustomIcon}
        />
      </div>
    </div>
  );
}
