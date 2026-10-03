import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  AlertCircle,
  CheckCircle2,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { useApp } from '../state/AppContext';
import { formatTime12h, getTodayISO, isOverdue } from '../lib/dates';
import { Task } from '../state/types';

export const CalendarScreen: React.FC = () => {
  const { state, dispatch } = useApp();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState<'month' | 'week' | 'day'>('month');

  const activeTasks = state.tasks.filter(t => !t.deletedAt);

  // Month calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayISO = getTodayISO();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };
  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Generate calendar grid cells (42 cells: 6 rows * 7 columns)
  const calendarCells = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarCells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarCells.push({ day: d, iso });
  }

  const handleCellClick = (iso: string) => {
    dispatch({ type: 'SET_QUICK_ADD_OPEN', payload: { open: true, initialDate: iso } });
  };

  // Week View dates (7 days of current week)
  const currentWeekDays: { name: string; date: number; iso: string }[] = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayOfWeek = currentDate.getDay();
  const weekStart = new Date(currentDate);
  weekStart.setDate(currentDate.getDate() - dayOfWeek);

  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    currentWeekDays.push({
      name: dayNames[i],
      date: d.getDate(),
      iso,
    });
  }

  // Time slots for Day view (8 AM to 8 PM)
  const hours = Array.from({ length: 13 }, (_, i) => i + 8); // 8 to 20

  return (
    <div className="space-y-6 pb-20 md:pb-12">
      {/* Calendar Header Controls */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-50 tracking-tight">
            {monthNames[month]} {year}
          </h2>
          <button
            onClick={goToToday}
            className="px-2.5 py-1 text-xs font-semibold rounded-md border border-neutral-300 dark:border-neutral-700 bg-white/50 dark:bg-neutral-900/50 hover:bg-white dark:hover:bg-neutral-800 transition-colors"
          >
            Today
          </button>
        </div>

        {/* View Switcher and Nav Arrows */}
        <div className="flex items-center gap-3">
          <div className="flex items-center p-1 bg-neutral-200/60 dark:bg-neutral-900 rounded-lg border border-neutral-300/60 dark:border-neutral-800 text-xs">
            {(['month', 'week', 'day'] as const).map((view) => (
              <button
                key={view}
                onClick={() => setCalendarView(view)}
                className={`px-3 py-1 rounded-md font-medium capitalize transition-colors ${
                  calendarView === view
                    ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs font-semibold'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                {view}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white/50 dark:bg-neutral-900/50 hover:bg-white dark:hover:bg-neutral-800"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white/50 dark:bg-neutral-900/50 hover:bg-white dark:hover:bg-neutral-800"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* MONTH VIEW */}
      {calendarView === 'month' && (
        <div className="glass-panel p-4 rounded-2xl overflow-x-auto">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider pb-3 border-b border-neutral-200/50 dark:border-neutral-800/50">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d}>{d}</div>
            ))}
          </div>

          {/* Grid Cells */}
          <div className="grid grid-cols-7 gap-2 mt-2">
            {calendarCells.map((cell, idx) => {
              if (!cell) {
                return (
                  <div
                    key={`empty-${idx}`}
                    className="h-28 rounded-xl bg-neutral-100/20 dark:bg-neutral-900/20 border border-transparent"
                  />
                );
              }

              const isCurrentDay = cell.iso === todayISO;
              const tasksForDay = activeTasks.filter(t => t.dueDate === cell.iso);

              return (
                <div
                  key={cell.iso}
                  onClick={() => handleCellClick(cell.iso)}
                  className={`h-28 p-2 rounded-xl border transition-all flex flex-col justify-between cursor-pointer select-none group ${
                    isCurrentDay
                      ? 'border-2 border-neutral-900 dark:border-neutral-100 bg-neutral-100/60 dark:bg-neutral-900/60 shadow-xs'
                      : 'border-neutral-200/60 dark:border-neutral-800/60 bg-white/40 dark:bg-neutral-900/30 hover:border-neutral-400 dark:hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-mono-numbers font-semibold ${
                        isCurrentDay
                          ? 'w-6 h-6 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-black flex items-center justify-center'
                          : 'text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      {cell.day}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        dispatch({ type: 'SET_QUICK_ADD_OPEN', payload: true });
                      }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                      title="Add task on this date"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Tasks List in Cell */}
                  <div className="space-y-1 overflow-hidden mt-1">
                    {tasksForDay.slice(0, 2).map((t) => (
                      <div
                        key={t.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          dispatch({ type: 'SET_SELECTED_TASK_ID', payload: t.id });
                        }}
                        className={`text-[10px] truncate px-1.5 py-0.5 rounded border transition-colors ${
                          t.status === 'completed'
                            ? 'bg-neutral-200/60 text-neutral-500 border-neutral-300 line-through dark:bg-neutral-800 dark:text-neutral-500 dark:border-neutral-700'
                            : isOverdue(t.dueDate, t.dueTime)
                            ? 'bg-neutral-900 text-white dark:bg-white dark:text-black font-semibold border-neutral-900'
                            : 'bg-white/90 dark:bg-neutral-800/90 text-neutral-800 dark:text-neutral-200 border-neutral-300 dark:border-neutral-700'
                        }`}
                      >
                        {t.title}
                      </div>
                    ))}
                    {tasksForDay.length > 2 && (
                      <span className="text-[10px] text-neutral-500 font-mono-numbers px-1">
                        +{tasksForDay.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* WEEK VIEW */}
      {calendarView === 'week' && (
        <div className="glass-panel p-4 rounded-2xl overflow-x-auto">
          <div className="grid grid-cols-7 gap-3 min-w-[700px]">
            {currentWeekDays.map((wd) => {
              const isCurrentDay = wd.iso === todayISO;
              const dayTasks = activeTasks.filter(t => t.dueDate === wd.iso);

              return (
                <div key={wd.iso} className="space-y-3">
                  <div
                    className={`p-3 rounded-xl border text-center ${
                      isCurrentDay
                        ? 'border-2 border-neutral-900 dark:border-neutral-100 bg-neutral-900 text-white dark:bg-white dark:text-black'
                        : 'border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50'
                    }`}
                  >
                    <div className="text-[11px] uppercase font-semibold">{wd.name}</div>
                    <div className="text-lg font-bold font-mono-numbers mt-0.5">{wd.date}</div>
                  </div>

                  <div className="space-y-2 min-h-[300px] p-2 rounded-xl bg-neutral-100/40 dark:bg-neutral-900/30 border border-neutral-200/50 dark:border-neutral-800/50">
                    {dayTasks.length === 0 ? (
                      <div className="text-[11px] text-neutral-400 text-center py-6">
                        No events
                      </div>
                    ) : (
                      dayTasks.map((t) => (
                        <div
                          key={t.id}
                          onClick={() => dispatch({ type: 'SET_SELECTED_TASK_ID', payload: t.id })}
                          className="p-2 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 cursor-pointer text-xs space-y-1"
                        >
                          <div className="font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                            {t.title}
                          </div>
                          {t.dueTime && (
                            <div className="text-[10px] text-neutral-500 font-mono-numbers flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{formatTime12h(t.dueTime)}</span>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DAY VIEW */}
      {calendarView === 'day' && (
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-200/60 dark:border-neutral-800/60">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              Schedule for {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </h3>
            <button
              onClick={() => dispatch({ type: 'SET_QUICK_ADD_OPEN', payload: true })}
              className="px-3 py-1.5 bg-neutral-900 text-white dark:bg-white dark:text-black rounded-lg text-xs font-semibold"
            >
              Add Slot
            </button>
          </div>

          <div className="space-y-3 divide-y divide-neutral-200/50 dark:divide-neutral-800/50">
            {hours.map((h) => {
              const hourStr = `${String(h).padStart(2, '0')}:00`;
              const formattedSlot = formatTime12h(hourStr);
              const matchingTasks = activeTasks.filter(
                t => t.dueDate === todayISO && t.dueTime && t.dueTime.startsWith(String(h).padStart(2, '0'))
              );

              return (
                <div key={h} className="pt-3 flex items-start gap-4">
                  <span className="w-18 text-xs font-mono-numbers text-neutral-500 shrink-0">
                    {formattedSlot}
                  </span>
                  <div className="flex-1 min-h-[36px]">
                    {matchingTasks.length > 0 ? (
                      <div className="space-y-1.5">
                        {matchingTasks.map((t) => (
                          <div
                            key={t.id}
                            onClick={() => dispatch({ type: 'SET_SELECTED_TASK_ID', payload: t.id })}
                            className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 cursor-pointer flex items-center justify-between"
                          >
                            <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                              {t.title}
                            </span>
                            <span className="text-[11px] text-neutral-500 font-mono-numbers">
                              {t.dueTime && formatTime12h(t.dueTime)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <button
                        onClick={() => dispatch({ type: 'SET_QUICK_ADD_OPEN', payload: true })}
                        className="w-full text-left text-[11px] text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-100/50 dark:hover:bg-neutral-900/50 py-1 px-2 rounded border border-transparent hover:border-neutral-200 dark:hover:border-neutral-800"
                      >
                        + Click to schedule at {formattedSlot}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
