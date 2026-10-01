export type UserRole = 'superadmin' | 'teacher' | 'student' | 'parent';

export interface UserCredential {
  id: string;
  name: string;
  email?: string;
  role: UserRole;
  username?: string;
  password?: string;
  createdAt: string;
  // Specific role metadata
  classId?: string;
  className?: string;
  divisionId?: string;
  divisionName?: string;
  rollNo?: string;
  parentId?: string;
  childrenIds?: string[];
  phone?: string;
  employeeId?: string;
  assignedSubjects?: { classId: string; divisionId: string; subjectId: string }[];
  bonusPoints?: number;
}

export interface AcademicYear {
  id: string;
  name: string; // e.g. "2025-2026"
  isCurrent: boolean;
}

export interface SchoolClass {
  id: string;
  name: string; // e.g. "Standard 10", "Standard 9"
  level: number;
  archived?: boolean;
}

export interface Division {
  id: string;
  classId: string;
  name: string; // e.g. "A", "B"
  roomNumber?: string;
  archived?: boolean;
}

export interface ClassSubjectMapping {
  classId: string;
  subjectId: string;
}

export interface Subject {
  id: string;
  name: string; // e.g. "Mathematics", "Science & Physics"
  code: string; // e.g. "MATH-101"
  icon?: string;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  modelUsed?: string;
  suggestedFollowUps?: string[];
}

export interface AIConversationThread {
  id: string;
  userId: string;
  title: string;
  roleId: string;
  subject?: string;
  createdAt: string;
  updatedAt: string;
  messages: AIMessage[];
}

export interface TestTopPerformer {
  rank: number;
  studentId: string;
  studentName: string;
  rollNo: string;
  score: number;
  totalMarks: number;
  percentage: number;
}

export type QuestionType = 'single' | 'multi' | 'true_false';

export interface QuestionOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options: QuestionOption[];
  // In student testing mode, correctAnswer and explanation are stripped by backend
  correctAnswer?: string | string[] | boolean; 
  explanation?: string;
  points: number;
  imageUrl?: string;
  subjectId?: string;
  classId?: string;
  chapterName?: string;
  inQuestionBank?: boolean;
}

export type ExamStatus = 'draft' | 'published' | 'completed';

export interface Exam {
  id: string;
  title: string;
  description?: string;
  subjectId: string;
  subjectName: string;
  classId: string;
  className: string;
  divisionId: string;
  divisionName: string;
  targetClassId?: string;
  targetDivisionId?: string;
  teacherId: string;
  teacherName: string;
  status: ExamStatus;
  startTime: string; // ISO string availability window start
  endTime: string;   // ISO string availability window end
  durationMinutes: number; // e.g. 30 mins
  passingScore: number;    // e.g. 50 (percentage)
  totalMarks: number;
  questionCount: number;
  questions?: Question[];
  createdAt: string;
}

export interface CheatingLog {
  violationCount: number;
  blurTimestamps: string[];
  reason?: string;
}

export interface ExamSubmission {
  id: string;
  examId: string;
  examTitle: string;
  subjectId?: string;
  subjectName: string;
  studentId: string;
  studentName: string;
  studentRollNo: string;
  classId: string;
  divisionId: string;
  answers: Record<string, any>; // questionId -> selected answer(s)
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  bonusPointsAwarded: number;
  submittedAt: string;
  timeSpentMinutes?: number;
  cheatingFlagged: boolean;
  cheatingDetails?: CheatingLog;
  rescheduled?: boolean;
}

export interface StudyMaterial {
  id: string;
  title: string;
  description: string;
  subjectId: string;
  subjectName: string;
  classId: string;
  className: string;
  divisionId: string;
  divisionName: string;
  teacherId: string;
  teacherName: string;
  type: 'file' | 'link';
  url: string;
  fileName?: string;
  fileSize?: string;
  createdAt: string;
}

export type TicketStatus = 'Open' | 'In Progress' | 'Resolved';

