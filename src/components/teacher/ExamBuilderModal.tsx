import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  Save, 
  Send, 
  Database, 
  HelpCircle,
  CheckCircle2,
  Clock,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Exam, Question, QuestionType, SchoolClass, Division, Subject } from '../../types';
import { DualImageUploader } from '../common/DualImageUploader';
import { MathRenderer } from '../common/MathRenderer';

interface ExamBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  examToEdit?: Exam | null;
  classes: SchoolClass[];
  divisions: Division[];
  subjects: Subject[];
  questionBank: Question[];
  currentTeacherId: string;
  currentTeacherName: string;
  onExamSaved: () => void;
}

export const ExamBuilderModal: React.FC<ExamBuilderModalProps> = ({
  isOpen,
  onClose,
  examToEdit,
  classes,
  divisions,
  subjects,
  questionBank,
  currentTeacherId,
  currentTeacherName,
  onExamSaved,
}) => {
  if (!isOpen) return null;

  const now = new Date();
  const defaultStart = now.toISOString().slice(0, 16);
  const defaultEnd = new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString().slice(0, 16);

  // Exam Meta State
  const [title, setTitle] = useState(examToEdit?.title || '');
  const [description, setDescription] = useState(examToEdit?.description || '');
  const [classId, setClassId] = useState(examToEdit?.classId || classes[0]?.id || '');
  const [divisionId, setDivisionId] = useState(examToEdit?.divisionId || divisions[0]?.id || '');
  const [subjectId, setSubjectId] = useState(examToEdit?.subjectId || subjects[0]?.id || '');
  const [startTime, setStartTime] = useState(examToEdit?.startTime ? examToEdit.startTime.slice(0, 16) : defaultStart);
  const [endTime, setEndTime] = useState(examToEdit?.endTime ? examToEdit.endTime.slice(0, 16) : defaultEnd);
  const [durationMinutes, setDurationMinutes] = useState(examToEdit?.durationMinutes || 30);
  const [passingScore, setPassingScore] = useState(examToEdit?.passingScore || 50);

  // Questions State (Google Forms style)
  const [questions, setQuestions] = useState<Question[]>(
    examToEdit?.questions || [
      {
        id: `q-${Date.now()}`,
        text: 'State the primary principle of this concept:',
        type: 'single',
        options: [
          { id: 'opt-1', text: 'Option A statement' },
          { id: 'opt-2', text: 'Option B statement' },
          { id: 'opt-3', text: 'Option C statement' },
          { id: 'opt-4', text: 'Option D statement' },
        ],
        correctAnswer: 'opt-1',
        explanation: 'Detailed teacher rationale shown after exam window closes.',
        points: 10,
        imageUrl: '',
        inQuestionBank: false,
      },
    ]
  );

  // Question Bank Drawer
  const [bankDrawerOpen, setBankDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Add Question
  const handleAddQuestion = (type: QuestionType = 'single') => {
    let initialOptions = [
      { id: 'opt-1', text: 'Option 1' },
      { id: 'opt-2', text: 'Option 2' },
      { id: 'opt-3', text: 'Option 3' },
      { id: 'opt-4', text: 'Option 4' },
    ];
    let defaultAns: any = 'opt-1';

    if (type === 'true_false') {
      initialOptions = [
        { id: 'opt-true', text: 'True' },
        { id: 'opt-false', text: 'False' },
      ];
      defaultAns = 'opt-true';
    } else if (type === 'multi') {
      defaultAns = ['opt-1'];
    }

    const newQ: Question = {
      id: `q-${Date.now()}-${Math.random().toString().slice(2, 5)}`,
      text: '',
      type,
      options: initialOptions,
      correctAnswer: defaultAns,
      explanation: '',
      points: 10,
      imageUrl: '',
      inQuestionBank: false,
    };

    setQuestions([...questions, newQ]);
  };

  const handleUpdateQuestion = (index: number, updates: Partial<Question>) => {
    const next = [...questions];
    next[index] = { ...next[index], ...updates };
    setQuestions(next);
  };

  const handleRemoveQuestion = (index: number) => {
    if (questions.length <= 1) {
      setErrorMessage('An exam requires at least 1 question.');
      return;
    }
    setErrorMessage('');
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleAddOption = (qIndex: number) => {
    const q = questions[qIndex];
    const newOptId = `opt-${Date.now().toString().slice(-4)}`;
    const nextOptions = [...q.options, { id: newOptId, text: `Option ${q.options.length + 1}` }];
    handleUpdateQuestion(qIndex, { options: nextOptions });
  };

  const handleRemoveOption = (qIndex: number, optId: string) => {
    const q = questions[qIndex];
    if (q.options.length <= 2) {
      setErrorMessage('Multiple choice questions require at least two options.');
      return;
    }
    setErrorMessage('');
    const nextOptions = q.options.filter((o) => o.id !== optId);
    handleUpdateQuestion(qIndex, { options: nextOptions });
  };

  // Import from Centralized Question Bank
  const handleImportFromBank = (bankQ: Question) => {
    const cloned: Question = {
      ...bankQ,
      id: `q-imp-${Date.now()}-${Math.random().toString().slice(2, 5)}`,
    };
    setQuestions([...questions, cloned]);
    setBankDrawerOpen(false);
  };

  // Preset Images for Easy Photo Attachment
  const sampleDiagrams = [
    { name: 'Electrical Resistor Circuit', url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80' },
    { name: 'Optical Prism & Refraction', url: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&auto=format&fit=crop&q=80' },
    { name: 'Geometric Triangle Diagram', url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&auto=format&fit=crop&q=80' },
  ];

  const handleSave = async (status: 'draft' | 'published') => {
    if (!title) {
      setErrorMessage('Please provide an exam title.');
      return;
    }
    if (questions.length === 0) {
      setErrorMessage('Exam must have at least one question.');
      return;
    }
    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].text.trim()) {
        setErrorMessage(`Question #${i + 1} text cannot be empty.`);
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const payload = {
        title,
        description,
        subjectId,
        classId,
        divisionId,
        teacherId: currentTeacherId,
        teacherName: currentTeacherName,
        status,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        durationMinutes: Number(durationMinutes),
        passingScore: Number(passingScore),
        questions,
      };

      const url = examToEdit ? `/api/teacher/exams/${examToEdit.id}` : '/api/teacher/exams';
      const method = examToEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save exam');
      }

      onExamSaved();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
        
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/90">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                Assessment Designer
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {examToEdit ? 'Edit Assessment' : 'New Assessment'}
              </span>
            </div>
            <h2 className="text-xl font-serif font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              {title || 'Untitled Online Examination'}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setBankDrawerOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-amber-600 dark:text-amber-300 border border-amber-500/30 text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-sm"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Question Bank</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Form Header Card (Google Forms Theme) */}
          <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-amber-500/20 rounded-2xl p-5 relative overflow-hidden shadow-sm">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600" />
            
            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  required
                  placeholder="Exam Title (e.g. Standard 10 Physics Mid-Term Assessment)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-lg sm:text-xl font-serif font-bold text-slate-900 dark:text-slate-100 bg-transparent border-b border-slate-300 dark:border-slate-800 focus:border-amber-500 py-1 outline-none transition-colors placeholder-slate-400"
                />
              </div>

              <div>
                <textarea
                  rows={2}
                  placeholder="Exam instructions, syllabus units covered, and conduct rules for students..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs text-slate-700 dark:text-slate-300 bg-transparent border-b border-slate-300 dark:border-slate-800 focus:border-amber-500 py-1 outline-none resize-none placeholder-slate-400"
                />
              </div>

              {/* Meta Parameters Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Target Class</label>
                  <select
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Target Division</label>
                  <select
                    value={divisionId}
                    onChange={(e) => setDivisionId(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500"
                  >
                    {divisions
                      .filter((d) => !classId || d.classId === classId)
                      .map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Subject</label>
                  <select
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Time Window & Timer Parameters */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1 border-t border-slate-200 dark:border-slate-800/80">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-amber-500" />
                    Window Opens
                  </label>
                  <input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-rose-500" />
                    Window Closes
                  </label>
                  <input
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-500" />
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={180}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />
                    Passing Score (%)
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={100}
                    value={passingScore}
                    onChange={(e) => setPassingScore(Number(e.target.value))}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Questions Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-serif font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <span>Examination Questions</span>
                <span className="text-xs font-mono font-normal text-slate-500 dark:text-slate-400">
                  ({questions.length} questions • Total {questions.reduce((sum, q) => sum + (Number(q.points) || 10), 0)} marks)
                </span>
              </h3>

              {/* Add Question Selector */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAddQuestion('single')}
                  className="flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-500" />
                  Single Choice MCQ
                </button>
                <button
                  type="button"
                  onClick={() => handleAddQuestion('multi')}
                  className="flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-500" />
                  Multi-Select MCQ
                </button>
                <button
                  type="button"
                  onClick={() => handleAddQuestion('true_false')}
                  className="flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5 text-blue-500" />
                  True / False
                </button>
              </div>
            </div>

            {/* Questions List (Cards) */}
            <div className="space-y-5">
              {questions.map((q, qIndex) => (
                <div 
                  key={q.id || qIndex} 
                  className="bg-slate-50/70 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-2xl p-5 space-y-4 transition-all shadow-sm"
                >
                  {/* Question Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 font-mono font-bold text-xs flex items-center justify-center">
                          {qIndex + 1}
                        </span>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          {q.type === 'single' ? 'Single Choice MCQ' : q.type === 'multi' ? 'Multiple Selection MCQ' : 'True or False'}
                        </span>
                      </div>

                      <textarea
                        rows={2}
                        required
                        placeholder="Type question prompt here (supports LaTeX: $E=mc^2$, $\frac{a}{b}$, $x^2+y^2=r^2$)..."
                        value={q.text}
                        onChange={(e) => handleUpdateQuestion(qIndex, { text: e.target.value })}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 focus:border-amber-500 rounded-xl p-3 text-xs text-slate-800 dark:text-slate-100 outline-none resize-none placeholder-slate-400"
                      />

                      {q.text && (q.text.includes('$') || q.text.includes('\\') || q.text.includes('^')) && (
                        <div className="mt-1 p-2 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs">
                          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block mb-0.5">
                            Equation Live Preview:
                          </span>
                          <MathRenderer content={q.text} />
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(qIndex)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Delete Question"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-2 py-1">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Marks:</span>
                        <input
                          type="number"
                          min={1}
                          max={50}
                          value={q.points}
                          onChange={(e) => handleUpdateQuestion(qIndex, { points: Number(e.target.value) })}
                          className="w-10 bg-transparent text-center text-xs font-mono font-bold text-amber-600 dark:text-amber-400 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Photo Attachment (Image URL or Direct JPG/PNG Upload) */}
                  <DualImageUploader
                    value={q.imageUrl || ''}
                    onChange={(url) => handleUpdateQuestion(qIndex, { imageUrl: url })}
                    label="Attach Photograph / Diagram (Direct JPG/PNG Upload or Web Link)"
                  />

                  {/* Options List */}
                  <div className="space-y-2">
                    <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                      Answer Options (Check the correct key):
                    </div>

                    {q.options.map((opt, optIndex) => {
                      const isChecked =
                        q.type === 'multi'
                          ? Array.isArray(q.correctAnswer) && q.correctAnswer.includes(opt.id)
                          : q.correctAnswer === opt.id;

                      return (
                        <div key={opt.id} className="flex items-center gap-3">
                          <input
                            type={q.type === 'multi' ? 'checkbox' : 'radio'}
                            name={`correct-${q.id}`}
                            checked={isChecked}
                            onChange={() => {
                              if (q.type === 'multi') {
                                const currentArr = Array.isArray(q.correctAnswer) ? q.correctAnswer : [];
                                const nextArr = isChecked
                                  ? currentArr.filter((id) => id !== opt.id)
                                  : [...currentArr, opt.id];
                                handleUpdateQuestion(qIndex, { correctAnswer: nextArr });
                              } else {
                                handleUpdateQuestion(qIndex, { correctAnswer: opt.id });
                              }
                            }}
                            className="w-4 h-4 text-amber-500 accent-amber-500 cursor-pointer"
                          />

                          <input
                            type="text"
                            required
                            disabled={q.type === 'true_false'}
                            value={opt.text}
                            onChange={(e) => {
                              const nextOpts = [...q.options];
                              nextOpts[optIndex] = { ...nextOpts[optIndex], text: e.target.value };
                              handleUpdateQuestion(qIndex, { options: nextOpts });
                            }}
                            className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500"
                          />

                          {q.type !== 'true_false' && (
                            <button
                              type="button"
                              onClick={() => handleRemoveOption(qIndex, opt.id)}
                              className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}

                    {q.type !== 'true_false' && (
                      <button
                        type="button"
                        onClick={() => handleAddOption(qIndex)}
                        className="text-xs text-amber-600 dark:text-amber-400 hover:text-amber-500 font-medium flex items-center gap-1 pt-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Option
                      </button>
                    )}
                  </div>

                  {/* Teacher Explanation */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Post-Exam Explanation (Released to students only after availability window ends)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. By Ohm's law, V=IR, hence current halves when resistance doubles."
                      value={q.explanation || ''}
                      onChange={(e) => handleUpdateQuestion(qIndex, { explanation: e.target.value })}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-300 outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-600 dark:text-slate-400">
            Passing requirement: <strong className="text-amber-600 dark:text-amber-400">{passingScore}%</strong> • Total Marks: <strong className="text-slate-900 dark:text-slate-200">{questions.reduce((sum, q) => sum + (Number(q.points) || 10), 0)}</strong>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSave('draft')}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-sm"
            >
              <Save className="w-4 h-4" />
              Save as Draft
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSave('published')}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              Publish Exam to Students
            </button>
          </div>
        </div>

        {/* Drawer for Question Bank Import */}
        {bankDrawerOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex justify-end">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full p-6 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-amber-500" />
                  <h3 className="font-serif font-bold text-slate-900 dark:text-slate-100 text-base">
                    Centralized Question Bank
                  </h3>
                </div>
                <button
                  onClick={() => setBankDrawerOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 my-3">
                Select vetted questions created by fellow faculty to insert into this assessment:
              </p>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {questionBank.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">No questions in bank yet.</p>
                ) : (
                  questionBank.map((bankQ) => (
                    <div
                      key={bankQ.id}
                      className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-2 hover:border-amber-500/40 transition-colors shadow-sm"
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="font-bold uppercase text-amber-600 dark:text-amber-400">{bankQ.type}</span>
                        <span>{bankQ.points} marks</span>
                      </div>
                      <p className="text-xs font-medium text-slate-800 dark:text-slate-200">{bankQ.text}</p>
                      {bankQ.imageUrl && (
                        <img
                          src={bankQ.imageUrl}
                          alt="Diagram"
                          className="w-full h-24 object-cover rounded-lg border border-slate-200 dark:border-slate-800"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => handleImportFromBank(bankQ)}
                        className="w-full mt-1 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                      >
                        Insert into Assessment
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
