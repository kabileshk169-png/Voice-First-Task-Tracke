import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  LayoutList,
  Columns,
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  X,
} from 'lucide-react';
import { useApp } from '../state/AppContext';
import { Task, TaskPriority, TaskStatus } from '../state/types';
import { TaskCard } from '../components/TaskCard';
import { isOverdue, isToday, isTomorrow } from '../lib/dates';

type SortOption = 'dueDate' | 'priority' | 'created' | 'title';

export const TasksScreen: React.FC = () => {
  const { state, dispatch } = useApp();

  const [viewMode, setViewMode] = useState<'list' | 'board'>(
    state.settings.defaultTaskView || 'list'
  );
  const [statusFilter, setStatusFilter] = useState<string>(
    ['overdue', 'today', 'tomorrow', 'pending', 'in_progress', 'completed'].includes(state.filterQuery)
      ? state.filterQuery
      : 'all'
  );
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState(
    !['overdue', 'today', 'tomorrow', 'pending', 'in_progress', 'completed'].includes(state.filterQuery)
      ? state.filterQuery
      : ''
  );
  const [sortBy, setSortBy] = useState<SortOption>('dueDate');

  // React to external voice commands or global filter query changes
  useEffect(() => {
    if (state.filterQuery) {
      if (['overdue', 'today', 'tomorrow', 'pending', 'in_progress', 'completed'].includes(state.filterQuery)) {
        setStatusFilter(state.filterQuery);
        setSearchQuery('');
      } else {
        setSearchQuery(state.filterQuery);
      }
    }
  }, [state.filterQuery]);

  const activeTasks = state.tasks.filter(t => !t.deletedAt && !t.archived);

  // Extract unique categories
  const categories = Array.from(new Set(activeTasks.map(t => t.category).filter(Boolean)));

  // Filter tasks
  const filteredTasks = activeTasks.filter((task) => {
    const isTaskOverdue =
      task.status !== 'completed' && (task.status === 'overdue' || isOverdue(task.dueDate, task.dueTime));

    // Status filter
    if (statusFilter === 'overdue' && !isTaskOverdue) return false;
    if (statusFilter === 'today' && (!task.dueDate || !isToday(task.dueDate))) return false;
    if (statusFilter === 'tomorrow' && (!task.dueDate || !isTomorrow(task.dueDate))) return false;
    if (statusFilter === 'pending' && (task.status !== 'pending' || isTaskOverdue)) return false;
    if (statusFilter === 'in_progress' && (task.status !== 'in_progress' || isTaskOverdue)) return false;
    if (statusFilter === 'completed' && task.status !== 'completed') return false;

    // Priority filter
    if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;

    // Category filter
    if (categoryFilter !== 'all' && task.category !== categoryFilter) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchNotes = task.notes?.toLowerCase().includes(q);
      const matchCategory = task.category.toLowerCase().includes(q);
      const matchTags = task.tags.some(tag => tag.toLowerCase().includes(q));
      if (!matchTitle && !matchNotes && !matchCategory && !matchTags) return false;
    }

    return true;
  });

  // Sort tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === 'dueDate') {
      const dateA = a.dueDate ? `${a.dueDate} ${a.dueTime || '23:59'}` : '9999-99-99';
      const dateB = b.dueDate ? `${b.dueDate} ${b.dueTime || '23:59'}` : '9999-99-99';
      return dateA.localeCompare(dateB);
    }
    if (sortBy === 'priority') {
      const pWeight: Record<TaskPriority, number> = { high: 3, medium: 2, low: 1 };
      return pWeight[b.priority] - pWeight[a.priority];
    }
    if (sortBy === 'created') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortBy === 'title') {
      return a.title.localeCompare(b.title);
    }
    return 0;
  });

  // Board columns
  const boardColumns: { id: TaskStatus; label: string; tasks: Task[] }[] = [
    {
      id: 'pending',
      label: 'Pending',
      tasks: sortedTasks.filter(t => t.status === 'pending' && !isOverdue(t.dueDate, t.dueTime)),
    },
    {
      id: 'in_progress',
      label: 'In Progress',
      tasks: sortedTasks.filter(t => t.status === 'in_progress'),
    },
    {
      id: 'overdue',
      label: 'Overdue',
      tasks: sortedTasks.filter(t => t.status !== 'completed' && isOverdue(t.dueDate, t.dueTime)),
    },
    {
      id: 'completed',
      label: 'Completed',
      tasks: sortedTasks.filter(t => t.status === 'completed'),
    },
  ];

  return (
    <div className="space-y-6 pb-20 md:pb-12">
      {/* Control Bar: Search, Filters, View Modes */}
      <div className="glass-panel p-4 rounded-2xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter tasks by name, note, tag..."
              className="w-full bg-white/60 dark:bg-neutral-900/60 border border-neutral-300 dark:border-neutral-800 rounded-xl pl-9 pr-8 py-2 text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-neutral-900 dark:focus:border-neutral-100 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Action buttons & View toggles */}
          <div className="flex items-center gap-2">
            <div className="flex items-center p-1 bg-neutral-200/60 dark:bg-neutral-900 rounded-lg border border-neutral-300/60 dark:border-neutral-800">
              <button
                onClick={() => setViewMode('list')}
                title="List view"
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                <LayoutList className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('board')}
                title="Board view"
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'board'
                    ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                <Columns className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => dispatch({ type: 'SET_QUICK_ADD_OPEN', payload: true })}
              className="px-3.5 py-2 bg-neutral-900 text-white dark:bg-white dark:text-black font-semibold text-xs rounded-xl flex items-center gap-1.5 shadow-sm hover:opacity-90"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>New Task</span>
            </button>
          </div>
        </div>

        {/* Filter & Sort Chips */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-neutral-200/50 dark:border-neutral-800/50 text-xs">
          {/* Status buttons */}
          <div className="flex flex-wrap items-center gap-1">
            {[
              { id: 'all', label: 'All Tasks' },
              { id: 'today', label: 'Today' },
              { id: 'tomorrow', label: 'Tomorrow' },
              { id: 'pending', label: 'Pending' },
              { id: 'in_progress', label: 'In Progress' },
              { id: 'overdue', label: 'Overdue' },
              { id: 'completed', label: 'Completed' },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setStatusFilter(s.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  statusFilter === s.id
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-black shadow-xs font-semibold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-neutral-800/60'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Secondary select controls */}
          <div className="flex items-center gap-2">
            {/* Priority */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-white/50 dark:bg-neutral-900/50 border border-neutral-300 dark:border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none"
            >
              <option value="all">Priority: All</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            {/* Category */}
            {categories.length > 0 && (
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-white/50 dark:bg-neutral-900/50 border border-neutral-300 dark:border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none"
              >
                <option value="all">Category: All</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            )}

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-white/50 dark:bg-neutral-900/50 border border-neutral-300 dark:border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none"
            >
              <option value="dueDate">Sort: Due Date</option>
              <option value="priority">Sort: Priority</option>
              <option value="created">Sort: Created</option>
              <option value="title">Sort: Title</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main View Area */}
      {sortedTasks.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl text-center space-y-3">
          <CheckCircle2 className="w-10 h-10 text-neutral-400 mx-auto" />
          <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
            No matching tasks found
          </h4>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            Try adjusting your search filters or create a new task using voice or the add button.
          </p>
          <button
            onClick={() => {
              setStatusFilter('all');
              setPriorityFilter('all');
              setCategoryFilter('all');
              setSearchQuery('');
            }}
            className="px-3.5 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 text-xs font-semibold text-neutral-800 dark:text-neutral-200"
          >
            Reset Filters
          </button>
        </div>
      ) : viewMode === 'list' ? (
        <div className="space-y-2.5">
          {sortedTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onSelect={(id) => dispatch({ type: 'SET_SELECTED_TASK_ID', payload: id })}
            />
          ))}
        </div>
      ) : (
        /* Board / Grouped View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {boardColumns.map((col) => (
            <div key={col.id} className="glass-panel p-3.5 rounded-xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-200/60 dark:border-neutral-800/60">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                  {col.label}
                </span>
                <span className="text-[11px] font-mono-numbers text-neutral-500 px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800">
                  {col.tasks.length}
                </span>
              </div>

              <div className="space-y-2 min-h-[120px]">
                {col.tasks.length === 0 ? (
                  <div className="h-24 flex items-center justify-center text-[11px] text-neutral-400 border border-dashed border-neutral-300 dark:border-neutral-800 rounded-lg">
                    Empty
                  </div>
                ) : (
                  col.tasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onSelect={(id) => dispatch({ type: 'SET_SELECTED_TASK_ID', payload: id })}
                    />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
