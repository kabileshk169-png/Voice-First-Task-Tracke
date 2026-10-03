import React from 'react';
import {
  Search,
  Plus,
  Bell,
  Mic,
  Sun,
  Moon,
} from 'lucide-react';
import { useApp } from '../state/AppContext';
import { ScreenId } from '../state/types';

const screenTitles: Record<ScreenId, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Daily priorities & voice flow' },
  tasks: { title: 'Tasks', subtitle: 'Organize and execute' },
  task_create: { title: 'New Task', subtitle: 'Define details & reminders' },
  task_details: { title: 'Task Details', subtitle: 'Manage subtasks & timeline' },
  calendar: { title: 'Calendar', subtitle: 'Schedule & time-block' },
  voice: { title: 'Voice Assistant', subtitle: 'Natural speech commands' },
  reminders: { title: 'Reminders', subtitle: 'Time-critical alerts' },
  analytics: { title: 'Analytics', subtitle: 'Productivity trends & streaks' },
  history: { title: 'History', subtitle: 'Completed & audit log' },
  settings: { title: 'Settings', subtitle: 'Preferences & voice engine' },
  profile: { title: 'Profile', subtitle: 'Account statistics' },
};

export const Navbar: React.FC = () => {
  const { state, dispatch, toggleTheme } = useApp();

  const currentInfo = screenTitles[state.currentScreen] || {
    title: 'Workspace',
    subtitle: 'Daily manager',
  };

  const unreadCount = state.notifications.filter(n => !n.read).length;

  return (
    <header className="sticky top-0 z-20 h-18 border-b border-neutral-200/60 dark:border-neutral-800/60 bg-neutral-100/70 dark:bg-neutral-950/70 backdrop-blur-xl px-4 lg:px-8 flex items-center justify-between transition-colors">
      {/* Zone 1: Title and context */}
      <div className="flex flex-col">
        <h1 className="text-base lg:text-lg font-bold tracking-tight text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
          <span>{currentInfo.title}</span>
        </h1>
        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 hidden sm:block">
          {currentInfo.subtitle}
        </p>
      </div>

      {/* Zone 2 & 3: Global Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search Trigger with Ctrl/Cmd+K */}
        <button
          onClick={() => dispatch({ type: 'SET_SEARCH_OPEN', payload: true })}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-neutral-300/80 dark:border-neutral-800 bg-white/60 dark:bg-neutral-900/60 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 text-xs transition-colors shadow-sm"
          title="Global Search"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Search anything...</span>
          <kbd className="hidden lg:inline text-[10px] font-mono-numbers px-1.5 py-0.5 rounded bg-neutral-200/60 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-300 dark:border-neutral-700">
            ⌘K
          </kbd>
        </button>

        {/* Quick Add Button */}
        <button
          onClick={() => dispatch({ type: 'SET_QUICK_ADD_OPEN', payload: true })}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 text-neutral-50 dark:bg-neutral-100 dark:text-neutral-900 hover:opacity-90 text-xs font-semibold shadow-sm transition-opacity"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span className="hidden sm:inline">Add Task</span>
        </button>

        {/* Global Voice Button */}
        <button
          onClick={() => dispatch({ type: 'SET_VOICE_MODAL_OPEN', payload: true })}
          className="w-8 h-8 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white/70 dark:bg-neutral-900/70 hover:bg-neutral-200 dark:hover:bg-neutral-800 flex items-center justify-center text-neutral-800 dark:text-neutral-200 transition-colors"
          title="Voice Assistant"
          aria-label="Voice Assistant"
        >
          <Mic className="w-4 h-4" />
        </button>

        {/* Notifications Bell */}
        <button
          onClick={() => dispatch({ type: 'SET_NOTIFICATIONS_OPEN', payload: !state.isNotificationsOpen })}
          className="relative w-8 h-8 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white/70 dark:bg-neutral-900/70 hover:bg-neutral-200 dark:hover:bg-neutral-800 flex items-center justify-center text-neutral-800 dark:text-neutral-200 transition-colors"
          title="Notifications"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-neutral-900 text-neutral-50 dark:bg-neutral-100 dark:text-neutral-900 text-[10px] font-mono-numbers font-bold flex items-center justify-center border border-white dark:border-neutral-950">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="w-8 h-8 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white/70 dark:bg-neutral-900/70 hover:bg-neutral-200 dark:hover:bg-neutral-800 flex items-center justify-center text-neutral-800 dark:text-neutral-200 transition-colors"
          title={`Switch to ${state.settings.theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          aria-label="Toggle Theme"
        >
          {state.settings.theme === 'dark' ? (
            <Sun className="w-4 h-4 stroke-[1.75]" />
          ) : (
            <Moon className="w-4 h-4 stroke-[1.75]" />
          )}
        </button>
      </div>
    </header>
  );
};
