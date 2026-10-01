import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Clock, 
  CheckCircle2, 
  ShieldAlert, 
  BookOpen, 
  Database, 
  FolderDown, 
  HelpCircle,
  MessageSquare,
  Search,
  ExternalLink,
  Trash2,
  Edit,
  Send,
  Calendar,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  Trophy,
  Bell,
  Users,
  TrendingUp,
  Home,
  ArrowLeft,
  ChevronRight,
  GraduationCap,
  Key
} from 'lucide-react';
import { 
  UserCredential, 
  Exam, 
  Question, 
  StudyMaterial, 
  ExamSubmission, 
  SupportTicket, 
  SchoolClass, 
  Division, 
  Subject 
} from '../../types';
import { ExamBuilderModal } from './ExamBuilderModal';
import { SubmissionManagement } from './SubmissionManagement';
import { QuestionBankManager } from './QuestionBankManager';
import { StudentStandingsConfig } from './StudentStandingsConfig';
import { ConfirmModal } from '../common/ConfirmModal';
import { DualImageUploader } from '../common/DualImageUploader';
import { NoticeBoardWidget } from '../common/NoticeBoardWidget';
import { MathRenderer } from '../common/MathRenderer';
import { TeacherStudentManagement } from './TeacherStudentManagement';
import { AIQuizGeneratorModal } from './AIQuizGeneratorModal';
import { StudentProgressChart } from '../analytics/StudentProgressChart';
import { UnifiedBackButton } from '../common/UnifiedBackButton';

