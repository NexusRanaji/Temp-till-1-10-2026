import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Award, 
  Clock, 
  CheckCircle2, 
  ShieldAlert, 
  HelpCircle, 
  MessageSquare, 
  Send, 
  Plus, 
  BookOpen, 
  Calendar,
  AlertTriangle,
  FileText,
  ChevronDown,
  Sparkles,
  ExternalLink,
  Trash2,
  Bell,
  Eye,
  FolderDown,
  ArrowLeft,
  Search,
  ArrowLeftRight,
  GraduationCap,
  TrendingUp,
  Star,
  FileCheck2,
  Home,
  ChevronRight
} from 'lucide-react';
import { UserCredential, SupportTicket } from '../../types';
import { ConfirmModal } from '../common/ConfirmModal';
import { NoticeBoardWidget } from '../common/NoticeBoardWidget';
import { StudentProgressChart } from '../analytics/StudentProgressChart';
import { MathRenderer } from '../common/MathRenderer';
import { ExamReviewModal } from '../student/ExamReviewModal';
import { useSwipeTabs } from '../../hooks/useSwipeTabs';
import { CompoundIcon, FolderWithFileIcon } from '../common/CompoundIcon';
import { UnifiedBackButton } from '../common/UnifiedBackButton';

const PARENT_TABS: ('home' | 'overview' | 'submissions' | 'materials' | 'helpdesk' | 'notices')[] = [
  'home',
  'overview',
  'submissions',
  'materials',
  'helpdesk',
  'notices',
];

const PARENT_TAB_TITLES: Record<string, string> = {
  home: 'Dashboard Home',
  overview: 'Ward Overview',
  submissions: 'Test Records & Marks',
  materials: 'Study Notes',
  helpdesk: 'Helpdesk & Inquiries',
  notices: 'Circulars',
};

interface ParentDashboardProps {
  currentUser: UserCredential;
  activeTab?: 'home' | 'overview' | 'submissions' | 'helpdesk' | 'materials' | 'notices';
  onTabChange?: (tab: 'home' | 'overview' | 'submissions' | 'helpdesk' | 'materials' | 'notices') => void;
}