export interface TicketReply {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  message: string;
  timestamp: string;
}

export interface SupportTicket {
  id: string;
  parentId: string;
  parentName: string;
  studentId: string;
  studentName: string;
  studentClass: string;
  subject: string;
  category: 'Exam Grievance' | 'Score Inquiry' | 'Technical Issue' | 'General Query';
  message: string;
  status: TicketStatus;
  priority: 'low' | 'medium' | 'high';
  recipientName?: string;
  assignedTeacherId?: string;
  assignedTeacherName?: string;
  createdAt: string;
  updatedAt: string;
  replies: TicketReply[];
}

export interface SchoolStats {
  totalStudents: number;
  totalTeachers: number;
  totalParents: number;
  totalClasses: number;
  totalExams: number;
  activeExams: number;
  totalSubmissions: number;
  avgPassRate: number;
  flaggedCheatersCount: number;
}

// Rolling Audit Queues
export interface LoginAuditLog {
  id: string;
  timestamp: string;
  userId?: string;
  userName: string;
  email?: string;
  role: string;
  identifier: string;
  ipAddress: string;
  userAgent: string;
  status: 'Success' | 'Failed';
  failureReason?: string;
}

export interface CheatingAuditLog {
  id: string;
  timestamp: string;
  studentId: string;
  studentName: string;
  studentRollNo: string;
  examId: string;
  examTitle: string;
  violationCount: number;
  actionTaken: 'Warning 1' | 'Warning 2' | 'Flagged & Force-Submitted' | 'Window Blur Recorded';
  details: string;
}

export interface DeletedCredentialLog {
  id: string;
  timestamp: string;
  deletedUserId: string;
  deletedUserName: string;
  deletedUserEmail?: string;
  deletedRole?: string;
  role: UserRole;
  identifier: string; // rollNo, employeeId, or phone
  deletedBy: string; // Super Admin name
  deletedByAdminName?: string;
  reason?: string;
}

// Notice Board (Latest 4 messages auto-pruned)
export interface SchoolNotice {
  id: string;
  title: string;
  content: string;
  category: 'Exam Schedule' | 'Urgent Alert' | 'Academic Notice' | 'General Announcement';
  targetAudience: 'All' | 'Students' | 'Parents';
  authorName: string;
  authorRole: 'superadmin' | 'teacher';
  createdAt: string;
}

// Badge & Academic Standing Rules
export interface TestBadgeRule {
  id: string;
  name: string;
  minPercentage: number;
  description: string;
  iconName: string;
}

export interface OverallBadgeRule {
  id: string;
  name: string;
  criteriaType: 'bonusPoints' | 'averageScore' | 'topRank';
  thresholdValue: number;
  description: string;
  iconName: string;
}

export interface AcademicStandingTier {
  id: string;
  tierName: string; // e.g. "Summa Cum Laude / High Distinction"
  minAveragePercentage: number; // e.g. 90
  color: string;
  badgeLabel: string;
}

export interface AcademicConfig {
  testBadges: TestBadgeRule[];
  overallBadges: OverallBadgeRule[];
  standingTiers: AcademicStandingTier[];
}

export interface QuestionChapter {
  id: string;
  name: string;
  classId: string;
  subjectId: string;
}

export type NotificationCategory = 'result' | 'deadline' | 'announcement';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  category: NotificationCategory;
  timestamp: string;
  read: boolean;
  targetRole?: 'all' | 'student' | 'parent' | 'teacher' | 'superadmin';
  targetUserId?: string;
  linkTab?: string; // 'exams' | 'submissions' | 'materials' | 'helpdesk' | 'notices'
  linkId?: string; // examId, ticketId, noticeId
  metadata?: {
    score?: number;
    totalMarks?: number;
    percentage?: number;
    subjectName?: string;
    dueDate?: string;
    teacherName?: string;
    urgency?: 'normal' | 'high' | 'urgent';
  };
}
