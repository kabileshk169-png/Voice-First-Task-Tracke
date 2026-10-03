import React, { useEffect } from 'react';
import { X, CheckCheck, Trash2, Bell, AlertCircle, Clock, Mic, Info } from 'lucide-react';
import { useApp } from '../state/AppContext';
import { formatRelativeTime } from '../lib/dates';

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ isOpen, onClose }) => {
  const { state, dispatch } = useApp();

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const renderIcon = (type: string) => {
    switch (type) {
      case 'overdue':
        return <AlertCircle className="w-4 h-4 text-white stroke-[2.5]" />;
      case 'reminder':
      case 'due':
        return <Clock className="w-4 h-4 text-neutral-300" />;
      case 'voice':
        return <Mic className="w-4 h-4 text-neutral-200" />;
      default:
        return <Info className="w-4 h-4 text-neutral-300" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-sm h-full glass-panel-elevated bg-neutral-900/95 dark:bg-neutral-950/95 text-neutral-100 flex flex-col z-10 overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            <h2 className="text-sm font-semibold text-white">Notifications</h2>
          </div>

          <div className="flex items-center gap-1">
            {state.notifications.some(n => !n.read) && (
              <button
                onClick={() => dispatch({ type: 'MARK_ALL_NOTIFICATIONS_READ' })}
                title="Mark all as read"
                className="p-1 text-neutral-400 hover:text-white rounded"
              >
                <CheckCheck className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => dispatch({ type: 'CLEAR_NOTIFICATIONS' })}
              title="Clear all"
              className="p-1 text-neutral-400 hover:text-white rounded"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1 text-neutral-400 hover:text-white rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {state.notifications.length === 0 ? (
            <div className="py-12 text-center text-xs text-neutral-500">
              No notifications at this time.
            </div>
          ) : (
            state.notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => {
                  dispatch({ type: 'MARK_NOTIFICATION_READ', payload: { id: notif.id } });
                  if (notif.relatedTaskId) {
                    dispatch({ type: 'SET_SELECTED_TASK_ID', payload: notif.relatedTaskId });
                    onClose();
                  }
                }}
                className={`p-3 rounded-xl border transition-colors cursor-pointer flex items-start gap-3 ${
                  notif.read
                    ? 'bg-neutral-900/40 border-neutral-800/50 opacity-70'
                    : 'bg-neutral-900/90 border-neutral-700/80'
                }`}
              >
                <div className="mt-0.5 p-1 rounded-md bg-neutral-800 border border-neutral-700 shrink-0">
                  {renderIcon(notif.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className={`text-xs ${notif.read ? 'font-normal text-neutral-300' : 'font-semibold text-white'}`}>
                      {notif.title}
                    </p>
                    {!notif.read && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-neutral-400 line-clamp-2">
                    {notif.message}
                  </p>
                  <span className="mt-1 block text-[10px] text-neutral-500 font-mono-numbers">
                    {formatRelativeTime(notif.timestamp)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
