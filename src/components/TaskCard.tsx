import React from 'react';
import {
  Circle,
  CheckCircle2,
  Clock,
  AlertCircle,
  Mic,
  Calendar as CalendarIcon,
  Trash2,
  Check,
} from 'lucide-react';
import { Task, TaskPriority, TaskStatus } from '../state/types';
import { useApp } from '../state/AppContext';
import { formatDateLabel, formatTime12h, isOverdue } from '../lib/dates';

interface TaskCardProps {
  task: Task;
  onSelect?: (taskId: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onSelect }) => {
  const { toggleTaskComplete, deleteTask } = useApp();

  const isActuallyOverdue =
    task.status !== 'completed' && (task.status === 'overdue' || isOverdue(task.dueDate, task.dueTime));

  const effectiveStatus: TaskStatus = isActuallyOverdue
    ? 'overdue'
    : task.status;

  const renderStatusBadge = () => {
    switch (effectiveStatus) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
            <CheckCircle2 className="w-3.5 h-3.5 fill-neutral-700 text-white dark:fill-neutral-300 dark:text-neutral-900" />
            <span>Completed</span>
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-800 dark:text-neutral-200">
            <Clock className="w-3.5 h-3.5 stroke-[2]" />
            <span>In Progress</span>
          </span>
        );
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-950 dark:text-neutral-50">
            <AlertCircle className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="underline decoration-1 underline-offset-2">Overdue</span>
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400">
            <Circle className="w-3.5 h-3.5 stroke-[1.5]" />
            <span>Pending</span>
          </span>
        );
    }
  };

  const renderPriorityIndicator = (priority: TaskPriority) => {
    return (
      <div className="flex items-center gap-1 text-[11px] text-neutral-600 dark:text-neutral-400" title={`Priority: ${priority}`}>
        <div className="flex items-end gap-0.5 h-3">
          <div className="w-1 h-1.5 bg-neutral-800 dark:bg-neutral-300 rounded-[1px]" />
          <div
            className={`w-1 h-2 rounded-[1px] ${
              priority === 'medium' || priority === 'high'
                ? 'bg-neutral-800 dark:bg-neutral-300'
                : 'bg-neutral-300 dark:bg-neutral-700'
            }`}
          />
          <div
            className={`w-1 h-3 rounded-[1px] ${
              priority === 'high'
                ? 'bg-neutral-800 dark:bg-neutral-300'
                : 'bg-neutral-300 dark:bg-neutral-700'
            }`}
          />
        </div>
        <span className="capitalize">{priority}</span>
      </div>
    );
  };

  const completedSubtasks = task.subtasks.filter(s => s.done).length;
  const totalSubtasks = task.subtasks.length;

  return (
    <div
      onClick={() => onSelect && onSelect(task.id)}
      className={`group relative p-4 rounded-xl transition-all cursor-pointer select-none ${
        effectiveStatus === 'overdue'
          ? 'glass-panel border-2 border-neutral-900 dark:border-neutral-200'
          : effectiveStatus === 'completed'
          ? 'glass-panel opacity-65 hover:opacity-85'
          : 'glass-panel hover:border-neutral-400 dark:hover:border-neutral-600'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Completion checkbox button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleTaskComplete(task.id);
          }}
          className={`shrink-0 mt-0.5 w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
            effectiveStatus === 'completed'
              ? 'bg-neutral-900 dark:bg-neutral-100 border-neutral-900 dark:border-neutral-100 text-white dark:text-neutral-900'
              : 'border-neutral-400 dark:border-neutral-600 hover:border-neutral-900 dark:hover:border-neutral-200 bg-white/40 dark:bg-neutral-900/40'
          }`}
          aria-label={effectiveStatus === 'completed' ? 'Reopen task' : 'Complete task'}
        >
          {effectiveStatus === 'completed' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3
              className={`text-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 ${
                effectiveStatus === 'completed' ? 'line-through text-neutral-500 dark:text-neutral-500' : ''
              }`}
            >
              {task.title}
            </h3>

            {/* Quick delete action on hover */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(`Delete task "${task.title}"?`)) {
                  deleteTask(task.id);
                }
              }}
              className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 rounded transition-opacity"
              title="Delete task"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {task.notes && (
            <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2">
              {task.notes}
            </p>
          )}

          {/* Subtask progress bar */}
          {totalSubtasks > 0 && (
            <div className="mt-2.5 flex items-center gap-2">
              <div className="flex-1 h-1 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-neutral-800 dark:bg-neutral-200 rounded-full transition-all"
                  style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
                />
              </div>
              <span className="text-[11px] font-mono-numbers text-neutral-500 dark:text-neutral-400 shrink-0">
                {completedSubtasks}/{totalSubtasks}
              </span>
            </div>
          )}

          {/* Unboxed metadata row with typographic separators */}
          <div className="mt-3 pt-2.5 border-t border-neutral-200/50 dark:border-neutral-800/50 flex flex-wrap items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
            {renderStatusBadge()}
            <span aria-hidden="true" className="text-neutral-300 dark:text-neutral-700">·</span>

            {renderPriorityIndicator(task.priority)}
            <span aria-hidden="true" className="text-neutral-300 dark:text-neutral-700">·</span>

            {task.dueDate && (
              <span className="inline-flex items-center gap-1 font-mono-numbers">
                <CalendarIcon className="w-3 h-3" />
                <span>{formatDateLabel(task.dueDate)}</span>
                {task.dueTime && <span>{formatTime12h(task.dueTime)}</span>}
              </span>
            )}

            {task.category && (
              <>
                <span aria-hidden="true" className="text-neutral-300 dark:text-neutral-700">·</span>
                <span>{task.category}</span>
              </>
            )}

            {task.source === 'voice' && (
              <>
                <span aria-hidden="true" className="text-neutral-300 dark:text-neutral-700">·</span>
                <span className="inline-flex items-center gap-0.5" title="Created via Voice">
                  <Mic className="w-3 h-3 stroke-[2]" />
                  <span className="text-[10px]">Voice</span>
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
