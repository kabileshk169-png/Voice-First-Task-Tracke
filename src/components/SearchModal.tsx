import React, { useState, useEffect } from 'react';
import { Search, X, CheckSquare, BellRing, History, Mic, ArrowRight } from 'lucide-react';
import { useApp } from '../state/AppContext';
import { formatDateLabel, formatTime12h } from '../lib/dates';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const { state, dispatch, navigate } = useApp();
  const [query, setQuery] = useState('');

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  const matchingTasks = q
    ? state.tasks.filter(
        t => !t.deletedAt && (t.title.toLowerCase().includes(q) || t.notes?.toLowerCase().includes(q) || t.category.toLowerCase().includes(q))
      )
    : [];

  const matchingReminders = q
    ? state.reminders.filter(r => r.title.toLowerCase().includes(q))
    : [];

  const matchingActivities = q
    ? state.activities.filter(a => a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q))
    : [];

  const totalResults = matchingTasks.length + matchingReminders.length + matchingActivities.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Search Palette Container */}
      <div className="relative w-full max-w-xl glass-panel-elevated bg-neutral-900/95 dark:bg-neutral-950/95 border border-neutral-700/80 rounded-2xl shadow-2xl overflow-hidden text-neutral-100 z-10 flex flex-col max-h-[75vh]">
        {/* Search Input Bar */}
        <div className="p-3.5 border-b border-neutral-800 flex items-center gap-3">
          <Search className="w-4 h-4 text-neutral-400 shrink-0 ml-1" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks, reminders, activity log..."
            className="flex-1 bg-transparent text-sm text-white placeholder-neutral-500 focus:outline-none"
          />

          {/* Voice Search inside overlay */}
          <button
            onClick={() => {
              onClose();
              dispatch({ type: 'SET_VOICE_MODAL_OPEN', payload: true });
            }}
            title="Search with voice"
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <Mic className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {!q ? (
            <div className="py-8 text-center text-xs text-neutral-500">
              Type keywords to search across tasks, reminders, and voice history.
            </div>
          ) : totalResults === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-400">
              No matching items found for "{query}".
            </div>
          ) : (
            <>
              {/* Tasks Results */}
              {matchingTasks.length > 0 && (
                <div>
                  <div className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>Tasks ({matchingTasks.length})</span>
                  </div>
                  <div className="space-y-1">
                    {matchingTasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => {
                          onClose();
                          dispatch({ type: 'SET_SELECTED_TASK_ID', payload: task.id });
                        }}
                        className="p-2.5 rounded-lg hover:bg-neutral-800/80 cursor-pointer flex items-center justify-between text-xs transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-neutral-200 truncate">{task.title}</p>
                          <p className="text-[11px] text-neutral-500">
                            {task.category} · {formatDateLabel(task.dueDate)} {task.dueTime && formatTime12h(task.dueTime)}
                          </p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-neutral-500" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reminders Results */}
              {matchingReminders.length > 0 && (
                <div>
                  <div className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                    <BellRing className="w-3.5 h-3.5" />
                    <span>Reminders ({matchingReminders.length})</span>
                  </div>
                  <div className="space-y-1">
                    {matchingReminders.map((rem) => (
                      <div
                        key={rem.id}
                        onClick={() => {
                          onClose();
                          navigate('reminders');
                        }}
                        className="p-2.5 rounded-lg hover:bg-neutral-800/80 cursor-pointer flex items-center justify-between text-xs transition-colors"
                      >
                        <div>
                          <p className="font-semibold text-neutral-200">{rem.title}</p>
                          <p className="text-[11px] text-neutral-500 font-mono-numbers">
                            {formatDateLabel(rem.date)} at {formatTime12h(rem.time)}
                          </p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-neutral-500" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Activity Log Results */}
              {matchingActivities.length > 0 && (
                <div>
                  <div className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5" />
                    <span>Activity History ({matchingActivities.length})</span>
                  </div>
                  <div className="space-y-1">
                    {matchingActivities.map((act) => (
                      <div
                        key={act.id}
                        onClick={() => {
                          onClose();
                          navigate('history');
                        }}
                        className="p-2.5 rounded-lg hover:bg-neutral-800/80 cursor-pointer flex items-center justify-between text-xs transition-colors"
                      >
                        <div>
                          <p className="font-semibold text-neutral-200">{act.title}</p>
                          <p className="text-[11px] text-neutral-500">{act.description}</p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-neutral-500" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between text-[11px] text-neutral-500">
          <span>Esc to exit</span>
          <span>Tab to navigate</span>
        </div>
      </div>
    </div>
  );
};
