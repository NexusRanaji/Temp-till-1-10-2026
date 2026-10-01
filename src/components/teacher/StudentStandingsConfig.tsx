import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Trophy, 
  Star, 
  Settings, 
  Sliders, 
  Sparkles, 
  CheckCircle2, 
  TrendingUp, 
  Users, 
  Save, 
  X,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { AcademicConfig, AcademicStandingTier, TestBadgeRule, OverallBadgeRule } from '../../types';
import { UserAvatar } from '../common/UserAvatar';

interface StudentStandingsConfigProps {
  onShowToast: (msg: string) => void;
}

export const StudentStandingsConfig: React.FC<StudentStandingsConfigProps> = ({ onShowToast }) => {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [config, setConfig] = useState<AcademicConfig | null>(null);
  const [loading, setLoading] = useState(true);

  // Config Rules Modal
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [editableConfig, setEditableConfig] = useState<AcademicConfig | null>(null);
  const [savingConfig, setSavingConfig] = useState(false);

  // Filter & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('all');

  const fetchStandings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/teacher/student-standings');
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data.leaderboard || []);
        setConfig(data.config || null);
        setEditableConfig(JSON.parse(JSON.stringify(data.config || null)));
      }
    } catch (err) {
      console.error('Failed to load standings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStandings();
  }, []);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editableConfig) return;

    try {
      setSavingConfig(true);
      const res = await fetch('/api/teacher/academic-rules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editableConfig),
      });

      if (res.ok) {
        const data = await res.json();
        setConfig(data.config);
        setShowConfigModal(false);
        onShowToast('Academic standing thresholds and badge criteria updated successfully.');
        fetchStandings(); // Recalculate leaderboard with new thresholds
      } else {
        const err = await res.json();
        onShowToast(err.error || 'Failed to update academic rules');
      }
    } catch (err) {
      console.error(err);
      onShowToast('Network error saving academic criteria.');
    } finally {
      setSavingConfig(false);
    }
  };

  const filteredLeaderboard = leaderboard.filter((item) => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.rollNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.className.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = selectedClassFilter === 'all' || item.classId === selectedClassFilter;
    return matchesSearch && matchesClass;
  });

  return (
    <div className="space-y-6">
      {/* Header & Configuration Control */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl transition-colors space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5" />
                Academic Honours &amp; Valedictorian Observatory
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 dark:text-slate-100 mt-1">
              Highest-Scoring Students &amp; Badges Configuration
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Track student academic standings, monitor earned badges, and configure institutional threshold criteria.
            </p>
          </div>

          <button
            onClick={() => {
              setEditableConfig(JSON.parse(JSON.stringify(config)));
              setShowConfigModal(true);
            }}
            className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 self-start sm:self-auto"
          >
            <Sliders className="w-4 h-4 text-amber-500" />
            Configure Threshold Rules
          </button>
        </div>

        {/* Current Active Threshold Rules Preview Banner */}
        {config && (
          <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="font-bold text-slate-700 dark:text-slate-300">
                Active Tier Thresholds:
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {config.standingTiers.map((tier) => (
                <span
                  key={tier.id}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <strong>{tier.badgeLabel}:</strong> ≥{tier.minAveragePercentage}%
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Filter & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <input
            type="text"
            placeholder="Search highest-scoring student by name, roll number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-80 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500"
          />

          <div className="text-xs text-slate-500 dark:text-slate-400">
            Ranked by <strong className="text-slate-900 dark:text-slate-100">Average Percentage</strong> &amp; Bonus Points
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-600 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3.5 text-center">Rank</th>
                <th className="px-5 py-3.5">Student Scholar</th>
                <th className="px-5 py-3.5">Class &amp; Div</th>
                <th className="px-5 py-3.5">Exams Taken</th>
                <th className="px-5 py-3.5">Average Score</th>
                <th className="px-5 py-3.5">Bonus Points</th>
                <th className="px-5 py-3.5">Academic Standing Tier</th>
                <th className="px-5 py-3.5">Badges Earned</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-slate-400">
                    Computing student standings and academic rule thresholds...
                  </td>
                </tr>
              ) : filteredLeaderboard.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-slate-400">
                    No students match the criteria.
                  </td>
                </tr>
              ) : (
                filteredLeaderboard.map((stud, idx) => {
                  const rank = idx + 1;
                  return (
                    <tr
                      key={stud.studentId}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-5 py-4 text-center">
                        {rank === 1 ? (
                          <span className="w-7 h-7 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-xs inline-flex items-center justify-center shadow-md">
                            1
                          </span>
                        ) : rank === 2 ? (
                          <span className="w-7 h-7 rounded-full bg-slate-300 dark:bg-slate-400 text-slate-950 font-black text-xs inline-flex items-center justify-center shadow-sm">
                            2
                          </span>
                        ) : rank === 3 ? (
                          <span className="w-7 h-7 rounded-full bg-amber-700 text-white font-black text-xs inline-flex items-center justify-center shadow-sm">
                            3
                          </span>
                        ) : (
                          <span className="font-mono font-bold text-slate-400">
                            #{rank}
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            name={stud.name}
                            role="student"
                            size="sm"
                          />
                          <div>
                            <div className="font-bold text-slate-900 dark:text-slate-100">
                              {stud.name}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                              {stud.rollNo}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="text-slate-700 dark:text-slate-300 font-medium">
                          {stud.className}
                        </span>
                        <div className="text-[11px] text-slate-400">{stud.divisionName}</div>
                      </td>

                      <td className="px-5 py-4 font-mono font-semibold text-slate-700 dark:text-slate-300">
                        {stud.totalExamsTaken} Tests
                      </td>

                      <td className="px-5 py-4 font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                        {stud.averagePercentage}%
                      </td>

                      <td className="px-5 py-4 font-mono font-bold text-amber-600 dark:text-amber-400">
                        {stud.bonusPoints} pts
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[11px] font-bold">
                          {stud.academicStanding?.tierName || 'Standard Pass'}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex flex-wrap items-center gap-1.5 max-w-xs">
                          {stud.earnedOverallBadges?.map((b: any) => (
                            <span
                              key={b.id}
                              title={b.description}
                              className="px-2 py-0.5 rounded bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30 text-[10px] font-semibold"
                            >
                              ⭐ {b.name}
                            </span>
                          ))}
                          {stud.earnedTestBadges?.slice(0, 2).map((tb: any, i: number) => (
                            <span
                              key={i}
                              title={`${tb.examTitle} (${tb.percentage}%)`}
                              className="px-2 py-0.5 rounded bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30 text-[10px] font-semibold"
                            >
                              🏅 {tb.name}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Threshold Rules Configuration Modal */}
      {showConfigModal && editableConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-100">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <Sliders className="w-5 h-5 text-amber-500" />
                <div>
                  <h3 className="text-lg font-serif font-bold text-slate-900 dark:text-slate-100">
                    Academic Standing &amp; Threshold Rules Editor
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Adjust score criteria; updates take effect across all student portals immediately.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-6">
              {/* Section 1: Academic Standing Tiers */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Academic Standing Tiers (By Minimum Average Score %)
                </h4>

                <div className="space-y-2.5">
                  {editableConfig.standingTiers.map((tier, idx) => (
                    <div
                      key={tier.id}
                      className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex-1">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {tier.tierName}
                        </span>
                        <span className="text-[11px] text-slate-400 block font-mono">
                          Badge Label: {tier.badgeLabel}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="text-[11px] text-slate-500">Min Avg %:</label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={tier.minAveragePercentage}
                          onChange={(e) => {
                            const updated = { ...editableConfig };
                            updated.standingTiers[idx].minAveragePercentage = Number(e.target.value);
                            setEditableConfig(updated);
                          }}
                          className="w-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-center font-mono font-bold text-xs text-slate-800 dark:text-slate-200"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 2: Test-wise Badges */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Test-wise Badges (Score on any single test)
                </h4>

                <div className="space-y-2.5">
                  {editableConfig.testBadges.map((rule, idx) => (
                    <div
                      key={rule.id}
                      className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex-1">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {rule.name}
                        </span>
                        <span className="text-[11px] text-slate-400 block">
                          {rule.description}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="text-[11px] text-slate-500">Min %:</label>
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={rule.minPercentage}
                          onChange={(e) => {
                            const updated = { ...editableConfig };
                            updated.testBadges[idx].minPercentage = Number(e.target.value);
                            setEditableConfig(updated);
                          }}
                          className="w-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-center font-mono font-bold text-xs text-slate-800 dark:text-slate-200"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 3: Overall Badges */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                  Overall Scholar Badges (Cumulative Points &amp; Ranks)
                </h4>

                <div className="space-y-2.5">
                  {editableConfig.overallBadges.map((rule, idx) => (
                    <div
                      key={rule.id}
                      className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex-1">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {rule.name}
                        </span>
                        <span className="text-[11px] text-slate-400 block">
                          {rule.description}
                        </span>
                      </div>

                      {rule.criteriaType !== 'topRank' && (
                        <div className="flex items-center gap-2">
                          <label className="text-[11px] text-slate-500">
                            {rule.criteriaType === 'bonusPoints' ? 'Min Points:' : 'Min %:'}
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={rule.thresholdValue}
                            onChange={(e) => {
                              const updated = { ...editableConfig };
                              updated.overallBadges[idx].thresholdValue = Number(e.target.value);
                              setEditableConfig(updated);
                            }}
                            className="w-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-center font-mono font-bold text-xs text-slate-800 dark:text-slate-200"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingConfig}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {savingConfig ? 'Saving...' : 'Save & Apply Thresholds'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};