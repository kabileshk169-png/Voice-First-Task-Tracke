# Voice-First Daily Task Tracker

An ambient, high-velocity daily task manager designed with Google Stitch glassmorphic aesthetics and powered by a 100% client-side natural speech and language parser.

---

## 1. Project Overview

**Voice-First Daily Task Tracker (VFDTT)** is a production-grade, frontend-only productivity operating system. It merges ambient, monochrome glassmorphism with an intelligent voice-first pipeline: capturing thoughts, scheduling tasks with dates/times/priorities, tracking time-critical alerts, visualizing productivity trends, and managing calendar timelines—without requiring any external server, database, or API keys.

---

## 2. Features

- **Ambient Stitch Glassmorphism**: Strict monochrome dark and light modes with translucent glass panels, backdrop blurs, optical borders, and zero-pill discipline.
- **Unified Single Source of Truth**: All screens (Dashboard, Tasks, Calendar, Reminders, Analytics, History) share the exact same synchronized React state.
- **Intelligent Voice Assistant**: Dictate tasks or commands with real-time audio visualization, entity parsing, visual confirmation cards, and spoken audio response.
- **Full Fallback Capabilities**: Graceful "Type instead" and "Open in new browser tab" options if microphone permissions are restricted in embedded iframes.
- **Full-Featured Task Management**:
  - Priorities (Low, Medium, High) with visual bar indicators.
  - Categories (Work, Education, Health, Shopping, Personal, Finance, General).
  - Subtask tracking with interactive checklists and real-time progress bars.
  - Tag management.
  - Due dates & 24h/12h due times.
  - Recurring tasks with automatic clone generation on completion (daily, weekly, monthly).
  - Overdue status auto-evaluation.
  - Interactive board view (grouped by status) and list view.
- **Interactive Calendar Schedule**:
  - Month, Week, and Day views.
  - Click any calendar date or hour slot to instantly schedule a task.
- **Real-Time Productivity Analytics**:
  - Total tasks, completion rate %, active daily streaks, and overdue load.
  - Hand-built monochrome 7-day velocity bar charts.
  - Category and priority distribution breakdown.
  - Local AI productivity diagnostics.
- **Time-Critical Reminders**:
  - Browser-interval alert monitoring with in-app notifications and sound tones.
- **Activity & History Audit Log**:
  - History of created, updated, completed, and voice-executed actions.
  - Trash bin with one-click restore and hard-delete options.
  - Task archiving and unarchiving.
- **Comprehensive Undo Pipeline**:
  - Immediate toast undo and modal undo for task creation, completion, modification, and deletion.
  - Global `Ctrl+Z` / `Cmd+Z` keyboard shortcut.
- **Data Export & Import**:
  - Instant JSON backup download and restore.
  - Reset to demo dataset or clear all state.

---

## 3. Voice Assistant Architecture

The voice engine operates entirely in the browser using the Web Speech API and an embedded NLP parsing engine:

```
Speech Audio
   ↓
Web Speech API (SpeechRecognition)
   ↓
Live Transcript
   ↓
Token & Grammar Parser (Regex & Token Overlap)
   ↓
Intent & Entity Extraction (Title, Date, Time, Priority, Category)
   ↓
Confirmation Card / Auto-Confirm Evaluation
   ↓
State Action Dispatch
   ↓
UI & Calendar & Analytics Sync
   ↓
History & Notification Update
   ↓
Speech Synthesis Response (Audio Feedback)
   ↓
Undo Hook
```

---

## 4. Supported Voice Commands

The rule-based parser supports 13 core command intents:

| Intent | Command Examples | Action Performed |
|---|---|---|
| **CREATE_TASK** | `"Add a task to complete my Python assignment tomorrow at 6 PM."`<br>`"Add a Python assignment tomorrow at 6 PM."`<br>`"Schedule team design review on Friday at 2 PM"` | Extracts title, date, time, priority, category and adds task to state. |
| **COMPLETE_TASK** | `"Mark my Python assignment as completed."`<br>`"Complete Python assignment"`<br>`"Check off groceries"` | Fuzzy matches task title and toggles status to completed. |
| **DELETE_TASK** | `"Delete the Python assignment."`<br>`"Remove task Python assignment"` | Matches task and moves to trash (always requires confirmation). |
| **UPDATE_TASK** | `"Move my Python assignment to tomorrow."`<br>`"Reschedule meeting to 4 PM."` | Updates date, time, or priority of matching task. |
| **CREATE_REMINDER** | `"Remind me to study at 7 PM."`<br>`"Set a reminder for 7 PM to call mom."` | Creates time-critical alert with scheduled alarm. |
| **UPDATE_REMINDER** | `"Update reminder study to 8 PM."`<br>`"Reschedule reminder to call mom to tomorrow."` | Modifies active reminder timing. |
| **DELETE_REMINDER** | `"Delete reminder study."`<br>`"Remove reminder to call mom."` | Removes scheduled reminder from state. |
| **FILTER_TASKS** | `"What tasks are overdue?"`<br>`"Show my tasks for tomorrow."`<br>`"Show my completed tasks."`<br>`"Show today's tasks."` | Navigates to Tasks and filters by overdue, tomorrow, today, or completed. |
| **SEARCH_TASKS** | `"Search for Python."`<br>`"Find architecture."` | Navigates to Tasks and applies keyword query. |
| **CALENDAR_QUERY** | `"Go to calendar."`<br>`"What do I have on my calendar?"`<br>`"Show my schedule."` | Navigates to Calendar view. |
| **ANALYTICS_QUERY**| `"Show my productivity this week."`<br>`"How productive was I this week?"` | Navigates to Analytics dashboard. |
| **NAVIGATE** | `"Go to dashboard."`<br>`"Open settings."`<br>`"Switch to history."` | Switches active screen viewport. |
| **UNKNOWN** | Any ambiguous input | Asks clarification question without guessing. |

