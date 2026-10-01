import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  RefreshCw, 
  Trash2, 
  X, 
  Minimize2, 
  Maximize2, 
  Copy, 
  Check, 
  GraduationCap, 
  Brain, 
  BookOpen, 
  HeartHandshake, 
  Building2, 
  Zap, 
  SlidersHorizontal,
  ChevronDown,
  Plus,
  MessageSquare
} from 'lucide-react';
import { MathRenderer } from '../common/MathRenderer';
import { UserCredential, AIConversationThread } from '../../types';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  modelUsed?: string;
  timestamp: string;
  roleId?: string;
  roleName?: string;
}

interface ChatRole {
  id: string;
  name: string;
  description: string;
  defaultComplexity: 'fast' | 'general' | 'complex';
  icon: string;
  quickPrompts: string[];
}

interface ComplexityTier {
  id: 'fast' | 'general' | 'complex';
  name: string;
  model: string;
  badge: string;
  description: string;
}

interface GeminiChatbotProps {
  currentUser: UserCredential;
  isOpen?: boolean;
  onToggleOpen?: () => void;
}

const DEFAULT_ROLES: ChatRole[] = [
  {
    id: 'academic_tutor',
    name: 'Academic Tutor (GyanMitra)',
    description: 'Step-by-step textbook explanations, doubts & formula guides',
    defaultComplexity: 'general',
    icon: 'GraduationCap',
    quickPrompts: [
      "Explain Newton's Laws of Motion with real-life examples",
      'How do I solve quadratic equations using the quadratic formula?',
      'What is the difference between mitosis and meiosis?',
      'Tips to score well in English grammar and essay writing',
    ],
  },
  {
    id: 'stem_specialist',
    name: 'Deep STEM & Complex Reasoning',
    description: 'Advanced mathematics, calculus proofs & algorithms (gemini-3.1-pro-preview)',
    defaultComplexity: 'complex',
    icon: 'Brain',
    quickPrompts: [
      'Prove the Pythagorean Theorem using Euclidean geometry',
      'Derive the kinematic equation v² = u² + 2as step-by-step',
      "Explain Dijkstra's shortest path algorithm with example graph",
      'Solve this chemical reaction stoichiometry problem step-by-step',
    ],
  },
  {
    id: 'curriculum_creator',
    name: 'Faculty Curriculum & Exam Assistant',
    description: 'Assists educators with lesson plans, questions & grading rubrics',
    defaultComplexity: 'complex',
    icon: 'BookOpen',
    quickPrompts: [
      'Draft a 45-minute lesson plan for Class 10 Light Reflection',
      'Create 5 multi-tiered questions on Polynomials with solutions',
      'Design an active learning group activity for English prose',
      'Generate a grading rubric for a Science laboratory practical',
    ],
  },
  {
    id: 'parent_advisor',
    name: 'Parent Guidance & Counselor',
    description: 'Guidance on study habits, exam stress & healthy routines',
    defaultComplexity: 'general',
    icon: 'HeartHandshake',
    quickPrompts: [
      'How can I help my child prepare for board exams without stress?',
      'Strategies to reduce screen time and improve focused study habits',
      'How to effectively discuss exam performance with teachers',
      'Nutritional and sleep recommendations during exam week',
    ],
  },
  {
    id: 'school_admin',
    name: 'Institutional Administration Officer',
    description: 'Drafting of school circulars, notices & examination policies',
    defaultComplexity: 'fast',
    icon: 'Building2',
    quickPrompts: [
      'Draft a circular announcing the Mid-Term Examination schedule',
      'Compose a notice regarding upcoming parent-teacher conference (PTM)',
      'Generate institutional guidelines on examination hall conduct',
      'Draft a memo on monsoon school holiday schedule',
    ],
  },
];

