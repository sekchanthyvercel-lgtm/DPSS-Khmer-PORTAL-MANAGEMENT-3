
// Shared types for the application

export type StudyType = 'FullTime' | 'PartTime' | 'Khmer';

export type StudentCategory = 'Hall' | 'Class' | 'Office' | 'Card' | 'Queue' | 'Penalty' | 'DailyTask' | 'Reminder';

export type UserRole = 'Admin' | 'Teacher' | 'Finance';

export interface ColumnConfig {
  id: string;
  key: string;
  label: string;
  width: number;
  visible: boolean;
  type: 'text' | 'date' | 'boolean' | 'select';
}

export interface CurrentUser {
  name: string;
  role: UserRole;
}

export interface PhotoAdjust {
  x: number;
  y: number;
  scale: number;
}

export interface Student {
  id: string;
  name: string;
  category: StudentCategory;
  order: number;
  isHidden?: boolean;
  deletedAt?: string;
  parentContact?: boolean;
  headTeacher?: boolean;
  photo?: string;
  photoAdjust?: PhotoAdjust;
  thumbprintNotes?: string;
  [key: string]: any; // Support for dynamic columns
}

export interface AppSettings {
  fontSize: number;
  fontFamily: string;
  columns?: ColumnConfig[];
  backgroundImage?: string;
}

export interface ModuleLocks {
  Hall: boolean;
  Attendance: boolean;
  Finance: boolean;
}

export type NeuralEngine = string;
export interface QuickSource { data: string; mimeType: string; }
export interface OutlineItem { id: string; title: string; expanded: boolean; children: OutlineItem[]; }
export type ExternalKeys = Record<string, string>;

/**
 * Interface for staff contact information (phone and telegram).
 */
export interface StaffDirectory {
  [name: string]: {
    phone?: string;
    telegram?: string;
  };
}

/**
 * Interface representing a single chat message in AI Studio.
 */
export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  image?: string;
}

/**
 * Interface representing a saved chat session in AI Studio.
 */
export interface ChatSession {
  id: string;
  title: string;
  timestamp: string;
  messages: ChatMessage[];
}

export interface ContentBlock {
  id: string;
  type: 'text' | 'table' | 'image' | 'file' | 'date';
  data: any;
}

export interface DPSSTopic {
  id: string;
  title: string;
  content: string;
  alignment: 'left' | 'center' | 'right';
  children?: DPSSTopic[];
}

export interface AppData {
  students: Student[];
  settings?: AppSettings;
  attendance: Record<string, Record<string, number>>;
  dailyTasks?: Record<string, Record<string, string>>;
  dpssTopics?: DPSSTopic[];
  systemLocked?: boolean;
  moduleLocks?: ModuleLocks;
  idCounters?: Record<string, number>;
  schoolLogo?: string;
  staffDirectory?: StaffDirectory;
}

export interface BackupEntry {
  id: string;
  timestamp: string;
  data: AppData;
  type: 'Auto' | 'Manual';
}

export enum Tab {
  Hall = 'Hall',
  Hall2 = 'Hall2',
  Penalty = 'Penalty',
  DailyTask = 'DailyTask',
  Reminder = 'Reminder',
  DPSS = 'DPSS',
  Attendance = 'Attendance',
  Finance = 'Finance',
  StudentCard = 'StudentCard',
  Dashboard = 'Dashboard',
  Maintenance = 'Maintenance',
  RecycleBin = 'RecycleBin'
}

export type ViewMode = 'Default' | 'Minimalist';

export interface FilterState {
  searchQuery: string; 
  teacher: string;
  assistant: string;
  time: string;
  level: string;
  behavior: string;
  deadline: string;
  showHidden: boolean;
}
