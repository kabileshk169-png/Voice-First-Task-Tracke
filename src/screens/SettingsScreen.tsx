import React, { useRef } from 'react';
import {
  Settings,
  Mic,
  Bell,
  Sliders,
  Shield,
  Moon,
  Sun,
  Download,
  Upload,
  Trash2,
  RotateCcw,
  Check,
} from 'lucide-react';
import { useApp } from '../state/AppContext';
import { TaskPriority } from '../state/types';

export const SettingsScreen: React.FC = () => {
  const { state, dispatch, showToast } = useApp();
  const settings = state.settings;
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleExportData = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `vfdtt_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Data exported successfully as JSON.', { type: 'success' });
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (parsed && typeof parsed === 'object') {
          dispatch({ type: 'IMPORT_DATA', payload: parsed });
          showToast('Data imported successfully!', { type: 'success' });
        } else {
          showToast('Invalid backup file format.', { type: 'error' });
        }
      } catch {
        showToast('Failed to parse backup JSON file.', { type: 'error' });
      }
    };
    reader.readAsText(file);
    // Reset file input
    e.target.value = '';
  };

  return (
    <div className="space-y-6 pb-20 md:pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="glass-panel p-5 rounded-2xl flex items-center justify-between">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-50 tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 stroke-[1.75]" />
            <span>Preferences & System Settings</span>
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Configure speech engine, notifications, defaults and theme.
          </p>
        </div>
      </div>

      {/* APPEARANCE SECTION: STRICTLY LIGHT AND DARK ONLY */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
          <span>Appearance</span>
        </h3>
        <p className="text-xs text-neutral-500">
          Strictly monochromatic black, white, and neutral grays with frosted glass surfaces.
        </p>

        <div className="grid grid-cols-2 gap-4 max-w-md">
          <button
            onClick={() => dispatch({ type: 'SET_THEME', payload: 'light' })}
            className={`p-4 rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold transition-all ${
              settings.theme === 'light'
                ? 'border-2 border-neutral-900 bg-white text-neutral-950 shadow-md'
                : 'border-neutral-300 dark:border-neutral-800 bg-white/40 dark:bg-neutral-900/40 text-neutral-600 dark:text-neutral-400 hover:border-neutral-500'
            }`}
          >
            <Sun className="w-4 h-4" />
            <span>Light Mode</span>
            {settings.theme === 'light' && <Check className="w-3.5 h-3.5 ml-1" />}
          </button>

          <button
            onClick={() => dispatch({ type: 'SET_THEME', payload: 'dark' })}
            className={`p-4 rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold transition-all ${
              settings.theme === 'dark'
                ? 'border-2 border-white bg-neutral-950 text-white shadow-md'
                : 'border-neutral-300 dark:border-neutral-800 bg-white/40 dark:bg-neutral-900/40 text-neutral-600 dark:text-neutral-400 hover:border-neutral-500'
            }`}
          >
            <Moon className="w-4 h-4" />
            <span>Dark Mode</span>
            {settings.theme === 'dark' && <Check className="w-3.5 h-3.5 ml-1" />}
          </button>
        </div>
      </div>

      {/* VOICE ASSISTANT SECTION */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
          <Mic className="w-4 h-4" />
          <span>Voice Assistant Engine</span>
        </h3>

        <div className="space-y-4 divide-y divide-neutral-200/50 dark:divide-neutral-800/50 text-xs">
          {/* Enable Voice */}
          <div className="pt-2 flex items-center justify-between">
            <div>
              <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                Voice Assistant Enabled
              </p>
              <p className="text-neutral-500">
                Show floating mic buttons and accept speech input
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.voiceEnabled}
              onChange={(e) => dispatch({ type: 'UPDATE_SETTINGS', payload: { voiceEnabled: e.target.checked } })}
              className="w-4 h-4 accent-neutral-900 dark:accent-neutral-100 cursor-pointer"
            />
          </div>

          {/* Voice Response (speechSynthesis) */}
          <div className="pt-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                Spoken Voice Feedback
              </p>
              <p className="text-neutral-500">
                Assistant speaks confirmation replies using Web Speech synthesis
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.voiceResponse}
              onChange={(e) => dispatch({ type: 'UPDATE_SETTINGS', payload: { voiceResponse: e.target.checked } })}
              className="w-4 h-4 accent-neutral-900 dark:accent-neutral-100 cursor-pointer"
            />
          </div>

          {/* Auto-Confirm Actions */}
          <div className="pt-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                Auto-Confirm Non-Destructive Actions
              </p>
              <p className="text-neutral-500">
                Immediately create tasks without showing confirmation dialog (delete always confirms)
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.autoConfirmActions}
              onChange={(e) => dispatch({ type: 'UPDATE_SETTINGS', payload: { autoConfirmActions: e.target.checked } })}
              className="w-4 h-4 accent-neutral-900 dark:accent-neutral-100 cursor-pointer"
            />
          </div>

          {/* Sound Tone Feedback */}
          <div className="pt-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                Chime & Audio Cues
              </p>
              <p className="text-neutral-500">
                Synthesized subtle tone on voice start and completion
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.voiceFeedback}
              onChange={(e) => dispatch({ type: 'UPDATE_SETTINGS', payload: { voiceFeedback: e.target.checked } })}
              className="w-4 h-4 accent-neutral-900 dark:accent-neutral-100 cursor-pointer"
            />
          </div>

          {/* Voice Language */}
          <div className="pt-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                Speech Recognition Language
              </p>
              <p className="text-neutral-500">
                Language code used by browser SpeechRecognition
              </p>
            </div>
            <select
              value={settings.voiceLanguage}
              onChange={(e) => dispatch({ type: 'UPDATE_SETTINGS', payload: { voiceLanguage: e.target.value } })}
              className="bg-white/50 dark:bg-neutral-900/50 border border-neutral-300 dark:border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-900 dark:text-neutral-100"
            >
              <option value="en-US">English (US)</option>
              <option value="en-GB">English (UK)</option>
              <option value="es-ES">Spanish (ES)</option>
              <option value="fr-FR">French (FR)</option>
              <option value="de-DE">German (DE)</option>
            </select>
          </div>
        </div>
      </div>

      {/* NOTIFICATIONS SECTION */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
          <Bell className="w-4 h-4" />
          <span>Notification Alerts</span>
        </h3>

        <div className="space-y-4 divide-y divide-neutral-200/50 dark:divide-neutral-800/50 text-xs">
          <div className="pt-2 flex items-center justify-between">
            <div>
              <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                Task Reminders
              </p>
              <p className="text-neutral-500">
                Alerts when tasks with active reminders come due
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.notifyTaskReminders}
              onChange={(e) => dispatch({ type: 'UPDATE_SETTINGS', payload: { notifyTaskReminders: e.target.checked } })}
              className="w-4 h-4 accent-neutral-900 dark:accent-neutral-100 cursor-pointer"
            />
          </div>

          <div className="pt-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                Overdue Task Warnings
              </p>
              <p className="text-neutral-500">
                Prominent warning alerts when tasks pass their deadline
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.notifyOverdue}
              onChange={(e) => dispatch({ type: 'UPDATE_SETTINGS', payload: { notifyOverdue: e.target.checked } })}
              className="w-4 h-4 accent-neutral-900 dark:accent-neutral-100 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* TASK DEFAULTS SECTION */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
          <Sliders className="w-4 h-4" />
          <span>Task Defaults</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-neutral-500 mb-1">
              Default Priority
            </label>
            <select
              value={settings.defaultPriority}
              onChange={(e) => dispatch({ type: 'UPDATE_SETTINGS', payload: { defaultPriority: e.target.value as TaskPriority } })}
              className="w-full bg-white/50 dark:bg-neutral-900/50 border border-neutral-300 dark:border-neutral-800 rounded-lg p-2 text-xs text-neutral-900 dark:text-neutral-100"
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-neutral-500 mb-1">
              Default View
            </label>
            <select
              value={settings.defaultTaskView}
              onChange={(e) => dispatch({ type: 'UPDATE_SETTINGS', payload: { defaultTaskView: e.target.value as any } })}
              className="w-full bg-white/50 dark:bg-neutral-900/50 border border-neutral-300 dark:border-neutral-800 rounded-lg p-2 text-xs text-neutral-900 dark:text-neutral-100"
            >
              <option value="list">List View</option>
              <option value="board">Grouped Board View</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-neutral-500 mb-1">
              Default Reminder Offset
            </label>
            <select
              value={settings.defaultReminderOffset}
              onChange={(e) => dispatch({ type: 'UPDATE_SETTINGS', payload: { defaultReminderOffset: Number(e.target.value) } })}
              className="w-full bg-white/50 dark:bg-neutral-900/50 border border-neutral-300 dark:border-neutral-800 rounded-lg p-2 text-xs text-neutral-900 dark:text-neutral-100"
            >
              <option value={15}>15 Minutes Before</option>
              <option value={30}>30 Minutes Before</option>
              <option value={60}>1 Hour Before</option>
            </select>
          </div>
        </div>
      </div>

      {/* PRIVACY & DATA MANAGEMENT */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
          <Shield className="w-4 h-4" />
          <span>Data Storage & Privacy</span>
        </h3>
        <p className="text-xs text-neutral-500">
          All your tasks, reminders, and audio transcripts remain strictly client-side inside browser localStorage (`vfdtt:v1`).
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleExportData}
            className="px-3.5 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-black text-xs font-semibold flex items-center gap-1.5 shadow-sm hover:opacity-90 transition-opacity"
          >
            <Download className="w-4 h-4" />
            <span>Export Data (JSON)</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleImportFile}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Import Data (JSON)</span>
          </button>

          <button
            onClick={() => {
              if (window.confirm('Reset all tasks and data back to initial demo state?')) {
                dispatch({ type: 'RESET_DEMO_DATA' });
                showToast('Reset to demo dataset.', { type: 'info' });
              }
            }}
            className="px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Demo Data</span>
          </button>

          <button
            onClick={() => {
              if (window.confirm('Delete ALL tasks, reminders, and activity logs? This action cannot be undone.')) {
                dispatch({ type: 'CLEAR_ALL_DATA' });
                showToast('All local data cleared.', { type: 'info' });
              }
            }}
            className="px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 text-neutral-500 hover:text-black dark:hover:text-white text-xs font-medium flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear All Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};
