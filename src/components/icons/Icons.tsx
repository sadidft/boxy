/**
 * Boxy Icon Components (Lucide-style)
 */
import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
}

const defaultProps = {
  size: 24,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export const Plus: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg {...defaultProps} width={size} height={size} viewBox="0 0 24 24" className={className}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export const X: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg {...defaultProps} width={size} height={size} viewBox="0 0 24 24" className={className}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export const Settings: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg {...defaultProps} width={size} height={size} viewBox="0 0 24 24" className={className}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

export const Search: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg {...defaultProps} width={size} height={size} viewBox="0 0 24 24" className={className}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

export const Clipboard: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg {...defaultProps} width={size} height={size} viewBox="0 0 24 24" className={className}>
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
  </svg>
);

export const Edit: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg {...defaultProps} width={size} height={size} viewBox="0 0 24 24" className={className}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

export const Trash: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg {...defaultProps} width={size} height={size} viewBox="0 0 24 24" className={className}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

export const Pin: React.FC<IconProps & { filled?: boolean }> = ({ size = 24, className, filled }) => (
  <svg {...defaultProps} width={size} height={size} viewBox="0 0 24 24" className={className} fill={filled ? 'currentColor' : 'none'}>
    <path d="M12 17v5M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.89A2 2 0 0 0 5 15.24V17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.89A2 2 0 0 1 15 10.76V6a1 1 0 0 1 1-1h.5a.5.5 0 0 0 .5-.5v-2a.5.5 0 0 0-.5-.5h-9a.5.5 0 0 0-.5.5v2a.5.5 0 0 0 .5.5H8a1 1 0 0 1 1 1z" />
  </svg>
);

export const GripVertical: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg {...defaultProps} width={size} height={size} viewBox="0 0 24 24" className={className}>
    <circle cx="9" cy="12" r="1" />
    <circle cx="9" cy="5" r="1" />
    <circle cx="9" cy="19" r="1" />
    <circle cx="15" cy="12" r="1" />
    <circle cx="15" cy="5" r="1" />
    <circle cx="15" cy="19" r="1" />
  </svg>
);

export const ChevronLeft: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg {...defaultProps} width={size} height={size} viewBox="0 0 24 24" className={className}>
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

export const ChevronRight: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg {...defaultProps} width={size} height={size} viewBox="0 0 24 24" className={className}>
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

export const Star: React.FC<IconProps & { filled?: boolean }> = ({ size = 24, className, filled }) => (
  <svg {...defaultProps} width={size} height={size} viewBox="0 0 24 24" className={className} fill={filled ? 'currentColor' : 'none'}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

export const Circle: React.FC<IconProps & { filled?: boolean }> = ({ size = 24, className, filled }) => (
  <svg {...defaultProps} width={size} height={size} viewBox="0 0 24 24" className={className} fill={filled ? 'currentColor' : 'none'}>
    <circle cx="12" cy="12" r="10" />
  </svg>
);

export const MoreVertical: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg {...defaultProps} width={size} height={size} viewBox="0 0 24 24" className={className}>
    <circle cx="12" cy="12" r="1" />
    <circle cx="12" cy="5" r="1" />
    <circle cx="12" cy="19" r="1" />
  </svg>
);

export const Minus: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg {...defaultProps} width={size} height={size} viewBox="0 0 24 24" className={className}>
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export const Square: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg {...defaultProps} width={size} height={size} viewBox="0 0 24 24" className={className}>
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
  </svg>
);

export const Maximize2: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg {...defaultProps} width={size} height={size} viewBox="0 0 24 24" className={className}>
    <polyline points="15 3 21 3 21 9" />
    <polyline points="9 21 3 21 3 15" />
    <line x1="21" y1="3" x2="14" y2="10" />
    <line x1="3" y1="21" x2="10" y2="14" />
  </svg>
);

export const Minimize2: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg {...defaultProps} width={size} height={size} viewBox="0 0 24 24" className={className}>
    <polyline points="4 14 10 14 10 20" />
    <polyline points="20 10 14 10 14 4" />
    <line x1="14" y1="10" x2="21" y2="3" />
    <line x1="3" y1="21" x2="10" y2="14" />
  </svg>
);

export const Check: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg {...defaultProps} width={size} height={size} viewBox="0 0 24 24" className={className}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export const AlertCircle: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg {...defaultProps} width={size} height={size} viewBox="0 0 24 24" className={className}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

export const AlertTriangle: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg {...defaultProps} width={size} height={size} viewBox="0 0 24 24" className={className}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

export const Info: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg {...defaultProps} width={size} height={size} viewBox="0 0 24 24" className={className}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

export const Download: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg {...defaultProps} width={size} height={size} viewBox="0 0 24 24" className={className}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

export const Upload: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg {...defaultProps} width={size} height={size} viewBox="0 0 24 24" className={className}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

export const ExternalLink: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg {...defaultProps} width={size} height={size} viewBox="0 0 24 24" className={className}>
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

export const Copy: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg {...defaultProps} width={size} height={size} viewBox="0 0 24 24" className={className}>
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

export const Box: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg {...defaultProps} width={size} height={size} viewBox="0 0 24 24" className={className}>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

export const Folder: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg {...defaultProps} width={size} height={size} viewBox="0 0 24 24" className={className}>
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

export const File: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg {...defaultProps} width={size} height={size} viewBox="0 0 24 24" className={className}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

export const Code: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg {...defaultProps} width={size} height={size} viewBox="0 0 24 24" className={className}>
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </svg>
);

