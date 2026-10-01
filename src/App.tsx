import React, { useState, useEffect } from 'react';
import { UserCredential } from './types';
import { Navbar } from './components/Navbar';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { TeacherDashboard } from './components/teacher/TeacherDashboard';
import { StudentDashboard } from './components/student/StudentDashboard';
import { ParentDashboard } from './components/parent/ParentDashboard';
import { LoginModal } from './components/auth/LoginModal';
import { GeminiChatbot } from './components/chat/GeminiChatbot';
import { MobileBottomNav } from './components/mobile/MobileBottomNav';
import { 
  ShieldCheck, 
  GraduationCap, 
  Smartphone, 
  Server, 
  ExternalLink 
} from 'lucide-react';

const DEFAULT_USERS: UserCredential[] = [
  {
    id: 'usr-admin-1',
    name: 'Dr. R. K. Deshmukh',
    username: 'admin',
    email: 'admin@nexusrana.edu',
    role: 'superadmin',
    employeeId: 'NRES-DIR-001',
    createdAt: '2025-01-10T08:00:00Z',
  },
  {
    id: 'usr-teach-1',
    name: 'Prof. Vikram Sharma',
    username: 'teacher.sharma',
    email: 'vikram.sharma@nexusrana.edu',
    role: 'teacher',
    employeeId: 'NRES-FAC-104',
    createdAt: '2025-01-15T09:00:00Z',
  },
  {
    id: 'usr-stud-1',
    name: 'Aarav Sharma',
    username: 'student.aarav',
    email: 'aarav.sharma@student.nexusrana.edu',
    role: 'student',
    rollNo: 'NRES-10A-01',
    classId: 'cls-10',
    divisionId: 'div-10a',
    parentId: 'usr-parent-1',
    bonusPoints: 260,
    createdAt: '2025-02-01T08:30:00Z',
  },
  {
    id: 'usr-stud-2',
    name: 'Rohan Patel',
    username: 'student.rohan',
    email: 'rohan.patel@student.nexusrana.edu',
    role: 'student',
    rollNo: 'NRES-10A-02',
    classId: 'cls-10',
    divisionId: 'div-10a',
    parentId: 'usr-parent-2',
    bonusPoints: 175,
    createdAt: '2025-02-01T08:30:00Z',
  },
  {
    id: 'usr-parent-1',
    name: 'Mr. Rajesh Sharma',
    username: 'parent.sharma',
    email: 'rajesh.sharma@parent.nexusrana.edu',
    role: 'parent',
    childrenIds: ['usr-stud-1', 'usr-stud-3'],
    phone: '+91 98201 44521',
    createdAt: '2025-02-01T08:30:00Z',
  },
];

