import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  ShieldCheck, 
  UserCheck, 
  Award, 
  Users, 
  ChevronDown, 
  LogOut, 
  Bot, 
  Sparkles, 
  BookOpen, 
  HelpCircle, 
  Clock, 
  Sun, 
  Moon,
  X,
  KeyRound,
  User,
  Key,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { UserCredential } from '../types';
import { useTheme } from '../context/ThemeContext';
import { UserAvatar } from './common/UserAvatar';
import { AccountDetailsModal } from './common/AccountDetailsModal';
import { NotificationCenter } from './common/NotificationCenter';

interface NavbarProps {
  currentUser: UserCredential;
  allUsers: UserCredential[];
  onSwitchUser: (user: UserCredential) => void;
  onOpenLoginModal: () => void;
  currentView: string;
  onChangeView: (view: string) => void;
  onOpenGeminiChat?: () => void;
  isChatOpen?: boolean;
  onLogout?: () => void;
  onNavigateTab?: (tab: string, linkId?: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  allUsers,
  onSwitchUser,
  onOpenLoginModal,
  currentView,
  onChangeView,
  onOpenGeminiChat,
  isChatOpen,
  onLogout,
  onNavigateTab,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [hatMenuOpen, setHatMenuOpen] = useState(false);
  const [accountDetailsOpen, setAccountDetailsOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'superadmin':
        return {
          label: 'Super Admin',
          color: 'bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-500/40',
          icon: ShieldCheck,
        };
      case 'teacher':
        return {
          label: 'Faculty / Teacher',
          color: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/40',
          icon: BookOpen,
        };
      case 'student':
        return {
          label: 'Student Portal',
          color: 'bg-amber-500/15 text-amber-900 dark:text-amber-300 border-amber-500/40',
          icon: GraduationCap,
        };
      case 'parent':
        return {
          label: 'Parent Portal',
          color: 'bg-blue-500/15 text-blue-900 dark:text-blue-300 border-blue-500/40',
          icon: Users,
        };
      default:
        return {
          label: role,
          color: 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700',
          icon: UserCheck,
        };
    }
  };

  const badge = getRoleBadge(currentUser.role);
  const BadgeIcon = badge.icon;

  // Deduplicate allUsers to ensure absolutely unique keys and avoid duplicate entries
  const uniqueUsers = Array.from(new Map(allUsers.map((u) => [u.id, u])).values());

