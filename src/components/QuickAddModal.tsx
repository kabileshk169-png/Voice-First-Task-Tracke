import React, { useState, useEffect } from 'react';
import { X, Plus, Calendar, Clock, Sparkles, Check } from 'lucide-react';
import { useApp } from '../state/AppContext';
import { TaskPriority } from '../state/types';
import { parseVoiceCommand } from '../lib/parser';
import { getTodayISO, formatTime12h, formatDateLabel } from '../lib/dates';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({ isOpen, onClose }) => {
  const { state, createTask, dispatch, showToast } = useApp();

  const [mode, setMode] = useState<'task' | 'reminder'>('task');
  const [naturalText, setNaturalText] = useState('');
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState(state.quickAddInitialDate || getTodayISO());
  const [dueTime, setDueTime] = useState('18:00');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [category, setCategory] = useState('General');

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

  // Update date when quickAddInitialDate changes
  useEffect(() => {
    if (state.quickAddInitialDate) {
      setDueDate(state.quickAddInitialDate);
    }
  }, [state.quickAddInitialDate, isOpen]);

  // Real-time parser preview as user types natural text
  useEffect(() => {
    if (naturalText.trim().length > 3) {
      const parsed = parseVoiceCommand(naturalText);
      if (parsed.taskTitle) setTitle(parsed.taskTitle);
      if (parsed.dueDate) setDueDate(parsed.dueDate);
      if (parsed.dueTime) setDueTime(parsed.dueTime);
      if (parsed.priority) setPriority(parsed.priority);
      if (parsed.category) setCategory(parsed.category);
    }
  }, [naturalText]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitle = title.trim() || naturalText.trim();
    if (!finalTitle) return;

    if (mode === 'task') {
      createTask({
        title: finalTitle,
        dueDate: dueDate || undefined,
        dueTime: dueTime || undefined,
        priority,
        category,
        tags: [category.toLowerCase()],
        subtasks: [],
        source: 'quickadd',
      });
    } else {
      dispatch({
        type: 'CREATE_REMINDER',
        payload: {
          title: finalTitle,
          date: dueDate || getTodayISO(),
          time: dueTime || '19:00',
          repeat: 'none',
          status: 'active',
        },
      });
      showToast(`Reminder created for ${finalTitle}`, { type: 'success' });
    }

    onClose();
    setNaturalText('');
    setTitle('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg glass-panel-elevated bg-neutral-900/95 dark:bg-neutral-950/95 border border-neutral-700/80 rounded-2xl shadow-2xl p-6 text-neutral-100 z-10">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-white" />
            <h2 className="text-sm font-bold tracking-tight text-white">Quick Add</h2>
          </div>

          <div className="flex items-center gap-1 p-1 bg-neutral-800/80 rounded-lg">
            <button
              type="button"
              onClick={() => setMode('task')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                mode === 'task' ? 'bg-white text-black font-semibold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Task
            </button>
            <button
              type="button"
              onClick={() => setMode('reminder')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                mode === 'reminder' ? 'bg-white text-black font-semibold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Reminder
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Natural language helper */}
          <div>
            <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Natural speech / typing</span>
            </label>
            <input
              type="text"
              autoFocus
              value={naturalText}
              onChange={(e) => setNaturalText(e.target.value)}
              placeholder="e.g. Call client tomorrow at 4 PM high priority..."
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white"
            />
          </div>

          {/* Explicit title */}
          <div>
            <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task name"
              className="w-full bg-neutral-800/70 border border-neutral-700 rounded-lg px-3 py-2 text-xs font-medium text-white focus:outline-none focus:border-white"
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>Date</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white font-mono-numbers"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Time</span>
              </label>
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white font-mono-numbers"
              />
            </div>
          </div>

          {mode === 'task' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white"
                >
                  <option value="General">General</option>
                  <option value="Work">Work</option>
                  <option value="Education">Education</option>
                  <option value="Health">Health</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Finance">Finance</option>
                </select>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-3 border-t border-neutral-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-white text-black hover:bg-neutral-200 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>{mode === 'task' ? 'Create Task' : 'Set Reminder'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
