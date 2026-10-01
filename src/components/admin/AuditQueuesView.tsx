import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  LogIn, 
  Trash2, 
  RefreshCw, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Globe, 
  AlertTriangle,
  User,
  Shield,
  FileText,
  Cpu,
  Download,
  Sparkles
} from 'lucide-react';
import { LoginAuditLog, CheatingAuditLog, DeletedCredentialLog } from '../../types';

export const AuditQueuesView: React.FC = () => {
  const [activeQueue, setActiveQueue] = useState<'logins' | 'cheating' | 'deletions' | 'keys'>('logins');
  const [logins, setLogins] = useState<LoginAuditLog[]>([]);
  const [cheatingLogs, setCheatingLogs] = useState<CheatingAuditLog[]>([]);
  const [deletions, setDeletions] = useState<DeletedCredentialLog[]>([]);
  const [keyHealth, setKeyHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchQueues = async () => {
    try {
      setLoading(true);
      const [loginsRes, cheatingRes, deletionsRes, keyRes] = await Promise.all([
        fetch('/api/admin/audits/logins'),
        fetch('/api/admin/audits/cheating'),
        fetch('/api/admin/audits/deleted-credentials'),
        fetch('/api/admin/audits/key-health'),
      ]);

      if (loginsRes.ok) {
        const d = await loginsRes.json();
        setLogins(d.logins || d.audits || []);
      }
      if (cheatingRes.ok) {
        const d = await cheatingRes.json();
        setCheatingLogs(d.cheatingAudits || d.audits || []);
      }
      if (deletionsRes.ok) {
        const d = await deletionsRes.json();
        setDeletions(d.deletedAudits || d.audits || d.deletions || []);
      }
      if (keyRes.ok) {
        const d = await keyRes.json();
        setKeyHealth(d);
      }
    } catch (err) {
      console.error('Failed to load rolling audit queues:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueues();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchQueues();
    }, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  // Filtered lists
  const filteredLogins = logins.filter((l) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      l.userName.toLowerCase().includes(term) ||
      (l.email?.toLowerCase().includes(term) ?? false) ||
      l.role.toLowerCase().includes(term) ||
      l.ipAddress.toLowerCase().includes(term) ||
      l.status.toLowerCase().includes(term)
    );
  });

  const filteredCheating = cheatingLogs.filter((c) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      c.studentName.toLowerCase().includes(term) ||
      c.studentRollNo.toLowerCase().includes(term) ||
      c.examTitle.toLowerCase().includes(term) ||
      c.actionTaken.toLowerCase().includes(term) ||
      c.details.toLowerCase().includes(term)
    );
  });

  const filteredDeletions = deletions.filter((d) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      d.deletedUserName.toLowerCase().includes(term) ||
      (d.deletedUserEmail?.toLowerCase().includes(term) ?? false) ||
      (d.deletedRole?.toLowerCase().includes(term) ?? false) ||
      (d.deletedByAdminName?.toLowerCase().includes(term) ?? false)
    );
  });

  return (
    <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xl transition-colors">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-serif font-bold text-slate-900 dark:text-slate-100">
              Rolling Security & Forensic Audit Queues
            </h2>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              Real-time Ingestion
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Cryptographic forensic logs for institutional compliance, anti-cheating enforcement, and credential life-cycle tracking.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search audit records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500"
            />
          </div>

          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              autoRefresh 
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-400' 
                : 'border-slate-300 dark:border-slate-700 text-slate-500 hover:text-slate-700'
            }`}
            title="Toggle Live 15s Polling"
          >
            <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            <span>{autoRefresh ? 'Live Feed Active' : 'Polling Paused'}</span>
          </button>

          <button
            onClick={fetchQueues}
            disabled={loading}
            className="p-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors disabled:opacity-50"
            title="Refresh Audit Queues"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Queue Tabs */}
      <div className="p-4 bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveQueue('logins')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeQueue === 'logins'
              ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/30 font-bold'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-amber-500/40'
          }`}
        >
          <LogIn className="w-4 h-4" />
          <span>Last 500 Logins</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/10 font-mono">
            {logins.length}
          </span>
        </button>

        <button
          onClick={() => setActiveQueue('cheating')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeQueue === 'cheating'
              ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/30 font-bold'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-rose-500/40'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-rose-500 dark:text-rose-400" />
          <span>Last 500 Window Blur Logs</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/10 font-mono">
            {cheatingLogs.length}
          </span>
        </button>

        <button
          onClick={() => setActiveQueue('deletions')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeQueue === 'deletions'
              ? 'bg-slate-800 text-white dark:bg-slate-700 shadow-sm font-bold'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-slate-400'
          }`}
        >
          <Trash2 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <span>Last 50 Deleted Credentials</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/10 font-mono">
            {deletions.length}
          </span>
        </button>

        <button
          onClick={() => setActiveQueue('keys')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeQueue === 'keys'
              ? 'bg-indigo-600 text-white shadow-sm font-bold'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-indigo-400'
          }`}
        >
          <Cpu className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
          <span>AI Pool & Failover Health</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/10 font-mono">
            {keyHealth?.poolStatus?.totalKeysInPool || 1}
          </span>
        </button>
      </div>

      {/* Queue 1: Last 500 Logins */}
      {activeQueue === 'logins' && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">User Identity</th>
                <th className="px-6 py-3.5">Role</th>
                <th className="px-6 py-3.5">IP Address & Source</th>
                <th className="px-6 py-3.5">Client Device</th>
                <th className="px-6 py-3.5 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
              {filteredLogins.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No login events logged yet.
                  </td>
                </tr>
              ) : (
                filteredLogins.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4">
                      {item.status?.toLowerCase() === 'success' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 uppercase">
                          <CheckCircle2 className="w-3 h-3" />
                          Success
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/30 uppercase">
                          <XCircle className="w-3 h-3" />
                          Failed
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{item.userName}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{item.email}</div>
                    </td>
                    <td className="px-6 py-4 capitalize font-medium text-slate-700 dark:text-slate-300">
                      {item.role}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-1">
                        <Globe className="w-3 h-3 text-slate-400" />
                        <span>{item.ipAddress}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400 max-w-xs truncate">
                      {item.userAgent || 'Chrome/128 MacOS'}
                    </td>
                    <td className="px-6 py-4 text-right text-xs text-slate-500 dark:text-slate-400 font-mono">
                      {formatDate(item.timestamp)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Queue 2: Last 500 Anti-Cheating Window Blur Logs */}
      {activeQueue === 'cheating' && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-3.5">Student Candidate</th>
                <th className="px-6 py-3.5">Roll Number</th>
                <th className="px-6 py-3.5">Examination Session</th>
                <th className="px-6 py-3.5">Violations</th>
                <th className="px-6 py-3.5">Action Enforced</th>
                <th className="px-6 py-3.5">Details</th>
                <th className="px-6 py-3.5 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
              {filteredCheating.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700 dark:text-slate-300">Zero Integrity Violations Logged</p>
                    <p className="text-xs text-slate-400 mt-0.5">Exam sessions running cleanly.</p>
                  </td>
                </tr>
              ) : (
                filteredCheating.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100">
                      {item.studentName}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-700 dark:text-slate-300">
                      {item.studentRollNo}
                    </td>
                    <td className="px-6 py-4 text-slate-800 dark:text-slate-200 font-medium">
                      {item.examTitle}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md font-mono font-bold text-[11px] ${
                        item.violationCount >= 3 
                          ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                      }`}>
                        {item.violationCount} Strike{item.violationCount > 1 ? 's' : ''}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        item.actionTaken.includes('Flagged')
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                      }`}>
                        <AlertTriangle className="w-3 h-3" />
                        {item.actionTaken}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-400 max-w-xs">
                      {item.details}
                    </td>
                    <td className="px-6 py-4 text-right text-xs text-slate-500 dark:text-slate-400 font-mono">
                      {formatDate(item.timestamp)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Queue 3: Last 50 Deleted Credentials */}
      {activeQueue === 'deletions' && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-3.5">Deleted User</th>
                <th className="px-6 py-3.5">Former Role</th>
                <th className="px-6 py-3.5">Identifier / Email</th>
                <th className="px-6 py-3.5">Authorized Purge By</th>
                <th className="px-6 py-3.5">Audit Reason</th>
                <th className="px-6 py-3.5 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
              {filteredDeletions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No credential deletions recorded yet.
                  </td>
                </tr>
              ) : (
                filteredDeletions.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100">
                      {item.deletedUserName}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {item.deletedRole}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-600 dark:text-slate-400">
                      {item.deletedUserEmail}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-amber-500" />
                      <span>{item.deletedByAdminName}</span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-400">
                      {item.reason}
                    </td>
                    <td className="px-6 py-4 text-right text-xs text-slate-500 dark:text-slate-400 font-mono">
                      {formatDate(item.timestamp)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Queue 4: Gemini AI Key Pool & Failover Health */}
      {activeQueue === 'keys' && (
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="text-xs text-slate-500 mb-1">Total API Keys in Pool</div>
              <div className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-indigo-500" />
                <span>{keyHealth?.poolStatus?.totalKeysInPool || 1}</span>
              </div>
              <div className="text-[11px] text-emerald-600 mt-1">Multi-Key Failover Active</div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="text-xs text-slate-500 mb-1">Active Index</div>
              <div className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span>Key #{((keyHealth?.poolStatus?.currentActiveIndex || 0) + 1)}</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Cooling Down: {keyHealth?.poolStatus?.coolingDownKeys || 0} keys
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="text-xs text-slate-500 mb-1">Quota / Failover Events</div>
              <div className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
                <span>{keyHealth?.healthLogs?.length || 0}</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Automated Failover Circuit Active</div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 font-semibold text-xs text-slate-700 dark:text-slate-300">
              Recent Gemini API Key Failover & Health Logs
            </div>
            {(!keyHealth?.healthLogs || keyHealth.healthLogs.length === 0) ? (
              <div className="p-8 text-center text-xs text-slate-400">
                All Gemini API keys in the pool are running in optimal operational health. No rate limits or failover triggers encountered.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {keyHealth.healthLogs.map((log: any, idx: number) => (
                  <div key={idx} className="p-4 flex items-start gap-3">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div className="text-xs space-y-1">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {log.keyIdentifier} - {log.errorType} ({log.status})
                      </div>
                      <div className="text-slate-500 dark:text-slate-400">{log.message}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {formatDate(log.timestamp)} • Cooling down until {formatDate(log.coolDownUntil)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
