import React, { useState } from 'react';
import {
  BellRing,
  Plus,
  Clock,
  Calendar,
  Check,
  Pause,
  Play,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import { useApp } from '../state/AppContext';
import { Reminder } from '../state/types';
import { formatDateLabel, formatTime12h, getTodayISO } from '../lib/dates';

export const RemindersScreen: React.FC = () => {
  const { state, dispatch, showToast } = useApp();

  const [activeTab, setActiveTab] = useState<'active' | 'upcoming' | 'completed' | 'recurring'>('active');
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(getTodayISO());
  const [time, setTime] = useState('18:00');
  const [repeat, setRepeat] = useState<'none' | 'daily' | 'weekly' | 'monthly'>('none');

  const handleCreateReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    dispatch({
      type: 'CREATE_REMINDER',
      payload: {
        title: title.trim(),
        date,
        time,
        repeat,
        status: 'active',
      },
    });

    showToast(`Reminder set for "${title.trim()}".`, { type: 'success' });
    setTitle('');
    setIsAdding(false);
  };

  const todayISO = getTodayISO();

  const filteredReminders = state.reminders.filter((rem) => {
    if (activeTab === 'completed') return rem.status === 'completed';
    if (activeTab === 'recurring') return rem.repeat !== 'none' && rem.status !== 'completed';
    if (activeTab === 'upcoming') return rem.date > todayISO && rem.status !== 'completed';
    // active: today or active
    return rem.status === 'active';
  });

  return (
    <div className="space-y-6 pb-20 md:pb-12 max-w-4xl mx-auto">
      {/* Header Bar */}
      <div className="glass-panel p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-50 tracking-tight flex items-center gap-2">
            <BellRing className="w-5 h-5 stroke-[1.75]" />
            <span>Time-Critical Reminders</span>
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Keep track of alerts, scheduled check-ins and alarms.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-4 py-2 bg-neutral-900 text-white dark:bg-white dark:text-black font-semibold text-xs rounded-xl flex items-center gap-1.5 shadow-sm hover:opacity-90 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Reminder</span>
        </button>
      </div>

      {/* Creation Drawer/Box if active */}
      {isAdding && (
        <form
          onSubmit={handleCreateReminder}
          className="glass-panel-elevated p-5 rounded-2xl bg-neutral-900 text-white dark:bg-neutral-950 space-y-4 animate-in fade-in"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">
              Create New Reminder
            </span>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-xs text-neutral-400 hover:text-white"
            >
              Cancel
            </button>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
              Title
            </label>
            <input
              type="text"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Call client at 4 PM"
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white font-mono-numbers"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
                Time
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white font-mono-numbers"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
                Repeat
              </label>
              <select
                value={repeat}
                onChange={(e) => setRepeat(e.target.value as any)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white"
              >
                <option value="none">Does not repeat</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="submit"
              className="px-4 py-2 bg-white text-black font-semibold text-xs rounded-lg hover:bg-neutral-200"
            >
              Save Reminder
            </button>
          </div>
        </form>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-neutral-200 dark:border-neutral-800 pb-2 text-xs">
        {(['active', 'upcoming', 'completed', 'recurring'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-lg font-medium capitalize transition-colors ${
              activeTab === tab
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-black font-semibold shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {filteredReminders.length === 0 ? (
          <div className="glass-panel p-10 rounded-2xl text-center space-y-2">
            <BellRing className="w-8 h-8 text-neutral-400 mx-auto" />
            <p className="text-xs text-neutral-500">
              No {activeTab} reminders found.
            </p>
          </div>
        ) : (
          filteredReminders.map((rem) => (
            <div
              key={rem.id}
              className="glass-panel p-4 rounded-xl flex items-center justify-between gap-4 transition-all"
            >
              <div className="flex items-start gap-3 min-w-0">
                <button
                  onClick={() => dispatch({ type: 'TOGGLE_REMINDER', payload: { id: rem.id } })}
                  className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                    rem.status === 'completed'
                      ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-black dark:border-white'
                      : 'border-neutral-400 hover:border-neutral-900 dark:border-neutral-600 dark:hover:border-neutral-200'
                  }`}
                >
                  {rem.status === 'completed' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </button>

                <div>
                  <h4 className={`text-xs sm:text-sm font-semibold text-neutral-900 dark:text-neutral-100 ${
                    rem.status === 'completed' ? 'line-through opacity-60' : ''
                  }`}>
                    {rem.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-neutral-500 font-mono-numbers">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDateLabel(rem.date)}</span>
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatTime12h(rem.time)}</span>
                    </span>
                    {rem.repeat !== 'none' && (
                      <>
                        <span>·</span>
                        <span className="capitalize">{rem.repeat}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const nextStatus = rem.status === 'paused' ? 'active' : 'paused';
                    dispatch({
                      type: 'UPDATE_REMINDER',
                      payload: { id: rem.id, updates: { status: nextStatus } },
                    });
                  }}
                  title={rem.status === 'paused' ? 'Resume' : 'Pause'}
                  className="p-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800"
                >
                  {rem.status === 'paused' ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={() => {
                    if (window.confirm(`Delete reminder "${rem.title}"?`)) {
                      dispatch({ type: 'DELETE_REMINDER', payload: { id: rem.id } });
                      showToast('Reminder deleted.', { type: 'info' });
                    }
                  }}
                  title="Delete"
                  className="p-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
