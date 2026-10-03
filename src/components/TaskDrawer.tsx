import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Trash2,
  Calendar,
  Clock,
  Tag,
  Plus,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { Task, TaskPriority, TaskStatus } from '../state/types';
import { useApp } from '../state/AppContext';

interface TaskDrawerProps {
  taskId: string | null;
  onClose: () => void;
}

export const TaskDrawer: React.FC<TaskDrawerProps> = ({ taskId, onClose }) => {
  const { state, updateTask, toggleTaskComplete, deleteTask, dispatch } = useApp();
  const task = state.tasks.find(t => t.id === taskId);

  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [category, setCategory] = useState('General');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setNotes(task.notes || '');
      setPriority(task.priority);
      setCategory(task.category || 'General');
      setDueDate(task.dueDate || '');
      setDueTime(task.dueTime || '');
    }
  }, [task]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && taskId) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [taskId, onClose]);

  if (!task) return null;

  const handleSave = () => {
    if (!title.trim()) return;
    updateTask(task.id, {
      title: title.trim(),
      notes: notes.trim(),
      priority,
      category,
      dueDate: dueDate || undefined,
      dueTime: dueTime || undefined,
    });
    onClose();
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    dispatch({
      type: 'ADD_SUBTASK',
      payload: { taskId: task.id, title: newSubtaskTitle.trim() },
    });
    setNewSubtaskTitle('');
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTag.trim()) return;
    const cleanTag = newTag.trim().toLowerCase().replace(/^#/, '');
    if (!task.tags.includes(cleanTag)) {
      updateTask(task.id, { tags: [...task.tags, cleanTag] });
    }
    setNewTag('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    updateTask(task.id, { tags: task.tags.filter(t => t !== tagToRemove) });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Container (Slide-over desktop, sheet mobile) */}
      <div className="relative w-full max-w-lg h-full glass-panel-elevated bg-neutral-900/95 dark:bg-neutral-950/95 text-neutral-100 flex flex-col z-10 overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleTaskComplete(task.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                task.status === 'completed'
                  ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                  : 'bg-white text-black hover:bg-neutral-200'
              }`}
            >
              {task.status === 'completed' ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reopen</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mark Done</span>
                </>
              )}
            </button>
            <span className="text-xs text-neutral-400 capitalize">
              Status: {task.status.replace('_', ' ')}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Title Input */}
          <div>
            <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
              Task Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-neutral-800/80 border border-neutral-700 rounded-lg px-3.5 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-white transition-colors"
              placeholder="What needs to be done?"
            />
          </div>

          {/* Notes Input */}
          <div>
            <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
              Notes & Details
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-neutral-800/80 border border-neutral-700 rounded-lg p-3 text-xs text-neutral-200 focus:outline-none focus:border-white transition-colors resize-none"
              placeholder="Add context, links, or instructions..."
            />
          </div>

          {/* Scheduling Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Due Date</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-neutral-800/80 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white font-mono-numbers"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Due Time</span>
              </label>
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full bg-neutral-800/80 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white font-mono-numbers"
              />
            </div>
          </div>

          {/* Priority & Category Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full bg-neutral-800/80 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white"
              >
                <option value="low">Low Priority (1 bar)</option>
                <option value="medium">Medium Priority (2 bars)</option>
                <option value="high">High Priority (3 bars)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-neutral-800/80 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white"
              >
                <option value="Work">Work</option>
                <option value="Education">Education</option>
                <option value="Health">Health</option>
                <option value="Shopping">Shopping</option>
                <option value="Personal">Personal</option>
                <option value="Finance">Finance</option>
                <option value="General">General</option>
              </select>
            </div>
          </div>

          {/* Subtasks Section */}
          <div className="pt-2 border-t border-neutral-800">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                Subtasks ({task.subtasks.filter(s => s.done).length}/{task.subtasks.length})
              </label>
            </div>

            <div className="space-y-2 mb-3">
              {task.subtasks.map((st) => (
                <div
                  key={st.id}
                  className="flex items-center justify-between gap-2 p-2 rounded-lg bg-neutral-800/50 border border-neutral-700/50"
                >
                  <button
                    onClick={() => dispatch({ type: 'TOGGLE_SUBTASK', payload: { taskId: task.id, subtaskId: st.id } })}
                    className="flex items-center gap-2 text-xs text-left flex-1"
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                      st.done ? 'bg-white border-white text-black' : 'border-neutral-500'
                    }`}>
                      {st.done && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className={st.done ? 'line-through text-neutral-500' : 'text-neutral-200'}>
                      {st.title}
                    </span>
                  </button>

                  <button
                    onClick={() => dispatch({ type: 'REMOVE_SUBTASK', payload: { taskId: task.id, subtaskId: st.id } })}
                    className="p-1 text-neutral-500 hover:text-neutral-300"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddSubtask} className="flex gap-2">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                placeholder="Add new subtask..."
                className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-medium flex items-center gap-1 border border-neutral-700"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </form>
          </div>

          {/* Tags */}
          <div className="pt-2 border-t border-neutral-800">
            <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" />
              <span>Tags</span>
            </label>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {task.tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 text-xs text-neutral-300 border border-neutral-700 px-2 py-0.5 rounded-md bg-neutral-800/60"
                >
                  #{t}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(t)}
                    className="hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            <form onSubmit={handleAddTag} className="flex gap-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add tag (e.g. dev, urgent)..."
                className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-medium border border-neutral-700"
              >
                Add Tag
              </button>
            </form>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 border-t border-neutral-800 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              if (window.confirm(`Are you sure you want to delete "${task.title}"?`)) {
                deleteTask(task.id);
                onClose();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-400 hover:text-white border border-neutral-800 hover:border-neutral-600 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Task</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 text-xs font-semibold bg-white text-black hover:bg-neutral-200 rounded-lg shadow-sm transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
