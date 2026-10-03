import { ParsedCommand, Task, Reminder, TaskPriority, ScreenId } from '../state/types';
import { getTodayISO, getTomorrowISO, getDaysOffsetISO, formatTime12h, formatDateLabel } from './dates';

/**
 * Fuzzy search match between task query and existing tasks
 */
export function findMatchingTask(query: string, tasks: Task[]): Task | undefined {
  if (!query || tasks.length === 0) return undefined;
  const cleanQuery = query
    .toLowerCase()
    .replace(/[.,!?;]+$/, '')
    .replace(/^(my|the|a|task|reminder)\s+/i, '')
    .trim();

  if (!cleanQuery) return undefined;

  // 1. Exact or substring match on title
  const exact = tasks.find(t => t.title.toLowerCase().includes(cleanQuery));
  if (exact) return exact;

  // 2. Token overlap score
  const queryTokens = cleanQuery.split(/\s+/).filter(w => w.length > 2);
  let bestMatch: Task | undefined = undefined;
  let bestScore = 0;

  for (const task of tasks) {
    const taskTokens = task.title.toLowerCase().split(/\s+/);
    let matchCount = 0;
    for (const q of queryTokens) {
      if (taskTokens.some(t => t.includes(q) || q.includes(t))) {
        matchCount++;
      }
    }
    const score = matchCount / Math.max(queryTokens.length, 1);
    if (score > bestScore && score >= 0.4) {
      bestScore = score;
      bestMatch = task;
    }
  }

  return bestMatch;
}

/**
 * Fuzzy search match between reminder query and existing reminders
 */
export function findMatchingReminder(query: string, reminders: Reminder[]): Reminder | undefined {
  if (!query || reminders.length === 0) return undefined;
  const cleanQuery = query
    .toLowerCase()
    .replace(/[.,!?;]+$/, '')
    .replace(/^(my|the|a|reminder)\s+/i, '')
    .trim();

  if (!cleanQuery) return undefined;

  const exact = reminders.find(r => r.title.toLowerCase().includes(cleanQuery));
  if (exact) return exact;

  const queryTokens = cleanQuery.split(/\s+/).filter(w => w.length > 2);
  let bestMatch: Reminder | undefined = undefined;
  let bestScore = 0;

  for (const reminder of reminders) {
    const reminderTokens = reminder.title.toLowerCase().split(/\s+/);
    let matchCount = 0;
    for (const q of queryTokens) {
      if (reminderTokens.some(t => t.includes(q) || q.includes(t))) {
        matchCount++;
      }
    }
    const score = matchCount / Math.max(queryTokens.length, 1);
    if (score > bestScore && score >= 0.4) {
      bestScore = score;
      bestMatch = reminder;
    }
  }

  return bestMatch;
}

/**
 * Extracts time in HH:mm 24-hour format
 */
