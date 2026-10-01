import React, { useState, useEffect } from 'react';
import { 
  X, 
  Lock, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Award, 
  ShieldCheck, 
  HelpCircle,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { MathRenderer } from '../common/MathRenderer';

interface ExamReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  examId: string;
  studentId: string;
}

export const ExamReviewModal: React.FC<ExamReviewModalProps> = ({
  isOpen,
  onClose,
  examId,
  studentId,
}) => {
  if (!isOpen) return null;

  const [reviewData, setReviewData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReview = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/exams/${examId}/review`, {
          headers: { 'x-user-id': studentId },
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to fetch review');
        }

        const data = await res.json();
        setReviewData(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReview();
  }, [examId, studentId]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden pb-safe sm:pb-0 animate-in slide-in-from-bottom duration-200 text-slate-900 dark:text-slate-100">
        {/* Mobile Pull Handle */}
        <div className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto sm:hidden mt-2 mb-1" />
        
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/90">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] sm:text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                Assessment Review &amp; Evaluation
              </span>
              {reviewData?.locked && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Answer Key Sealed
                </span>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-serif font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              {reviewData?.examTitle || 'Performance Assessment Review'}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="py-16 text-center text-slate-500 dark:text-slate-400 text-xs">
              <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Loading assessment records...
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs">
              {error}
            </div>
          ) : reviewData?.locked ? (
            /* Locked State: Time Window Has Not Closed Yet */
            <div className="text-center py-10 px-4 space-y-5">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
                <Lock className="w-8 h-8 stroke-[2]" />
              </div>

              <div className="max-w-md mx-auto">
                <h3 className="text-lg font-serif font-bold text-slate-900 dark:text-slate-100">
                  Detailed Answer Key is Temporarily Sealed
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                  {reviewData.message}
                </p>
                {reviewData.windowClosesAt && (
                  <p className="text-[11px] text-amber-700 dark:text-amber-300/90 font-mono mt-3">
                    Scheduled Window Close: {new Date(reviewData.windowClosesAt).toLocaleString()}
                  </p>
                )}
              </div>

              {/* Provisional Score Pill */}
              {reviewData.summary && (
                <div className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 max-w-sm mx-auto grid grid-cols-2 gap-3 text-center">
                  <div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Score Recorded</span>
                    <p className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100 mt-1">
                      {reviewData.summary.score} / {reviewData.summary.totalMarks}
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Bonus Awarded</span>
                    <p className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1">
                      +{reviewData.summary.bonusPointsAwarded} pts
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Unlocked Review: Full Question Breakdown */
            <div className="space-y-6">
              {/* Submission Score Banner */}
              <div className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Official Result</span>
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-serif mt-0.5">
                    {reviewData.submission?.score} / {reviewData.submission?.totalMarks} Marks ({reviewData.submission?.percentage}%)
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Bonus Points Earned</span>
                    <p className="text-sm font-bold text-amber-600 dark:text-amber-400 font-mono flex items-center gap-1 justify-end">
                      <Sparkles className="w-3.5 h-3.5" />
                      +{reviewData.submission?.bonusPointsAwarded} pts
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    reviewData.submission?.passed
                      ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-500/40'
                  }`}>
                    {reviewData.submission?.passed ? 'Passed' : 'Needs Improvement'}
                  </span>
                </div>
              </div>

              {/* Questions List with Solutions */}
              <div className="space-y-4">
                {reviewData.questions?.map((q: any, qIdx: number) => {
                  const studentAns = q.studentAnswer;
                  const correctAns = q.correctAnswer;
                  
                  const isCorrect = q.type === 'multi'
                    ? Array.isArray(studentAns) && Array.isArray(correctAns) &&
                      studentAns.length === correctAns.length &&
                      correctAns.every((v: any) => studentAns.includes(v))
                    : studentAns === correctAns;

                  return (
                    <div
                      key={q.id || qIdx}
                      className={`p-5 rounded-2xl border space-y-3.5 ${
                        isCorrect
                          ? 'bg-slate-50 dark:bg-slate-950/70 border-emerald-500/30'
                          : 'bg-slate-50 dark:bg-slate-950/70 border-rose-500/30'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-6 h-6 rounded-md font-mono text-xs font-bold flex items-center justify-center ${
                            isCorrect ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'
                          }`}>
                            {qIdx + 1}
                          </span>
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            {q.type.toUpperCase()} • {q.points} Marks
                          </span>
                        </div>

                        <span className={`text-xs font-bold flex items-center gap-1 ${
                          isCorrect ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                        }`}>
                          {isCorrect ? (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              Correct (+{q.points})
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4" />
                              Incorrect (0/{q.points})
                            </>
                          )}
                        </span>
                      </div>

                      <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        <MathRenderer content={q.text} />
                      </div>

                      {q.imageUrl && (
                        <img
                          src={q.imageUrl}
                          alt="Diagram"
                          className="w-full h-40 object-cover rounded-xl border border-slate-200 dark:border-slate-800"
                        />
                      )}

                      {/* Options */}
                      <div className="space-y-2 pt-1">
                        {q.options?.map((opt: any) => {
                          const isKey = q.type === 'multi'
                            ? Array.isArray(correctAns) && correctAns.includes(opt.id)
                            : correctAns === opt.id;
                          
                          const isStudentChoice = q.type === 'multi'
                            ? Array.isArray(studentAns) && studentAns.includes(opt.id)
                            : studentAns === opt.id;

                          return (
                            <div
                              key={opt.id}
                              className={`p-3 rounded-xl text-xs font-medium border flex items-center justify-between gap-2 ${
                                isKey
                                  ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-900 dark:text-emerald-200 font-semibold'
                                  : isStudentChoice
                                  ? 'bg-rose-500/15 border-rose-500/50 text-rose-900 dark:text-rose-300'
                                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400'
                              }`}
                            >
                              <div className="flex-1 min-w-0">
                                <MathRenderer content={opt.text} inline />
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {isStudentChoice && (
                                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-300">
                                    Your Answer
                                  </span>
                                )}
                                {isKey && (
                                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500 text-slate-950 font-bold">
                                    Correct Key
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Teacher Explanation */}
                      {q.explanation && (
                        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2.5 shadow-sm">
                          <HelpCircle className="w-4 h-4 text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <span className="font-bold text-amber-700 dark:text-amber-300 block mb-1">Teacher Rationale: </span>
                            <MathRenderer content={q.explanation} />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Close Review
          </button>
        </div>

      </div>
    </div>
  );
};