export const Tag: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg {...defaultProps} width={size} height={size} viewBox="0 0 24 24" className={className}>
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
  </svg>
);

export const Hash: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg {...defaultProps} width={size} height={size} viewBox="0 0 24 24" className={className}>
    <line x1="4" y1="9" x2="20" y2="9" />
    <line x1="4" y1="15" x2="20" y2="15" />
    <line x1="10" y1="3" x2="8" y2="21" />
    <line x1="16" y1="3" x2="14" y2="21" />
  </svg>
);

export const Home: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg {...defaultProps} width={size} height={size} viewBox="0 0 24 24" className={className}>
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

export const Briefcase: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg {...defaultProps} width={size} height={size} viewBox="0 0 24 24" className={className}>
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);

export const User: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg {...defaultProps} width={size} height={size} viewBox="0 0 24 24" className={className}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export const Mail: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg {...defaultProps} width={size} height={size} viewBox="0 0 24 24" className={className}>
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

export const MessageSquare: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg {...defaultProps} width={size} height={size} viewBox="0 0 24 24" className={className}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

export const Calendar: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg {...defaultProps} width={size} height={size} viewBox="0 0 24 24" className={className}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

export const Clock: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg {...defaultProps} width={size} height={size} viewBox="0 0 24 24" className={className}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

export const Link: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg {...defaultProps} width={size} height={size} viewBox="0 0 24 24" className={className}>
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

export const Image: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg {...defaultProps} width={size} height={size} viewBox="0 0 24 24" className={className}>
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

export const Terminal: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg {...defaultProps} width={size} height={size} viewBox="0 0 24 24" className={className}>
    <polyline points="4 17 10 11 4 5" />
    <line x1="12" y1="19" x2="20" y2="19" />
  </svg>
);

export const Database: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg {...defaultProps} width={size} height={size} viewBox="0 0 24 24" className={className}>
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
  </svg>
);

export const Globe: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg {...defaultProps} width={size} height={size} viewBox="0 0 24 24" className={className}>
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

export const Keyboard: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg {...defaultProps} width={size} height={size} viewBox="0 0 24 24" className={className}>
    <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
    <path d="M6 8h.001" />
    <path d="M10 8h.001" />
    <path d="M14 8h.001" />
    <path d="M18 8h.001" />
    <path d="M8 12h.001" />
    <path d="M12 12h.001" />
    <path d="M16 12h.001" />
    <path d="M7 16h10" />
  </svg>
);

export const Zap: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg {...defaultProps} width={size} height={size} viewBox="0 0 24 24" className={className}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

export const Heart: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg {...defaultProps} width={size} height={size} viewBox="0 0 24 24" className={className}>
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

export const Archive: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg {...defaultProps} width={size} height={size} viewBox="0 0 24 24" className={className}>
    <polyline points="21 8 21 21 3 21 3 8" />
    <rect x="1" y="3" width="22" height="5" />
    <line x1="10" y1="12" x2="14" y2="12" />
  </svg>
);

export const Bookmark: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg {...defaultProps} width={size} height={size} viewBox="0 0 24 24" className={className}>
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);

export const Table: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg {...defaultProps} width={size} height={size} viewBox="0 0 24 24" className={className}>
    <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18" />
  </svg>
);

export const List: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg {...defaultProps} width={size} height={size} viewBox="0 0 24 24" className={className}>
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" />
    <line x1="3" y1="12" x2="3.01" y2="12" />
    <line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
);

export const Layers: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg {...defaultProps} width={size} height={size} viewBox="0 0 24 24" className={className}>
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </svg>
);

export const Shield: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg {...defaultProps} width={size} height={size} viewBox="0 0 24 24" className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

// Icon map for dynamic icon rendering
export const ICON_MAP: Record<string, React.FC<IconProps>> = {
  plus: Plus,
  x: X,
  settings: Settings,
  search: Search,
  clipboard: Clipboard,
  edit: Edit,
  trash: Trash,
  pin: Pin,
  'grip-vertical': GripVertical,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  star: Star,
  circle: Circle,
  'more-vertical': MoreVertical,
  minus: Minus,
  square: Square,
  'maximize-2': Maximize2,
  'minimize-2': Minimize2,
  check: Check,
  'alert-circle': AlertCircle,
  'alert-triangle': AlertTriangle,
  info: Info,
  download: Download,
  upload: Upload,
  'external-link': ExternalLink,
  copy: Copy,
  box: Box,
  folder: Folder,
  file: File,
  code: Code,
  tag: Tag,
  hash: Hash,
  home: Home,
  briefcase: Briefcase,
  user: User,
  mail: Mail,
  'message-square': MessageSquare,
  calendar: Calendar,
  clock: Clock,
  link: Link,
  image: Image,
  terminal: Terminal,
  database: Database,
  globe: Globe,
  keyboard: Keyboard,
  zap: Zap,
  heart: Heart,
  archive: Archive,
  bookmark: Bookmark,
  table: Table,
  list: List,
  layers: Layers,
  shield: Shield,
};

export const AVAILABLE_ICONS = Object.keys(ICON_MAP);

interface DynamicIconProps extends IconProps {
  name: string;
  filled?: boolean;
}

export const DynamicIcon: React.FC<DynamicIconProps> = ({ name, ...props }) => {
  const IconComponent = ICON_MAP[name];
  if (!IconComponent) {
    return <Box {...props} />;
  }
  return <IconComponent {...props} />;
};
