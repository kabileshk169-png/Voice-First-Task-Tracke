import React, { createContext, useContext, useReducer, useEffect, useState, ReactNode } from 'react';
import {
  Task,
  Reminder,
  ActivityLog,
  NotificationItem,
  AppSettings,
  ScreenId,
  UndoAction,
  TaskPriority,
  TaskStatus,
} from './types';
import {
  initialTasks,
  initialReminders,
  initialActivities,
  initialNotifications,
  initialSettings,
} from '../data/demoData';
import { loadStoredData, saveStoredData, clearStoredData } from '../lib/storage';
import { getDaysOffsetISO, isOverdue } from '../lib/dates';
import { playFeedbackTone } from '../lib/speech';

export interface ToastItem {
  id: string;
  message: string;
  type?: 'success' | 'info' | 'error';
  undoAction?: () => void;
  undoLabel?: string;
  duration?: number;
}

interface AppState {
  currentScreen: ScreenId;
  tasks: Task[];
  reminders: Reminder[];
  activities: ActivityLog[];
  notifications: NotificationItem[];
  settings: AppSettings;
  selectedTaskId: string | null;
  isQuickAddOpen: boolean;
  quickAddInitialDate?: string;
  isVoiceModalOpen: boolean;
  isSearchOpen: boolean;
  isNotificationsOpen: boolean;
  undoStack: UndoAction[];
  toasts: ToastItem[];
  filterQuery: string;
}

type Action =
  | { type: 'NAVIGATE'; payload: ScreenId }
  | { type: 'CREATE_TASK'; payload: { task: Omit<Task, 'id' | 'createdAt' | 'status'>; id?: string; status?: TaskStatus; undoable?: boolean } }
  | { type: 'UPDATE_TASK'; payload: { id: string; updates: Partial<Task>; undoable?: boolean } }
  | { type: 'TOGGLE_TASK_COMPLETE'; payload: { id: string } }
  | { type: 'DELETE_TASK'; payload: { id: string; hard?: boolean; undoable?: boolean } }
  | { type: 'RESTORE_TASK'; payload: { id: string } }
  | { type: 'ARCHIVE_TASK'; payload: { id: string } }
  | { type: 'TOGGLE_SUBTASK'; payload: { taskId: string; subtaskId: string } }
  | { type: 'ADD_SUBTASK'; payload: { taskId: string; title: string } }
  | { type: 'REMOVE_SUBTASK'; payload: { taskId: string; subtaskId: string } }
  | { type: 'CREATE_REMINDER'; payload: Omit<Reminder, 'id' | 'createdAt'> & { id?: string } }
  | { type: 'UPDATE_REMINDER'; payload: { id: string; updates: Partial<Reminder> } }
  | { type: 'DELETE_REMINDER'; payload: { id: string } }
  | { type: 'TOGGLE_REMINDER'; payload: { id: string } }
  | { type: 'MARK_NOTIFICATION_READ'; payload: { id: string } }
  | { type: 'MARK_ALL_NOTIFICATIONS_READ' }
  | { type: 'CLEAR_NOTIFICATIONS' }
  | { type: 'ADD_NOTIFICATION'; payload: Omit<NotificationItem, 'id' | 'timestamp' | 'read'> }
  | { type: 'SET_THEME'; payload: 'light' | 'dark' }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AppSettings> }
  | { type: 'SET_SELECTED_TASK_ID'; payload: string | null }
  | { type: 'SET_QUICK_ADD_OPEN'; payload: boolean | { open: boolean; initialDate?: string } }
  | { type: 'SET_VOICE_MODAL_OPEN'; payload: boolean }
  | { type: 'SET_SEARCH_OPEN'; payload: boolean }
  | { type: 'SET_NOTIFICATIONS_OPEN'; payload: boolean }
  | { type: 'SET_FILTER_QUERY'; payload: string }
  | { type: 'LOG_ACTIVITY'; payload: Omit<ActivityLog, 'id' | 'timestamp'> }
  | { type: 'CLEAR_VOICE_HISTORY' }
  | { type: 'RESET_DEMO_DATA' }
  | { type: 'CLEAR_ALL_DATA' }
  | { type: 'IMPORT_DATA'; payload: Partial<AppState> }
  | { type: 'ADD_TOAST'; payload: ToastItem }
  | { type: 'REMOVE_TOAST'; payload: string }
  | { type: 'PUSH_UNDO'; payload: UndoAction }
  | { type: 'POP_UNDO' };

