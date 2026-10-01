import React from 'react';
import { LucideIcon } from 'lucide-react';

export type CompoundIconVariant = 
  | 'amber' 
  | 'emerald' 
  | 'blue' 
  | 'indigo' 
  | 'rose' 
  | 'purple' 
  | 'teal' 
  | 'slate';

export type CompoundIconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface CompoundIconProps {
  primaryIcon: LucideIcon;
  secondaryIcon?: LucideIcon;
  variant?: CompoundIconVariant;
  size?: CompoundIconSize;
  badgePosition?: 'bottom-right' | 'top-right' | 'center-inset';
  className?: string;
  glow?: boolean;
}

export const CompoundIcon: React.FC<CompoundIconProps> = ({
  primaryIcon: PrimaryIcon,
  secondaryIcon: SecondaryIcon,
  variant = 'amber',
  size = 'md',
  badgePosition = 'bottom-right',
  className = '',
  glow = false,
}) => {
  const getThemeClasses = (v: CompoundIconVariant) => {
    switch (v) {
      case 'amber':
        return {
          container: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
          badge: 'bg-amber-500 text-slate-950 border-white dark:border-slate-900 shadow-amber-500/30',
          glowColor: 'shadow-amber-500/20',
          secondaryText: 'text-amber-600 dark:text-amber-300',
        };
      case 'emerald':
        return {
          container: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
          badge: 'bg-emerald-500 text-white border-white dark:border-slate-900 shadow-emerald-500/30',
          glowColor: 'shadow-emerald-500/20',
          secondaryText: 'text-emerald-600 dark:text-emerald-300',
        };
      case 'blue':
        return {
          container: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
          badge: 'bg-blue-600 text-white border-white dark:border-slate-900 shadow-blue-500/30',
          glowColor: 'shadow-blue-500/20',
          secondaryText: 'text-blue-600 dark:text-blue-300',
        };
      case 'indigo':
        return {
          container: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
          badge: 'bg-indigo-600 text-white border-white dark:border-slate-900 shadow-indigo-500/30',
          glowColor: 'shadow-indigo-500/20',
          secondaryText: 'text-indigo-600 dark:text-indigo-300',
        };
      case 'rose':
        return {
          container: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
          badge: 'bg-rose-500 text-white border-white dark:border-slate-900 shadow-rose-500/30',
          glowColor: 'shadow-rose-500/20',
          secondaryText: 'text-rose-600 dark:text-rose-300',
        };
      case 'purple':
        return {
          container: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
          badge: 'bg-purple-600 text-white border-white dark:border-slate-900 shadow-purple-500/30',
          glowColor: 'shadow-purple-500/20',
          secondaryText: 'text-purple-600 dark:text-purple-300',
        };
      case 'teal':
        return {
          container: 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30',
          badge: 'bg-teal-500 text-slate-950 border-white dark:border-slate-900 shadow-teal-500/30',
          glowColor: 'shadow-teal-500/20',
          secondaryText: 'text-teal-600 dark:text-teal-300',
        };
      case 'slate':
      default:
        return {
          container: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700',
          badge: 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 border-white dark:border-slate-900 shadow-slate-900/20',
          glowColor: 'shadow-slate-500/20',
          secondaryText: 'text-slate-600 dark:text-slate-300',
        };
    }
  };

  const getSizeClasses = (s: CompoundIconSize) => {
    switch (s) {
      case 'xs':
        return {
          container: 'w-7 h-7 rounded-lg border',
          primary: 'w-3.5 h-3.5',
          badge: 'w-3.5 h-3.5 border-[1.5px] -bottom-1 -right-1',
          badgeTop: 'w-3.5 h-3.5 border-[1.5px] -top-1 -right-1',
          badgeIcon: 'w-2 h-2',
          insetBadge: 'w-3 h-3',
        };
      case 'sm':
        return {
          container: 'w-9 h-9 rounded-xl border',
          primary: 'w-4.5 h-4.5',
          badge: 'w-4.5 h-4.5 border-2 -bottom-1 -right-1',
          badgeTop: 'w-4.5 h-4.5 border-2 -top-1 -right-1',
          badgeIcon: 'w-2.5 h-2.5',
          insetBadge: 'w-3.5 h-3.5',
        };
      case 'lg':
        return {
          container: 'w-13 h-13 rounded-2xl border',
          primary: 'w-6 h-6',
          badge: 'w-6 h-6 border-2 -bottom-1.5 -right-1.5',
          badgeTop: 'w-6 h-6 border-2 -top-1.5 -right-1.5',
          badgeIcon: 'w-3.5 h-3.5',
          insetBadge: 'w-4.5 h-4.5',
        };
      case 'xl':
        return {
          container: 'w-16 h-16 rounded-3xl border-2',
          primary: 'w-8 h-8',
          badge: 'w-7 h-7 border-2 -bottom-2 -right-2',
          badgeTop: 'w-7 h-7 border-2 -top-2 -right-2',
          badgeIcon: 'w-4 h-4',
          insetBadge: 'w-5 h-5',
        };
      case 'md':
      default:
        return {
          container: 'w-11 h-11 rounded-2xl border',
          primary: 'w-5 h-5',
          badge: 'w-5 h-5 border-2 -bottom-1 -right-1',
          badgeTop: 'w-5 h-5 border-2 -top-1 -right-1',
          badgeIcon: 'w-3 h-3',
          insetBadge: 'w-4 h-4',
        };
    }
  };

  const theme = getThemeClasses(variant);
  const sizeMeta = getSizeClasses(size);

  return (
    <div
      className={`relative flex items-center justify-center shrink-0 transition-transform select-none ${
        sizeMeta.container
      } ${theme.container} ${glow ? `shadow-lg ${theme.glowColor}` : 'shadow-2xs'} ${className}`}
    >
      {/* Primary Icon */}
      <PrimaryIcon className={`${sizeMeta.primary} stroke-[1.8]`} />

      {/* Secondary Nested / Badge Icon */}
      {SecondaryIcon && (
        badgePosition === 'center-inset' ? (
          // Inset right inside the center/belly of the parent icon
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <SecondaryIcon className={`${sizeMeta.insetBadge} ${theme.secondaryText} stroke-[2.2] drop-shadow-xs`} />
          </div>
        ) : badgePosition === 'top-right' ? (
          // Nested badge at top-right corner
          <div
            className={`absolute flex items-center justify-center rounded-full shadow-xs ${
              sizeMeta.badgeTop
            } ${theme.badge}`}
          >
            <SecondaryIcon className={`${sizeMeta.badgeIcon} stroke-[2.5]`} />
          </div>
        ) : (
          // Standard nested badge at bottom-right corner (icon inside/over icon)
          <div
            className={`absolute flex items-center justify-center rounded-full shadow-xs ${
              sizeMeta.badge
            } ${theme.badge}`}
          >
            <SecondaryIcon className={`${sizeMeta.badgeIcon} stroke-[2.5]`} />
          </div>
        )
      )}
    </div>
  );
};