  const handleAvatarClick = () => {
    if (window.innerWidth < 768) {
      setMobileSheetOpen(true);
    } else {
      setDropdownOpen(!dropdownOpen);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* School Brand & Clickable Hat Emblem with Institutional Menu */}
            <div className="relative flex items-center gap-2.5 sm:gap-3.5 min-w-0">
              <button
                id="school-hat-menu-btn"
                onClick={() => setHatMenuOpen((prev) => !prev)}
                className="group relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl nres-crest-gradient border border-amber-400/40 flex items-center justify-center shadow-md shadow-purple-950/20 text-amber-300 shrink-0 transition-all hover:scale-105 active:scale-95 hover:ring-2 hover:ring-amber-400/50 cursor-pointer"
                title="School Menu: View Account Details, Settings & Log Out"
                aria-label="School Menu: View Account Details, Settings & Log Out"
                aria-expanded={hatMenuOpen}
              >
                <GraduationCap className="w-5 h-5 stroke-[2] group-hover:rotate-6 transition-transform text-amber-300" />
                <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-slate-900 dark:bg-slate-100 border border-white dark:border-slate-900 flex items-center justify-center shadow-xs">
                  <ChevronDown className="w-2.5 h-2.5 text-amber-400 dark:text-purple-950" />
                </span>
              </button>

              <div 
                onClick={() => setHatMenuOpen((prev) => !prev)}
                className="min-w-0 cursor-pointer select-none group"
              >
                <div className="flex items-center gap-1.5">
                  <span className="font-heading font-extrabold text-sm sm:text-base md:text-lg tracking-tight text-slate-900 dark:text-white truncate">
                    Nexus Ranaji <span className="text-purple-600 dark:text-amber-400 font-extrabold">English School</span>
                  </span>
                  <span className="hidden sm:inline-block text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-700 dark:text-amber-300 border border-amber-400/20">
                    ESTD 1984
                  </span>
                </div>
                <p className="hidden md:block text-xs text-slate-500 dark:text-slate-400 font-medium tracking-normal truncate">
                  Online Examination &amp; Learning Portal
                </p>
              </div>

              {/* Clickable Hat Menu Dropdown */}
              {hatMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setHatMenuOpen(false)} 
                  />
                  <div 
                    className="absolute left-0 top-full mt-2 w-80 sm:w-88 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-100 text-left"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Institutional Header */}
                    <div className="p-3 bg-gradient-to-r from-amber-50 to-slate-50 dark:from-slate-800/80 dark:to-slate-850 rounded-xl border border-amber-200/50 dark:border-slate-700/60 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0">
                          <GraduationCap className="w-4 h-4 stroke-[2]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-serif font-bold text-slate-900 dark:text-slate-100 truncate">
                            Nexus Ranaji English School
                          </h4>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                            CBSE Affiliation #41029 &bull; Online Portal
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Current User Quick Badge */}
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
                      <UserAvatar name={currentUser.name} role={currentUser.role} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {currentUser.name}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                          {currentUser.email || currentUser.username}
                        </p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${badge.color}`}>
                        {badge.label}
                      </span>
                    </div>

                    {/* Menu Options */}
                    <div className="py-1 space-y-1">
                      {/* Option 1: View Account Details */}
                      <button
                        onClick={() => {
                          setHatMenuOpen(false);
                          setAccountDetailsOpen(true);
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-200 text-xs font-medium transition-colors cursor-pointer text-left group"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                            <User className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="font-semibold block text-slate-900 dark:text-slate-100">
                              View Account Details
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              Roll No, Class, Security &amp; Honors
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                      </button>

                      {/* Option 2: Switch User / Simulate Role */}
                      <button
                        onClick={() => {
                          setHatMenuOpen(false);
                          if (window.innerWidth < 768) {
                            setMobileSheetOpen(true);
                          } else {
                            setDropdownOpen(true);
                          }
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-200 text-xs font-medium transition-colors cursor-pointer text-left group"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                            <Users className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="font-semibold block text-slate-900 dark:text-slate-100">
                              Switch Persona / Role
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              Student &bull; Parent &bull; Faculty &bull; Admin
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                      </button>

                      {/* Option 3: Theme Toggle */}
                      <button
                        onClick={() => toggleTheme()}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-200 text-xs font-medium transition-colors cursor-pointer text-left"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                            {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-600" />}
                          </div>
                          <div>
                            <span className="font-semibold block text-slate-900 dark:text-slate-100">
                              Appearance: {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              Toggle system color scheme
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {theme === 'dark' ? 'Dark' : 'Light'}
                        </span>
                      </button>

                      {/* Option 4: Sign in with other account */}
                      <button
                        onClick={() => {
                          setHatMenuOpen(false);
                          onOpenLoginModal();
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-200 text-xs font-medium transition-colors cursor-pointer text-left group"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                            <Key className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="font-semibold block text-slate-900 dark:text-slate-100">
                              Sign In with Credentials
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              Enter password or login key
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>

                    {/* Divider & Option 5: Logout */}
                    <div className="pt-1.5 mt-1 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => {
                          setHatMenuOpen(false);
                          if (onLogout) onLogout();
                          else onOpenLoginModal();
                        }}
                        className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-semibold transition-colors cursor-pointer text-left"
                      >
                        <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                          <LogOut className="w-3.5 h-3.5" />
                        </div>
                        <span>Log Out of Current Session</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Right Action Bar & Controls */}
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              {/* Gemini Multi-Turn AI Assistant Launcher */}
              {onOpenGeminiChat && (
                <button
                  id="navbar-gemini-chat-btn"
                  onClick={onOpenGeminiChat}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border shadow-2xs cursor-pointer ${
                    isChatOpen
                      ? 'bg-amber-500 text-slate-950 border-amber-400'
                      : 'bg-amber-50 dark:bg-amber-500/10 text-amber-900 dark:text-amber-300 border-amber-200 dark:border-amber-500/30 hover:bg-amber-100 dark:hover:bg-amber-500/20'
                  }`}
                  title="Open AI Academic Study Chatbot"
                  aria-label="Open AI Academic Study Chatbot"
                >
                  <Bot className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 stroke-[1.8]" />
                  <span className="hidden sm:inline">AI Study Bot</span>
                </button>
              )}

              {/* Centralized Academic Notifications Bell */}
              <NotificationCenter
                currentUserId={currentUser.id}
                currentUserRole={currentUser.role}
                onNavigateTab={onNavigateTab}
              />

              {/* System-wide Light/Dark Toggle */}
              <button
                id="theme-toggle-btn"
                onClick={toggleTheme}
                aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
                className="flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 transition-colors text-xs cursor-pointer"
                title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              >
                {theme === 'dark' ? (
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <Moon className="w-3.5 h-3.5 text-slate-700" />
                )}
              </button>

              {/* Student Bonus Points (Desktop) */}
              {currentUser.role === 'student' && (
                <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                    {currentUser.bonusPoints ?? 100} pts
                  </span>
                </div>
              )}

              {/* Role Indicator (Desktop) */}
              <div className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${badge.color}`}>
                <BadgeIcon className="w-3.5 h-3.5 stroke-[1.8]" />
                <span>{badge.label}</span>
              </div>

              {/* User Avatar Button (YouTube-style profile button) */}
              <div className="relative">
                <button
                  id="role-switcher-button"
                  onClick={handleAvatarClick}
                  className="flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg p-1 sm:px-2 sm:py-1.5 transition-colors text-left group cursor-pointer"
                  title="Account & Role Switcher"
                  aria-label="Account and role switcher"
                >
                  <UserAvatar
                    name={currentUser.name}
                    role={currentUser.role}
                    size="sm"
                  />
                  <div className="hidden lg:block text-xs">
                    <div className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      {currentUser.name}
                    </div>
                  </div>
                  <ChevronDown className="hidden sm:block w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-transform" />
                </button>

                {/* Desktop Dropdown Menu */}
                {dropdownOpen && (
                  <div 
                    className="hidden md:block absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                        Simulate School Role (RBAC Switcher)
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Instantly preview experience for any pre-seeded persona:
                      </p>
                    </div>

                    <div className="max-h-72 overflow-y-auto py-1 space-y-1">
                      {uniqueUsers.map((user) => {
                        const userBadge = getRoleBadge(user.role);
                        const isSelected = user.id === currentUser.id;
                        return (
                          <button
                            key={user.id}
                            onClick={() => onSwitchUser(user)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-amber-500/15 border border-amber-500/40 text-amber-700 dark:text-amber-300'
                                : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-transparent'
                            }`}
                          >
                            <UserAvatar
                              name={user.name}
                              role={user.role}
                              size="sm"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold truncate">{user.name}</p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${userBadge.color}`}>
                              {userBadge.label.split(' ')[0]}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="pt-2 mt-1 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between px-2">
                      <button
                        onClick={onOpenLoginModal}
                        className="text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-medium py-1 px-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        Sign In with Credentials
                      </button>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">v2.4 Production</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* YouTube-style Mobile Account & Persona Bottom Sheet */}
      {mobileSheetOpen && (
        <div 
          className="fixed inset-0 z-50 md:hidden bg-slate-950/60 backdrop-blur-xs flex items-end animate-in fade-in duration-150"
          onClick={() => setMobileSheetOpen(false)}
        >
          <div 
            className="w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 rounded-t-3xl p-5 shadow-2xl max-h-[85vh] overflow-y-auto pb-safe animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top YouTube-style Pull Handle */}
            <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto mb-4" />

            {/* Current Account Profile Card */}
            <div className="flex items-center gap-3.5 pb-4 border-b border-slate-200 dark:border-slate-800">
              <UserAvatar
                name={currentUser.name}
                role={currentUser.role}
                size="lg"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                    {currentUser.name}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{currentUser.email || currentUser.username}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${badge.color}`}>
                    {badge.label}
                  </span>
                  {currentUser.role === 'student' && (
                    <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-bold">
                      {currentUser.bonusPoints ?? 100} pts
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setMobileSheetOpen(false)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                aria-label="Close sheet"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Switch Personas Section */}
            <div className="py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Switch User Persona
                </span>
                <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                  RBAC Preview
                </span>
              </div>

              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {uniqueUsers.map((user) => {
                  const userBadge = getRoleBadge(user.role);
                  const isSelected = user.id === currentUser.id;
                  return (
                    <button
                      key={user.id}
                      onClick={() => {
                        onSwitchUser(user);
                        setMobileSheetOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/15 border-2 border-amber-500 text-amber-900 dark:text-amber-200'
                          : 'bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/60 active:bg-slate-200 dark:active:bg-slate-700'
                      }`}
                    >
                      <UserAvatar
                        name={user.name}
                        role={user.role}
                        size="md"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate">{user.name}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border ${userBadge.color}`}>
                        {userBadge.label.split(' ')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <button
                onClick={() => {
                  setMobileSheetOpen(false);
                  onOpenLoginModal();
                }}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
                Sign In with Institutional Password
              </button>

              <div className="flex items-center justify-between px-1 text-[11px] text-slate-500 pt-1">
                <span>Theme: <strong className="capitalize">{theme} Mode</strong></span>
                <span>Nexus Ranaji English School &bull; v2.4</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Account Details Modal */}
      <AccountDetailsModal
        isOpen={accountDetailsOpen}
        onClose={() => setAccountDetailsOpen(false)}
        currentUser={currentUser}
        allUsers={allUsers}
        onSwitchUser={onSwitchUser}
        onOpenLoginModal={onOpenLoginModal}
        onLogout={() => {
          setAccountDetailsOpen(false);
          if (onLogout) onLogout();
          else onOpenLoginModal();
        }}
      />
    </>
  );
};
