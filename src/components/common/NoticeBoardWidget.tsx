import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Calendar, 
  Tag, 
  AlertCircle, 
  Sparkles, 
  CheckCircle2, 
  ChevronRight, 
  Search, 
  X, 
  User, 
  Pin,
  Maximize2
} from 'lucide-react';
import { SchoolNotice } from '../../types';

interface NoticeBoardWidgetProps {
  targetAudience?: 'All' | 'Students' | 'Parents' | 'Teachers' | 'Faculty' | string;
  className?: string;
  isFullSection?: boolean;
}

export const NoticeBoardWidget: React.FC<NoticeBoardWidgetProps> = ({
  targetAudience,
  className = '',
  isFullSection = false,
}) => {
  const [notices, setNotices] = useState<SchoolNotice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedNotice, setSelectedNotice] = useState<SchoolNotice | null>(null);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/notices');
      if (res.ok) {
        const data = await res.json();
        const rawNotices: SchoolNotice[] = data.notices || [];
        // Filter by audience if specified, while retaining 'All'
        const filtered = targetAudience
          ? rawNotices.filter((n) => {
              const aud = (n.targetAudience || 'All').toLowerCase();
              const target = targetAudience.toLowerCase();
              if (aud === 'all') return true;
              if (target.includes('teacher') || target.includes('faculty')) {
                return aud.includes('teacher') || aud.includes('faculty') || aud === 'all';
              }
              if (target.includes('student')) {
                return aud.includes('student') || aud === 'all';
              }
              if (target.includes('parent')) {
                return aud.includes('parent') || aud === 'all';
              }
              return aud === target;
            })
          : rawNotices;

        setNotices(filtered);
      }
    } catch (err) {
      console.error('Failed to load notice board:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, [targetAudience]);

  const getCategoryStyle = (cat: string) => {
    switch (cat) {
      case 'Exam Schedule':
        return 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30';
      case 'Urgent Alert':
        return 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30';
      case 'Academic Notice':
        return 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30';
      default:
        return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
    }
  };

  const filteredNotices = notices.filter((n) => {
    const matchSearch =
      (n.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (n.content || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (n.authorName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = selectedCategory === 'all' || n.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const displayNotices = isFullSection ? filteredNotices : filteredNotices.slice(0, 4);

  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-sm space-y-5 transition-colors ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Bell className="w-4 h-4 stroke-[1.8]" />
          </div>
          <div>
            <h3 className="text-base font-serif font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Official Institutional Circulars &amp; Notices
              {targetAudience && (
                <span className="text-[10px] uppercase font-sans font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  {targetAudience}
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Broadcast announcements released by School Management and Academic Council.
            </p>
          </div>
        </div>

        {isFullSection && (
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search circulars..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none w-44 sm:w-56"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none"
            >
              <option value="all">All Categories</option>
              <option value="Academic Notice">Academic Notice</option>
              <option value="Exam Schedule">Exam Schedule</option>
              <option value="Urgent Alert">Urgent Alert</option>
              <option value="General Announcement">General Announcement</option>
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-8 text-center text-xs text-slate-400">
          Loading institutional circulars...
        </div>
      ) : displayNotices.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-800/80">
          No official circulars currently posted for this audience.
        </div>
      ) : (
        <div className={`grid ${isFullSection ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'} gap-4`}>
          {displayNotices.map((notice) => (
            <div
              key={notice.id}
              onClick={() => setSelectedNotice(notice)}
              className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between hover:border-amber-500/50 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${getCategoryStyle(
                      notice.category
                    )}`}
                  >
                    {notice.category}
                  </span>

                  <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1 font-mono">
                    <Calendar className="w-3 h-3" />
                    {new Date(notice.createdAt).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>

                <h4 className="text-sm font-serif font-bold text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-2">
                  {notice.title}
                </h4>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                  {notice.content}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-400" />
                  <strong className="text-slate-700 dark:text-slate-200">{notice.authorName}</strong>
                </span>
                <span className="font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <span>Read Notice</span>
                  <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full Notice View Modal */}
      {selectedNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="space-y-1">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${getCategoryStyle(
                    selectedNotice.category
                  )}`}
                >
                  {selectedNotice.category}
                </span>
                <h3 className="font-serif font-bold text-slate-900 dark:text-slate-100 text-lg">
                  {selectedNotice.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedNotice(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pb-2 border-b border-slate-100 dark:border-slate-800">
              <span>Released by: <strong className="text-slate-800 dark:text-slate-200">{selectedNotice.authorName}</strong></span>
              <span>{new Date(selectedNotice.createdAt).toLocaleString()}</span>
            </div>

            <div className="py-2 text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
              {selectedNotice.content}
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Audience: <strong className="text-amber-600 dark:text-amber-400 font-semibold">{selectedNotice.targetAudience}</strong>
              </span>
              <button
                onClick={() => setSelectedNotice(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Close Circular
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
