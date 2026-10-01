import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  Award, 
  Clock, 
  CheckCircle2, 
  Play, 
  Lock, 
  Eye, 
  FolderDown, 
  ExternalLink, 
  Sparkles, 
  AlertCircle,
  Calendar,
  ShieldCheck,
  Zap,
  TrendingUp,
  UserCheck,
  Medal,
  Star,
  Users,
  Bot,
  Bell,
  Search,
  ChevronRight,
  Filter,
  ArrowRight,
  ArrowLeftRight,
  FileText,
  FileCheck2,
  Bookmark,
  Home,
  ArrowLeft
} from 'lucide-react';
import { UserCredential, Exam, StudyMaterial } from '../../types';
import { MathRenderer } from '../common/MathRenderer';
import { ExamTestingEngine } from './ExamTestingEngine';
import { ExamReviewModal } from './ExamReviewModal';
import { StudentAIChatbot } from './StudentAIChatbot';
import { AcademicBadgesSection } from './AcademicBadgesSection';
import { NoticeBoardWidget } from '../common/NoticeBoardWidget';
import { useSwipeTabs } from '../../hooks/useSwipeTabs';
import { CompoundIcon, FolderWithFileIcon } from '../common/CompoundIcon';
import { UnifiedBackButton } from '../common/UnifiedBackButton';

const STUDENT_TABS: ('home' | 'exams' | 'materials' | 'achievements' | 'chatbot' | 'notices')[] = [
  'home',
  'exams',
  'materials',
  'achievements',
  'chatbot',
  'notices',
];

const TAB_TITLES: Record<string, string> = {
  home: 'Student Desk',
  exams: 'Examinations',
  materials: 'Study Notes',
  achievements: 'Honors & Medals',
  chatbot: 'AI Study Tutor',
  notices: 'Circulars',
};

