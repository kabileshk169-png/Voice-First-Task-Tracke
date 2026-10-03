import React, { useState } from 'react';
import { User, Mail, Award, Flame, CheckCircle2, Settings, LogOut, Check } from 'lucide-react';
import { useApp } from '../state/AppContext';
import { computeAnalytics } from '../lib/analytics';

export const ProfileScreen: React.FC = () => {
  const { state, dispatch, navigate, showToast } = useApp();
  const analytics = computeAnalytics(state.tasks);

  const [name, setName] = useState(state.settings.userName);
  const [email, setEmail] = useState(state.settings.userEmail);
  const [isEditing, setIsEditing] = useState(false);
  const [isSignedOutDemo, setIsSignedOutDemo] = useState(false);

  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    dispatch({
      type: 'UPDATE_SETTINGS',
      payload: { userName: name.trim(), userEmail: email.trim() },
    });
    setIsEditing(false);
    showToast('Profile updated.', { type: 'success' });
  };

  if (isSignedOutDemo) {
    return (
      <div className="glass-panel p-12 rounded-2xl max-w-md mx-auto text-center space-y-4 my-12">
        <div className="w-12 h-12 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center mx-auto text-neutral-800 dark:text-neutral-200">
          <User className="w-6 h-6 stroke-[1.5]" />
        </div>
        <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
          Signed Out (Demo Mode)
        </h3>
        <p className="text-xs text-neutral-500">
          You are currently previewing the signed-out state. This frontend prototype runs fully local in your browser.
        </p>
        <button
          onClick={() => setIsSignedOutDemo(false)}
          className="px-4 py-2 bg-neutral-900 text-white dark:bg-white dark:text-black font-semibold text-xs rounded-xl shadow-sm"
        >
          Sign Back In
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-12 max-w-4xl mx-auto">
      {/* Profile Header Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <div className="w-20 h-20 rounded-full border-2 border-neutral-300 dark:border-neutral-700 bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-2xl font-bold flex items-center justify-center shrink-0 shadow-sm">
          {initials}
        </div>

        <div className="flex-1 text-center sm:text-left space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
            {state.settings.userName}
          </h2>
          <p className="text-xs text-neutral-500 flex items-center justify-center sm:justify-start gap-1.5 font-mono-numbers">
            <Mail className="w-3.5 h-3.5" />
            <span>{state.settings.userEmail}</span>
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span className="text-[11px] font-mono-numbers px-2.5 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-700">
              Local Storage Mode
            </span>
            <span className="text-[11px] font-mono-numbers px-2.5 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-700">
              Web Speech Enabled
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-xs font-semibold"
          >
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>
      </div>

      {/* Edit Profile Form if open */}
      {isEditing && (
        <form
          onSubmit={handleSaveProfile}
          className="glass-panel p-6 rounded-2xl space-y-4 animate-in fade-in"
        >
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
            Edit Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-neutral-500 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white/60 dark:bg-neutral-900/60 border border-neutral-300 dark:border-neutral-800 rounded-lg p-2 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-neutral-500 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/60 dark:bg-neutral-900/60 border border-neutral-300 dark:border-neutral-800 rounded-lg p-2 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="submit"
              className="px-4 py-2 bg-neutral-900 text-white dark:bg-white dark:text-black font-semibold text-xs rounded-lg shadow-sm"
            >
              Save Profile
            </button>
          </div>
        </form>
      )}

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl text-center">
          <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
            Total Tasks
          </span>
          <span className="text-2xl font-bold font-mono-numbers text-neutral-900 dark:text-neutral-50 mt-1 block">
            {analytics.totalTasks}
          </span>
        </div>

        <div className="glass-panel p-4 rounded-xl text-center">
          <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
            Completed
          </span>
          <span className="text-2xl font-bold font-mono-numbers text-neutral-900 dark:text-neutral-50 mt-1 block">
            {analytics.completedTasks}
          </span>
        </div>

        <div className="glass-panel p-4 rounded-xl text-center">
          <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
            Streak
          </span>
          <span className="text-2xl font-bold font-mono-numbers text-neutral-900 dark:text-neutral-50 mt-1 block">
            {analytics.currentStreak} Days
          </span>
        </div>

        <div className="glass-panel p-4 rounded-xl text-center">
          <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
            Completion Rate
          </span>
          <span className="text-2xl font-bold font-mono-numbers text-neutral-900 dark:text-neutral-50 mt-1 block">
            {analytics.completionRate}%
          </span>
        </div>
      </div>

      {/* Account Shortcuts */}
      <div className="glass-panel p-6 rounded-2xl space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
          Account Shortcuts
        </h3>

        <div className="space-y-2">
          <button
            onClick={() => navigate('settings')}
            className="w-full p-3 rounded-xl bg-white/40 dark:bg-neutral-900/40 hover:bg-white/80 dark:hover:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-800 dark:text-neutral-200 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span>Notification and Engine Preferences</span>
            </div>
            <span className="text-neutral-400">Settings →</span>
          </button>

          <button
            onClick={() => {
              if (window.confirm('Simulate signing out of demo profile?')) {
                setIsSignedOutDemo(true);
              }
            }}
            className="w-full p-3 rounded-xl bg-white/40 dark:bg-neutral-900/40 hover:bg-white/80 dark:hover:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
          >
            <div className="flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              <span>Sign Out (Simulation)</span>
            </div>
            <span className="text-neutral-400">Exit</span>
          </button>
        </div>
      </div>
    </div>
  );
};
