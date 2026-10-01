import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Edit3, 
  Search, 
  ShieldAlert, 
  CheckCircle2, 
  AlertCircle, 
  GraduationCap, 
  Phone, 
  Mail, 
  Key, 
  BookOpen, 
  X,
  RefreshCw,
  UserCheck,
  Copy,
  Check,
  Lock,
  Link as LinkIcon,
  Filter,
  User,
  ShieldCheck
} from 'lucide-react';
import { UserCredential, SchoolClass, Division } from '../../types';
import { ConfirmModal } from '../common/ConfirmModal';
import { UserAvatar } from '../common/UserAvatar';

interface TeacherStudentManagementProps {
  currentUser: UserCredential;
}

interface NewlyCreatedCredentials {
  name: string;
  role: 'student' | 'parent';
  username: string;
  password?: string;
  phone?: string;
  rollNo?: string;
  className?: string;
  linkedParentOrChild?: string;
}

export const TeacherStudentManagement: React.FC<TeacherStudentManagementProps> = ({ currentUser }) => {
  const [students, setStudents] = useState<any[]>([]);
  const [parents, setParents] = useState<any[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [selectedDivFilter, setSelectedDivFilter] = useState<string>('all');
  const [parentStatusFilter, setParentStatusFilter] = useState<'all' | 'linked' | 'unlinked'>('all');
  const [activeSubTab, setActiveSubTab] = useState<'students' | 'parents'>('students');

  // Modal States
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showAddParentModal, setShowAddParentModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Add Student Form
  const [studentName, setStudentName] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentRollNo, setStudentRollNo] = useState('');
  const [studentClassId, setStudentClassId] = useState('');
  const [studentDivisionId, setStudentDivisionId] = useState('');
  const [studentCustomPassword, setStudentCustomPassword] = useState('');
  const [parentLinkMode, setParentLinkMode] = useState<'new' | 'existing' | 'none'>('new');
  const [existingParentId, setExistingParentId] = useState('');
  const [newParentName, setNewParentName] = useState('');
  const [newParentPhone, setNewParentPhone] = useState('');
  const [newParentEmail, setNewParentEmail] = useState('');

  // Add Parent Form
  const [parentFormName, setParentFormName] = useState('');
  const [parentFormPhone, setParentFormPhone] = useState('');
  const [parentFormEmail, setParentFormEmail] = useState('');
  const [parentCustomPassword, setParentCustomPassword] = useState('');
  const [parentSelectedStudentIds, setParentSelectedStudentIds] = useState<string[]>([]);
  const [parentStudentSearch, setParentStudentSearch] = useState('');

  // Edit State
  const [editingStudent, setEditingStudent] = useState<any | null>(null);
  const [editingParent, setEditingParent] = useState<any | null>(null);
  const [editPasswordReset, setEditPasswordReset] = useState('');

  // Delete State
  const [userToDelete, setUserToDelete] = useState<{ id: string; name: string; role: 'student' | 'parent'; detail?: string } | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Success / Credentials Dialog
  const [credentialDialog, setCredentialDialog] = useState<NewlyCreatedCredentials | null>(null);
  const [hasCopied, setHasCopied] = useState(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchRoster = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/teacher/roster?teacherId=${currentUser.id}`, {
        headers: { 'x-user-id': currentUser.id },
      });
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
        setParents(data.parents || []);
        setClasses(data.classes || []);
        setDivisions(data.divisions || []);
        if (data.classes?.length > 0 && !studentClassId) {
          setStudentClassId(data.classes[0].id);
        }
        if (data.divisions?.length > 0 && !studentDivisionId) {
          setStudentDivisionId(data.divisions[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load roster:', err);
      triggerToast('Failed to fetch class roster');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoster();
  }, [currentUser.id]);

  // Keep division dropdown in sync when studentClassId changes
  useEffect(() => {
    if (studentClassId) {
      const classDivs = divisions.filter((d) => d.classId === studentClassId);
      if (classDivs.length > 0) {
        setStudentDivisionId(classDivs[0].id);
      }
    }
  }, [studentClassId, divisions]);

  // Handle Register Student
  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !studentPhone.trim() || !studentClassId) {
      setFormError('Please provide Student Full Name, Mobile Number, and Class.');
      return;
    }

    if (parentLinkMode === 'new') {
      if (!newParentName.trim() || !newParentPhone.trim()) {
        setFormError('Please provide Parent Full Name and Mobile Number, or select another parent option.');
        return;
      }
    } else if (parentLinkMode === 'existing') {
      if (!existingParentId) {
        setFormError('Please select an existing parent from the list.');
        return;
      }
    }

    setFormError(null);
    setIsSubmitting(true);

    try {
      const payload: any = {
        name: studentName.trim(),
        phone: studentPhone.trim(),
        email: studentEmail.trim() || undefined,
        rollNo: studentRollNo.trim() || undefined,
        classId: studentClassId,
        divisionId: studentDivisionId,
        password: studentCustomPassword.trim() || undefined,
      };

      if (parentLinkMode === 'new') {
        payload.parentName = newParentName.trim();
        payload.parentPhone = newParentPhone.trim();
        payload.parentEmail = newParentEmail.trim() || undefined;
      } else if (parentLinkMode === 'existing') {
        payload.existingParentId = existingParentId;
      }

      const res = await fetch('/api/teacher/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to register student');
      }

      // Reset form
      setStudentName('');
      setStudentPhone('');
      setStudentEmail('');
      setStudentRollNo('');
      setStudentCustomPassword('');
      setNewParentName('');
      setNewParentPhone('');
      setNewParentEmail('');
      setShowAddStudentModal(false);

      // Open Credentials Card
      const targetClass = classes.find((c) => c.id === data.student.classId);
      setCredentialDialog({
        name: data.student.name,
        role: 'student',
        username: data.student.username,
        password: data.student.password,
        phone: data.student.phone,
        rollNo: data.student.rollNo,
        className: targetClass?.name,
        linkedParentOrChild: data.parent?.name || (parentLinkMode === 'existing' ? 'Linked to existing parent' : undefined),
      });

      triggerToast('Student successfully registered and enrolled!');
      await fetchRoster();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to generate account');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Register Parent
  const handleCreateParent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentFormName.trim() || !parentFormPhone.trim()) {
      setFormError('Parent Full Name and Mobile Number are required.');
      return;
    }
    if (parentSelectedStudentIds.length === 0) {
      setFormError('Please select at least one student ward from your classes to link with this parent.');
      return;
    }

    setFormError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/teacher/parents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({
          name: parentFormName.trim(),
          phone: parentFormPhone.trim(),
          email: parentFormEmail.trim() || undefined,
          studentIds: parentSelectedStudentIds,
          password: parentCustomPassword.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to register parent');
      }

      // Reset
      setParentFormName('');
      setParentFormPhone('');
      setParentFormEmail('');
      setParentCustomPassword('');
      setParentSelectedStudentIds([]);
      setShowAddParentModal(false);

      const linkedNames = data.linkedStudents?.map((s: any) => s.name).join(', ') || `${parentSelectedStudentIds.length} Student(s)`;

      setCredentialDialog({
        name: data.parent.name,
        role: 'parent',
        username: data.parent.username,
        password: data.parent.password,
        phone: data.parent.phone,
        linkedParentOrChild: `Wards: ${linkedNames}`,
      });

      triggerToast('Parent registered and linked to student wards successfully!');
      await fetchRoster();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to register parent');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Update Student
  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setIsSubmitting(true);

    try {
      const payload: any = {
        name: editingStudent.name,
        phone: editingStudent.phone,
        email: editingStudent.email,
        rollNo: editingStudent.rollNo,
        classId: editingStudent.classId,
        divisionId: editingStudent.divisionId,
        parentId: editingStudent.parentId || null,
      };
      if (editPasswordReset.trim()) {
        payload.password = editPasswordReset.trim();
      }

      const res = await fetch(`/api/teacher/users/${editingStudent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update student');
      }

      setEditingStudent(null);
      setEditPasswordReset('');
      triggerToast('Student record updated successfully!');
      await fetchRoster();
    } catch (err: any) {
      triggerToast(err?.message || 'Update failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Update Parent
  const handleUpdateParent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingParent) return;
    setIsSubmitting(true);

    try {
      const payload: any = {
        name: editingParent.name,
        phone: editingParent.phone,
        email: editingParent.email,
        childrenIds: editingParent.childrenIds || [],
      };
      if (editPasswordReset.trim()) {
        payload.password = editPasswordReset.trim();
      }

      const res = await fetch(`/api/teacher/users/${editingParent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update parent');
      }

      setEditingParent(null);
      setEditPasswordReset('');
      triggerToast('Parent details updated successfully!');
      await fetchRoster();
    } catch (err: any) {
      triggerToast(err?.message || 'Update failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/teacher/users/${userToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({
          teacherName: currentUser.name,
          reason: deleteReason || 'Class roster management by assigned teacher',
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to remove user account');
      }

      triggerToast(`${userToDelete.role === 'student' ? 'Student' : 'Parent'} removed from class roster.`);
      setUserToDelete(null);
      setDeleteReason('');
      await fetchRoster();
    } catch (err: any) {
      console.error('Delete error:', err);
      triggerToast(err?.message || 'Error removing account');
    } finally {
      setIsDeleting(false);
    }
  };

  // Copy Credentials Helper
  const handleCopyCredentials = () => {
    if (!credentialDialog) return;
    const text = `=== Nexus Ranaji English School Login Credentials ===
Role: ${credentialDialog.role.toUpperCase()}
Name: ${credentialDialog.name}
${credentialDialog.rollNo ? `Roll No: ${credentialDialog.rollNo}\n` : ''}${credentialDialog.className ? `Class: ${credentialDialog.className}\n` : ''}Login Username: ${credentialDialog.username}
Password: ${credentialDialog.password || '(Current password)'}
Registered Mobile: ${credentialDialog.phone || 'N/A'}
${credentialDialog.linkedParentOrChild ? `${credentialDialog.linkedParentOrChild}\n` : ''}Portal Access: Log in via the Student/Parent portal tab.`;

    navigator.clipboard.writeText(text);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2500);
  };

  // Filter students
  const filteredStudents = students.filter((s) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = 
      (s.name || '').toLowerCase().includes(q) ||
      (s.rollNo || '').toLowerCase().includes(q) ||
      (s.phone || '').includes(q) ||
      (s.email || '').toLowerCase().includes(q) ||
      (s.parentName || '').toLowerCase().includes(q) ||
      (s.parentPhone || '').includes(q);

    const matchesClass = selectedClassFilter === 'all' || s.classId === selectedClassFilter;
    const matchesDiv = selectedDivFilter === 'all' || s.divisionId === selectedDivFilter;
    
    let matchesParentStatus = true;
    if (parentStatusFilter === 'linked') {
      matchesParentStatus = Boolean(s.parentId);
    } else if (parentStatusFilter === 'unlinked') {
      matchesParentStatus = !s.parentId;
    }

    return matchesSearch && matchesClass && matchesDiv && matchesParentStatus;
  });

  // Filter parents
  const filteredParents = parents.filter((p) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = 
      (p.name || '').toLowerCase().includes(q) ||
      (p.phone || '').includes(q) ||
      (p.email || '').toLowerCase().includes(q) ||
      (p.username || '').toLowerCase().includes(q) ||
      (p.linkedStudents || []).some((ls: any) => 
        (ls.name || '').toLowerCase().includes(q) || 
        (ls.rollNo || '').toLowerCase().includes(q)
      );

    return matchesSearch;
  });

  // Calculate Metrics
  const totalStudents = students.length;
  const linkedStudentsCount = students.filter((s) => Boolean(s.parentId)).length;
  const unlinkedStudentsCount = totalStudents - linkedStudentsCount;
  const totalParents = parents.length;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-sm space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-slate-900 dark:text-slate-100 text-lg">
                Class Roster &amp; Admission Controls
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Register, modify details, and manage student enrollments and linked parent accounts for your assigned classes.
              </p>
            </div>
          </div>

          {/* Assigned Classes Pill Indicator */}
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Your Assigned Classes:</span>
            {classes.length > 0 ? (
              classes.map((c) => (
                <span key={c.id} className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                  {c.name}
                </span>
              ))
            ) : (
              <span className="text-[10px] font-semibold text-slate-400">All School Classes (General Faculty)</span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={fetchRoster}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            title="Refresh Roster Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-500' : ''}`} />
          </button>

          <button
            onClick={() => {
              setFormError(null);
              setShowAddParentModal(true);
            }}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
          >
            <UserCheck className="w-4 h-4 text-amber-500" />
            <span>+ Register Parent</span>
          </button>

          <button
            onClick={() => {
              setFormError(null);
              setShowAddStudentModal(true);
            }}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm shadow-amber-500/20"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Register Student</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-3.5">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Enrolled Students</span>
            <GraduationCap className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <p className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100 mt-1">
            {totalStudents}
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-3.5">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Linked Parents</span>
            <Users className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <p className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100 mt-1">
            {totalParents}
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-3.5">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Parent Verified</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <p className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100 mt-1">
            {linkedStudentsCount}
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-3.5">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Needs Parent Account</span>
            <AlertCircle className={`w-3.5 h-3.5 ${unlinkedStudentsCount > 0 ? 'text-amber-500' : 'text-slate-400'}`} />
          </div>
          <p className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100 mt-1">
            {unlinkedStudentsCount}
          </p>
        </div>
      </div>

      {/* Sub-Tabs & Filtering Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('students')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeSubTab === 'students'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm shadow-amber-500/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Students ({students.length})
          </button>
          <button
            onClick={() => setActiveSubTab('parents')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeSubTab === 'parents'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm shadow-amber-500/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Parents ({parents.length})
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {activeSubTab === 'students' && (
            <>
              {classes.length > 0 && (
                <select
                  value={selectedClassFilter}
                  onChange={(e) => setSelectedClassFilter(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none"
                >
                  <option value="all">All Assigned Classes</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}

              <select
                value={parentStatusFilter}
                onChange={(e) => setParentStatusFilter(e.target.value as any)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none"
              >
                <option value="all">All Parent Links</option>
                <option value="linked">Has Parent Account</option>
                <option value="unlinked">No Parent Linked</option>
              </select>
            </>
          )}

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder={activeSubTab === 'students' ? "Search student, roll no, phone..." : "Search parent name, mobile..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none w-48 sm:w-60 focus:border-amber-500"
            />
          </div>
        </div>
      </div>

      {/* TABLE 1: STUDENTS */}
      {activeSubTab === 'students' && (
        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Roll No</th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Class &amp; Division</th>
                  <th className="px-4 py-3">Student Contact</th>
                  <th className="px-4 py-3">Linked Parent / Guardian</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                      <GraduationCap className="w-8 h-8 mx-auto mb-2 text-slate-400 opacity-50" />
                      <p className="font-semibold">No students found matching your filter criteria.</p>
                      <p className="text-[11px] text-slate-500 mt-1">Use "+ Register Student" to enroll a new candidate into your class.</p>
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s) => {
                    const cls = classes.find((c) => c.id === s.classId);
                    const div = divisions.find((d) => d.id === s.divisionId);
                    return (
                      <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-amber-600 dark:text-amber-400">
                          {s.rollNo || 'NRES-001'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <UserAvatar
                              name={s.name}
                              role="student"
                              size="xs"
                            />
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-slate-100">{s.name}</p>
                              <p className="text-[10px] text-slate-400 font-mono">{s.username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {cls?.name || s.className || 'Standard 10'}
                          </span>
                          <span className="text-slate-400 ml-1">
                            • {div?.name || s.divisionName || 'Div A'}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">
                          <div className="flex items-center gap-1 text-[11px]">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{s.phone}</span>
                          </div>
                          {s.email && (
                            <p className="text-[10px] text-slate-400 truncate max-w-[140px]">{s.email}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {s.parentId && s.parentName ? (
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                              <div>
                                <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs">{s.parentName}</p>
                                <p className="text-[10px] font-mono text-slate-400">{s.parentPhone}</p>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingStudent(s);
                                setEditPasswordReset('');
                              }}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:underline"
                            >
                              <AlertCircle className="w-3 h-3" />
                              <span>Link Parent</span>
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setCredentialDialog({
                                  name: s.name,
                                  role: 'student',
                                  username: s.username,
                                  phone: s.phone,
                                  rollNo: s.rollNo,
                                  className: cls?.name,
                                  linkedParentOrChild: s.parentName ? `Parent: ${s.parentName} (${s.parentPhone})` : 'No linked parent',
                                });
                              }}
                              className="p-1.5 text-slate-400 hover:text-amber-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="View & Copy Login Credentials"
                            >
                              <Key className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingStudent(s);
                                setEditPasswordReset('');
                              }}
                              className="p-1.5 text-slate-400 hover:text-blue-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Edit Student Record"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setUserToDelete({
                                id: s.id,
                                name: s.name,
                                role: 'student',
                                detail: `Roll No: ${s.rollNo} • ${cls?.name || 'Class 10'}`
                              })}
                              className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Remove Student from Class"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
        </div>
      )}

      {/* TABLE 2: PARENTS */}
      {activeSubTab === 'parents' && (
        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Parent Name</th>
                  <th className="px-4 py-3">Mobile Contact</th>
                  <th className="px-4 py-3">Email Address</th>
                  <th className="px-4 py-3">Login Username</th>
                  <th className="px-4 py-3">Linked Wards (In Your Classes)</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredParents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                      <Users className="w-8 h-8 mx-auto mb-2 text-slate-400 opacity-50" />
                      <p className="font-semibold">No parents found for your assigned classes.</p>
                      <p className="text-[11px] text-slate-500 mt-1">Use "+ Register Parent" to create and link a parent account for your students.</p>
                    </td>
                  </tr>
                ) : (
                  filteredParents.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                        <div className="flex items-center gap-2.5">
                          <UserAvatar
                            name={p.name}
                            role="parent"
                            size="xs"
                          />
                          <span>{p.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{p.phone}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        {p.email || '—'}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-500">
                        {p.username}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(p.linkedStudents || []).map((ls: any) => (
                            <span
                              key={ls.id}
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                                ls.isAssignedToTeacher
                                  ? 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              {ls.name} ({ls.rollNo || 'Ward'})
                            </span>
                          ))}
                          {(!p.linkedStudents || p.linkedStudents.length === 0) && (
                            <span className="text-[10px] text-rose-500 font-semibold">No active wards</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              const wardNames = (p.linkedStudents || []).map((ls: any) => ls.name).join(', ');
                              setCredentialDialog({
                                name: p.name,
                                role: 'parent',
                                username: p.username,
                                phone: p.phone,
                                linkedParentOrChild: `Wards: ${wardNames || 'None'}`,
                              });
                            }}
                            className="p-1.5 text-slate-400 hover:text-amber-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="View & Copy Login Credentials"
                          >
                            <Key className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingParent(p);
                              setEditPasswordReset('');
                            }}
                            className="p-1.5 text-slate-400 hover:text-blue-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Edit Parent Details & Linked Wards"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setUserToDelete({
                              id: p.id,
                              name: p.name,
                              role: 'parent',
                              detail: `Parent of: ${(p.linkedStudents || []).map((s: any) => s.name).join(', ') || 'N/A'}`
                            })}
                            className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Remove Parent Account"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: REGISTER STUDENT */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-amber-500" />
                <h3 className="font-serif font-bold text-slate-900 dark:text-slate-100 text-base">
                  Register Student into Assigned Class
                </h3>
              </div>
              <button
                onClick={() => setShowAddStudentModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateStudent} className="space-y-4">
              {/* Student Core Details */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Student Details
                </h4>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Student Full Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Siddhesh Kulkarni"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Mobile Number *
                    </label>
                    <input
                      type="tel"
                      placeholder="9876543210"
                      value={studentPhone}
                      onChange={(e) => setStudentPhone(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Roll Number (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. NRES-10A-15"
                      value={studentRollNo}
                      onChange={(e) => setStudentRollNo(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Student Email (Optional)
                    </label>
                    <input
                      type="email"
                      placeholder="siddhesh@nexusrana.edu"
                      value={studentEmail}
                      onChange={(e) => setStudentEmail(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Custom Password (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="Default: StudentPass#101"
                      value={studentCustomPassword}
                      onChange={(e) => setStudentCustomPassword(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Assigned Class *
                    </label>
                    <select
                      value={studentClassId}
                      onChange={(e) => setStudentClassId(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500"
                      required
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
                      Division
                    </label>
                    <select
                      value={studentDivisionId}
                      onChange={(e) => setStudentDivisionId(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500"
                    >
                      {divisions
                        .filter((d) => !studentClassId || d.classId === studentClassId)
                        .map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} {d.roomNumber ? `(${d.roomNumber})` : ''}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Linked Parent Selection */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Parent / Guardian Association
                </h4>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setParentLinkMode('new')}
                    className={`p-2 rounded-xl border text-center text-xs font-semibold cursor-pointer transition-all ${
                      parentLinkMode === 'new'
                        ? 'bg-amber-500/15 border-amber-500 text-amber-900 dark:text-amber-200 font-bold'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    + Create New Parent
                  </button>
                  <button
                    type="button"
                    onClick={() => setParentLinkMode('existing')}
                    className={`p-2 rounded-xl border text-center text-xs font-semibold cursor-pointer transition-all ${
                      parentLinkMode === 'existing'
                        ? 'bg-amber-500/15 border-amber-500 text-amber-900 dark:text-amber-200 font-bold'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Link Existing Parent
                  </button>
                  <button
                    type="button"
                    onClick={() => setParentLinkMode('none')}
                    className={`p-2 rounded-xl border text-center text-xs font-semibold cursor-pointer transition-all ${
                      parentLinkMode === 'none'
                        ? 'bg-amber-500/15 border-amber-500 text-amber-900 dark:text-amber-200 font-bold'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Skip For Now
                  </button>
                </div>

                {parentLinkMode === 'new' && (
                  <div className="space-y-3 bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Parent / Guardian Full Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Mr. Kulkarni"
                        value={newParentName}
                        onChange={(e) => setNewParentName(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500"
                        required={parentLinkMode === 'new'}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Parent Mobile Number *
                        </label>
                        <input
                          type="tel"
                          placeholder="9820199881"
                          value={newParentPhone}
                          onChange={(e) => setNewParentPhone(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500"
                          required={parentLinkMode === 'new'}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Parent Email (Optional)
                        </label>
                        <input
                          type="email"
                          placeholder="parent@gmail.com"
                          value={newParentEmail}
                          onChange={(e) => setNewParentEmail(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {parentLinkMode === 'existing' && (
                  <div className="bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      Choose Registered Parent
                    </label>
                    <select
                      value={existingParentId}
                      onChange={(e) => setExistingParentId(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500"
                    >
                      <option value="">Select a registered parent...</option>
                      {parents.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.phone}) — {p.childrenIds?.length || 0} Ward(s)
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-sm shadow-amber-500/20"
                >
                  {isSubmitting ? 'Enrolling...' : 'Register Student & Issue Login'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: REGISTER PARENT */}
      {showAddParentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-amber-500" />
                <h3 className="font-serif font-bold text-slate-900 dark:text-slate-100 text-base">
                  Register Parent Account for Your Class
                </h3>
              </div>
              <button
                onClick={() => setShowAddParentModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateParent} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Parent / Guardian Full Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mrs. Kavita Deshmukh"
                  value={parentFormName}
                  onChange={(e) => setParentFormName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mobile Contact *
                  </label>
                  <input
                    type="tel"
                    placeholder="9820011223"
                    value={parentFormPhone}
                    onChange={(e) => setParentFormPhone(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="parent@email.com"
                    value={parentFormEmail}
                    onChange={(e) => setParentFormEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Custom Password (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Default: ParentPass#2025"
                  value={parentCustomPassword}
                  onChange={(e) => setParentCustomPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500"
                />
              </div>

              {/* Student Selection for Parent */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    Select Student Wards in Your Classes * ({parentSelectedStudentIds.length} Selected)
                  </label>
                  <span className="text-[10px] text-slate-400">Multi-child support</span>
                </div>

                <div className="relative mb-2">
                  <Search className="w-3 h-3 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Filter students by name or roll..."
                    value={parentStudentSearch}
                    onChange={(e) => setParentStudentSearch(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none"
                  />
                </div>

                <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/40 p-1">
                  {students
                    .filter((s) => {
                      const q = parentStudentSearch.toLowerCase();
                      return (s.name || '').toLowerCase().includes(q) || (s.rollNo || '').toLowerCase().includes(q);
                    })
                    .map((s) => {
                      const isSelected = parentSelectedStudentIds.includes(s.id);
                      return (
                        <div
                          key={s.id}
                          onClick={() => {
                            if (isSelected) {
                              setParentSelectedStudentIds(parentSelectedStudentIds.filter((id) => id !== s.id));
                            } else {
                              setParentSelectedStudentIds([...parentSelectedStudentIds, s.id]);
                            }
                          }}
                          className={`p-2 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-amber-500/15 text-amber-900 dark:text-amber-200 font-semibold'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="rounded text-amber-500 focus:ring-amber-500 pointer-events-none"
                            />
                            <div>
                              <p className="text-xs font-semibold">{s.name}</p>
                              <p className="text-[10px] text-slate-400 font-mono">
                                {s.rollNo} • {s.className || 'Class 10'}
                              </p>
                            </div>
                          </div>
                          {s.parentId && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-500">
                              Has Parent
                            </span>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddParentModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-sm shadow-amber-500/20"
                >
                  {isSubmitting ? 'Registering...' : 'Register Parent & Link Wards'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: EDIT STUDENT */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-500" />
                <h3 className="font-serif font-bold text-slate-900 dark:text-slate-100 text-base">
                  Edit Student: {editingStudent.name}
                </h3>
              </div>
              <button
                onClick={() => setEditingStudent(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStudent} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editingStudent.name || ''}
                  onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={editingStudent.phone || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, phone: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Roll Number
                  </label>
                  <input
                    type="text"
                    value={editingStudent.rollNo || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, rollNo: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={editingStudent.email || ''}
                  onChange={(e) => setEditingStudent({ ...editingStudent, email: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Assigned Class
                  </label>
                  <select
                    value={editingStudent.classId || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, classId: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500"
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
                    Division
                  </label>
                  <select
                    value={editingStudent.divisionId || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, divisionId: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500"
                  >
                    {divisions
                      .filter((d) => !editingStudent.classId || d.classId === editingStudent.classId)
                      .map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} {d.roomNumber ? `(${d.roomNumber})` : ''}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Linked Parent Dropdown */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Linked Parent Account
                </label>
                <select
                  value={editingStudent.parentId || ''}
                  onChange={(e) => setEditingStudent({ ...editingStudent, parentId: e.target.value || null })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500"
                >
                  <option value="">No Parent Linked (Standalone Student)</option>
                  {parents.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.phone})
                    </option>
                  ))}
                </select>
              </div>

              {/* Reset Password Field */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reset Password (Leave blank to keep unchanged)
                </label>
                <input
                  type="text"
                  placeholder="Enter new password to reset..."
                  value={editPasswordReset}
                  onChange={(e) => setEditPasswordReset(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl cursor-pointer transition-all"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: EDIT PARENT */}
      {editingParent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-500" />
                <h3 className="font-serif font-bold text-slate-900 dark:text-slate-100 text-base">
                  Edit Parent: {editingParent.name}
                </h3>
              </div>
              <button
                onClick={() => setEditingParent(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateParent} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editingParent.name || ''}
                  onChange={(e) => setEditingParent({ ...editingParent, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={editingParent.phone || ''}
                  onChange={(e) => setEditingParent({ ...editingParent, phone: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={editingParent.email || ''}
                  onChange={(e) => setEditingParent({ ...editingParent, email: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500"
                />
              </div>

              {/* Reset Password */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reset Password (Leave blank to keep unchanged)
                </label>
                <input
                  type="text"
                  placeholder="Enter new password to reset..."
                  value={editPasswordReset}
                  onChange={(e) => setEditPasswordReset(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500"
                />
              </div>

              {/* Manage Linked Student Wards */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Linked Student Wards in Your Classes
                </label>
                <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/40 p-1">
                  {students.map((s) => {
                    const currentChildren: string[] = editingParent.childrenIds || [];
                    const isLinked = currentChildren.includes(s.id);
                    return (
                      <div
                        key={s.id}
                        onClick={() => {
                          const updated = isLinked
                            ? currentChildren.filter((id) => id !== s.id)
                            : [...currentChildren, s.id];
                          setEditingParent({ ...editingParent, childrenIds: updated });
                        }}
                        className={`p-2 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                          isLinked
                            ? 'bg-amber-500/15 text-amber-900 dark:text-amber-200 font-semibold'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isLinked}
                            onChange={() => {}}
                            className="rounded text-amber-500 focus:ring-amber-500 pointer-events-none"
                          />
                          <div>
                            <p className="text-xs font-semibold">{s.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              {s.rollNo} • {s.className || 'Class 10'}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingParent(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl cursor-pointer transition-all"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREDENTIALS SUCCESS CARD DIALOG */}
      {credentialDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <h3 className="font-serif font-bold text-slate-900 dark:text-slate-100 text-base">
                  Account Credentials Issued
                </h3>
              </div>
              <button
                onClick={() => setCredentialDialog(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950/70 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Account Role:</span>
                <span className="font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400">
                  {credentialDialog.role}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Candidate Name:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{credentialDialog.name}</span>
              </div>
              {credentialDialog.rollNo && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Roll Number:</span>
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{credentialDialog.rollNo}</span>
                </div>
              )}
              {credentialDialog.className && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Assigned Class:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{credentialDialog.className}</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                <span className="text-slate-500">Login Username:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{credentialDialog.username}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Initial Password:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {credentialDialog.password || 'Existing password'}
                </span>
              </div>
              {credentialDialog.phone && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Mobile:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">{credentialDialog.phone}</span>
                </div>
              )}
              {credentialDialog.linkedParentOrChild && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400">
                  {credentialDialog.linkedParentOrChild}
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Share these credentials with the student or parent. They can log in immediately from the login screen.
            </p>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleCopyCredentials}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                {hasCopied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Login Info</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setCredentialDialog(null)}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl cursor-pointer transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL FOR DELETION */}
      {userToDelete && (
        <ConfirmModal
          isOpen={Boolean(userToDelete)}
          title={`Remove ${userToDelete.role === 'student' ? 'Student' : 'Parent'} Account`}
          message={`Are you sure you want to permanently remove ${userToDelete.name} (${userToDelete.detail || userToDelete.role}) from your class roster? This will be recorded in the institutional audit log.`}
          confirmText="Yes, Remove Record"
          cancelText="Cancel"
          danger={true}
          isLoading={isDeleting}
          onConfirm={handleConfirmDelete}
          onClose={() => setUserToDelete(null)}
        />
      )}
    </div>
  );
};
