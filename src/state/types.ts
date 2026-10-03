export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'overdue';

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface Task {
  id: string;
  title: string;
  notes?: string;
  category: string;
  tags: string[];
  dueDate?: string;            // YYYY-MM-DD
  dueTime?: string;            // HH:mm (24h)
  priority: TaskPriority;
  status: TaskStatus;
  reminder?: { offsetMinutes: number } | null;
  recurrence?: 'none' | 'daily' | 'weekly' | 'monthly' | 'custom';
  subtasks: Subtask[];
  createdAt: string;
  completedAt?: string;
  deletedAt?: string;          // soft delete, used by History
  archived?: boolean;
  source: 'manual' | 'voice' | 'quickadd';
}

export interface Reminder {
  id: string;
  title: string;
  date: string;
  time: string;
  repeat: 'none' | 'daily' | 'weekly' | 'monthly';
  status: 'active' | 'completed' | 'paused';
  taskId?: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  type: 'task_created' | 'task_updated' | 'task_completed' | 'task_deleted' | 'task_reopened' | 'voice_command' | 'reminder_created' | 'reminder_completed';
  title: string;
  description: string;
  timestamp: string;
  taskId?: string;
  isVoice?: boolean;
  rawVoiceText?: string;
}

export interface NotificationItem {
  id: string;
  type: 'reminder' | 'due' | 'overdue' | 'voice' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  relatedTaskId?: string;
}

export interface AppSettings {
  userName: string;
  userEmail: string;
  theme: 'light' | 'dark';
  voiceEnabled: boolean;
  voiceLanguage: string;
  voiceResponse: boolean;
  autoConfirmActions: boolean;
  voiceFeedback: boolean;
  notifyTaskReminders: boolean;
  notifyDueDates: boolean;
  notifyOverdue: boolean;
  notifyDailySummary: boolean;
  defaultPriority: TaskPriority;
  defaultReminderOffset: number;
  defaultTaskView: 'list' | 'board';
  reducedMotion: boolean;
  textScaling: 'normal' | 'large';
}

export type ScreenId =
  | 'dashboard'
  | 'tasks'
  | 'task_create'
  | 'task_details'
  | 'calendar'
  | 'voice'
  | 'reminders'
  | 'analytics'
  | 'history'
  | 'settings'
  | 'profile';

export type VoiceState =
  | 'idle'
  | 'listening'
  | 'processing'
  | 'understanding'
  | 'confirmation'
  | 'success'
  | 'error'
  | 'followup';

export interface ParsedCommand {
  intent:
    | 'create'
    | 'update'
    | 'complete'
    | 'delete'
    | 'search'
    | 'filter'
    | 'calendar'
    | 'reminders'
    | 'create_reminder'
    | 'update_reminder'
    | 'delete_reminder'
    | 'analytics'
    | 'navigation'
    | 'unknown';
  confidence: number;
  rawText: string;
  taskTitle?: string;
  dueDate?: string;
  dueTime?: string;
  priority?: TaskPriority;
  category?: string;
  tags?: string[];
  reminderMinutes?: number;
  targetTaskId?: string;
  targetReminderId?: string;
  clarificationQuestion?: string;
  navigationTarget?: ScreenId;
  analyticsMetric?: 'productivity' | 'completed' | 'overdue' | 'weekly_summary';
  searchQuery?: string;
  filterMode?: 'overdue' | 'today' | 'tomorrow' | 'completed' | 'pending' | 'priority' | 'all';
  voiceResponseText?: string;
}

export interface UndoAction {
  id: string;
  description: string;
  inverse: () => void;
  timestamp: number;
}
