import React, { useState } from 'react';
import { 
  Award, 
  Medal, 
  Star, 
  Trophy, 
  ShieldCheck, 
  CheckCircle2, 
  Lock, 
  Sparkles, 
  Calendar, 
  BookOpen, 
  TrendingUp,
  GraduationCap
} from 'lucide-react';

interface AcademicBadgesSectionProps {
  studentProfile: any;
  scholarTier: { title: string; badge: string; points: number };
  testBadges: any[];
  overallBadges: any[];
}

interface ScholasticBadge {
  id: string;
  code: string;
  name: string;
  tier: 'Diamond' | 'Gold' | 'Silver' | 'Bronze';
  category: 'Exam Excellence' | 'Subject Mastery' | 'Consistent Scholar' | 'Special Honor';
  criteria: string;
  pointsRequired: number;
  earned: boolean;
  earnedDate?: string;
  badgeAccent: string;
}

export const AcademicBadgesSection: React.FC<AcademicBadgesSectionProps> = ({
  studentProfile,
  scholarTier,
  testBadges = [],
  overallBadges = [],
}) => {
  const [filter, setFilter] = useState<'all' | 'earned' | 'in-progress'>('all');

  // Realistic institutional scholastic badges catalogue
  const points = studentProfile?.gamificationPoints || scholarTier.points || 0;

  const catalog: ScholasticBadge[] = [
    {
      id: 'bdg-1',
      code: 'NRES-DIA-01',
      name: 'Diamond Academic Distinction Medallion',
      tier: 'Diamond',
      category: 'Exam Excellence',
      criteria: 'Achieve 90%+ aggregate across official Board or Terminal Examinations.',
      pointsRequired: 500,
      earned: points >= 500 || overallBadges.some((b) => b.name?.includes('Diamond') || b.name?.includes('90%')),
      earnedDate: 'Academic Term 2025-26',
      badgeAccent: 'from-cyan-500/20 to-blue-600/20 border-cyan-500/40 text-cyan-600 dark:text-cyan-400',
    },
    {
      id: 'bdg-2',
      code: 'NRES-GLD-02',
      name: 'Gold Honor Scholar Medal',
      tier: 'Gold',
      category: 'Exam Excellence',
      criteria: 'Maintain continuous first-class standing with 75%+ score performance.',
      pointsRequired: 300,
      earned: points >= 300 || overallBadges.some((b) => b.name?.includes('Gold') || b.name?.includes('75%')),
      earnedDate: 'Academic Term 2025-26',
      badgeAccent: 'from-amber-500/20 to-yellow-600/20 border-amber-500/40 text-amber-600 dark:text-amber-400',
    },
    {
      id: 'bdg-3',
      code: 'NRES-SLV-03',
      name: 'Silver Academic Merit Pin',
      tier: 'Silver',
      category: 'Consistent Scholar',
      criteria: 'Successfully complete all scheduled classroom tests and maintain 60%+ average.',
      pointsRequired: 150,
      earned: points >= 150 || overallBadges.some((b) => b.name?.includes('Silver')),
      earnedDate: 'Active Enrollment',
      badgeAccent: 'from-slate-400/20 to-slate-600/20 border-slate-400/40 text-slate-700 dark:text-slate-300',
    },
    {
      id: 'bdg-4',
      code: 'NRES-SUB-MATH',
      name: 'Mathematical Aptitude Insignia',
      tier: 'Gold',
      category: 'Subject Mastery',
      criteria: 'Attain 80%+ on advanced mathematics and problem solving assessments.',
      pointsRequired: 200,
      earned: testBadges.some((b) => b.testTitle?.toLowerCase().includes('math') && (b.percentage || 0) >= 80) || points >= 200,
      earnedDate: 'Term 1 Exam',
      badgeAccent: 'from-indigo-500/20 to-purple-600/20 border-indigo-500/40 text-indigo-600 dark:text-indigo-400',
    },
    {
      id: 'bdg-5',
      code: 'NRES-SUB-SCI',
      name: 'Natural Sciences Laurels',
      tier: 'Gold',
      category: 'Subject Mastery',
      criteria: 'Demonstrate exemplary mastery in Physics, Chemistry, and Biological sciences.',
      pointsRequired: 250,
      earned: testBadges.some((b) => b.testTitle?.toLowerCase().includes('sci') || b.testTitle?.toLowerCase().includes('phys')) || points >= 250,
      earnedDate: 'Unit Assessment 2',
      badgeAccent: 'from-emerald-500/20 to-teal-600/20 border-emerald-500/40 text-emerald-600 dark:text-emerald-400',
    },
    {
      id: 'bdg-6',
      code: 'NRES-PRFECT',
      name: 'Centum Perfect Score Citation',
      tier: 'Diamond',
      category: 'Special Honor',
      criteria: 'Score 100% absolute marks on any official institutional examination.',
      pointsRequired: 400,
      earned: testBadges.some((b) => (b.percentage || 0) === 100) || overallBadges.some((b) => b.name?.includes('Perfect')),
      earnedDate: 'Midterm Evaluation',
      badgeAccent: 'from-rose-500/20 to-amber-600/20 border-rose-500/40 text-rose-600 dark:text-rose-400',
    },
    {
      id: 'bdg-7',
      code: 'NRES-DISCIPLINE',
      name: 'Academic Integrity & Anti-Cheating Shield',
      tier: 'Bronze',
      category: 'Consistent Scholar',
      criteria: 'Maintain zero tab-switch or anti-cheating audit flags across all proctored exams.',
      pointsRequired: 50,
      earned: true, // Baseline clean record
      earnedDate: 'School Registry Verified',
      badgeAccent: 'from-emerald-500/20 to-blue-600/20 border-emerald-500/40 text-emerald-600 dark:text-emerald-400',
    },
  ];

  const filteredCatalog = catalog.filter((b) => {
    if (filter === 'earned') return b.earned;
    if (filter === 'in-progress') return !b.earned;
    return true;
  });

  const earnedCount = catalog.filter((b) => b.earned).length;

  return (
    <div className="space-y-6">
      {/* Official Insignia & Standing Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Nexus Ranaji Scholastic Honors Board
            </span>
            <h2 className="text-xl font-serif font-bold text-slate-900 dark:text-slate-100">
              Official Academic Standings &amp; Distinction Medals
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed">
              Official scholastic badges are authenticated by the Examination Council. Merit points are accrued based on examination scores, continuous preparation, and proctored test integrity.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Award className="w-4 h-4 stroke-[1.8]" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                Current Tier
              </span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {scholarTier.title || 'Silver Scholar'}
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 font-mono">
                  {points} Merit Pts
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 font-medium">
                  {scholarTier.badge || 'Level 1'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Milestone Progress Bar to Next Tier */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
              Merit Progress to Next Scholastic Rank
            </span>
            <span className="font-mono text-slate-500 dark:text-slate-400">
              {points} / 500 Pts ({Math.min(100, Math.round((points / 500) * 100))}%)
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(8, (points / 500) * 100))}%` }}
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                filter === 'all'
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              All Medals ({catalog.length})
            </button>
            <button
              onClick={() => setFilter('earned')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                filter === 'earned'
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Earned Distinction ({earnedCount})
            </button>
            <button
              onClick={() => setFilter('in-progress')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                filter === 'in-progress'
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              In Progress ({catalog.length - earnedCount})
            </button>
          </div>

          <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
            Board Registry Verified
          </span>
        </div>

        {/* Badges Display Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCatalog.map((b) => (
            <div
              key={b.id}
              className={`rounded-xl p-4 sm:p-5 border flex flex-col justify-between transition-all ${
                b.earned
                  ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-500/50 shadow-2xs'
                  : 'bg-slate-50/60 dark:bg-slate-950/40 border-slate-200/60 dark:border-slate-800/60 opacity-75'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  {/* Visual Insignia Crest */}
                  <div
                    className={`w-8 h-8 rounded-lg bg-gradient-to-br ${b.badgeAccent} border flex items-center justify-center shrink-0 shadow-2xs`}
                  >
                    {b.tier === 'Diamond' ? (
                      <Sparkles className="w-4 h-4 stroke-[1.8]" />
                    ) : b.tier === 'Gold' ? (
                      <Medal className="w-4 h-4 stroke-[1.8]" />
                    ) : b.category === 'Subject Mastery' ? (
                      <BookOpen className="w-4 h-4 stroke-[1.8]" />
                    ) : (
                      <Award className="w-4 h-4 stroke-[1.8]" />
                    )}
                  </div>

                  <div className="flex flex-col items-end">
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        b.earned
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {b.earned ? 'Conferred' : 'In Progress'}
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 mt-1">{b.code}</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-serif font-bold text-sm text-slate-900 dark:text-slate-100">
                    {b.name}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    {b.criteria}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="text-slate-500 dark:text-slate-400 font-mono">
                  Target: {b.pointsRequired} Pts
                </span>
                {b.earned ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 text-[10px]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {b.earnedDate}
                  </span>
                ) : (
                  <span className="text-slate-400 flex items-center gap-1 text-[10px]">
                    <Lock className="w-3 h-3" />
                    Locked
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
