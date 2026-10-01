import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Folder, 
  FolderOpen, 
  ShieldCheck, 
  BookOpen, 
  GraduationCap, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle,
  X,
  Phone,
  Mail,
  User,
  Eye,
  EyeOff,
  Copy,
  Check,
  KeyRound,
  Sparkles,
  Award
} from 'lucide-react';
import { UserCredential, SchoolClass, Division, UserRole } from '../../types';
import { ConfirmModal } from '../common/ConfirmModal';
import { UserAvatar } from '../common/UserAvatar';

interface CredentialsDirectoryProps {
  users: UserCredential[];
  classes: SchoolClass[];
  divisions: Division[];
  onUserDeleted: (userId: string) => void;
  onUserUpdated: (updatedUser: UserCredential) => void;
}

export const CredentialsDirectory: React.FC<CredentialsDirectoryProps> = ({
  users,
  classes,
  divisions,
  onUserDeleted,
  onUserUpdated,
}) => {
  const [selectedFolder, setSelectedFolder] = useState<'all' | 'superadmin' | 'teacher' | 'student' | 'parent'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAllPasswords, setShowAllPasswords] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Edit State - covering each and every detail
  const [editingUser, setEditingUser] = useState<UserCredential | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('student');
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editClassId, setEditClassId] = useState('');
  const [editDivisionId, setEditDivisionId] = useState('');
  const [editRollNo, setEditRollNo] = useState('');
  const [editParentId, setEditParentId] = useState('');
  const [editBonusPoints, setEditBonusPoints] = useState(0);
  const [editEmployeeId, setEditEmployeeId] = useState('');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  // Delete State
  const [userToDelete, setUserToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Deduplicate users prop
  const uniqueUsers = Array.from(new Map(users.map((u) => [u.id, u])).values());

  // Filter parents for student linked parent dropdown
  const parentAccounts = uniqueUsers.filter((u) => u.role === 'parent');

  // Folder Counts
  const counts = {
    all: uniqueUsers.length,
    superadmin: uniqueUsers.filter((u) => u.role === 'superadmin').length,
    teacher: uniqueUsers.filter((u) => u.role === 'teacher').length,
    student: uniqueUsers.filter((u) => u.role === 'student').length,
    parent: uniqueUsers.filter((u) => u.role === 'parent').length,
  };

  const filteredUsers = uniqueUsers.filter((u) => {
    const matchesFolder = selectedFolder === 'all' || u.role === selectedFolder;
    const term = searchTerm.toLowerCase().trim();
    if (!term) return matchesFolder;

    const matchesSearch = 
      u.name.toLowerCase().includes(term) ||
      (u.username && u.username.toLowerCase().includes(term)) ||
      (u.email && u.email.toLowerCase().includes(term)) ||
      (u.phone && u.phone.toLowerCase().includes(term)) ||
      (u.rollNo && u.rollNo.toLowerCase().includes(term)) ||
      (u.employeeId && u.employeeId.toLowerCase().includes(term)) ||
      u.role.toLowerCase().includes(term);

    return matchesFolder && matchesSearch;
  });

  const togglePasswordVisibility = (userId: string) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleOpenEdit = (user: UserCredential) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditRole(user.role);
    setEditUsername(user.username || '');
    setEditPassword(user.password || 'School@123');
    setShowEditPassword(false);
    setEditEmail(user.email || '');
    setEditPhone(user.phone || '');
    setEditClassId(user.classId || (classes[0]?.id || ''));
    setEditDivisionId(user.divisionId || (divisions[0]?.id || ''));
    setEditRollNo(user.rollNo || '');
    setEditParentId(user.parentId || '');
    setEditBonusPoints(user.bonusPoints || 0);
    setEditEmployeeId(user.employeeId || '');
    setEditError('');
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let res = '';
    for (let i = 0; i < 10; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setEditPassword(res);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsSubmittingEdit(true);
    setEditError('');

    try {
      const payload: any = {
        name: editName,
        role: editRole,
        username: editUsername,
        password: editPassword,
        email: editEmail,
        phone: editPhone,
      };

      if (editRole === 'student') {
        payload.classId = editClassId;
        payload.divisionId = editDivisionId;
        payload.rollNo = editRollNo;
        payload.parentId = editParentId || null;
        payload.bonusPoints = editBonusPoints;
      } else if (editRole === 'teacher' || editRole === 'superadmin') {
        payload.employeeId = editEmployeeId;
      }

      const res = await fetch(`/api/admin/credentials/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update credentials');
      }

      onUserUpdated(data.user);
      setEditingUser(null);
      setActionNotice(`Updated all credentials for ${data.user.name}`);
      setTimeout(() => setActionNotice(null), 4000);
    } catch (err: any) {
      setEditError(err.message || 'Server error occurred while updating user');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleExecuteDelete = async () => {
    if (!userToDelete) return;

    try {
      setIsDeleting(true);
      const res = await fetch(`/api/admin/credentials/${userToDelete.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete credential');
      }

      onUserDeleted(userToDelete.id);
      setActionNotice(`Successfully deleted credential for ${userToDelete.name}`);
      setUserToDelete(null);
      setTimeout(() => setActionNotice(null), 4000);
    } catch (err: any) {
      setEditError(err.message || 'Could not delete credential');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xl transition-colors">
      {/* Header with Search and Stats */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-serif font-bold text-slate-900 dark:text-slate-100">
              Master Credentials Directory
            </h2>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
              {users.length} Total Accounts
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Displaying complete login identities, plain credentials, assigned roles, and full edit controls.
          </p>
        </div>

        {/* Global Controls & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            type="button"
            onClick={() => setShowAllPasswords(!showAllPasswords)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-amber-500 transition-colors cursor-pointer whitespace-nowrap"
          >
            {showAllPasswords ? <EyeOff className="w-3.5 h-3.5 text-amber-500" /> : <Eye className="w-3.5 h-3.5 text-amber-500" />}
            <span>{showAllPasswords ? 'Hide All Passwords' : 'Show All Passwords'}</span>
          </button>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              id="credential-search-input"
              type="text"
              placeholder="Search name, username, roll no, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-amber-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Action Notification */}
      {actionNotice && (
        <div className="mx-6 mt-4 px-4 py-2.5 rounded-xl text-xs font-medium flex items-center gap-2 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Role Folders Toolbar */}
      <div className="p-4 bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setSelectedFolder('all')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
            selectedFolder === 'all'
              ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/30 font-bold'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-amber-500/40'
          }`}
        >
          {selectedFolder === 'all' ? <FolderOpen className="w-4 h-4" /> : <Folder className="w-4 h-4" />}
          <span>All Accounts</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/10 font-mono">
            {counts.all}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedFolder('superadmin')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
            selectedFolder === 'superadmin'
              ? 'bg-rose-600 text-white shadow-sm shadow-rose-500/30 font-bold'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-rose-500/40'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-rose-500 dark:text-rose-400" />
          <span>Super Admins</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/10 font-mono">
            {counts.superadmin}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedFolder('teacher')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
            selectedFolder === 'teacher'
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/30 font-bold'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40'
          }`}
        >
          <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Teachers & Faculty</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/10 font-mono">
            {counts.teacher}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedFolder('student')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
            selectedFolder === 'student'
              ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/30 font-bold'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-amber-500/40'
          }`}
        >
          <GraduationCap className="w-4 h-4 text-amber-500" />
          <span>Students</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/10 font-mono">
            {counts.student}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedFolder('parent')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
            selectedFolder === 'parent'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30 font-bold'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-blue-500/40'
          }`}
        >
          <Users className="w-4 h-4 text-blue-500 dark:text-blue-400" />
          <span>Parents</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/10 font-mono">
            {counts.parent}
          </span>
        </button>
      </div>

      {/* Directory Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 uppercase tracking-wider font-bold border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-5 py-3.5">User Identity</th>
              <th className="px-4 py-3.5">Role</th>
              <th className="px-4 py-3.5">Username</th>
              <th className="px-5 py-3.5">Password</th>
              <th className="px-4 py-3.5">Contact Phone</th>
              <th className="px-4 py-3.5">ID / Roll No</th>
              <th className="px-5 py-3.5">Assignment / Guardians</th>
              <th className="px-4 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                  <Folder className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    No credentials match the selected filter
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Try clearing the search term or choosing a different folder.
                  </p>
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => {
                const studentClass = classes.find((c) => c.id === u.classId);
                const studentDiv = divisions.find((d) => d.id === u.divisionId);
                const linkedParent = users.find((p) => p.id === u.parentId);
                const isPasswordVisible = showAllPasswords || !!visiblePasswords[u.id];
                const passwordText = u.password || 'School@123';
                const usernameText = u.username || (u.email ? u.email.split('@')[0] : u.name.toLowerCase().replace(/\s+/g, ''));

                return (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    {/* Identity */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          name={u.name}
                          role={u.role}
                          size="md"
                        />
                        <div>
                          <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            <span>{u.name}</span>
                            {u.role === 'superadmin' && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/15 text-rose-700 dark:text-rose-400 font-bold border border-rose-500/30">
                                Management
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[170px]">{u.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Role Badge */}
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                        u.role === 'superadmin' ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30' :
                        u.role === 'teacher' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' :
                        u.role === 'student' ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30' :
                        'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30'
                      }`}>
                        {u.role}
                      </span>
                    </td>

                    {/* Username Column with Copy */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-semibold px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 select-all">
                          {usernameText}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(usernameText, `user-${u.id}`)}
                          title="Copy Username"
                          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                        >
                          {copiedField === `user-${u.id}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Password Column with Reveal Toggle & Copy */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`font-mono text-xs px-2 py-1 rounded-lg border select-all ${
                          isPasswordVisible
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700 font-semibold'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-700 tracking-widest'
                        }`}>
                          {isPasswordVisible ? passwordText : '••••••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility(u.id)}
                          title={isPasswordVisible ? 'Hide Password' : 'Show Password'}
                          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
                        >
                          {isPasswordVisible ? <EyeOff className="w-3.5 h-3.5 text-amber-600" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(passwordText, `pwd-${u.id}`)}
                          title="Copy Password"
                          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
                        >
                          {copiedField === `pwd-${u.id}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Mobile Contact */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 font-mono text-slate-800 dark:text-slate-200 text-xs">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{u.phone || '+91 98201 44520'}</span>
                      </div>
                    </td>

                    {/* Roll No / Staff ID */}
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-800 dark:text-slate-200">
                      {u.rollNo ? (
                        <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700 font-semibold">
                          Roll: {u.rollNo}
                        </span>
                      ) : u.employeeId ? (
                        <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700 font-semibold">
                          ID: {u.employeeId}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-sans italic">None</span>
                      )}
                    </td>

                    {/* Class / Assignment / Linked Parent */}
                    <td className="px-5 py-3.5 text-xs text-slate-800 dark:text-slate-200">
                      {u.role === 'student' ? (
                        <div className="space-y-0.5">
                          <span className="font-semibold text-amber-700 dark:text-amber-400 block">
                            {studentClass?.name || 'Class 10'} &bull; Div {studentDiv?.name || 'A'}
                          </span>
                          {linkedParent ? (
                            <span className="text-[11px] text-blue-600 dark:text-blue-400 block">
                              Parent: {linkedParent.name}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 block italic">
                              No guardian linked
                            </span>
                          )}
                          {u.bonusPoints ? (
                            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <Award className="w-3 h-3" /> +{u.bonusPoints} bonus pts
                            </span>
                          ) : null}
                        </div>
                      ) : u.role === 'teacher' ? (
                        <div className="space-y-0.5">
                          <span className="text-slate-800 dark:text-slate-200 font-medium block">
                            Faculty Department
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                            {u.assignedSubjects?.length ? `${u.assignedSubjects.length} Subject Mappings` : 'All Assigned Classes'}
                          </span>
                        </div>
                      ) : u.role === 'parent' ? (
                        <div className="space-y-0.5">
                          <span className="text-blue-700 dark:text-blue-400 font-semibold block">
                            {u.childrenIds?.length || 0} Linked Children
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                            Guardian Portal Active
                          </span>
                        </div>
                      ) : (
                        <span className="text-rose-600 dark:text-rose-400 font-medium">Full System Authority</span>
                      )}
                    </td>

                    {/* Actions: Edit & Permanent Delete */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(u)}
                          title="Edit All Information"
                          className="p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer shadow-xs"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setUserToDelete({ id: u.id, name: u.name })}
                          title="Permanently Delete Account"
                          className="p-2 rounded-xl border border-rose-300 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white transition-colors cursor-pointer shadow-xs"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Comprehensive Edit Credential Modal: Edit Each and Every Detail */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-7 relative my-8 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setEditingUser(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3.5 mb-5 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0">
                <Edit3 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-serif font-bold text-slate-900 dark:text-slate-100">
                  Edit Account Information
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Update all profile, login credentials, and academic parameters for <strong className="text-slate-900 dark:text-slate-200">{editingUser.name}</strong>
                </p>
              </div>
            </div>

            {editError && (
              <div className="mb-5 p-3 rounded-xl bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/30 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-5">
              {/* Section 1: Core Profile */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-500" />
                  Profile & Role Identity
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      System Role <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value as UserRole)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500"
                    >
                      <option value="student">Student</option>
                      <option value="teacher">Teacher & Faculty</option>
                      <option value="parent">Parent / Guardian</option>
                      <option value="superadmin">Super Administrator</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Mobile Contact Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Login Credentials (Username & Password) */}
              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                  Login Credentials
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Username / Login Handle <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500 font-mono font-semibold"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Password <span className="text-rose-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={generateRandomPassword}
                        className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                      >
                        <Sparkles className="w-3 h-3" />
                        Generate Random
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showEditPassword ? 'text' : 'password'}
                        required
                        value={editPassword}
                        onChange={(e) => setEditPassword(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl pl-3 pr-10 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowEditPassword(!showEditPassword)}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                      >
                        {showEditPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Role-Specific Details */}
              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                  Role Specific Academic Details
                </h4>

                {editRole === 'student' && (
                  <div className="space-y-3 bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Standard / Class
                        </label>
                        <select
                          value={editClassId}
                          onChange={(e) => setEditClassId(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none"
                        >
                          {classes.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Division
                        </label>
                        <select
                          value={editDivisionId}
                          onChange={(e) => setEditDivisionId(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none"
                        >
                          {divisions.map((d) => (
                            <option key={d.id} value={d.id}>Division {d.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Student Roll Number
                        </label>
                        <input
                          type="text"
                          value={editRollNo}
                          onChange={(e) => setEditRollNo(e.target.value)}
                          placeholder="e.g. 101"
                          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Linked Guardian / Parent
                        </label>
                        <select
                          value={editParentId}
                          onChange={(e) => setEditParentId(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none"
                        >
                          <option value="">-- No Linked Guardian --</option>
                          {parentAccounts.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.phone || p.email})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Academic Merit Bonus Points
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={500}
                          value={editBonusPoints}
                          onChange={(e) => setEditBonusPoints(Number(e.target.value))}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {(editRole === 'teacher' || editRole === 'superadmin') && (
                  <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Faculty / Management Employee ID
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. NRES-FAC-884"
                      value={editEmployeeId}
                      onChange={(e) => setEditEmployeeId(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none font-mono"
                    />
                  </div>
                )}

                {editRole === 'parent' && (
                  <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Parent guardian accounts automatically link to students assigned to them. You can assign any student to this parent using the student's edit menu above.
                    </p>
                  </div>
                )}
              </div>

              {/* Form Buttons */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="px-6 py-2.5 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmittingEdit ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                      <span>Saving All Details...</span>
                    </>
                  ) : (
                    <span>Save All Account Details</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (Iframe Safe) */}
      <ConfirmModal
        isOpen={!!userToDelete}
        title="Permanently Delete Account"
        message={`Are you sure you want to permanently delete credentials for "${userToDelete?.name}"? This action removes all credentials, linked student/parent references, and archives the event to the 50-item audit queue.`}
        confirmText="Permanently Delete"
        cancelText="Keep Account"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleExecuteDelete}
        onClose={() => setUserToDelete(null)}
      />
    </div>
  );
};
