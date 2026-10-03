import React from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  Mic,
  BellRing,
  BarChart3,
  History,
  Settings,
  User,
} from 'lucide-react';
import { useApp } from '../state/AppContext';
import { ScreenId } from '../state/types';

export const Sidebar: React.FC = () => {
  const { state, navigate } = useApp();

  const pendingCount = state.tasks.filter(
    t => !t.deletedAt && t.status !== 'completed'
  ).length;

  const activeRemindersCount = state.reminders.filter(
    r => r.status === 'active'
  ).length;

  const navItems: { id: ScreenId; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4 stroke-[1.5]" /> },
    { id: 'tasks', label: 'Tasks', icon: <CheckSquare className="w-4 h-4 stroke-[1.5]" />, badge: pendingCount },
    { id: 'calendar', label: 'Calendar', icon: <Calendar className="w-4 h-4 stroke-[1.5]" /> },
    { id: 'voice', label: 'Voice Assistant', icon: <Mic className="w-4 h-4 stroke-[1.5]" /> },
    { id: 'reminders', label: 'Reminders', icon: <BellRing className="w-4 h-4 stroke-[1.5]" />, badge: activeRemindersCount },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4 stroke-[1.5]" /> },
    { id: 'history', label: 'History', icon: <History className="w-4 h-4 stroke-[1.5]" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4 stroke-[1.5]" /> },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 lg:w-68 shrink-0 h-screen sticky top-0 border-r border-neutral-200 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-950/60 backdrop-blur-xl z-30 transition-all select-none">
      {/* Top Brand Block */}
      <div className="flex items-center gap-3 px-6 h-18 border-b border-neutral-200/60 dark:border-neutral-800/60">
        <div className="w-8 h-8 rounded-lg bg-neutral-900 text-neutral-100 dark:bg-neutral-100 dark:text-neutral-950 flex items-center justify-center font-semibold text-sm shadow-sm">
          <Mic className="w-4 h-4 stroke-[2]" />
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-sm tracking-tight text-neutral-900 dark:text-neutral-100">
            Voice Tracker
          </span>
          <span className="text-[11px] font-medium text-neutral-400 dark:text-neutral-500">
            Intelligent Daily Flow
          </span>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold tracking-wider uppercase text-neutral-400 dark:text-neutral-500">
          Navigation
        </div>
        {navItems.map((item) => {
          const isActive = state.currentScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-neutral-900 text-neutral-50 dark:bg-neutral-100 dark:text-neutral-950 shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-200/50 dark:hover:bg-neutral-900/50'
              }`}
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`text-[11px] font-mono-numbers px-1.5 py-0.5 rounded ${
                    isActive
                      ? 'bg-neutral-800 text-neutral-200 dark:bg-neutral-200 dark:text-neutral-900'
                      : 'bg-neutral-200/80 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Profile Footer */}
      <div className="p-3 border-t border-neutral-200/60 dark:border-neutral-800/60">
        <button
          onClick={() => navigate('profile')}
          className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-colors ${
            state.currentScreen === 'profile'
              ? 'bg-neutral-200 dark:bg-neutral-900'
              : 'hover:bg-neutral-100 dark:hover:bg-neutral-900/60'
          }`}
        >
          <div className="w-8 h-8 rounded-full border border-neutral-300 dark:border-neutral-700 flex items-center justify-center bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs font-medium">
            {state.settings.userName
              .split(' ')
              .map(n => n[0])
              .join('')
              .toUpperCase()}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
              {state.settings.userName}
            </span>
            <span className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
              {state.settings.userEmail}
            </span>
          </div>
        </button>
      </div>
    </aside>
  );
};