export const ParentDashboard: React.FC<ParentDashboardProps> = ({ 
  currentUser,
  activeTab: propActiveTab,
  onTabChange,
}) => {
  const [internalTab, setInternalTab] = useState<'home' | 'overview' | 'submissions' | 'helpdesk' | 'materials' | 'notices'>('home');
  const activeTab = propActiveTab || internalTab;
  const setActiveTab = (tab: 'home' | 'overview' | 'submissions' | 'helpdesk' | 'materials' | 'notices') => {
    if (onTabChange) onTabChange(tab);
    else setInternalTab(tab);
  };
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [childData, setChildData] = useState<any | null>(null);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Review modal state for examining student answer sheets
  const [reviewExamId, setReviewExamId] = useState<string | null>(null);

  // Material filters
  const [materialSearch, setMaterialSearch] = useState('');
  const [selectedMaterialSubject, setSelectedMaterialSubject] = useState('all');

  // Helpdesk sub-filter for mobile
  const [ticketStatusFilter, setTicketStatusFilter] = useState<'all' | 'Open' | 'Resolved'>('all');

  // Confirm Modal state for deletion
  const [ticketToDelete, setTicketToDelete] = useState<string | null>(null);
  const [isDeletingTicket, setIsDeletingTicket] = useState(false);

  // New Support Ticket Form State
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketCategory, setTicketCategory] = useState<'Technical Glitch / System Error' | 'Grading / Score Discrepancy' | 'Attendance / Absence' | 'General Inquiry'>('Technical Glitch / System Error');
  const [ticketMessage, setTicketMessage] = useState('');
  const [recipients, setRecipients] = useState<any[]>([]);
  const [selectedRecipientId, setSelectedRecipientId] = useState<string>('');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);

  // Ticket Thread Selection & Reply State
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch restricted recipient options for the selected ward
  const fetchRecipients = async (childId?: string) => {
    try {
      const cid = childId || selectedChildId;
      const url = cid ? `/api/parent/recipients?studentId=${cid}` : '/api/parent/recipients';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setRecipients(data.recipients || []);
        if (data.recipients && data.recipients.length > 0) {
          setSelectedRecipientId(data.recipients[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load recipients:', err);
    }
  };

  // Fetch Parent Ward / Children Profiles & Materials
  const fetchParentData = async () => {
    try {
      setLoading(true);
      const [cRes, tRes, mRes] = await Promise.all([
        fetch('/api/parent/children', { headers: { 'x-user-id': currentUser.id } }),
        fetch('/api/tickets', { headers: { 'x-user-id': currentUser.id } }),
        fetch('/api/materials'),
      ]);

      if (cRes.ok) {
        const data = await cRes.json();
        setChildren(data.children || []);
        if (data.children?.length > 0) {
          const targetId = selectedChildId || data.children[0].id;
          setSelectedChildId(targetId);
          fetchChildDetails(targetId);
          fetchRecipients(targetId);
        }
      }

      if (tRes.ok) {
        const td = await tRes.json();
        setTickets(td.tickets || []);
      }

      if (mRes.ok) {
        const md = await mRes.json();
        setMaterials(md.materials || []);
      }
    } catch (err) {
      console.error('Failed to load parent dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchChildDetails = async (childId: string) => {
    try {
      const res = await fetch(`/api/parent/children/${childId}/details`);
      if (res.ok) {
        const data = await res.json();
        setChildData(data);
      }
    } catch (err) {
      console.error('Failed to load child details:', err);
    }
  };

  useEffect(() => {
    fetchParentData();
  }, [currentUser.id]);

  const handleSelectChild = (childId: string) => {
    setSelectedChildId(childId);
    fetchChildDetails(childId);
    fetchRecipients(childId);
  };

  // Submit New Support Ticket (Instant UI update without page refresh)
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject || !ticketMessage) return;

    setIsSubmittingTicket(true);
    try {
      const activeChild = children.find((c) => c.id === selectedChildId);
      const selectedRecipient = recipients.find((r) => r.id === selectedRecipientId);

      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({
          parentId: currentUser.id,
          parentName: currentUser.name,
          studentId: selectedChildId,
          studentName: activeChild?.name || 'Ward',
          studentClass: `${activeChild?.className || 'Class 10'} - ${activeChild?.divisionName || 'Div A'}`,
          subject: ticketSubject,
          category: ticketCategory,
          message: ticketMessage,
          recipientId: selectedRecipient?.id,
          recipientName: selectedRecipient?.name,
          recipientRole: selectedRecipient?.role,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.ticket) {
          // Instant state update: prepend ticket to list immediately
          setTickets((prev) => [data.ticket, ...prev]);
          setSelectedTicket(data.ticket);
        }
        showToast('Support query dispatched to chosen recipient.');
        setShowNewTicketModal(false);
        setTicketSubject('');
        setTicketMessage('');
      }
    } catch (err) {
      console.error('Failed to create ticket:', err);
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  // Delete ticket trigger
  const handleDeleteTicket = (ticketId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setTicketToDelete(ticketId);
  };

  const confirmDeleteTicket = async () => {
    if (!ticketToDelete) return;
    try {
      setIsDeletingTicket(true);
      const res = await fetch(`/api/tickets/${ticketToDelete}`, {
        method: 'DELETE',
        headers: { 'x-user-id': currentUser.id },
      });

      if (res.ok) {
        // Instant state update: remove from list
        setTickets((prev) => prev.filter((t) => t.id !== ticketToDelete));
        if (selectedTicket?.id === ticketToDelete) {
          setSelectedTicket(null);
        }
        showToast('Support inquiry deleted successfully.');
      } else {
        showToast('Failed to delete support inquiry.');
      }
    } catch (err) {
      console.error('Failed to delete ticket:', err);
      showToast('Network error deleting inquiry.');
    } finally {
      setIsDeletingTicket(false);
      setTicketToDelete(null);
    }
  };

  // Reply to ticket
  const handleSendReply = async (ticketId: string) => {
    if (!replyText.trim()) return;

    try {
      const res = await fetch(`/api/tickets/${ticketId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({ message: replyText }),
      });

      if (res.ok) {
        const data = await res.json();
        setReplyText('');
        setSelectedTicket(data.ticket);
        setTickets((prev) => prev.map((t) => (t.id === ticketId ? data.ticket : t)));
        showToast('Reply added to thread.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const selectedChild = children.find((c) => c.id === selectedChildId);
  const submissions: any[] = childData?.submissions || [];
  const flaggedCount = submissions.filter((s) => s.cheatingFlagged).length;

  // Swipe-to-navigate gesture integration for mobile touch screens
  const { touchHandlers, swipeFeedback } = useSwipeTabs({
    tabs: PARENT_TABS,
    activeTab: PARENT_TABS.includes(activeTab as any) ? activeTab : 'overview',
    onTabChange: (newTab) => setActiveTab(newTab as any),
    enabled: !reviewExamId && !showNewTicketModal && !ticketToDelete,
  });

  return (
    <div className="space-y-4 pb-24 md:pb-8 relative">
      {/* Sub-Page Unified Back Navigation (Only visible when viewing dedicated sub-pages) */}
      {activeTab !== 'home' && (
        <UnifiedBackButton
          title={
            activeTab === 'overview' ? 'Ward Overview' :
            activeTab === 'submissions' ? 'Test Records' :
            activeTab === 'materials' ? 'Study Notes' :
            activeTab === 'helpdesk' ? 'Helpdesk' :
            'Circulars'
          }
          roleLabel="Parent Portal"
          onBack={() => setActiveTab('home')}
          badge={
            activeTab === 'submissions' ? `${submissions.length} Records` :
            activeTab === 'materials' ? `${materials.length} Notes` :
            activeTab === 'helpdesk' ? `${tickets.length} Tickets` :
            undefined
          }
        />
      )}

      {/* Main Account Dashboard Home: Parent Portal Hub & Interactive Module Grid */}
      {activeTab === 'home' && (
        <div className="space-y-5">
          {/* Mobile-First Parent Observatory Header */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/25 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                Parent &amp; Guardian Portal
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Nexus Ranaji English School
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 dark:text-slate-100">
              Welcome, {currentUser.name}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live academic progress, verified test scores, anti-cheating audit records, and faculty communication.
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-2 self-start md:self-auto bg-slate-50 dark:bg-slate-950/80 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-2.5 shrink-0 text-xs">
            <Award className="w-4 h-4 text-amber-500" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase block font-medium">Selected Ward</span>
              <span className="font-bold text-slate-900 dark:text-slate-100 font-serif">
                {selectedChild?.name || 'No Ward'}
              </span>
            </div>
          </div>
        </div>

        {/* Multi-Child Selector Horizontal Touch Carousel */}
        {children.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Enrolled Children ({children.length})</span>
              <span className="text-[11px]">Tap to switch ward</span>
            </div>

            <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar touch-pan-x pb-1 -mx-1 px-1">
              {children.map((child) => {
                const isSelected = child.id === selectedChildId;
                const initials = child.name ? child.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : 'ST';
                return (
                  <button
                    key={child.id}
                    onClick={() => handleSelectChild(child.id)}
                    className={`flex items-center gap-3 p-2.5 sm:p-3 rounded-2xl border transition-all shrink-0 cursor-pointer text-left min-w-[200px] sm:min-w-[220px] ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500 text-slate-900 dark:text-slate-100 shadow-sm ring-1 ring-amber-500/40'
                        : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 shadow-xs ${
                      isSelected 
                        ? 'bg-amber-500 text-slate-950 font-mono' 
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}>
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs truncate flex items-center gap-1.5">
                        <span className="truncate">{child.name}</span>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Active selection" />
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        {child.className || 'Standard 10'} · {child.divisionName || 'Div A'}
                      </p>
                      <span className="text-[9px] font-mono text-slate-400 block truncate">
                        Roll: {child.rollNo || 'NRES-01'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Global Toast */}
        {toastMessage && (
          <div className="mt-3 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>

      {/* Quick Metrics for selected child */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs">
              <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Ward Name</span>
              <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 font-serif truncate block">
                {selectedChild?.name || 'No Ward'}
              </span>
              <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium mt-0.5 block truncate">
                Roll: {selectedChild?.rollNo || 'NRES-10A-01'}
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs">
              <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Completed Exams</span>
              <span className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
                {submissions.length}
              </span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5 block">
                Verified Assessments
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs">
              <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Study Notes</span>
              <span className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
                {materials.length}
              </span>
              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-0.5 block">
                Curriculum Files
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs">
              <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Helpdesk Inquiries</span>
              <span className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
                {tickets.length}
              </span>
              <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium mt-0.5 block">
                Active Discussions
              </span>
            </div>
          </div>

          {/* User-Friendly Small Icons Module Launcher */}
          <div>
            <div className="flex items-center justify-between mb-2.5 px-0.5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Parent Services &amp; Portal Modules
              </h2>
              <span className="text-[11px] text-slate-400">Click icon to open dedicated page</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
              {/* Icon 1: Ward Overview */}
              <button
                onClick={() => setActiveTab('overview')}
                className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/20 transition-all text-left cursor-pointer shadow-2xs group active:scale-95"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Users className="w-4 h-4 stroke-[2]" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate block">
                    Ward Overview
                  </span>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                    Academic progress
                  </p>
                </div>
              </button>

              {/* Icon 2: Test Records (5) */}
              <button
                onClick={() => setActiveTab('submissions')}
                className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20 transition-all text-left cursor-pointer shadow-2xs group active:scale-95"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Award className="w-4 h-4 stroke-[2]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      Test Records
                    </span>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 shrink-0">
                      {submissions.length}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                    Scores &amp; marks
                  </p>
                </div>
              </button>

              {/* Icon 3: Study Notes (3) */}
              <button
                onClick={() => setActiveTab('materials')}
                className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 hover:bg-amber-50/20 dark:hover:bg-amber-950/20 transition-all text-left cursor-pointer shadow-2xs group active:scale-95"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <FolderDown className="w-4 h-4 stroke-[2]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      Study Notes
                    </span>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 shrink-0">
                      {materials.length}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                    Curriculum files
                  </p>
                </div>
              </button>

              {/* Icon 4: Helpdesk (1) */}
              <button
                onClick={() => setActiveTab('helpdesk')}
                className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-rose-500/50 hover:bg-rose-50/20 dark:hover:bg-rose-950/20 transition-all text-left cursor-pointer shadow-2xs group active:scale-95"
              >
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <MessageSquare className="w-4 h-4 stroke-[2]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      Helpdesk
                    </span>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-md bg-rose-500/10 text-rose-700 dark:text-rose-300 shrink-0">
                      {tickets.length}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                    Faculty discussions
                  </p>
                </div>
              </button>

              {/* Icon 5: Circulars */}
              <button
                onClick={() => setActiveTab('notices')}
                className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-sky-500/50 hover:bg-sky-50/20 dark:hover:bg-sky-950/20 transition-all text-left cursor-pointer shadow-2xs group active:scale-95"
              >
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Bell className="w-4 h-4 stroke-[2]" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate block">
                    Circulars
                  </span>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                    School notices
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 1: Academic Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Metrics for selected child */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Exams Completed</span>
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100 mt-1">
                {submissions.length}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Unit &amp; term assessments</p>
            </div>

            <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Average Score</span>
              <div className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-1">
                {submissions.length > 0
                  ? Math.round(submissions.reduce((acc, s) => acc + s.percentage, 0) / submissions.length)
                  : 0}%
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Classroom grading metric</p>
            </div>

            <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Bonus Accumulated</span>
              <div className="text-2xl font-bold font-mono text-amber-700 dark:text-amber-400 mt-1 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                {selectedChild?.bonusPoints || 100} pts
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Awarded matching test %</p>
            </div>

            <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Integrity Flags</span>
              <div className={`text-2xl font-bold font-mono mt-1 ${flaggedCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-slate-200'}`}>
                {flaggedCount}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {flaggedCount === 0 ? 'Zero infractions recorded' : 'Window blur detected'}
              </p>
            </div>
          </div>

          {/* Child Information Card */}
          <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-3.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                  Ward Profile
                </span>
                <h3 className="text-lg font-serif font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                  {selectedChild?.name}
                </h3>
              </div>
              <span className="text-xs font-mono font-medium px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                Roll: {selectedChild?.rollNo || 'NRES-10A-01'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Class &amp; Section:</span>
                <p className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">{selectedChild?.className} – {selectedChild?.divisionName}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Student Username:</span>
                <p className="font-mono font-semibold text-slate-900 dark:text-slate-100 mt-0.5">{selectedChild?.username}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Academic Standing:</span>
                <p className="font-semibold text-emerald-700 dark:text-emerald-400 mt-0.5">Good Academic Standing</p>
              </div>
            </div>
          </div>

          {/* Graphical Visualization of Academic Progress (Recharts) */}
          <StudentProgressChart
            submissions={submissions}
            studentName={selectedChild?.name}
            title={`${selectedChild?.name || 'Student'}'s Academic Progress & Test Score Trend`}
            subtitle="Longitudinal performance metrics, test score trajectories, and proficiency trends over time"
          />
        </div>
      )}

      {/* Tab 2: Test Records & Anti-Cheating Logs */}
      {activeTab === 'submissions' && (
        <div className="space-y-6">
          {/* Graphical Progress Observatory */}
          <StudentProgressChart
            submissions={submissions}
            studentName={selectedChild?.name}
            title={`${selectedChild?.name || 'Student'}'s Score Trend Observatory`}
            subtitle="Filter by subject or inspect chronological performance trajectory before reviewing individual answer logs"
          />

          <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="font-serif font-bold text-slate-900 dark:text-slate-100 text-base">
                  Assessment History for {selectedChild?.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Detailed breakdown of scores, bonus points earned, and anti-cheating window blur records.
                </p>
              </div>

              {flaggedCount > 0 && (
                <div className="px-3.5 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Cheating Incident Logged by Invigilator</span>
                </div>
              )}
            </div>

            {submissions.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                No exam submissions recorded yet for {selectedChild?.name}.
              </div>
            ) : (
              <div className="space-y-4">
                {submissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-4 sm:p-5 rounded-3xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs flex flex-col space-y-4 transition-all hover:border-slate-300 dark:hover:border-slate-700"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20">
                          {sub.subjectName}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          sub.passed ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30'
                        }`}>
                          {sub.passed ? 'Passed' : 'Needs Improvement'}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Date: {new Date(sub.submittedAt).toLocaleDateString()} at {new Date(sub.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                        <MathRenderer content={sub.examTitle} inline />
                      </h4>
                    </div>

                    {/* Score, Bonus & Integrity Grid */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-3 text-center text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Marks Scored</span>
                        <div className="text-sm sm:text-base font-mono font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                          {sub.score} / {sub.totalMarks} ({sub.percentage}%)
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Bonus Earned</span>
                        <div className="text-sm sm:text-base font-mono font-bold text-amber-600 dark:text-amber-400 mt-0.5 flex items-center justify-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" />
                          +{sub.bonusPointsAwarded}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Integrity Status</span>
                        {sub.cheatingFlagged ? (
                          <div className="text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center justify-center gap-1 mt-0.5">
                            <ShieldAlert className="w-3.5 h-3.5" />
                            Flagged
                          </div>
                        ) : sub.cheatingDetails && sub.cheatingDetails.violationCount > 0 ? (
                          <div className="text-amber-600 dark:text-amber-400 text-xs font-semibold flex items-center justify-center gap-1 mt-0.5">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {sub.cheatingDetails.violationCount} focus blur(s)
                          </div>
                        ) : (
                          <div className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center justify-center gap-1 mt-0.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Clean
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Touch CTA: Review Exam Sheet & Solutions */}
                    <button
                      onClick={() => setReviewExamId(sub.examId)}
                      className="w-full h-11 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 active:scale-[0.99] text-amber-900 dark:text-amber-300 border border-amber-500/40 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Review Exam Sheet &amp; Solutions</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Study Notes & Curriculum Materials */}
      {activeTab === 'materials' && (() => {
        const subjectsInMaterials = Array.from(new Set(materials.map((m) => m.subjectName)));
        const filteredMaterials = materials.filter((m) => {
          const matchQuery =
            !materialSearch ||
            m.title.toLowerCase().includes(materialSearch.toLowerCase()) ||
            m.subjectName.toLowerCase().includes(materialSearch.toLowerCase()) ||
            (m.description && m.description.toLowerCase().includes(materialSearch.toLowerCase()));
          const matchSubj = selectedMaterialSubject === 'all' || m.subjectName === selectedMaterialSubject;
          return matchQuery && matchSubj;
        });

        return (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-serif font-bold text-slate-900 dark:text-slate-100">
                  Classroom Syllabus &amp; Study Notes
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Curriculum resources and revision guides assigned for {selectedChild?.name || 'your ward'}&apos;s class.
                </p>
              </div>

              {/* Mobile Search input */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search notes &amp; syllabus..."
                  value={materialSearch}
                  onChange={(e) => setMaterialSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Subject Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar touch-pan-x pb-1 -mx-1 px-1">
              <button
                onClick={() => setSelectedMaterialSubject('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                  selectedMaterialSubject === 'all'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                All Subjects
              </button>
              {subjectsInMaterials.map((subj) => (
                <button
                  key={subj}
                  onClick={() => setSelectedMaterialSubject(subj)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                    selectedMaterialSubject === subj
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {subj}
                </button>
              ))}
            </div>

            {/* Materials Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              {filteredMaterials.map((mat) => (
                <div key={mat.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 flex flex-col justify-between shadow-xs space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                        {mat.subjectName}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-mono">
                        {mat.type}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                      <MathRenderer content={mat.title} inline />
                    </h3>
                    <div className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                      <MathRenderer content={mat.description} inline />
                    </div>
                    <p className="text-[11px] text-slate-500">Instructor: {mat.teacherName}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 truncate max-w-[130px]">{mat.fileName || 'Online Resource'}</span>
                    <a
                      href={mat.url}
                      target="_blank"
                      rel="noreferrer"
                      className="h-9 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1.5 text-xs font-semibold transition-colors"
                    >
                      <span>Open Note</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Tab 4: Teacher Helpdesk & Support Tickets */}
      {activeTab === 'helpdesk' && (() => {
        const filteredTickets = tickets.filter((t) => {
          if (ticketStatusFilter === 'Open') return t.status === 'Open' || t.status === 'In Progress';
          if (ticketStatusFilter === 'Resolved') return t.status === 'Resolved';
          return true;
        });

        return (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-serif font-bold text-slate-900 dark:text-slate-100 text-base">
                  Teacher Helpdesk &amp; Communication Channels
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Raise inquiries regarding score reviews, rescheduling, or curriculum doubts with faculty.
                </p>
              </div>

              <button
                onClick={() => {
                  fetchRecipients(selectedChildId);
                  setShowNewTicketModal(true);
                }}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-2xl shadow-md shadow-amber-500/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Raise Support Ticket</span>
              </button>
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl overflow-x-auto no-scrollbar touch-pan-x">
              <button
                onClick={() => setTicketStatusFilter('all')}
                className={`flex-1 min-w-[70px] py-1.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer text-center ${
                  ticketStatusFilter === 'all'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                All ({tickets.length})
              </button>
              <button
                onClick={() => setTicketStatusFilter('Open')}
                className={`flex-1 min-w-[80px] py-1.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer text-center ${
                  ticketStatusFilter === 'Open'
                    ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Open ({tickets.filter((t) => t.status === 'Open' || t.status === 'In Progress').length})
              </button>
              <button
                onClick={() => setTicketStatusFilter('Resolved')}
                className={`flex-1 min-w-[90px] py-1.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer text-center ${
                  ticketStatusFilter === 'Resolved'
                    ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Resolved ({tickets.filter((t) => t.status === 'Resolved').length})
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              
              {/* Tickets List */}
              <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 space-y-3 shadow-xs ${
                selectedTicket ? 'hidden lg:block' : 'block'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    My Raised Tickets ({filteredTickets.length})
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Instant Sync</span>
                </div>

                {filteredTickets.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 dark:text-slate-400 text-xs">
                    <HelpCircle className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto mb-2" />
                    No inquiries in this category. Click &quot;Raise Support Ticket&quot; to reach faculty.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
                    {filteredTickets.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTicket(t)}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all relative group ${
                          selectedTicket?.id === t.id
                            ? 'bg-amber-500/10 dark:bg-amber-500/15 border-amber-500 text-slate-950 dark:text-amber-100 shadow-xs ring-1 ring-amber-500/40'
                            : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800/80 hover:border-slate-400 dark:hover:border-slate-700 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            t.status === 'Open' ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30' :
                            t.status === 'In Progress' ? 'bg-blue-500/20 text-blue-800 dark:text-blue-300 border border-blue-500/30' :
                            'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30'
                          }`}>
                            {t.status}
                          </span>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                              {new Date(t.createdAt).toLocaleDateString()}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteTicket(t.id, e)}
                              title="Delete query"
                              className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded-md transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 line-clamp-1">{t.subject}</h4>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                          <span className="truncate max-w-[130px]">{t.category}</span>
                          {t.recipientName && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                              To: {t.recipientName}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Ticket Thread */}
              <div className={`lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-6 flex flex-col justify-between shadow-xs min-h-[420px] ${
                !selectedTicket ? 'hidden lg:flex' : 'flex'
              }`}>
                {selectedTicket ? (
                  <div className="space-y-4 flex-1 flex flex-col">
                    {/* Mobile Back Button */}
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedTicket(null)}
                          className="lg:hidden p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 mr-1"
                        >
                          <ArrowLeft className="w-4 h-4" />
                        </button>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          selectedTicket.status === 'Open' ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400' :
                          selectedTicket.status === 'In Progress' ? 'bg-blue-500/20 text-blue-700 dark:text-blue-400' :
                          'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                        }`}>
                          {selectedTicket.status}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[150px] sm:max-w-xs">
                          {selectedTicket.studentName} ({selectedTicket.studentClass})
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteTicket(selectedTicket.id)}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Delete</span>
                      </button>
                    </div>

                    <div>
                      <h2 className="text-base sm:text-lg font-serif font-bold text-slate-900 dark:text-slate-100">
                        {selectedTicket.subject}
                      </h2>
                      <div className="flex items-center gap-2 text-xs mt-1 text-slate-500 dark:text-slate-400 flex-wrap">
                        <span className="text-amber-600 dark:text-amber-400 font-medium">
                          {selectedTicket.category}
                        </span>
                        {selectedTicket.recipientName && (
                          <span>• Directed To: <strong>{selectedTicket.recipientName}</strong></span>
                        )}
                      </div>
                    </div>

                    {/* Initial Parent Query */}
                    <div className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 text-xs text-slate-700 dark:text-slate-200">
                      <p className="font-bold text-slate-500 dark:text-slate-400 mb-1 text-[11px]">Your Query:</p>
                      <p className="leading-relaxed">{selectedTicket.message}</p>
                    </div>

                    {/* Replies Thread */}
                    <div className="flex-1 overflow-y-auto space-y-2.5 max-h-60 pr-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Discussion ({selectedTicket.replies?.length || 0})
                      </span>

                      {selectedTicket.replies?.map((rep) => (
                        <div
                          key={rep.id}
                          className={`p-3 rounded-2xl border text-xs max-w-[85%] sm:max-w-md ${
                            rep.senderRole === 'teacher' || rep.senderRole === 'superadmin'
                              ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 mr-auto text-emerald-900 dark:text-emerald-100'
                              : 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 ml-auto text-amber-900 dark:text-amber-100'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                            <span className="font-bold">{rep.senderName} ({rep.senderRole.toUpperCase()})</span>
                            <span>{new Date(rep.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p>{rep.message}</p>
                        </div>
                      ))}
                    </div>

                    {/* Reply Input */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Type reply to teacher..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendReply(selectedTicket.id)}
                        className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500"
                      />
                      <button
                        onClick={() => handleSendReply(selectedTicket.id)}
                        className="h-10 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-2xl transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Reply</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
                    <MessageSquare className="w-8 h-8 mb-2 stroke-[1.5] text-slate-300 dark:text-slate-600" />
                    Select a ticket from the left panel to read the conversation.
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Tab 5: Institutional Circulars & Notices */}
      {activeTab === 'notices' && (
        <NoticeBoardWidget targetAudience="Parents" isFullSection={true} />
      )}

      {/* Exam Review Modal for Parents */}
      {reviewExamId && (
        <ExamReviewModal
          isOpen={!!reviewExamId}
          onClose={() => setReviewExamId(null)}
          examId={reviewExamId}
          studentId={selectedChildId}
        />
      )}

      {/* New Support Ticket Modal */}
      {showNewTicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-amber-500" />
                <h3 className="font-serif font-bold text-slate-900 dark:text-slate-100 text-base">
                  Raise Support Ticket to Subject Faculty
                </h3>
              </div>
              <button
                onClick={() => setShowNewTicketModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Regarding Ward
                </label>
                <div className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200">
                  {selectedChild?.name} ({selectedChild?.className} - {selectedChild?.divisionName})
                </div>
              </div>

              {/* Recipient Selection (Strictly Restricted to Assigned Subject Teachers) */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Assigned Subject Teacher (Management Inquiries Disabled)
                </label>
                <select
                  value={selectedRecipientId}
                  onChange={(e) => setSelectedRecipientId(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500"
                >
                  {recipients.length > 0 ? (
                    recipients.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.label || `${r.name} (${r.subjectName || r.role})`}
                      </option>
                    ))
                  ) : (
                    <option value="">No subject teacher currently assigned to this class</option>
                  )}
                </select>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                  Per institutional policy, queries are routed exclusively to the subject teachers assigned to your ward&apos;s curriculum.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Issue Category
                </label>
                <select
                  value={ticketCategory}
                  onChange={(e) => setTicketCategory(e.target.value as any)}
                  className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500"
                >
                  <option value="Technical Glitch / System Error">Technical Glitch / System Error</option>
                  <option value="Grading / Score Discrepancy">Grading / Score Discrepancy</option>
                  <option value="Attendance / Absence">Attendance / Absence</option>
                  <option value="General Inquiry">General Inquiry</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Ticket Subject / Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Request to reschedule Physics exam due to network disconnect"
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Detailed Explanation &amp; Request
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Please describe what occurred so the teacher or school admin can review and take appropriate action..."
                  value={ticketMessage}
                  onChange={(e) => setTicketMessage(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-800 dark:text-slate-200 outline-none resize-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingTicket}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmittingTicket ? 'Submitting...' : 'Submit Support Ticket'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Ticket Confirmation Modal */}
      <ConfirmModal
        isOpen={!!ticketToDelete}
        title="Delete Support Inquiry"
        message="Are you sure you want to permanently delete this inquiry? All discussion history and replies will be removed."
        confirmText="Delete Inquiry"
        danger={true}
        isLoading={isDeletingTicket}
        onConfirm={confirmDeleteTicket}
        onClose={() => setTicketToDelete(null)}
      />

    </div>
  );
};
