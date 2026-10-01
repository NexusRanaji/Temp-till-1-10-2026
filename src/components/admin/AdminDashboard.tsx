import React, { useState, useEffect } from 'react';
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  ShieldAlert, 
  Key, 
  Plus, 
  Building2, 
  Layers, 
  CheckCircle2, 
  AlertTriangle,
  FileCheck2,
  TrendingUp,
  Search,
  School,
  Mail,
  Phone,
  UserPlus,
  Bell,
  Download,
  FileText,
  BarChart3,
  Award,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  Filter,
  Sparkles,
  Home
} from 'lucide-react';
import { UserCredential, SchoolClass, Division, Subject, SchoolStats, ExamSubmission } from '../../types';
import { CredentialsDirectory } from './CredentialsDirectory';
import { CredentialGeneratorForm } from './CredentialGeneratorForm';
import { AuditQueuesView } from './AuditQueuesView';
import { NoticeBoardAdmin } from './NoticeBoardAdmin';
import { SchoolReportModal } from './SchoolReportModal';
import { UnifiedBackButton } from '../common/UnifiedBackButton';

interface AdminDashboardProps {
  currentUser: UserCredential;
  onRefreshUsers: () => void;
  activeTab?: 'home' | 'stats' | 'credentials' | 'academic' | 'users' | 'audits' | 'notices';
  onTabChange?: (tab: 'home' | 'stats' | 'credentials' | 'academic' | 'users' | 'audits' | 'notices') => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  currentUser, 
  onRefreshUsers,
  activeTab: propActiveTab,
  onTabChange,
}) => {
  const [internalTab, setInternalTab] = useState<'home' | 'stats' | 'credentials' | 'academic' | 'users' | 'audits' | 'notices'>('home');
  const activeTab = propActiveTab || internalTab;
  const setActiveTab = (tab: 'home' | 'stats' | 'credentials' | 'academic' | 'users' | 'audits' | 'notices') => {
    if (onTabChange) onTabChange(tab);
    else setInternalTab(tab);
  };
  const [stats, setStats] = useState<SchoolStats | null>(null);
  const [usersList, setUsersList] = useState<UserCredential[]>([]);
  const [classesList, setClassesList] = useState<SchoolClass[]>([]);
  const [divisionsList, setDivisionsList] = useState<Division[]>([]);
  const [subjectsList, setSubjectsList] = useState<Subject[]>([]);
  const [submissionsList, setSubmissionsList] = useState<ExamSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [schoolAnalytics, setSchoolAnalytics] = useState<any | null>(null);

  // Hierarchical Analytics Folder Navigation (Class -> Division -> Subject)
  const [selectedFolderClassId, setSelectedFolderClassId] = useState<string | null>(null);
  const [selectedFolderDivisionId, setSelectedFolderDivisionId] = useState<string | null>(null);
  const [subjectSearchFilter, setSubjectSearchFilter] = useState('');
  const [analyticsViewMode, setAnalyticsViewMode] = useState<'folders' | 'tree' | 'all'>('folders');

  const handleCredentialCreated = (newUser: UserCredential) => {
    setUsersList((prev) => {
      const filtered = prev.filter((u) => u.id !== newUser.id);
      return [newUser, ...filtered];
    });
    onRefreshUsers();
  };

  const handleUserDeleted = (userId: string) => {
    setUsersList((prev) => prev.filter((u) => u.id !== userId));
    onRefreshUsers();
  };

  const handleUserUpdated = (updatedUser: UserCredential) => {
    setUsersList((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    onRefreshUsers();
  };

  // Form State for Programmatic Credential Creation
  const [newUserRole, setNewUserRole] = useState<'teacher' | 'student' | 'parent'>('student');
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRollNo, setNewUserRollNo] = useState('');
  const [newUserClassId, setNewUserClassId] = useState('');
  const [newUserDivisionId, setNewUserDivisionId] = useState('');
  const [newUserParentId, setNewUserParentId] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserEmployeeId, setNewUserEmployeeId] = useState('');

  // Academic Structure Forms
  const [newClassName, setNewClassName] = useState('');
  const [newClassLevel, setNewClassLevel] = useState('10');
  const [newDivName, setNewDivName] = useState('');
  const [newDivClassId, setNewDivClassId] = useState('');
  const [newDivRoom, setNewDivRoom] = useState('');
  const [newSubName, setNewSubName] = useState('');
  const [newSubCode, setNewSubCode] = useState('');

  // Teacher Assignment Form
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [assignClassId, setAssignClassId] = useState('');
  const [assignDivisionId, setAssignDivisionId] = useState('');
  const [assignSubjectId, setAssignSubjectId] = useState('');

  // Search filter
  const [userSearchTerm, setUserSearchTerm] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes, classesRes, submRes, analyticsRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/auth/users'),
        fetch('/api/admin/classes'),
        fetch('/api/teacher/submissions'),
        fetch('/api/admin/reports/school-analytics'),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (analyticsRes.ok) {
        setSchoolAnalytics(await analyticsRes.json());
      }
      if (usersRes.ok) {
        const uData = await usersRes.json();
        const rawUsers: UserCredential[] = uData.users || [];
        const unique = Array.from(new Map(rawUsers.map((u) => [u.id, u])).values());
        setUsersList(unique);
      }
      if (classesRes.ok) {
        const cData = await classesRes.json();
        setClassesList(cData.classes || []);
        setDivisionsList(cData.divisions || []);
        setSubjectsList(cData.subjects || []);
        if (cData.classes?.length > 0 && !newUserClassId) {
          setNewUserClassId(cData.classes[0].id);
          setNewDivClassId(cData.classes[0].id);
          setAssignClassId(cData.classes[0].id);
        }
      }
      if (submRes.ok) {
        const sData = await submRes.json();
        setSubmissionsList(sData.submissions || []);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    try {
      const res = await fetch('/api/admin/create-credential', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newUserName,
          email: newUserEmail,
          role: newUserRole,
          classId: newUserRole === 'student' ? newUserClassId : undefined,
          divisionId: newUserRole === 'student' ? newUserDivisionId : undefined,
          rollNo: newUserRole === 'student' ? newUserRollNo : undefined,
          parentId: newUserRole === 'student' ? newUserParentId : undefined,
          phone: newUserRole === 'parent' ? newUserPhone : undefined,
          employeeId: newUserRole === 'teacher' ? newUserEmployeeId : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to create credential' });
        return;
      }

      setStatusMessage({ type: 'success', text: `Credential generated for ${data.user.name} (${data.user.role})!` });
      setNewUserName('');
      setNewUserEmail('');
      setNewUserRollNo('');
      setNewUserPhone('');
      setNewUserEmployeeId('');
      fetchData();
      onRefreshUsers();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName) return;
    try {
      const res = await fetch('/api/admin/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newClassName, level: newClassLevel }),
      });
      if (res.ok) {
        setNewClassName('');
        fetchData();
        setStatusMessage({ type: 'success', text: 'New Class created successfully!' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddDivision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDivName || !newDivClassId) return;
    try {
      const res = await fetch('/api/admin/divisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId: newDivClassId, name: newDivName, roomNumber: newDivRoom }),
      });
      if (res.ok) {
        setNewDivName('');
        setNewDivRoom('');
        fetchData();
        setStatusMessage({ type: 'success', text: 'Division added successfully!' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName || !newSubCode) return;
    try {
      const res = await fetch('/api/admin/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSubName, code: newSubCode }),
      });
      if (res.ok) {
        setNewSubName('');
        setNewSubCode('');
        fetchData();
        setStatusMessage({ type: 'success', text: 'Subject created successfully!' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacherId || !assignClassId || !assignDivisionId || !assignSubjectId) return;
    const teacher = usersList.find((u) => u.id === selectedTeacherId);
    if (!teacher) return;

    const existingAssignments = teacher.assignedSubjects || [];
    const updatedAssignments = [
      ...existingAssignments,
      { classId: assignClassId, divisionId: assignDivisionId, subjectId: assignSubjectId },
    ];

    try {
      const res = await fetch('/api/admin/teachers/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherId: selectedTeacherId, assignments: updatedAssignments }),
      });
      if (res.ok) {
        fetchData();
        setStatusMessage({ type: 'success', text: `Assigned teacher to new class/subject mapping!` });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredUsers = usersList.filter((u) =>
    (u.name && u.name.toLowerCase().includes(userSearchTerm.toLowerCase())) ||
    (u.email && u.email.toLowerCase().includes(userSearchTerm.toLowerCase())) ||
    (u.role && u.role.toLowerCase().includes(userSearchTerm.toLowerCase())) ||
    (u.rollNo && u.rollNo.toLowerCase().includes(userSearchTerm.toLowerCase()))
  );

  const parentUsers = usersList.filter((u) => u.role === 'parent');
  const teacherUsers = usersList.filter((u) => u.role === 'teacher');
  const flaggedSubmissions = submissionsList.filter((s) => s.cheatingFlagged || (s.cheatingDetails && s.cheatingDetails.violationCount > 0));

  return (
    <div className="space-y-4 pb-24 md:pb-8">
      {/* Sub-Page Unified Back Navigation (Only visible when viewing dedicated sub-pages) */}
      {activeTab !== 'home' && (
        <UnifiedBackButton
          title={
            activeTab === 'stats' ? 'School Analytics' :
            activeTab === 'credentials' ? 'Credentials Generator' :
            activeTab === 'academic' ? 'Academic Structure' :
            activeTab === 'users' ? 'Master Directory' :
            activeTab === 'audits' ? 'Audit Queues' :
            'Circulars'
          }
          roleLabel="Admin Dashboard"
          onBack={() => setActiveTab('home')}
          badge={
            activeTab === 'users' ? `${usersList.length} Accounts` :
            activeTab === 'audits' && flaggedSubmissions.length > 0 ? `${flaggedSubmissions.length} Flagged` :
            undefined
          }
        />
      )}

      {/* Main Account Dashboard Home: Executive Command Center & Compact Small-Icon Grid */}
      {activeTab === 'home' && (
        <div className="space-y-5">
          {/* Top Banner with Administrative Identity */}
          <div className="bg-gradient-to-r from-amber-50/90 via-slate-50 to-amber-100/40 dark:from-slate-900 dark:via-slate-900 dark:to-amber-950/40 border border-amber-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30">
                    Super Administration Panel
                  </span>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Institutional Governance</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 dark:text-slate-100">
                  Welcome, {currentUser.name}
                </h1>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 max-w-xl font-normal leading-relaxed">
                  Programmatic credentials, academic structure catalog, student-parent relationships, and examination integrity.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  id="admin-download-report-btn"
                  onClick={() => setReportModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg shadow-2xs transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>School PDF</span>
                </button>
                <button
                  id="admin-create-cred-btn"
                  onClick={() => setActiveTab('credentials')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded-lg shadow-2xs transition-colors cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Generate</span>
                </button>
                <button
                  id="admin-manage-academic-btn"
                  onClick={() => setActiveTab('academic')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-medium text-xs rounded-lg transition-colors cursor-pointer shadow-2xs"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Hierarchy</span>
                </button>
              </div>
            </div>

            {/* Global Notification */}
            {statusMessage && (
              <div className={`mt-3 px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2 border ${
                statusMessage.type === 'success' 
                  ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/30' 
                  : 'bg-rose-500/10 text-rose-800 dark:text-rose-300 border-rose-500/30'
              }`}>
                {statusMessage.type === 'success' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                <span>{statusMessage.text}</span>
              </div>
            )}
          </div>

          {/* Overarching Metrics Grid (Only on Dashboard Home) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl shadow-2xs transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Total Students</span>
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100 font-mono">
                {stats?.totalStudents ?? 0}
              </div>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium block truncate">
                Active Enrolled Students
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl shadow-2xs transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Appointed Teachers</span>
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <BookOpen className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100 font-mono">
                {stats?.totalTeachers ?? 0}
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 block truncate">
                Faculty Specialists
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl shadow-2xs transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Active Exams</span>
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-700 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <FileCheck2 className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100 font-mono">
                {stats?.activeExams ?? 0}
              </div>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium block truncate">
                Scheduled Tests
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl shadow-2xs transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Cheating Flags</span>
                <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-700 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-1 text-xl font-bold text-rose-600 dark:text-rose-400 font-mono">
                {stats?.flaggedCheatersCount ?? 0}
              </div>
              <span className="text-[10px] text-rose-600 dark:text-rose-400 font-medium block truncate">
                Integrity Alerts
              </span>
            </div>
          </div>

          {/* User-Friendly Small Icons Module Launcher */}
          <div>
            <div className="flex items-center justify-between mb-2 px-0.5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Administrative Applications
              </h2>
              <span className="text-[11px] text-slate-400">Click icon to open page</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {/* Icon 1: School Analytics */}
              <button
                onClick={() => setActiveTab('stats')}
                className="flex flex-col items-center justify-center text-center p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition-all cursor-pointer shadow-2xs group active:scale-95"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                  <BarChart3 className="w-4 h-4 stroke-[2]" />
                </div>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate w-full">
                  School Analytics
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                  Performance
                </span>
              </button>

              {/* Icon 2: Credentials */}
              <button
                onClick={() => setActiveTab('credentials')}
                className="flex flex-col items-center justify-center text-center p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 hover:bg-amber-50/30 dark:hover:bg-amber-950/20 transition-all cursor-pointer shadow-2xs group active:scale-95"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                  <Key className="w-4 h-4 stroke-[2]" />
                </div>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate w-full">
                  Credentials
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                  Key Generator
                </span>
              </button>

              {/* Icon 3: Academic Structure */}
              <button
                onClick={() => setActiveTab('academic')}
                className="flex flex-col items-center justify-center text-center p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 transition-all cursor-pointer shadow-2xs group active:scale-95"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                  <Building2 className="w-4 h-4 stroke-[2]" />
                </div>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate w-full">
                  Academic Structure
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                  Classes &amp; Divs
                </span>
              </button>

              {/* Icon 4: Master Directory */}
              <button
                onClick={() => setActiveTab('users')}
                className="flex flex-col items-center justify-center text-center p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-500/50 hover:bg-purple-50/30 dark:hover:bg-purple-950/20 transition-all cursor-pointer shadow-2xs group relative active:scale-95"
              >
                <span className="absolute top-1.5 right-1.5 text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-300">
                  {usersList.length}
                </span>
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                  <Users className="w-4 h-4 stroke-[2]" />
                </div>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate w-full">
                  Master Directory
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                  {usersList.length} Accounts
                </span>
              </button>

              {/* Icon 5: Audit Queues */}
              <button
                onClick={() => setActiveTab('audits')}
                className="flex flex-col items-center justify-center text-center p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-rose-500/50 hover:bg-rose-50/30 dark:hover:bg-rose-950/20 transition-all cursor-pointer shadow-2xs group relative active:scale-95"
              >
                {flaggedSubmissions.length > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                )}
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                  <ShieldAlert className="w-4 h-4 stroke-[2]" />
                </div>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate w-full">
                  Audit Queues
                </span>
                <span className="text-[10px] text-rose-600 dark:text-rose-400 mt-0.5">
                  Integrity Logs
                </span>
              </button>

              {/* Icon 6: Circulars */}
              <button
                onClick={() => setActiveTab('notices')}
                className="flex flex-col items-center justify-center text-center p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-sky-500/50 hover:bg-sky-50/30 dark:hover:bg-sky-950/20 transition-all cursor-pointer shadow-2xs group active:scale-95"
              >
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                  <Bell className="w-4 h-4 stroke-[2]" />
                </div>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate w-full">
                  Circulars
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                  Notice Board
                </span>
              </button>
            </div>
          </div>

          {/* Quick Academic Hierarchy Snapshot on Home */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs transition-colors">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                <School className="w-3.5 h-3.5 stroke-[1.8]" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  Academic Structure Snapshot
                </h3>
                <p className="text-[11px] text-slate-500">Classes, divisions, and student enrollment</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {classesList.map((c) => {
                const classDivs = divisionsList.filter((d) => d.classId === c.id);
                const classStudents = usersList.filter((u) => u.role === 'student' && u.classId === c.id);
                return (
                  <div key={c.id} className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">{c.name}</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300">
                        Level {c.level}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 space-y-0.5">
                      <p>Divisions: <span className="text-slate-700 dark:text-slate-300 font-medium">{classDivs.map((d) => d.name).join(', ') || 'None'}</span></p>
                      <p>Enrollment: <span className="text-amber-600 dark:text-amber-400 font-mono font-bold">{classStudents.length} students</span></p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 1: School Statistics & Analytics */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          {/* Overarching Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-2xs transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Total Students</span>
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-4 h-4 stroke-[1.8]" />
                </div>
              </div>
              <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono">
                {stats?.totalStudents ?? 0}
              </div>
              <div className="mt-1 text-[11px] text-emerald-700 dark:text-emerald-400 flex items-center gap-1 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Active SSC &amp; Middle Standards</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-2xs transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Appointed Teachers</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4 stroke-[1.8]" />
                </div>
              </div>
              <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono">
                {stats?.totalTeachers ?? 0}
              </div>
              <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                Faculty Specialists &amp; Invigilators
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-2xs transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Active Exams</span>
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-700 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <FileCheck2 className="w-4 h-4 stroke-[1.8]" />
                </div>
              </div>
              <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono">
                {stats?.activeExams ?? 0} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">/ {stats?.totalExams ?? 0}</span>
              </div>
              <div className="mt-1 text-[11px] text-blue-700 dark:text-blue-400 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span>Conducting Live Online Tests</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-2xs transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Cheating Violations</span>
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-700 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-4 h-4 stroke-[1.8]" />
                </div>
              </div>
              <div className="mt-1 text-2xl font-bold text-rose-700 dark:text-rose-400 font-mono">
                {stats?.flaggedCheatersCount ?? 0}
              </div>
              <div className="mt-1 text-[11px] text-rose-700 dark:text-rose-400 font-medium">
                Window Blur / Tab Switch Flags
              </div>
            </div>
          </div>

          {/* Downloadable Institutional Comprehensive Report Banner */}
          <div className="bg-slate-50/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
            <div className="space-y-1.5">
              <div className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                Institutional Audit &amp; Analytics
              </div>
              <h3 className="text-base font-serif font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                School-Wide Examination &amp; Performance PDF Report
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-2xl font-normal leading-relaxed">
                Generate a publication-grade PDF report documenting total teachers, students, parents, class &amp; division-wise exam statistics, student roll-number progress, and subject performance metrics.
              </p>
            </div>
            <button
              id="admin-download-detailed-report-btn"
              onClick={() => setReportModalOpen(true)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-lg shadow-xs transition-colors cursor-pointer whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Report (PDF)</span>
            </button>
          </div>

          {/* Quick Academic Hierarchy Snapshot */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center border border-amber-300/80 dark:border-amber-500/30 shrink-0">
                <School className="w-4 h-4 stroke-[1.8]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  Nexus Ranaji English School: Current Academic Structure
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">Class levels, active divisions, and student enrollment counts</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {classesList.map((c) => {
                const classDivs = divisionsList.filter((d) => d.classId === c.id);
                const classStudents = usersList.filter((u) => u.role === 'student' && u.classId === c.id);
                return (
                  <div key={c.id} className="bg-slate-50 dark:bg-slate-950/60 border border-slate-300/80 dark:border-slate-800 rounded-xl p-4 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{c.name}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/20">
                        Level {c.level}
                      </span>
                    </div>
                    <div className="text-xs text-slate-700 dark:text-slate-400 space-y-1 font-medium">
                      <p>Divisions: <span className="text-slate-900 dark:text-slate-200 font-semibold">{classDivs.map((d) => d.name).join(', ') || 'None'}</span></p>
                      <p>Total Enrolled: <span className="text-amber-700 dark:text-amber-400 font-mono font-bold">{classStudents.length} students</span></p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Division & Class-Wise Live Examination Analytics */}
          {schoolAnalytics?.classDivisionStats && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs transition-colors space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-300/80 dark:border-purple-500/30 flex items-center justify-center shrink-0">
                  <BarChart3 className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    Division &amp; Class-Wise Examination Analytics
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Granular breakdown of enrollment, tests conducted, and average scores</p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-800">
                      <th className="py-3 px-4">Standard / Class</th>
                      <th className="py-3 px-4">Division</th>
                      <th className="py-3 px-4">Students Enrolled</th>
                      <th className="py-3 px-4">Exams Conducted</th>
                      <th className="py-3 px-4">Submissions Evaluated</th>
                      <th className="py-3 px-4">Average Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/70">
                    {schoolAnalytics.classDivisionStats.flatMap((cls: any) =>
                      cls.divisions.map((div: any) => (
                        <tr key={`${cls.classId}-${div.divisionId}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">{cls.className}</td>
                          <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">{div.divisionName}</td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-300">{div.studentCount}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 font-mono font-bold border border-blue-200 dark:border-blue-500/30">
                              {div.totalExamsConducted} tests
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-800 dark:text-slate-300 font-semibold">{div.totalSubmissions}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    div.averageScorePercentage >= 75
                                      ? 'bg-emerald-500'
                                      : div.averageScorePercentage >= 50
                                      ? 'bg-amber-500'
                                      : 'bg-rose-500'
                                  }`}
                                  style={{ width: `${Math.min(100, div.averageScorePercentage)}%` }}
                                />
                              </div>
                              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                                {div.averageScorePercentage}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Subject-Wise Academic Performance & Pass Rates (Class -> Division -> Subject Hierarchical Folders) */}
          {schoolAnalytics && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs transition-colors space-y-5">
              
              {/* Header with Title and Mode Switcher */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 flex items-center justify-center shrink-0">
                    <Folder className="w-5 h-5 stroke-[2]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                      <span>Subject-Wise Academic Performance &amp; Pass Rates</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Class-wise folders &gt; Division-wise folders &gt; Individual subject performance analytics
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs flex-wrap gap-1">
                    <button
                      onClick={() => setAnalyticsViewMode('folders')}
                      className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                        analyticsViewMode === 'folders'
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-semibold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      <Folder className="w-3.5 h-3.5 text-amber-500" />
                      <span>Class Folders</span>
                    </button>
                    <button
                      onClick={() => setAnalyticsViewMode('tree')}
                      className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                        analyticsViewMode === 'tree'
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-semibold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5 text-teal-500" />
                      <span>Directory Tree</span>
                    </button>
                    <button
                      onClick={() => setAnalyticsViewMode('all')}
                      className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                        analyticsViewMode === 'all'
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-semibold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      <BarChart3 className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Institutional Summary</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* FOLDERS VIEW MODE */}
              {analyticsViewMode === 'folders' && (() => {
                const hierarchical = schoolAnalytics.hierarchicalPerformance || [];
                const currentClass = hierarchical.find((c: any) => c.classId === selectedFolderClassId);
                const currentDivision = currentClass?.divisions?.find((d: any) => d.divisionId === selectedFolderDivisionId);

                return (
                  <div className="space-y-4">
                    {/* Interactive Breadcrumb Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 rounded-2xl text-xs">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          onClick={() => {
                            setSelectedFolderClassId(null);
                            setSelectedFolderDivisionId(null);
                          }}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                            !selectedFolderClassId
                              ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold border border-amber-500/30'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                          }`}
                        >
                          <Folder className="w-3.5 h-3.5" />
                          <span>All Class Folders</span>
                        </button>

                        {selectedFolderClassId && (
                          <>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                            <button
                              onClick={() => setSelectedFolderDivisionId(null)}
                              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                                selectedFolderClassId && !selectedFolderDivisionId
                                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold border border-amber-500/30'
                                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                              }`}
                            >
                              <FolderOpen className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                              <span>{currentClass?.className || 'Selected Class'} (Divisions)</span>
                            </button>
                          </>
                        )}

                        {selectedFolderDivisionId && (
                          <>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-500/15 text-teal-700 dark:text-teal-300 font-bold border border-teal-500/30">
                              <BookOpen className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                              <span>{currentDivision?.divisionName || 'Selected Division'} (Subject Pass Rates)</span>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Back button if drilled down */}
                      {selectedFolderDivisionId ? (
                        <button
                          onClick={() => setSelectedFolderDivisionId(null)}
                          className="flex items-center gap-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-medium px-2.5 py-1 cursor-pointer bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-2xs"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          <span>Back to Divisions</span>
                        </button>
                      ) : selectedFolderClassId ? (
                        <button
                          onClick={() => setSelectedFolderClassId(null)}
                          className="flex items-center gap-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-medium px-2.5 py-1 cursor-pointer bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-2xs"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          <span>Back to Classes</span>
                        </button>
                      ) : null}
                    </div>

                    {/* Quick Class Switcher Strip (Visible when drilled into Level 2 or Level 3) */}
                    {selectedFolderClassId && (
                      <div className="flex items-center gap-2 p-2 bg-slate-50/70 dark:bg-slate-950/50 rounded-xl overflow-x-auto no-scrollbar touch-pan-x text-xs">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 pl-1">
                          Switch Class:
                        </span>
                        {hierarchical.map((cls: any) => {
                          const isActive = cls.classId === selectedFolderClassId;
                          return (
                            <button
                              key={cls.classId}
                              onClick={() => {
                                setSelectedFolderClassId(cls.classId);
                                setSelectedFolderDivisionId(null);
                              }}
                              className={`px-3 py-1 rounded-lg font-medium transition-all whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
                                isActive
                                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                              }`}
                            >
                              <Folder className="w-3 h-3" />
                              <span>{cls.className}</span>
                              <span className="text-[10px] opacity-80 font-mono">({cls.overallPassRate}%)</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* LEVEL 1: CLASS FOLDERS */}
                    {!selectedFolderClassId && (
                      <div className="space-y-3">
                        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
                          <span>Select a class folder below to explore its divisions &amp; subject pass rates:</span>
                          <span className="font-mono font-medium">{hierarchical.length} Classes Available</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {hierarchical.map((cls: any) => (
                            <button
                              key={cls.classId}
                              onClick={() => setSelectedFolderClassId(cls.classId)}
                              className="text-left p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-gradient-to-b from-slate-50/60 to-white dark:from-slate-900/60 dark:to-slate-900 hover:border-amber-500/60 dark:hover:border-amber-500/60 transition-all shadow-xs hover:shadow-md cursor-pointer group flex flex-col justify-between space-y-4"
                            >
                              <div className="flex items-start justify-between w-full">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                                    <Folder className="w-6 h-6 stroke-[1.8]" />
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                                      {cls.className}
                                    </h4>
                                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                                      Grade Level {cls.level} · {cls.divisions?.length || 0} Division Folder(s)
                                    </span>
                                  </div>
                                </div>
                                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${
                                  cls.overallPassRate >= 90
                                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                                    : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                                }`}>
                                  {cls.overallPassRate}% Pass
                                </span>
                              </div>

                              <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-100 dark:border-slate-800/80 text-center w-full">
                                <div>
                                  <span className="text-[10px] text-slate-400 uppercase font-medium block">Students</span>
                                  <span className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200">{cls.totalStudents || 0}</span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-400 uppercase font-medium block">Avg Score</span>
                                  <span className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200">{cls.overallAverage}%</span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-400 uppercase font-medium block">Evaluations</span>
                                  <span className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200">{cls.totalSubmissions || 0}</span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-xs text-amber-600 dark:text-amber-400 font-semibold w-full pt-1">
                                <span>Open Class Folder ({cls.divisions?.length || 0} Divisions)</span>
                                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* LEVEL 2: DIVISION FOLDERS INSIDE SELECTED CLASS */}
                    {selectedFolderClassId && !selectedFolderDivisionId && currentClass && (
                      <div className="space-y-4">
                        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                          <div>
                            <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                              {currentClass.className} &bull; Division Folders
                            </span>
                            <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5">
                              Select a division below to view its specific subject-wise academic performance and pass rates.
                            </p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0 font-mono text-xs">
                            <span>Class Pass Rate: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{currentClass.overallPassRate}%</strong></span>
                            <span>Class Avg: <strong className="text-slate-900 dark:text-slate-100 font-bold">{currentClass.overallAverage}%</strong></span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {(currentClass.divisions || []).map((div: any) => (
                            <button
                              key={div.divisionId}
                              onClick={() => setSelectedFolderDivisionId(div.divisionId)}
                              className="text-left p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-gradient-to-b from-slate-50/60 to-white dark:from-slate-900/60 dark:to-slate-900 hover:border-teal-500/60 dark:hover:border-teal-500/60 transition-all shadow-xs hover:shadow-md cursor-pointer group flex flex-col justify-between space-y-4"
                            >
                              <div className="flex items-start justify-between w-full">
                                <div className="flex items-center gap-3">
                                  <div className="w-11 h-11 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                                    <FolderOpen className="w-5 h-5 stroke-[2]" />
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                                      {div.divisionName}
                                    </h4>
                                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                                      {div.roomNumber} · {div.studentCount || 0} Students Enrolled
                                    </span>
                                  </div>
                                </div>
                                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${
                                  div.passRatePercentage >= 90
                                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                                    : 'bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30'
                                }`}>
                                  {div.passRatePercentage}% Pass
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-2 py-2 border-y border-slate-100 dark:border-slate-800/80 text-center w-full">
                                <div>
                                  <span className="text-[10px] text-slate-400 uppercase font-medium block">Division Avg Score</span>
                                  <span className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200">{div.averageScorePercentage}%</span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-400 uppercase font-medium block">Subjects Evaluated</span>
                                  <span className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200">{div.subjects?.length || 0} Subjects</span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-xs text-teal-600 dark:text-teal-400 font-semibold w-full pt-1">
                                <span>Open Division &bull; View Subject Performance</span>
                                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* LEVEL 3: SUBJECT-WISE PERFORMANCE OF CHOSEN CLASS & DIVISION */}
                    {selectedFolderClassId && selectedFolderDivisionId && currentClass && currentDivision && (() => {
                      const subjectsList: any[] = (currentDivision.subjects || []).filter((s: any) =>
                        !subjectSearchFilter ||
                        s.subjectName.toLowerCase().includes(subjectSearchFilter.toLowerCase()) ||
                        s.subjectCode.toLowerCase().includes(subjectSearchFilter.toLowerCase())
                      );

                      return (
                        <div className="space-y-4">
                          {/* Quick Division Switcher Strip */}
                          <div className="flex items-center gap-2 p-2 bg-teal-500/10 border border-teal-500/20 rounded-2xl overflow-x-auto no-scrollbar touch-pan-x text-xs">
                            <span className="text-[11px] font-bold text-teal-800 dark:text-teal-300 uppercase tracking-wider shrink-0 pl-1">
                              {currentClass.className} Divisions:
                            </span>
                            {(currentClass.divisions || []).map((div: any) => {
                              const isDivActive = div.divisionId === selectedFolderDivisionId;
                              return (
                                <button
                                  key={div.divisionId}
                                  onClick={() => setSelectedFolderDivisionId(div.divisionId)}
                                  className={`px-3 py-1 rounded-lg font-medium transition-all whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
                                    isDivActive
                                      ? 'bg-teal-600 text-white font-bold shadow-xs'
                                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                                  }`}
                                >
                                  <FolderOpen className="w-3 h-3" />
                                  <span>{div.divisionName}</span>
                                  <span className="text-[10px] font-mono">({div.passRatePercentage}% Pass)</span>
                                </button>
                              );
                            })}
                          </div>

                          {/* Division Focus Bar with Search */}
                          <div className="p-4 sm:p-5 rounded-3xl bg-teal-500/10 border border-teal-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">
                                  {currentClass.className} &bull; {currentDivision.divisionName}
                                </span>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                  {currentDivision.roomNumber}
                                </span>
                                <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
                                  {currentDivision.passRatePercentage}% Overall Pass Rate
                                </span>
                              </div>
                              <h4 className="text-base sm:text-lg font-serif font-bold text-slate-900 dark:text-slate-100 mt-1">
                                Subject-Wise Academic Performance &amp; Pass Rates
                              </h4>
                              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                                Detailed curriculum breakdown for {currentDivision.studentCount} enrolled students &bull; Standard 40% passing threshold
                              </p>
                            </div>

                            <div className="flex items-center gap-3">
                              {/* Subject search */}
                              <div className="relative w-full sm:w-64">
                                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                  type="text"
                                  placeholder="Search subjects in this division..."
                                  value={subjectSearchFilter}
                                  onChange={(e) => setSubjectSearchFilter(e.target.value)}
                                  className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:border-teal-500"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Subject Cards Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {subjectsList.map((subj: any) => {
                              const isExcellent = subj.passRatePercentage >= 90;
                              const isGood = subj.passRatePercentage >= 75;
                              return (
                                <div
                                  key={subj.subjectId}
                                  className="p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-xs space-y-3.5 transition-all hover:border-teal-500/50"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-start gap-2.5 min-w-0">
                                      <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 flex items-center justify-center shrink-0 mt-0.5">
                                        <BookOpen className="w-4 h-4" />
                                      </div>
                                      <div className="min-w-0">
                                        <h5 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                                          {subj.subjectName}
                                        </h5>
                                        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 block">
                                          Code: {subj.subjectCode}
                                        </span>
                                      </div>
                                    </div>
                                    <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md shrink-0 ${
                                      isExcellent 
                                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                                        : isGood
                                        ? 'bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30'
                                        : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                                    }`}>
                                      {subj.passRatePercentage}% Pass
                                    </span>
                                  </div>

                                  {/* Score progress gauge */}
                                  <div className="space-y-1.5">
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="text-slate-500 dark:text-slate-400">Class Average Score</span>
                                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                                        {subj.averageScore}%
                                      </span>
                                    </div>
                                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                                      <div
                                        className={`h-full rounded-full transition-all ${
                                          subj.averageScore >= 80
                                            ? 'bg-emerald-500'
                                            : subj.averageScore >= 60
                                            ? 'bg-teal-500'
                                            : 'bg-amber-500'
                                        }`}
                                        style={{ width: `${Math.min(100, subj.averageScore)}%` }}
                                      />
                                    </div>
                                  </div>

                                  {/* Evaluation & Score Metrics */}
                                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-center text-xs">
                                    <div>
                                      <span className="text-[10px] text-slate-400 uppercase font-medium block">Evaluations</span>
                                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                                        {subj.totalEvaluations}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-[10px] text-slate-400 uppercase font-medium block">Highest</span>
                                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                        {subj.highestScore}%
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-[10px] text-slate-400 uppercase font-medium block">Lowest</span>
                                      <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                                        {subj.lowestScore}%
                                      </span>
                                    </div>
                                  </div>

                                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-1 border-t border-slate-50 dark:border-slate-800/50">
                                    <span>Students Passed: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{subj.totalPassed}</strong></span>
                                    <span>Failed: <strong className="text-rose-600 dark:text-rose-400 font-bold">{subj.totalFailed}</strong></span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                );
              })()}

              {/* INTERACTIVE DIRECTORY TREE EXPLORER MODE */}
              {analyticsViewMode === 'tree' && (() => {
                const hierarchical = schoolAnalytics.hierarchicalPerformance || [];
                const activeClass = hierarchical.find((c: any) => c.classId === selectedFolderClassId) || hierarchical[0];
                const activeDivision = activeClass?.divisions?.find((d: any) => d.divisionId === selectedFolderDivisionId) || activeClass?.divisions?.[0];

                const subjectsList: any[] = (activeDivision?.subjects || []).filter((s: any) =>
                  !subjectSearchFilter ||
                  s.subjectName.toLowerCase().includes(subjectSearchFilter.toLowerCase()) ||
                  s.subjectCode.toLowerCase().includes(subjectSearchFilter.toLowerCase())
                );

                return (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    {/* Left Tree Explorer (4 cols) */}
                    <div className="lg:col-span-4 bg-slate-50/70 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <Folder className="w-3.5 h-3.5 text-amber-500" />
                          <span>Academic Hierarchy Tree</span>
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">Class &gt; Division</span>
                      </div>

                      <div className="space-y-2">
                        {hierarchical.map((cls: any) => {
                          const isClassOpen = selectedFolderClassId === cls.classId || (!selectedFolderClassId && cls === activeClass);
                          return (
                            <div key={cls.classId} className="border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
                              {/* Class Folder Header */}
                              <button
                                onClick={() => {
                                  setSelectedFolderClassId(cls.classId);
                                  if (cls.divisions?.[0]) setSelectedFolderDivisionId(cls.divisions[0].divisionId);
                                }}
                                className={`w-full p-3 flex items-center justify-between text-left transition-colors cursor-pointer ${
                                  isClassOpen ? 'bg-amber-500/10 text-amber-900 dark:text-amber-200 font-bold' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                }`}
                              >
                                <div className="flex items-center gap-2 text-xs font-semibold">
                                  <Folder className="w-4 h-4 text-amber-500 shrink-0" />
                                  <span>{cls.className}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                                    {cls.overallPassRate}%
                                  </span>
                                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isClassOpen ? 'rotate-180' : ''}`} />
                                </div>
                              </button>

                              {/* Nested Division Folders */}
                              {isClassOpen && (
                                <div className="p-2 space-y-1 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800">
                                  {(cls.divisions || []).map((div: any) => {
                                    const isDivActive = activeDivision?.divisionId === div.divisionId && isClassOpen;
                                    return (
                                      <button
                                        key={div.divisionId}
                                        onClick={() => {
                                          setSelectedFolderClassId(cls.classId);
                                          setSelectedFolderDivisionId(div.divisionId);
                                        }}
                                        className={`w-full px-3 py-2 rounded-xl text-left text-xs transition-all flex items-center justify-between cursor-pointer ${
                                          isDivActive
                                            ? 'bg-teal-500 text-white font-bold shadow-xs'
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-100'
                                        }`}
                                      >
                                        <div className="flex items-center gap-2">
                                          <FolderOpen className="w-3.5 h-3.5" />
                                          <span>{div.divisionName} ({div.roomNumber})</span>
                                        </div>
                                        <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded ${
                                          isDivActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                                        }`}>
                                          {div.passRatePercentage}% Pass
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Right Subject Performance Display (8 cols) */}
                    <div className="lg:col-span-8 space-y-4">
                      {activeDivision && activeClass ? (
                        <>
                          <div className="p-4 sm:p-5 rounded-3xl bg-teal-500/10 border border-teal-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">
                                  {activeClass.className} &bull; {activeDivision.divisionName}
                                </span>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                  {activeDivision.roomNumber}
                                </span>
                              </div>
                              <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">
                                Subject-Wise Academic Performance &amp; Pass Rates
                              </h4>
                              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                                Division Pass Rate: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{activeDivision.passRatePercentage}%</strong> &bull; Avg Score: {activeDivision.averageScorePercentage}%
                              </p>
                            </div>

                            <div className="relative w-full sm:w-56">
                              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                              <input
                                type="text"
                                placeholder="Search subjects..."
                                value={subjectSearchFilter}
                                onChange={(e) => setSubjectSearchFilter(e.target.value)}
                                className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:border-teal-500"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                            {subjectsList.map((subj: any) => (
                              <div
                                key={subj.subjectId}
                                className="p-4 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-3"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <h5 className="font-bold text-sm text-slate-900 dark:text-slate-100">{subj.subjectName}</h5>
                                    <span className="text-[10px] font-mono text-slate-400">Code: {subj.subjectCode}</span>
                                  </div>
                                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                                    {subj.passRatePercentage}% Pass
                                  </span>
                                </div>

                                <div className="space-y-1">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-slate-400">Avg Score</span>
                                    <span className="font-bold font-mono text-slate-800 dark:text-slate-200">{subj.averageScore}%</span>
                                  </div>
                                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${
                                        subj.averageScore >= 80 ? 'bg-emerald-500' : subj.averageScore >= 60 ? 'bg-teal-500' : 'bg-amber-500'
                                      }`}
                                      style={{ width: `${Math.min(100, subj.averageScore)}%` }}
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-center text-xs">
                                  <div>
                                    <span className="text-[10px] text-slate-400 uppercase block">Tests</span>
                                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{subj.totalEvaluations}</span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-slate-400 uppercase block">High</span>
                                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{subj.highestScore}%</span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-slate-400 uppercase block">Low</span>
                                    <span className="font-mono font-bold text-rose-600 dark:text-rose-400">{subj.lowestScore}%</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="p-12 text-center text-slate-400 text-xs bg-slate-50 dark:bg-slate-950 rounded-3xl">
                          Select a division folder in the directory tree on the left.
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* ALL SCHOOL INSTITUTIONAL SUMMARY MODE */}
              {analyticsViewMode === 'all' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(schoolAnalytics.subjectPerformance || []).map((subj: any) => (
                      <div
                        key={subj.subjectId}
                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 transition-colors space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{subj.subjectName}</h4>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-300 font-semibold">
                              Code: {subj.subjectCode}
                            </span>
                          </div>
                          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-500/30">
                            {subj.passRatePercentage}% Pass
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-200 dark:border-slate-800/80">
                          <div>
                            <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium block">Average Score</span>
                            <span className="text-base font-bold font-mono text-slate-900 dark:text-slate-100">
                              {subj.averageScore}%
                            </span>
                          </div>
                          <div>
                            <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium block">Evaluations</span>
                            <span className="text-base font-bold font-mono text-slate-900 dark:text-slate-100">
                              {subj.totalEvaluations}
                            </span>
                          </div>
                        </div>

                        <div>
                          <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-teal-500 h-full rounded-full"
                              style={{ width: `${Math.min(100, subj.averageScore)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      )}

      {/* Tab 2: Programmatic Credential Generator */}
      {activeTab === 'credentials' && (
        <CredentialGeneratorForm
          classes={classesList}
          divisions={divisionsList}
          existingParents={usersList.filter((u) => u.role === 'parent')}
          onCredentialCreated={handleCredentialCreated}
        />
      )}

      {/* Tab 3: Academic Hierarchy Management */}
      {activeTab === 'academic' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Add New Class */}
            <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs transition-colors">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-500" />
                Add New Class / Standard
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">e.g. Standard 11 (Science), Standard 7</p>

              <form onSubmit={handleAddClass} className="space-y-3">
                <input
                  type="text"
                  required
                  placeholder="Class Name (e.g. Standard 11)"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500"
                />
                <input
                  type="number"
                  placeholder="Level / Grade Number (e.g. 11)"
                  value={newClassLevel}
                  onChange={(e) => setNewClassLevel(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500"
                />
                <button
                  type="submit"
                  className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Create Class
                </button>
              </form>
            </div>

            {/* Add New Division */}
            <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs transition-colors">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-500" />
                Add Division to Class
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">e.g. Division C, Room 204</p>

              <form onSubmit={handleAddDivision} className="space-y-3">
                <select
                  value={newDivClassId}
                  onChange={(e) => setNewDivClassId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500"
                >
                  {classesList.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <input
                  type="text"
                  required
                  placeholder="Division Name (e.g. Division C)"
                  value={newDivName}
                  onChange={(e) => setNewDivName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500"
                />
                <input
                  type="text"
                  placeholder="Room No (e.g. Room 302)"
                  value={newDivRoom}
                  onChange={(e) => setNewDivRoom(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500"
                />
                <button
                  type="submit"
                  className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Add Division
                </button>
              </form>
            </div>

            {/* Add New Subject */}
            <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs transition-colors">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-500" />
                Add Academic Subject
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">e.g. Chemistry, Biology</p>

              <form onSubmit={handleAddSubject} className="space-y-3">
                <input
                  type="text"
                  required
                  placeholder="Subject Name (e.g. Organic Chemistry)"
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500"
                />
                <input
                  type="text"
                  required
                  placeholder="Subject Code (e.g. CHM-106)"
                  value={newSubCode}
                  onChange={(e) => setNewSubCode(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500"
                />
                <button
                  type="submit"
                  className="w-full py-2 bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Add Subject
                </button>
              </form>
            </div>
          </div>

          {/* Multi-Class Teacher Assignment Tool */}
          <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs transition-colors">
            <h3 className="text-base font-serif font-bold text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-500" />
              Multi-Class Teacher Assignment Matrix
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-6">
              Assign a subject specialist to multiple classes and divisions (e.g., Prof. Vikram Sharma teaching Physics to 10-A, 10-B, and Math to 10-A).
            </p>

            <form onSubmit={handleAssignTeacher} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Select Teacher</label>
                <select
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500"
                >
                  <option value="">Choose Faculty</option>
                  {teacherUsers.map((t) => (
                    <option key={t.id} value={t.id}>{t.name} ({t.employeeId})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Class</label>
                <select
                  value={assignClassId}
                  onChange={(e) => setAssignClassId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500"
                >
                  {classesList.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Division</label>
                <select
                  value={assignDivisionId}
                  onChange={(e) => setAssignDivisionId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500"
                >
                  <option value="">Choose Division</option>
                  {divisionsList
                    .filter((d) => d.classId === assignClassId)
                    .map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Subject</label>
                <select
                  value={assignSubjectId}
                  onChange={(e) => setAssignSubjectId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500"
                >
                  <option value="">Choose Subject</option>
                  {subjectsList.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-4 mt-2">
                <button
                  type="submit"
                  disabled={!selectedTeacherId || !assignClassId || !assignDivisionId || !assignSubjectId}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Link Teacher Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tab 4: Master User Credentials Directory */}
      {activeTab === 'users' && (
        <CredentialsDirectory
          users={usersList}
          classes={classesList}
          divisions={divisionsList}
          onUserDeleted={handleUserDeleted}
          onUserUpdated={handleUserUpdated}
        />
      )}

      {/* Tab 5: Rolling Security & Audit Queues */}
      {activeTab === 'audits' && (
        <AuditQueuesView />
      )}

      {/* Tab 6: Official Institutional Notice Board */}
      {activeTab === 'notices' && (
        <NoticeBoardAdmin currentUserName={currentUser.name} />
      )}

      {/* Comprehensive School & Examination PDF Report Modal */}
      <SchoolReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        adminName={currentUser.name}
      />
    </div>
  );
};