interface StudentDashboardProps {
  currentUser: UserCredential;
  onRefreshUser: () => void;
  activeTab?: 'home' | 'exams' | 'materials' | 'achievements' | 'chatbot' | 'notices';
  onTabChange?: (tab: 'home' | 'exams' | 'materials' | 'achievements' | 'chatbot' | 'notices') => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  currentUser,
  onRefreshUser,
  activeTab: propActiveTab,
  onTabChange,
}) => {
  const [internalTab, setInternalTab] = useState<'home' | 'exams' | 'materials' | 'achievements' | 'chatbot' | 'notices'>('home');
  const activeTab = propActiveTab || internalTab;
  const setActiveTab = (tab: 'home' | 'exams' | 'materials' | 'achievements' | 'chatbot' | 'notices') => {
    if (onTabChange) onTabChange(tab);
    else setInternalTab(tab);
  };
  const [exams, setExams] = useState<any[]>([]);
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [studentProfile, setStudentProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Active testing state
  const [takingExamId, setTakingExamId] = useState<string | null>(null);

  // Review modal state
  const [reviewExamId, setReviewExamId] = useState<string | null>(null);

  // Anti-cheating briefing modal before test begins
  const [briefingExam, setBriefingExam] = useState<any | null>(null);

  // Mobile convenience subfilters & search
  const [examSubFilter, setExamSubFilter] = useState<'all' | 'active' | 'completed' | 'upcoming'>('all');
  const [materialSearch, setMaterialSearch] = useState('');
  const [selectedMaterialSubject, setSelectedMaterialSubject] = useState('all');

  // Swipe-to-navigate gesture integration for mobile touch screens
  const { touchHandlers, swipeFeedback } = useSwipeTabs({
    tabs: STUDENT_TABS,
    activeTab,
    onTabChange: (newTab) => setActiveTab(newTab as any),
    enabled: !takingExamId && !reviewExamId && !briefingExam,
  });

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      const [exRes, matRes, profRes] = await Promise.all([
        fetch('/api/student/exams', { headers: { 'x-user-id': currentUser.id } }),
        fetch('/api/materials'),
        fetch('/api/student/profile', { headers: { 'x-user-id': currentUser.id } }),
      ]);

      if (exRes.ok) {
        const d = await exRes.json();
        setExams(d.exams || []);
      }
      if (matRes.ok) {
        const d = await matRes.json();
        setMaterials(d.materials || []);
      }
      if (profRes.ok) {
        const pData = await profRes.json();
        setStudentProfile(pData);
      }
    } catch (err) {
      console.error('Failed to load student data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, [currentUser.id]);

  const handleStartExam = (exam: any) => {
    setBriefingExam(exam);
  };

  const handleConfirmStart = () => {
    if (!briefingExam) return;
    setTakingExamId(briefingExam.id);
    setBriefingExam(null);
  };

  const handleExamCompleted = (result: any) => {
    setTakingExamId(null);
    fetchStudentData();
    onRefreshUser();
  };

  // If in active examination mode, render full-screen testing engine
  if (takingExamId) {
    return (
      <ExamTestingEngine
        examId={takingExamId}
        studentId={currentUser.id}
        studentName={currentUser.name}
        onExamCompleted={handleExamCompleted}
        onExit={() => setTakingExamId(null)}
      />
    );
  }

  // Active live tests
  const activeExams = exams.filter((e) => e.isWindowOpen && !e.hasSubmitted);
  const completedExams = exams.filter((e) => e.hasSubmitted);
  const upcomingExams = exams.filter((e) => !e.isWindowOpen && !e.hasSubmitted && !e.isWindowClosed);

  const totalPoints = currentUser.bonusPoints ?? 100;
  
  // Use dynamically calculated academic standing if returned by backend, else fallback
  const dynamicStanding = studentProfile?.academicStanding;
  const scholarTier = dynamicStanding
    ? {
        title: dynamicStanding.tier,
        badge: dynamicStanding.badge || 'Official Seal',
        color: dynamicStanding.color || 'from-amber-400 to-yellow-500',
        minScore: dynamicStanding.minScore,
        points: totalPoints,
      }
    : totalPoints >= 300
    ? { title: 'Diamond Scholar', color: 'from-amber-400 to-yellow-500', badge: 'Tier III', minScore: 90, points: totalPoints }
    : totalPoints >= 200
    ? { title: 'Gold Scholar', color: 'from-amber-500 to-amber-600', badge: 'Tier II', minScore: 75, points: totalPoints }
    : { title: 'Silver Scholar', color: 'from-slate-400 to-slate-500', badge: 'Tier I', minScore: 60, points: totalPoints };

  const testBadges = studentProfile?.badges?.testBadges || [];
  const overallBadges = studentProfile?.badges?.overallBadges || [];
  const linkedParent = studentProfile?.linkedParent;

  return (
    <div className="space-y-4 pb-24 md:pb-8 touch-pan-y relative" {...touchHandlers}>
      {/* Sub-Page Unified Back Navigation (Only visible when viewing dedicated sub-pages) */}
      {activeTab !== 'home' && (
        <UnifiedBackButton
          title={TAB_TITLES[activeTab] || activeTab}
          roleLabel="Student Desk"
          onBack={() => setActiveTab('home')}
          badge={
            activeTab === 'exams' ? `${exams.length} Tests` :
            activeTab === 'materials' ? `${materials.length} Notes` :
            activeTab === 'achievements' ? `${testBadges.length + overallBadges.length} Medals` :
            undefined
          }
        />
      )}

      {/* Main Account Dashboard Home */}
      {activeTab === 'home' && (
        <div className="space-y-5">
          {/* Student Smartphone-Optimized Profile & Gamification Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          
          {/* Student Identity */}
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 font-bold text-base sm:text-lg flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
              {currentUser.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25">
                  Student Portal
                </span>
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  Roll: {currentUser.rollNo || 'NRES-10A-01'}
                </span>
              </div>
              <h1 className="text-lg sm:text-2xl font-serif font-bold text-slate-900 dark:text-slate-100 truncate mt-0.5">
                {currentUser.name}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {currentUser.className || 'Standard 10'} · {currentUser.divisionName || 'Division A'}
              </p>
            </div>
          </div>

          {/* Gamification Points & Tier Badge */}
          <div className="flex items-center gap-3 sm:self-auto bg-slate-50 dark:bg-slate-950/80 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-2.5 sm:p-3 shrink-0">
            <CompoundIcon
              primaryIcon={Award}
              secondaryIcon={Sparkles}
              variant="amber"
              size="md"
              glow
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{scholarTier.title}</span>
                <span className="text-[10px] font-mono font-bold text-amber-700 dark:text-amber-300">
                  {scholarTier.badge}
                </span>
              </div>
              <div className="text-base sm:text-lg font-bold font-mono text-amber-600 dark:text-amber-400">
                {totalPoints} pts
              </div>
            </div>
          </div>
        </div>

        {/* Quick Glance Metric Tiles for Mobile with Compound Layered Icons */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
          <button
            onClick={() => {
              setActiveTab('exams');
              setExamSubFilter('active');
            }}
            className={`p-2.5 sm:p-3 rounded-2xl text-left border transition-all cursor-pointer ${
              activeExams.length > 0
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-300'
                : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <CompoundIcon
                primaryIcon={Clock}
                secondaryIcon={Play}
                variant="emerald"
                size="xs"
              />
              {activeExams.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Live Tests
            </span>
            <div className="text-base sm:text-xl font-bold font-mono mt-0.5">
              {activeExams.length}
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate block">
              {activeExams.length > 0 ? 'Ready to take' : 'None active'}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('exams');
              setExamSubFilter('completed');
            }}
            className="p-2.5 sm:p-3 rounded-2xl text-left bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 transition-all cursor-pointer hover:border-slate-300 dark:hover:border-slate-700"
          >
            <div className="mb-1.5">
              <CompoundIcon
                primaryIcon={FileCheck2}
                secondaryIcon={CheckCircle2}
                variant="blue"
                size="xs"
              />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Completed
            </span>
            <div className="text-base sm:text-xl font-bold font-mono mt-0.5">
              {completedExams.length}
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate block">
              {completedExams.length > 0
                ? `${Math.round(completedExams.reduce((a, b) => a + (b.submissionSummary?.percentage || 0), 0) / completedExams.length)}% avg`
                : 'No tests yet'}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('achievements')}
            className="p-2.5 sm:p-3 rounded-2xl text-left bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 transition-all cursor-pointer hover:border-slate-300 dark:hover:border-slate-700"
          >
            <div className="mb-1.5">
              <CompoundIcon
                primaryIcon={Medal}
                secondaryIcon={Star}
                variant="amber"
                size="xs"
              />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Medals
            </span>
            <div className="text-base sm:text-xl font-bold font-mono mt-0.5 text-amber-600 dark:text-amber-400">
              {testBadges.length + (studentProfile?.badges?.overallBadges?.length || 0)}
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate block">
              Achievements
            </span>
          </button>
        </div>

        {/* Linked Guardian Notification Pill */}
        {linkedParent && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5 truncate">
              <UserCheck className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span className="truncate">
                Guardian: <strong className="text-slate-800 dark:text-slate-200">{linkedParent.name}</strong> ({linkedParent.relationship || 'Parent'})
              </span>
            </div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium shrink-0 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Audit Sync Active
            </span>
          </div>
        )}
      </div>

          {/* User-Friendly Small Icons Module Launcher */}
          <div>
            <div className="flex items-center justify-between mb-2.5 px-0.5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Student Learning Applications
              </h2>
              <span className="text-[11px] text-slate-400">Click icon to open page</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
              {/* Icon 1: Examinations (2) */}
              <button
                onClick={() => setActiveTab('exams')}
                className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 hover:bg-amber-50/20 dark:hover:bg-amber-950/20 transition-all text-left cursor-pointer shadow-2xs group active:scale-95"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Clock className="w-4 h-4 stroke-[2]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      Examinations
                    </span>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 shrink-0">
                      {exams.length}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                    Online tests &amp; results
                  </p>
                </div>
              </button>

              {/* Icon 2: Study Notes (3) */}
              <button
                onClick={() => setActiveTab('materials')}
                className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 hover:bg-blue-50/20 dark:hover:bg-blue-950/20 transition-all text-left cursor-pointer shadow-2xs group active:scale-95"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <FolderDown className="w-4 h-4 stroke-[2]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      Study Notes
                    </span>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-300 shrink-0">
                      {materials.length}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                    Notes &amp; formula PDFs
                  </p>
                </div>
              </button>

              {/* Icon 3: Honors & Medals */}
              <button
                onClick={() => setActiveTab('achievements')}
                className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-yellow-500/50 hover:bg-yellow-50/20 dark:hover:bg-yellow-950/20 transition-all text-left cursor-pointer shadow-2xs group active:scale-95"
              >
                <div className="w-8 h-8 rounded-lg bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Medal className="w-4 h-4 stroke-[2]" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate block">
                    Honors &amp; Medals
                  </span>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                    Scholar tier &amp; badges
                  </p>
                </div>
              </button>

              {/* Icon 4: AI Study Tutor */}
              <button
                onClick={() => setActiveTab('chatbot')}
                className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-500/50 hover:bg-teal-50/20 dark:hover:bg-teal-950/20 transition-all text-left cursor-pointer shadow-2xs group active:scale-95"
              >
                <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Bot className="w-4 h-4 stroke-[2]" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate block">
                    AI Study Tutor
                  </span>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                    24/7 AI tutor &amp; doubts
                  </p>
                </div>
              </button>

              {/* Icon 5: Circulars */}
              <button
                onClick={() => setActiveTab('notices')}
                className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/20 transition-all text-left cursor-pointer shadow-2xs group active:scale-95"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
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

      {/* Tab 1: Examinations (Mobile-First Card Layout) */}
      {activeTab === 'exams' && (
        <div className="space-y-5">
          
          {/* Mobile Segmented Filter Controls */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl overflow-x-auto no-scrollbar touch-pan-x">
            <button
              onClick={() => setExamSubFilter('all')}
              className={`flex-1 min-w-[70px] py-1.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer text-center ${
                examSubFilter === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              All ({exams.length})
            </button>
            <button
              onClick={() => setExamSubFilter('active')}
              className={`flex-1 min-w-[90px] py-1.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                examSubFilter === 'active'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {activeExams.length > 0 && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
              <span>Live ({activeExams.length})</span>
            </button>
            <button
              onClick={() => setExamSubFilter('completed')}
              className={`flex-1 min-w-[95px] py-1.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer text-center ${
                examSubFilter === 'completed'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Completed ({completedExams.length})
            </button>
            {upcomingExams.length > 0 && (
              <button
                onClick={() => setExamSubFilter('upcoming')}
                className={`flex-1 min-w-[95px] py-1.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer text-center ${
                  examSubFilter === 'upcoming'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Upcoming ({upcomingExams.length})
              </button>
            )}
          </div>

          {/* ACTIVE EXAMS SECTION */}
          {(examSubFilter === 'all' || examSubFilter === 'active') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm sm:text-base font-serif font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active Online Examinations
                </h2>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                  {activeExams.length} Ready
                </span>
              </div>

              {activeExams.length === 0 ? (
                examSubFilter === 'active' && (
                  <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center text-slate-500 dark:text-slate-400 text-xs">
                    <CheckCircle2 className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                    No tests currently available. Check back at your scheduled timetable.
                  </div>
                )
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
                  {activeExams.map((ex) => (
                    <div
                      key={ex.id}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500/60 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-4 transition-all"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20">
                            {ex.subjectName}
                          </span>
                          <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {ex.durationMinutes} mins
                          </span>
                        </div>

                        <div>
                          <h3 className="text-base sm:text-lg font-serif font-bold text-slate-900 dark:text-slate-100">
                            <MathRenderer content={ex.title} inline />
                          </h3>
                          <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                            <MathRenderer content={ex.description || 'Secure online examination.'} inline />
                          </div>
                        </div>

                        {/* Test Meta Row */}
                        <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-2.5 text-center text-xs">
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-medium block">Questions</span>
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{ex.questionCount || 3} MCQs</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-medium block">Total Marks</span>
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{ex.totalMarks || 50} pts</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-medium block">Closes At</span>
                            <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                              {new Date(ex.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Prominent Thumb-Friendly Action Button */}
                      <button
                        onClick={() => handleStartExam(ex)}
                        className="w-full h-12 bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 font-bold text-sm rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-amber-500/20"
                      >
                        <Play className="w-4 h-4 fill-current" />
                        <span>Begin Examination</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* COMPLETED EXAMS SECTION */}
          {(examSubFilter === 'all' || examSubFilter === 'completed') && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h2 className="text-sm sm:text-base font-serif font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-500" />
                  Completed Tests &amp; Official Marks
                </h2>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {completedExams.length} Evaluated
                </span>
              </div>

              {completedExams.length === 0 ? (
                <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center text-slate-500 dark:text-slate-400 text-xs">
                  You haven&apos;t completed any examinations yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
                  {completedExams.map((ex) => {
                    const subm = ex.submissionSummary;
                    return (
                      <div
                        key={ex.id}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 flex flex-col justify-between space-y-4 shadow-xs"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {ex.subjectName}
                            </span>
                            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                              subm?.passed
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30'
                            }`}>
                              {subm?.passed ? 'Passed' : 'Failed'}
                            </span>
                          </div>

                          <h3 className="font-serif font-bold text-slate-900 dark:text-slate-100 text-base">
                            <MathRenderer content={ex.title} inline />
                          </h3>

                          {/* Marks & Bonus summary */}
                          <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-3">
                            <div>
                              <span className="text-[10px] text-slate-400 uppercase font-bold block">Marks Scored</span>
                              <div className="text-base sm:text-lg font-bold font-mono text-slate-900 dark:text-slate-100 mt-0.5">
                                {subm?.score} / {subm?.totalMarks} ({subm?.percentage}%)
                              </div>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 uppercase font-bold block">Bonus Earned</span>
                              <div className="text-base sm:text-lg font-bold font-mono text-amber-600 dark:text-amber-400 mt-0.5 flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5" />
                                +{subm?.bonusPointsAwarded} pts
                              </div>
                            </div>
                          </div>

                          {subm?.cheatingFlagged && (
                            <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-700 dark:text-rose-300 font-semibold flex items-center gap-2">
                              <ShieldCheck className="w-4 h-4 shrink-0 text-rose-600" />
                              <span>Academic Malpractice Flagged: Window blur infractions logged.</span>
                            </div>
                          )}
                        </div>

                        {/* Review Button */}
                        <button
                          onClick={() => setReviewExamId(ex.id)}
                          className={`w-full h-11 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                            ex.canReview
                              ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 border border-amber-500/40'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {ex.canReview ? (
                            <>
                              <Eye className="w-4 h-4" />
                              <span>Review Answer Key &amp; Explanations</span>
                            </>
                          ) : (
                            <>
                              <Lock className="w-4 h-4 text-amber-500" />
                              <span>Review Locked (Window Still Open)</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* UPCOMING EXAMS SECTION */}
          {(examSubFilter === 'all' || examSubFilter === 'upcoming') && upcomingExams.length > 0 && (
            <div className="space-y-3 pt-2">
              <h2 className="text-sm sm:text-base font-serif font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-500" />
                Upcoming Scheduled Exams
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
                {upcomingExams.map((ex) => (
                  <div key={ex.id} className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-2 opacity-90 shadow-xs">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-bold uppercase text-blue-600 dark:text-blue-400">{ex.subjectName}</span>
                      <span>Opens: {new Date(ex.startTime).toLocaleString()}</span>
                    </div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                      <MathRenderer content={ex.title} inline />
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Duration: {ex.durationMinutes} mins · {ex.totalMarks} Marks</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* Tab 2: Study Materials (Mobile-Optimized) */}
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
                  Official Classroom Study Materials
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Course notes, formula handbooks, and reference links provided by faculty.
                </p>
              </div>

              {/* Mobile Search input */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search notes &amp; formulas..."
                  value={materialSearch}
                  onChange={(e) => setMaterialSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Subject Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar touch-pan-x pb-1">
              <button
                onClick={() => setSelectedMaterialSubject('all')}
                className={`px-3 py-1 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
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
                  className={`px-3 py-1 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                    selectedMaterialSubject === subj
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {subj}
                </button>
              ))}
            </div>

            {/* Materials Grid with FolderWithFile Icons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              {filteredMaterials.map((mat) => (
                <div key={mat.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 rounded-3xl p-4 sm:p-5 flex flex-col justify-between shadow-xs space-y-3 transition-all group">
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-3">
                      <FolderWithFileIcon
                        size="md"
                        variant={
                          mat.subjectName.toLowerCase().includes('math') ? 'amber' :
                          mat.subjectName.toLowerCase().includes('sci') ? 'emerald' :
                          mat.subjectName.toLowerCase().includes('eng') ? 'blue' : 'indigo'
                        }
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                            {mat.subjectName}
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-mono font-bold">
                            {mat.type}
                          </span>
                        </div>
                        <h3 className="font-serif font-bold text-slate-900 dark:text-slate-100 text-sm mt-1 truncate">
                          <MathRenderer content={mat.title} inline />
                        </h3>
                      </div>
                    </div>

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

      {/* Tab 3: Gamification, Academic Standings & Realistic Insignia Badges */}
      {activeTab === 'achievements' && (
        <AcademicBadgesSection
          studentProfile={studentProfile}
          scholarTier={scholarTier}
          testBadges={testBadges}
          overallBadges={overallBadges}
        />
      )}

      {/* Tab 4: AI Study Tutor Chatbot */}
      {activeTab === 'chatbot' && (
        <StudentAIChatbot currentUser={currentUser} />
      )}

      {/* Tab 5: Institutional Notices & Circulars */}
      {activeTab === 'notices' && (
        <NoticeBoardWidget targetAudience="Students" isFullSection={true} />
      )}

      {/* Pre-Test Anti-Cheating Briefing Modal - Mobile Bottom Sheet & Dialog */}
      {briefingExam && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border-t sm:border border-amber-500/40 rounded-t-3xl sm:rounded-3xl max-w-lg w-full p-5 sm:p-7 space-y-4 shadow-2xl text-center max-h-[92vh] overflow-y-auto pb-safe animate-in slide-in-from-bottom duration-200">
            {/* Mobile Pull Handle */}
            <div className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto sm:hidden mb-2" />

            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto shadow-md shadow-amber-500/10">
              <ShieldCheck className="w-6 h-6 stroke-[2]" />
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Examination Security Briefing
              </span>
              <h2 className="text-base sm:text-lg font-serif font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                {briefingExam.title}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Duration: <strong className="text-slate-800 dark:text-slate-200">{briefingExam.durationMinutes} mins</strong> · Passing: {briefingExam.passingScore}%
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 text-xs text-left space-y-2 text-slate-700 dark:text-slate-300">
              <div className="font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider text-[10px]">
                Anti-Malpractice Protocols:
              </div>
              <ul className="space-y-1.5 list-disc list-inside text-xs text-slate-600 dark:text-slate-400">
                <li><strong className="text-slate-900 dark:text-slate-200">Window Blur Detection:</strong> Do not leave the exam window or switch apps.</li>
                <li><strong className="text-rose-600 dark:text-rose-400 font-semibold">2 Warning Modals:</strong> Max 2 infractions permitted before penalty.</li>
                <li><strong className="text-rose-600 dark:text-rose-400 font-semibold">3rd Strike Terminating:</strong> Automatic submission &amp; malpractice flag.</li>
                <li><strong className="text-slate-900 dark:text-slate-200">Timed Auto-Submit:</strong> Test submits automatically when timer expires.</li>
              </ul>
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                onClick={() => setBriefingExam(null)}
                className="flex-1 h-12 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-2xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmStart}
                className="flex-1 h-12 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-2xl shadow-md shadow-amber-500/20 transition-all cursor-pointer"
              >
                I Understand &amp; Start Test
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewExamId && (
        <ExamReviewModal
          isOpen={!!reviewExamId}
          onClose={() => setReviewExamId(null)}
          examId={reviewExamId}
          studentId={currentUser.id}
        />
      )}

    </div>
  );
};
