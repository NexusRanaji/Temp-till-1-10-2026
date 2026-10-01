import React, { useState } from 'react';
import { 
  Sparkles, 
  X, 
  CheckCircle2, 
  HelpCircle, 
  AlertCircle, 
  Save, 
  BookOpen, 
  Layers, 
  Globe, 
  Award,
  RefreshCw,
  Plus,
  Trash2,
  Edit3
} from 'lucide-react';
import { Subject, SchoolClass } from '../../types';
import { MathRenderer } from '../common/MathRenderer';

interface AIQuizGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: Subject[];
  classes: SchoolClass[];
  onSaveQuestions: (quizData: {
    title: string;
    description: string;
    subjectId: string;
    targetClassId: string;
    questions: any[];
    asDraft: boolean;
  }) => Promise<void>;
}

export const AIQuizGeneratorModal: React.FC<AIQuizGeneratorModalProps> = ({
  isOpen,
  onClose,
  subjects,
  classes,
  onSaveQuestions,
}) => {
  const [chapterName, setChapterName] = useState('');
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || '');
  const [classId, setClassId] = useState(classes[0]?.id || '');
  const [language, setLanguage] = useState('English');
  const [educationalBoard, setEducationalBoard] = useState('CBSE');
  const [difficultyLevel, setDifficultyLevel] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [totalQuestions, setTotalQuestions] = useState(5);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuiz, setGeneratedQuiz] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const selectedSubject = subjects.find((s) => s.id === subjectId) || subjects[0];
  const selectedClass = classes.find((c) => c.id === classId) || classes[0];

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chapterName.trim()) {
      setError('Please provide a chapter or topic name.');
      return;
    }

    setError(null);
    setIsGenerating(true);

    try {
      const res = await fetch('/api/ai/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterName: chapterName.trim(),
          subject: selectedSubject?.name || 'General Science',
          classGrade: selectedClass?.name || 'Standard 10',
          language,
          educationalBoard,
          difficultyLevel,
          totalQuestions,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to generate quiz');
      }

      const data = await res.json();
      setGeneratedQuiz(data.quiz);
    } catch (err: any) {
      console.error('Quiz Generation Error:', err);
      setError(err?.message || 'Failed to automatically generate quiz. Please check API key availability.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToDraft = async (asDraft: boolean) => {
    if (!generatedQuiz || !generatedQuiz.questions) return;
    setIsSaving(true);
    try {
      await onSaveQuestions({
        title: generatedQuiz.title || `${chapterName} Quiz`,
        description: generatedQuiz.description || `AI-generated assessment for ${chapterName}`,
        subjectId,
        targetClassId: classId,
        questions: generatedQuiz.questions.map((q: any, idx: number) => {
          const formattedOptions = Array.isArray(q.options)
            ? q.options.map((opt: any, oIdx: number) => {
                if (typeof opt === 'string') {
                  return { id: `opt-${oIdx + 1}`, text: opt };
                }
                return opt;
              })
            : [];
          const correctIdx = q.correctAnswerIndex !== undefined ? q.correctAnswerIndex : (q.correctAnswer ?? 0);
          const correctAnswer = typeof q.correctAnswer === 'string' && q.correctAnswer.startsWith('opt-')
            ? q.correctAnswer
            : `opt-${(Number(correctIdx) || 0) + 1}`;

          return {
            id: `q-gen-${Date.now()}-${idx}`,
            text: q.questionText || q.text,
            type: 'single',
            options: formattedOptions,
            correctAnswer: correctAnswer,
            correctAnswerIndex: Number(correctIdx) || 0,
            explanation: q.explanation || '',
            marks: q.marks || q.points || 4,
            points: q.marks || q.points || 4,
            difficulty: q.difficulty || difficultyLevel,
            category: 'Multiple Choice',
          };
        }),
        asDraft,
      });
      onClose();
    } catch (err) {
      console.error('Save generated quiz failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full p-6 sm:p-7 space-y-6 shadow-2xl animate-in zoom-in-95 duration-100 my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-slate-900 dark:text-slate-100 text-lg">
                AI Automatic Quiz Generator
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Provide chapter or unit name, and Gemini generates syllabus-aligned questions with answer keys &amp; explanations.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto flex-1 space-y-6 pr-1">
          {error && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Chapter or Topic Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Chemical Reactions and Equations"
                  value={chapterName}
                  onChange={(e) => setChapterName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Subject *
                </label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Class Grade *
                </label>
                <select
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Educational Board
                </label>
                <select
                  value={educationalBoard}
                  onChange={(e) => setEducationalBoard(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500"
                >
                  <option value="CBSE">CBSE (Central Board)</option>
                  <option value="ICSE">ICSE</option>
                  <option value="State Board">State Board</option>
                  <option value="International Baccalaureate">IB / Cambridge</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Language Medium
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500"
                >
                  <option value="English">English</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Marathi">Marathi</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Difficulty
                  </label>
                  <select
                    value={difficultyLevel}
                    onChange={(e) => setDifficultyLevel(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Questions Count
                  </label>
                  <select
                    value={totalQuestions}
                    onChange={(e) => setTotalQuestions(parseInt(e.target.value, 10))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500"
                  >
                    <option value={3}>3 Questions (Quick Test)</option>
                    <option value={5}>5 Questions (Standard)</option>
                    <option value={10}>10 Questions (Comprehensive)</option>
                  </select>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-amber-500/20"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Synthesizing syllabus questions &amp; answer keys with Gemini AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Quiz with AI</span>
                </>
              )}
            </button>
          </form>

          {/* Generated Quiz Preview */}
          {generatedQuiz && (
            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                    Generation Successful
                  </span>
                  <h4 className="font-serif font-bold text-slate-900 dark:text-slate-100 text-base">
                    {generatedQuiz.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {generatedQuiz.description} ({generatedQuiz.questions?.length || 0} Questions)
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 font-semibold">
                    {generatedQuiz.difficulty}
                  </span>
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-3">
                {generatedQuiz.questions?.map((q: any, qIdx: number) => (
                  <div
                    key={qIdx}
                    className="p-4 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-bold text-xs text-slate-900 dark:text-slate-100 flex-1">
                        <span className="mr-1.5 text-amber-600 dark:text-amber-400">Q{qIdx + 1}.</span>
                        <MathRenderer content={q.questionText || q.text} inline />
                      </div>
                      <span className="text-[10px] font-semibold text-slate-400 shrink-0">
                        {q.marks || q.points || 1} Mark
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {q.options?.map((opt: string, optIdx: number) => {
                        const isCorrect = optIdx === (q.correctAnswerIndex !== undefined ? q.correctAnswerIndex : q.correctAnswer);
                        return (
                          <div
                            key={optIdx}
                            className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                              isCorrect
                                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-800 dark:text-emerald-300 font-medium'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] flex items-center justify-center font-bold shrink-0">
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <div className="flex-1 min-w-0">
                              <MathRenderer content={opt} inline />
                            </div>
                            {isCorrect && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 ml-auto shrink-0" />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {q.explanation && (
                      <div className="text-[11px] text-slate-600 dark:text-slate-300 bg-amber-500/5 dark:bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                        <strong className="text-amber-700 dark:text-amber-400 font-semibold block mb-1">Teacher Explanation: </strong>
                        <MathRenderer content={q.explanation} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {generatedQuiz && (
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-end gap-3 shrink-0">
            <button
              onClick={() => handleSaveToDraft(true)}
              disabled={isSaving}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-4 h-4 text-amber-500" />
              <span>Save as Draft Exam</span>
            </button>

            <button
              onClick={() => handleSaveToDraft(false)}
              disabled={isSaving}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm shadow-amber-500/20"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Publish as Active Exam</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
