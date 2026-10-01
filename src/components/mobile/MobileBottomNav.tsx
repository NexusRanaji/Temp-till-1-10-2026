import React from 'react';
import { 
  Clock, 
  BookOpen, 
  Award, 
  Bot, 
  Bell, 
  FileText, 
  CheckCircle2, 
  Database, 
  Users, 
  BarChart3, 
  Key, 
  Building2, 
  ShieldAlert, 
  FolderDown, 
  MessageSquare,
  Sparkles,
  Home
} from 'lucide-react';
import { UserCredential } from '../../types';

interface MobileBottomNavProps {
  currentUser: UserCredential;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenChat: () => void;
  isChatOpen: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentUser,
  activeTab,
  onTabChange,
  onOpenChat,
  isChatOpen,
}) => {
  // Determine tabs per user role
  const getNavItems = () => {
    switch (currentUser.role) {
      case 'student':
        return [
          { id: 'home', label: 'Desk', icon: Home },
          { id: 'exams', label: 'Exams', icon: Clock },
          { id: 'materials', label: 'Notes', icon: FolderDown },
          { id: 'achievements', label: 'Honors', icon: Award },
          { id: 'chatbot', label: 'AI Tutor', icon: Bot, isAITutor: true },
          { id: 'notices', label: 'Notices', icon: Bell },
        ];
      case 'teacher':
        return [
          { id: 'home', label: 'Home', icon: Home },
          { id: 'exams', label: 'Exams', icon: FileText },
          { id: 'submissions', label: 'Grading', icon: CheckCircle2 },
          { id: 'students', label: 'Students', icon: Users },
          { id: 'materials', label: 'Notes', icon: FolderDown },
          { id: 'tickets', label: 'Helpdesk', icon: MessageSquare },
        ];
      case 'superadmin':
        return [
          { id: 'home', label: 'Home', icon: Home },
          { id: 'stats', label: 'Analytics', icon: BarChart3 },
          { id: 'credentials', label: 'Accounts', icon: Key },
          { id: 'academic', label: 'Academics', icon: Building2 },
          { id: 'audits', label: 'Audits', icon: ShieldAlert },
          { id: 'notices', label: 'Notices', icon: Bell },
        ];
      case 'parent':
        return [
          { id: 'home', label: 'Home', icon: Home },
          { id: 'overview', label: 'Ward', icon: Users },
          { id: 'submissions', label: 'Scores', icon: Award },
          { id: 'materials', label: 'Notes', icon: FolderDown },
          { id: 'helpdesk', label: 'Helpdesk', icon: MessageSquare },
          { id: 'notices', label: 'Notices', icon: Bell },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();
  if (navItems.length === 0) return null;

  return (
    <nav 
      aria-label="Mobile Bottom Navigation"
      className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800/90 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.4)] pb-safe transition-colors"
    >
      <div className="flex items-center justify-around h-14 max-w-lg mx-auto px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => {
                onTabChange(item.id);
                // If it is student's chatbot, keep chat experience intuitive
                if (item.isAITutor && !isChatOpen && activeTab !== 'chatbot') {
                  // User selected AI Tutor tab
                }
              }}
              className={`flex-1 flex flex-col items-center justify-center h-full py-1 px-1 transition-all active:scale-95 cursor-pointer relative ${
                isActive
                  ? 'text-amber-600 dark:text-amber-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {/* Active top indicator pill */}
              {isActive && (
                <span className="absolute top-0 w-8 h-0.5 rounded-full bg-amber-500 dark:bg-amber-400" />
              )}

              <div className="relative">
                <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-amber-600 dark:text-amber-400 stroke-[2.2]' : 'stroke-[1.5]'}`} />
                {item.id === 'chatbot' && (
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-amber-500" />
                )}
              </div>

              <span className={`text-[10px] tracking-tight mt-1 ${isActive ? 'font-semibold text-amber-600 dark:text-amber-400' : 'font-normal text-slate-500 dark:text-slate-400'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
