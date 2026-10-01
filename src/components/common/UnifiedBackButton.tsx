import React from 'react';
import { ArrowLeft, Home } from 'lucide-react';

interface UnifiedBackButtonProps {
  title: string;
  roleLabel: string;
  onBack: () => void;
  badge?: string | number;
  rightAction?: React.ReactNode;
}

export const UnifiedBackButton: React.FC<UnifiedBackButtonProps> = ({
  title,
  roleLabel,
  onBack,
  badge,
  rightAction,
}) => {
  const handleBack = () => {
    // Programmatically trigger a history pop if browser history exists
    try {
      if (window.history.length > 1) {
        window.history.back();
      }
    } catch {
      // Fallback
    }
    // Always guarantee navigating back to the primary role-based landing page
    onBack();
  };

  return (
    <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 sm:px-4 py-2 shadow-2xs mb-4 transition-colors">
      <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
        <button
          onClick={handleBack}
          id="unified-back-button"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 font-semibold text-xs transition-all shadow-2xs cursor-pointer group shrink-0 active:scale-95"
          title={`Back to ${roleLabel}`}
          aria-label={`Back to ${roleLabel}`}
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back</span>
        </button>

        <button
          onClick={onBack}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
          title={`Go to ${roleLabel}`}
          aria-label={`Go to ${roleLabel}`}
        >
          <Home className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 shrink-0" />

        <div className="flex items-center gap-2 min-w-0 truncate">
          <span className="text-[11px] text-slate-400 dark:text-slate-500 hidden sm:inline truncate">
            {roleLabel} /
          </span>
          <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
            {title}
          </h2>
          {badge !== undefined && badge !== null && (
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 shrink-0">
              {badge}
            </span>
          )}
        </div>
      </div>

      {rightAction && (
        <div className="flex items-center gap-2 shrink-0">
          {rightAction}
        </div>
      )}
    </div>
  );
};

