import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Send, 
  Trash2, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  Users, 
  Sparkles,
  Info
} from 'lucide-react';
import { SchoolNotice } from '../../types';

interface NoticeBoardAdminProps {
  currentUserName: string;
}

export const NoticeBoardAdmin: React.FC<NoticeBoardAdminProps> = ({ currentUserName }) => {
  const [notices, setNotices] = useState<SchoolNotice[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Examination Announcement');
  const [targetAudience, setTargetAudience] = useState<'All' | 'Students' | 'Parents' | 'Faculty'>('All');
  const [isPublishing, setIsPublishing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchNotices = async () => {
    try {
      const res = await fetch('/api/notices');
      if (res.ok) {
        const d = await res.json();
        setNotices(d.notices || []);
      }
    } catch (err) {
      console.error('Failed to load notices:', err);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsPublishing(true);
    setMessage(null);

    try {
      const res = await fetch('/api/notices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          category,
          targetAudience,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to publish notice');

      // Auto-pruned on backend, immediately update local state
      await fetchNotices();

      setTitle('');
      setContent('');
      setMessage('Notice published! Older entries automatically archived to retain latest 4 announcements.');
      setTimeout(() => setMessage(null), 5000);
    } catch (err: any) {
      setMessage(err.message || 'Error publishing notice');
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/notices/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setNotices((prev) => prev.filter((n) => n.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete notice:', err);
    }
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Publisher Form (Left Side) */}
      <div className="lg:col-span-5 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl transition-colors">
        <div className="mb-4">
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            Notice Broadcast System
          </span>
          <h2 className="text-lg font-serif font-bold text-slate-900 dark:text-slate-100 mt-1">
            Broadcast School Notice
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Publishes live announcements to student and parent dashboards. The system automatically maintains the latest 4 records.
          </p>
        </div>

        {message && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={handlePublish} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Notice Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Term II Examination Schedule Announcement"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none"
              >
                <option value="Examination Announcement">Examination</option>
                <option value="Academic Governance">Academic Governance</option>
                <option value="General Announcement">General School Notice</option>
                <option value="Holiday Notice">Holiday / Closure</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Audience
              </label>
              <select
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value as any)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none"
              >
                <option value="All">All Portals (General)</option>
                <option value="Students">Students Only</option>
                <option value="Parents">Parents Only</option>
                <option value="Faculty">Teachers Only</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Notice Body Content
            </label>
            <textarea
              required
              rows={4}
              placeholder="Detail instructions, dates, requirements, or instructions for students/parents..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500"
            />
          </div>

          <button
            type="submit"
            disabled={isPublishing}
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            {isPublishing ? 'Broadcasting...' : 'Publish & Broadcast Notice'}
          </button>
        </form>
      </div>

      {/* Live Notice Board: Strictly Latest 4 (Right Side) */}
      <div className="lg:col-span-7 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl transition-colors">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-500" />
              <h3 className="text-base font-serif font-bold text-slate-900 dark:text-slate-100">
                Official Institutional Notice Board
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Strictly rolling latest 4 messages. Older notices are automatically pruned.
            </p>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
            {notices.length} / 4 Displayed
          </span>
        </div>

        <div className="space-y-3">
          {notices.length === 0 ? (
            <div className="p-8 text-center text-slate-400 border border-dashed border-slate-300 dark:border-slate-800 rounded-xl">
              <Info className="w-6 h-6 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-semibold">No active notices on the board</p>
              <p className="text-xs text-slate-400 mt-1">Publish a notice to broadcast to the school community.</p>
            </div>
          ) : (
            notices.map((n, idx) => (
              <div
                key={n.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/60 hover:border-amber-500/40 transition-all relative group"
              >
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                      Notice #{idx + 1}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {n.category}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      Audience: {n.targetAudience}
                    </span>
                  </div>

                  <button
                    onClick={() => handleDelete(n.id)}
                    title="Delete Notice"
                    className="opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-600 p-1 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                  {n.title}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {n.content}
                </p>

                <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Issued by: <strong className="text-slate-700 dark:text-slate-300">{n.authorName}</strong> ({n.authorRole})</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(n.createdAt)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
