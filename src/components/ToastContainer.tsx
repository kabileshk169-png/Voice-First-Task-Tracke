import React from 'react';
import { Check, X, RotateCcw } from 'lucide-react';
import { useApp } from '../state/AppContext';

export const ToastContainer: React.FC = () => {
  const { state, dispatch } = useApp();

  if (state.toasts.length === 0) return null;

  return (
    <div className="fixed bottom-18 md:bottom-6 right-4 sm:right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {state.toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-xl glass-panel-elevated bg-neutral-900/95 dark:bg-neutral-950/95 border border-neutral-700 text-white shadow-2xl text-xs animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-5 h-5 rounded-full bg-white text-black flex items-center justify-center shrink-0">
              <Check className="w-3 h-3 stroke-[3]" />
            </div>
            <span className="font-medium truncate">{toast.message}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {toast.undoAction && (
              <button
                onClick={() => {
                  toast.undoAction!();
                  dispatch({ type: 'REMOVE_TOAST', payload: toast.id });
                }}
                className="px-2.5 py-1 rounded bg-white text-black font-semibold text-[11px] hover:bg-neutral-200 transition-colors flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3 stroke-[2.5]" />
                <span>{toast.undoLabel || 'Undo'}</span>
              </button>
            )}
            <button
              onClick={() => dispatch({ type: 'REMOVE_TOAST', payload: toast.id })}
              className="p-1 text-neutral-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
