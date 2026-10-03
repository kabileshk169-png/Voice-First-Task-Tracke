import React from 'react';
import {
  BarChart3,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  Calendar,
  Flame,
} from 'lucide-react';
import { useApp } from '../state/AppContext';
import { computeAnalytics } from '../lib/analytics';

export const AnalyticsScreen: React.FC = () => {
  const { state } = useApp();
  const analytics = computeAnalytics(state.tasks);

  // Maximum completions in a single day for SVG scaling
  const maxDayCompleted = Math.max(...analytics.weekDays.map(d => d.completed), 4);

  return (
    <div className="space-y-6 pb-20 md:pb-12 max-w-5xl mx-auto">
      {/* Title Card */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-50 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 stroke-[1.75]" />
            <span>Productivity & Velocity Analytics</span>
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Real-time computation from live task completions and streak logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono-numbers px-2.5 py-1 rounded-lg bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-semibold">
            {analytics.completedTasks} Tasks Completed Total
          </span>
        </div>
      </div>

      {analytics.totalTasks === 0 ? (
        <div className="glass-panel p-12 rounded-2xl text-center space-y-3">
          <BarChart3 className="w-10 h-10 text-neutral-400 mx-auto" />
          <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
            No Task Data Available Yet
          </h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            Create tasks using the add button or speak a command to start tracking your daily completion velocity and category breakdown.
          </p>
        </div>
      ) : (
        <>
          {/* AI Insight Card (Stitch style frosted glass) */}
          <div className="glass-panel-elevated p-6 rounded-2xl bg-neutral-900 text-neutral-100 dark:bg-neutral-950 border border-neutral-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-300">
                <Sparkles className="w-4 h-4 text-white" />
                <span>AI Productivity Diagnostic</span>
              </div>
              <span className="text-[10px] font-mono-numbers px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
                LOCAL ENGINE
              </span>
            </div>

            <p className="text-sm font-semibold text-white leading-relaxed">
              {analytics.aiInsight.summary}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-neutral-400 font-mono-numbers border-t border-neutral-800">
              <div>
                Peak Day: <strong className="text-white">{analytics.aiInsight.bestDay}</strong>
              </div>
              <div>·</div>
              <div>
                Momentum: <strong className="text-white">{analytics.aiInsight.highlight}</strong>
              </div>
              <div>·</div>
              <div>
                Efficiency: <strong className="text-white">{analytics.completionRate}%</strong>
              </div>
            </div>
          </div>

          {/* Primary KPI Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-panel p-4 rounded-xl">
              <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
                Completion Rate
              </span>
              <span className="text-2xl font-bold font-mono-numbers text-neutral-900 dark:text-neutral-50 mt-1 block">
                {analytics.completionRate}%
              </span>
              <span className="text-[11px] text-neutral-500">
                {analytics.completedTasks} of {analytics.totalTasks} tasks
              </span>
            </div>

            <div className="glass-panel p-4 rounded-xl">
              <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
                Active Streak
              </span>
              <span className="text-2xl font-bold font-mono-numbers text-neutral-900 dark:text-neutral-50 mt-1 block flex items-center gap-1.5">
                <Flame className="w-5 h-5 stroke-[2]" />
                <span>{analytics.currentStreak} Days</span>
              </span>
              <span className="text-[11px] text-neutral-500">
                Consecutive daily completions
              </span>
            </div>

            <div className="glass-panel p-4 rounded-xl">
              <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
                In Progress
              </span>
              <span className="text-2xl font-bold font-mono-numbers text-neutral-900 dark:text-neutral-50 mt-1 block">
                {analytics.pendingTasks}
              </span>
              <span className="text-[11px] text-neutral-500">
                Across active focus areas
              </span>
            </div>

            <div className={`p-4 rounded-xl ${
              analytics.overdueTasks > 0
                ? 'glass-panel border-2 border-neutral-900 dark:border-neutral-200'
                : 'glass-panel'
            }`}>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-900 dark:text-neutral-100 block">
                Overdue Load
              </span>
              <span className="text-2xl font-bold font-mono-numbers text-neutral-900 dark:text-neutral-50 mt-1 block">
                {analytics.overdueTasks}
              </span>
              <span className="text-[11px] text-neutral-600 dark:text-neutral-400">
                {analytics.overdueTasks > 0 ? 'Urgent attention required' : 'Zero overdue items'}
              </span>
            </div>
          </div>

          {/* Monochrome SVG Weekly Productivity Bar Chart */}
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span>7-Day Completion Velocity (Hand-Built SVG)</span>
              </h3>
              <span className="text-[11px] text-neutral-500 font-mono-numbers">
                Monochrome Series
              </span>
            </div>

            {/* Hand-built SVG Chart */}
            <div className="pt-4">
              <div className="h-48 w-full flex items-end justify-between gap-3 sm:gap-6 px-2">
                {analytics.weekDays.map((wd) => {
                  const heightPercent = Math.max((wd.completed / maxDayCompleted) * 100, 6);
                  return (
                    <div key={wd.dayName} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                      <span className="text-[11px] font-mono-numbers font-semibold text-neutral-700 dark:text-neutral-300 opacity-0 group-hover:opacity-100 transition-opacity">
                        {wd.completed}
                      </span>
                      <div className="w-full max-w-[42px] bg-neutral-200 dark:bg-neutral-800 rounded-t-lg overflow-hidden h-full flex items-end">
                        <div
                          className="w-full bg-neutral-900 dark:bg-neutral-100 rounded-t-lg transition-all duration-300 group-hover:bg-neutral-700 dark:group-hover:bg-neutral-300"
                          style={{ height: `${heightPercent}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400">
                        {wd.dayName}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Category Breakdown & Priority Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category Breakdown */}
            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
                Task Category Distribution
              </h3>

              {analytics.categoryDistribution.length === 0 ? (
                <p className="text-xs text-neutral-500 py-4 text-center">
                  No categories recorded yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {analytics.categoryDistribution.map((cat) => {
                    const pct = analytics.totalTasks > 0 ? Math.round((cat.count / analytics.totalTasks) * 100) : 0;
                    return (
                      <div key={cat.category} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                            {cat.category}
                          </span>
                          <span className="font-mono-numbers text-neutral-500">
                            {cat.completedCount}/{cat.count} done ({pct}%)
                          </span>
                        </div>
                        <div className="w-full h-2 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-neutral-900 dark:bg-neutral-100 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Priority Distribution */}
            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
                Priority Breakdown
              </h3>

              <div className="space-y-3">
                {analytics.priorityDistribution.map((item) => {
                  const pct = analytics.totalTasks > 0 ? Math.round((item.count / analytics.totalTasks) * 100) : 0;
                  return (
                    <div key={item.priority} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                          {item.priority} Priority
                        </span>
                        <span className="font-mono-numbers text-neutral-500">
                          {item.count} tasks ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-neutral-800 dark:bg-neutral-200 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