const initialFullState: AppState = {
  currentScreen: 'dashboard',
  tasks: initialTasks,
  reminders: initialReminders,
  activities: initialActivities,
  notifications: initialNotifications,
  settings: initialSettings,
  selectedTaskId: null,
  isQuickAddOpen: false,
  quickAddInitialDate: undefined,
  isVoiceModalOpen: false,
  isSearchOpen: false,
  isNotificationsOpen: false,
  undoStack: [],
  toasts: [],
  filterQuery: '',
};

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'NAVIGATE': {
      return {
        ...state,
        currentScreen: action.payload,
        isSearchOpen: false,
        isNotificationsOpen: false,
      };
    }

    case 'CREATE_TASK': {
      const newId = action.payload.id || `task-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      const now = new Date().toISOString();
      const initialStatus = action.payload.status || (isOverdue(action.payload.task.dueDate, action.payload.task.dueTime) ? 'overdue' : 'pending');

      const newTask: Task = {
        ...action.payload.task,
        id: newId,
        status: initialStatus,
        createdAt: now,
      };

      const newActivity: ActivityLog = {
        id: `act-${Date.now()}`,
        type: 'task_created',
        title: newTask.title,
        description: `Created with ${newTask.priority} priority`,
        timestamp: now,
        taskId: newId,
        isVoice: newTask.source === 'voice',
      };

      return {
        ...state,
        tasks: [newTask, ...state.tasks],
        activities: [newActivity, ...state.activities],
      };
    }

    case 'UPDATE_TASK': {
      const prevTask = state.tasks.find(t => t.id === action.payload.id);
      if (!prevTask) return state;

      const updatedTasks = state.tasks.map(t => {
        if (t.id === action.payload.id) {
          const updated = { ...t, ...action.payload.updates };
          if (updated.status !== 'completed' && isOverdue(updated.dueDate, updated.dueTime)) {
            updated.status = 'overdue';
          }
          return updated;
        }
        return t;
      });

      return {
        ...state,
        tasks: updatedTasks,
      };
    }

    case 'TOGGLE_TASK_COMPLETE': {
      const task = state.tasks.find(t => t.id === action.payload.id);
      if (!task) return state;

      const now = new Date().toISOString();
      const isNowCompleted = task.status !== 'completed';
      const newStatus: TaskStatus = isNowCompleted ? 'completed' : 'pending';

      let nextOccurrenceTasks: Task[] = [];
      if (isNowCompleted && task.recurrence && task.recurrence !== 'none') {
        let daysToAdd = 1;
        if (task.recurrence === 'weekly') daysToAdd = 7;
        if (task.recurrence === 'monthly') daysToAdd = 30;

        const nextDate = getDaysOffsetISO(daysToAdd);
        const recurringClone: Task = {
          ...task,
          id: `task-${Date.now()}`,
          status: 'pending',
          dueDate: nextDate,
          createdAt: now,
          completedAt: undefined,
          subtasks: task.subtasks.map(s => ({ ...s, done: false })),
        };
        nextOccurrenceTasks = [recurringClone];
      }

      const updatedTasks = state.tasks.map(t => {
        if (t.id === action.payload.id) {
          return {
            ...t,
            status: newStatus,
            completedAt: isNowCompleted ? now : undefined,
          };
        }
        return t;
      });

      const activity: ActivityLog = {
        id: `act-${Date.now()}`,
        type: isNowCompleted ? 'task_completed' : 'task_reopened',
        title: task.title,
        description: isNowCompleted ? 'Marked as completed' : 'Reopened task',
        timestamp: now,
        taskId: task.id,
      };

      return {
        ...state,
        tasks: [...nextOccurrenceTasks, ...updatedTasks],
        activities: [activity, ...state.activities],
      };
    }

    case 'DELETE_TASK': {
      const target = state.tasks.find(t => t.id === action.payload.id);
      if (!target) return state;

      let updatedTasks: Task[];
      if (action.payload.hard) {
        updatedTasks = state.tasks.filter(t => t.id !== action.payload.id);
      } else {
        updatedTasks = state.tasks.map(t =>
          t.id === action.payload.id ? { ...t, deletedAt: new Date().toISOString() } : t
        );
      }

      const activity: ActivityLog = {
        id: `act-${Date.now()}`,
        type: 'task_deleted',
        title: target.title,
        description: 'Task moved to trash',
        timestamp: new Date().toISOString(),
        taskId: target.id,
      };

      return {
        ...state,
        tasks: updatedTasks,
        activities: [activity, ...state.activities],
        selectedTaskId: state.selectedTaskId === action.payload.id ? null : state.selectedTaskId,
      };
    }

    case 'RESTORE_TASK': {
      const updatedTasks = state.tasks.map(t =>
        t.id === action.payload.id ? { ...t, deletedAt: undefined } : t
      );
      return {
        ...state,
        tasks: updatedTasks,
      };
    }

    case 'ARCHIVE_TASK': {
      const updatedTasks = state.tasks.map(t =>
        t.id === action.payload.id ? { ...t, archived: !t.archived } : t
      );
      return {
        ...state,
        tasks: updatedTasks,
      };
    }

    case 'TOGGLE_SUBTASK': {
      const updatedTasks = state.tasks.map(t => {
        if (t.id === action.payload.taskId) {
          const updatedSubtasks = t.subtasks.map(s =>
            s.id === action.payload.subtaskId ? { ...s, done: !s.done } : s
          );
          return { ...t, subtasks: updatedSubtasks };
        }
        return t;
      });
      return { ...state, tasks: updatedTasks };
    }

    case 'ADD_SUBTASK': {
      const updatedTasks = state.tasks.map(t => {
        if (t.id === action.payload.taskId) {
          const newSub = {
            id: `st-${Date.now()}`,
            title: action.payload.title,
            done: false,
          };
          return { ...t, subtasks: [...t.subtasks, newSub] };
        }
        return t;
      });
      return { ...state, tasks: updatedTasks };
    }

    case 'REMOVE_SUBTASK': {
      const updatedTasks = state.tasks.map(t => {
        if (t.id === action.payload.taskId) {
          return {
            ...t,
            subtasks: t.subtasks.filter(s => s.id !== action.payload.subtaskId),
          };
        }
        return t;
      });
      return { ...state, tasks: updatedTasks };
    }

    case 'CREATE_REMINDER': {
      const newReminder: Reminder = {
        ...action.payload,
        id: action.payload.id || `rem-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        createdAt: new Date().toISOString(),
      };
      return {
        ...state,
        reminders: [newReminder, ...state.reminders],
      };
    }

    case 'UPDATE_REMINDER': {
      return {
        ...state,
        reminders: state.reminders.map(r =>
          r.id === action.payload.id ? { ...r, ...action.payload.updates } : r
        ),
      };
    }

    case 'DELETE_REMINDER': {
      return {
        ...state,
        reminders: state.reminders.filter(r => r.id !== action.payload.id),
      };
    }

    case 'TOGGLE_REMINDER': {
      return {
        ...state,
        reminders: state.reminders.map(r => {
          if (r.id === action.payload.id) {
            return {
              ...r,
              status: r.status === 'completed' ? 'active' : 'completed',
            };
          }
          return r;
        }),
      };
    }

    case 'MARK_NOTIFICATION_READ': {
      return {
        ...state,
        notifications: state.notifications.map(n =>
          n.id === action.payload.id ? { ...n, read: true } : n
        ),
      };
    }

    case 'MARK_ALL_NOTIFICATIONS_READ': {
      return {
        ...state,
        notifications: state.notifications.map(n => ({ ...n, read: true })),
      };
    }

    case 'CLEAR_NOTIFICATIONS': {
      return {
        ...state,
        notifications: [],
      };
    }

    case 'ADD_NOTIFICATION': {
      const newNotif: NotificationItem = {
        ...action.payload,
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: new Date().toISOString(),
        read: false,
      };
      return {
        ...state,
        notifications: [newNotif, ...state.notifications],
      };
    }

    case 'SET_THEME': {
      return {
        ...state,
        settings: { ...state.settings, theme: action.payload },
      };
    }

    case 'UPDATE_SETTINGS': {
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
      };
    }

    case 'SET_SELECTED_TASK_ID': {
      return {
        ...state,
        selectedTaskId: action.payload,
      };
    }

    case 'SET_QUICK_ADD_OPEN': {
      if (typeof action.payload === 'boolean') {
        return { ...state, isQuickAddOpen: action.payload, quickAddInitialDate: undefined };
      }
      return {
        ...state,
        isQuickAddOpen: action.payload.open,
        quickAddInitialDate: action.payload.initialDate,
      };
    }

    case 'SET_VOICE_MODAL_OPEN': {
      return { ...state, isVoiceModalOpen: action.payload };
    }

    case 'SET_SEARCH_OPEN': {
      return { ...state, isSearchOpen: action.payload };
    }

    case 'SET_NOTIFICATIONS_OPEN': {
      return { ...state, isNotificationsOpen: action.payload };
    }

    case 'SET_FILTER_QUERY': {
      return { ...state, filterQuery: action.payload };
    }

    case 'LOG_ACTIVITY': {
      const act: ActivityLog = {
        ...action.payload,
        id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: new Date().toISOString(),
      };
      return {
        ...state,
        activities: [act, ...state.activities],
      };
    }

    case 'CLEAR_VOICE_HISTORY': {
      return {
        ...state,
        activities: state.activities.filter(a => !a.isVoice),
      };
    }

    case 'RESET_DEMO_DATA': {
      return {
        ...initialFullState,
        settings: state.settings,
      };
    }

    case 'CLEAR_ALL_DATA': {
      return {
        ...state,
        tasks: [],
        reminders: [],
        activities: [],
        notifications: [],
      };
    }

    case 'IMPORT_DATA': {
      return {
        ...state,
        tasks: Array.isArray(action.payload.tasks) ? action.payload.tasks : state.tasks,
        reminders: Array.isArray(action.payload.reminders) ? action.payload.reminders : state.reminders,
        activities: Array.isArray(action.payload.activities) ? action.payload.activities : state.activities,
        notifications: Array.isArray(action.payload.notifications) ? action.payload.notifications : state.notifications,
        settings: action.payload.settings ? { ...state.settings, ...action.payload.settings } : state.settings,
      };
    }

    case 'ADD_TOAST': {
      return {
        ...state,
        toasts: [...state.toasts, action.payload],
      };
    }

    case 'REMOVE_TOAST': {
      return {
        ...state,
        toasts: state.toasts.filter(t => t.id !== action.payload),
      };
    }

    case 'PUSH_UNDO': {
      return {
        ...state,
        undoStack: [action.payload, ...state.undoStack.slice(0, 19)],
      };
    }

    case 'POP_UNDO': {
      if (state.undoStack.length === 0) return state;
      const [last, ...remaining] = state.undoStack;
      last.inverse();
      return {
        ...state,
        undoStack: remaining,
      };
    }

    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  navigate: (screen: ScreenId) => void;
  createTask: (task: Omit<Task, 'id' | 'createdAt' | 'status'>, options?: { undoable?: boolean }) => string;
  updateTask: (id: string, updates: Partial<Task>, options?: { undoable?: boolean }) => void;
  toggleTaskComplete: (id: string) => void;
  deleteTask: (id: string, options?: { hard?: boolean; undoable?: boolean }) => void;
  restoreTask: (id: string) => void;
  showToast: (message: string, options?: { type?: 'success' | 'info' | 'error'; undoAction?: () => void; undoLabel?: string }) => void;
  executeUndo: () => void;
  toggleTheme: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Load from local storage
  const [state, dispatch] = useReducer(appReducer, initialFullState, (fallback) => {
    return loadStoredData<AppState>(fallback);
  });

  // Sync with localStorage
  useEffect(() => {
    const { toasts, undoStack, isQuickAddOpen, isVoiceModalOpen, isSearchOpen, isNotificationsOpen, ...persistable } = state;
    saveStoredData(persistable);
  }, [state]);

  // Sync theme with HTML document
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', state.settings.theme);
  }, [state.settings.theme]);

  // Periodic overdue task status & active reminder triggers refresh
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
      const currentDay = String(now.getDate()).padStart(2, '0');
      const todayISO = `${currentYear}-${currentMonth}-${currentDay}`;
      const currentHHmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      // 1. Re-evaluate overdue tasks
      state.tasks.forEach(t => {
        if (t.status !== 'completed' && !t.deletedAt) {
          const overdue = isOverdue(t.dueDate, t.dueTime);
          if (overdue && t.status !== 'overdue') {
            dispatch({ type: 'UPDATE_TASK', payload: { id: t.id, updates: { status: 'overdue' } } });
          }
        }
      });

      // 2. Active Reminders Check
      if (state.settings.notifyTaskReminders) {
        state.reminders.forEach(rem => {
          if (rem.status === 'active' && rem.date === todayISO && rem.time === currentHHmm) {
            // Trigger in-app notification & toast
            dispatch({
              type: 'ADD_NOTIFICATION',
              payload: {
                type: 'reminder',
                title: 'Reminder Due',
                message: `"${rem.title}" is due now.`,
                relatedTaskId: rem.taskId,
              },
            });

            showToast(`Reminder: "${rem.title}"`, {
              type: 'info',
            });

            // If browser Notification API is available and granted
            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
              try {
                new Notification('Task Tracker Reminder', { body: rem.title });
              } catch {
                // Ignore iframe notification blocks
              }
            }

            // If non-repeating, complete the reminder
            if (rem.repeat === 'none') {
              dispatch({
                type: 'UPDATE_REMINDER',
                payload: { id: rem.id, updates: { status: 'completed' } },
              });
            }
          }
        });
      }
    }, 30000);
    return () => clearInterval(timer);
  }, [state.tasks, state.reminders, state.settings.notifyTaskReminders]);

  // Global Keyboard shortcuts: Ctrl/Cmd+K (Search), Ctrl/Cmd+Z (Undo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        dispatch({ type: 'SET_SEARCH_OPEN', payload: !state.isSearchOpen });
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        // Undo shortcut
        if (state.undoStack.length > 0) {
          e.preventDefault();
          executeUndo();
          showToast('Undone.', { type: 'info' });
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.isSearchOpen, state.undoStack]);

  const showToast = (message: string, options?: { type?: 'success' | 'info' | 'error'; undoAction?: () => void; undoLabel?: string }) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    dispatch({
      type: 'ADD_TOAST',
      payload: {
        id,
        message,
        type: options?.type || 'info',
        undoAction: options?.undoAction,
        undoLabel: options?.undoLabel || 'Undo',
        duration: 5000,
      },
    });

    if (state.settings.voiceFeedback) {
      playFeedbackTone(options?.type === 'error' ? 'error' : 'success');
    }

    setTimeout(() => {
      dispatch({ type: 'REMOVE_TOAST', payload: id });
    }, 5000);
  };

  const navigate = (screen: ScreenId) => {
    dispatch({ type: 'NAVIGATE', payload: screen });
    try {
      const targetPath = screen === 'dashboard' ? '/' : `/${screen}`;
      if (window.location.pathname !== targetPath) {
        window.history.pushState({}, '', targetPath);
      }
    } catch {
      window.location.hash = screen;
    }
  };

  // Sync routing on initial load, browser back/forward (popstate), and hash change
  useEffect(() => {
    const handleUrlSync = () => {
      const validScreens: ScreenId[] = [
        'dashboard', 'tasks', 'task_create', 'task_details',
        'calendar', 'voice', 'reminders', 'analytics',
        'history', 'settings', 'profile'
      ];

      // 1. Check path (e.g., /tasks, /calendar)
      const cleanPath = window.location.pathname.replace(/^\/+/, '').split('/')[0] as ScreenId;
      // 2. Check hash (e.g., #tasks, #calendar)
      const cleanHash = window.location.hash.replace(/^#+/, '') as ScreenId;

      let targetScreen: ScreenId | null = null;
      if (cleanPath && validScreens.includes(cleanPath)) {
        targetScreen = cleanPath;
      } else if (cleanHash && validScreens.includes(cleanHash)) {
        targetScreen = cleanHash;
      }

      if (targetScreen && targetScreen !== state.currentScreen) {
        dispatch({ type: 'NAVIGATE', payload: targetScreen });
      }
    };

    window.addEventListener('popstate', handleUrlSync);
    window.addEventListener('hashchange', handleUrlSync);
    handleUrlSync();
    return () => {
      window.removeEventListener('popstate', handleUrlSync);
      window.removeEventListener('hashchange', handleUrlSync);
    };
  }, []);

  const createTask = (task: Omit<Task, 'id' | 'createdAt' | 'status'>, options?: { undoable?: boolean }): string => {
    const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    dispatch({ type: 'CREATE_TASK', payload: { task, id: taskId } });

    const inverseAction = () => {
      dispatch({ type: 'DELETE_TASK', payload: { id: taskId, hard: true } });
      showToast('Task creation undone.', { type: 'info' });
    };

    if (options?.undoable !== false) {
      dispatch({
        type: 'PUSH_UNDO',
        payload: {
          id: `undo-${Date.now()}`,
          description: `Create "${task.title}"`,
          inverse: inverseAction,
          timestamp: Date.now(),
        },
      });

      showToast(`Task "${task.title}" created.`, {
        type: 'success',
        undoLabel: 'Undo',
        undoAction: inverseAction,
      });
    }
    return taskId;
  };

  const updateTask = (id: string, updates: Partial<Task>, options?: { undoable?: boolean }) => {
    const previous = state.tasks.find(t => t.id === id);
    if (!previous) return;

    dispatch({ type: 'UPDATE_TASK', payload: { id, updates } });

    const inverseAction = () => {
      dispatch({ type: 'UPDATE_TASK', payload: { id, updates: previous } });
      showToast('Task changes reverted.', { type: 'info' });
    };

    if (options?.undoable !== false) {
      dispatch({
        type: 'PUSH_UNDO',
        payload: {
          id: `undo-${Date.now()}`,
          description: `Update "${previous.title}"`,
          inverse: inverseAction,
          timestamp: Date.now(),
        },
      });

      showToast('Task updated.', {
        type: 'info',
        undoLabel: 'Undo',
        undoAction: inverseAction,
      });
    }
  };

  const toggleTaskComplete = (id: string) => {
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;
    const willBeCompleted = task.status !== 'completed';
    dispatch({ type: 'TOGGLE_TASK_COMPLETE', payload: { id } });

    const inverseAction = () => {
      dispatch({ type: 'TOGGLE_TASK_COMPLETE', payload: { id } });
    };

    dispatch({
      type: 'PUSH_UNDO',
      payload: {
        id: `undo-${Date.now()}`,
        description: willBeCompleted ? `Completed "${task.title}"` : `Reopened "${task.title}"`,
        inverse: inverseAction,
        timestamp: Date.now(),
      },
    });

    showToast(willBeCompleted ? `Completed "${task.title}".` : `Reopened "${task.title}".`, {
      type: 'success',
      undoLabel: 'Undo',
      undoAction: inverseAction,
    });
  };

  const deleteTask = (id: string, options?: { hard?: boolean; undoable?: boolean }) => {
    const target = state.tasks.find(t => t.id === id);
    if (!target) return;

    dispatch({ type: 'DELETE_TASK', payload: { id, hard: options?.hard } });

    const inverseAction = () => {
      dispatch({ type: 'RESTORE_TASK', payload: { id } });
      showToast('Task restored.', { type: 'success' });
    };

    if (options?.undoable !== false) {
      dispatch({
        type: 'PUSH_UNDO',
        payload: {
          id: `undo-${Date.now()}`,
          description: `Delete "${target.title}"`,
          inverse: inverseAction,
          timestamp: Date.now(),
        },
      });

      showToast(`Deleted "${target.title}".`, {
        type: 'info',
        undoLabel: 'Undo',
        undoAction: inverseAction,
      });
    }
  };

  const restoreTask = (id: string) => {
    dispatch({ type: 'RESTORE_TASK', payload: { id } });
    showToast('Task restored to active list.', { type: 'success' });
  };

  const executeUndo = () => {
    dispatch({ type: 'POP_UNDO' });
  };

  const toggleTheme = () => {
    const next = state.settings.theme === 'dark' ? 'light' : 'dark';
    dispatch({ type: 'SET_THEME', payload: next });
  };

  return (
    <AppContext.Provider
      value={{
        state,
        dispatch,
        navigate,
        createTask,
        updateTask,
        toggleTaskComplete,
        deleteTask,
        restoreTask,
        showToast,
        executeUndo,
        toggleTheme,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