interface TeacherDashboardProps {
  currentUser: UserCredential;
  activeTab?: 'home' | 'exams' | 'submissions' | 'progressTrends' | 'questionBank' | 'standings' | 'materials' | 'tickets' | 'notices' | 'students';
  onTabChange?: (tab: 'home' | 'exams' | 'submissions' | 'progressTrends' | 'questionBank' | 'standings' | 'materials' | 'tickets' | 'notices' | 'students') => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ 
  currentUser,
  activeTab: propActiveTab,
  onTabChange,
}) => {
  const [internalTab, setInternalTab] = useState<'home' | 'exams' | 'submissions' | 'progressTrends' | 'questionBank' | 'standings' | 'materials' | 'tickets' | 'notices' | 'students'>('home');
  const activeTab = propActiveTab || internalTab;
  const setActiveTab = (tab: 'home' | 'exams' | 'submissions' | 'progressTrends' | 'questionBank' | 'standings' | 'materials' | 'tickets' | 'notices' | 'students') => {
    if (onTabChange) onTabChange(tab);
    else setInternalTab(tab);
  };
  
  // Core Data
  const [exams, setExams] = useState<Exam[]>([]);
  const [questionBank, setQuestionBank] = useState<Question[]>([]);
  const [studyMaterials, setStudyMaterials] = useState<StudyMaterial[]>([]);
  const [submissions, setSubmissions] = useState<ExamSubmission[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [divisions, setDivisionsList] = useState<Division[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [aiQuizOpen, setAiQuizOpen] = useState(false);

  // Deletion & Action Confirm Modal State
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    danger?: boolean;
    onConfirm: () => Promise<void> | void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    danger: false,
    onConfirm: () => {},
  });
  const [confirmLoading, setConfirmLoading] = useState(false);

  // New Question Bank Item Modal/Form
  const [showAddBankQuestion, setShowAddBankQuestion] = useState(false);
  const [newBankText, setNewBankText] = useState('');
  const [newBankType, setNewBankType] = useState<'single' | 'multi' | 'true_false'>('single');
  const [newBankSubject, setNewBankSubject] = useState('');
  const [newBankPoints, setNewBankPoints] = useState(10);
  const [newBankExplanation, setNewBankExplanation] = useState('');
  const [newBankImageUrl, setNewBankImageUrl] = useState('');

  // Study Material Form
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [matTitle, setMatTitle] = useState('');
  const [matDescription, setMatDescription] = useState('');
  const [matSubjectId, setMatSubjectId] = useState('');
  const [matClassId, setMatClassId] = useState('');
  const [matDivisionId, setMatDivisionId] = useState('');
  const [matType, setMatType] = useState<'file' | 'link'>('file');
  const [matUrl, setMatUrl] = useState('');

  // Ticket Reply & Status State
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketReplyText, setTicketReplyText] = useState('');

  // Notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [exRes, qbRes, matRes, subRes, tktRes, clsRes] = await Promise.all([
        fetch('/api/teacher/exams', { headers: { 'x-user-id': currentUser.id } }),
        fetch('/api/teacher/question-bank'),
        fetch('/api/materials'),
        fetch('/api/teacher/submissions'),
        fetch('/api/tickets', { headers: { 'x-user-id': currentUser.id } }),
        fetch('/api/admin/classes'),
      ]);

      if (exRes.ok) {
        const d = await exRes.json();
        setExams(d.exams || []);
      }
      if (qbRes.ok) {
        const d = await qbRes.json();
        setQuestionBank(d.questions || []);
      }
      if (matRes.ok) {
        const d = await matRes.json();
        setStudyMaterials(d.materials || []);
      }
      if (subRes.ok) {
        const d = await subRes.json();
        setSubmissions(d.submissions || []);
      }
      if (tktRes.ok) {
        const d = await tktRes.json();
        setTickets(d.tickets || []);
      }
      if (clsRes.ok) {
        const d = await clsRes.json();
        setClasses(d.classes || []);
        setDivisionsList(d.divisions || []);
        setSubjects(d.subjects || []);
        if (d.classes?.length > 0 && !matClassId) {
          setMatClassId(d.classes[0].id);
        }
        if (d.subjects?.length > 0 && !matSubjectId) {
          setMatSubjectId(d.subjects[0].id);
          setNewBankSubject(d.subjects[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching teacher dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [currentUser.id]);

  // Reschedule Exam for student flagged or with genuine issue
  const handleReschedule = (submissionId: string, studentName: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Reschedule Examination',
      message: `Are you sure you want to reschedule the exam for ${studentName}? This will reset their submission and allow them to retake the test.`,
      confirmText: 'Reschedule',
      danger: false,
      onConfirm: async () => {
        try {
          setConfirmLoading(true);
          const res = await fetch('/api/teacher/reschedule', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ submissionId }),
          });

          if (res.ok) {
            showToast(`Exam successfully rescheduled for ${studentName}!`);
            fetchAllData();
          } else {
            showToast('Failed to reschedule exam.');
          }
        } catch (err) {
          console.error(err);
          showToast('Network error while rescheduling.');
        } finally {
          setConfirmLoading(false);
          setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // Publish Draft Exam
  const handlePublishExam = async (examId: string) => {
    try {
      const res = await fetch(`/api/teacher/exams/${examId}/publish`, {
        method: 'POST',
      });
      if (res.ok) {
        showToast('Assessment has been published and is now visible to students!');
        fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Exam
  const handleDeleteExam = (examId: string, examTitle?: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Assessment',
      message: `Are you sure you want to delete ${examTitle ? `"${examTitle}"` : 'this exam'}? All questions, settings, and student attempts will be deleted.`,
      confirmText: 'Delete Exam',
      danger: true,
      onConfirm: async () => {
        try {
          setConfirmLoading(true);
          const res = await fetch(`/api/teacher/exams/${examId}`, { method: 'DELETE' });
          if (res.ok) {
            showToast('Exam deleted successfully.');
            fetchAllData();
          } else {
            showToast('Failed to delete exam.');
          }
        } catch (err) {
          console.error(err);
          showToast('Error deleting exam.');
        } finally {
          setConfirmLoading(false);
          setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // Delete Study Material
  const handleDeleteMaterial = (materialId: string, title: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Study Material',
      message: `Are you sure you want to delete "${title}"? Students will no longer be able to access this resource.`,
      confirmText: 'Delete Resource',
      danger: true,
      onConfirm: async () => {
        try {
          setConfirmLoading(true);
          const res = await fetch(`/api/teacher/materials/${materialId}`, { method: 'DELETE' });
          if (res.ok) {
            showToast('Study material deleted successfully.');
            fetchAllData();
          } else {
            showToast('Failed to delete study material.');
          }
        } catch (err) {
          console.error(err);
          showToast('Error deleting study material.');
        } finally {
          setConfirmLoading(false);
          setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // Save Direct to Question Bank
  const handleCreateBankQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBankText) return;

    const payload = {
      text: newBankText,
      type: newBankType,
      options: newBankType === 'true_false' 
        ? [{ id: 'opt-true', text: 'True' }, { id: 'opt-false', text: 'False' }]
        : [
            { id: 'opt-1', text: 'Option A' },
            { id: 'opt-2', text: 'Option B' },
            { id: 'opt-3', text: 'Option C' },
            { id: 'opt-4', text: 'Option D' },
          ],
      correctAnswer: newBankType === 'true_false' ? 'opt-true' : 'opt-1',
      explanation: newBankExplanation,
      points: Number(newBankPoints),
      imageUrl: newBankImageUrl,
      subjectId: newBankSubject,
    };

    try {
      const res = await fetch('/api/teacher/question-bank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToast('Question added to centralized bank!');
        setShowAddBankQuestion(false);
        setNewBankText('');
        setNewBankExplanation('');
        setNewBankImageUrl('');
        fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Upload Study Material
  const handleUploadMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matTitle || !matUrl) return;

    try {
      const res = await fetch('/api/teacher/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: matTitle,
          description: matDescription,
          subjectId: matSubjectId,
          classId: matClassId,
          divisionId: matDivisionId || divisions[0]?.id,
          teacherId: currentUser.id,
          type: matType,
          url: matUrl,
        }),
      });

      if (res.ok) {
        showToast('Study material published for students!');
        setShowAddMaterial(false);
        setMatTitle('');
        setMatDescription('');
        setMatUrl('');
        fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Reply to Parent Ticket
  const handleSendTicketReply = async (ticketId: string) => {
    if (!ticketReplyText.trim()) return;

    try {
      const res = await fetch(`/api/tickets/${ticketId}/reply`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({ message: ticketReplyText }),
      });

      if (res.ok) {
        const data = await res.json();
        setTicketReplyText('');
        setSelectedTicket(data.ticket);
        showToast('Reply dispatched to parent.');
        fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Update Ticket Status
  const handleUpdateTicketStatus = async (ticketId: string, status: 'Open' | 'In Progress' | 'Resolved') => {
    try {
      const res = await fetch(`/api/tickets/${ticketId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        const data = await res.json();
        setSelectedTicket(data.ticket);
        showToast(`Ticket status changed to ${status}`);
        fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const flaggedSubmissions = submissions.filter((s) => s.cheatingFlagged);

  const handleSaveAIQuiz = async (quizData: {
    title: string;
    description: string;
    subjectId: string;
    targetClassId: string;
    questions: any[];
    asDraft: boolean;
  }) => {
    const newExamPayload = {
      title: quizData.title,
      description: quizData.description,
      subjectId: quizData.subjectId,
      classId: quizData.targetClassId,
      targetClassId: quizData.targetClassId,
      divisionId: 'all',
      targetDivisionId: 'all',
      teacherId: currentUser.id,
      durationMinutes: 30,
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 86400000 * 7).toISOString(),
      status: quizData.asDraft ? 'draft' : 'published',
      questions: quizData.questions,
      totalMarks: quizData.questions.reduce((acc, q) => acc + (q.marks || 1), 0),
      passingMarks: Math.ceil(quizData.questions.length * 0.4),
      createdBy: currentUser.id,
      authorName: currentUser.name,
    };

    const res = await fetch('/api/teacher/exams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': currentUser.id },
      body: JSON.stringify(newExamPayload),
    });

    if (res.ok) {
      showToast(quizData.asDraft ? 'AI Quiz successfully saved as Draft!' : 'AI Quiz published live to students!');
      fetchAllData();
    } else {
      showToast('Failed to save AI quiz.');
    }
  };

  return (
    <div className="space-y-4 pb-24 md:pb-8">
      {/* Sub-Page Unified Back Navigation (Only visible when viewing dedicated sub-pages) */}
      {activeTab !== 'home' && (
        <UnifiedBackButton
          title={
            activeTab === 'exams' ? 'Exams' :
            activeTab === 'submissions' ? 'Submissions' :
            activeTab === 'progressTrends' ? 'Score Trends' :
            activeTab === 'students' ? 'Student and Parent Credential Generator' :
            activeTab === 'questionBank' ? 'Question Bank' :
            activeTab === 'standings' ? 'Standings' :
            activeTab === 'materials' ? 'Materials' :
            activeTab === 'tickets' ? 'Helpdesk' :
            'Circulars'
          }
          roleLabel="Faculty Dashboard"
          onBack={() => setActiveTab('home')}
          badge={
            activeTab === 'exams' ? `${exams.length} Tests` :
            activeTab === 'submissions' ? `${submissions.length} Submissions` :
            activeTab === 'questionBank' ? `${questionBank.length} Questions` :
            activeTab === 'materials' ? `${studyMaterials.length} Files` :
            activeTab === 'tickets' ? `${tickets.length} Tickets` :
            undefined
          }
          rightAction={
            activeTab === 'exams' ? (
              <button
                onClick={() => {
                  setEditingExam(null);
                  setBuilderOpen(true);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Exam</span>
              </button>
            ) : undefined
          }
        />
      )}

      {/* Main Account Dashboard Home: Faculty Command Center & Compact Small-Icon Grid */}
      {activeTab === 'home' && (
        <div className="space-y-5">
          {/* Teacher Profile Banner */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
              <div>
                <div className="flex items-center gap-2 mb-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">Faculty Workspace</span>
                  <span aria-hidden="true">·</span>
                  <span>{currentUser.employeeId || 'Faculty Specialist'}</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 dark:text-slate-100">
                  Welcome, {currentUser.name}
                </h1>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
                  Author Google Forms-style online examinations with photo attachments, manage study materials, review student integrity logs, and respond to parent queries.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setAiQuizOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 font-medium text-xs rounded-lg transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>AI Quiz Generator</span>
                </button>

                <button
                  onClick={() => {
                    setEditingExam(null);
                    setBuilderOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 font-semibold text-xs rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create Examination
                </button>
              </div>
            </div>

            {/* Global Toast */}
            {toastMessage && (
              <div className="mt-3 px-3 py-2 rounded-lg text-xs font-medium bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>{toastMessage}</span>
              </div>
            )}
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Created Exams</span>
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <FileText className="w-4 h-4 stroke-[1.8]" />
                </div>
              </div>
              <div className="mt-1 text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
                {exams.length}
              </div>
              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">Scheduled &amp; Active Tests</span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Evaluations</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 stroke-[1.8]" />
                </div>
              </div>
              <div className="mt-1 text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
                {submissions.length}
              </div>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Completed Submissions</span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Question Repository</span>
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Database className="w-4 h-4 stroke-[1.8]" />
                </div>
              </div>
              <div className="mt-1 text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
                {questionBank.length}
              </div>
              <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">Question Bank Items</span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Support Inquiries</span>
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 stroke-[1.8]" />
                </div>
              </div>
              <div className="mt-1 text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
                {tickets.length}
              </div>
              <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">Parent &amp; Student Tickets</span>
            </div>
          </div>

          {/* User-Friendly Small Icons Module Launcher */}
          <div>
            <div className="flex items-center justify-between mb-2.5 px-0.5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Faculty Applications &amp; Workspaces
              </h2>
              <span className="text-[11px] text-slate-400">Click icon to open dedicated page</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-2.5">
              {/* Icon 1: Exams (4) */}
              <button
                onClick={() => setActiveTab('exams')}
                className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 hover:bg-amber-50/20 dark:hover:bg-amber-950/20 transition-all text-left cursor-pointer shadow-2xs group active:scale-95"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <FileText className="w-4 h-4 stroke-[2]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      Exams
                    </span>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 shrink-0">
                      {exams.length}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                    Online tests &amp; authoring
                  </p>
                </div>
              </button>

              {/* Icon 2: Submissions (12) */}
              <button
                onClick={() => setActiveTab('submissions')}
                className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20 transition-all text-left cursor-pointer shadow-2xs group active:scale-95"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <CheckCircle2 className="w-4 h-4 stroke-[2]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      Submissions
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      {flaggedSubmissions.length > 0 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                      )}
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                        {submissions.length}
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                    Grading &amp; audit trails
                  </p>
                </div>
              </button>

              {/* Icon 3: Score Trends */}
              <button
                onClick={() => setActiveTab('progressTrends')}
                className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 hover:bg-blue-50/20 dark:hover:bg-blue-950/20 transition-all text-left cursor-pointer shadow-2xs group active:scale-95"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <TrendingUp className="w-4 h-4 stroke-[2]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      Score Trends
                    </span>
                    <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 shrink-0">
                      Analytics
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                    Class mastery curves
                  </p>
                </div>
              </button>

              {/* Icon 4: Student and Parent Credential Generator */}
              <button
                onClick={() => setActiveTab('students')}
                className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-500/50 hover:bg-purple-50/20 dark:hover:bg-purple-950/20 transition-all text-left cursor-pointer shadow-2xs group active:scale-95"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Key className="w-4 h-4 stroke-[2]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      Student &amp; Parent Logins
                    </span>
                    <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 shrink-0">
                      Keys
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                    Credential generator
                  </p>
                </div>
              </button>

              {/* Icon 5: Question Bank (6) */}
              <button
                onClick={() => setActiveTab('questionBank')}
                className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/20 transition-all text-left cursor-pointer shadow-2xs group active:scale-95"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Database className="w-4 h-4 stroke-[2]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      Question Bank
                    </span>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-md bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 shrink-0">
                      {questionBank.length}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                    Reusable question library
                  </p>
                </div>
              </button>

              {/* Icon 6: Standings */}
              <button
                onClick={() => setActiveTab('standings')}
                className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 hover:bg-amber-50/20 dark:hover:bg-amber-950/20 transition-all text-left cursor-pointer shadow-2xs group active:scale-95"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Trophy className="w-4 h-4 stroke-[2]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      Standings
                    </span>
                    <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 shrink-0">
                      Tiers
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                    Leaderboards &amp; honor badges
                  </p>
                </div>
              </button>

              {/* Icon 7: Materials (3) */}
              <button
                onClick={() => setActiveTab('materials')}
                className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-500/50 hover:bg-teal-50/20 dark:hover:bg-teal-950/20 transition-all text-left cursor-pointer shadow-2xs group active:scale-95"
              >
                <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <FolderDown className="w-4 h-4 stroke-[2]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      Materials
                    </span>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-md bg-teal-500/10 text-teal-700 dark:text-teal-300 shrink-0">
                      {studyMaterials.length}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                    Study notes &amp; formula PDFs
                  </p>
                </div>
              </button>

              {/* Icon 8: Helpdesk */}
              <button
                onClick={() => setActiveTab('tickets')}
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
                    Parent &amp; student tickets
                  </p>
                </div>
              </button>

              {/* Icon 9: Circulars */}
              <button
                onClick={() => setActiveTab('notices')}
                className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-sky-500/50 hover:bg-sky-50/20 dark:hover:bg-sky-950/20 transition-all text-left cursor-pointer shadow-2xs group active:scale-95"
              >
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Bell className="w-4 h-4 stroke-[2]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      Circulars
                    </span>
                    <span className="text-[10px] font-semibold text-sky-600 dark:text-sky-400 shrink-0">
                      Notices
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                    School notice board
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 1: Examinations & Drafts */}
      {activeTab === 'exams' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-serif font-bold text-slate-900 dark:text-slate-100">
              Assigned Assessments & Scheduled Tests
            </h2>
            <button
              onClick={() => {
                setEditingExam(null);
                setBuilderOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              New Google Forms-Style Exam
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {exams.map((ex) => {
              const isOpen = new Date() >= new Date(ex.startTime) && new Date() <= new Date(ex.endTime);
              const isClosed = new Date() > new Date(ex.endTime);

              return (
                <div
                  key={ex.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500/40 rounded-2xl p-5 flex flex-col justify-between shadow-sm dark:shadow-xl transition-all group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {ex.subjectName}
                      </span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        ex.status === 'draft' ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30' :
                        isOpen ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/40 animate-pulse' :
                        isClosed ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400' : 'bg-blue-500/15 text-blue-700 dark:text-blue-300'
                      }`}>
                        {ex.status === 'draft' ? 'Draft' : isOpen ? '● Active Live' : isClosed ? 'Window Closed' : 'Scheduled'}
                      </span>
                    </div>

                    <h3 className="font-serif font-bold text-slate-900 dark:text-slate-100 text-base group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors">
                      <MathRenderer content={ex.title} inline />
                    </h3>
                    <div className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                      <MathRenderer content={ex.description || 'Standard online assessment evaluation.'} inline />
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                      <div className="flex items-center justify-between">
                        <span>Target:</span>
                        <span className="text-slate-900 dark:text-slate-200 font-medium">{ex.className} - {ex.divisionName}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Duration:</span>
                        <span className="text-amber-600 dark:text-amber-400 font-mono font-semibold">{ex.durationMinutes} mins timer</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Total Marks:</span>
                        <span className="text-slate-900 dark:text-slate-200 font-mono">{ex.totalMarks} marks ({ex.questionCount || ex.questions?.length || 0} MCQs)</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                        <span>Window:</span>
                        <span>{new Date(ex.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &ndash; {new Date(ex.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    {ex.status === 'draft' ? (
                      <button
                        onClick={() => handlePublishExam(ex.id)}
                        className="flex-1 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Publish Exam
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        {isClosed ? 'Results Unlocked' : 'Submissions In Progress'}
                      </span>
                    )}

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingExam(ex);
                          setBuilderOpen(true);
                        }}
                        className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Edit Exam"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteExam(ex.id, ex.title)}
                        className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Delete Exam"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Submissions & Reschedules */}
      {activeTab === 'submissions' && (
        <SubmissionManagement
          submissions={submissions}
          exams={exams}
          classes={classes}
          divisions={divisions}
          subjects={subjects}
          onSubmissionsUpdated={fetchAllData}
          onShowToast={showToast}
        />
      )}

      {/* Tab: Student Academic Progress Trends (Recharts) */}
      {activeTab === 'progressTrends' && (
        <div className="space-y-6">
          <StudentProgressChart
            submissions={submissions}
            title="Class Academic Progress & Test Score Trends"
            subtitle="Multi-student longitudinal score trajectories, test analytics, and individual progress visualization"
          />
        </div>
      )}

      {/* Tab 3: Centralized Question Bank & Storage Diagrams */}
      {activeTab === 'questionBank' && (
        <QuestionBankManager
          questions={questionBank}
          classes={classes}
          subjects={subjects}
          onQuestionsUpdated={fetchAllData}
          onShowToast={showToast}
        />
      )}

      {/* Tab 4: Student Standings & Badges Configuration */}
      {activeTab === 'standings' && (
        <StudentStandingsConfig onShowToast={showToast} />
      )}

      {/* Tab 4: Study Materials */}
      {activeTab === 'materials' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-serif font-bold text-slate-900 dark:text-slate-100">
                Classroom Study Materials & Digital References
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Upload lecture notes, solved sample questions, or links to simulators for student preparation.
              </p>
            </div>

            <button
              onClick={() => setShowAddMaterial(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Upload Study Material
            </button>
          </div>

          {/* Upload Form */}
          {showAddMaterial && (
            <form onSubmit={handleUploadMaterial} className="bg-white dark:bg-slate-900 border border-emerald-500/30 rounded-2xl p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase">Publish New Material</span>
                <button type="button" onClick={() => setShowAddMaterial(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-400 mb-1">Target Class</label>
                  <select
                    value={matClassId}
                    onChange={(e) => setMatClassId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-200 outline-none"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-400 mb-1">Subject</label>
                  <select
                    value={matSubjectId}
                    onChange={(e) => setMatSubjectId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-200 outline-none"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-400 mb-1">Format Type</label>
                  <select
                    value={matType}
                    onChange={(e) => setMatType(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-200 outline-none"
                  >
                    <option value="file">Document / JPG Image / PDF File</option>
                    <option value="link">Web Resource / Simulator Link</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-400 mb-1">Material Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Standard 10 Physics Mechanics Formula Book"
                  value={matTitle}
                  onChange={(e) => setMatTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-200 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-400 mb-1">
                  Upload Image / File OR Enter Web Resource Link
                </label>
                <DualImageUploader
                  value={matUrl}
                  onChange={(url) => setMatUrl(url)}
                  placeholder="Paste URL (https://...) or upload directly..."
                  category="study-materials"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Publish for Students
              </button>
            </form>
          )}

          {/* Materials List */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {studyMaterials.map((mat) => (
              <div key={mat.id} className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-sm dark:shadow-lg">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
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
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    Target: {mat.className}
                  </span>
                  <div className="flex items-center gap-2">
                    <a
                      href={mat.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 hover:underline font-semibold"
                    >
                      <span>Open</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={() => handleDeleteMaterial(mat.id, mat.title)}
                      className="p-1 text-slate-400 hover:text-rose-500 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Delete Material"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Parent Support Tickets Inbox */}
      {activeTab === 'tickets' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tickets List */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
            <h3 className="text-sm font-serif font-bold text-slate-900 dark:text-slate-100">
              Parent Queries Inbox ({tickets.length})
            </h3>

            <div className="space-y-3">
              {tickets.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setSelectedTicket(t)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedTicket?.id === t.id
                      ? 'bg-amber-500/15 border-amber-500/50 text-amber-900 dark:text-amber-200'
                      : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      t.status === 'Open' ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400' :
                      t.status === 'In Progress' ? 'bg-blue-500/20 text-blue-700 dark:text-blue-400' :
                      'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                    }`}>
                      {t.status}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="font-semibold text-xs text-slate-900 dark:text-slate-100 line-clamp-1">{t.subject}</p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                    Student: <strong className="text-slate-800 dark:text-slate-200">{t.studentName}</strong> ({t.studentClass})
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Ticket Thread */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
            {selectedTicket ? (
              <div className="space-y-6 flex-1 flex flex-col">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-4 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase ${
                        selectedTicket.status === 'Open' ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400' :
                        selectedTicket.status === 'In Progress' ? 'bg-blue-500/20 text-blue-700 dark:text-blue-400' :
                        'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                      }`}>
                        {selectedTicket.status}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">Category: {selectedTicket.category}</span>
                    </div>
                    <h2 className="text-lg font-serif font-bold text-slate-900 dark:text-slate-100 mt-2">
                      {selectedTicket.subject}
                    </h2>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      Raised by: <strong className="text-slate-800 dark:text-slate-200">{selectedTicket.parentName}</strong> regarding <strong className="text-amber-600 dark:text-amber-400">{selectedTicket.studentName}</strong>
                    </p>
                  </div>

                  {/* Status Dropdown */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Status:</span>
                    <select
                      value={selectedTicket.status}
                      onChange={(e) => handleUpdateTicketStatus(selectedTicket.id, e.target.value as any)}
                      className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-200 outline-none"
                    >
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </div>
                </div>

                {/* Initial Query Message */}
                <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
                  <p className="font-semibold text-amber-700 dark:text-amber-400 mb-1">Parent Message:</p>
                  <p>{selectedTicket.message}</p>
                </div>

                {/* Replies Thread */}
                <div className="flex-1 overflow-y-auto space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Thread History ({selectedTicket.replies?.length || 0} messages)
                  </div>

                  {selectedTicket.replies?.map((rep) => (
                    <div
                      key={rep.id}
                      className={`p-3.5 rounded-xl border text-xs max-w-xl ${
                        rep.senderRole === 'teacher' || rep.senderRole === 'superadmin'
                          ? 'bg-amber-500/10 border-amber-500/30 ml-auto text-amber-950 dark:text-amber-100'
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mb-1">
                        <span className="font-bold">{rep.senderName} ({rep.senderRole})</span>
                        <span>{new Date(rep.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p>{rep.message}</p>
                    </div>
                  ))}
                </div>

                {/* Reply Form */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Type official reply to parent..."
                    value={ticketReplyText}
                    onChange={(e) => setTicketReplyText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendTicketReply(selectedTicket.id)}
                    className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-slate-200 outline-none focus:border-amber-500"
                  />
                  <button
                    onClick={() => handleSendTicketReply(selectedTicket.id)}
                    className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Reply
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 text-xs">
                <MessageSquare className="w-8 h-8 mb-2 stroke-[1.5]" />
                Select a ticket from the inbox to review and respond.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 7: Student & Parent Roster Management */}
      {activeTab === 'students' && (
        <TeacherStudentManagement currentUser={currentUser} />
      )}

      {/* Tab 8: Institutional Notices & Circulars */}
      {activeTab === 'notices' && (
        <NoticeBoardWidget targetAudience="Teachers" isFullSection={true} />
      )}

      {/* Google Forms-Style Exam Builder Modal */}
      <ExamBuilderModal
        isOpen={builderOpen}
        onClose={() => setBuilderOpen(false)}
        examToEdit={editingExam}
        classes={classes}
        divisions={divisions}
        subjects={subjects}
        questionBank={questionBank}
        currentTeacherId={currentUser.id}
        currentTeacherName={currentUser.name}
        onExamSaved={() => {
          fetchAllData();
          showToast('Exam saved successfully!');
        }}
      />

      {/* AI Automatic Quiz Generator Modal */}
      <AIQuizGeneratorModal
        isOpen={aiQuizOpen}
        onClose={() => setAiQuizOpen(false)}
        subjects={subjects}
        classes={classes}
        onSaveQuestions={handleSaveAIQuiz}
      />

      {/* Centralized Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        danger={confirmConfig.danger}
        isLoading={confirmLoading}
        onConfirm={confirmConfig.onConfirm}
        onClose={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
