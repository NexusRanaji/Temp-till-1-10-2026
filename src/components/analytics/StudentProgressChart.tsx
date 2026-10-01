import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Award, 
  BookOpen, 
  Calendar, 
  Filter, 
  CheckCircle2, 
  AlertTriangle,
  Sparkles,
  BarChart3,
  Users
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export interface ProgressSubmissionItem {
  id: string;
  examId?: string;
  examTitle: string;
  subjectName: string;
  studentId?: string;
  studentName?: string;
  studentRollNo?: string;
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  submittedAt: string;
  cheatingFlagged?: boolean;
}

interface StudentProgressChartProps {
  submissions: ProgressSubmissionItem[];
  title?: string;
  subtitle?: string;
  studentName?: string;
  showStudentSelector?: boolean;
  studentsList?: Array<{ id: string; name: string; rollNo?: string }>;
  selectedStudentId?: string;
  onSelectStudentId?: (id: string) => void;
  className?: string;
}

export const StudentProgressChart: React.FC<StudentProgressChartProps> = ({
  submissions = [],
  title = 'Academic Performance & Score Trend',
  subtitle = 'Chronological test score trajectory and competency progression over time',
  studentName,
  showStudentSelector = false,
  studentsList = [],
  selectedStudentId,
  onSelectStudentId,
  className = '',
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedTimeframe, setSelectedTimeframe] = useState<'all' | '5' | '10'>('all');
  const [metricMode, setMetricMode] = useState<'percentage' | 'score'>('percentage');

  // Available subjects from the dataset
  const availableSubjects = useMemo(() => {
    const set = new Set<string>();
    submissions.forEach((s) => {
      if (s.subjectName) set.add(s.subjectName);
    });
    return Array.from(set).sort();
  }, [submissions]);

  // Filter and sort data chronologically
  const chartData = useMemo(() => {
    let filtered = [...submissions];

    // Filter by student if single student mode
    if (selectedStudentId && selectedStudentId !== 'all') {
      filtered = filtered.filter((s) => s.studentId === selectedStudentId);
    }

    // Filter by subject
    if (selectedSubject !== 'all') {
      filtered = filtered.filter((s) => s.subjectName === selectedSubject);
    }

    // Sort chronologically ascending
    filtered.sort((a, b) => {
      const timeA = new Date(a.submittedAt || 0).getTime();
      const timeB = new Date(b.submittedAt || 0).getTime();
      return timeA - timeB;
    });

    // Timeframe slice
    if (selectedTimeframe === '5') {
      filtered = filtered.slice(-5);
    } else if (selectedTimeframe === '10') {
      filtered = filtered.slice(-10);
    }

    return filtered.map((sub, index) => {
      const dateObj = new Date(sub.submittedAt || Date.now());
      const isValidDate = !isNaN(dateObj.getTime());
      
      const formattedDate = isValidDate
        ? dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : `Test ${index + 1}`;

      const fullDate = isValidDate
        ? dateObj.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : 'Completed Date Unknown';

      return {
        id: sub.id,
        testIndex: index + 1,
        dateLabel: formattedDate,
        fullDate,
        examTitle: sub.examTitle || `Assessment #${index + 1}`,
        subjectName: sub.subjectName || 'General',
        percentage: Math.round(sub.percentage ?? ((sub.score / (sub.totalMarks || 1)) * 100)),
        score: sub.score,
        totalMarks: sub.totalMarks,
        passed: sub.passed,
        cheatingFlagged: Boolean(sub.cheatingFlagged),
        studentName: sub.studentName,
        studentRollNo: sub.studentRollNo,
      };
    });
  }, [submissions, selectedStudentId, selectedSubject, selectedTimeframe]);

  // Derived metrics
  const stats = useMemo(() => {
    if (chartData.length === 0) {
      return {
        avgPercentage: 0,
        highestScore: 0,
        lowestScore: 0,
        passRate: 0,
        totalCount: 0,
        trendDelta: 0,
      };
    }

    const totalCount = chartData.length;
    const sum = chartData.reduce((acc, curr) => acc + curr.percentage, 0);
    const avgPercentage = Math.round(sum / totalCount);

    const highestScore = Math.max(...chartData.map((d) => d.percentage));
    const lowestScore = Math.min(...chartData.map((d) => d.percentage));
    const passCount = chartData.filter((d) => d.passed).length;
    const passRate = Math.round((passCount / totalCount) * 100);

    // Calculate momentum: last 2-3 tests vs earlier tests
    let trendDelta = 0;
    if (totalCount >= 2) {
      const recentWindow = Math.min(3, Math.floor(totalCount / 2) || 1);
      const recentAvg =
        chartData.slice(-recentWindow).reduce((a, b) => a + b.percentage, 0) / recentWindow;
      const earlierAvg =
        chartData.slice(0, totalCount - recentWindow).reduce((a, b) => a + b.percentage, 0) /
        (totalCount - recentWindow);
      trendDelta = Math.round(recentAvg - earlierAvg);
    }

    return {
      avgPercentage,
      highestScore,
      lowestScore,
      passRate,
      totalCount,
      trendDelta,
    };
  }, [chartData]);

  // Color values for recharts matching current theme
  const gridColor = isDark ? '#334155' : '#e2e8f0';
  const axisColor = isDark ? '#94a3b8' : '#64748b';
  const primaryStroke = '#f59e0b'; // Amber brand
  const primaryGradientStart = '#f59e0b';
  const primaryGradientEnd = isDark ? 'rgba(245, 158, 11, 0.02)' : 'rgba(245, 158, 11, 0.08)';

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-xl text-xs max-w-xs space-y-2 pointer-events-none z-50">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
            <span className="font-bold uppercase tracking-wider text-[10px] text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
              {data.subjectName}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              {data.fullDate}
            </span>
          </div>

          <div>
            <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm leading-snug">
              {data.examTitle}
            </p>
            {data.studentName && (
              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                Candidate: <span className="font-semibold text-slate-800 dark:text-slate-200">{data.studentName}</span>
                {data.studentRollNo && <span className="font-mono text-slate-500 ml-1">({data.studentRollNo})</span>}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-500 dark:text-slate-400">Score Percentage</span>
              <p className="text-base font-bold font-mono text-amber-600 dark:text-amber-400">
                {data.percentage}%
              </p>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-500 dark:text-slate-400">Marks Scored</span>
              <p className="text-base font-bold font-mono text-slate-800 dark:text-slate-200">
                {data.score} / {data.totalMarks}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] pt-1">
            <span
              className={`font-bold px-2 py-0.5 rounded-full ${
                data.passed
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30'
              }`}
            >
              {data.passed ? '✓ Passed' : '✗ Needs Improvement'}
            </span>

            {data.cheatingFlagged ? (
              <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Flagged
              </span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Verified Secure
              </span>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      id="student-progress-chart-container"
      className={`bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-sm dark:shadow-2xl transition-all space-y-6 ${className}`}
    >
      {/* Chart Top Header & Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20 flex items-center gap-1">
              <BarChart3 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              Progress Observatory
            </span>
            {studentName && (
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-md">
                {studentName}
              </span>
            )}
          </div>
          <h2 className="text-lg sm:text-xl font-serif font-bold text-slate-900 dark:text-slate-100">
            {title}
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            {subtitle}
          </p>
        </div>

        {/* Action Toolbar Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Optional Student Filter (for Teacher Dashboard) */}
          {showStudentSelector && studentsList.length > 0 && onSelectStudentId && (
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1 text-xs">
              <Users className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400 shrink-0" />
              <select
                id="chart-student-selector"
                value={selectedStudentId || 'all'}
                onChange={(e) => onSelectStudentId(e.target.value)}
                className="bg-transparent text-slate-800 dark:text-slate-200 font-medium outline-none cursor-pointer text-xs"
                aria-label="Select student for trend analysis"
              >
                <option value="all" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                  All Students (Class Cohort)
                </option>
                {studentsList.map((stu) => (
                  <option
                    key={stu.id}
                    value={stu.id}
                    className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  >
                    {stu.name} {stu.rollNo ? `(${stu.rollNo})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Subject Filter */}
          {availableSubjects.length > 0 && (
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1 text-xs">
              <BookOpen className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400 shrink-0" />
              <select
                id="chart-subject-selector"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="bg-transparent text-slate-800 dark:text-slate-200 font-medium outline-none cursor-pointer text-xs"
                aria-label="Filter by subject"
              >
                <option value="all" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                  All Subjects ({availableSubjects.length})
                </option>
                {availableSubjects.map((subj) => (
                  <option
                    key={subj}
                    value={subj}
                    className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  >
                    {subj}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Timeframe Scope Selector */}
          <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700 text-xs">
            <button
              onClick={() => setSelectedTimeframe('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                selectedTimeframe === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              All Tests
            </button>
            <button
              onClick={() => setSelectedTimeframe('5')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                selectedTimeframe === '5'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Last 5
            </button>
            <button
              onClick={() => setSelectedTimeframe('10')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                selectedTimeframe === '10'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Last 10
            </button>
          </div>

          {/* Metric View Mode Toggle */}
          <button
            onClick={() => setMetricMode(metricMode === 'percentage' ? 'score' : 'percentage')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:border-amber-500 transition-colors text-xs font-semibold cursor-pointer"
            title="Toggle between score percentage and raw marks"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{metricMode === 'percentage' ? 'Metric: %' : 'Metric: Raw Marks'}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            Average Score
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
              {stats.avgPercentage}%
            </span>
            {stats.trendDelta !== 0 && (
              <span
                className={`text-xs font-bold flex items-center ${
                  stats.trendDelta > 0
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {stats.trendDelta > 0 ? (
                  <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
                )}
                {stats.trendDelta > 0 ? `+${stats.trendDelta}%` : `${stats.trendDelta}%`}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
            {stats.avgPercentage >= 75
              ? 'Distinction Grade Standing'
              : stats.avgPercentage >= 60
              ? 'First Class Standard'
              : 'Pass Grade Standard'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            Peak Performance
          </span>
          <div className="text-2xl font-bold font-mono text-amber-700 dark:text-amber-400 mt-1 flex items-center gap-1">
            <Award className="w-5 h-5 text-amber-500" />
            {stats.highestScore}%
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
            Lowest: <span className="font-mono font-semibold">{stats.lowestScore}%</span>
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            Assessment Count
          </span>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100 mt-1">
            {stats.totalCount}
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
            Logged in system records
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            Pass Consistency
          </span>
          <div className="text-2xl font-bold font-mono text-indigo-700 dark:text-indigo-400 mt-1">
            {stats.passRate}%
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
            Exams meeting &gt; 40% criteria
          </p>
        </div>
      </div>

      {/* Main Recharts Area */}
      {chartData.length === 0 ? (
        <div className="py-14 text-center border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl p-6 bg-slate-50/50 dark:bg-slate-950/40">
          <Calendar className="w-10 h-10 mx-auto text-slate-400 mb-2.5 opacity-70" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            No Exam Submissions Found
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-md mx-auto">
            {selectedSubject !== 'all'
              ? `No tests have been completed yet under "${selectedSubject}". Try selecting another subject or "All Subjects".`
              : 'As new assessments are completed, chronological test score trajectories will automatically render here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="h-72 sm:h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 15, right: 20, left: -10, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="scoreTrendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={primaryGradientStart} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={primaryGradientEnd} stopOpacity={0.0} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={gridColor}
                  vertical={false}
                />

                <XAxis
                  dataKey="dateLabel"
                  stroke={axisColor}
                  tick={{ fontSize: 11, fill: axisColor }}
                  tickLine={{ stroke: gridColor }}
                  axisLine={{ stroke: gridColor }}
                />

                <YAxis
                  stroke={axisColor}
                  tick={{ fontSize: 11, fill: axisColor }}
                  tickLine={{ stroke: gridColor }}
                  axisLine={{ stroke: gridColor }}
                  domain={[0, 100]}
                  unit="%"
                />

                <Tooltip content={<CustomTooltip />} />

                {/* Benchmark Reference Lines */}
                <ReferenceLine
                  y={75}
                  stroke="#10b981"
                  strokeDasharray="4 4"
                  label={{
                    value: 'Distinction (75%)',
                    position: 'insideTopRight',
                    fill: '#10b981',
                    fontSize: 10,
                    fontWeight: 600,
                  }}
                />

                <ReferenceLine
                  y={40}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  label={{
                    value: 'Passing Benchmark (40%)',
                    position: 'insideBottomRight',
                    fill: '#ef4444',
                    fontSize: 10,
                    fontWeight: 600,
                  }}
                />

                <Area
                  type="monotone"
                  dataKey={metricMode === 'percentage' ? 'percentage' : 'score'}
                  stroke={primaryStroke}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#scoreTrendGradient)"
                  activeDot={{
                    r: 6,
                    stroke: primaryStroke,
                    strokeWidth: 2,
                    fill: isDark ? '#0f172a' : '#ffffff',
                  }}
                  dot={{
                    r: 4,
                    stroke: primaryStroke,
                    strokeWidth: 1.5,
                    fill: isDark ? '#1e293b' : '#ffffff',
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Chart Legend and Micro-notes */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-amber-500 rounded" />
                <span>Score Curve</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-emerald-500 border-b border-dashed border-emerald-500" />
                <span>Distinction (≥75%)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-rose-500 border-b border-dashed border-rose-500" />
                <span>Minimum Pass (40%)</span>
              </span>
            </div>

            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Hover over test data points for granular questions and integrity audit logs
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
