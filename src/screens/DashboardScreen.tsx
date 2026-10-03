import React from 'react';
import {
  Mic,
  Plus,
  ArrowRight,
  AlertCircle,
  Clock,
  CheckCircle2,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../state/AppContext';
import { TaskCard } from '../components/TaskCard';
import { getTimeGreeting, isToday, isOverdue } from '../lib/dates';
import { computeAnalytics } from '../lib/analytics';

export const DashboardScreen: React.FC = () => {
  const { state, dispatch, navigate } = useApp();
  const activeTasks = state.tasks.filter(t => !t.deletedAt);
  const analytics = computeAnalytics(state.tasks);

  // Filter tasks
  const todayTasks = activeTasks.filter(t => isToday(t.dueDate));
  const overdueTasks = activeTasks.filter(t => t.status !== 'completed' && isOverdue(t.dueDate, t.dueTime));
  const upcomingTasks = activeTasks.filter(t => t.dueDate && !isToday(t.dueDate) && !isOverdue(t.dueDate, t.dueTime)).slice(0, 3);

  const completedToday = todayTasks.filter(t => t.status === 'completed').length;
  const todayTotal = todayTasks.length;
  const todayProgress = todayTotal > 0 ? Math.round((completedToday / todayTotal) * 100) : 0;

  return (
    <div className="space-y-6 pb-20 md:pb-12">
      {/* Top Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl">
        <div className="space-y-1">
          <div className="text-xs uppercase font-medium text-neutral-400 dark:text-neutral-500">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
            {getTimeGreeting()}, {state.settings.userName.split(' ')[0]}
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            You have <strong className="text-neutral-900 dark:text-neutral-100">{todayTotal - completedToday}</strong> pending tasks scheduled for today.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => dispatch({ type: 'SET_VOICE_MODAL_OPEN', payload: true })}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-900 text-neutral-50 dark:bg-neutral-100 dark:text-neutral-950 font-semibold text-xs shadow-md hover:opacity-90 transition-opacity"
          >
            <Mic className="w-4 h-4 stroke-[2]" />
            <span>Voice Command</span>
          </button>
          <button
            onClick={() => dispatch({ type: 'SET_QUICK_ADD_OPEN', payload: true })}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50 text-neutral-800 dark:text-neutral-200 text-xs font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Metrics Stat Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Completion Card */}
        <div className="glass-panel p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">
              Today's Rate
            </span>
            <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-50 font-mono-numbers mt-1 block">
              {todayProgress}%
            </span>
            <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
              {completedToday} of {todayTotal} tasks done
            </span>
          </div>
          {/* Circular SVG Progress */}
          <div className="relative w-12 h-12 shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-neutral-200 dark:text-neutral-800"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-neutral-900 dark:text-neutral-100"
                strokeDasharray={`${todayProgress}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
          </div>
        </div>

        {/* Pending Card */}
        <div className="glass-panel p-4 rounded-xl">
          <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">
            Active Pending
          </span>
          <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-50 font-mono-numbers mt-1 block">
            {analytics.pendingTasks}
          </span>
          <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
            Across {analytics.categoryDistribution.length} categories
          </span>
        </div>

        {/* Overdue Card with Strong Double Border */}
        <div className={`p-4 rounded-xl ${
          analytics.overdueTasks > 0
            ? 'glass-panel border-2 border-neutral-900 dark:border-neutral-200'
            : 'glass-panel'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
              Overdue
            </span>
            {analytics.overdueTasks > 0 && (
              <AlertCircle className="w-4 h-4 stroke-[2.5]" />
            )}
          </div>
          <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-50 font-mono-numbers mt-1 block">
            {analytics.overdueTasks}
          </span>
          <span className="text-[11px] text-neutral-600 dark:text-neutral-400">
            {analytics.overdueTasks > 0 ? 'Requires immediate action' : 'All deadlines met'}
          </span>
        </div>

        {/* Streak Card */}
        <div className="glass-panel p-4 rounded-xl">
          <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">
            Streak
          </span>
          <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-50 font-mono-numbers mt-1 block">
            {analytics.currentStreak} Days
          </span>
          <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
            {analytics.completedTasks} tasks finished total
          </span>
        </div>
      </div>

      {/* Main Content Layout: Today's Tasks + Side Voice Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Today's Focus */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold tracking-tight text-neutral-900 dark:text-neutral-100 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Today's Priorities</span>
            </h3>
            <button
              onClick={() => navigate('tasks')}
              className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {todayTasks.length === 0 ? (
            <div className="glass-panel p-8 rounded-xl text-center space-y-3">
              <CheckCircle2 className="w-8 h-8 text-neutral-400 mx-auto" />
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                No tasks scheduled for today. Tap below or use voice to schedule one.
              </p>
              <button
                onClick={() => dispatch({ type: 'SET_QUICK_ADD_OPEN', payload: true })}
                className="px-3 py-1.5 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-black text-xs font-medium"
              >
                Add Today's Task
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {todayTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onSelect={(id) => dispatch({ type: 'SET_SELECTED_TASK_ID', payload: id })}
                />
              ))}
            </div>
          )}

          {/* Overdue Items Banner if any */}
          {overdueTasks.length > 0 && (
            <div className="mt-6 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-950 dark:text-neutral-50">
                <AlertCircle className="w-4 h-4 stroke-[2.5]" />
                <span>Overdue ({overdueTasks.length})</span>
              </div>
              {overdueTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onSelect={(id) => dispatch({ type: 'SET_SELECTED_TASK_ID', payload: id })}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Col: Voice Assistant Action Card + Upcoming */}
        <div className="space-y-6">
          {/* Stitch Voice Assistant Hero Card */}
          <div className="glass-panel-elevated p-6 rounded-2xl relative overflow-hidden bg-neutral-900 text-neutral-100 dark:bg-neutral-900">
            <div className="flex items-start justify-between">
              <div className="w-9 h-9 rounded-xl bg-white text-black flex items-center justify-center font-bold">
                <Mic className="w-5 h-5 stroke-[2]" />
              </div>
              <span className="text-[10px] font-mono-numbers px-2 py-0.5 rounded-full border border-neutral-700 text-neutral-400">
                READY
              </span>
            </div>

            <div className="mt-4">
              <h4 className="text-base font-bold text-white">Voice Assistant</h4>
              <p className="mt-1 text-xs text-neutral-400 leading-relaxed">
                Speak naturally to organize your day. State dates, priorities, or ask what needs attention.
              </p>
            </div>

            <div className="mt-4 p-2.5 rounded-lg bg-neutral-950/80 border border-neutral-800 text-[11px] text-neutral-300 font-mono-numbers">
              "Add a task to complete my assignment tomorrow at 6 PM"
            </div>

            <button
              onClick={() => dispatch({ type: 'SET_VOICE_MODAL_OPEN', payload: true })}
              className="mt-4 w-full py-2.5 px-4 bg-white text-black hover:bg-neutral-200 rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-2"
            >
              <Mic className="w-4 h-4" />
              <span>Tap to Speak</span>
            </button>
          </div>

          {/* Upcoming tasks preview */}
          <div className="glass-panel p-5 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Upcoming</span>
              </h4>
              <button
                onClick={() => navigate('calendar')}
                className="text-[11px] text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200"
              >
                Calendar
              </button>
            </div>

            {upcomingTasks.length === 0 ? (
              <p className="text-xs text-neutral-500 py-3 text-center">
                No future tasks scheduled.
              </p>
            ) : (
              <div className="space-y-2">
                {upcomingTasks.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => dispatch({ type: 'SET_SELECTED_TASK_ID', payload: t.id })}
                    className="p-2.5 rounded-lg bg-white/40 dark:bg-neutral-900/40 hover:bg-white/70 dark:hover:bg-neutral-900/70 border border-neutral-200 dark:border-neutral-800 cursor-pointer transition-colors"
                  >
                    <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                      {t.title}
                    </p>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      {t.dueDate} {t.dueTime && `· ${t.dueTime}`}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
