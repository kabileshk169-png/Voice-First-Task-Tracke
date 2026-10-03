import React, { useState } from 'react';
import {
  History,
  RotateCcw,
  Trash2,
  Archive,
  CheckCircle2,
  Mic,
  Calendar,
} from 'lucide-react';
import { useApp } from '../state/AppContext';
import { formatDateLabel, formatRelativeTime } from '../lib/dates';

export const HistoryScreen: React.FC = () => {
  const { state, dispatch, restoreTask, toggleTaskComplete } = useApp();

  const [activeSection, setActiveSection] = useState<'activity' | 'completed' | 'deleted' | 'archived'>('activity');

  const completedTasks = state.tasks.filter(t => t.status === 'completed' && !t.deletedAt);
  const deletedTasks = state.tasks.filter(t => Boolean(t.deletedAt));
  const archivedTasks = state.tasks.filter(t => Boolean(t.archived) && !t.deletedAt);

  return (
    <div className="space-y-6 pb-20 md:pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="glass-panel p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-50 tracking-tight flex items-center gap-2">
            <History className="w-5 h-5 stroke-[1.75]" />
            <span>Activity History & Archive</span>
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Audit log of tasks, voice operations, and trash recovery.
          </p>
        </div>

        {activeSection === 'activity' && state.activities.some(a => a.isVoice) && (
          <button
            onClick={() => {
              if (window.confirm('Clear all voice activity logs?')) {
                dispatch({ type: 'CLEAR_VOICE_HISTORY' });
              }
            }}
            className="px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
          >
            Clear Voice History
          </button>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-neutral-200 dark:border-neutral-800 pb-2 text-xs">
        {[
          { id: 'activity', label: 'Activity Log', count: state.activities.length },
          { id: 'completed', label: 'Completed', count: completedTasks.length },
          { id: 'deleted', label: 'Trash', count: deletedTasks.length },
          { id: 'archived', label: 'Archived', count: archivedTasks.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id as any)}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              activeSection === tab.id
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-black font-semibold shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <span>{tab.label}</span>
            <span className="text-[10px] font-mono-numbers opacity-75">
              ({tab.count})
            </span>
          </button>
        ))}
      </div>

      {/* Content View */}
      <div className="space-y-3">
        {/* Activity Log */}
        {activeSection === 'activity' && (
          state.activities.length === 0 ? (
            <div className="glass-panel p-10 text-center text-xs text-neutral-500 rounded-2xl">
              No recent activity recorded.
            </div>
          ) : (
            state.activities.map((act) => (
              <div
                key={act.id}
                className="glass-panel p-4 rounded-xl flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-neutral-200 dark:bg-neutral-800 shrink-0">
                    {act.isVoice ? (
                      <Mic className="w-4 h-4 text-neutral-900 dark:text-white" />
                    ) : (
                      <History className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                      {act.title}
                    </p>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-0.5">
                      {act.description}
                    </p>
                  </div>
                </div>

                <span className="text-[11px] text-neutral-500 font-mono-numbers shrink-0">
                  {formatRelativeTime(act.timestamp)}
                </span>
              </div>
            ))
          )
        )}

        {/* Completed Tasks */}
        {activeSection === 'completed' && (
          completedTasks.length === 0 ? (
            <div className="glass-panel p-10 text-center text-xs text-neutral-500 rounded-2xl">
              No completed tasks.
            </div>
          ) : (
            completedTasks.map((t) => (
              <div
                key={t.id}
                className="glass-panel p-4 rounded-xl flex items-center justify-between gap-4 text-xs"
              >
                <div>
                  <p className="font-semibold line-through text-neutral-500 dark:text-neutral-400">
                    {t.title}
                  </p>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    {t.category} · Completed {t.completedAt ? formatRelativeTime(t.completedAt) : 'recently'}
                  </p>
                </div>

                <button
                  onClick={() => toggleTaskComplete(t.id)}
                  className="px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-800 font-medium flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reopen</span>
                </button>
              </div>
            ))
          )
        )}

        {/* Deleted / Trash Tasks */}
        {activeSection === 'deleted' && (
          deletedTasks.length === 0 ? (
            <div className="glass-panel p-10 text-center text-xs text-neutral-500 rounded-2xl">
              Trash is empty.
            </div>
          ) : (
            deletedTasks.map((t) => (
              <div
                key={t.id}
                className="glass-panel p-4 rounded-xl flex items-center justify-between gap-4 text-xs"
              >
                <div>
                  <p className="font-semibold text-neutral-800 dark:text-neutral-200">
                    {t.title}
                  </p>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    {t.category} · Deleted {t.deletedAt ? formatRelativeTime(t.deletedAt) : ''}
                  </p>
                </div>

                <button
                  onClick={() => restoreTask(t.id)}
                  className="px-3 py-1.5 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-black font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Restore</span>
                </button>
              </div>
            ))
          )
        )}

        {/* Archived Tasks */}
        {activeSection === 'archived' && (
          archivedTasks.length === 0 ? (
            <div className="glass-panel p-10 text-center text-xs text-neutral-500 rounded-2xl">
              No archived tasks.
            </div>
          ) : (
            archivedTasks.map((t) => (
              <div
                key={t.id}
                className="glass-panel p-4 rounded-xl flex items-center justify-between gap-4 text-xs"
              >
                <div>
                  <p className="font-semibold text-neutral-800 dark:text-neutral-200">
                    {t.title}
                  </p>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    {t.category}
                  </p>
                </div>

                <button
                  onClick={() => dispatch({ type: 'ARCHIVE_TASK', payload: { id: t.id } })}
                  className="px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-800 font-medium"
                >
                  Unarchive
                </button>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
};
