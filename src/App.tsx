/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './state/AppContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { MobileNav } from './components/MobileNav';
import { VoiceModal } from './components/VoiceModal';
import { QuickAddModal } from './components/QuickAddModal';
import { SearchModal } from './components/SearchModal';
import { NotificationsPanel } from './components/NotificationsPanel';
import { TaskDrawer } from './components/TaskDrawer';
import { ToastContainer } from './components/ToastContainer';

import { DashboardScreen } from './screens/DashboardScreen';
import { TasksScreen } from './screens/TasksScreen';
import { CalendarScreen } from './screens/CalendarScreen';
import { VoiceAssistantScreen } from './screens/VoiceAssistantScreen';
import { RemindersScreen } from './screens/RemindersScreen';
import { AnalyticsScreen } from './screens/AnalyticsScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { ProfileScreen } from './screens/ProfileScreen';

const MainLayout: React.FC = () => {
  const { state, dispatch } = useApp();

  const renderActiveScreen = () => {
    switch (state.currentScreen) {
      case 'dashboard':
        return <DashboardScreen />;
      case 'tasks':
      case 'task_create':
        return <TasksScreen />;
      case 'calendar':
        return <CalendarScreen />;
      case 'voice':
        return <VoiceAssistantScreen />;
      case 'reminders':
        return <RemindersScreen />;
      case 'analytics':
        return <AnalyticsScreen />;
      case 'history':
        return <HistoryScreen />;
      case 'settings':
        return <SettingsScreen />;
      case 'profile':
        return <ProfileScreen />;
      default:
        return <DashboardScreen />;
    }
  };

  return (
    <div className="flex min-h-screen bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 transition-colors">
      {/* Desktop/Tablet Sidebar */}
      <Sidebar />

      {/* Main Viewport Container */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {renderActiveScreen()}
        </main>
      </div>

      {/* Mobile Bottom Navigation with floating Mic */}
      <MobileNav />

      {/* Global Overlays & Modals */}
      <VoiceModal
        isOpen={state.isVoiceModalOpen}
        onClose={() => dispatch({ type: 'SET_VOICE_MODAL_OPEN', payload: false })}
      />

      <QuickAddModal
        isOpen={state.isQuickAddOpen}
        onClose={() => dispatch({ type: 'SET_QUICK_ADD_OPEN', payload: false })}
      />

      <SearchModal
        isOpen={state.isSearchOpen}
        onClose={() => dispatch({ type: 'SET_SEARCH_OPEN', payload: false })}
      />

      <NotificationsPanel
        isOpen={state.isNotificationsOpen}
        onClose={() => dispatch({ type: 'SET_NOTIFICATIONS_OPEN', payload: false })}
      />

      <TaskDrawer
        taskId={state.selectedTaskId}
        onClose={() => dispatch({ type: 'SET_SELECTED_TASK_ID', payload: null })}
      />

      {/* Toast Notification Container with Undo capability */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
