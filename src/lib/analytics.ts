import { Task } from '../state/types';
import { isOverdue } from './dates';

export interface ProductivityStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  completionRate: number; // 0 - 100
  currentStreak: number;  // days
  weekDays: { dayName: string; completed: number; created: number }[];
  categoryDistribution: { category: string; count: number; completedCount: number }[];
  priorityDistribution: { priority: string; count: number }[];
  aiInsight: {
    summary: string;
    trend: 'up' | 'steady' | 'needs_attention';
    bestDay: string;
    highlight: string;
  };
}

export function computeAnalytics(tasks: Task[]): ProductivityStats {
  const activeTasks = tasks.filter(t => !t.deletedAt);
  const total = activeTasks.length;

  let completed = 0;
  let pending = 0;
  let overdue = 0;

  for (const task of activeTasks) {
    if (task.status === 'completed') {
      completed++;
    } else {
      if (isOverdue(task.dueDate, task.dueTime)) {
        overdue++;
      } else {
        pending++;
      }
    }
  }

  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Streak computation: check dates of completed tasks
  const completedDates = new Set(
    activeTasks
      .filter(t => t.completedAt)
      .map(t => t.completedAt!.slice(0, 10))
  );

  let streak = 0;
  const cursor = new Date();
  for (let i = 0; i < 30; i++) {
    const iso = cursor.toISOString().slice(0, 10);
    if (completedDates.has(iso)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else if (i === 0) {
      // If none completed today yet, check yesterday before breaking
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  // Week days completion (last 7 days)
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weekDays: { dayName: string; completed: number; created: number }[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    const dayLabel = dayNames[d.getDay()];

    const compCount = activeTasks.filter(t => t.completedAt?.startsWith(iso)).length;
    const createCount = activeTasks.filter(t => t.createdAt.startsWith(iso)).length;

    weekDays.push({
      dayName: dayLabel,
      completed: compCount,
      created: createCount,
    });
  }

  // Category breakdown
  const categoryMap: Record<string, { total: number; completed: number }> = {};
  for (const t of activeTasks) {
    const cat = t.category || 'General';
    if (!categoryMap[cat]) categoryMap[cat] = { total: 0, completed: 0 };
    categoryMap[cat].total++;
    if (t.status === 'completed') categoryMap[cat].completed++;
  }

  const categoryDistribution = Object.entries(categoryMap).map(([category, val]) => ({
    category,
    count: val.total,
    completedCount: val.completed,
  }));

  // Priority distribution
  const priorityDistribution = [
    { priority: 'High', count: activeTasks.filter(t => t.priority === 'high').length },
    { priority: 'Medium', count: activeTasks.filter(t => t.priority === 'medium').length },
    { priority: 'Low', count: activeTasks.filter(t => t.priority === 'low').length },
  ];

  // Best day this week
  let maxCompleted = -1;
  let bestDay = 'Thursday';
  weekDays.forEach(wd => {
    if (wd.completed > maxCompleted) {
      maxCompleted = wd.completed;
      bestDay = wd.dayName;
    }
  });

  // Local AI Insight generation
  let summary = '';
  let trend: 'up' | 'steady' | 'needs_attention' = 'steady';
  if (completionRate >= 70) {
    summary = `You completed ${completed} out of ${total} tasks this cycle, maintaining strong forward momentum.`;
    trend = 'up';
  } else if (overdue > 2) {
    summary = `You have ${overdue} overdue tasks requiring attention. Consider rescheduling or breaking them down.`;
    trend = 'needs_attention';
  } else {
    summary = `Consistent execution this week. You have ${pending} tasks in progress across ${categoryDistribution.length} focus areas.`;
    trend = 'steady';
  }

  const highlight = streak >= 2
    ? `${streak}-day completion streak active.`
    : `Peak completion occurred on ${bestDay}.`;

  return {
    totalTasks: total,
    completedTasks: completed,
    pendingTasks: pending,
    overdueTasks: overdue,
    completionRate,
    currentStreak: streak,
    weekDays,
    categoryDistribution,
    priorityDistribution,
    aiInsight: {
      summary,
      trend,
      bestDay,
      highlight,
    },
  };
}