const COMPLEXITY_TIERS: ComplexityTier[] = [
  {
    id: 'fast',
    name: 'Fast Mode',
    model: 'gemini-3.1-flash-lite',
    badge: '⚡ Fast (gemini-3.1-flash-lite)',
    description: 'Tasks that should happen fast (rapid lookups, definitions & quick review)',
  },
  {
    id: 'general',
    name: 'Balanced Mode',
    model: 'gemini-3.8-flash',
    badge: '⭐ General (gemini-3.8-flash)',
    description: 'General tasks (balanced tutoring, comprehensive explanations & guidance)',
  },
  {
    id: 'complex',
    name: 'Deep Reasoning Mode',
    model: 'gemini-3.1-pro-preview',
    badge: '🧠 Complex (gemini-3.1-pro-preview)',
    description: 'Particularly complex tasks (deep proofs, multi-step STEM & curriculum design)',
  },
];

export const GeminiChatbot: React.FC<GeminiChatbotProps> = ({
  currentUser,
  isOpen: controlledIsOpen,
  onToggleOpen,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const toggleChat = onToggleOpen || (() => setInternalIsOpen((prev) => !prev));

  const [isMaximized, setIsMaximized] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>('academic_tutor');
  const [taskComplexity, setTaskComplexity] = useState<'fast' | 'general' | 'complex'>('general');
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showModelMenu, setShowModelMenu] = useState(false);

  // Per-User Isolated AI Conversation Threads State (Max 3 threads per user)
  const [threads, setThreads] = useState<AIConversationThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [threadsLoading, setThreadsLoading] = useState(false);

  // Initial welcome message configured per user role
  const getInitialMessage = (roleKey: string): ChatMessage => {
    const roleDef = DEFAULT_ROLES.find((r) => r.id === roleKey) || DEFAULT_ROLES[0];
    return {
      id: 'init-1',
      role: 'model',
      content: `Hello **${currentUser.name}**! 👋\n\nI am your **${roleDef.name}** at Nexus Ranaji English School.\n\n📚 **Study-Only Policy:** Because this is an educational school application, I am strictly restricted to answering study-related questions only (syllabus, textbook concepts, formulas, homework doubts, and exam prep). Non-academic questions will not be entertained.\n\n*What academic subject, textbook concept, or exam doubt would you like to explore today?*`,
      modelUsed: 'gemini-3.5-flash',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      roleId: roleDef.id,
      roleName: roleDef.name,
    };
  };

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const initialRoleId =
      currentUser.role === 'teacher'
        ? 'curriculum_creator'
        : currentUser.role === 'parent'
        ? 'parent_advisor'
        : currentUser.role === 'superadmin'
        ? 'school_admin'
        : 'academic_tutor';

    const roleDef = DEFAULT_ROLES.find((r) => r.id === initialRoleId) || DEFAULT_ROLES[0];
    return [
      {
        id: 'init-1',
        role: 'model',
        content: `Hello **${currentUser.name}**! 👋\n\nI am your **${roleDef.name}** at Nexus Ranaji English School.\n\n📚 **Study-Only Policy:** Because this is an educational school application, I am strictly restricted to answering study-related questions only (syllabus, textbook concepts, formulas, homework doubts, and exam prep). Non-academic questions will not be entertained.\n\n*What academic subject, textbook concept, or exam doubt would you like to explore today?*`,
        modelUsed: 'gemini-3.5-flash',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        roleId: roleDef.id,
        roleName: roleDef.name,
      },
    ];
  });

  // Load User's Private Isolated Conversation Threads (Max 3 threads retained)
  const loadUserThreads = async () => {
    try {
      setThreadsLoading(true);
      const res = await fetch('/api/ai/threads', {
        headers: { 'x-user-id': currentUser.id },
      });
      if (res.ok) {
        const data = await res.json();
        const userThreads: AIConversationThread[] = data.threads || [];
        setThreads(userThreads);
        if (userThreads.length > 0) {
          // Select the first thread if activeThreadId is not set or not in current list
          setActiveThreadId((prev) => {
            const exists = userThreads.some((t) => t.id === prev);
            return exists ? prev : userThreads[0].id;
          });
        }
      }
    } catch (err) {
      console.error('Failed to load user isolated threads:', err);
    } finally {
      setThreadsLoading(false);
    }
  };

  // Sync threads on open and when user changes
  useEffect(() => {
    if (isOpen) {
      loadUserThreads();
    }
  }, [currentUser.id, isOpen]);

  // When active thread changes, update local messages view
  useEffect(() => {
    if (!activeThreadId) return;
    const currentThread = threads.find((t) => t.id === activeThreadId);
    if (currentThread && currentThread.messages && currentThread.messages.length > 0) {
      const threadMsgs: ChatMessage[] = currentThread.messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
        modelUsed: m.modelUsed || 'gemini-3.8-flash',
      }));
      setMessages(threadMsgs);
    } else {
      setMessages([getInitialMessage(selectedRole)]);
    }
  }, [activeThreadId, threads]);

  // Create a new isolated conversation thread (max 3 auto-pruned)
  const handleCreateNewThread = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/ai/threads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({
          title: 'New Academic Discussion',
          roleId: selectedRole,
          subject: 'Academic Study',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        await loadUserThreads();
        setActiveThreadId(data.thread.id);
        setMessages([getInitialMessage(selectedRole)]);
      }
    } catch (err) {
      console.error('Error creating new thread:', err);
    } finally {
      setLoading(false);
    }
  };

  // Delete an individual thread
  const handleDeleteThread = async (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/ai/threads/${threadId}`, {
        method: 'DELETE',
        headers: { 'x-user-id': currentUser.id },
      });
      if (res.ok) {
        const remaining = threads.filter((t) => t.id !== threadId);
        setThreads(remaining);
        if (activeThreadId === threadId) {
          if (remaining.length > 0) {
            setActiveThreadId(remaining[0].id);
          } else {
            setActiveThreadId(null);
            setMessages([getInitialMessage(selectedRole)]);
          }
        }
      }
    } catch (err) {
      console.error('Error deleting thread:', err);
    }
  };

  // Automatically adjust default role when currentUser changes
  useEffect(() => {
    let targetRoleId = 'academic_tutor';
    if (currentUser.role === 'teacher') targetRoleId = 'curriculum_creator';
    else if (currentUser.role === 'parent') targetRoleId = 'parent_advisor';
    else if (currentUser.role === 'superadmin') targetRoleId = 'school_admin';

    setSelectedRole(targetRoleId);
    const roleDef = DEFAULT_ROLES.find((r) => r.id === targetRoleId) || DEFAULT_ROLES[0];
    setTaskComplexity(roleDef.defaultComplexity);
  }, [currentUser.role]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Adjust role selection
  const handleSelectRole = (roleId: string) => {
    setSelectedRole(roleId);
    setShowRoleMenu(false);
    const roleDef = DEFAULT_ROLES.find((r) => r.id === roleId);
    if (roleDef) {
      setTaskComplexity(roleDef.defaultComplexity);
      // Add announcement message into thread
      const systemAnnouncement: ChatMessage = {
        id: `role-change-${Date.now()}`,
        role: 'model',
        content: `*Switched role to **${roleDef.name}** (${COMPLEXITY_TIERS.find((t) => t.id === roleDef.defaultComplexity)?.badge}). How can I assist you in this domain?*`,
        modelUsed: COMPLEXITY_TIERS.find((t) => t.id === roleDef.defaultComplexity)?.model || 'gemini-3.5-flash',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        roleId: roleDef.id,
        roleName: roleDef.name,
      };
      setMessages((prev) => [...prev, systemAnnouncement]);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Update conversation thread with user message
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputMessage('');
    setLoading(true);

    try {
      // Build conversation history payload preserving all past turns
      const historyPayload = updatedMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      let res: Response;
      if (activeThreadId) {
        res = await fetch(`/api/ai/threads/${activeThreadId}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': currentUser.id,
          },
          body: JSON.stringify({
            message: text,
            taskComplexity,
            roleId: selectedRole,
          }),
        });
      } else {
        res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': currentUser.id,
          },
          body: JSON.stringify({
            message: text,
            history: historyPayload,
            roleId: selectedRole,
            taskComplexity,
            userContext: {
              name: currentUser.name,
              role: currentUser.role,
              className: currentUser.classId || 'Standard 10',
            },
          }),
        });
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || errData.details || `Server responded with status ${res.status}`);
      }

      const data = await res.json();
      const botMsgContent = data.message?.content || data.reply || 'I received your query. Please let me know if you need any clarification!';

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'model',
        content: botMsgContent,
        modelUsed: data.message?.modelUsed || data.modelUsed || (taskComplexity === 'complex' ? 'gemini-3.1-pro-preview' : taskComplexity === 'fast' ? 'gemini-3.1-flash-lite' : 'gemini-3.5-flash'),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        roleId: data.roleId || selectedRole,
        roleName: data.roleName,
      };

      setMessages((prev) => [...prev, botMsg]);
      // Refresh thread listing so titles update
      if (activeThreadId) {
        loadUserThreads();
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      const fallbackMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        content: `⚠️ **Connection Notice:** ${err.message || 'Unable to communicate with Gemini service.'}\n\nPlease verify network connection or try again in a moment.`,
        modelUsed: 'offline-fallback',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleClearHistory = () => {
    if (window.confirm('Reset this conversation thread and clear chat history?')) {
      setMessages([getInitialMessage(selectedRole)]);
    }
  };

  const currentRoleDef = DEFAULT_ROLES.find((r) => r.id === selectedRole) || DEFAULT_ROLES[0];
  const currentComplexityDef = COMPLEXITY_TIERS.find((t) => t.id === taskComplexity) || COMPLEXITY_TIERS[1];

  const getRoleIcon = (iconName: string) => {
    switch (iconName) {
      case 'Brain':
        return <Brain className="w-4 h-4 text-purple-400" />;
      case 'BookOpen':
        return <BookOpen className="w-4 h-4 text-emerald-400" />;
      case 'HeartHandshake':
        return <HeartHandshake className="w-4 h-4 text-rose-400" />;
      case 'Building2':
        return <Building2 className="w-4 h-4 text-blue-400" />;
      default:
        return <GraduationCap className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <>
      {/* Floating Launcher Action Pill with mobile navigation clearance */}
      {!isOpen && (
        <button
          id="open-gemini-chat-btn"
          onClick={toggleChat}
          className="fixed bottom-20 md:bottom-6 right-3 sm:right-6 z-40 flex items-center gap-2 px-3 sm:px-3.5 py-2 sm:py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded-full shadow-lg shadow-amber-500/20 hover:scale-105 transition-all duration-200 border border-amber-300/40 cursor-pointer"
          title="Open AI Academic Study Chatbot"
          aria-label="Open AI Academic Study Chatbot"
        >
          <div className="relative flex items-center justify-center">
            <Bot className="w-4 h-4 text-slate-950 stroke-[2]" />
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-500 rounded-full" />
          </div>
          <span className="font-medium tracking-tight">AI Study Bot</span>
        </button>
      )}

      {/* Chat Window / Drawer / Modal - YouTube Style Bottom Sheet on Mobile */}
      {isOpen && (
        <div
          id="gemini-chatbot-window"
          className={`fixed z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col transition-all duration-200 ${
            isMaximized
              ? 'inset-2 sm:inset-4 md:inset-8 rounded-2xl'
              : 'bottom-0 inset-x-0 sm:inset-x-auto sm:bottom-6 sm:right-6 w-full sm:w-[480px] md:w-[540px] h-[88vh] sm:h-[640px] max-h-[92vh] rounded-t-3xl sm:rounded-2xl pb-safe sm:pb-0'
          }`}
        >
          {/* Mobile Sheet Handle */}
          <div className="w-10 h-1 rounded-full bg-slate-400/50 mx-auto mt-2 mb-0.5 sm:hidden" />

          {/* Header Bar */}
          <div className="px-4 py-3 sm:py-3.5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-t-3xl sm:rounded-t-2xl border-b border-slate-700/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-slate-950 flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
                <Bot className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-serif font-bold text-xs sm:text-sm tracking-tight text-white truncate">
                    Nexus Academic Study AI
                  </h3>
                  <span className="px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Study Only
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">
                  Strictly Academic &bull; Roles: {currentRoleDef.name.split(' ')[0]}
                </p>
              </div>
            </div>

            {/* Window Controls */}
            <div className="flex items-center gap-1.5 shrink-0 text-slate-400">
              <button
                onClick={handleClearHistory}
                className="p-1.5 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                title="Clear conversation history"
                aria-label="Clear chat history"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsMaximized(!isMaximized)}
                className="p-1.5 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                title={isMaximized ? 'Restore window' : 'Maximize window'}
                aria-label={isMaximized ? 'Restore window' : 'Maximize window'}
              >
                {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={toggleChat}
                className="p-1.5 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                title="Close chat"
                aria-label="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Isolated Private Threads Bar (Max 3 Threads Auto-pruned per user) */}
          <div className="px-3 py-1.5 bg-slate-900 text-slate-300 border-b border-slate-800 flex items-center justify-between gap-2 overflow-x-auto text-[11px]">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] uppercase font-bold text-amber-500 tracking-wider">
                My Chats (Max 3):
              </span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {threads.map((t, idx) => (
                <div
                  key={t.id}
                  onClick={() => setActiveThreadId(t.id)}
                  className={`group flex items-center gap-1.5 px-2.5 py-1 rounded-lg cursor-pointer transition-all ${
                    activeThreadId === t.id
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                      : 'bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white'
                  }`}
                >
                  <MessageSquare className="w-3 h-3 shrink-0" />
                  <span className="truncate max-w-[90px] sm:max-w-[120px]">
                    {t.title || `Chat #${idx + 1}`}
                  </span>
                  <button
                    onClick={(e) => handleDeleteThread(t.id, e)}
                    className="opacity-60 hover:opacity-100 hover:text-rose-400 p-0.5"
                    title="Delete thread"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}
              <button
                onClick={handleCreateNewThread}
                disabled={loading}
                className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg font-bold flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                title="Start new isolated conversation (max 3 retained)"
              >
                <Plus className="w-3 h-3" />
                <span>New</span>
              </button>
            </div>
          </div>

          {/* Role & Model Selector Control Strip */}
          <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-2 text-xs">
            {/* Role Dropdown */}
            <div className="relative">
              <button
                id="role-selector-btn"
                onClick={() => {
                  setShowRoleMenu(!showRoleMenu);
                  setShowModelMenu(false);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-amber-500/50 text-slate-800 dark:text-slate-200 font-medium transition-all"
              >
                {getRoleIcon(currentRoleDef.icon)}
                <span className="font-semibold">{currentRoleDef.name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
              </button>

              {showRoleMenu && (
                <div 
                  className="absolute left-0 top-full mt-1 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95"
                  onClick={() => setShowRoleMenu(false)}
                >
                  <div className="px-2.5 py-1.5 border-b border-slate-200 dark:border-slate-800">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-amber-600 dark:text-amber-400">
                      Select Chatbot Role & System Instruction
                    </p>
                  </div>
                  <div className="space-y-1 py-1 max-h-64 overflow-y-auto">
                    {DEFAULT_ROLES.map((role) => (
                      <button
                        key={role.id}
                        onClick={() => handleSelectRole(role.id)}
                        className={`w-full flex items-start gap-2.5 p-2 rounded-lg text-left transition-colors ${
                          selectedRole === role.id
                            ? 'bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-transparent'
                        }`}
                      >
                        <div className="mt-0.5">{getRoleIcon(role.icon)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-xs leading-snug">{role.name}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                            {role.description}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Model / Complexity Selector */}
            <div className="relative">
              <button
                id="model-tier-btn"
                onClick={() => {
                  setShowModelMenu(!showModelMenu);
                  setShowRoleMenu(false);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono text-[11px] font-semibold transition-all ${
                  taskComplexity === 'complex'
                    ? 'bg-purple-500/10 border-purple-500/40 text-purple-700 dark:text-purple-300'
                    : taskComplexity === 'fast'
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                    : 'bg-amber-500/10 border-amber-500/40 text-amber-700 dark:text-amber-300'
                }`}
                title="Choose Model Mode: Fast (3.1-flash-lite), General (3.5-flash), or Complex (3.1-pro-preview)"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{currentComplexityDef.badge}</span>
                <ChevronDown className="w-3 h-3 ml-0.5 opacity-70" />
              </button>

              {showModelMenu && (
                <div 
                  className="absolute right-0 top-full mt-1 w-84 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95"
                  onClick={() => setShowModelMenu(false)}
                >
                  <div className="px-2.5 py-1.5 border-b border-slate-200 dark:border-slate-800">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-amber-600 dark:text-amber-400">
                      Gemini Model Routing & Task Complexity
                    </p>
                  </div>
                  <div className="space-y-1 py-1">
                    {COMPLEXITY_TIERS.map((tier) => (
                      <button
                        key={tier.id}
                        onClick={() => {
                          setTaskComplexity(tier.id);
                          setShowModelMenu(false);
                        }}
                        className={`w-full flex items-start gap-2.5 p-2 rounded-lg text-left transition-colors ${
                          taskComplexity === tier.id
                            ? 'bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-transparent'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-xs">{tier.name}</span>
                            <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
                              {tier.model}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                            {tier.description}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Scrollable Message Thread */}
          <div
            id="chat-message-thread"
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-950/50"
          >
            {messages.map((msg) => {
              const isUser = msg.role === 'user';

              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold ${
                      isUser
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-sm'
                    }`}
                  >
                    {isUser ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Bot className="w-4 h-4" />
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 shadow-xs text-xs sm:text-sm leading-relaxed ${
                      isUser
                        ? 'bg-amber-500 text-slate-950 font-medium rounded-tr-xs'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-xs'
                    }`}
                  >
                    {/* Model & Role Header for Assistant */}
                    {!isUser && (
                      <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {msg.roleName || currentRoleDef.name}
                          </span>
                          {msg.modelUsed && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[9px] text-amber-600 dark:text-amber-400">
                              {msg.modelUsed}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleCopyText(msg.id, msg.content)}
                          className="p-1 hover:text-amber-500 transition-colors flex items-center gap-1"
                          title="Copy response text"
                        >
                          {copiedMessageId === msg.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-500" />
                              <span className="text-[9px] text-emerald-500">Copied</span>
                            </>
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    )}

                    {/* Content */}
                    <MathRenderer 
                      content={msg.content} 
                      className={`text-xs sm:text-sm leading-relaxed ${
                        isUser ? 'text-slate-950 font-medium' : 'text-slate-800 dark:text-slate-200'
                      }`} 
                    />

                    {/* Timestamp */}
                    <div
                      className={`text-[9px] mt-1.5 flex items-center ${
                        isUser ? 'text-slate-900/70 justify-end' : 'text-slate-400 justify-end'
                      }`}
                    >
                      {msg.timestamp}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Active Generation Indicator */}
            {loading && (
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 flex items-center justify-center shrink-0 shadow-sm">
                  <Bot className="w-4 h-4 animate-bounce text-slate-950" />
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl rounded-tl-xs p-3.5 shadow-xs text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce [animation-delay:0.4s]" />
                  <span className="ml-1 text-[11px] font-mono">
                    Nexus Study AI is preparing your academic answer...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggested Prompts Chips */}
          <div className="px-3 py-2 bg-slate-100/80 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold shrink-0">
              Suggestions:
            </span>
            {currentRoleDef.quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                disabled={loading}
                className="shrink-0 px-2.5 py-1 rounded-full text-[11px] bg-white dark:bg-slate-900 hover:bg-amber-50 dark:hover:bg-amber-950/30 border border-slate-200 dark:border-slate-700 hover:border-amber-400/60 text-slate-700 dark:text-slate-300 transition-all truncate max-w-[280px]"
                title={prompt}
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 rounded-b-2xl">
            <div className="flex items-end gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus-within:border-amber-500 rounded-xl p-2 transition-colors">
              <textarea
                ref={textareaRef}
                id="gemini-chat-input"
                rows={2}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Ask ${currentRoleDef.name.split(' ')[0]} about studies (e.g. "Explain formula step-by-step...")`}
                disabled={loading}
                className="flex-1 bg-transparent border-0 focus:outline-none resize-none text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 leading-relaxed"
              />

              <button
                id="send-gemini-chat-btn"
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || loading}
                className="p-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 text-slate-950 rounded-lg transition-all shadow-xs cursor-pointer disabled:cursor-not-allowed"
                title="Send message (Enter)"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 px-1 pt-1.5">
              <span>Press <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700">Enter</kbd> to send</span>
              <span className="font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                <Bot className="w-3 h-3" /> Strictly Academic &amp; Study Topics Only
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