/**
 * Specialized Folder-With-File Component (Literal 3D-styled file nested inside folder)
 */
export const FolderWithFileIcon: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  variant?: CompoundIconVariant;
  fileCount?: number;
  className?: string;
}> = ({ size = 'md', variant = 'amber', fileCount, className = '' }) => {
  const getDims = () => {
    switch (size) {
      case 'sm':
        return {
          container: 'w-9 h-9 rounded-xl',
          folder: 'w-5 h-5',
          sheet: 'w-3.5 h-3.5',
          countText: 'text-[9px]',
        };
      case 'lg':
        return {
          container: 'w-14 h-14 rounded-2xl',
          folder: 'w-8 h-8',
          sheet: 'w-5 h-5',
          countText: 'text-xs',
        };
      case 'md':
      default:
        return {
          container: 'w-11 h-11 rounded-2xl',
          folder: 'w-6 h-6',
          sheet: 'w-4 h-4',
          countText: 'text-[10px]',
        };
    }
  };

  const dims = getDims();

  const getColors = () => {
    switch (variant) {
      case 'blue':
        return {
          bg: 'bg-blue-500/15 border-blue-500/30 text-blue-600 dark:text-blue-400',
          folderFill: 'fill-blue-500/20 text-blue-600 dark:text-blue-400',
          sheetBg: 'bg-white dark:bg-slate-900 border-blue-500/40 text-blue-600',
        };
      case 'emerald':
        return {
          bg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400',
          folderFill: 'fill-emerald-500/20 text-emerald-600 dark:text-emerald-400',
          sheetBg: 'bg-white dark:bg-slate-900 border-emerald-500/40 text-emerald-600',
        };
      case 'indigo':
        return {
          bg: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-600 dark:text-indigo-400',
          folderFill: 'fill-indigo-500/20 text-indigo-600 dark:text-indigo-400',
          sheetBg: 'bg-white dark:bg-slate-900 border-indigo-500/40 text-indigo-600',
        };
      case 'amber':
      default:
        return {
          bg: 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400',
          folderFill: 'fill-amber-500/20 text-amber-600 dark:text-amber-400',
          sheetBg: 'bg-white dark:bg-slate-900 border-amber-500/40 text-amber-600',
        };
    }
  };

  const colors = getColors();

  return (
    <div
      className={`relative flex items-center justify-center shrink-0 border shadow-2xs ${dims.container} ${colors.bg} ${className}`}
    >
      {/* Folder Backing */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`${dims.folder} ${colors.folderFill} transition-transform group-hover:scale-105`}
      >
        <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
      </svg>

      {/* Nested Document Sheet Peeking Inside the Folder */}
      <div
        className={`absolute -top-0.5 right-1.5 rounded-sm border shadow-xs flex flex-col justify-center px-0.5 py-0.5 pointer-events-none transition-transform group-hover:-translate-y-1 ${dims.sheet} ${colors.sheetBg}`}
      >
        <div className="w-full h-0.5 rounded-full bg-current opacity-70 mb-0.5" />
        <div className="w-2/3 h-0.5 rounded-full bg-current opacity-40 mb-0.5" />
        <div className="w-4/5 h-0.5 rounded-full bg-current opacity-40" />
      </div>

      {/* Optional File Count Tag */}
      {typeof fileCount === 'number' && fileCount > 0 && (
        <span
          className={`absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full font-mono font-bold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border border-white dark:border-slate-800 ${dims.countText}`}
        >
          {fileCount}
        </span>
      )}
    </div>
  );
};
