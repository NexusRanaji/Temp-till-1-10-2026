import React, { useState } from 'react';
import { 
  Key, 
  ShieldCheck, 
  BookOpen, 
  GraduationCap, 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  Phone, 
  Mail, 
  User, 
  Lock, 
  Sparkles,
  Eye,
  EyeOff
} from 'lucide-react';
import { UserCredential, SchoolClass, Division } from '../../types';

interface CredentialGeneratorFormProps {
  classes: SchoolClass[];
  divisions: Division[];
  existingParents: UserCredential[];
  onCredentialCreated: (user: UserCredential) => void;
}

export const CredentialGeneratorForm: React.FC<CredentialGeneratorFormProps> = ({
  classes,
  divisions,
  existingParents,
  onCredentialCreated,
}) => {
  const [role, setRole] = useState<'superadmin' | 'teacher' | 'student' | 'parent'>('student');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Student-specific
  const [classId, setClassId] = useState(classes[0]?.id || '');
  const [divisionId, setDivisionId] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [parentId, setParentId] = useState('');

  // Staff-specific
  const [employeeId, setEmployeeId] = useState('');

  // Status & loading
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filter divisions for selected class
  const classDivisions = divisions.filter((d) => d.classId === classId);

  // Deduplicate existing parents list
  const uniqueParents = Array.from(new Map(existingParents.map((p) => [p.id, p])).values());

  const generateAutoCredentials = () => {
    if (!name.trim()) return;
    const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const randomNum = Math.floor(100 + Math.random() * 900);
    const generatedUsername = `${role.slice(0, 3)}_${cleanName.slice(0, 8)}_${randomNum}`;
    const generatedPassword = `Nres@${Math.floor(1000 + Math.random() * 9000)}`;

    setUsername(generatedUsername);
    setPassword(generatedPassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    // Compulsory field validation for all fields EXCEPT email
    if (!name.trim()) {
      setStatusMessage({ type: 'error', text: 'Full Name * is compulsory.' });
      return;
    }
    if (!phone.trim()) {
      setStatusMessage({ type: 'error', text: 'Mobile Contact Number * is compulsory.' });
      return;
    }
    if (!username.trim()) {
      setStatusMessage({ type: 'error', text: 'Username / ID * is compulsory. Please enter or generate one.' });
      return;
    }
    if (!password.trim()) {
      setStatusMessage({ type: 'error', text: 'Password * is compulsory.' });
      return;
    }
    if (role === 'student') {
      if (!classId) {
        setStatusMessage({ type: 'error', text: 'Class * is compulsory for students.' });
        return;
      }
      if (!divisionId && classDivisions.length > 0) {
        setStatusMessage({ type: 'error', text: 'Division * is compulsory for students.' });
        return;
      }
      if (!rollNo.trim()) {
        setStatusMessage({ type: 'error', text: 'Roll Number * is compulsory for students.' });
        return;
      }
    } else if (role === 'teacher' || role === 'superadmin') {
      if (!employeeId.trim()) {
        setStatusMessage({ type: 'error', text: 'Employee / Faculty ID * is compulsory.' });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const payload: any = {
        name,
        role,
        phone: phone.trim(),
        email: email.trim(), // Server handles empty email by auto-generating
        username: username.trim(),
        password: password.trim(),
      };

      if (role === 'student') {
        payload.classId = classId;
        payload.divisionId = divisionId || (classDivisions[0]?.id || '');
        payload.rollNo = rollNo || `NRES-${Math.floor(100 + Math.random() * 900)}`;
        payload.parentId = parentId;
      } else if (role === 'teacher' || role === 'superadmin') {
        payload.employeeId = employeeId || `NRES-${role === 'superadmin' ? 'ADM' : 'FAC'}-${Math.floor(100 + Math.random() * 900)}`;
      }

      const res = await fetch('/api/admin/create-credential', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create credential');
      }

      // Immediately update UI list
      onCredentialCreated(data.user);

      setStatusMessage({
        type: 'success',
        text: `Successfully provisioned ${data.user.role.toUpperCase()} account for ${data.user.name} (${data.user.email}). Credentials active immediately!`,
      });

      // Reset form
      setName('');
      setPhone('');
      setEmail('');
      setUsername('');
      setPassword('');
      setRollNo('');
      setEmployeeId('');
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Server error occurred while creating credential.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Form Left Side */}
      <div className="lg:col-span-8 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl transition-colors">
        <div className="mb-6">
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            RBAC Account Provisioning Engine
          </span>
          <h2 className="text-xl font-serif font-bold text-slate-900 dark:text-slate-100 mt-1">
            Programmatic Credential Generator
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Create verified accounts for Super Admins, Teachers, Students, and Parents. Changes propagate instantly to the master directory.
          </p>
        </div>

        {statusMessage && (
          <div className={`mb-6 p-4 rounded-xl text-xs font-medium flex items-start gap-2.5 border ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-800 dark:text-rose-300 border-rose-500/30'
          }`}>
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
            )}
            <div>
              <p className="font-bold">{statusMessage.type === 'success' ? 'Credential Provisioned' : 'Action Failed'}</p>
              <p className="mt-0.5">{statusMessage.text}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Role Selection Tabs */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Select Institutional Role <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: 'superadmin', label: 'Super Admin', icon: ShieldCheck, color: 'hover:border-rose-500', active: 'bg-rose-500 text-white font-bold' },
                { id: 'teacher', label: 'Teacher', icon: BookOpen, color: 'hover:border-emerald-500', active: 'bg-emerald-600 text-white font-bold' },
                { id: 'student', label: 'Student', icon: GraduationCap, color: 'hover:border-amber-500', active: 'bg-amber-500 text-slate-950 font-bold' },
                { id: 'parent', label: 'Parent', icon: Users, color: 'hover:border-blue-500', active: 'bg-blue-600 text-white font-bold' },
              ].map((r) => {
                const Icon = r.icon;
                const isSelected = role === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRole(r.id as any)}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs transition-all ${
                      isSelected
                        ? r.active
                        : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 ' + r.color
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{r.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Full Name & Mobile Number (Compulsory) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Sunita Patil / Aarav Verma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Mobile Number <span className="text-rose-500 font-bold">* Compulsory</span>
                </label>
                <span className="text-[10px] text-slate-400">Required for 2FA & alerts</span>
              </div>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="tel"
                  required
                  placeholder="+91 98XXX XXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Optional Gmail / Email */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Institutional Email / Gmail <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <span className="text-[10px] text-amber-600 dark:text-amber-400">
                Leave empty to auto-provision school email handle
              </span>
            </div>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                placeholder="e.g. user@nexusrana.edu (or leave blank to auto-create)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Username & Password Fields */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-500" />
                Login Credentials (Username & Password)
              </span>
              <button
                type="button"
                onClick={generateAutoCredentials}
                disabled={!name}
                className="text-[11px] text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-semibold flex items-center gap-1 disabled:opacity-40 cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                Auto-Generate
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Username / ID <span className="text-rose-500 font-bold">*</span>
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. std_aarav_402"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Initial Password <span className="text-rose-500 font-bold">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="e.g. Nres@2025"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg pl-8 pr-8 py-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Role-Specific Fields */}
          {role === 'student' && (
            <div className="p-4 bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-500/20 rounded-xl space-y-3">
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                Student Enrollment Details
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Class / Standard <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <select
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Division <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <select
                    value={divisionId}
                    onChange={(e) => setDivisionId(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none"
                  >
                    {classDivisions.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Roll Number <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. NRES-10A-14"
                    value={rollNo}
                    onChange={(e) => setRollNo(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Link to Parent / Guardian Account
                </label>
                <select
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none"
                >
                  <option value="">Select Existing Parent (or link later)</option>
                  {uniqueParents.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.phone || p.email})</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {(role === 'teacher' || role === 'superadmin') && (
            <div className="p-4 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {role === 'superadmin' ? 'Administrative Directorate ID' : 'Faculty Employee ID'} <span className="text-rose-500 font-bold">*</span>
              </label>
              <input
                type="text"
                required
                placeholder={role === 'superadmin' ? 'e.g. NRES-DIR-002' : 'e.g. NRES-FAC-205'}
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none font-mono"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Key className="w-4 h-4" />
            {isSubmitting ? 'Provisioning Account...' : 'Generate & Activate Credential'}
          </button>
        </form>
      </div>

      {/* Security & System Policy Box (Right Side) */}
      <div className="lg:col-span-4 space-y-4">
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-md transition-colors">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
            Strict Zero Self-Registration Policy
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Students and external users cannot self-register. All credentials must be provisioned by a verified Super Admin with cryptographic claims.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-md transition-colors">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
            Provisioning Rules
          </h4>
          <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-2 list-disc list-inside">
            <li><strong className="text-slate-800 dark:text-slate-200">Mobile Compulsory:</strong> Enables instant SMS exam alerts and multi-factor safety.</li>
            <li><strong className="text-slate-800 dark:text-slate-200">Gmail Optional:</strong> If omitted, generates domain handle <code className="text-[11px] font-mono text-amber-600 dark:text-amber-400">@nexusrana.edu</code>.</li>
            <li><strong className="text-slate-800 dark:text-slate-200">Instant Sync:</strong> Adds directly into active memory without page refresh.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