export function extractTime(text: string): { time?: string; matchedText?: string } {
  // e.g., "half past five", "half past 6 pm"
  const halfPastMatch = text.match(/half past (\d{1,2})\s*(am|pm)?/i);
  if (halfPastMatch) {
    let hour = parseInt(halfPastMatch[1], 10);
    const ampm = halfPastMatch[2]?.toLowerCase();
    if (ampm === 'pm' && hour < 12) hour += 12;
    if (ampm === 'am' && hour === 12) hour = 0;
    if (!ampm && hour < 8) hour += 12; // default reasonable PM for afternoon
    return {
      time: `${String(hour).padStart(2, '0')}:30`,
      matchedText: halfPastMatch[0],
    };
  }

  // e.g., "at 6 PM", "6:30 pm", "6pm", "at 8:15 AM"
  const standardTimeMatch = text.match(/(?:at\s+)?(\b\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
  if (standardTimeMatch) {
    let hour = parseInt(standardTimeMatch[1], 10);
    const mins = standardTimeMatch[2] || '00';
    const ampm = standardTimeMatch[3].toLowerCase();
    if (ampm === 'pm' && hour < 12) hour += 12;
    if (ampm === 'am' && hour === 12) hour = 0;
    return {
      time: `${String(hour).padStart(2, '0')}:${mins}`,
      matchedText: standardTimeMatch[0],
    };
  }

  // e.g. "at 18:00" or "18:00"
  const militaryTimeMatch = text.match(/(?:at\s+)?\b([01]?\d|2[0-3]):([0-5]\d)\b/i);
  if (militaryTimeMatch) {
    return {
      time: `${militaryTimeMatch[1].padStart(2, '0')}:${militaryTimeMatch[2]}`,
      matchedText: militaryTimeMatch[0],
    };
  }

  // e.g. "at 6" followed by morning/evening/night
  const contextTimeMatch = text.match(/(?:at\s+)(\d{1,2})\s+(in the morning|in the afternoon|in the evening|at night)\b/i);
  if (contextTimeMatch) {
    let hour = parseInt(contextTimeMatch[1], 10);
    const period = contextTimeMatch[2].toLowerCase();
    if ((period.includes('afternoon') || period.includes('evening') || period.includes('night')) && hour < 12) {
      hour += 12;
    }
    return {
      time: `${String(hour).padStart(2, '0')}:00`,
      matchedText: contextTimeMatch[0],
    };
  }

  return {};
}

/**
 * Extracts date in YYYY-MM-DD format
 */
export function extractDate(text: string): { date?: string; matchedText?: string } {
  const lower = text.toLowerCase();

  if (/\bday after tomorrow\b/.test(lower)) {
    return { date: getDaysOffsetISO(2), matchedText: 'day after tomorrow' };
  }
  if (/\btomorrow\b/.test(lower)) {
    return { date: getTomorrowISO(), matchedText: 'tomorrow' };
  }
  if (/\btoday\b/.test(lower)) {
    return { date: getTodayISO(), matchedText: 'today' };
  }

  // Next [DayOfWeek]
  const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const nextDayMatch = lower.match(/(?:next|this)\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/);
  if (nextDayMatch) {
    const targetDayIndex = daysOfWeek.indexOf(nextDayMatch[1]);
    const today = new Date();
    const currentDayIndex = today.getDay();
    let diff = targetDayIndex - currentDayIndex;
    if (diff <= 0) diff += 7;
    return {
      date: getDaysOffsetISO(diff),
      matchedText: nextDayMatch[0],
    };
  }

  // Specific day of week (e.g. "on Friday")
  const onDayMatch = lower.match(/(?:on\s+)(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/);
  if (onDayMatch) {
    const targetDayIndex = daysOfWeek.indexOf(onDayMatch[1]);
    const today = new Date();
    const currentDayIndex = today.getDay();
    let diff = targetDayIndex - currentDayIndex;
    if (diff <= 0) diff += 7;
    return {
      date: getDaysOffsetISO(diff),
      matchedText: onDayMatch[0],
    };
  }

  // e.g. "on the 15th"
  const dayOfMonthMatch = lower.match(/(?:on the |the )(\d{1,2})(?:st|nd|rd|th)?\b/);
  if (dayOfMonthMatch) {
    const day = parseInt(dayOfMonthMatch[1], 10);
    if (day >= 1 && day <= 31) {
      const now = new Date();
      let month = now.getMonth();
      let year = now.getFullYear();
      if (day < now.getDate()) {
        month += 1;
        if (month > 11) {
          month = 0;
          year += 1;
        }
      }
      const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      return { date: iso, matchedText: dayOfMonthMatch[0] };
    }
  }

  return {};
}

/**
 * Extracts priority
 */
export function extractPriority(text: string): { priority?: TaskPriority; matchedText?: string } {
  const lower = text.toLowerCase();
  if (/\b(urgent|critical|high priority|asap|important)\b/.test(lower)) {
    return { priority: 'high', matchedText: 'high' };
  }
  if (/\b(medium priority|normal priority|medium|standard)\b/.test(lower)) {
    return { priority: 'medium', matchedText: 'medium' };
  }
  if (/\b(low priority|low|minor|whenever)\b/.test(lower)) {
    return { priority: 'low', matchedText: 'low' };
  }
  return {};
}

/**
 * Extracts category
 */
export function extractCategory(text: string): string {
  const lower = text.toLowerCase();
  if (/\b(work|meeting|project|client|presentation|code|dev|pr|review|architecture)\b/.test(lower)) return 'Work';
  if (/\b(groceries|buy|shopping|supermarket|store|order)\b/.test(lower)) return 'Shopping';
  if (/\b(workout|gym|run|fitness|exercise|health|doctor|dentist|medicine|hydration)\b/.test(lower)) return 'Health';
  if (/\b(study|read|homework|assignment|class|exam|python|course|machine learning|lecture)\b/.test(lower)) return 'Education';
  if (/\b(call|mom|dad|family|friend|dinner|party|lunch)\b/.test(lower)) return 'Personal';
  if (/\b(tax|finance|invoice|budget|bank|ach|payment)\b/.test(lower)) return 'Finance';
  return 'General';
}

/**
 * Parses user natural language command into structured representation
 */
export function parseVoiceCommand(
  rawInput: string,
  existingTasks: Task[] = [],
  currentScreen: ScreenId = 'dashboard',
  existingReminders: Reminder[] = []
): ParsedCommand {
  const cleanRaw = rawInput.trim();
  // Strip trailing punctuation often inserted by speech recognition
  const text = cleanRaw.replace(/[.,!?;]+$/, '').trim();
  const lower = text.toLowerCase();

  if (!text) {
    return {
      intent: 'unknown',
      confidence: 0,
      rawText: rawInput,
      clarificationQuestion: "I didn't catch that. Tap the microphone and say a command.",
    };
  }

  // 1. NAVIGATION INTENT
  // e.g. "Go to calendar", "Open tasks", "Show analytics", "Switch to settings"
  const navMatch = lower.match(/^(?:go to|open|show|navigate to|switch to)\s+(dashboard|tasks|calendar|voice|reminders|analytics|history|settings|profile)$/i);
  if (navMatch) {
    const targetWord = navMatch[1].toLowerCase();
    const map: Record<string, ScreenId> = {
      dashboard: 'dashboard',
      tasks: 'tasks',
      calendar: 'calendar',
      voice: 'voice',
      reminders: 'reminders',
      analytics: 'analytics',
      history: 'history',
      settings: 'settings',
      profile: 'profile',
    };
    if (map[targetWord]) {
      return {
        intent: 'navigation',
        confidence: 0.96,
        rawText: text,
        navigationTarget: map[targetWord],
        voiceResponseText: `Navigating to ${targetWord}.`,
      };
    }
  }

  // 2. ANALYTICS QUERY INTENT
  // e.g. "Show my productivity this week", "How productive was I this week?", "What is my completion rate?"
  if (
    lower.includes('productivity') ||
    lower.includes('my analytics') ||
    lower.includes('show analytics') ||
    lower.includes('how productive') ||
    lower.includes('how many tasks did i complete') ||
    lower.includes('completion rate') ||
    lower.includes('my streak') ||
    (lower.includes('tasks') && lower.includes('complete') && (lower.includes('week') || lower.includes('month')))
  ) {
    return {
      intent: 'analytics',
      confidence: 0.94,
      rawText: text,
      analyticsMetric: lower.includes('overdue') ? 'overdue' : 'weekly_summary',
      voiceResponseText: "Opening your productivity analytics.",
    };
  }

  // 3. CALENDAR QUERY INTENT
  // e.g. "Go to calendar", "What do I have on my calendar?", "What is on my schedule tomorrow?"
  if (
    lower === 'calendar' ||
    lower.startsWith('check calendar') ||
    lower.startsWith('open calendar') ||
    lower.includes('what do i have on my calendar') ||
    lower.includes('what is on my calendar') ||
    lower.includes('check my schedule') ||
    lower.includes('upcoming events') ||
    (lower.includes('what do i have') && (lower.includes('today') || lower.includes('tomorrow') || lower.includes('this week')))
  ) {
    return {
      intent: 'calendar',
      confidence: 0.92,
      rawText: text,
      voiceResponseText: "Opened your calendar schedule.",
    };
  }

  // 4. FILTER / SEARCH INTENTS
  // e.g. "What tasks are overdue?", "Show overdue tasks", "Show my completed tasks", "Show my tasks for tomorrow"
  if (
    lower.includes('tasks are overdue') ||
    lower.includes('task is overdue') ||
    lower.includes('show overdue') ||
    lower.includes('what is overdue') ||
    lower.includes('what tasks are overdue')
  ) {
    return {
      intent: 'filter',
      confidence: 0.95,
      rawText: text,
      filterMode: 'overdue',
      voiceResponseText: "Showing your overdue tasks.",
    };
  }

  if (
    lower.includes('completed tasks') ||
    lower.includes('show completed') ||
    lower.includes('what tasks are completed') ||
    lower.includes('show finished tasks')
  ) {
    return {
      intent: 'filter',
      confidence: 0.94,
      rawText: text,
      filterMode: 'completed',
      voiceResponseText: "Showing your completed tasks.",
    };
  }

  if (
    lower.includes('tasks for tomorrow') ||
    lower.includes('tasks tomorrow') ||
    lower.includes('what do i have tomorrow') ||
    lower.includes('show tomorrow')
  ) {
    return {
      intent: 'filter',
      confidence: 0.94,
      rawText: text,
      filterMode: 'tomorrow',
      voiceResponseText: "Showing your tasks for tomorrow.",
    };
  }

  if (
    lower.includes('tasks for today') ||
    lower.includes('tasks today') ||
    lower.includes('what do i need to finish today') ||
    lower.includes('what do i have today') ||
    lower.includes('show today')
  ) {
    return {
      intent: 'filter',
      confidence: 0.94,
      rawText: text,
      filterMode: 'today',
      voiceResponseText: "Showing your tasks scheduled for today.",
    };
  }

  if (
    lower.includes('pending tasks') ||
    lower.includes('active tasks') ||
    lower.includes('show pending')
  ) {
    return {
      intent: 'filter',
      confidence: 0.92,
      rawText: text,
      filterMode: 'pending',
      voiceResponseText: "Showing all pending active tasks.",
    };
  }

  // Explicit Search (e.g. "Search for Python", "Find meeting")
  if (lower.startsWith('find ') || lower.startsWith('search for ') || lower.startsWith('search ')) {
    const searchQuery = text
      .replace(/^(find\s+tasks?\s+about|find\s+tasks?\s+for|find|search\s+for|search)\s+/i, '')
      .replace(/^(my|the|a)\s+/i, '')
      .trim();

    if (searchQuery) {
      return {
        intent: 'search',
        confidence: 0.9,
        rawText: text,
        searchQuery,
        voiceResponseText: `Searching tasks for "${searchQuery}".`,
      };
    }
  }

  // 5. REMINDER INTENTS
  // 5a. DELETE_REMINDER: e.g. "Delete reminder to study", "Delete reminder study", "Remove reminder"
  if (
    lower.startsWith('delete reminder') ||
    lower.startsWith('remove reminder') ||
    lower.startsWith('cancel reminder') ||
    (lower.startsWith('delete') && lower.includes('reminder'))
  ) {
    const remTarget = text
      .replace(/^(delete\s+the\s+reminder\s+to|delete\s+reminder\s+to|delete\s+the\s+reminder|delete\s+reminder|remove\s+reminder\s+to|remove\s+reminder|cancel\s+reminder)\s+/i, '')
      .trim();

    const matchedReminder = findMatchingReminder(remTarget, existingReminders);
    if (matchedReminder) {
      return {
        intent: 'delete_reminder',
        confidence: 0.92,
        rawText: text,
        targetReminderId: matchedReminder.id,
        taskTitle: matchedReminder.title,
        voiceResponseText: `Deleted reminder "${matchedReminder.title}".`,
      };
    } else if (remTarget) {
      return {
        intent: 'delete_reminder',
        confidence: 0.5,
        rawText: text,
        taskTitle: remTarget,
        clarificationQuestion: `I couldn't find a reminder matching "${remTarget}". Which reminder should I delete?`,
      };
    } else {
      return {
        intent: 'delete_reminder',
        confidence: 0.4,
        rawText: text,
        clarificationQuestion: "Which reminder would you like me to delete?",
      };
    }
  }

  // 5b. UPDATE_REMINDER: e.g. "Update reminder to study to 8 PM", "Reschedule reminder to 8 PM"
  if (
    (lower.startsWith('update reminder') || lower.startsWith('reschedule reminder') || lower.startsWith('change reminder'))
  ) {
    const timeInfo = extractTime(text);
    const dateInfo = extractDate(text);
    let target = text
      .replace(/^(update|reschedule|change)\s+(the\s+)?reminder\s+(to\s+)?/i, '')
      .trim();

    if (timeInfo.matchedText) {
      target = target.replace(new RegExp(`(?:to\\s+)?${timeInfo.matchedText}`, 'i'), '');
    }
    if (dateInfo.matchedText) {
      target = target.replace(new RegExp(`(?:to\\s+)?${dateInfo.matchedText}`, 'i'), '');
    }
    target = target.replace(/\s+to\s*$/i, '').trim();

    const matched = findMatchingReminder(target, existingReminders);
    return {
      intent: 'update_reminder',
      confidence: 0.85,
      rawText: text,
      targetReminderId: matched?.id,
      taskTitle: matched?.title || target,
      dueTime: timeInfo.time,
      dueDate: dateInfo.date,
      voiceResponseText: `Updated reminder for "${matched?.title || target}".`,
    };
  }

  // 5c. CREATE_REMINDER: e.g. "Remind me to study at 7 PM", "Set a reminder for 7 PM to call mom"
  if (lower.startsWith('remind me') || lower.startsWith('set a reminder') || lower.startsWith('create a reminder')) {
    const timeInfo = extractTime(text);
    const dateInfo = extractDate(text);

    let title = text
      .replace(/^(set a reminder for|set a reminder to|set a reminder|create a reminder to|create a reminder|remind me to|remind me)\s+/i, '')
      .trim();

    if (timeInfo.matchedText) {
      title = title.replace(new RegExp(`(?:at\\s+)?${timeInfo.matchedText}`, 'i'), '');
    }
    if (dateInfo.matchedText) {
      title = title.replace(new RegExp(`(?:on\\s+)?${dateInfo.matchedText}`, 'i'), '');
    }
    title = title
      .replace(/\s+(tomorrow|today|tonight)\b/i, '')
      .replace(/\s+(at|on|for)\s*$/i, '')
      .trim();

    const finalTitle = title ? (title.charAt(0).toUpperCase() + title.slice(1)) : 'Reminder';
    const finalDate = dateInfo.date || getTodayISO();
    const finalTime = timeInfo.time || '19:00';

    return {
      intent: 'create_reminder',
      confidence: title ? 0.92 : 0.6,
      rawText: text,
      taskTitle: finalTitle,
      dueDate: finalDate,
      dueTime: finalTime,
      voiceResponseText: `Done. I've set a reminder for "${finalTitle}" ${dateInfo.matchedText || 'today'} at ${formatTime12h(finalTime)}.`,
    };
  }

  // 6. COMPLETE_TASK INTENT
  // e.g. "Mark my Python assignment as completed.", "Complete Python assignment", "Finish Python assignment", "Check off Python assignment"
  if (
    lower.startsWith('complete ') ||
    lower.startsWith('finish ') ||
    lower.startsWith('done ') ||
    lower.startsWith('check off ') ||
    lower.startsWith('mark ') && (lower.includes('completed') || lower.includes('done'))
  ) {
    let target = text
      .replace(/^(mark|please mark|complete|finish|check off)\s+/i, '')
      .replace(/\s+(as completed|as done|completed|done)$/i, '')
      .replace(/^(my|the|a|task)\s+/i, '')
      .trim();

    const matched = findMatchingTask(target, existingTasks);

    if (matched) {
      return {
        intent: 'complete',
        confidence: 0.94,
        rawText: text,
        taskTitle: matched.title,
        targetTaskId: matched.id,
        voiceResponseText: `Done. I've marked "${matched.title}" as completed.`,
      };
    } else {
      const activeTasks = existingTasks.filter(t => t.status !== 'completed' && !t.deletedAt);
      if (activeTasks.length > 0 && (target === '' || target === 'task')) {
        return {
          intent: 'complete',
          confidence: 0.75,
          rawText: text,
          taskTitle: activeTasks[0].title,
          targetTaskId: activeTasks[0].id,
          voiceResponseText: `Done. I've marked "${activeTasks[0].title}" as completed.`,
        };
      }
      return {
        intent: 'complete',
        confidence: 0.45,
        rawText: text,
        taskTitle: target,
        clarificationQuestion: `I couldn't find a task matching "${target}". Which task would you like to mark completed?`,
      };
    }
  }

  // 7. DELETE_TASK INTENT
  // e.g. "Delete the Python assignment.", "Delete Python assignment", "Remove task Python assignment"
  if (
    lower.startsWith('delete ') ||
    lower.startsWith('remove ') ||
    lower.startsWith('cancel ') ||
    lower.includes('delete the task') ||
    lower.includes('delete task')
  ) {
    let target = text
      .replace(/^(delete\s+the\s+task|delete\s+task|delete|remove\s+the\s+task|remove\s+task|remove|cancel\s+the\s+task|cancel\s+task|cancel)\s+/i, '')
      .replace(/^(the|my|a)\s+/i, '')
      .replace(/i just created/i, '')
      .trim();

    let matched: Task | undefined;
    if (lower.includes('just created') || target === '') {
      matched = existingTasks.find(t => !t.deletedAt);
    } else {
      matched = findMatchingTask(target, existingTasks);
    }

    if (matched) {
      return {
        intent: 'delete',
        confidence: 0.92,
        rawText: text,
        taskTitle: matched.title,
        targetTaskId: matched.id,
        voiceResponseText: `Deleted task "${matched.title}".`,
      };
    }

    return {
      intent: 'delete',
      confidence: 0.4,
      rawText: text,
      taskTitle: target,
      clarificationQuestion: `Which task should I delete?`,
    };
  }

  // 8. UPDATE_TASK INTENT
  // e.g. "Move my Python assignment to tomorrow", "Reschedule Python assignment to 8 PM", "Change priority of Python assignment to high"
  if (
    lower.startsWith('move ') ||
    lower.startsWith('reschedule ') ||
    lower.startsWith('change ') ||
    lower.startsWith('postpone ') ||
    lower.startsWith('delay ')
  ) {
    const timeInfo = extractTime(text);
    const dateInfo = extractDate(text);
    const priorityInfo = extractPriority(text);

    let target = text
      .replace(/^(move|reschedule|change|postpone|delay)\s+(the\s+task|task|my\s+task|the|my|a)?\s*/i, '')
      .replace(/\s+to\s+.*$/i, '')
      .trim();

    const matched = findMatchingTask(target, existingTasks) || existingTasks.find(t => !t.deletedAt);

    if (matched) {
      const responseDate = dateInfo.date ? formatDateLabel(dateInfo.date) : '';
      const responseTime = timeInfo.time ? ` at ${formatTime12h(timeInfo.time)}` : '';
      return {
        intent: 'update',
        confidence: 0.88,
        rawText: text,
        targetTaskId: matched.id,
        taskTitle: matched.title,
        dueDate: dateInfo.date,
        dueTime: timeInfo.time,
        priority: priorityInfo.priority,
        voiceResponseText: `Updated "${matched.title}"${responseDate ? ` for ${responseDate}` : ''}${responseTime}.`,
      };
    }

    return {
      intent: 'update',
      confidence: 0.5,
      rawText: text,
      taskTitle: target,
      clarificationQuestion: `Which task would you like to update?`,
    };
  }

  // 9. CREATE_TASK INTENT
  // e.g. "Add a task to complete my Python assignment tomorrow at 6 PM."
  // e.g. "Add a Python assignment tomorrow at 6 PM."
  // e.g. "Add Python assignment tomorrow at 6 PM."
  // e.g. "Schedule meeting with team tomorrow at 10 AM."
  const timeInfo = extractTime(text);
  const dateInfo = extractDate(text);
  const priorityInfo = extractPriority(text);
  const category = extractCategory(text);

  // Strip action prefix words
  let cleanTitle = text
    .replace(/^(please\s+)?(add a new task to|create a new task to|add a task to|create a task to|add task to|create task to|add a task for|create a task for|add a task|create a task|add task|create task|add a new|create a new|add a|create a|add|create|schedule a task|schedule a|schedule|new task to|new task)\s+/i, '')
    .trim();

  // Strip extracted date and time phrases from title
  if (timeInfo.matchedText) {
    cleanTitle = cleanTitle.replace(new RegExp(`(?:at\\s+)?${timeInfo.matchedText}`, 'i'), '');
  }
  if (dateInfo.matchedText) {
    cleanTitle = cleanTitle.replace(new RegExp(`(?:on\\s+)?${dateInfo.matchedText}`, 'i'), '');
  }
  cleanTitle = cleanTitle
    .replace(/\s+(tomorrow|today|tonight|next week)\b/i, '')
    .replace(/\s+(at|on|for)\s*$/i, '')
    .trim();

  // If after stripping there's no actual task title, ask clarification
  if (!cleanTitle && (dateInfo.date || timeInfo.time)) {
    return {
      intent: 'create',
      confidence: 0.45,
      rawText: text,
      dueDate: dateInfo.date,
      dueTime: timeInfo.time,
      clarificationQuestion: 'What task would you like me to schedule?',
    };
  }

  if (cleanTitle.length > 1) {
    const formattedTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);
    const assignedDate = dateInfo.date || (currentScreen === 'calendar' ? getTodayISO() : getTodayISO());
    const assignedTime = timeInfo.time || '18:00';
    const assignedPriority = priorityInfo.priority || 'medium';

    const dateLabel = dateInfo.matchedText ? dateInfo.matchedText : 'today';
    const timeLabel = timeInfo.matchedText ? ` at ${formatTime12h(assignedTime)}` : '';

    return {
      intent: 'create',
      confidence: 0.94,
      rawText: text,
      taskTitle: formattedTitle,
      dueDate: assignedDate,
      dueTime: assignedTime,
      priority: assignedPriority,
      category,
      tags: [category.toLowerCase()],
      voiceResponseText: `Done. I've added the task for ${dateLabel}${timeLabel}.`,
    };
  }

  // 10. UNKNOWN / AMBIGUOUS INTENT
  return {
    intent: 'unknown',
    confidence: 0.2,
    rawText: text,
    clarificationQuestion: `I'm not sure how to handle "${text}". Try saying "Add a task to buy groceries tomorrow at 5 PM", "Show overdue tasks", or "Go to calendar".`,
  };
}