---

## 5. Technology Stack

- **Framework**: React 19 SPA
- **Language**: TypeScript 5.7+ (strict typing)
- **Bundler & Dev Server**: Vite 6
- **Styling**: Tailwind CSS 4 with custom CSS variables (`--bg-base`, `--bg-surface`, `--border-subtle`, `--glass-blur`)
- **Icons**: Lucide React
- **Typography**: Plus Jakarta Sans, JetBrains Mono
- **Speech**: HTML5 Web Speech Recognition & Web Speech Synthesis

---

## 6. LocalStorage Architecture

The application is completely frontend-only and requires no backend database:
- **Versioned Key**: `vfdtt:v1`
- **Stored Data**: Tasks, Reminders, Activity Logs, Notifications, and User Settings.
- **Transient State**: Modals, toasts, and temporary undo stacks are isolated in memory.
- **Resilience**: Corrupted or missing localStorage entries fall back gracefully to pristine default states without crashing.

---

## 7. Getting Started

### Prerequisites
- Node.js (version 18 or higher recommended)
- npm or yarn

---

## 8. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/your-username/voice-first-task-tracker.git
cd voice-first-task-tracker
npm install
```

---

## 9. Development

Start the local Vite development server:

```bash
npm run dev
```

The app will be accessible at `http://localhost:3000`.

---

## 10. Production Build

Build the project for production deployment:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

---

## 11. Vercel Deployment Guide

Deploying to [Vercel](https://vercel.com) takes less than 60 seconds:

1. **Push to GitHub**: Ensure all commits are pushed to your GitHub repository.
2. **Import into Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new).
   - Select your `voice-first-task-tracker` repository.
3. **Project Settings**:
   - **Framework Preset**: `Vite` (automatically detected)
   - **Root Directory**: `./`
   - **Build Command**: `npm run build` (or `vite build`)
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
4. **Environment Variables**:
   - **Required: NONE**.
   - No `.env` keys or external tokens are required.
5. **Deploy**:
   - Click **Deploy**. Vercel will build and serve your app globally with HTTPS and SPA routing enabled via `vercel.json`.

---

## 12. Browser Compatibility

- **Google Chrome / Chromium**: Full support for Web Speech Recognition and Synthesis.
- **Apple Safari**: Speech Recognition supported on macOS/iOS (requires microphone permission).
- **Mozilla Firefox**: Full UI and task management support; speech fallback available via typed command bar.
- **Microsoft Edge**: Full support for Speech Recognition and Synthesis.

---

## 12. Voice Permission Requirements

- Browsers require explicit user consent to access the microphone (`navigator.mediaDevices.getUserMedia`).
- Voice recognition must be served over `https://` (or `http://localhost` during development).
- If microphone permissions are denied, the application displays a friendly fallback banner and keyboard prompt.

---

## 13. AI Studio Iframe Microphone Limitation

When previewing web applications inside sandboxed iframes (such as Google AI Studio preview or code playgrounds):
- Browsers often block audio capture within cross-origin `<iframe>` contexts due to permission policies (`allow="microphone"`).
- **Built-in Handling**:
  1. The app detects restricted frames automatically.
  2. Displays an immediate notice: *"Voice input isn't available here."*
  3. Provides an **"Open in new tab"** button to run in top-level context with full microphone access.
  4. Provides a **"Type instead"** prompt utilizing the exact same NLP pipeline.

---

## 14. Project Structure

```
├── .gitignore
├── index.html
├── metadata.json
├── package.json
├── tsconfig.json
├── vite.config.ts
├── README.md
└── src/
    ├── App.tsx
    ├── main.tsx
    ├── index.css
    ├── components/
    │   ├── MobileNav.tsx
    │   ├── Navbar.tsx
    │   ├── NotificationsPanel.tsx
    │   ├── QuickAddModal.tsx
    │   ├── SearchModal.tsx
    │   ├── Sidebar.tsx
    │   ├── TaskCard.tsx
    │   ├── TaskDrawer.tsx
    │   ├── ToastContainer.tsx
    │   └── VoiceModal.tsx
    ├── screens/
    │   ├── AnalyticsScreen.tsx
    │   ├── CalendarScreen.tsx
    │   ├── DashboardScreen.tsx
    │   ├── HistoryScreen.tsx
    │   ├── ProfileScreen.tsx
    │   ├── RemindersScreen.tsx
    │   ├── SettingsScreen.tsx
    │   ├── TasksScreen.tsx
    │   └── VoiceAssistantScreen.tsx
    ├── state/
    │   ├── AppContext.tsx
    │   └── types.ts
    ├── lib/
    │   ├── analytics.ts
    │   ├── dates.ts
    │   ├── parser.ts
    │   ├── speech.ts
    │   └── storage.ts
    └── data/
        └── demoData.ts
```

---

## 15. Future Improvements

1. **Custom Speech Hotwords**: Optional local wake-word detection (e.g. "Hey Tracker") using Web Audio API worklets.
2. **Offline PWA Service Worker**: Adding manifest caching for complete offline functionality on mobile home screens.
3. **iCalendar / CalDAV Sync**: Client-side `.ics` subscription and calendar feed export.
4. **Natural Language Recurrence Rules**: Expanding parser support for expressions like "every other Tuesday" and "weekdays at 9 AM".

---

## License

Apache-2.0 License
