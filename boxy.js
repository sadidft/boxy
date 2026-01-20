    ;(() => {
      'use strict';

      /* ============================================
         ICON DEFINITIONS (SVG)
      ============================================ */
      const ICONS = {
        // Boxy Logo
        box: '<svg viewBox="0 0 24 24"><path d="M21 8V21H3V8"/><path d="M23 3H1V8H23V3Z"/><path d="M10 12H14"/></svg>',
        
        // Navigation
        'chevron-left': '<svg viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg>',
        'chevron-right': '<svg viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>',
        'chevron-down': '<svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>',
        'chevron-up': '<svg viewBox="0 0 24 24"><path d="m18 15-6-6-6 6"/></svg>',
        
        // Actions
        plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
        x: '<svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>',
        check: '<svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>',
        edit: '<svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
        trash: '<svg viewBox="0 0 24 24"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M10 11v6M14 11v6"/></svg>',
        copy: '<svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
        clipboard: '<svg viewBox="0 0 24 24"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>',
        
        // UI Elements
        search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>',
        menu: '<svg viewBox="0 0 24 24"><path d="M4 12h16M4 6h16M4 18h16"/></svg>',
        'more-vertical': '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>',
        'more-horizontal': '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="1"/><circle cx="5" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></svg>',
        settings: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
        
        // Files & Folders
        folder: '<svg viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
        'folder-plus': '<svg viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><path d="M12 11v6M9 14h6"/></svg>',
        file: '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>',
        'file-plus': '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M12 18v-6M9 15h6"/></svg>',
        
        // Status
        pin: '<svg viewBox="0 0 24 24"><path d="M12 17v5M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6a1 1 0 0 1 1-1h0a1 1 0 0 0 1-1V3H7v1a1 1 0 0 0 1 1h0a1 1 0 0 1 1 1v4.76z"/></svg>',
        'check-circle': '<svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4 12 14.01l-3-3"/></svg>',
        'x-circle': '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg>',
        'alert-circle': '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>',
        info: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>',
        
        // Theme
        sun: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>',
        moon: '<svg viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
        
        // Window controls
        minimize: '<svg viewBox="0 0 24 24"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>',
        maximize: '<svg viewBox="0 0 24 24"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>',
        
        // Import/Export
        download: '<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5M12 15V3"/></svg>',
        upload: '<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5M12 3v12"/></svg>',
        
        // Misc
        clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
        tag: '<svg viewBox="0 0 24 24"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><circle cx="7" cy="7" r="1"/></svg>',
        heart: '<svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
        'external-link': '<svg viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3"/></svg>',
        'book-open': '<svg viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
        table: '<svg viewBox="0 0 24 24"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/></svg>',
        function: '<svg viewBox="0 0 24 24"><path d="M9 17H7A5 5 0 0 1 7 7h2M15 7h2a5 5 0 0 1 0 10h-2M8 12h8"/></svg>',
        variable: '<svg viewBox="0 0 24 24"><path d="M8 21s-4-3-4-9 4-9 4-9M16 3s4 3 4 9-4 9-4 9M15 9l-6 6M9 9l6 6"/></svg>',
        grip: '<svg viewBox="0 0 24 24"><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg>',
      };

      const $ = (sel, ctx = document) => ctx.querySelector(sel);
      const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
      
      const uid = (prefix = 'id') => `${prefix}_${Math.random().toString(36).slice(2, 11)}`;
      const now = () => Date.now();
      
      const escapeHtml = (str) => {
        if (!str) return '';
        const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
        return String(str).replace(/[&<>"']/g, c => map[c]);
      };

      const debounce = (fn, ms = 300) => {
        let timer;
        return (...args) => {
          clearTimeout(timer);
          timer = setTimeout(() => fn(...args), ms);
        };
      };

      const throttle = (fn, ms = 100) => {
        let last = 0;
        return (...args) => {
          const t = now();
          if (t - last >= ms) {
            last = t;
            fn(...args);
          }
        };
      };

      const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

      const timeAgo = (timestamp) => {
        const seconds = Math.floor((now() - timestamp) / 1000);
        if (seconds < 60) return 'just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`;
        return new Date(timestamp).toLocaleDateString();
      };

      const formatDate = (timestamp) => {
        const d = new Date(timestamp);
        const yy = String(d.getFullYear()).slice(-2);
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const hh = String(d.getHours()).padStart(2, '0');
        const mi = String(d.getMinutes()).padStart(2, '0');
        return `${yy}/${mm}/${dd} (${hh}:${mi})`;
      };

      const parseTags = (str) => {
        if (!str) return [];
        return str.split(',')
          .map(t => t.trim().toLowerCase())
          .filter(t => t.length > 0)
          .slice(0, 15);
      };

      const copyToClipboard = async (text) => {
        try {
          await navigator.clipboard.writeText(text);
          return true;
        } catch (err) {
          // Fallback for file:// protocol
          const textarea = document.createElement('textarea');
          textarea.value = text;
          textarea.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
          document.body.appendChild(textarea);
          textarea.select();
          try {
            document.execCommand('copy');
            return true;
          } catch {
            return false;
          } finally {
            textarea.remove();
          }
        }
      };

      /* ============================================
         ICON RENDERER
      ============================================ */
      const renderIcon = (name, className = '') => {
        const svg = ICONS[name] || '';
        return `<span class="icon ${className}" data-icon="${name}">${svg}</span>`;
      };

      const hydrateIcons = (container = document) => {
        container.querySelectorAll('.icon[data-icon]').forEach(el => {
          const name = el.dataset.icon;
          if (ICONS[name] && !el.innerHTML.trim()) {
            el.innerHTML = ICONS[name];
          }
        });
      };

      /* ============================================
         STORAGE SYSTEM
      ============================================ */
      const STORAGE_KEY = 'boxy_data';

      const defaultSettings = () => ({
        theme: 'dark',
        primaryColor: '#0ea5e9',
        recentColors: [],
        features: {
          tableInCards: true,
          autoRecordHistory: true,
          cardDrag: true,
          tabDrag: true,
          masonryGrid: true
        },
        advanced: {
          bypassTabLimit: false,
          bypassColumnLimit: false,
          debugMode: false
        }
      });

      const defaultState = () => {
        const boxId = uid('box');
        const tabId = uid('tab');
        const cardId = uid('card');
        
        return {
          settings: defaultSettings(),
          boxes: [{
            id: boxId,
            name: 'My First Box',
            collapsed: false,
            order: 0,
            createdAt: now(),
            updatedAt: now()
          }],
          tabs: [{
            id: tabId,
            boxId: boxId,
            name: 'Getting Started',
            icon: '👋',
            color: '#0ea5e9',
            pinned: false,
            order: 0,
            createdAt: now(),
            updatedAt: now()
          }],
          cards: [{
            id: cardId,
            tabId: tabId,
            title: 'Welcome to Boxy!',
            content: `# Welcome! 👋

Boxy is your **offline** clipboard manager.

## Quick Start
- Create **Boxes** to organize tabs
- Add **Tabs** inside boxes (max 12)
- Create **Cards** with markdown

## Features
- \`{{variables}}\` for templates
- Drag & drop cards
- Pin important items
- History tracking

> All data is stored locally.`,
            tags: ['welcome', 'guide'],
            pinned: true,
            copyCount: 0,
            order: 0,
            createdAt: now(),
            updatedAt: now(),
            history: [{ action: 'created', at: now() }],
            table: {
              useDefault: true,
              columns: [{ id: uid('col'), header: 'Time' }, { id: uid('col'), header: 'Action' }],
              rows: []
            }
          }],
          allTags: ['welcome', 'guide'],
          trash: []
        };
      };

      // Migration: data
      const migrateData = (data) => {
        if (!data || typeof data !== 'object') {
          return null;
        }

        // Already new format (has boxes AND tabs arrays)
        if (Array.isArray(data.boxes) && Array.isArray(data.tabs)) {
          // Ensure all required fields exist
          data.settings = { ...defaultSettings(), ...(data.settings || {}) };
          data.allTags = data.allTags || [];
          data.trash = data.trash || [];
          return data;
        }

        // Old format: has groups array (v1.0)
        if (Array.isArray(data.groups)) {
          console.log('[Boxy] Migrating v1.0 → v1.0.23');
          
          const boxId = uid('box');
          const newData = {
            settings: {
              ...defaultSettings(),
              theme: data.settings?.theme || 'dark'
            },
            boxes: [{
              id: boxId,
              name: 'Migrated Box',
              collapsed: false,
              order: 0,
              createdAt: now(),
              updatedAt: now()
            }],
            tabs: [],
            cards: [],
            allTags: [],
            trash: data.trash || []
          };

          // Convert groups to tabs
          (data.groups || []).forEach((group, i) => {
            newData.tabs.push({
              id: group.id || uid('tab'),
              boxId: boxId,
              name: group.name || 'Untitled Tab',
              icon: group.icon || '📁',
              color: group.color || '#0ea5e9',
              pinned: false,
              collapsed: group.collapsed || false,
              order: group.order ?? i,
              createdAt: group.createdAt || now(),
              updatedAt: group.updatedAt || now()
            });
          });

          // Convert cards (groupId → tabId)
          (data.cards || []).forEach((card, i) => {
            const tags = Array.isArray(card.tags) ? card.tags : [];
            tags.forEach(t => {
              if (t && !newData.allTags.includes(t)) {
                newData.allTags.push(t);
              }
            });

            newData.cards.push({
              id: card.id || uid('card'),
              tabId: card.groupId || null,
              title: card.title || 'Untitled',
              content: card.content || '',
              tags: tags,
              pinned: card.pinned || false,
              copyCount: card.copyCount || 0,
              order: card.order ?? i,
              createdAt: card.createdAt || now(),
              updatedAt: card.updatedAt || now(),
              history: [{ action: 'migrated', at: now() }],
              table: {
                useDefault: true,
                columns: [{ id: uid('col'), header: 'Time' }, { id: uid('col'), header: 'Action' }],
                rows: []
              }
            });
          });

          return newData;
        }

        // Unknown format
        return null;
      };

      const loadState = () => {
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (!raw) return defaultState();
          
          const parsed = JSON.parse(raw);
          if (!parsed || typeof parsed !== 'object') return defaultState();
          
          return migrateData(parsed);
        } catch (err) {
          console.error('[Boxy] Failed to load state:', err);
          return defaultState();
        }
      };

      const saveState = () => {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (err) {
          console.error('[Boxy] Failed to save state:', err);
          toast({ type: 'error', title: 'Failed to save', message: 'Storage may be full' });
        }
      };

      // Global state
      let state = loadState();

      /* ============================================
         TOAST NOTIFICATION SYSTEM
      ============================================ */
      const toastContainer = $('#toastContainer');
      let toastQueue = [];

      const toast = (options) => {
        const {
          type = 'info',
          title = '',
          message = '',
          duration = 4000,
          actions = null
        } = options;

        const id = uid('toast');
        
        const iconMap = {
          success: 'check-circle',
          error: 'x-circle',
          warning: 'alert-circle',
          info: 'info'
        };

        const toastEl = document.createElement('div');
        toastEl.className = `toast toast-${type}`;
        toastEl.id = id;
        
        toastEl.innerHTML = `
          <div class="toast-icon">
            ${renderIcon(iconMap[type])}
          </div>
          <div class="toast-content">
            <div class="toast-title">${escapeHtml(title)}</div>
            ${message ? `<div class="toast-message">${escapeHtml(message)}</div>` : ''}
            ${actions ? '<div class="toast-actions" id="toast-actions-' + id + '"></div>' : ''}
          </div>
          <button class="toast-close" data-toast-close="${id}">
            ${renderIcon('x')}
          </button>
          ${duration > 0 ? `<div class="toast-progress animate" style="animation-duration: ${duration}ms"></div>` : ''}
        `;

        toastContainer.appendChild(toastEl);
        hydrateIcons(toastEl);

        // Add action buttons if provided
        if (actions) {
          const actionsEl = $(`#toast-actions-${id}`);
          actions.forEach(action => {
            const btn = document.createElement('button');
            btn.className = `btn btn-sm ${action.primary ? 'btn-primary' : ''}`;
            btn.textContent = action.label;
            btn.addEventListener('click', () => {
              if (action.onClick) action.onClick();
              dismissToast(id);
            });
            actionsEl.appendChild(btn);
          });
        }

        // Close button handler
        toastEl.querySelector('[data-toast-close]').addEventListener('click', () => {
          dismissToast(id);
        });

        // Auto dismiss
        if (duration > 0) {
          setTimeout(() => dismissToast(id), duration);
        }

        return id;
      };

      const dismissToast = (id) => {
        const toastEl = $(`#${id}`);
        if (!toastEl) return;
        
        toastEl.classList.add('toast-exit');
        setTimeout(() => toastEl.remove(), 200);
      };

      /* ============================================
         TOOLTIP SYSTEM
      ============================================ */
      let tooltipEl = null;
      let tooltipText = null;
      let tooltipTimeout = null;

      const initTooltip = () => {
        tooltipEl = $('#tooltip');
        tooltipText = tooltipEl?.querySelector('.tooltip-text');
      };

      const showTooltip = (target, text) => {
        if (!tooltipEl || !tooltipText || !text) return;
        
        clearTimeout(tooltipTimeout);
        
        // Ensure logo icon exists
        const logoEl = tooltipEl.querySelector('.tooltip-logo');
        if (logoEl && !logoEl.innerHTML.trim()) {
          logoEl.innerHTML = ICONS.box || '';
        }
        
        tooltipText.textContent = text;
        tooltipEl.classList.add('visible');
        
        // Position tooltip after making visible
        requestAnimationFrame(() => {
          const rect = target.getBoundingClientRect();
          const tipRect = tooltipEl.getBoundingClientRect();
          
          let top = rect.top - tipRect.height - 8;
          let left = rect.left + (rect.width / 2) - (tipRect.width / 2);
          
          // Keep within viewport
          if (top < 8) {
            top = rect.bottom + 8;
          }
          if (left < 8) left = 8;
          if (left + tipRect.width > window.innerWidth - 8) {
            left = window.innerWidth - tipRect.width - 8;
          }
          
          tooltipEl.style.top = top + 'px';
          tooltipEl.style.left = left + 'px';
        });
      };

      const hideTooltip = () => {
        clearTimeout(tooltipTimeout);
        tooltipTimeout = setTimeout(() => {
          if (tooltipEl) {
            tooltipEl.classList.remove('visible');
          }
        }, 50);
      };

      // Tooltip delegation - use mouseover/mouseout for better capture
      document.addEventListener('mouseover', (e) => {
        const target = e.target.closest('[data-tooltip]');
        if (target && target.dataset.tooltip) {
          showTooltip(target, target.dataset.tooltip);
        }
      });

      document.addEventListener('mouseout', (e) => {
        const target = e.target.closest('[data-tooltip]');
        if (target) {
          hideTooltip();
        }
      });

      // Initialize tooltip on DOM ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTooltip);
      } else {
        initTooltip();
      }

      /* ============================================
         MODAL SYSTEM
      ============================================ */
      let activeModal = null;
      let modalResolve = null;

      const openModal = (modalId) => {
        const modal = $(`#${modalId}`);
        if (!modal) return;
        
        modal.classList.add('open');
        activeModal = modalId;
        
        // Focus first input
        setTimeout(() => {
          const input = modal.querySelector('input, textarea, select');
          if (input) input.focus();
        }, 100);
      };

      const closeModal = (modalId) => {
        const modal = $(`#${modalId || activeModal}`);
        if (!modal) return;
        
        modal.classList.remove('open');
        activeModal = null;
        
        if (modalResolve) {
          modalResolve(null);
          modalResolve = null;
        }
      };

      const closeAllModals = () => {
        $$('.modal-overlay.open').forEach(m => m.classList.remove('open'));
        activeModal = null;
      };

      // Modal backdrop click to close
      document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) {
          closeModal();
        }
        if (e.target.closest('[data-modal-close]')) {
          closeModal();
        }
      });

      // Escape key to close modal
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && activeModal) {
          closeModal();
        }
      });

      /* ============================================
         CONFIRM DIALOG
      ============================================ */
      const confirm = ({ title = 'Confirm', message = '', confirmText = 'Confirm', cancelText = 'Cancel', danger = false }) => {
        return new Promise((resolve) => {
          const modal = $('#modalConfirm');
          const titleEl = $('#confirmTitle');
          const messageEl = $('#confirmMessage');
          const footerEl = $('#confirmFooter');
          
          titleEl.textContent = title;
          messageEl.textContent = message;
          
          footerEl.innerHTML = `
            <button class="btn btn-ghost" data-action="cancel">${escapeHtml(cancelText)}</button>
            <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-action="confirm">${escapeHtml(confirmText)}</button>
          `;
          
          const handleAction = (e) => {
            const action = e.target.dataset.action;
            if (action === 'confirm') {
              resolve(true);
            } else if (action === 'cancel') {
              resolve(false);
            }
            closeModal('modalConfirm');
            footerEl.removeEventListener('click', handleAction);
          };
          
          footerEl.addEventListener('click', handleAction);
          openModal('modalConfirm');
        });
      };

      /* ============================================
         THEME MANAGEMENT
      ============================================ */
      const setTheme = (theme) => {
        state.settings.theme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        saveState();
      };

      const toggleTheme = () => {
        const newTheme = state.settings.theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        toast({ type: 'info', title: `${newTheme === 'dark' ? '🌙' : '☀️'} Theme changed`, duration: 2000 });
      };

      const setPrimaryColor = (color) => {
        state.settings.primaryColor = color;
        
        // Add to recent colors
        const recent = state.settings.recentColors.filter(c => c !== color);
        recent.unshift(color);
        state.settings.recentColors = recent.slice(0, 5);
        
        document.documentElement.style.setProperty('--primary', color);
        saveState();
      };

      /* ============================================
         DROPDOWN MANAGEMENT
      ============================================ */
      const closeAllDropdowns = () => {
        $$('.dropdown.open').forEach(d => d.classList.remove('open'));
      };

      document.addEventListener('click', (e) => {
        const dropdown = e.target.closest('.dropdown');
        const trigger = e.target.closest('[data-dropdown-trigger]');
        
        if (trigger && dropdown) {
          e.stopPropagation();
          const isOpen = dropdown.classList.contains('open');
          closeAllDropdowns();
          if (!isOpen) dropdown.classList.add('open');
        } else if (!e.target.closest('.dropdown-menu')) {
          closeAllDropdowns();
        }
      });

      /* ============================================
         EXPORT FOR GLOBAL ACCESS
      ============================================ */
      window.Boxy = {
        // State
        state,
        saveState,
        loadState,
        
        // Utils
        uid,
        now,
        escapeHtml,
        debounce,
        throttle,
        timeAgo,
        formatDate,
        parseTags,
        copyToClipboard,
        
        // Icons
        ICONS,
        renderIcon,
        hydrateIcons,
        
        // UI
        toast,
        dismissToast,
        showTooltip,
        hideTooltip,
        openModal,
        closeModal,
        closeAllModals,
        confirm,
        closeAllDropdowns,
        
        // Theme
        setTheme,
        toggleTheme,
        setPrimaryColor,
        
        // Selectors
        $,
        $$
      };

      // Initialize theme on load
      setTheme(state.settings.theme);
      hydrateIcons();

      // Export migrateData for use in other modules
      window.Boxy.migrateData = migrateData;
      window.Boxy.defaultSettings = defaultSettings;

      console.log('[Boxy] Core initialized v1.0.23');
    })();

    ;(() => {
      'use strict';

      const { state, saveState, uid, now, escapeHtml, timeAgo, formatDate, parseTags,
              renderIcon, hydrateIcons, toast, confirm, openModal, closeModal,
              $, $$ } = window.Boxy;

      /* ============================================
         MARKDOWN PARSER (Simple)
      ============================================ */
      const parseMarkdown = (text) => {
        if (!text) return '';
        
        let html = escapeHtml(text);
        
        // Code blocks (```...```)
        html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
        
        // Inline code (`...`)
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        // Headers
        html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
        html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
        html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
        
        // Bold & Italic
        html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');
        html = html.replace(/_([^_]+)_/g, '<em>$1</em>');
        
        // Strikethrough
        html = html.replace(/~~([^~]+)~~/g, '<del>$1</del>');
        
        // Links
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
        
        // Blockquote
        html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');
        
        // Horizontal rule
        html = html.replace(/^---$/gm, '<hr>');
        
        // Unordered list
        html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
        html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
        
        // Ordered list
        html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
        
        // Variables highlight
        html = html.replace(/\{\{([^}]+)\}\}/g, '<span class="variable-highlight">{{$1}}</span>');
        
        // Paragraphs
        html = html.replace(/^([^<\n].+)$/gm, '<p>$1</p>');
        html = html.replace(/<p><\/p>/g, '');
        
        return html;
      };

      /* ============================================
         DATA GETTERS
      ============================================ */
      const getBoxes = () => {
        return [...state.boxes].sort((a, b) => a.order - b.order);
      };

      const getTabsForBox = (boxId) => {
        return state.tabs
          .filter(t => t.boxId === boxId)
          .sort((a, b) => {
            // Pinned first
            if (a.pinned !== b.pinned) return b.pinned ? 1 : -1;
            return a.order - b.order;
          });
      };

      const getCardsForTab = (tabId, searchQuery = '') => {
        const q = searchQuery.toLowerCase().trim();
        let cards = state.cards.filter(c => c.tabId === tabId);
        
        if (q) {
          cards = cards.filter(c => {
            const haystack = [c.title, c.content, ...(c.tags || [])].join(' ').toLowerCase();
            return haystack.includes(q);
          });
        }
        
        return cards.sort((a, b) => {
          if (a.pinned !== b.pinned) return b.pinned ? 1 : -1;
          return a.order - b.order;
        });
      };

      const getCardsWithoutTab = (searchQuery = '') => {
        const q = searchQuery.toLowerCase().trim();
        let cards = state.cards.filter(c => !c.tabId);
        
        if (q) {
          cards = cards.filter(c => {
            const haystack = [c.title, c.content, ...(c.tags || [])].join(' ').toLowerCase();
            return haystack.includes(q);
          });
        }
        
        return cards.sort((a, b) => {
          if (a.pinned !== b.pinned) return b.pinned ? 1 : -1;
          return a.order - b.order;
        });
      };

      const getTabLimit = () => {
        return state.settings.advanced.bypassTabLimit ? 999 : 12;
      };

      const getColumnLimit = () => {
        return state.settings.advanced.bypassColumnLimit ? 999 : 10;
      };

      /* ============================================
         BOX CRUD
      ============================================ */
      const createBox = (name) => {
        const box = {
          id: uid('box'),
          name: name || 'New Box',
          collapsed: false,
          order: state.boxes.length,
          createdAt: now(),
          updatedAt: now()
        };
        state.boxes.push(box);
        saveState();
        return box;
      };

      const updateBox = (boxId, updates) => {
        const box = state.boxes.find(b => b.id === boxId);
        if (!box) return null;
        
        Object.assign(box, updates, { updatedAt: now() });
        saveState();
        return box;
      };

      const deleteBox = async (boxId) => {
        const box = state.boxes.find(b => b.id === boxId);
        if (!box) return false;
        
        const tabs = getTabsForBox(boxId);
        const cardCount = tabs.reduce((sum, t) => sum + getCardsForTab(t.id).length, 0);
        
        const confirmed = await confirm({
          title: 'Delete Box',
          message: `Delete "${box.name}"? This will also delete ${tabs.length} tab(s) and ${cardCount} card(s).`,
          confirmText: 'Delete',
          danger: true
        });
        
        if (!confirmed) return false;
        
        // Delete all cards in this box's tabs
        tabs.forEach(tab => {
          state.cards = state.cards.filter(c => c.tabId !== tab.id);
        });
        
        // Delete all tabs
        state.tabs = state.tabs.filter(t => t.boxId !== boxId);
        
        // Delete box
        state.boxes = state.boxes.filter(b => b.id !== boxId);
        
        saveState();
        toast({ type: 'warning', title: 'Box deleted', message: box.name });
        return true;
      };

      const toggleBoxCollapse = (boxId) => {
        const box = state.boxes.find(b => b.id === boxId);
        if (!box) return;
        
        box.collapsed = !box.collapsed;
        box.updatedAt = now();
        saveState();
      };

      /* ============================================
         TAB CRUD
      ============================================ */
      const createTab = (boxId, data = {}) => {
        const tabs = getTabsForBox(boxId);
        
        if (tabs.length >= getTabLimit()) {
          toast({ type: 'error', title: 'Tab limit reached', message: `Max ${getTabLimit()} tabs per box` });
          return null;
        }
        
        const tab = {
          id: uid('tab'),
          boxId: boxId,
          name: data.name || 'New Tab',
          icon: data.icon || '📁',
          color: data.color || '#0ea5e9',
          pinned: false,
          order: tabs.length,
          createdAt: now(),
          updatedAt: now()
        };
        
        state.tabs.push(tab);
        saveState();
        return tab;
      };

      const updateTab = (tabId, updates) => {
        const tab = state.tabs.find(t => t.id === tabId);
        if (!tab) return null;
        
        Object.assign(tab, updates, { updatedAt: now() });
        saveState();
        return tab;
      };

      const deleteTab = async (tabId) => {
        const tab = state.tabs.find(t => t.id === tabId);
        if (!tab) return false;
        
        const cards = getCardsForTab(tabId);
        
        const confirmed = await confirm({
          title: 'Delete Tab',
          message: `Delete "${tab.name}"? ${cards.length} card(s) will be moved to ungrouped.`,
          confirmText: 'Delete',
          danger: true
        });
        
        if (!confirmed) return false;
        
        // Move cards to ungrouped
        cards.forEach(card => {
          card.tabId = null;
          card.updatedAt = now();
        });
        
        // Delete tab
        state.tabs = state.tabs.filter(t => t.id !== tabId);
        
        saveState();
        toast({ type: 'warning', title: 'Tab deleted', message: `Cards moved to ungrouped` });
        return true;
      };

      const toggleTabPin = (tabId) => {
        const tab = state.tabs.find(t => t.id === tabId);
        if (!tab) return;
        
        tab.pinned = !tab.pinned;
        tab.updatedAt = now();
        saveState();
        
        toast({ type: 'info', title: tab.pinned ? 'Tab pinned' : 'Tab unpinned', duration: 2000 });
      };

      const moveTabToBox = (tabId, newBoxId) => {
        const tab = state.tabs.find(t => t.id === tabId);
        if (!tab || tab.boxId === newBoxId) return;
        
        const targetTabs = getTabsForBox(newBoxId);
        if (targetTabs.length >= getTabLimit()) {
          toast({ type: 'error', title: 'Cannot move', message: 'Target box is full' });
          return;
        }
        
        tab.boxId = newBoxId;
        tab.order = targetTabs.length;
        tab.updatedAt = now();
        saveState();
      };

      const reorderTabs = (boxId, tabIds) => {
        tabIds.forEach((id, index) => {
          const tab = state.tabs.find(t => t.id === id);
          if (tab) tab.order = index;
        });
        saveState();
      };

      /* ============================================
         CARD CRUD
      ============================================ */
      const createCard = (tabId, data = {}) => {
        const card = {
          id: uid('card'),
          tabId: tabId,
          title: data.title || 'Untitled',
          content: data.content || '',
          tags: data.tags || [],
          pinned: data.pinned || false,
          copyCount: 0,
          order: state.cards.filter(c => c.tabId === tabId).length,
          createdAt: now(),
          updatedAt: now(),
          history: [{ action: 'created', at: now() }],
          table: {
            useDefault: true,
            columns: [
              { id: uid('col'), header: 'Time' },
              { id: uid('col'), header: 'Action' }
            ],
            rows: []
          }
        };
        
        // Add tags to allTags
        (data.tags || []).forEach(tag => {
          if (!state.allTags.includes(tag)) {
            state.allTags.push(tag);
          }
        });
        
        state.cards.push(card);
        saveState();
        return card;
      };

      const updateCard = (cardId, updates) => {
        const card = state.cards.find(c => c.id === cardId);
        if (!card) return null;
        
        Object.assign(card, updates, { updatedAt: now() });
        
        // Record history
        if (state.settings.features.autoRecordHistory) {
          addCardHistory(cardId, 'edited');
        }
        
        // Update allTags
        (updates.tags || []).forEach(tag => {
          if (!state.allTags.includes(tag)) {
            state.allTags.push(tag);
          }
        });
        
        saveState();
        return card;
      };

      const deleteCard = async (cardId, skipConfirm = false) => {
        const card = state.cards.find(c => c.id === cardId);
        if (!card) return false;
        
        if (!skipConfirm) {
          const confirmed = await confirm({
            title: 'Delete Card',
            message: `Delete "${card.title}"?`,
            confirmText: 'Delete',
            danger: true
          });
          
          if (!confirmed) return false;
        }
        
        // Move to trash
        state.trash.push({ ...card, deletedAt: now() });
        if (state.trash.length > 50) state.trash.shift();
        
        // Remove card
        state.cards = state.cards.filter(c => c.id !== cardId);
        
        saveState();
        
        toast({
          type: 'warning',
          title: 'Card deleted',
          message: card.title,
          duration: 6000,
          actions: [{
            label: 'Undo',
            primary: true,
            onClick: () => restoreCard(card.id)
          }]
        });
        
        return true;
      };

      const restoreCard = (cardId) => {
        const trashItem = state.trash.find(t => t.id === cardId);
        if (!trashItem) return;
        
        delete trashItem.deletedAt;
        state.cards.push(trashItem);
        state.trash = state.trash.filter(t => t.id !== cardId);
        
        saveState();
        render();
        toast({ type: 'success', title: 'Card restored' });
      };

      const toggleCardPin = (cardId) => {
        const card = state.cards.find(c => c.id === cardId);
        if (!card) return;
        
        card.pinned = !card.pinned;
        card.updatedAt = now();
        saveState();
        
        toast({ type: 'info', title: card.pinned ? 'Card pinned' : 'Card unpinned', duration: 2000 });
      };

      const addCardHistory = (cardId, action) => {
        const card = state.cards.find(c => c.id === cardId);
        if (!card || !card.history) return;
        
        card.history.unshift({ action, at: now() });
        if (card.history.length > 4) card.history = card.history.slice(0, 4);
      };

      const incrementCopyCount = (cardId) => {
        const card = state.cards.find(c => c.id === cardId);
        if (!card) return;
        
        card.copyCount = (card.copyCount || 0) + 1;
        card.updatedAt = now();
        
        if (state.settings.features.autoRecordHistory) {
          addCardHistory(cardId, 'copied');
        }
        
        saveState();
      };

      const moveCardToTab = (cardId, newTabId) => {
        const card = state.cards.find(c => c.id === cardId);
        if (!card) return;
        
        card.tabId = newTabId;
        card.order = state.cards.filter(c => c.tabId === newTabId).length;
        card.updatedAt = now();
        saveState();
      };

      const reorderCards = (tabId, cardIds) => {
        cardIds.forEach((id, index) => {
          const card = state.cards.find(c => c.id === id);
          if (card) card.order = index;
        });
        saveState();
      };

      /* ============================================
         TAG AUTOCOMPLETE
      ============================================ */
      const getTagSuggestions = (query) => {
        if (!query || query.length < 1) return [];
        
        const q = query.toLowerCase();
        return state.allTags
          .filter(tag => tag.toLowerCase().includes(q) && tag.toLowerCase() !== q)
          .slice(0, 8);
      };

      /* ============================================
         RENDER FUNCTIONS
      ============================================ */
      const renderHeader = () => {
        const header = $('#appHeader');
        header.innerHTML = `
          <div class="header">
            <div class="header-brand">
              <div class="header-logo" data-tooltip="Boxy v1.0.23">
                ${renderIcon('box', 'icon-lg')}
              </div>
              <div class="header-info">
                <h1>Boxy</h1>
                <p>Your offline clipboard manager</p>
              </div>
            </div>
            <div class="header-actions">
              <button class="btn btn-icon" id="btnTheme" data-tooltip="Toggle theme">
                ${renderIcon(state.settings.theme === 'dark' ? 'sun' : 'moon')}
              </button>
              <button class="btn" id="btnExport" data-tooltip="Export all data">
                ${renderIcon('download')}
                <span class="btn-text">Export</span>
              </button>
              <label class="btn" data-tooltip="Import data" tabindex="0">
                ${renderIcon('upload')}
                <span class="btn-text">Import</span>
                <input type="file" id="fileImport" accept=".json" hidden>
              </label>
            </div>
          </div>
        `;
        hydrateIcons(header);
      };

      const renderToolbar = () => {
        const toolbar = $('#appToolbar');
        const hasBoxes = state.boxes.length > 0;
        const hasTabs = state.tabs.length > 0;
        
        toolbar.innerHTML = `
          <div class="toolbar">
            <div class="toolbar-search">
              ${renderIcon('search')}
              <input type="search" id="searchInput" placeholder="Search cards... (try :help)" autocomplete="off">
              <div class="search-results" id="searchResults"></div>
            </div>
            <div class="toolbar-divider"></div>
            <div class="toolbar-group">
              <button class="btn btn-primary" id="btnNewBox" data-tooltip="Create new box">
                ${renderIcon('box')}
                <span>New Box</span>
              </button>
              <button class="btn" id="btnNewTab" ${!hasBoxes ? 'disabled' : ''} data-tooltip="${hasBoxes ? 'Create new tab' : 'Create a box first'}">
                ${renderIcon('folder-plus')}
                <span>New Tab</span>
              </button>
              <button class="btn" id="btnNewCard" ${!hasTabs ? 'disabled' : ''} data-tooltip="${hasTabs ? 'Create new card' : 'Create a tab first'}">
                ${renderIcon('file-plus')}
                <span>New Card</span>
              </button>
            </div>
          </div>
        `;
        hydrateIcons(toolbar);
      };

      const renderBox = (box) => {
        const tabs = getTabsForBox(box.id);
        const activeTab = tabs[0];
        const tabCount = tabs.length;
        const tabLimit = getTabLimit();
        
        return `
          <section class="box ${box.collapsed ? 'collapsed' : ''}" data-box-id="${box.id}">
            <div class="box-titlebar">
              <div class="box-titlebar-left">
                <div class="box-icon">
                  ${renderIcon('box')}
                </div>
                <span class="box-name">${escapeHtml(box.name)}</span>
              </div>
              <div class="box-controls">
                <button class="box-ctrl-btn" data-action="collapse-box" data-tooltip="${box.collapsed ? 'Expand' : 'Collapse'}">
                  ${renderIcon(box.collapsed ? 'maximize' : 'minimize')}
                </button>
                <button class="box-ctrl-btn" data-action="edit-box" data-tooltip="Edit box">
                  ${renderIcon('edit')}
                </button>
                <button class="box-ctrl-btn close" data-action="delete-box" data-tooltip="Delete box">
                  ${renderIcon('x')}
                </button>
              </div>
            </div>
            
            <div class="box-tabbar">
              <div class="box-tabs" data-box-id="${box.id}">
                ${tabs.map((tab, i) => renderTab(tab, i === 0)).join('')}
              </div>
              <button class="tab-add" data-action="add-tab" ${tabCount >= tabLimit ? 'disabled' : ''} 
                      data-tooltip="${tabCount >= tabLimit ? `Limit: ${tabLimit} tabs` : 'Add tab'}">
                ${renderIcon('plus')}
              </button>
            </div>
            
            <div class="box-addressbar">
              <div class="box-nav">
                <span class="box-nav-btn">${renderIcon('chevron-left')}</span>
                <span class="box-nav-btn">${renderIcon('chevron-right')}</span>
              </div>
              <div class="box-address">
                <span class="box-address-icon">${renderIcon('folder')}</span>
                <span class="box-address-text" id="addressText-${box.id}">
                  ${activeTab ? `${activeTab.icon} ${activeTab.name}` : 'No tabs'} • 
                  ${activeTab ? getCardsForTab(activeTab.id).length : 0} cards
                </span>
              </div>
              <div class="box-toolbar">
                <button class="box-tool-btn" data-action="add-card-to-tab" data-tooltip="Add card">
                  ${renderIcon('plus')}
                </button>
                <div class="dropdown">
                  <button class="box-tool-btn" data-dropdown-trigger data-tooltip="More options">
                    ${renderIcon('more-vertical')}
                  </button>
                  <div class="dropdown-menu">
                    <button class="dropdown-item" data-action="export-box">
                      ${renderIcon('download')}
                      <span>Export Box</span>
                    </button>
                    <div class="dropdown-divider"></div>
                    <button class="dropdown-item danger" data-action="delete-box">
                      ${renderIcon('trash')}
                      <span>Delete Box</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="box-content" id="boxContent-${box.id}">
              ${activeTab ? renderTabContent(activeTab.id) : renderEmptyState('No tabs yet', 'Create a tab to get started', 'folder-plus', 'add-tab')}
            </div>
          </section>
        `;
      };

      const renderTab = (tab, isActive = false) => {
        return `
          <button class="tab ${isActive ? 'active' : ''} ${tab.pinned ? 'pinned' : ''}" 
                  data-tab-id="${tab.id}" draggable="true">
            <div class="tab-indicator" style="background: ${tab.color}"></div>
            <span class="tab-pin">${renderIcon('pin', 'icon-xs')}</span>
            <span class="tab-icon">${tab.icon}</span>
            <span class="tab-name">${escapeHtml(tab.name)}</span>
            <span class="tab-close" data-action="close-tab" data-tab-id="${tab.id}">
              ${renderIcon('x', 'icon-xs')}
            </span>
          </button>
        `;
      };

      const renderTabContent = (tabId, searchQuery = '') => {
        const cards = getCardsForTab(tabId, searchQuery);
        
        if (cards.length === 0) {
          if (searchQuery) {
            return renderEmptyState('No results', `No cards match "${searchQuery}"`, 'search');
          }
          return renderEmptyState('No cards yet', 'Create your first card', 'file-plus', 'add-card-to-tab');
        }
        
        return `
          <div class="masonry-grid stagger-children">
            ${cards.map(card => renderCard(card)).join('')}
          </div>
        `;
      };

      const renderCard = (card) => {
        const preview = parseMarkdown(card.content);
        const historyRows = card.table?.useDefault && card.history 
          ? card.history.slice(0, 2) 
          : [];
        
        return `
          <article class="card" data-card-id="${card.id}" draggable="true">
            <div class="card-header">
              <div class="card-header-content">
                <h3 class="card-title">${escapeHtml(card.title) || 'Untitled'}</h3>
                <div class="card-meta">
                  ${card.pinned ? `<span class="badge badge-warning">${renderIcon('pin', 'icon-xs')} Pinned</span>` : ''}
                </div>
              </div>
              <button class="card-pin-btn ${card.pinned ? 'active' : ''}" data-action="toggle-pin" data-tooltip="${card.pinned ? 'Unpin' : 'Pin'}">
                ${renderIcon('pin')}
              </button>
            </div>
            
            <div class="card-body">
              <div class="card-preview">
                <div class="markdown-body">${preview}</div>
              </div>
            </div>
            
            ${card.tags?.length ? `
              <div class="card-tags">
                ${card.tags.map(t => `<span class="card-tag">#${escapeHtml(t)}</span>`).join('')}
              </div>
            ` : ''}
            
            ${historyRows.length && state.settings.features.tableInCards ? `
              <div class="card-table-wrapper">
                <div class="card-table">
                  <div class="card-table-header">table</div>
                  <div class="card-table-body">
                    ${historyRows.map(h => `
                      <div class="card-table-row">
                        <div class="card-table-cell">${formatDate(h.at)}</div>
                        <div class="card-table-cell">${h.action}</div>
                      </div>
                    `).join('')}
                  </div>
                </div>
              </div>
            ` : ''}
            
            <div class="card-footer">
              <div class="card-actions">
                <button class="btn btn-sm btn-primary" data-action="copy-card">
                  ${renderIcon('copy', 'icon-sm')}
                  Copy
                </button>
                <button class="btn btn-sm" data-action="edit-card">
                  ${renderIcon('edit', 'icon-sm')}
                  Edit
                </button>
                <button class="btn btn-sm btn-icon btn-ghost" data-action="delete-card" data-tooltip="Delete">
                  ${renderIcon('trash', 'icon-sm')}
                </button>
              </div>
              <div class="card-stats">
                <span class="card-stat">
                  ${renderIcon('copy', 'icon-xs')}
                  ${card.copyCount || 0}x
                </span>
                <span>•</span>
                <span class="card-stat">
                  ${renderIcon('clock', 'icon-xs')}
                  ${timeAgo(card.updatedAt)}
                </span>
              </div>
            </div>
          </article>
        `;
      };

      const renderEmptyState = (title, text, icon = 'file', action = null) => {
        return `
          <div class="empty-state">
            <span class="icon" style="width: 48px; height: 48px; color: var(--text-disabled); margin-bottom: 12px;">
              ${ICONS[icon] || ICONS.file}
            </span>
            <div class="empty-state-title">${escapeHtml(title)}</div>
            <div class="empty-state-text">${escapeHtml(text)}</div>
            ${action ? `
              <button class="btn btn-primary" data-action="${action}">
                <span class="icon" style="width: 16px; height: 16px;">${ICONS.plus}</span>
                Create
              </button>
            ` : ''}
          </div>
        `;
      };

      const renderFooter = () => {
        const footer = $('#appFooter');
        footer.innerHTML = `
          <span class="footer-hidden-link" id="synboxyLink" data-tooltip="Settings">synboxy</span>
        `;
      };

      /* ============================================
         MAIN RENDER
      ============================================ */
      let isInitialRender = true;
      
      const render = () => {
        const searchQuery = $('#searchInput')?.value || '';
        
        // Only render header/toolbar/footer on first render
        if (isInitialRender) {
          renderHeader();
          renderToolbar();
          renderFooter();
          isInitialRender = false;
          
          // Attach static event listeners after first render
          attachStaticListeners();
        }
        
        // Update toolbar button states
        updateToolbarState();
        
        renderMainContent();
      };

            /* ============================================
         UPDATE TOOLBAR STATE (Without re-render)
      ============================================ */
      const updateToolbarState = () => {
        const hasBoxes = state.boxes.length > 0;
        const hasTabs = state.tabs.length > 0;
        
        const btnNewTab = $('#btnNewTab');
        const btnNewCard = $('#btnNewCard');
        
        if (btnNewTab) {
          btnNewTab.disabled = !hasBoxes;
          btnNewTab.dataset.tooltip = hasBoxes ? 'Create new tab' : 'Create a box first';
        }
        
        if (btnNewCard) {
          btnNewCard.disabled = !hasTabs;
          btnNewCard.dataset.tooltip = hasTabs ? 'Create new card' : 'Create a tab first';
        }
      };

      /* ============================================
         STATIC EVENT LISTENERS (Called once)
      ============================================ */
      const attachStaticListeners = () => {
        // Theme toggle
        const themeBtn = $('#btnTheme');
        if (themeBtn) {
          themeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Toggle theme
            const newTheme = state.settings.theme === 'dark' ? 'light' : 'dark';
            state.settings.theme = newTheme;
            document.documentElement.setAttribute('data-theme', newTheme);
            saveState();
            
            // Update icon
            themeBtn.innerHTML = renderIcon(newTheme === 'dark' ? 'sun' : 'moon');
            hydrateIcons(themeBtn);
            
            toast({ type: 'info', title: `Theme: ${newTheme}`, duration: 1500 });
          });
        }
        
        // Export button
        $('#btnExport')?.addEventListener('click', () => {
          window.Boxy.exportAll?.();
        });
        
        // Import file input
        $('#fileImport')?.addEventListener('change', (e) => {
          const file = e.target.files?.[0];
          if (file) {
            window.Boxy.importData?.(file);
            e.target.value = '';
          }
        });
        
        // New Box button
        $('#btnNewBox')?.addEventListener('click', () => {
          window.Boxy.showBoxModal?.();
        });
        
        // New Tab button
        $('#btnNewTab')?.addEventListener('click', () => {
          if (state.boxes.length === 0) {
            toast({ type: 'error', title: 'Create a box first' });
            return;
          }
          window.Boxy.showTabModal?.();
        });
        
        // New Card button
        $('#btnNewCard')?.addEventListener('click', () => {
          if (state.tabs.length === 0) {
            toast({ type: 'error', title: 'Create a tab first' });
            return;
          }
          window.Boxy.showCardModal?.();
        });
        
        // Search input with results dropdown
        const searchInput = $('#searchInput');
        if (searchInput) {
          let searchTimeout;
          
          searchInput.addEventListener('input', (e) => {
            e.stopPropagation();
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
              performSearch(searchInput.value);
            }, 150);
          });
          
          searchInput.addEventListener('focus', () => {
            if (searchInput.value.trim()) {
              performSearch(searchInput.value);
            }
          });
          
          searchInput.addEventListener('keydown', (e) => {
            const resultsEl = $('#searchResults');
            const isOpen = resultsEl?.classList.contains('open');
            
            if (!isOpen) return;

            if (e.key === 'ArrowDown') {
              e.preventDefault();
              searchActiveIndex = Math.min(searchActiveIndex + 1, searchResults.length - 1);
              updateSearchActiveItem();
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              searchActiveIndex = Math.max(searchActiveIndex - 1, -1);
              updateSearchActiveItem();
            } else if (e.key === 'Enter') {
              e.preventDefault();
              if (searchActiveIndex >= 0) {
                const activeItem = resultsEl.querySelector(`[data-index="${searchActiveIndex}"]`);
                if (activeItem) {
                  if (activeItem.dataset.command) {
                    const cmd = SEARCH_COMMANDS[activeItem.dataset.command];
                    if (cmd?.action) cmd.action();
                  } else if (activeItem.dataset.cardId) {
                    navigateToResult(
                      activeItem.dataset.cardId,
                      activeItem.dataset.tabId,
                      activeItem.dataset.boxId
                    );
                  }
                }
              }
            } else if (e.key === 'Escape') {
              e.preventDefault();
              hideSearchResults();
              searchInput.blur();
            }
          });

          // Click on search results
          document.addEventListener('click', (e) => {
            const resultItem = e.target.closest('.search-result-item');
            const commandItem = e.target.closest('.search-command');
            const resultsEl = $('#searchResults');

            if (resultItem) {
              e.preventDefault();
              navigateToResult(
                resultItem.dataset.cardId,
                resultItem.dataset.tabId,
                resultItem.dataset.boxId
              );
            } else if (commandItem) {
              e.preventDefault();
              const cmd = SEARCH_COMMANDS[commandItem.dataset.command];
              if (cmd?.action) cmd.action();
            } else if (resultsEl && !e.target.closest('.toolbar-search')) {
              hideSearchResults();
            }
          });
        }

        const updateSearchActiveItem = () => {
          const resultsEl = $('#searchResults');
          if (!resultsEl) return;
          
          resultsEl.querySelectorAll('.search-result-item, .search-command').forEach((el, i) => {
            el.classList.toggle('active', i === searchActiveIndex);
          });

          // Scroll active item into view
          const activeEl = resultsEl.querySelector('.active');
          if (activeEl) {
            activeEl.scrollIntoView({ block: 'nearest' });
          }
        };
        
        // synboxy (hidden settings)
        $('#synboxyLink')?.addEventListener('click', () => {
          window.Boxy.showSettingsModal?.();
        });
      };

      /* ============================================
         RENDER MAIN CONTENT ONLY
      ============================================ */
      const renderMainContent = (searchQueryParam) => {
        const searchQuery = searchQueryParam !== undefined ? searchQueryParam : ($('#searchInput')?.value || '');
        const main = $('#appMain');
        const boxes = getBoxes();
        const ungroupedCards = getCardsWithoutTab(searchQuery);
        
        if (boxes.length === 0 && ungroupedCards.length === 0) {
          main.innerHTML = `
            <div class="empty-state" style="padding: 60px 20px;">
              <span class="icon" style="width: 48px; height: 48px; color: var(--text-disabled); margin-bottom: 12px;">
                ${ICONS.box}
              </span>
              <div class="empty-state-title">Welcome to Boxy!</div>
              <div class="empty-state-text">Create your first box to get started</div>
              <button class="btn btn-primary" id="btnCreateFirstBox">
                <span class="icon" style="width: 16px; height: 16px;">${ICONS.plus}</span>
                Create Box
              </button>
            </div>
          `;
          
          // Attach create first box listener
          const createBtn = $('#btnCreateFirstBox');
          if (createBtn) {
            createBtn.addEventListener('click', () => {
              window.Boxy.showBoxModal?.();
            });
          }
          return;
        }
        
        let html = '';
        
        // Render ungrouped cards if any
        if (ungroupedCards.length > 0) {
          html += `
            <section class="box" data-box-id="ungrouped">
              <div class="box-titlebar">
                <div class="box-titlebar-left">
                  <div class="box-icon" style="background: var(--warning-subtle); color: var(--warning);">
                    ${renderIcon('file')}
                  </div>
                  <span class="box-name">Ungrouped Cards</span>
                </div>
              </div>
              <div class="box-content">
                <div class="masonry-grid stagger-children">
                  ${ungroupedCards.map(card => renderCard(card)).join('')}
                </div>
              </div>
            </section>
          `;
        }
        
        // Render boxes
        boxes.forEach(box => {
          html += renderBox(box);
        });
        
        main.innerHTML = html;
        hydrateIcons(main);
        setupMasonry();
      };

            /* ============================================
         SEARCH SYSTEM
      ============================================ */
      const SEARCH_COMMANDS = {
        ':help': { 
          icon: 'info', 
          name: 'Help & Commands', 
          desc: 'Show available commands',
          action: () => showSearchHelp()
        },
        ':theme': { 
          icon: 'sun', 
          name: 'Toggle Theme', 
          desc: 'Switch dark/light mode',
          action: () => { window.Boxy.toggleTheme?.(); hideSearchResults(); }
        },
        ':dark': { 
          icon: 'moon', 
          name: 'Dark Mode', 
          desc: 'Switch to dark theme',
          action: () => { setTheme('dark'); hideSearchResults(); toast({ type: 'info', title: 'Dark mode', duration: 1500 }); }
        },
        ':light': { 
          icon: 'sun', 
          name: 'Light Mode', 
          desc: 'Switch to light theme',
          action: () => { setTheme('light'); hideSearchResults(); toast({ type: 'info', title: 'Light mode', duration: 1500 }); }
        },
        ':stats': { 
          icon: 'table', 
          name: 'Statistics', 
          desc: 'Show data statistics',
          action: () => showStats()
        },
        ':export': { 
          icon: 'download', 
          name: 'Export All', 
          desc: 'Export all data to JSON',
          action: () => { window.Boxy.exportAll?.(); hideSearchResults(); }
        },
        ':settings': { 
          icon: 'settings', 
          name: 'Settings', 
          desc: 'Open hidden settings (synboxy)',
          action: () => { window.Boxy.showSettingsModal?.(); hideSearchResults(); }
        },
        ':new': { 
          icon: 'plus', 
          name: 'Quick Create', 
          desc: 'Create new box/tab/card',
          action: () => showQuickCreate()
        },
        ':clear': { 
          icon: 'trash', 
          name: 'Clear All Data', 
          desc: 'Delete everything (careful!)',
          action: () => clearAllData()
        },
        '?': { 
          icon: 'info', 
          name: 'Help & Commands', 
          desc: 'Show available commands',
          action: () => showSearchHelp()
        }
      };

      let searchActiveIndex = -1;
      let searchResults = [];

      const performSearch = (query) => {
        const resultsEl = $('#searchResults');
        if (!resultsEl) return;

        const q = query.trim();
        
        // Empty query - hide results
        if (!q) {
          hideSearchResults();
          return;
        }

        // Check for commands
        const lowerQ = q.toLowerCase();
        if (lowerQ.startsWith(':') || lowerQ === '?') {
          showCommandResults(q);
          return;
        }

        // Perform card search
        const results = searchCards(q);
        searchResults = results;
        searchActiveIndex = -1;

        if (results.length === 0) {
          resultsEl.innerHTML = `
            <div class="search-results-header">
              <span>Search Results</span>
              <span class="search-results-count">0 found</span>
            </div>
            <div class="search-empty">
              ${renderIcon('search')}
              <div>No results for "${escapeHtml(q)}"</div>
            </div>
            <div class="search-tip">
              <span>Try <kbd>:help</kbd> for commands</span>
            </div>
          `;
        } else {
          resultsEl.innerHTML = `
            <div class="search-results-header">
              <span>Search Results</span>
              <span class="search-results-count">${results.length} found</span>
            </div>
            ${results.slice(0, 10).map((r, i) => renderSearchResult(r, q, i)).join('')}
            ${results.length > 10 ? `
              <div class="search-empty" style="padding: var(--space-sm);">
                <small>+ ${results.length - 10} more results</small>
              </div>
            ` : ''}
            <div class="search-tip">
              <span><kbd>↑↓</kbd> navigate</span>
              <span><kbd>Enter</kbd> select</span>
              <span><kbd>Esc</kbd> close</span>
            </div>
          `;
        }

        resultsEl.classList.add('open');
        hydrateIcons(resultsEl);
      };

      const searchCards = (query) => {
        const q = query.toLowerCase();
        const results = [];

        state.cards.forEach(card => {
          let score = 0;
          let matchType = '';
          let matchContext = '';

          // Search in title
          const titleLower = (card.title || '').toLowerCase();
          if (titleLower.includes(q)) {
            score += 100;
            matchType = 'title';
            matchContext = card.title;
          }

          // Search in tags
          const matchedTag = (card.tags || []).find(t => t.toLowerCase().includes(q));
          if (matchedTag) {
            score += 80;
            if (!matchType) {
              matchType = 'tag';
              matchContext = matchedTag;
            }
          }

          // Search in content
          const contentLower = (card.content || '').toLowerCase();
          const contentIndex = contentLower.indexOf(q);
          if (contentIndex !== -1) {
            score += 50;
            if (!matchType) {
              matchType = 'content';
              // Extract context around match
              const start = Math.max(0, contentIndex - 30);
              const end = Math.min(card.content.length, contentIndex + q.length + 50);
              matchContext = (start > 0 ? '...' : '') + 
                            card.content.slice(start, end) + 
                            (end < card.content.length ? '...' : '');
            }
          }

          // Boost pinned cards
          if (card.pinned) score += 20;

          if (score > 0) {
            // Get tab and box info
            const tab = state.tabs.find(t => t.id === card.tabId);
            const box = tab ? state.boxes.find(b => b.id === tab.boxId) : null;

            results.push({
              card,
              tab,
              box,
              score,
              matchType,
              matchContext
            });
          }
        });

        // Sort by score descending
        return results.sort((a, b) => b.score - a.score);
      };

      const renderSearchResult = (result, query, index) => {
        const { card, tab, box, matchType, matchContext } = result;
        
        // Highlight matching text
        const highlightText = (text, q) => {
          if (!text) return '';
          const regex = new RegExp(`(${escapeRegex(q)})`, 'gi');
          return escapeHtml(text).replace(regex, '<mark>$1</mark>');
        };

        const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        const excerpt = highlightText(matchContext, query);
        const boxName = box?.name || 'Ungrouped';
        const tabName = tab?.name || 'No Tab';
        const tabIcon = tab?.icon || '📁';

        return `
          <div class="search-result-item" data-index="${index}" data-card-id="${card.id}" data-tab-id="${card.tabId || ''}" data-box-id="${tab?.boxId || ''}">
            <div class="search-result-icon">
              ${renderIcon(matchType === 'tag' ? 'tag' : 'file')}
            </div>
            <div class="search-result-content">
              <div class="search-result-title">
                ${card.pinned ? `<span class="pinned-badge">${renderIcon('pin', 'icon-xs')}</span>` : ''}
                ${highlightText(card.title || 'Untitled', query)}
              </div>
              <div class="search-result-excerpt">${excerpt}</div>
              <div class="search-result-meta">
                <span class="search-result-path">
                  ${renderIcon('box', 'icon-xs')}
                  <span>${escapeHtml(boxName)}</span>
                  <span>›</span>
                  <span>${tabIcon} ${escapeHtml(tabName)}</span>
                </span>
                ${(card.tags || []).length > 0 ? `
                  <span class="search-result-tags">
                    ${(card.tags || []).slice(0, 3).map(t => 
                      `<span class="search-result-tag">${highlightText(t, query)}</span>`
                    ).join('')}
                  </span>
                ` : ''}
              </div>
            </div>
          </div>
        `;
      };

      const showCommandResults = (query) => {
        const resultsEl = $('#searchResults');
        const q = query.toLowerCase();
        
        const matchingCommands = Object.entries(SEARCH_COMMANDS)
          .filter(([cmd]) => cmd.startsWith(q) || q === '?' || q === ':')
          .map(([cmd, data]) => ({ cmd, ...data }));

        if (matchingCommands.length === 0) {
          resultsEl.innerHTML = `
            <div class="search-results-header">Commands</div>
            <div class="search-empty">
              ${renderIcon('info')}
              <div>No command found</div>
            </div>
          `;
        } else {
          resultsEl.innerHTML = `
            <div class="search-results-header">Commands</div>
            ${matchingCommands.map((c, i) => `
              <div class="search-command" data-index="${i}" data-command="${c.cmd}">
                <div class="search-command-icon">${renderIcon(c.icon)}</div>
                <div class="search-command-content">
                  <div class="search-command-name">${c.name}</div>
                  <div class="search-command-desc">${c.desc}</div>
                </div>
                <span class="search-command-kbd">${c.cmd}</span>
              </div>
            `).join('')}
          `;
        }

        searchResults = matchingCommands;
        searchActiveIndex = -1;
        resultsEl.classList.add('open');
        hydrateIcons(resultsEl);
      };

      const showSearchHelp = () => {
        hideSearchResults();
        
        const helpContent = `
          <div style="font-size: 0.875rem;">
            <h4 style="margin-bottom: 12px;">Search Tips</h4>
            <ul style="margin-bottom: 16px; padding-left: 20px; color: var(--text-secondary);">
              <li>Type to search cards by title, content, or tags</li>
              <li>Results are ranked by relevance</li>
              <li>Pinned cards appear first</li>
            </ul>
            
            <h4 style="margin-bottom: 12px;">Commands</h4>
            <div style="display: grid; gap: 8px;">
              ${Object.entries(SEARCH_COMMANDS).map(([cmd, data]) => `
                <div style="display: flex; justify-content: space-between; padding: 8px; background: var(--bg-surface); border-radius: 8px;">
                  <span><code style="color: var(--primary);">${cmd}</code> — ${data.desc}</span>
                </div>
              `).join('')}
            </div>
            
            <h4 style="margin: 16px 0 12px;">Keyboard Shortcuts</h4>
            <div style="display: grid; gap: 8px; color: var(--text-secondary);">
              <div><kbd>Ctrl+N</kbd> — New card/tab/box</div>
              <div><kbd>Ctrl+B</kbd> — New box</div>
              <div><kbd>Ctrl+F</kbd> — Focus search</div>
              <div><kbd>Ctrl+D</kbd> — Toggle theme</div>
              <div><kbd>Ctrl+E</kbd> — Export all</div>
              <div><kbd>Esc</kbd> — Close modal/search</div>
            </div>
          </div>
        `;

        // Show in modal
        $('#modalFormulaBody').innerHTML = helpContent;
        $('#modalFormula .modal-title').innerHTML = `${renderIcon('info')} Help & Commands`;
        hydrateIcons($('#modalFormula'));
        openModal('modalFormula');
      };

      const showStats = () => {
        hideSearchResults();
        
        const totalCards = state.cards.length;
        const totalTabs = state.tabs.length;
        const totalBoxes = state.boxes.length;
        const totalTags = state.allTags.length;
        const totalCopies = state.cards.reduce((sum, c) => sum + (c.copyCount || 0), 0);
        const pinnedCards = state.cards.filter(c => c.pinned).length;
        const avgCardsPerTab = totalTabs > 0 ? (totalCards / totalTabs).toFixed(1) : 0;

        toast({ 
          type: 'info', 
          title: '📊 Statistics',
          message: `${totalBoxes} boxes • ${totalTabs} tabs • ${totalCards} cards • ${totalCopies} copies`,
          duration: 5000
        });
      };

      const showQuickCreate = () => {
        hideSearchResults();
        
        if (state.tabs.length > 0) {
          window.Boxy.showCardModal?.();
        } else if (state.boxes.length > 0) {
          window.Boxy.showTabModal?.();
        } else {
          window.Boxy.showBoxModal?.();
        }
      };

      const clearAllData = async () => {
        hideSearchResults();
        
        const confirmed = await confirm({
          title: '⚠️ Clear All Data',
          message: 'This will permanently delete ALL your boxes, tabs, and cards. This cannot be undone!',
          confirmText: 'Delete Everything',
          danger: true
        });

        if (confirmed) {
          localStorage.removeItem('boxy_data');
          location.reload();
        }
      };

      const hideSearchResults = () => {
        const resultsEl = $('#searchResults');
        if (resultsEl) {
          resultsEl.classList.remove('open');
        }
        searchActiveIndex = -1;
        searchResults = [];
      };

      const navigateToResult = (cardId, tabId, boxId) => {
        hideSearchResults();
        $('#searchInput').value = '';

        // Find the box
        const boxEl = document.querySelector(`.box[data-box-id="${boxId}"]`);
        if (!boxEl) {
          // Box might be collapsed or not visible
          toast({ type: 'info', title: 'Card found', message: 'Opening location...' });
        }

        // Expand box if collapsed
        const box = state.boxes.find(b => b.id === boxId);
        if (box?.collapsed) {
          toggleBoxCollapse(boxId);
        }

        // Activate the tab
        if (tabId) {
          setTimeout(() => {
            const tabEl = document.querySelector(`.tab[data-tab-id="${tabId}"]`);
            if (tabEl && !tabEl.classList.contains('active')) {
              tabEl.click();
            }

            // Scroll to card after tab switch
            setTimeout(() => {
              const cardEl = document.querySelector(`.card[data-card-id="${cardId}"]`);
              if (cardEl) {
                cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                cardEl.style.animation = 'pulse 0.5s ease 2';
                setTimeout(() => cardEl.style.animation = '', 1000);
              }
            }, 100);
          }, 50);
        }

        render();
      };

      // Export for global use
      Object.assign(window.Boxy, {
        performSearch,
        hideSearchResults,
        navigateToResult,
        showSearchHelp,
        SEARCH_COMMANDS
      });

      /* ============================================
         MASONRY GRID SETUP
      ============================================ */
      const setupMasonry = () => {
        if (!state.settings.features.masonryGrid) return;
        
        $$('.masonry-grid').forEach(grid => {
          const cards = grid.querySelectorAll('.card');
          cards.forEach(card => {
            // Reset
            card.style.gridRowEnd = '';
            
            // Calculate span based on height
            const height = card.getBoundingClientRect().height;
            const rowSpan = Math.ceil((height + 16) / 26);
            card.style.gridRowEnd = `span ${rowSpan}`;
          });
        });
      };

      // Re-setup masonry on resize
      window.addEventListener('resize', window.Boxy.debounce(setupMasonry, 200));

      /* ============================================
         EXPORT BOXY METHODS
      ============================================ */
      Object.assign(window.Boxy, {
        // Parser
        parseMarkdown,
        
        // Render helpers
        renderMainContent,
        updateToolbarState,
        
        // Getters
        getBoxes,
        getTabsForBox,
        getCardsForTab,
        getCardsWithoutTab,
        getTagSuggestions,
        getTabLimit,
        getColumnLimit,
        
        // Box
        createBox,
        updateBox,
        deleteBox,
        toggleBoxCollapse,
        
        // Tab
        createTab,
        updateTab,
        deleteTab,
        toggleTabPin,
        moveTabToBox,
        reorderTabs,
        
        // Card
        createCard,
        updateCard,
        deleteCard,
        restoreCard,
        toggleCardPin,
        addCardHistory,
        incrementCopyCount,
        moveCardToTab,
        reorderCards,
        
        // Render
        render,
        renderBox,
        renderTab,
        renderCard,
        setupMasonry
      });

      console.log('[Boxy] Components initialized');
    })();

    ;(() => {
      'use strict';

      const { 
        state, saveState, uid, now, escapeHtml, timeAgo, formatDate, parseTags,
        copyToClipboard, renderIcon, hydrateIcons, toast, confirm, 
        openModal, closeModal, closeAllModals, $, $$,
        setTheme, toggleTheme, setPrimaryColor,
        getBoxes, getTabsForBox, getCardsForTab, getTagSuggestions,
        getTabLimit, getColumnLimit,
        createBox, updateBox, deleteBox, toggleBoxCollapse,
        createTab, updateTab, deleteTab, toggleTabPin, moveTabToBox, reorderTabs,
        createCard, updateCard, deleteCard, toggleCardPin, incrementCopyCount, 
        moveCardToTab, reorderCards,
        render, setupMasonry, parseMarkdown
      } = window.Boxy;

      /* ============================================
         ACTIVE STATE TRACKING
      ============================================ */
      let activeBoxId = null;
      let activeTabId = null;
      let editingBoxId = null;
      let editingTabId = null;
      let editingCardId = null;
      let draggedTabId = null;
      let draggedCardId = null;
      let copyVarsResolve = null;
      let copyVarsContent = '';

      /* ============================================
         FORMULA PARSER
      ============================================ */
      const FORMULA_REGEX = /^(mnt|hrs|sec|dur|sum|avg|max|min|cnt|diff|days|weeks|last|first|pct|inc|streak)\/\/(\d+|all)$/;

      const parseFormula = (formula, columnData) => {
        const match = formula.match(FORMULA_REGEX);
        if (!match) return formula;

        const [, type, rangeStr] = match;
        const range = rangeStr === 'all' ? columnData.length : parseInt(rangeStr, 10);
        const values = columnData.slice(0, range);

        // Parse numeric values
        const numbers = values.map(v => parseFloat(v)).filter(n => !isNaN(n));
        
        // Parse time values (HH:MM or HH:MM:SS)
        const parseTimes = values.map(v => {
          const parts = String(v).split(':').map(Number);
          if (parts.length >= 2) {
            return parts[0] * 60 + parts[1] + (parts[2] || 0) / 60;
          }
          return null;
        }).filter(t => t !== null);

        switch (type) {
          // Time formulas
          case 'mnt': {
            if (parseTimes.length < 2) return '—';
            let diff = 0;
            for (let i = 0; i < parseTimes.length - 1; i++) {
              diff += Math.abs(parseTimes[i] - parseTimes[i + 1]);
            }
            return `${Math.round(diff)} menit`;
          }
          case 'hrs': {
            if (parseTimes.length < 2) return '—';
            let diff = 0;
            for (let i = 0; i < parseTimes.length - 1; i++) {
              diff += Math.abs(parseTimes[i] - parseTimes[i + 1]);
            }
            return `${(diff / 60).toFixed(1)} jam`;
          }
          case 'sec': {
            if (parseTimes.length < 2) return '—';
            let diff = 0;
            for (let i = 0; i < parseTimes.length - 1; i++) {
              diff += Math.abs(parseTimes[i] - parseTimes[i + 1]) * 60;
            }
            return `${Math.round(diff)} detik`;
          }
          case 'dur': {
            if (parseTimes.length < 2) return '—';
            let diff = 0;
            for (let i = 0; i < parseTimes.length - 1; i++) {
              diff += Math.abs(parseTimes[i] - parseTimes[i + 1]);
            }
            const h = Math.floor(diff / 60);
            const m = Math.round(diff % 60);
            return h > 0 ? `${h}j ${m}m` : `${m}m`;
          }

          // Numeric formulas
          case 'sum':
            return numbers.length ? numbers.reduce((a, b) => a + b, 0).toString() : '—';
          case 'avg':
            return numbers.length ? (numbers.reduce((a, b) => a + b, 0) / numbers.length).toFixed(1) : '—';
          case 'max':
            return numbers.length ? Math.max(...numbers).toString() : '—';
          case 'min':
            return numbers.length ? Math.min(...numbers).toString() : '—';
          case 'cnt':
            return values.filter(v => v && String(v).trim()).length.toString();
          case 'diff':
            return numbers.length >= 2 ? (numbers[0] - numbers[numbers.length - 1]).toString() : '—';
          case 'pct':
            if (numbers.length >= 2) {
              const pct = (numbers[0] / numbers[1]) * 100;
              return `${pct.toFixed(0)}%`;
            }
            return '—';
          case 'inc':
            if (numbers.length >= 2) {
              const inc = numbers[0] - numbers[1];
              return inc >= 0 ? `+${inc}` : inc.toString();
            }
            return '—';

          // Date formulas
          case 'days':
          case 'weeks': {
            const dates = values.map(v => new Date(v).getTime()).filter(d => !isNaN(d));
            if (dates.length < 2) return '—';
            const diffMs = Math.abs(dates[0] - dates[dates.length - 1]);
            const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
            return type === 'weeks' ? `${Math.round(diffDays / 7)} minggu` : `${diffDays} hari`;
          }

          // Special
          case 'last':
            return values[parseInt(rangeStr, 10) - 1] || '—';
          case 'first':
            return values[0] || '—';
          case 'streak': {
            let streak = 1;
            for (let i = 1; i < numbers.length; i++) {
              if (numbers[i] === numbers[i - 1]) streak++;
              else break;
            }
            return `${streak}x`;
          }

          default:
            return formula;
        }
      };

      const isFormula = (value) => FORMULA_REGEX.test(value);

      /* ============================================
         VARIABLE EXTRACTION & REPLACEMENT
      ============================================ */
      const extractVariables = (text) => {
        const matches = text.match(/\{\{([^}]+)\}\}/g) || [];
        const builtins = ['date', 'time', 'datetime'];
        return [...new Set(matches.map(m => m.slice(2, -2).trim()))]
          .filter(v => !builtins.includes(v.toLowerCase()));
      };

      const replaceBuiltins = (text) => {
        const d = new Date();
        const date = d.toISOString().split('T')[0];
        const time = d.toTimeString().slice(0, 5);
        const datetime = `${date} ${time}`;

        return text
          .replace(/\{\{date\}\}/gi, date)
          .replace(/\{\{time\}\}/gi, time)
          .replace(/\{\{datetime\}\}/gi, datetime);
      };

      /* ============================================
         COPY CARD WITH VARIABLES
      ============================================ */
      const copyCard = async (cardId) => {
        const card = state.cards.find(c => c.id === cardId);
        if (!card) return;

        let content = card.content || '';
        content = replaceBuiltins(content);

        const variables = extractVariables(content);

        if (variables.length > 0) {
          copyVarsContent = content;
          showVarsModal(variables, cardId);
          return;
        }

        const success = await copyToClipboard(content);
        if (success) {
          incrementCopyCount(cardId);
          render();
          toast({ type: 'success', title: 'Copied!', duration: 2000 });
        } else {
          toast({ type: 'error', title: 'Copy failed' });
        }
      };

      const showVarsModal = (variables, cardId) => {
        const body = $('#modalVarsBody');
        body.innerHTML = variables.map(v => `
          <div class="form-group">
            <label class="form-label">{{${escapeHtml(v)}}}</label>
            <input type="text" class="form-input" data-var="${escapeHtml(v)}" placeholder="Enter value...">
          </div>
        `).join('');
        body.dataset.cardId = cardId;
        openModal('modalVars');
      };

      const applyVarsAndCopy = async () => {
        const body = $('#modalVarsBody');
        const cardId = body.dataset.cardId;
        let content = copyVarsContent;

        $$('input[data-var]', body).forEach(input => {
          const varName = input.dataset.var;
          const value = input.value || '';
          content = content.replace(new RegExp(`\\{\\{${varName}\\}\\}`, 'gi'), value);
        });

        closeModal('modalVars');
        copyVarsContent = '';

        const success = await copyToClipboard(content);
        if (success) {
          if (cardId) {
            incrementCopyCount(cardId);
            render();
          }
          toast({ type: 'success', title: 'Copied!', duration: 2000 });
        } else {
          toast({ type: 'error', title: 'Copy failed' });
        }
      };

      /* ============================================
         BOX MODAL
      ============================================ */
      const showBoxModal = (boxId = null) => {
        editingBoxId = boxId;
        const box = boxId ? state.boxes.find(b => b.id === boxId) : null;

        $('#modalBoxTitle').textContent = box ? 'Edit Box' : 'New Box';
        $('#modalBoxBody').innerHTML = `
          <div class="form-group">
            <label class="form-label">Box Name</label>
            <input type="text" class="form-input" id="boxNameInput" 
                   value="${escapeHtml(box?.name || '')}" placeholder="My Box">
          </div>
        `;
        $('#modalBoxFooter').innerHTML = `
          <button class="btn btn-ghost" data-modal-close>Cancel</button>
          <button class="btn btn-primary" id="btnSaveBox">
            ${renderIcon('check')} ${box ? 'Save' : 'Create'}
          </button>
        `;
        hydrateIcons($('#modalBoxFooter'));
        openModal('modalBox');
      };

      const saveBoxModal = () => {
        const name = $('#boxNameInput').value.trim() || 'Untitled Box';

        if (editingBoxId) {
          updateBox(editingBoxId, { name });
          toast({ type: 'success', title: 'Box updated' });
        } else {
          createBox(name);
          toast({ type: 'success', title: 'Box created' });
        }

        closeModal('modalBox');
        editingBoxId = null;
        render();
      };

      /* ============================================
         TAB MODAL
      ============================================ */
      const showTabModal = (tabId = null, presetBoxId = null) => {
        editingTabId = tabId;
        const tab = tabId ? state.tabs.find(t => t.id === tabId) : null;
        const boxes = getBoxes();

        if (boxes.length === 0) {
          toast({ type: 'error', title: 'No boxes', message: 'Create a box first' });
          return;
        }

        const boxId = tab?.boxId || presetBoxId || boxes[0].id;
        const recentColors = state.settings.recentColors || [];

        $('#modalTabTitle').textContent = tab ? 'Edit Tab' : 'New Tab';
        $('#modalTabBody').innerHTML = `
          <div class="form-group">
            <label class="form-label">Tab Name</label>
            <input type="text" class="form-input" id="tabNameInput" 
                   value="${escapeHtml(tab?.name || '')}" placeholder="New Tab">
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Icon (emoji)</label>
              <input type="text" class="form-input" id="tabIconInput" 
                     value="${tab?.icon || '📁'}" maxlength="2" style="width: 60px;">
            </div>
            <div class="form-group">
              <label class="form-label">Color</label>
              <div class="form-color-wrapper">
                <input type="color" class="form-color" id="tabColorInput" 
                       value="${tab?.color || '#0ea5e9'}">
                <input type="text" class="form-input color-hex-input" id="tabColorHex" 
                       value="${tab?.color || '#0ea5e9'}" maxlength="7">
              </div>
              ${recentColors.length ? `
                <div class="color-recent">
                  ${recentColors.map(c => `
                    <button type="button" class="color-recent-item" 
                            style="background: ${c}" data-color="${c}"></button>
                  `).join('')}
                </div>
              ` : ''}
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Box</label>
            <select class="form-select" id="tabBoxSelect">
              ${boxes.map(b => `
                <option value="${b.id}" ${b.id === boxId ? 'selected' : ''}>${escapeHtml(b.name)}</option>
              `).join('')}
            </select>
          </div>
        `;

        $('#modalTabFooter').innerHTML = `
          <button class="btn btn-ghost" data-modal-close>Cancel</button>
          <button class="btn btn-primary" id="btnSaveTab">
            ${renderIcon('check')} ${tab ? 'Save' : 'Create'}
          </button>
        `;
        hydrateIcons($('#modalTabFooter'));

        // Color sync
        const colorInput = $('#tabColorInput');
        const hexInput = $('#tabColorHex');
        colorInput.addEventListener('input', () => hexInput.value = colorInput.value);
        hexInput.addEventListener('input', () => {
          if (/^#[0-9A-Fa-f]{6}$/.test(hexInput.value)) {
            colorInput.value = hexInput.value;
          }
        });

        // Recent color clicks
        $$('.color-recent-item', $('#modalTabBody')).forEach(btn => {
          btn.addEventListener('click', () => {
            colorInput.value = btn.dataset.color;
            hexInput.value = btn.dataset.color;
          });
        });

        openModal('modalTab');
      };

      const saveTabModal = () => {
        const name = $('#tabNameInput').value.trim() || 'Untitled Tab';
        const icon = $('#tabIconInput').value.trim() || '📁';
        const color = $('#tabColorInput').value;
        const boxId = $('#tabBoxSelect').value;

        // Add to recent colors
        const recent = state.settings.recentColors.filter(c => c !== color);
        recent.unshift(color);
        state.settings.recentColors = recent.slice(0, 5);

        if (editingTabId) {
          const tab = state.tabs.find(t => t.id === editingTabId);
          if (tab && tab.boxId !== boxId) {
            moveTabToBox(editingTabId, boxId);
          }
          updateTab(editingTabId, { name, icon, color });
          toast({ type: 'success', title: 'Tab updated' });
        } else {
          createTab(boxId, { name, icon, color });
          toast({ type: 'success', title: 'Tab created' });
        }

        closeModal('modalTab');
        editingTabId = null;
        render();
      };

      /* ============================================
         CARD MODAL
      ============================================ */
      const showCardModal = (cardId = null, presetTabId = null) => {
        editingCardId = cardId;
        const card = cardId ? state.cards.find(c => c.id === cardId) : null;
        const tabs = state.tabs;

        if (tabs.length === 0 && !cardId) {
          toast({ type: 'error', title: 'No tabs', message: 'Create a tab first' });
          return;
        }

        const tabId = card?.tabId || presetTabId || tabs[0]?.id || null;

        $('#modalCardTitle').textContent = card ? 'Edit Card' : 'New Card';
        $('#modalCardBody').innerHTML = `
          <div class="form-group">
            <label class="form-label">Title</label>
            <input type="text" class="form-input" id="cardTitleInput" 
                   value="${escapeHtml(card?.title || '')}" placeholder="Card title...">
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Tab</label>
              <select class="form-select" id="cardTabSelect">
                <option value="">— Ungrouped —</option>
                ${tabs.map(t => {
                  const box = state.boxes.find(b => b.id === t.boxId);
                  return `<option value="${t.id}" ${t.id === tabId ? 'selected' : ''}>
                    ${t.icon} ${escapeHtml(t.name)} (${escapeHtml(box?.name || 'No box')})
                  </option>`;
                }).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Tags</label>
              <div class="tag-input-wrapper" id="tagInputWrapper" style="position: relative;">
                <div id="tagChips"></div>
                <input type="text" class="tag-input" id="tagInput" placeholder="Add tag...">
                <div class="tag-suggestions" id="tagSuggestions" hidden></div>
              </div>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Content (Markdown)</label>
            <textarea class="form-textarea" id="cardContentInput" 
                      placeholder="Write your content...">${escapeHtml(card?.content || '')}</textarea>
            <div class="form-hint">
              <code>**bold**</code> <code>*italic*</code> <code>\`code\`</code> 
              <code>- list</code> <code># heading</code> <code>{{variable}}</code>
            </div>
          </div>
          <div class="form-group">
            <label class="form-checkbox">
              <input type="checkbox" id="cardPinnedInput" ${card?.pinned ? 'checked' : ''}>
              <span>Pin this card</span>
            </label>
          </div>
          <div class="section-divider"></div>
          <div class="form-group">
            <label class="form-checkbox">
              <input type="checkbox" id="cardUseDefaultTable" ${card?.table?.useDefault !== false ? 'checked' : ''}>
              <span>Use table with default function (history)</span>
            </label>
          </div>
          <div id="customTableEditor" ${card?.table?.useDefault !== false ? 'hidden' : ''}></div>
        `;

        $('#modalCardFooter').innerHTML = `
          <button class="btn btn-ghost" data-modal-close>Cancel</button>
          <button class="btn btn-primary" id="btnSaveCard">
            ${renderIcon('check')} ${card ? 'Save' : 'Create'}
          </button>
        `;
        hydrateIcons($('#modalCardFooter'));

        // Initialize tags
        initTagInput(card?.tags || []);

        // Table toggle
        $('#cardUseDefaultTable').addEventListener('change', (e) => {
          $('#customTableEditor').hidden = e.target.checked;
          if (!e.target.checked) {
            renderTableEditor(card?.table);
          }
        });

        if (card?.table?.useDefault === false) {
          renderTableEditor(card.table);
        }

        openModal('modalCard');
      };

      let currentTags = [];

      const initTagInput = (tags) => {
        currentTags = [...tags];
        renderTagChips();

        const input = $('#tagInput');
        const suggestions = $('#tagSuggestions');

        input.addEventListener('keydown', (e) => {
          const value = input.value.trim();
          
          // Enter or Space to add tag
          if ((e.key === 'Enter' || e.key === ' ') && value) {
            e.preventDefault();
            addTag(value);
            input.value = '';
            suggestions.hidden = true;
          }
          
          // Backspace to remove last tag when input is empty
          if (e.key === 'Backspace' && !input.value && currentTags.length > 0) {
            removeTag(currentTags[currentTags.length - 1]);
          }
        });
        
        // Also handle comma as separator
        input.addEventListener('input', () => {
          const value = input.value;
          if (value.includes(',')) {
            const parts = value.split(',');
            parts.forEach((part, i) => {
              const trimmed = part.trim();
              if (trimmed && i < parts.length - 1) {
                addTag(trimmed);
              }
            });
            // Keep the last part (after comma) in input
            input.value = parts[parts.length - 1].trim();
          }
          
          // Show suggestions
          const query = input.value.trim();
          const results = getTagSuggestions(query);
          if (results.length > 0 && query.length > 0) {
            suggestions.innerHTML = results.map(t => `
              <button type="button" class="tag-suggestion-item" data-tag="${escapeHtml(t)}">${escapeHtml(t)}</button>
            `).join('');
            suggestions.hidden = false;
          } else {
            suggestions.hidden = true;
          }
        });

        suggestions.addEventListener('click', (e) => {
          const btn = e.target.closest('.tag-suggestion-item');
          if (btn) {
            addTag(btn.dataset.tag);
            input.value = '';
            suggestions.hidden = true;
          }
        });
      };

      const addTag = (tag) => {
        const normalized = tag.toLowerCase().trim();
        if (normalized && !currentTags.includes(normalized)) {
          currentTags.push(normalized);
          renderTagChips();
        }
      };

      const removeTag = (tag) => {
        currentTags = currentTags.filter(t => t !== tag);
        renderTagChips();
      };

      const renderTagChips = () => {
        const container = $('#tagChips');
        container.innerHTML = currentTags.map(t => `
          <span class="tag-chip">
            ${escapeHtml(t)}
            <button type="button" class="tag-chip-remove" data-tag="${escapeHtml(t)}">
              ${renderIcon('x', 'icon-xs')}
            </button>
          </span>
        `).join('');
        hydrateIcons(container);

        container.querySelectorAll('.tag-chip-remove').forEach(btn => {
          btn.addEventListener('click', () => removeTag(btn.dataset.tag));
        });
      };

      /* ============================================
         TABLE EDITOR
      ============================================ */
      let tableColumns = [];
      let tableRows = [];

      const renderTableEditor = (tableData) => {
        tableColumns = tableData?.columns || [
          { id: uid('col'), header: 'Column 1' },
          { id: uid('col'), header: 'Column 2' }
        ];
        tableRows = tableData?.rows || [];

        const container = $('#customTableEditor');
        container.innerHTML = `
          <div class="table-editor">
            <div class="table-editor-header">
              <span class="table-editor-title">Custom Table</span>
              <div class="table-editor-actions">
                <button type="button" class="btn btn-sm" id="btnAddColumn">
                  ${renderIcon('plus', 'icon-xs')} Column
                </button>
                <button type="button" class="btn btn-sm" id="btnAddRow">
                  ${renderIcon('plus', 'icon-xs')} Row
                </button>
              </div>
            </div>
            <div class="table-editor-grid">
              <table id="tableEditorTable"></table>
            </div>
            <div class="table-editor-footer">
              <small class="form-hint">Formulas: <code>sum//all</code> <code>avg//3</code> <code>mnt//2</code> etc.</small>
            </div>
          </div>
        `;
        hydrateIcons(container);

        renderTableGrid();

        $('#btnAddColumn').addEventListener('click', addTableColumn);
        $('#btnAddRow').addEventListener('click', addTableRow);
      };

      const renderTableGrid = () => {
        const table = $('#tableEditorTable');
        const colLimit = getColumnLimit();

        table.innerHTML = `
          <thead>
            <tr>
              ${tableColumns.slice(0, colLimit).map(col => `
                <th>
                  <div style="display: flex; align-items: center; gap: 4px;">
                    <input type="text" value="${escapeHtml(col.header)}" data-col-id="${col.id}" data-type="header" style="flex: 1;">
                    <button type="button" class="col-delete" data-col-id="${col.id}" style="padding: 2px; opacity: 0.5; cursor: pointer; background: none; border: none;" title="Delete column">
                      ${renderIcon('x', 'icon-xs')}
                    </button>
                  </div>
                </th>
              `).join('')}
              <th class="row-actions"></th>
            </tr>
          </thead>
          <tbody>
            ${tableRows.map((row, rowIndex) => `
              <tr data-row-id="${row.id}">
                ${tableColumns.slice(0, colLimit).map(col => {
                  const value = row.cells[col.id] || '';
                  const isFormulaCell = isFormula(value);
                  return `
                    <td>
                      <input type="text" value="${escapeHtml(value)}" 
                             data-row-id="${row.id}" data-col-id="${col.id}"
                             class="${isFormulaCell ? 'formula-input' : ''}">
                    </td>
                  `;
                }).join('')}
                <td class="row-actions">
                  <button type="button" class="row-delete" data-row-index="${rowIndex}">
                    ${renderIcon('trash', 'icon-xs')}
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        `;
        hydrateIcons(table);

        // Input handlers
        table.querySelectorAll('input[data-type="header"]').forEach(input => {
          input.addEventListener('input', (e) => {
            const col = tableColumns.find(c => c.id === e.target.dataset.colId);
            if (col) col.header = e.target.value;
          });
        });

        table.querySelectorAll('input[data-row-id]').forEach(input => {
          input.addEventListener('input', (e) => {
            const row = tableRows.find(r => r.id === e.target.dataset.rowId);
            if (row) {
              row.cells[e.target.dataset.colId] = e.target.value;
              input.classList.toggle('formula-input', isFormula(e.target.value));
            }
          });
        });

        // Delete row
        table.querySelectorAll('.row-delete').forEach(btn => {
          btn.addEventListener('click', () => {
            tableRows.splice(parseInt(btn.dataset.rowIndex), 1);
            renderTableGrid();
          });
        });

        // Delete column
        table.querySelectorAll('.col-delete').forEach(btn => {
          btn.addEventListener('click', () => {
            const colId = btn.dataset.colId;
            tableColumns = tableColumns.filter(c => c.id !== colId);
            // Also remove this column from all rows
            tableRows.forEach(row => {
              delete row.cells[colId];
            });
            renderTableGrid();
          });
        });
      };

      const addTableColumn = () => {
        if (tableColumns.length >= getColumnLimit()) {
          toast({ type: 'warning', title: `Max ${getColumnLimit()} columns` });
          return;
        }
        tableColumns.push({ id: uid('col'), header: `Column ${tableColumns.length + 1}` });
        renderTableGrid();
      };

      const addTableRow = () => {
        tableRows.push({ id: uid('row'), cells: {} });
        renderTableGrid();
      };

      const saveCardModal = () => {
        const title = $('#cardTitleInput').value.trim() || 'Untitled';
        const content = $('#cardContentInput').value;
        const tabId = $('#cardTabSelect').value || null;
        const pinned = $('#cardPinnedInput').checked;
        const useDefaultTable = $('#cardUseDefaultTable').checked;
        const tags = currentTags;

        const tableData = useDefaultTable ? { useDefault: true, columns: [], rows: [] } : {
          useDefault: false,
          columns: tableColumns,
          rows: tableRows
        };

        if (editingCardId) {
          updateCard(editingCardId, { title, content, tabId, pinned, tags, table: tableData });
          toast({ type: 'success', title: 'Card updated' });
        } else {
          createCard(tabId, { title, content, pinned, tags, table: tableData });
          toast({ type: 'success', title: 'Card created' });
        }

        closeModal('modalCard');
        editingCardId = null;
        currentTags = [];
        render();
      };

      /* ============================================
         SETTINGS MODAL (synboxy)
      ============================================ */
      const showSettingsModal = () => {
        const s = state.settings;
        const recentColors = s.recentColors || [];

        $('#modalSettingsBody').innerHTML = `
          <div class="settings-section">
            <div class="settings-section-title">Appearance</div>
            <div class="settings-row">
              <div>
                <div class="settings-label">Primary Color</div>
              </div>
              <div class="settings-control">
                <div class="form-color-wrapper">
                  <input type="color" class="form-color" id="settingsPrimaryColor" value="${s.primaryColor}">
                  <input type="text" class="form-input color-hex-input" id="settingsPrimaryHex" 
                         value="${s.primaryColor}" maxlength="7" style="width: 90px;">
                </div>
                ${recentColors.length ? `
                  <div class="color-recent" style="margin-top: 8px;">
                    ${recentColors.map(c => `
                      <button type="button" class="color-recent-item settings-color-pick" 
                              style="background: ${c}" data-color="${c}"></button>
                    `).join('')}
                  </div>
                ` : ''}
              </div>
            </div>
          </div>

          <div class="settings-section">
            <div class="settings-section-title">Features</div>
            <div class="settings-row">
              <div><div class="settings-label">Table in Cards</div></div>
              <div class="settings-control">
                <div class="toggle-switch ${s.features.tableInCards ? 'active' : ''}" data-setting="tableInCards"></div>
              </div>
            </div>
            <div class="settings-row">
              <div><div class="settings-label">Auto-record History</div></div>
              <div class="settings-control">
                <div class="toggle-switch ${s.features.autoRecordHistory ? 'active' : ''}" data-setting="autoRecordHistory"></div>
              </div>
            </div>
            <div class="settings-row">
              <div><div class="settings-label">Card Drag & Drop</div></div>
              <div class="settings-control">
                <div class="toggle-switch ${s.features.cardDrag ? 'active' : ''}" data-setting="cardDrag"></div>
              </div>
            </div>
            <div class="settings-row">
              <div><div class="settings-label">Tab Drag & Reorder</div></div>
              <div class="settings-control">
                <div class="toggle-switch ${s.features.tabDrag ? 'active' : ''}" data-setting="tabDrag"></div>
              </div>
            </div>
          </div>

          <div class="settings-section">
            <div class="settings-section-title">Advanced</div>
            <div class="settings-row">
              <div>
                <div class="settings-label">Bypass Tab Limit (12)</div>
              </div>
              <div class="settings-control">
                <div class="toggle-switch ${s.advanced.bypassTabLimit ? 'active' : ''}" data-setting-adv="bypassTabLimit"></div>
              </div>
            </div>
            <div class="settings-row">
              <div>
                <div class="settings-label">Bypass Column Limit (10)</div>
              </div>
              <div class="settings-control">
                <div class="toggle-switch ${s.advanced.bypassColumnLimit ? 'active' : ''}" data-setting-adv="bypassColumnLimit"></div>
              </div>
            </div>
          </div>

          <div class="section-divider"></div>

          <button class="btn" id="btnShowFormulaGuide" style="width: 100%;">
            ${renderIcon('book-open')} Formula Guide
          </button>
        `;

        $('#modalSettingsFooter').innerHTML = `
          <div style="flex: 1; font-size: 12px; color: var(--text-tertiary);">v1.0.23</div>
          <a href="#" class="btn btn-ghost" id="btnDonate" style="color: var(--danger);">
            ${renderIcon('heart')} Donate
          </a>
          <button class="btn btn-primary" data-modal-close>Done</button>
        `;
        hydrateIcons($('#modalSettingsBody'));
        hydrateIcons($('#modalSettingsFooter'));

        // Color sync
        const colorInput = $('#settingsPrimaryColor');
        const hexInput = $('#settingsPrimaryHex');
        colorInput.addEventListener('input', () => {
          hexInput.value = colorInput.value;
          setPrimaryColor(colorInput.value);
        });
        hexInput.addEventListener('change', () => {
          if (/^#[0-9A-Fa-f]{6}$/.test(hexInput.value)) {
            colorInput.value = hexInput.value;
            setPrimaryColor(hexInput.value);
          }
        });

        // Recent colors
        $$('.settings-color-pick', $('#modalSettingsBody')).forEach(btn => {
          btn.addEventListener('click', () => {
            colorInput.value = btn.dataset.color;
            hexInput.value = btn.dataset.color;
            setPrimaryColor(btn.dataset.color);
          });
        });

        // Feature toggles
        $$('.toggle-switch[data-setting]', $('#modalSettingsBody')).forEach(toggle => {
          toggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const key = toggle.dataset.setting;
            state.settings.features[key] = !state.settings.features[key];
            toggle.classList.toggle('active');
            saveState();
            // Don't call full render, just update content
            renderMainContent();
          });
        });

        // Advanced toggles
        $$('.toggle-switch[data-setting-adv]', $('#modalSettingsBody')).forEach(toggle => {
          toggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const key = toggle.dataset.settingAdv;
            state.settings.advanced[key] = !state.settings.advanced[key];
            toggle.classList.toggle('active');
            saveState();
          });
        });

        // Formula guide
        $('#btnShowFormulaGuide').addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          showFormulaGuide();
        });

        // Donate
        const donateBtn = $('#btnDonate');
        if (donateBtn) {
          donateBtn.href = 'https://instagram.com';
          donateBtn.target = '_blank';
          donateBtn.rel = 'noopener noreferrer';
          donateBtn.addEventListener('click', (e) => {
            // Allow default link behavior
            e.stopPropagation();
            toast({ type: 'success', title: 'Thank you! 💙', duration: 2000 });
          });
        }

        // Ensure modal close buttons work
        $$('[data-modal-close]', $('#modalSettings')).forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            closeModal('modalSettings');
          });
        });

        openModal('modalSettings');
      };

      /* ============================================
         FORMULA GUIDE MODAL
      ============================================ */
      const showFormulaGuide = () => {
        $('#modalFormulaBody').innerHTML = `
          <div class="formula-guide-section">
            <div class="formula-guide-title">Search Commands</div>
            <div class="formula-list">
              <div class="formula-item"><span class="formula-code">:help</span><span class="formula-desc">Show help & commands</span></div>
              <div class="formula-item"><span class="formula-code">:theme</span><span class="formula-desc">Toggle dark/light mode</span></div>
              <div class="formula-item"><span class="formula-code">:dark</span><span class="formula-desc">Switch to dark mode</span></div>
              <div class="formula-item"><span class="formula-code">:light</span><span class="formula-desc">Switch to light mode</span></div>
              <div class="formula-item"><span class="formula-code">:stats</span><span class="formula-desc">Show statistics</span></div>
              <div class="formula-item"><span class="formula-code">:export</span><span class="formula-desc">Export all data</span></div>
              <div class="formula-item"><span class="formula-code">:settings</span><span class="formula-desc">Open settings</span></div>
              <div class="formula-item"><span class="formula-code">:new</span><span class="formula-desc">Quick create</span></div>
              <div class="formula-item"><span class="formula-code">:clear</span><span class="formula-desc">Clear all data</span></div>
            </div>
          </div>

          <div class="formula-guide-section">
            <div class="formula-guide-title">Time Formulas</div>
            <div class="formula-list">
              <div class="formula-item"><span class="formula-code">mnt//N</span><span class="formula-desc">Selisih menit dari N baris</span></div>
              <div class="formula-item"><span class="formula-code">mnt//all</span><span class="formula-desc">Total selisih menit</span></div>
              <div class="formula-item"><span class="formula-code">hrs//N</span><span class="formula-desc">Selisih jam</span></div>
              <div class="formula-item"><span class="formula-code">sec//N</span><span class="formula-desc">Selisih detik</span></div>
              <div class="formula-item"><span class="formula-code">dur//all</span><span class="formula-desc">Duration (smart format)</span></div>
            </div>
          </div>

          <div class="formula-guide-section">
            <div class="formula-guide-title">Numeric Formulas</div>
            <div class="formula-list">
              <div class="formula-item"><span class="formula-code">sum//N</span><span class="formula-desc">Jumlah N nilai</span></div>
              <div class="formula-item"><span class="formula-code">sum//all</span><span class="formula-desc">Jumlah semua</span></div>
              <div class="formula-item"><span class="formula-code">avg//N</span><span class="formula-desc">Rata-rata</span></div>
              <div class="formula-item"><span class="formula-code">max//all</span><span class="formula-desc">Nilai maksimum</span></div>
              <div class="formula-item"><span class="formula-code">min//all</span><span class="formula-desc">Nilai minimum</span></div>
              <div class="formula-item"><span class="formula-code">cnt//all</span><span class="formula-desc">Count non-empty</span></div>
              <div class="formula-item"><span class="formula-code">diff//N</span><span class="formula-desc">Selisih N nilai</span></div>
              <div class="formula-item"><span class="formula-code">pct//2</span><span class="formula-desc">Persentase</span></div>
              <div class="formula-item"><span class="formula-code">inc//2</span><span class="formula-desc">Increment (+/-)</span></div>
            </div>
          </div>

          <div class="formula-guide-section">
            <div class="formula-guide-title">Date & Special</div>
            <div class="formula-list">
              <div class="formula-item"><span class="formula-code">days//all</span><span class="formula-desc">Selisih hari</span></div>
              <div class="formula-item"><span class="formula-code">weeks//all</span><span class="formula-desc">Selisih minggu</span></div>
              <div class="formula-item"><span class="formula-code">last//1</span><span class="formula-desc">Nilai sebelumnya</span></div>
              <div class="formula-item"><span class="formula-code">first//1</span><span class="formula-desc">Nilai pertama</span></div>
              <div class="formula-item"><span class="formula-code">streak//all</span><span class="formula-desc">Hitung streak</span></div>
            </div>
          </div>
        `;
        openModal('modalFormula');
      };

      /* ============================================
         EXPORT / IMPORT
      ============================================ */
      const exportAll = () => {
        const data = {
          exportType: 'full',
          exportedAt: now(),
          ...state
        };
        downloadJson(data, `boxy-backup-${new Date().toISOString().slice(0, 10)}.json`);
        toast({ type: 'success', title: 'Exported', message: 'Full backup downloaded' });
      };

      const exportBox = (boxId) => {
        const box = state.boxes.find(b => b.id === boxId);
        if (!box) return;

        const tabs = state.tabs.filter(t => t.boxId === boxId);
        const tabIds = tabs.map(t => t.id);
        const cards = state.cards.filter(c => tabIds.includes(c.tabId));

        const data = {
          exportType: 'box',
          exportedAt: now(),
          box,
          tabs,
          cards
        };
        downloadJson(data, `boxy-${box.name.replace(/[^a-z0-9]/gi, '-')}-${new Date().toISOString().slice(0, 10)}.json`);
        toast({ type: 'success', title: 'Box exported', message: box.name });
      };

      const downloadJson = (data, filename) => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      };

      const importData = async (file) => {
        try {
          const text = await file.text();
          let data;
          
          try {
            data = JSON.parse(text);
          } catch (parseErr) {
            toast({ type: 'error', title: 'Invalid JSON', message: 'File is not valid JSON' });
            return;
          }

          if (!data || typeof data !== 'object') {
            toast({ type: 'error', title: 'Invalid file', message: 'Empty or invalid data' });
            return;
          }

          console.log('[Boxy] Import - detecting format:', {
            hasBoxes: Array.isArray(data.boxes),
            hasTabs: Array.isArray(data.tabs),
            hasGroups: Array.isArray(data.groups),
            hasCards: Array.isArray(data.cards),
            exportType: data.exportType
          });

          // Check if it's a single box export
          if (data.exportType === 'box' && data.box) {
            const confirmed = await confirm({
              title: 'Import Box',
              message: `Import box "${data.box?.name}"? This will add it to your existing data.`,
              confirmText: 'Import'
            });
            if (!confirmed) return;

            const newBoxId = uid('box');
            const idMap = { [data.box.id]: newBoxId };

            state.boxes.push({ 
              ...data.box, 
              id: newBoxId, 
              order: state.boxes.length,
              createdAt: data.box.createdAt || now(),
              updatedAt: now()
            });

            (data.tabs || []).forEach(tab => {
              const newTabId = uid('tab');
              idMap[tab.id] = newTabId;
              state.tabs.push({ 
                ...tab, 
                id: newTabId, 
                boxId: newBoxId,
                createdAt: tab.createdAt || now(),
                updatedAt: now()
              });
            });

            (data.cards || []).forEach(card => {
              const newCardId = uid('card');
              const newTabId = idMap[card.tabId] || null;
              state.cards.push({ 
                ...card, 
                id: newCardId, 
                tabId: newTabId,
                createdAt: card.createdAt || now(),
                updatedAt: now()
              });
              
              (card.tags || []).forEach(tag => {
                if (tag && !state.allTags.includes(tag)) {
                  state.allTags.push(tag);
                }
              });
            });

            saveState();
            render();
            toast({ type: 'success', title: 'Box imported', message: data.box.name });
            return;
          }

          // Check if it's new format (has boxes AND tabs)
          if (data.exportType === 'full' || (Array.isArray(data.boxes) && Array.isArray(data.tabs))) {
            const confirmed = await confirm({
              title: 'Import All Data',
              message: 'This will REPLACE all your current data. Continue?',
              confirmText: 'Replace All',
              danger: true
            });
            if (!confirmed) return;

            // Ensure settings are complete
            data.settings = { ...window.Boxy.defaultSettings(), ...(data.settings || {}) };
            data.allTags = data.allTags || [];
            data.trash = data.trash || [];

            Object.assign(state, {
              settings: data.settings,
              boxes: data.boxes || [],
              tabs: data.tabs || [],
              cards: data.cards || [],
              allTags: data.allTags,
              trash: data.trash
            });
            
            saveState();
            setTheme(state.settings.theme);
            render();
            toast({ type: 'success', title: 'Data imported successfully' });
            return;
          }

          // OLD FORMAT: has "groups" array (v1.0 Big Box Clipboard)
          if (Array.isArray(data.groups)) {
            const groupCount = data.groups.length;
            const cardCount = (data.cards || []).length;
            
            const confirmed = await confirm({
              title: 'Import Legacy Data (v1.0)',
              message: `Found ${groupCount} groups and ${cardCount} cards from old format. This will REPLACE all current data and migrate to new format. Continue?`,
              confirmText: 'Import & Migrate',
              danger: true
            });
            if (!confirmed) return;

            // Manual migration for old format
            console.log('[Boxy] Starting migration from v1.0 format...');
            
            const boxId = uid('box');
            const newData = {
              settings: {
                ...window.Boxy.defaultSettings(),
                theme: data.settings?.theme || 'dark'
              },
              boxes: [{
                id: boxId,
                name: 'Migrated Box',
                collapsed: false,
                order: 0,
                createdAt: now(),
                updatedAt: now()
              }],
              tabs: [],
              cards: [],
              allTags: [],
              trash: data.trash || []
            };

            // Map old group IDs to new tab IDs
            const groupToTabMap = {};

            // Convert groups to tabs
            (data.groups || []).forEach((group, i) => {
              const newTabId = uid('tab');
              groupToTabMap[group.id] = newTabId;
              
              newData.tabs.push({
                id: newTabId,
                boxId: boxId,
                name: group.name || 'Untitled Tab',
                icon: group.icon || '📁',
                color: group.color || '#0ea5e9',
                pinned: false,
                order: group.order ?? i,
                createdAt: group.createdAt || now(),
                updatedAt: group.updatedAt || now()
              });
            });

            // Convert cards (groupId → tabId)
            (data.cards || []).forEach((card, i) => {
              const tags = Array.isArray(card.tags) ? card.tags : [];
              
              // Add tags to allTags
              tags.forEach(t => {
                if (t && !newData.allTags.includes(t)) {
                  newData.allTags.push(t);
                }
              });

              // Map groupId to tabId
              const newTabId = card.groupId ? groupToTabMap[card.groupId] : null;

              newData.cards.push({
                id: uid('card'),
                tabId: newTabId,
                title: card.title || 'Untitled',
                content: card.content || '',
                tags: tags,
                pinned: card.pinned || false,
                copyCount: card.copyCount || 0,
                order: card.order ?? i,
                createdAt: card.createdAt || now(),
                updatedAt: card.updatedAt || now(),
                history: [{ action: 'migrated', at: now() }],
                table: {
                  useDefault: true,
                  columns: [
                    { id: uid('col'), header: 'Time' },
                    { id: uid('col'), header: 'Action' }
                  ],
                  rows: []
                }
              });
            });

            console.log('[Boxy] Migration complete:', {
              boxes: newData.boxes.length,
              tabs: newData.tabs.length,
              cards: newData.cards.length
            });

            // Apply migrated data
            Object.assign(state, newData);
            saveState();
            setTheme(state.settings.theme);
            render();
            
            toast({ 
              type: 'success', 
              title: 'Migration successful!', 
              message: `${groupCount} groups → tabs, ${cardCount} cards migrated` 
            });
            return;
          }

          // Unknown format
          toast({ 
            type: 'error', 
            title: 'Unknown format', 
            message: 'File format not recognized. Expected boxes/tabs or groups array.' 
          });

        } catch (err) {
          console.error('[Boxy] Import error:', err);
          toast({ type: 'error', title: 'Import failed', message: err.message || 'Unknown error' });
        }
      };

      /* ============================================
         TAB DRAG & DROP
      ============================================ */
      const setupTabDrag = () => {
        document.addEventListener('dragstart', (e) => {
          const tab = e.target.closest('.tab');
          if (!tab || !state.settings.features.tabDrag) return;

          draggedTabId = tab.dataset.tabId;
          tab.classList.add('dragging');
          e.dataTransfer.effectAllowed = 'move';
        });

        document.addEventListener('dragend', (e) => {
          const tab = e.target.closest('.tab');
          if (tab) tab.classList.remove('dragging');
          $$('.tab.drag-over, .tab.drag-over-right').forEach(t => {
            t.classList.remove('drag-over', 'drag-over-right');
          });
          draggedTabId = null;
        });

        document.addEventListener('dragover', (e) => {
          const tab = e.target.closest('.tab');
          if (!tab || !draggedTabId || tab.dataset.tabId === draggedTabId) return;

          e.preventDefault();
          const rect = tab.getBoundingClientRect();
          const midX = rect.left + rect.width / 2;

          $$('.tab.drag-over, .tab.drag-over-right').forEach(t => {
            t.classList.remove('drag-over', 'drag-over-right');
          });

          if (e.clientX < midX) {
            tab.classList.add('drag-over');
          } else {
            tab.classList.add('drag-over-right');
          }
        });

        document.addEventListener('drop', (e) => {
          const tab = e.target.closest('.tab');
          if (!tab || !draggedTabId) return;

          e.preventDefault();
          const targetId = tab.dataset.tabId;
          const boxTabs = tab.closest('.box-tabs');
          if (!boxTabs) return;

          const boxId = boxTabs.dataset.boxId;
          const tabs = getTabsForBox(boxId);
          const currentOrder = tabs.map(t => t.id);

          // Remove dragged from current position
          const dragIndex = currentOrder.indexOf(draggedTabId);
          if (dragIndex > -1) currentOrder.splice(dragIndex, 1);

          // Insert at new position
          const targetIndex = currentOrder.indexOf(targetId);
          const rect = tab.getBoundingClientRect();
          const insertAfter = e.clientX > rect.left + rect.width / 2;

          currentOrder.splice(insertAfter ? targetIndex + 1 : targetIndex, 0, draggedTabId);
          reorderTabs(boxId, currentOrder);
          render();
        });
      };

      /* ============================================
         CARD DRAG & DROP
      ============================================ */
      const setupCardDrag = () => {
        document.addEventListener('dragstart', (e) => {
          const card = e.target.closest('.card');
          if (!card || !state.settings.features.cardDrag) return;

          draggedCardId = card.dataset.cardId;
          card.classList.add('dragging');
          e.dataTransfer.effectAllowed = 'move';
        });

        document.addEventListener('dragend', (e) => {
          const card = e.target.closest('.card');
          if (card) card.classList.remove('dragging');
          $$('.card.drop-target').forEach(c => c.classList.remove('drop-target'));
          $$('.masonry-grid.drop-target').forEach(g => g.classList.remove('drop-target'));
          draggedCardId = null;
        });

        document.addEventListener('dragover', (e) => {
          if (!draggedCardId) return;

          const card = e.target.closest('.card');
          const grid = e.target.closest('.masonry-grid');

          if (card && card.dataset.cardId !== draggedCardId) {
            e.preventDefault();
            $$('.card.drop-target').forEach(c => c.classList.remove('drop-target'));
            card.classList.add('drop-target');
          } else if (grid) {
            e.preventDefault();
            grid.classList.add('drop-target');
          }
        });

        document.addEventListener('drop', (e) => {
          if (!draggedCardId) return;

          const card = e.target.closest('.card');
          const grid = e.target.closest('.masonry-grid');
          const box = e.target.closest('.box');

          if (!box) return;

          e.preventDefault();

          // Get target tab from active tab in box
          const boxId = box.dataset.boxId;
          const activeTab = box.querySelector('.tab.active');
          const targetTabId = activeTab?.dataset.tabId || null;

          // Move card to tab
          moveCardToTab(draggedCardId, targetTabId);

          // Reorder if dropped on another card
          if (card && card.dataset.cardId !== draggedCardId) {
            const cards = getCardsForTab(targetTabId);
            const currentOrder = cards.map(c => c.id);

            const dragIndex = currentOrder.indexOf(draggedCardId);
            if (dragIndex > -1) currentOrder.splice(dragIndex, 1);

            const targetIndex = currentOrder.indexOf(card.dataset.cardId);
            currentOrder.splice(targetIndex, 0, draggedCardId);
            reorderCards(targetTabId, currentOrder);
          }

          render();
        });
      };

      /* ============================================
         EVENT HANDLERS
      ============================================ */
      const setupEventHandlers = () => {

        // Box actions
        document.addEventListener('click', (e) => {
          const box = e.target.closest('.box');
          if (!box) return;

          const boxId = box.dataset.boxId;
          if (boxId === 'ungrouped') return;

          const action = e.target.closest('[data-action]')?.dataset.action;

          switch (action) {
            case 'collapse-box':
              toggleBoxCollapse(boxId);
              render();
              break;
            case 'edit-box':
              showBoxModal(boxId);
              break;
            case 'delete-box':
              deleteBox(boxId).then(deleted => { if (deleted) render(); });
              break;
            case 'export-box':
              exportBox(boxId);
              break;
            case 'add-tab':
              showTabModal(null, boxId);
              break;
            case 'add-card-to-tab':
              const activeTab = box.querySelector('.tab.active');
              if (activeTab) {
                showCardModal(null, activeTab.dataset.tabId);
              } else {
                toast({ type: 'error', title: 'No tab selected' });
              }
              break;
          }
        });

        // Tab clicks
        document.addEventListener('click', (e) => {
          const tab = e.target.closest('.tab');
          if (!tab) return;

          const tabId = tab.dataset.tabId;
          const box = tab.closest('.box');
          const boxId = box?.dataset.boxId;

          // Close tab button
          if (e.target.closest('[data-action="close-tab"]')) {
            e.stopPropagation();
            deleteTab(tabId).then(deleted => { if (deleted) render(); });
            return;
          }

          // Switch tab
          if (!tab.classList.contains('active')) {
            box.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Update content
            const content = $(`#boxContent-${boxId}`);
            if (content) {
              const searchQuery = $('#searchInput')?.value || '';
              content.innerHTML = window.Boxy.renderTabContent 
                ? renderTabContent(tabId, searchQuery)
                : '';
              hydrateIcons(content);
              setupMasonry();
            }

            // Update address bar
            const tabData = state.tabs.find(t => t.id === tabId);
            const addressText = $(`#addressText-${boxId}`);
            if (addressText && tabData) {
              const cards = getCardsForTab(tabId);
              addressText.textContent = `${tabData.icon} ${tabData.name} • ${cards.length} cards`;
            }
          }
        });

        // Tab right-click / context menu
        document.addEventListener('contextmenu', (e) => {
          const tab = e.target.closest('.tab');
          if (!tab) return;

          e.preventDefault();
          const tabId = tab.dataset.tabId;
          const tabData = state.tabs.find(t => t.id === tabId);

          // Simple context actions via confirm for now
          const actions = [
            { label: tabData?.pinned ? 'Unpin' : 'Pin', action: () => { toggleTabPin(tabId); render(); }},
            { label: 'Edit', action: () => showTabModal(tabId) },
            { label: 'Delete', action: () => deleteTab(tabId).then(d => { if (d) render(); }) }
          ];

          // Show simple menu via toast (simplified approach)
          toast({
            type: 'info',
            title: tabData?.name || 'Tab',
            duration: 5000,
            actions: [
              { label: tabData?.pinned ? 'Unpin' : 'Pin', onClick: actions[0].action },
              { label: 'Edit', onClick: actions[1].action }
            ]
          });
        });

        // Card actions
        document.addEventListener('click', (e) => {
          const card = e.target.closest('.card');
          if (!card) return;

          const cardId = card.dataset.cardId;
          const action = e.target.closest('[data-action]')?.dataset.action;

          switch (action) {
            case 'copy-card':
              copyCard(cardId);
              break;
            case 'edit-card':
              showCardModal(cardId);
              break;
            case 'delete-card':
              deleteCard(cardId).then(deleted => { if (deleted) render(); });
              break;
            case 'toggle-pin':
              toggleCardPin(cardId);
              render();
              break;
          }
        });

        // Modal save buttons
        document.addEventListener('click', (e) => {
          if (e.target.closest('#btnSaveBox')) saveBoxModal();
          if (e.target.closest('#btnSaveTab')) saveTabModal();
          if (e.target.closest('#btnSaveCard')) saveCardModal();
          if (e.target.closest('#btnApplyVars')) applyVarsAndCopy();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
          const ctrl = e.ctrlKey || e.metaKey;

          if (ctrl && e.key === 'n') {
            e.preventDefault();
            if (state.tabs.length > 0) showCardModal();
            else if (state.boxes.length > 0) showTabModal();
            else showBoxModal();
          }

          if (ctrl && e.key === 'b') {
            e.preventDefault();
            showBoxModal();
          }

          if (ctrl && e.key === 'd') {
            e.preventDefault();
            toggleTheme();
            render();
          }

          if (ctrl && e.key === 'f') {
            e.preventDefault();
            $('#searchInput')?.focus();
          }

          if (ctrl && e.key === 'e') {
            e.preventDefault();
            exportAll();
          }

          if (ctrl && e.key === 'Enter') {
            if ($('#modalBox.open')) saveBoxModal();
            else if ($('#modalTab.open')) saveTabModal();
            else if ($('#modalCard.open')) saveCardModal();
          }
        });
      };

      /* ============================================
         RENDER TAB CONTENT HELPER
      ============================================ */
      const renderTabContent = (tabId, searchQuery = '') => {
        const cards = getCardsForTab(tabId, searchQuery);

        if (cards.length === 0) {
          if (searchQuery) {
            return `<div class="empty-state">
              ${renderIcon('search')}
              <div class="empty-state-title">No results</div>
              <div class="empty-state-text">No cards match "${escapeHtml(searchQuery)}"</div>
            </div>`;
          }
          return `<div class="empty-state">
            ${renderIcon('file-plus')}
            <div class="empty-state-title">No cards yet</div>
            <div class="empty-state-text">Create your first card</div>
            <button class="btn btn-primary" data-action="add-card-to-tab">
              ${renderIcon('plus')} Create Card
            </button>
          </div>`;
        }

        return `
          <div class="masonry-grid stagger-children">
            ${cards.map(card => window.Boxy.renderCard(card)).join('')}
          </div>
        `;
      };

      /* ============================================
         INITIALIZATION
      ============================================ */
      const init = () => {
        // Apply saved primary color
        if (state.settings.primaryColor) {
          document.documentElement.style.setProperty('--primary', state.settings.primaryColor);
        }

        // Setup event handlers
        setupEventHandlers();
        setupTabDrag();
        setupCardDrag();

        // Initial render
        render();

        console.log('[Boxy] Fully initialized v1.0.23');
        console.log('[Boxy] Data:', { 
          boxes: state.boxes.length, 
          tabs: state.tabs.length, 
          cards: state.cards.length 
        });
      };

      // Run on DOM ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
      } else {
        init();
      }

      // Export additional methods
      Object.assign(window.Boxy, {
        parseFormula,
        isFormula,
        extractVariables,
        copyCard,
        showBoxModal,
        showTabModal,
        showCardModal,
        showSettingsModal,
        showFormulaGuide,
        exportAll,
        exportBox,
        importData,
        renderTabContent
      });

    })();
