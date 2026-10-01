import React, { useState, useRef } from 'react';
import { 
  Folder, 
  FolderOpen, 
  Plus, 
  Trash2, 
  Search, 
  Upload, 
  Image as ImageIcon, 
  X, 
  CheckCircle2, 
  HelpCircle, 
  BookOpen, 
  Layers, 
  FileText,
  ChevronRight
} from 'lucide-react';
import { Question, SchoolClass, Subject, QuestionType } from '../../types';
import { DualImageUploader } from '../common/DualImageUploader';
import { ConfirmModal } from '../common/ConfirmModal';
import { MathRenderer } from '../common/MathRenderer';

interface QuestionBankManagerProps {
  questions: Question[];
  classes: SchoolClass[];
  subjects: Subject[];
  onQuestionsUpdated: () => void;
  onShowToast: (msg: string) => void;
}

export const QuestionBankManager: React.FC<QuestionBankManagerProps> = ({
  questions,
  classes,
  subjects,
  onQuestionsUpdated,
  onShowToast,
}) => {
  // Folder Navigation State
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [selectedChapter, setSelectedChapter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Question Creator Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // Form fields
  const [formClassId, setFormClassId] = useState<string>('');
  const [formSubjectId, setFormSubjectId] = useState<string>('');
  const [formChapterName, setFormChapterName] = useState<string>('');
  const [formType, setFormType] = useState<QuestionType>('single');
  const [formText, setFormText] = useState<string>('');
  const [formPoints, setFormPoints] = useState<number>(10);
  const [formExplanation, setFormExplanation] = useState<string>('');
  const [formOptions, setFormOptions] = useState<Array<{ id: string; text: string }>>([
    { id: 'opt-1', text: '' },
    { id: 'opt-2', text: '' },
    { id: 'opt-3', text: '' },
    { id: 'opt-4', text: '' },
  ]);
  const [formCorrectAnswer, setFormCorrectAnswer] = useState<string | string[]>('opt-1');
  const [formImageUrl, setFormImageUrl] = useState<string>('');

  // Delete Confirmation Modal State
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null);
  const [isDeletingQuestion, setIsDeletingQuestion] = useState(false);

  // Extract distinct chapters for the selected class/subject
  const distinctChapters = Array.from(
    new Set(
      questions
        .filter((q) => (selectedClassId === 'all' || q.classId === selectedClassId))
        .filter((q) => (selectedSubjectId === 'all' || q.subjectId === selectedSubjectId))
        .map((q) => q.chapterName)
        .filter(Boolean) as string[]
    )
  );

  // Filtered Questions List
  const filteredQuestions = questions.filter((q) => {
    const matchesClass = selectedClassId === 'all' || q.classId === selectedClassId;
    const matchesSubject = selectedSubjectId === 'all' || q.subjectId === selectedSubjectId;
    const matchesChapter = selectedChapter === 'all' || q.chapterName === selectedChapter;
    const matchesSearch = 
      q.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.chapterName && q.chapterName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (q.explanation && q.explanation.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesClass && matchesSubject && matchesChapter && matchesSearch;
  });

  // Handle open modal for creation
  const handleOpenCreateModal = () => {
    setEditingQuestion(null);
    setFormClassId(classes[0]?.id || 'cls-10');
    setFormSubjectId(subjects[0]?.id || 'sub-phy');
    setFormChapterName('Chapter 1: Foundations & Core Principles');
    setFormType('single');
    setFormText('');
    setFormPoints(10);
    setFormExplanation('');
    setFormOptions([
      { id: 'opt-1', text: '' },
      { id: 'opt-2', text: '' },
      { id: 'opt-3', text: '' },
      { id: 'opt-4', text: '' },
    ]);
    setFormCorrectAnswer('opt-1');
    setFormImageUrl('');
    setIsModalOpen(true);
  };

  // Delete Question from Repository (Safe ConfirmModal)
  const handleConfirmDeleteQuestion = async () => {
    if (!questionToDelete) return;

    try {
      setIsDeletingQuestion(true);
      const res = await fetch(`/api/teacher/question-bank/${questionToDelete.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        onShowToast('Question and any linked storage diagram purged.');
        setQuestionToDelete(null);
        onQuestionsUpdated();
      } else {
        const err = await res.json();
        onShowToast(err.error || 'Failed to delete question');
      }
    } catch (err) {
      console.error(err);
      onShowToast('Network error deleting question.');
    } finally {
      setIsDeletingQuestion(false);
    }
  };

  // Save Question (POST or PUT to Question Bank)
  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formText.trim()) return;

    const payload = {
      text: formText.trim(),
      type: formType,
      options: formType === 'true_false'
        ? [
            { id: 'opt-true', text: 'True' },
            { id: 'opt-false', text: 'False' },
          ]
        : formOptions.filter((o) => o.text.trim().length > 0),
      correctAnswer: formCorrectAnswer,
      points: Number(formPoints),
      explanation: formExplanation,
      imageUrl: formImageUrl || undefined,
      subjectId: formSubjectId,
      classId: formClassId,
      chapterName: formChapterName || 'General Chapter',
    };

    try {
      const url = editingQuestion 
        ? `/api/teacher/question-bank/${editingQuestion.id}`
        : '/api/teacher/question-bank';
      const method = editingQuestion ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        onShowToast(
          editingQuestion
            ? 'Question updated in central repository.'
            : 'New question added to institutional question bank.'
        );
        setIsModalOpen(false);
        onQuestionsUpdated();
      } else {
        const err = await res.json();
        onShowToast(err.error || 'Failed to save question');
      }
    } catch (err) {
      console.error(err);
      onShowToast('Network error saving question.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl transition-colors space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                Curriculum Repository
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {questions.length} Total Items
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 dark:text-slate-100 mt-1">
              Centralized Question Bank &amp; Diagrams
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Organized into Standard and Chapter directories with image diagrams stored in dedicated storage.
            </p>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Add New Question
          </button>
        </div>

        {/* Directory Folder Navigation Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          {/* Class Folder Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 flex items-center gap-1.5">
              <Folder className="w-3.5 h-3.5 text-amber-500" />
              Standard / Class Folder
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                setSelectedChapter('all');
              }}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500"
            >
              <option value="all">All Standards ({classes.length} classes)</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Subject Folder Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-amber-500" />
              Subject Folder
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => {
                setSelectedSubjectId(e.target.value);
                setSelectedChapter('all');
              }}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500"
            >
              <option value="all">All Subjects ({subjects.length} subjects)</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          {/* Chapter Folder Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-500" />
              Chapter Directory
            </label>
            <select
              value={selectedChapter}
              onChange={(e) => setSelectedChapter(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500"
            >
              <option value="all">All Chapters ({distinctChapters.length} active)</option>
              {distinctChapters.map((ch) => (
                <option key={ch} value={ch}>
                  {ch}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search Bar & Stats */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search in question prompts, chapters, explanations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500"
            />
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400">
            Showing <strong className="text-slate-900 dark:text-slate-100">{filteredQuestions.length}</strong> questions
          </div>
        </div>

        {/* Questions Grid / List */}
        <div className="space-y-3">
          {filteredQuestions.length === 0 ? (
            <div className="py-12 text-center text-slate-400 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <BookOpen className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-50" />
              No questions found in this folder or matching the search query.
            </div>
          ) : (
            filteredQuestions.map((q, idx) => {
              const matchedClass = classes.find((c) => c.id === q.classId);
              const matchedSub = subjects.find((s) => s.id === q.subjectId);

              return (
                <div
                  key={q.id}
                  className="bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 hover:border-amber-500/40 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                        {matchedClass?.name || 'Class 10'}
                      </span>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {matchedSub?.name || 'Subject'}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                        <ChevronRight className="w-3 h-3 text-amber-500" />
                        {q.chapterName || 'General Chapter'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                        {q.points} Marks
                      </span>
                      <button
                        onClick={() => setQuestionToDelete(q)}
                        className="p-1 text-slate-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                        title="Delete Question and remove linked storage image"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Question Content */}
                  <div className="space-y-2">
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug flex items-start gap-1.5">
                      <span className="text-amber-600 dark:text-amber-400 shrink-0 font-mono">{idx + 1}.</span>
                      <div className="flex-1 min-w-0">
                        <MathRenderer content={q.text} />
                      </div>
                    </div>

                    {/* Linked Storage Diagram Image */}
                    {q.imageUrl && (
                      <div className="mt-2">
                        <img
                          src={q.imageUrl}
                          alt="Question Diagram"
                          referrerPolicy="no-referrer"
                          className="max-h-48 rounded-xl border border-slate-200 dark:border-slate-800 object-cover shadow-sm"
                        />
                        <span className="text-[10px] text-slate-400 block mt-1">
                          Diagram stored in Storage bucket
                        </span>
                      </div>
                    )}

                    {/* Options list */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {q.options?.map((opt) => {
                        const isCorrect = Array.isArray(q.correctAnswer)
                          ? q.correctAnswer.includes(opt.id)
                          : q.correctAnswer === opt.id;

                        return (
                          <div
                            key={opt.id}
                            className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                              isCorrect
                                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-800 dark:text-emerald-200 font-medium'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                              isCorrect ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-800'
                            }`}>
                              {isCorrect ? '✓' : '•'}
                            </span>
                            <div className="flex-1 min-w-0">
                              <MathRenderer content={opt.text} inline />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {q.explanation && (
                      <div className="text-[11px] text-slate-600 dark:text-slate-300 bg-white/60 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                        <strong className="text-amber-600 dark:text-amber-400 block mb-1">Explanation: </strong>
                        <MathRenderer content={q.explanation} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add / Edit Question Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-100">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Question Repository Authoring
                </span>
                <h3 className="text-lg font-serif font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                  Add New Question to Bank
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="space-y-4">
              {/* Directory Target Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Standard / Class
                  </label>
                  <select
                    value={formClassId}
                    onChange={(e) => setFormClassId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Subject
                  </label>
                  <select
                    value={formSubjectId}
                    onChange={(e) => setFormSubjectId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Chapter Name & Marks */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Chapter Folder / Topic Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chapter 3: Thermodynamics & Heat"
                    value={formChapterName}
                    onChange={(e) => setFormChapterName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Points / Marks
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={formPoints}
                    onChange={(e) => setFormPoints(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none font-mono"
                  />
                </div>
              </div>

              {/* Question Text Prompt */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Question Prompt Text
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="State the question clearly..."
                  value={formText}
                  onChange={(e) => setFormText(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-800 dark:text-slate-200 outline-none resize-none"
                />
              </div>

              {/* Question Diagram Upload via Storage Bucket or URL */}
              <DualImageUploader
                value={formImageUrl}
                onChange={setFormImageUrl}
                label="Question Diagram / Image (JPG/PNG Upload or Web URL)"
                onToast={onShowToast}
              />

              {/* Options Configuration */}
              <div className="space-y-2">
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Multiple Choice Options (Select the correct answer button)
                </label>
                <div className="space-y-2">
                  {formOptions.map((opt, idx) => (
                    <div key={opt.id} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setFormCorrectAnswer(opt.id)}
                        className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs cursor-pointer transition-colors ${
                          formCorrectAnswer === opt.id
                            ? 'bg-emerald-500 text-white shadow-sm'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-500 hover:bg-slate-300'
                        }`}
                        title="Click to mark as correct option"
                      >
                        {formCorrectAnswer === opt.id ? '✓' : String.fromCharCode(65 + idx)}
                      </button>
                      <input
                        type="text"
                        placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                        value={opt.text}
                        onChange={(e) => {
                          const updated = [...formOptions];
                          updated[idx].text = e.target.value;
                          setFormOptions(updated);
                        }}
                        className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Explanation */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Detailed Solution / Explanation (Shown during review)
                </label>
                <textarea
                  rows={2}
                  placeholder="Provide step-by-step logic or rule..."
                  value={formExplanation}
                  onChange={(e) => setFormExplanation(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-800 dark:text-slate-200 outline-none resize-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  Save Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Safe Non-Blocking Deletion Modal */}
      <ConfirmModal
        isOpen={Boolean(questionToDelete)}
        title="Delete Question from Repository"
        message={`Are you sure you want to delete this question? "${questionToDelete?.text.slice(0, 60)}..." Any linked diagram files in storage will also be automatically removed.`}
        confirmText="Delete Question"
        danger
        isLoading={isDeletingQuestion}
        onConfirm={handleConfirmDeleteQuestion}
        onClose={() => setQuestionToDelete(null)}
      />
    </div>
  );
};