export default function App() {
  const [allUsers, setAllUsers] = useState<UserCredential[]>(DEFAULT_USERS);
  const [currentUser, setCurrentUser] = useState<UserCredential | null>(DEFAULT_USERS[0]);
  const [loading, setLoading] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [roleTabs, setRoleTabs] = useState<Record<string, string>>({
    student: 'home',
    teacher: 'home',
    superadmin: 'home',
    parent: 'home',
  });

  const getRoleHashPrefix = (role: string) => (role === 'superadmin' ? 'admin' : role);
  const getRoleFromPrefix = (prefix: string) => (prefix === 'admin' ? 'superadmin' : prefix);

  const handleTabChange = (newTab: string) => {
    if (!currentUser) return;
    setRoleTabs((prev) => ({
      ...prev,
      [currentUser.role]: newTab,
    }));
    const prefix = getRoleHashPrefix(currentUser.role);
    const targetHash = newTab === 'home' ? `#/${prefix}` : `#/${prefix}/${newTab}`;
    if (window.location.hash !== targetHash) {
      window.history.pushState({ role: currentUser.role, tab: newTab }, '', targetHash);
    }
  };

  const fetchUsers = async () => {
    try {
      let users: UserCredential[] = [];
      const res = await fetch('/api/admin/credentials');
      const contentType = res.headers.get('content-type') || '';

      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        users = data.users || [];
      } else {
        // Fallback endpoint
        const altRes = await fetch('/api/auth/users');
        const altContentType = altRes.headers.get('content-type') || '';
        if (altRes.ok && altContentType.includes('application/json')) {
          const altData = await altRes.json();
          users = altData.users || [];
        }
      }

      if (users.length > 0) {
        // Guarantee deduplication by user.id
        const uniqueUsers = Array.from(new Map(users.map((u) => [u.id, u])).values());
        setAllUsers(uniqueUsers);
        setCurrentUser((prev) => {
          if (!prev) return uniqueUsers.find((u) => u.role === 'superadmin') || uniqueUsers[0];
          const found = uniqueUsers.find((u) => u.id === prev.id);
          return found || prev;
        });
      }
    } catch (err) {
      console.error('Failed to load user list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Listen to browser navigation (back/forward button, Android hardware back, URL hash updates)
  useEffect(() => {
    const handleUrlSync = () => {
      const hash = window.location.hash.replace(/^#\/?/, '').trim();
      if (!hash) return;
      const [rolePrefix, tabSegment] = hash.split('/');
      const role = getRoleFromPrefix(rolePrefix);
      const tab = tabSegment || 'home';

      setRoleTabs((prev) => ({
        ...prev,
        [role]: tab,
      }));

      // If URL specifies a role different from current user, switch to a user with that role
      if (currentUser && currentUser.role !== role) {
        const matchingUser = allUsers.find((u) => u.role === role);
        if (matchingUser) {
          setCurrentUser(matchingUser);
        }
      }
    };

    window.addEventListener('hashchange', handleUrlSync);
    window.addEventListener('popstate', handleUrlSync);

    handleUrlSync();

    return () => {
      window.removeEventListener('hashchange', handleUrlSync);
      window.removeEventListener('popstate', handleUrlSync);
    };
  }, [allUsers, currentUser]);

  const handleSwitchUser = (user: UserCredential) => {
    setCurrentUser(user);
    const prefix = getRoleHashPrefix(user.role);
    const currentRoleTab = roleTabs[user.role] || 'home';
    const targetHash = currentRoleTab === 'home' ? `#/${prefix}` : `#/${prefix}/${currentRoleTab}`;
    if (window.location.hash !== targetHash) {
      window.history.pushState({ role: user.role, tab: currentRoleTab }, '', targetHash);
    }
  };

  const handleLoginSuccess = (user: UserCredential) => {
    setCurrentUser(user);
    const prefix = getRoleHashPrefix(user.role);
    const targetHash = `#/${prefix}`;
    window.history.pushState({ role: user.role, tab: 'home' }, '', targetHash);
    fetchUsers();
  };

  const handleLogout = () => {
    const studentUser = allUsers.find((u) => u.role === 'student') || allUsers[0];
    if (studentUser) {
      setCurrentUser(studentUser);
      window.history.pushState({ role: 'student', tab: 'home' }, '', '#/student');
    }
    setLoginModalOpen(true);
  };

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-serif font-bold text-slate-100">Nexus Ranaji English School</p>
        <p className="text-xs text-slate-500 mt-1">Initializing Secure Examination Infrastructure...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950 transition-colors duration-200">
      
      {/* Institutional Top Navigation Bar */}
      <Navbar
        currentUser={currentUser}
        allUsers={allUsers}
        onSwitchUser={handleSwitchUser}
        onOpenLoginModal={() => setLoginModalOpen(true)}
        currentView={currentView}
        onChangeView={setCurrentView}
        onOpenGeminiChat={() => setIsChatOpen((prev) => !prev)}
        isChatOpen={isChatOpen}
        onLogout={handleLogout}
        onNavigateTab={(tab) => handleTabChange(tab)}
      />

      {/* Main Role-Based Workspaces */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 pb-24 md:pb-8">
        {currentUser.role === 'superadmin' && (
          <AdminDashboard 
            currentUser={currentUser} 
            onRefreshUsers={fetchUsers} 
            activeTab={roleTabs.superadmin as any}
            onTabChange={(t) => handleTabChange(t)}
          />
        )}

        {currentUser.role === 'teacher' && (
          <TeacherDashboard 
            currentUser={currentUser} 
            activeTab={roleTabs.teacher as any}
            onTabChange={(t) => handleTabChange(t)}
          />
        )}

        {currentUser.role === 'student' && (
          <StudentDashboard
            currentUser={currentUser}
            onRefreshUser={fetchUsers}
            activeTab={roleTabs.student as any}
            onTabChange={(t) => handleTabChange(t)}
          />
        )}

        {currentUser.role === 'parent' && (
          <ParentDashboard 
            currentUser={currentUser} 
            activeTab={roleTabs.parent as any}
            onTabChange={(t) => handleTabChange(t)}
          />
        )}
      </main>

      {/* Institutional Footer with mobile clearance */}
      <footer className="bg-white/80 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 py-6 sm:py-8 px-4 sm:px-6 lg:px-8 mt-6 sm:mt-12 mb-16 md:mb-0 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-500 dark:text-amber-400 flex items-center justify-center shrink-0">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <p className="font-serif font-bold text-slate-800 dark:text-slate-200">
                Nexus Ranaji English School &bull; Online Examination System
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                CBSE Affiliated Institutional Code #41029 &bull; ISO 9001:2015 Certified Educational Governance
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
              <Server className="w-3.5 h-3.5" />
              REST API Ready for Android
            </span>
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              Active Window Blur Guard Enabled
            </span>
          </div>
        </div>
      </footer>

      {/* YouTube Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        currentUser={currentUser}
        activeTab={roleTabs[currentUser.role]}
        onTabChange={handleTabChange}
        onOpenChat={() => setIsChatOpen((prev) => !prev)}
        isChatOpen={isChatOpen}
      />

      {/* Sign In Credentials Modal */}
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Gemini Multi-Turn AI Chatbot Component */}
      <GeminiChatbot
        currentUser={currentUser}
        isOpen={isChatOpen}
        onToggleOpen={() => setIsChatOpen((prev) => !prev)}
      />

    </div>
  );
}
