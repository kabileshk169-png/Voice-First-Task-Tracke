import React from 'react';
import { LayoutDashboard, CheckSquare, Mic, BellRing, Settings } from 'lucide-react';
import { useApp } from '../state/AppContext';
import { ScreenId } from '../state/types';

export const MobileNav: React.FC = () => {
  const { state, navigate, dispatch } = useApp();

  const navItems: { id: ScreenId; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Home', icon: <LayoutDashboard className="w-5 h-5 stroke-[1.5]" /> },
    { id: 'tasks', label: 'Tasks', icon: <CheckSquare className="w-5 h-5 stroke-[1.5]" /> },
    { id: 'reminders', label: 'Alerts', icon: <BellRing className="w-5 h-5 stroke-[1.5]" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5 stroke-[1.5]" /> },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-neutral-900/80 dark:bg-neutral-950/80 backdrop-blur-xl border-t border-neutral-200/20 dark:border-neutral-800/80 px-4 py-2 pb-safe">
      <div className="flex items-center justify-around relative">
        {navItems.slice(0, 2).map((item) => {
          const isActive = state.currentScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] gap-1 transition-colors ${
                isActive ? 'text-white font-semibold' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {item.icon}
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </button>
          );
        })}

        {/* Central Floating Voice Button */}
        <div className="relative -top-4">
          <button
            onClick={() => dispatch({ type: 'SET_VOICE_MODAL_OPEN', payload: true })}
            aria-label="Voice Assistant"
            className="w-13 h-13 rounded-full bg-white text-black shadow-lg flex items-center justify-center border-2 border-neutral-900 dark:border-neutral-950 active:scale-95 transition-transform"
          >
            <Mic className="w-6 h-6 stroke-[2]" />
          </button>
        </div>

        {navItems.slice(2).map((item) => {
          const isActive = state.currentScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] gap-1 transition-colors ${
                isActive ? 'text-white font-semibold' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {item.icon}
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
