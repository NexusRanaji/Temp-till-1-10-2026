import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  BookOpen, 
  AlertCircle, 
  RefreshCw, 
  Trash2, 
  HelpCircle,
  CheckCircle2,
  Atom,
  Compass,
  Lightbulb
} from 'lucide-react';
import { MathRenderer } from '../common/MathRenderer';
import { UserCredential } from '../../types';

interface Message {
  id: string;
  sender: 'student' | 'tutor';
  text: string;
  isAcademic?: boolean;
  suggestedFollowUps?: string[];
  timestamp: string;
}

interface StudentAIChatbotProps {
  currentUser: UserCredential;
}

const PRESET_SUBJECTS = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'English Grammar & Lit',
  'Computer Science',
  'Social Studies / History',
];

const STARTER_PROMPTS = [
  'Explain Newton\'s Third Law with real-life daily examples',
  'How do I solve quadratic equations using the quadratic formula?',
  'What is the difference between mitosis and meiosis?',
  'Explain the process of photosynthesis step-by-step',
  'What is Ohm\'s Law and how do I calculate resistance in parallel circuits?',
];

export const StudentAIChatbot: React.FC<StudentAIChatbotProps> = ({ currentUser }) => {
  const [subject, setSubject] = useState<string>('Mathematics');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init-1',
      sender: 'tutor',
      text: `Hello ${currentUser.name}! I am your Nexus Ranaji Academic AI Study Assistant. You can ask me any doubts regarding your chapters, concepts, formulas, or homework problems in ${subject}. Please note that I am strictly restricted to academic study topics. What would you like to learn today?`,
      isAcademic: true,
      suggestedFollowUps: [
        'Review important formulas for exams',
        'Explain key definitions of this chapter',
        'Give me a practice conceptual question'
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isTyping) return;

    setErrorNotice(null);
    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: 'student',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsTyping(true);

    try {
      // Build conversation history for context with both text and content keys
      const history = messages.slice(-6).map((m) => ({
        role: m.sender === 'student' ? 'user' : 'model',
        text: m.text,
        content: m.text,
      }));

      const res = await fetch('/api/ai/study-tutor', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({
          message: query,
          studentClass: currentUser.classId || 'Standard 10',
          subject: subject,
          history: history,
        }),
      });

      if (!res.ok) {
        throw new Error('Could not retrieve tutor response');
      }

      const data = await res.json();
      const tutorMsg: Message = {
        id: `tutor-${Date.now()}`,
        sender: 'tutor',
        text: data.reply || 'Let us review this concept together.',
        isAcademic: data.isAcademic,
        suggestedFollowUps: data.suggestedFollowUps || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, tutorMsg]);
    } catch (err: any) {
      console.error('AI Tutor Query failed:', err);
      setErrorNotice('The AI Study Assistant is temporarily experiencing high load. Please try again.');
      const fallbackMsg: Message = {
        id: `tutor-err-${Date.now()}`,
        sender: 'tutor',
        text: 'I apologize, but I encountered a momentary connection issue with the study service. Please re-ask your academic question.',
        isAcademic: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `init-${Date.now()}`,
        sender: 'tutor',
        text: `Conversation cleared. What chapter or topic would you like to study in ${subject}?`,
        isAcademic: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-lg flex flex-col h-[700px]">
      {/* Header */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-transparent border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif font-bold text-slate-900 dark:text-slate-100 text-base">
                Nexus AI Academic Study Tutor
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                Study Only
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Strictly restricted to school syllabus, academic doubts, and homework concept guidance.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Subject Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <BookOpen className="w-3.5 h-3.5 text-amber-500" />
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
            >
              {PRESET_SUBJECTS.map((s) => (
                <option key={s} value={s} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                  {s}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleClearChat}
            className="p-2 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Clear Chat History"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Safety Notice Banner */}
      <div className="bg-amber-500/5 dark:bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center justify-between text-[11px] text-amber-800 dark:text-amber-300">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>
            Institutional Guardrails: Non-academic queries (games, social media, entertainment) will be declined.
          </span>
        </div>
        <span className="text-[10px] uppercase font-mono opacity-80">CBSE / State Aligned</span>
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-slate-950/40">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.sender === 'student' ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-end gap-2 max-w-[85%] sm:max-w-[75%]">
              {m.sender === 'tutor' && (
                <div className="w-7 h-7 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mb-1">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`p-4 rounded-2xl text-xs leading-relaxed shadow-sm ${
                  m.sender === 'student'
                    ? 'bg-amber-500 text-slate-950 font-medium rounded-br-none'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none'
                }`}
              >
                {/* Non-academic query flag alert */}
                {m.sender === 'tutor' && m.isAcademic === false && (
                  <div className="mb-2 flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-bold text-[10px] uppercase tracking-wider">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Academic Restriction Enforced
                  </div>
                )}

                <MathRenderer 
                  content={m.text} 
                  className={`text-xs leading-relaxed ${
                    m.sender === 'student' ? 'text-slate-950 font-medium' : 'text-slate-800 dark:text-slate-200'
                  }`} 
                />

                <div className="mt-2 text-[10px] opacity-70 text-right">
                  {m.timestamp}
                </div>
              </div>
            </div>

            {/* Suggested Follow-Ups */}
            {m.sender === 'tutor' && m.suggestedFollowUps && m.suggestedFollowUps.length > 0 && (
              <div className="mt-2.5 ml-9 flex flex-wrap gap-1.5 max-w-[85%]">
                {m.suggestedFollowUps.map((prompt, pIdx) => (
                  <button
                    key={pIdx}
                    onClick={() => handleSendMessage(prompt)}
                    className="text-[11px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 hover:bg-amber-500/5 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-full transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Lightbulb className="w-3 h-3 text-amber-500" />
                    <span>{prompt}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-2 text-slate-400 text-xs py-2 ml-9">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-500" />
            <span>Analyzing study concept and formulating response...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Starter Doubts */}
      {messages.length <= 2 && (
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto">
          <span className="text-[11px] font-semibold text-slate-400 shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" /> Quick Ask:
          </span>
          {STARTER_PROMPTS.map((starter, sIdx) => (
            <button
              key={sIdx}
              onClick={() => handleSendMessage(starter)}
              className="text-[10px] whitespace-nowrap bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500 px-2.5 py-1 rounded-full text-slate-700 dark:text-slate-300 transition-colors"
            >
              {starter}
            </button>
          ))}
        </div>
      )}

      {/* Error Notice */}
      {errorNotice && (
        <div className="bg-rose-500/10 border-t border-rose-500/20 px-4 py-2 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorNotice}</span>
        </div>
      )}

      {/* Input Form */}
      <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder={`Ask a doubt in ${subject} (e.g., "Explain how photosynthesis works")...`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isTyping}
            className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500 disabled:opacity-50 transition-colors"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || isTyping}
            className="px-5 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-2xl transition-all disabled:opacity-40 flex items-center gap-1.5 cursor-pointer shadow-sm shadow-amber-500/20"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send Doubt</span>
          </button>
        </form>
      </div>
    </div>
  );
};
