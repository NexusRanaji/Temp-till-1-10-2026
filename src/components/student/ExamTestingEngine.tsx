import React, { useState, useEffect, useRef } from 'react';
import { 
  Clock, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  Flag, 
  Send,
  HelpCircle,
  EyeOff,
  Maximize,
  Sparkles,
  Award
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Question, Exam } from '../../types';
import { MathRenderer } from '../common/MathRenderer';

interface ExamTestingEngineProps {
  examId: string;
  studentId: string;
  studentName: string;
  onExamCompleted: (result: any) => void;
  onExit: () => void;
}

export const ExamTestingEngine: React.FC<ExamTestingEngineProps> = ({
  examId,
  studentId,
  studentName,
  onExamCompleted,
  onExit,
}) => {
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>({});
  
  // Timer State
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Anti-Cheating System: Window Blur & Tab Switch Detector
  const [violationCount, setViolationCount] = useState<number>(0);
  const [blurTimestamps, setBlurTimestamps] = useState<string[]>([]);
  const [warningModalOpen, setWarningModalOpen] = useState(false);
  const [warningLevel, setWarningLevel] = useState<number>(0);

  // Loading & Submission State
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any | null>(null);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Guard to prevent double submissions
  const hasAutoSubmittedRef = useRef(false);

  // Fetch sanitized exam questions (server has stripped correct answers & explanations!)
  useEffect(() => {
    const fetchExamData = async () => {
      try {
        setLoading(true);
        setErrorMessage(null);
        const res = await fetch(`/api/exams/${examId}/take`, {
          headers: { 'x-user-id': studentId },
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          setErrorMessage(err.error || 'Unable to access examination.');
          return;
        }

        const data = await res.json();
        setExam(data.exam);
        setQuestions(data.exam.questions || []);
        setTimeLeftSeconds((data.exam.durationMinutes || 30) * 60);
        setIsTimerRunning(true);
      } catch (err) {
        console.error('Failed to load exam:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchExamData();
  }, [examId, studentId]);

  // Request Fullscreen for authentic testing mode
  const enterFullscreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    }
  };

  // Live Countdown Timer
  useEffect(() => {
    if (!isTimerRunning || timeLeftSeconds <= 0) return;

    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleForceAutoSubmit('Time Expired! Examination automatically submitted.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isTimerRunning, timeLeftSeconds]);

  // Anti-Cheating Event Listeners (Window Blur & Visibility Change)
  useEffect(() => {
    if (loading || isSubmitting || submissionResult) return;

    const handleFocusLoss = () => {
      if (hasAutoSubmittedRef.current) return;

      const nowIso = new Date().toISOString();
      const nextCount = violationCount + 1;
      setViolationCount(nextCount);
      setBlurTimestamps((prev) => [...prev, nowIso]);

      if (nextCount === 1) {
        setWarningLevel(1);
        setWarningModalOpen(true);
      } else if (nextCount === 2) {
        setWarningLevel(2);
        setWarningModalOpen(true);
      } else if (nextCount >= 3) {
        // 3rd violation -> automatic submission & flagged as cheater to teacher!
        setWarningLevel(3);
        setWarningModalOpen(true);
        handleForceAutoSubmit('Academic Malpractice: 3 window blur violations detected. Exam auto-submitted.');
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleFocusLoss();
      }
    };

    const handleWindowBlur = () => {
      handleFocusLoss();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [violationCount, loading, isSubmitting, submissionResult]);

  // Format Timer mm:ss
  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Submit Logic
  const handleForceAutoSubmit = async (reason?: string) => {
    if (hasAutoSubmittedRef.current) return;
    hasAutoSubmittedRef.current = true;
    setIsTimerRunning(false);
    setIsSubmitting(true);

    try {
      const cheatingLog = {
        violationCount: violationCount >= 3 ? violationCount : violationCount,
        cheatingFlagged: violationCount >= 3,
        blurTimestamps,
        reason: reason || (violationCount >= 3 ? 'Exceeded allowed focus blur strikes' : 'Standard submission'),
      };

      const res = await fetch(`/api/exams/${examId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': studentId,
        },
        body: JSON.stringify({ answers, cheatingLog }),
      });

      const data = await res.json();
      setSubmissionResult(data.result);

      if (data.result.passed && !data.result.cheatingFlagged) {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#10b981', '#fbbf24', '#ffffff'],
        });
      }
    } catch (err) {
      console.error('Submission failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualSubmit = () => {
    setConfirmSubmitOpen(false);
    handleForceAutoSubmit('Completed and submitted voluntarily.');
  };

  // Select Option Helper
  const handleSelectOption = (questionId: string, optId: string, type: string) => {
    if (type === 'multi') {
      const currentList: string[] = Array.isArray(answers[questionId]) ? answers[questionId] : [];
      const updated = currentList.includes(optId)
        ? currentList.filter((id) => id !== optId)
        : [...currentList, optId];
      setAnswers({ ...answers, [questionId]: updated });
    } else {
      setAnswers({ ...answers, [questionId]: optId });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center text-slate-700 dark:text-slate-300">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold tracking-wide">Initializing Secure Examination Environment...</p>
        <p className="text-xs text-slate-500 mt-1">Enforcing Anti-Cheating Window Blur Detectors</p>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/50 rounded-3xl p-8 shadow-xl space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold font-serif text-slate-900 dark:text-slate-100">Examination Notice</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">{errorMessage}</p>
          <button
            onClick={onExit}
            className="w-full py-3 px-4 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-semibold text-sm hover:bg-slate-800 transition cursor-pointer"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Final Results Screen
  if (submissionResult) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-8 flex items-center justify-center">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 text-center space-y-6 shadow-sm dark:shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-150">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600" />
          
          {submissionResult.cheatingFlagged ? (
            <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/40 flex items-center justify-center mx-auto shadow-lg shadow-rose-500/20">
              <ShieldAlert className="w-9 h-9 stroke-[2]" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/30">
              <Award className="w-9 h-9 stroke-[2.2]" />
            </div>
          )}

          <div>
            <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
              submissionResult.cheatingFlagged
                ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                : 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30'
            }`}>
              {submissionResult.cheatingFlagged ? 'Flagged for Malpractice' : 'Assessment Completed'}
            </span>

            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 dark:text-slate-100 mt-2">
              {exam?.title}
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Candidate: <strong className="text-slate-900 dark:text-slate-200">{studentName}</strong> • Evaluated instantly by Node.js backend
            </p>
          </div>

          {/* Instant Score Card */}
          <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 grid grid-cols-3 gap-3">
            <div>
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Score Obtained</div>
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100 mt-1">
                {submissionResult.score} / {submissionResult.totalMarks}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Percentage</div>
              <div className={`text-2xl font-bold font-mono mt-1 ${submissionResult.passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {submissionResult.percentage}%
              </div>
            </div>

            <div>
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Bonus Awarded</div>
              <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1 flex items-center justify-center gap-1">
                <Sparkles className="w-4 h-4" />
                +{submissionResult.bonusPointsAwarded}
              </div>
            </div>
          </div>

          {/* Locked Review Notice */}
          <div className="bg-slate-50 dark:bg-slate-950 border border-amber-500/30 rounded-xl p-4 text-xs text-left space-y-1.5">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-bold">
              <Clock className="w-4 h-4" />
              <span>Result Review Policy: Locked until Window Ends</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
              To prevent early submitters from sharing answers, the detailed review screen (showing correct keys and teacher explanations) remains sealed until the designated availability window has closed for all students.
            </p>
          </div>

          <button
            onClick={() => onExamCompleted(submissionResult)}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            Return to Student Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;
  const isTimeCritical = timeLeftSeconds < 300; // Under 5 minutes

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col select-none">
      
      {/* Test Engine Header Bar */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-3 sm:px-8 py-2.5 sm:py-3.5 flex items-center justify-between shadow-sm dark:shadow-xl">
        <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h2 className="font-serif font-bold text-xs sm:text-base text-slate-900 dark:text-slate-100 truncate max-w-[130px] xs:max-w-[200px] sm:max-w-md">
                {exam?.title}
              </h2>
              <span className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0">
                {exam?.subjectName}
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 truncate">
              Candidate: <strong className="text-slate-800 dark:text-slate-200">{studentName}</strong>
            </p>
          </div>
        </div>

        {/* Live Countdown Timer & Submit */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-xl border font-mono font-bold text-xs sm:text-base shadow-inner transition-colors ${
            isTimeCritical 
              ? 'bg-rose-500/20 border-rose-500/50 text-rose-700 dark:text-rose-300 animate-pulse'
              : 'bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-amber-700 dark:text-amber-400'
          }`}>
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>{formatTimer(timeLeftSeconds)}</span>
          </div>

          <button
            onClick={() => setConfirmSubmitOpen(true)}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Finish & Submit</span>
            <span className="sm:hidden">Submit</span>
          </button>
        </div>
      </header>

      {/* Main Testing Stage */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* Left 3 Cols: Active Question Display */}
        <div className="lg:col-span-3 space-y-4 sm:space-y-6">
          {/* Mobile Quick Question Palette Ribbon (YouTube chapters style) */}
          <div className="flex lg:hidden items-center gap-1.5 overflow-x-auto no-scrollbar touch-pan-x py-1 px-0.5">
            {questions.map((q, idx) => {
              const isAnswered = answers[q.id] !== undefined;
              const isCurrent = idx === currentIndex;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-9 h-9 shrink-0 rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center cursor-pointer ${
                    isCurrent
                      ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400'
                      : isAnswered
                      ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/40'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {currentQ ? (
            <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-8 shadow-sm dark:shadow-2xl space-y-5 sm:space-y-6 relative overflow-hidden">
              
              {/* Question Banner & Navigation */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 font-mono font-bold text-sm flex items-center justify-center border border-amber-500/30">
                    {currentIndex + 1}
                  </span>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Question {currentIndex + 1} of {totalQuestions}
                    </span>
                    <span className="ml-2 text-[11px] font-mono text-amber-600 dark:text-amber-400 font-semibold">
                      ({currentQ.points} Marks)
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setFlaggedQuestions({ ...flaggedQuestions, [currentQ.id]: !flaggedQuestions[currentQ.id] })}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    flaggedQuestions[currentQ.id]
                      ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-500/40'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>{flaggedQuestions[currentQ.id] ? 'Flagged for Review' : 'Mark for Review'}</span>
                </button>
              </div>

              {/* Question Text */}
              <div className="text-base sm:text-lg font-medium text-slate-900 dark:text-slate-100 leading-relaxed">
                <MathRenderer content={currentQ.text} />
              </div>

              {/* Attached Photograph (if any) */}
              {currentQ.imageUrl && (
                <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 p-2 max-w-lg">
                  <img
                    src={currentQ.imageUrl}
                    alt="Question visual reference"
                    className="w-full h-56 sm:h-72 object-cover rounded-xl"
                    referrerPolicy="no-referrer"
                  />
                  <p className="text-[10px] text-slate-500 text-center mt-1.5">
                    Click to examine attached problem illustration
                  </p>
                </div>
              )}

              {/* Options Selector */}
              <div className="space-y-3 pt-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {currentQ.type === 'multi' ? 'Select all applicable statements:' : 'Choose the correct answer:'}
                </p>

                <div className="space-y-2.5">
                  {currentQ.options.map((opt, oIdx) => {
                    const isSelected = currentQ.type === 'multi'
                      ? Array.isArray(answers[currentQ.id]) && answers[currentQ.id].includes(opt.id)
                      : answers[currentQ.id] === opt.id;

                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSelectOption(currentQ.id, opt.id, currentQ.type)}
                        className={`w-full text-left p-4 rounded-2xl border text-xs sm:text-sm font-medium transition-all flex items-center gap-3 cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-500/60 text-amber-950 dark:text-amber-200 shadow-md shadow-amber-500/10'
                            : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <span className={`w-6 h-6 rounded-lg font-mono text-xs flex items-center justify-center font-bold border transition-colors shrink-0 ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 border-amber-400'
                            : 'bg-slate-200 dark:bg-slate-900 text-slate-700 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                        }`}>
                          {String.fromCharCode(65 + oIdx)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <MathRenderer content={opt.text} inline />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Navigation Arrows */}
              <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-800">
                <button
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous Question
                </button>

                <button
                  disabled={currentIndex === totalQuestions - 1}
                  onClick={() => setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
                  className="flex items-center gap-1.5 px-5 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Next Question
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          ) : null}
        </div>

        {/* Right 1 Col: Question Navigator & Integrity Badge */}
        <div className="space-y-5">
          
          {/* Integrity Monitoring Badge */}
          <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3 shadow-sm dark:shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Anti-Cheating Guard
              </span>
              <span className={`w-2.5 h-2.5 rounded-full ${violationCount > 0 ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'}`} />
            </div>

            <div className="text-xs text-slate-700 dark:text-slate-300">
              Window Blur Detector: <strong className="text-emerald-600 dark:text-emerald-400">Active</strong>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-[11px] space-y-1">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>Infractions:</span>
                <span className={`font-mono font-bold ${violationCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}`}>
                  {violationCount} / 3 Strikes
                </span>
              </div>
              <p className="text-[10px] text-slate-500 leading-tight">
                Tab switching or minimizing will trigger an instant warning strike. 3rd strike auto-submits.
              </p>
            </div>
          </div>

          {/* Question Grid Palette */}
          <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm dark:shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-serif font-bold text-slate-800 dark:text-slate-200">
                Question Palette
              </h3>
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                {answeredCount}/{totalQuestions} Answered
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const isAnswered = answers[q.id] !== undefined;
                const isFlagged = flaggedQuestions[q.id];
                const isCurrent = idx === currentIndex;

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-9 rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center relative cursor-pointer ${
                      isCurrent
                        ? 'ring-2 ring-amber-400 bg-amber-500 text-slate-950'
                        : isAnswered
                        ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700'
                    }`}
                  >
                    {idx + 1}
                    {isFlagged && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 text-[10px] text-slate-500 dark:text-slate-400 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/40" />
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800" />
                <span>Not Visited / Pending</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Flagged for Review</span>
              </div>
            </div>
          </div>

        </div>

      </main>

      {/* Confirmation Modal Before Voluntary Submit - YouTube Mobile Bottom Sheet */}
      {confirmSubmitOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-center pb-safe animate-in slide-in-from-bottom duration-200">
            <div className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto sm:hidden mb-1" />
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto">
              <Send className="w-6 h-6" />
            </div>

            <h3 className="font-serif font-bold text-lg text-slate-900 dark:text-slate-100">
              Submit Examination Paper?
            </h3>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              You have answered <strong className="text-amber-600 dark:text-amber-400 font-mono">{answeredCount}</strong> of <strong className="text-slate-900 dark:text-slate-200 font-mono">{totalQuestions}</strong> questions. Once submitted, your answers cannot be altered.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setConfirmSubmitOpen(false)}
                className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Continue Test
              </button>
              <button
                onClick={handleManualSubmit}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
              >
                Confirm Submission
              </button>
            </div>
          </div>
        </div>
      )}

      {/* On-Screen Anti-Cheating Warning Modals (Strikes 1, 2, 3) */}
      {warningModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-rose-950/90 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border-t-2 sm:border-2 border-rose-500 rounded-t-3xl sm:rounded-3xl max-w-lg w-full p-5 sm:p-8 space-y-4 sm:space-y-5 shadow-2xl text-center pb-safe animate-in slide-in-from-bottom duration-200">
            <div className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto sm:hidden mb-1" />
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-rose-500/20 text-rose-500 dark:text-rose-400 border border-rose-500/40 flex items-center justify-center mx-auto animate-bounce">
              <ShieldAlert className="w-8 h-8 sm:w-9 sm:h-9 stroke-[2.2]" />
            </div>

            <div>
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/40">
                {warningLevel === 1 ? 'Warning Strike 1 / 2' : warningLevel === 2 ? 'Final Warning Strike 2 / 2' : 'Examination Terminated'}
              </span>

              <h2 className="text-lg sm:text-2xl font-serif font-bold text-rose-600 dark:text-rose-200 mt-2 sm:mt-3">
                {warningLevel < 3 ? 'Window Blur / Tab Switch Detected!' : 'Third Violation: Auto-Submitted'}
              </h2>

              <p className="text-xs text-slate-700 dark:text-slate-300 mt-2 leading-relaxed">
                {warningLevel === 1 && (
                  <>
                    The system detected that you switched browser tabs, minimized the window, or lost active app focus. 
                    Nexus Ranaji English School policy allows <strong className="text-amber-600 dark:text-amber-400">exactly 2 warnings</strong>. Return to your test immediately.
                  </>
                )}
                {warningLevel === 2 && (
                  <>
                    <strong className="text-rose-600 dark:text-rose-400">CRITICAL FINAL WARNING:</strong> This is your 2nd strike. 
                    Any further focus loss or tab navigation will automatically submit your exam and permanently flag you for academic malpractice!
                  </>
                )}
                {warningLevel === 3 && (
                  <>
                    You have exceeded the maximum permitted infractions (3 strikes logged). Your examination paper has been automatically submitted and reported to the invigilator.
                  </>
                )}
              </p>
            </div>

            {warningLevel < 3 ? (
              <button
                onClick={() => setWarningModalOpen(false)}
                className="w-full py-3 bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-500/30 transition-colors cursor-pointer"
              >
                I Understand &amp; Return to Examination
              </button>
            ) : (
              <p className="text-xs font-mono text-slate-400">
                Finalizing automatic submission payload...
              </p>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
