import React, { useState } from 'react';
import { 
  FileText, 
  RotateCcw, 
  Trash2, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Filter, 
  Eye, 
  Clock, 
  Award, 
  Calendar,
  X,
  User,
  BookOpen
} from 'lucide-react';
import { ExamSubmission, Exam, SchoolClass, Division, Subject } from '../../types';
import { ConfirmModal } from '../common/ConfirmModal';
import { UserAvatar } from '../common/UserAvatar';

interface SubmissionManagementProps {
  submissions: ExamSubmission[];
  exams: Exam[];
  classes?: SchoolClass[];
  divisions?: Division[];
  subjects?: Subject[];
  onSubmissionsUpdated: () => void;
  onShowToast: (msg: string) => void;
}

export const SubmissionManagement: React.FC<SubmissionManagementProps> = ({
  submissions,
  exams,
  classes = [],
  divisions = [],
  subjects = [],
  onSubmissionsUpdated,
  onShowToast,
}) => {
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [selectedDivisionFilter, setSelectedDivisionFilter] = useState<string>('all');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [selectedExamFilter, setSelectedExamFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'flagged' | 'passed' | 'failed'>('all');
  const [inspectSubmission, setInspectSubmission] = useState<ExamSubmission | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Deletion & Reschedule Confirm Modal State
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

  // Cascade-filtered exams
  const cascadeExams = exams.filter((ex) => {
    const matchClass = selectedClassFilter === 'all' || ex.targetClassId === selectedClassFilter || ex.classId === selectedClassFilter;
    const matchDiv = selectedDivisionFilter === 'all' || ex.targetDivisionId === selectedDivisionFilter || ex.divisionId === selectedDivisionFilter || ex.targetDivisionId === 'all';
    const matchSubj = selectedSubjectFilter === 'all' || ex.subjectId === selectedSubjectFilter;
    return matchClass && matchDiv && matchSubj;
  });

  // Filter submissions by cascade + search + status
  const filteredSubmissions = submissions.filter((sub) => {
    const exam = exams.find((e) => e.id === sub.examId);
    const matchClass = selectedClassFilter === 'all' || sub.classId === selectedClassFilter || (exam && (exam.targetClassId === selectedClassFilter || exam.classId === selectedClassFilter));
    const matchDiv = selectedDivisionFilter === 'all' || sub.divisionId === selectedDivisionFilter || (exam && (exam.targetDivisionId === selectedDivisionFilter || exam.divisionId === selectedDivisionFilter));
    const matchSubj = selectedSubjectFilter === 'all' || sub.subjectId === selectedSubjectFilter || (exam && exam.subjectId === selectedSubjectFilter);
    const matchesExam = selectedExamFilter === 'all' || sub.examId === selectedExamFilter;
    const matchesSearch = 
      sub.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.studentRollNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.examTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.subjectName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = 
      statusFilter === 'all' ||
      (statusFilter === 'flagged' && (sub.cheatingFlagged || (sub.cheatingDetails && sub.cheatingDetails.violationCount > 0))) ||
      (statusFilter === 'passed' && sub.passed) ||
      (statusFilter === 'failed' && !sub.passed);

    return matchClass && matchDiv && matchSubj && matchesExam && matchesSearch && matchesStatus;
  });

  // 5 Key Submission Statistics
  const totalSubmissionsCount = filteredSubmissions.length;
  const submittedClearedCount = filteredSubmissions.filter((s) => s.passed && !s.cheatingFlagged).length;
  const pendingCount = filteredSubmissions.filter((s) => !s.passed && !s.cheatingFlagged).length;
  const lateSubmissionsCount = filteredSubmissions.filter((s) => (s.timeSpentMinutes && s.timeSpentMinutes > 35) || false).length;
  const missingFlaggedCount = filteredSubmissions.filter((s) => s.cheatingFlagged).length;

  // Reschedule Exam Handler
  const handleReschedule = (sub: ExamSubmission) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Reschedule Examination',
      message: `Are you sure you want to reschedule "${sub.examTitle}" for ${sub.studentName}? This will reset their current submission and allow them to take the exam again.`,
      confirmText: 'Reschedule Exam',
      danger: false,
      onConfirm: async () => {
        try {
          setConfirmLoading(true);
          setActionLoadingId(sub.id);
          const res = await fetch('/api/teacher/reschedule', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              submissionId: sub.id,
              studentId: sub.studentId,
              examId: sub.examId,
            }),
          });

          if (res.ok) {
            onShowToast(`Exam successfully rescheduled for ${sub.studentName}! Submission purged for fresh retake.`);
            if (inspectSubmission?.id === sub.id) {
              setInspectSubmission(null);
            }
            onSubmissionsUpdated();
          } else {
            const data = await res.json();
            onShowToast(data.error || 'Failed to reschedule exam');
          }
        } catch (err) {
          console.error('Error rescheduling exam:', err);
          onShowToast('Network error while rescheduling exam.');
        } finally {
          setActionLoadingId(null);
          setConfirmLoading(false);
          setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // Permanent Delete Submission Record Handler
  const handleDeleteSubmission = (submissionId: string, studentName: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Permanently Delete Submission Record',
      message: `Are you sure you want to permanently delete the submission record for ${studentName}? This action is irreversible.`,
      confirmText: 'Delete Record',
      danger: true,
      onConfirm: async () => {
        try {
          setConfirmLoading(true);
          setActionLoadingId(submissionId);
          const res = await fetch(`/api/teacher/submissions/${submissionId}`, {
            method: 'DELETE',
          });

          if (res.ok) {
            onShowToast(`Submission record for ${studentName} has been permanently deleted.`);
            if (inspectSubmission?.id === submissionId) {
              setInspectSubmission(null);
            }
            onSubmissionsUpdated();
          } else {
            const data = await res.json();
            onShowToast(data.error || 'Failed to delete submission record');
          }
        } catch (err) {
          console.error('Error deleting submission:', err);
          onShowToast('Network error while deleting submission.');
        } finally {
          setActionLoadingId(null);
          setConfirmLoading(false);
          setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header & Metric Summary Cards */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                Faculty Assessment Records Management
              </span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {totalSubmissionsCount} Filtered Records
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 dark:text-slate-100 mt-1">
              Class &amp; Division Submission Records
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">
              Academic Hierarchy Cascade: Class → Division → Subject → Assignment / Exam → Student Submission Diagnostics.
            </p>
          </div>
        </div>

        {/* Cascade Hierarchy Selectors */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-amber-500" />
            Academic Hierarchy Cascade Selection:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 1. Class */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                1. Class / Standard
              </label>
              <select
                value={selectedClassFilter}
                onChange={(e) => {
                  setSelectedClassFilter(e.target.value);
                  setSelectedDivisionFilter('all');
                  setSelectedExamFilter('all');
                }}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500"
              >
                <option value="all">All Classes</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* 2. Division */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                2. Division / Section
              </label>
              <select
                value={selectedDivisionFilter}
                onChange={(e) => {
                  setSelectedDivisionFilter(e.target.value);
                  setSelectedExamFilter('all');
                }}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500"
              >
                <option value="all">All Divisions</option>
                {divisions
                  .filter((d) => selectedClassFilter === 'all' || d.classId === selectedClassFilter)
                  .map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
              </select>
            </div>

            {/* 3. Subject */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                3. Academic Subject
              </label>
              <select
                value={selectedSubjectFilter}
                onChange={(e) => {
                  setSelectedSubjectFilter(e.target.value);
                  setSelectedExamFilter('all');
                }}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500"
              >
                <option value="all">All Subjects</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>

            {/* 4. Assignment / Exam */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                4. Assignment / Exam
              </label>
              <select
                value={selectedExamFilter}
                onChange={(e) => setSelectedExamFilter(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500"
              >
                <option value="all">All Assessments ({cascadeExams.length})</option>
                {cascadeExams.map((ex) => (
                  <option key={ex.id} value={ex.id}>{ex.title}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 5 Key Submission Metric Blocks */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
          {/* 1. Total Submissions */}
          <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
              Total Submissions
            </span>
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100 mt-1">
              {totalSubmissionsCount}
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Attempted assessments</p>
          </div>

          {/* 2. Submitted (Cleared) */}
          <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
              Submitted (Cleared)
            </span>
            <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
              {submittedClearedCount}
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Above pass threshold</p>
          </div>

          {/* 3. Pending Evaluation / Retake */}
          <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
              Pending / Re-test
            </span>
            <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1">
              {pendingCount}
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Below pass criteria</p>
          </div>

          {/* 4. Late Submissions */}
          <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
            <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider block">
              Late Submissions
            </span>
            <div className="text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-1">
              {lateSubmissionsCount}
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Extended time used</p>
          </div>

          {/* 5. Missing / Cheating Flagged */}
          <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 col-span-2 sm:col-span-1">
            <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider block">
              Missing / Flagged
            </span>
            <div className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-1">
              {missingFlaggedCount}
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Malpractice / Incomplete</p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-500 dark:text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search student, roll number, subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {(['all', 'flagged', 'passed', 'failed'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg capitalize transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === st
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold'
                }`}
              >
                {st === 'flagged' ? 'Malpractice Flagged' : st}
              </button>
            ))}
          </div>
        </div>

        {/* Submissions Table */}
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-950/80 text-slate-700 dark:text-slate-300 uppercase tracking-wider font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Student Identity</th>
                <th className="px-5 py-3.5">Assessment Title</th>
                <th className="px-5 py-3.5">Score / Total</th>
                <th className="px-5 py-3.5">Performance</th>
                <th className="px-5 py-3.5">Bonus Pts</th>
                <th className="px-5 py-3.5">Integrity &amp; Malpractice</th>
                <th className="px-5 py-3.5 text-right">Faculty Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-600 dark:text-slate-400 font-medium">
                    No student submissions found matching the selected filter.
                  </td>
                </tr>
              ) : (
                filteredSubmissions.map((sub) => (
                  <tr
                    key={sub.id}
                    className="hover:bg-slate-100/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <UserAvatar name={sub.studentName} role="student" size="sm" />
                        <div>
                          <div className="font-bold text-slate-900 dark:text-slate-100">
                            {sub.studentName}
                          </div>
                          <div className="text-[11px] text-slate-600 dark:text-slate-400 font-mono font-medium">
                            {sub.studentRollNo}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="text-slate-900 dark:text-slate-200 font-bold">
                        {sub.examTitle}
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                        {sub.subjectName}
                      </div>
                    </td>

                    <td className="px-5 py-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                      {sub.score} / {sub.totalMarks}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                          sub.passed
                            ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {sub.percentage}% ({sub.passed ? 'Passed' : 'Failed'})
                      </span>
                    </td>

                    <td className="px-5 py-4 font-mono font-bold text-amber-700 dark:text-amber-400">
                      +{sub.bonusPointsAwarded} pts
                    </td>

                    <td className="px-5 py-4">
                      {sub.cheatingFlagged ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500 text-white uppercase shadow-sm">
                            <ShieldAlert className="w-3 h-3" />
                            Cheating Flagged (3 Strikes)
                          </span>
                          <p className="text-[10px] text-rose-600 dark:text-rose-300 line-clamp-1">
                            {sub.cheatingDetails?.reason || 'Window blur detected'}
                          </p>
                        </div>
                      ) : sub.cheatingDetails && sub.cheatingDetails.violationCount > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                          <AlertTriangle className="w-3 h-3" />
                          {sub.cheatingDetails.violationCount} warning(s)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Clean Session
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View Detailed Answers */}
                        <button
                          onClick={() => setInspectSubmission(sub)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="View Submission Details & Answers"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Reschedule Exam */}
                        <button
                          onClick={() => handleReschedule(sub)}
                          disabled={actionLoadingId === sub.id}
                          className="px-2.5 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-semibold rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 disabled:opacity-50"
                          title="Reset submission and let student retake"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Reschedule</span>
                        </button>

                        {/* Permanent Delete */}
                        <button
                          onClick={() => handleDeleteSubmission(sub.id, sub.studentName)}
                          disabled={actionLoadingId === sub.id}
                          className="p-1.5 text-rose-500 hover:text-rose-700 dark:hover:text-rose-300 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer disabled:opacity-50"
                          title="Permanently Delete Submission Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Student Submission Inspection Modal */}
      {inspectSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-100">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Detailed Submission Inspection
                </span>
                <h3 className="text-lg font-serif font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                  {inspectSubmission.studentName} — {inspectSubmission.examTitle}
                </h3>
              </div>
              <button
                onClick={() => setInspectSubmission(null)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Top Student Overview Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase">Roll Number</span>
                <p className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs mt-0.5">
                  {inspectSubmission.studentRollNo}
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase">Total Score</span>
                <p className="font-mono font-bold text-amber-600 dark:text-amber-400 text-xs mt-0.5">
                  {inspectSubmission.score} / {inspectSubmission.totalMarks} ({inspectSubmission.percentage}%)
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase">Bonus Awarded</span>
                <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs mt-0.5">
                  +{inspectSubmission.bonusPointsAwarded} Points
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase">Submitted At</span>
                <p className="text-[11px] font-mono text-slate-700 dark:text-slate-300 mt-0.5">
                  {new Date(inspectSubmission.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>

            {/* Academic Integrity Inspection Box */}
            <div className={`p-4 rounded-2xl border ${
              inspectSubmission.cheatingFlagged 
                ? 'bg-rose-500/10 border-rose-500/30' 
                : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800'
            }`}>
              <div className="flex items-center gap-2">
                {inspectSubmission.cheatingFlagged ? (
                  <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                )}
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {inspectSubmission.cheatingFlagged ? 'Academic Integrity Breach Flagged' : 'Verified Academic Integrity Record'}
                </h4>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                {inspectSubmission.cheatingDetails?.reason || (inspectSubmission.cheatingFlagged ? 'Automated exam termination triggered by window loss blur violations.' : 'No window defocus or split-screen events were logged during this exam.')}
              </p>

              {inspectSubmission.cheatingDetails?.blurTimestamps && inspectSubmission.cheatingDetails.blurTimestamps.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  Recorded window defocus events ({inspectSubmission.cheatingDetails.blurTimestamps.length}):
                  <div className="mt-1 space-y-0.5">
                    {inspectSubmission.cheatingDetails.blurTimestamps.map((ts, idx) => (
                      <div key={idx}>Strike #{idx + 1}: {new Date(ts).toLocaleTimeString()}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Answer Map Log */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Recorded Response Key
              </h4>

              {Object.keys(inspectSubmission.answers || {}).length === 0 ? (
                <p className="text-xs text-slate-400 italic">No answered questions found in payload.</p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(inspectSubmission.answers).map(([qId, ansVal], index) => (
                    <div
                      key={qId}
                      className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs"
                    >
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        Question #{index + 1} ({qId})
                      </span>
                      <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                        {Array.isArray(ansVal) ? ansVal.join(', ') : String(ansVal)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Bar inside Modal */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              <button
                onClick={() => handleDeleteSubmission(inspectSubmission.id, inspectSubmission.studentName)}
                className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                Permanently Delete Record
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setInspectSubmission(null)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => handleReschedule(inspectSubmission)}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reschedule Exam
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
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
