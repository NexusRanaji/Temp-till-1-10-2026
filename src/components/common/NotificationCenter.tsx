import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  Award, 
  Clock, 
  BookOpen, 
  CheckCheck, 
  X, 
  ChevronRight, 
  AlertTriangle, 
  Sparkles,
  ExternalLink,
  Filter
} from 'lucide-react';
import { NotificationItem, NotificationCategory } from '../../types';

interface NotificationCenterProps {
  currentUserId: string;
  currentUserRole: string;
  onNavigateTab?: (tab: string, linkId?: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  currentUserId,
  currentUserRole,
  onNavigateTab,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | NotificationCategory>('all');
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications', {
        headers: { 'x-user-id': currentUserId },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 45s for fresh notifications
    const interval = setInterval(fetchNotifications, 45000);
    return () => clearInterval(interval);
  }, [currentUserId, currentUserRole]);

  // Click outside to close panel
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: { 'x-user-id': currentUserId },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleItemClick = (item: NotificationItem) => {
    if (!item.read) {
      handleMarkAsRead(item.id);
    }
    setIsOpen(false);
    if (onNavigateTab && item.linkTab) {
      onNavigateTab(item.linkTab, item.linkId);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'all') return true;
    return n.category === activeFilter;
  });

  const getCategoryMeta = (category: NotificationCategory) => {
    switch (category) {
      case 'result':
        return {
          label: 'Exam Result',
          icon: Award,
          bg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
          dot: 'bg-emerald-500',
        };
      case 'deadline':
        return {
          label: 'Deadline Alert',
          icon: Clock,
          bg: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
          dot: 'bg-amber-500',
        };
      case 'announcement':
        return {
          label: 'Announcement',
          icon: BookOpen,
          bg: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
          dot: 'bg-indigo-500',
        };
      default:
        return {
          label: 'Alert',
          icon: Bell,
          bg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300',
          dot: 'bg-slate-400',
        };
    }
  };

  const formatRelativeTime = (timestamp: string) => {
    const diffMs = Date.now() - new Date(timestamp).getTime();
    const diffMins = Math.round(diffMs / (60 * 1000));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.round(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.round(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Trigger Button */}
      <button
        id="navbar-notification-btn"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 transition-colors text-xs cursor-pointer"
        title="Centralized Academic Notifications"
        aria-label={`Notifications, ${unreadCount} unread`}
        aria-expanded={isOpen}
      >
        <Bell className="w-3.5 h-3.5 stroke-[1.8]" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
          </span>
        )}
      </button>

      {/* Notifications Drawer / Popover Panel */}
      {isOpen && (
        <div 
          className="fixed inset-x-2 top-16 md:absolute md:inset-x-auto md:right-0 md:top-full md:mt-2 w-auto md:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                <Bell className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-xs font-serif font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <span>School Alerts &amp; Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold">
                      {unreadCount} New
                    </span>
                  )}
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Exam results, upcoming deadlines &amp; circulars
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-[11px] font-medium text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 px-2 py-1 rounded-md hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3 h-3" />
                  <span className="hidden sm:inline">Mark read</span>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label="Close notifications"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-1 p-2 bg-slate-100/70 dark:bg-slate-950/60 border-b border-slate-100 dark:border-slate-800 text-[11px] overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-2xs font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setActiveFilter('result')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                activeFilter === 'result'
                  ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 shadow-2xs font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              <Award className="w-3 h-3 text-emerald-500" />
              <span>Results</span>
            </button>
            <button
              onClick={() => setActiveFilter('deadline')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                activeFilter === 'deadline'
                  ? 'bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-300 shadow-2xs font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              <Clock className="w-3 h-3 text-amber-500" />
              <span>Deadlines</span>
            </button>
            <button
              onClick={() => setActiveFilter('announcement')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                activeFilter === 'announcement'
                  ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 shadow-2xs font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              <BookOpen className="w-3 h-3 text-indigo-500" />
              <span>Notices</span>
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-[65vh] sm:max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
            {filteredNotifications.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-2">
                  <Bell className="w-5 h-5 stroke-[1.5]" />
                </div>
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  All caught up!
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                  No active notifications in this category.
                </p>
              </div>
            ) : (
              filteredNotifications.map((item) => {
                const meta = getCategoryMeta(item.category);
                const Icon = meta.icon;

                return (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={`p-3.5 transition-colors cursor-pointer text-left relative group ${
                      !item.read
                        ? 'bg-amber-500/5 dark:bg-amber-500/5 hover:bg-amber-500/10'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Category Icon */}
                      <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${meta.bg}`}>
                        <Icon className="w-4 h-4" />
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className={`text-[10px] font-bold px-2 py-0.2 rounded-md border ${meta.bg}`}>
                            {meta.label}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {formatRelativeTime(item.timestamp)}
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                          {item.title}
                        </h4>

                        <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                          {item.message}
                        </p>

                        {/* Action link */}
                        {item.linkTab && (
                          <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100 dark:border-slate-800/60 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                            <span>
                              {item.category === 'result' ? 'View Answer Sheet & Performance' :
                               item.category === 'deadline' ? 'Go to Examination' :
                               item.category === 'announcement' && item.linkTab === 'materials' ? 'Open Study Notes' :
                               'View Notice & Circular'}
                            </span>
                            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        )}
                      </div>

                      {/* Unread indicator dot */}
                      {!item.read && (
                        <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-1" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 px-3">
            <span>Nexus Ranaji Examination Guard</span>
            <span className="font-mono text-[10px]">Real-time Sync Active</span>
          </div>
        </div>
      )}
    </div>
  );
};
