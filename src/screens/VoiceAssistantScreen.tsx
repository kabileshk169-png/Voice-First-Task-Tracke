import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  Send,
  Check,
  RotateCcw,
  Sparkles,
  Command,
  Clock,
  History,
  AlertCircle,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../state/AppContext';
import { VoiceState, ParsedCommand, TaskPriority } from '../state/types';
import { parseVoiceCommand } from '../lib/parser';
import {
  SpeechController,
  isSpeechRecognitionSupported,
  checkMicrophonePermission,
  speakResponse,
  playFeedbackTone,
  MicPermissionState,
} from '../lib/speech';
import { formatTime12h, formatDateLabel } from '../lib/dates';

export const VoiceAssistantScreen: React.FC = () => {
  const {
    state,
    createTask,
    updateTask,
    toggleTaskComplete,
    deleteTask,
    restoreTask,
    navigate,
    showToast,
    dispatch,
  } = useApp();

  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [typedInput, setTypedInput] = useState('');
  const [parsed, setParsed] = useState<ParsedCommand | null>(null);
  const [lastExecutedUndo, setLastExecutedUndo] = useState<(() => void) | null>(null);
  const [micPermission, setMicPermission] = useState<MicPermissionState>('unknown');

  const textInputRef = useRef<HTMLInputElement | null>(null);
  const speechControllerRef = useRef<SpeechController | null>(null);
  const isIframe = typeof window !== 'undefined' && window.self !== window.top;

  useEffect(() => {
    checkMicrophonePermission().then(setMicPermission);

    if (!speechControllerRef.current && isSpeechRecognitionSupported()) {
      speechControllerRef.current = new SpeechController(
        (text, isFinal) => {
          setTranscript(text);
          if (isFinal) {
            handleProcessCommand(text);
          }
        },
        (errorMsg) => {
          setVoiceState('error');
          showToast(errorMsg, { type: 'error' });
        },
        (listening) => {
          if (listening) setVoiceState('listening');
        }
      );
    }

    return () => {
      speechControllerRef.current?.abort();
    };
  }, []);

  const handleStartListening = () => {
    if (!state.settings.voiceEnabled) {
      showToast('Voice Assistant is disabled in Settings.', { type: 'info' });
      return;
    }

    if (state.settings.voiceFeedback) {
      playFeedbackTone('start');
    }

    setTranscript('');
    setVoiceState('listening');

    if (speechControllerRef.current) {
      speechControllerRef.current.start(state.settings.voiceLanguage);
    } else {
      setTimeout(() => {
        setVoiceState('idle');
        showToast("Voice input isn't available here. Please use 'Type instead' below.", { type: 'info' });
        textInputRef.current?.focus();
      }, 600);
    }
  };

  const handleStopListening = () => {
    speechControllerRef.current?.stop();
    if (transcript) {
      handleProcessCommand(transcript);
    } else {
      setVoiceState('idle');
    }
  };

  const handleProcessCommand = (text: string) => {
    speechControllerRef.current?.stop();
    setVoiceState('processing');

    setTimeout(() => {
      const activeTasks = state.tasks.filter(t => !t.deletedAt);
      const result = parseVoiceCommand(text, activeTasks, state.currentScreen, state.reminders);
      setParsed(result);

      if (result.clarificationQuestion) {
        setVoiceState('followup');
        if (state.settings.voiceResponse) {
          speakResponse(result.clarificationQuestion, state.settings.voiceLanguage);
        }
        return;
      }

      const isDestructive = result.intent === 'delete' || result.intent === 'delete_reminder';

      if (state.settings.autoConfirmActions && !isDestructive) {
        executeParsedAction(result);
      } else {
        setVoiceState('confirmation');
      }
    }, 350);
  };

  const executeParsedAction = (cmd: ParsedCommand) => {
    let successMessage = '';
    let undoFn: (() => void) | null = null;

    switch (cmd.intent) {
      case 'create': {
        const title = cmd.taskTitle || 'New Task';
        const createdId = createTask({
          title,
          dueDate: cmd.dueDate,
          dueTime: cmd.dueTime,
          priority: cmd.priority || 'medium',
          category: cmd.category || 'General',
          tags: cmd.tags || ['voice'],
          subtasks: [],
          source: 'voice',
        });
        undoFn = () => {
          dispatch({ type: 'DELETE_TASK', payload: { id: createdId, hard: true } });
          showToast('Task creation undone.', { type: 'info' });
        };
        const dateLabel = cmd.dueDate ? formatDateLabel(cmd.dueDate) : 'today';
        const timeLabel = cmd.dueTime ? ` at ${formatTime12h(cmd.dueTime)}` : '';
        successMessage = `Done. I've added the task for ${dateLabel}${timeLabel}.`;
        break;
      }
      case 'complete': {
        if (cmd.targetTaskId) {
          const tId = cmd.targetTaskId;
          toggleTaskComplete(tId);
          undoFn = () => {
            toggleTaskComplete(tId);
          };
          successMessage = `Done. I've marked "${cmd.taskTitle}" as completed.`;
        }
        break;
      }
      case 'delete': {
        if (cmd.targetTaskId) {
          const tId = cmd.targetTaskId;
          deleteTask(tId);
          undoFn = () => {
            restoreTask(tId);
          };
          successMessage = `Deleted task "${cmd.taskTitle}".`;
        }
        break;
      }
      case 'update': {
        if (cmd.targetTaskId) {
          const tId = cmd.targetTaskId;
          const previous = state.tasks.find(t => t.id === tId);
          updateTask(tId, {
            dueDate: cmd.dueDate,
            dueTime: cmd.dueTime,
            priority: cmd.priority,
          });
          if (previous) {
            undoFn = () => {
              updateTask(tId, previous);
            };
          }
          successMessage = `Updated task "${cmd.taskTitle}".`;
        }
        break;
      }
      case 'navigation': {
        if (cmd.navigationTarget) {
          navigate(cmd.navigationTarget);
          successMessage = `Navigating to ${cmd.navigationTarget}.`;
        }
        break;
      }
      case 'filter': {
        navigate('tasks');
        if (cmd.filterMode) {
          dispatch({ type: 'SET_FILTER_QUERY', payload: cmd.filterMode });
          successMessage = cmd.voiceResponseText || `Showing ${cmd.filterMode} tasks.`;
        }
        break;
      }
      case 'search': {
        navigate('tasks');
        if (cmd.searchQuery) {
          dispatch({ type: 'SET_FILTER_QUERY', payload: cmd.searchQuery });
          successMessage = `Searching tasks for "${cmd.searchQuery}".`;
        }
        break;
      }
      case 'calendar': {
        navigate('calendar');
        successMessage = 'Opened calendar schedule.';
        break;
      }
      case 'analytics': {
        navigate('analytics');
        successMessage = 'Opened productivity analytics.';
        break;
      }
      case 'create_reminder':
      case 'reminders': {
        const remTitle = cmd.taskTitle || 'Voice Reminder';
        const remDate = cmd.dueDate || '';
        const remTime = cmd.dueTime || '19:00';
        const remId = `rem-${Date.now()}`;

        dispatch({
          type: 'CREATE_REMINDER',
          payload: {
            id: remId,
            title: remTitle,
            date: remDate,
            time: remTime,
            repeat: 'none',
            status: 'active',
          },
        });
        undoFn = () => {
          dispatch({ type: 'DELETE_REMINDER', payload: { id: remId } });
          showToast('Reminder creation undone.', { type: 'info' });
        };
        successMessage = `Done. I've set a reminder for "${remTitle}" at ${formatTime12h(remTime)}.`;
        break;
      }
      case 'delete_reminder': {
        if (cmd.targetReminderId) {
          const rId = cmd.targetReminderId;
          const prevRem = state.reminders.find(r => r.id === rId);
          dispatch({ type: 'DELETE_REMINDER', payload: { id: rId } });
          if (prevRem) {
            undoFn = () => {
              dispatch({ type: 'CREATE_REMINDER', payload: prevRem });
            };
          }
          successMessage = `Deleted reminder "${cmd.taskTitle}".`;
        }
        break;
      }
      case 'update_reminder': {
        if (cmd.targetReminderId) {
          dispatch({
            type: 'UPDATE_REMINDER',
            payload: {
              id: cmd.targetReminderId,
              updates: {
                time: cmd.dueTime,
                date: cmd.dueDate,
              },
            },
          });
          successMessage = `Updated reminder for "${cmd.taskTitle}".`;
        }
        break;
      }
      default:
        successMessage = cmd.voiceResponseText || 'Command executed.';
    }

    setLastExecutedUndo(() => undoFn);
    setVoiceState('success');
    if (state.settings.voiceResponse) {
      speakResponse(successMessage, state.settings.voiceLanguage);
    }

    dispatch({
      type: 'LOG_ACTIVITY',
      payload: {
        type: 'voice_command',
        title: 'Voice command parsed',
        description: `"${cmd.rawText}"`,
        isVoice: true,
        rawVoiceText: cmd.rawText,
      },
    });
  };

  const commandSamples = [
    'Add a task to complete my Python assignment tomorrow at 6 PM',
    'Mark my Python assignment as completed',
    'Delete the Python assignment',
    'Show my tasks for tomorrow',
    'What tasks are overdue?',
    'Show my completed tasks',
    'Go to calendar',
    'Show my productivity this week',
    'Remind me to study at 7 PM',
  ];

  const voiceActivities = state.activities.filter(a => a.isVoice);
  const isSpeechSupported = isSpeechRecognitionSupported();
  const isMicBlockedOrUnavailable = !isSpeechSupported || micPermission === 'denied';

  return (
    <div className="space-y-6 pb-20 md:pb-12 max-w-4xl mx-auto">
      {/* Voice Stage Card */}
      <div className="glass-panel-elevated p-6 sm:p-8 rounded-2xl bg-neutral-900/95 dark:bg-neutral-950/95 text-neutral-100 border border-neutral-700/80 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center font-bold">
              <Mic className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Voice Command Console</h2>
              <p className="text-xs text-neutral-400">
                Natural speech parser running 100% locally in your browser
              </p>
            </div>
          </div>

          <span className="text-[11px] font-mono-numbers px-2.5 py-1 rounded bg-neutral-800 border border-neutral-700 text-neutral-300">
            Mic: {micPermission}
          </span>
        </div>

        {/* Section 5 Fallback Warning */}
        {isMicBlockedOrUnavailable && (
          <div className="mt-4 p-3.5 rounded-xl bg-neutral-950/90 border border-neutral-700/80 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-neutral-200 font-semibold">
              <AlertCircle className="w-4 h-4 text-neutral-300 shrink-0" />
              <span>Voice input isn't available here.</span>
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Speech recognition is not permitted or unsupported in this frame. Type your command below to execute using the exact same NLP pipeline.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                onClick={() => textInputRef.current?.focus()}
                className="px-3 py-1.5 bg-white text-black font-semibold rounded-lg text-xs hover:bg-neutral-200 transition-colors"
              >
                Type instead
              </button>
              {isIframe && (
                <button
                  onClick={() => window.open(window.location.href, '_blank')}
                  className="px-3 py-1.5 border border-neutral-700 hover:border-neutral-500 text-neutral-300 hover:text-white rounded-lg text-xs flex items-center gap-1.5 transition-colors"
                >
                  <span>Open in new tab</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Central Audio & Interaction Zone */}
        <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
          {voiceState === 'listening' ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 h-14 justify-center">
                {[30, 60, 90, 45, 80, 100, 70, 40, 85, 55].map((h, i) => (
                  <div
                    key={i}
                    className="w-1.5 bg-white rounded-full animate-voice-bar"
                    style={{ animationDelay: `${i * 0.1}s`, height: `${h}%` }}
                  />
                ))}
              </div>
              <p className="text-sm font-semibold text-white animate-pulse">
                Listening...
              </p>
              <p className="text-xs text-neutral-400 italic max-w-md">
                "{transcript || 'Listening for speech input...'}"
              </p>
              <button
                onClick={handleStopListening}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-semibold border border-neutral-700"
              >
                Finish Speaking
              </button>
            </div>
          ) : voiceState === 'processing' ? (
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-white animate-spin mx-auto" />
              <p className="text-sm font-medium text-neutral-200">
                Analyzing syntax & extracting entities...
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <button
                onClick={handleStartListening}
                className="w-24 h-24 rounded-full bg-white text-black hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center justify-center border-4 border-neutral-800 mx-auto"
                aria-label="Tap to speak"
              >
                <Mic className="w-10 h-10 stroke-[2.2]" />
              </button>
              <p className="text-xs font-medium text-neutral-300">
                Tap microphone to begin or click a test prompt below
              </p>
            </div>
          )}
        </div>

        {/* Structured 4-Block Interpretation View */}
        {parsed && (voiceState === 'confirmation' || voiceState === 'success') && (
          <div className="p-4 rounded-xl bg-neutral-950/80 border border-neutral-800 space-y-3 mt-4">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 block">
              Parsed Command Structure
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800">
                <span className="text-[10px] uppercase font-semibold text-neutral-500 block">1. What You Said</span>
                <span className="mt-1 font-medium text-white italic block">"{parsed.rawText}"</span>
              </div>

              <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800">
                <span className="text-[10px] uppercase font-semibold text-neutral-500 block">2. How I Understood It</span>
                <div className="mt-1 space-y-0.5 text-neutral-300 font-mono-numbers">
                  <div>Task: <strong className="text-white">{parsed.taskTitle || 'N/A'}</strong></div>
                  {parsed.dueDate && <div>Date: <strong className="text-white">{formatDateLabel(parsed.dueDate)}</strong></div>}
                  {parsed.dueTime && <div>Time: <strong className="text-white">{formatTime12h(parsed.dueTime)}</strong></div>}
                  <div>Confidence: <strong className="text-white">{Math.round(parsed.confidence * 100)}%</strong></div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800">
                <span className="text-[10px] uppercase font-semibold text-neutral-500 block">3. Action to Perform</span>
                <span className="mt-1 text-white font-medium capitalize block">{parsed.intent.replace('_', ' ')} action</span>
              </div>

              <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-neutral-500 block">4. Result</span>
                  <span className="mt-1 text-white font-medium block">
                    {voiceState === 'success' ? 'Confirmed & Applied' : 'Pending Confirmation'}
                  </span>
                </div>

                {voiceState === 'success' && lastExecutedUndo && (
                  <div className="mt-2 pt-2 border-t border-neutral-800">
                    <button
                      onClick={() => {
                        lastExecutedUndo();
                        setLastExecutedUndo(null);
                        setVoiceState('idle');
                        if (state.settings.voiceResponse) {
                          speakResponse('Action undone.', state.settings.voiceLanguage);
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-white text-[11px] font-semibold border border-neutral-700 transition-colors"
                    >
                      <RotateCcw className="w-3 h-3 stroke-[2.5]" />
                      <span>Undo Action</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {voiceState === 'confirmation' && (
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    setVoiceState('idle');
                    setParsed(null);
                  }}
                  className="px-3.5 py-1.5 rounded-lg border border-neutral-700 text-xs font-medium text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={() => executeParsedAction(parsed)}
                  className="px-4 py-1.5 rounded-lg bg-white text-black hover:bg-neutral-200 text-xs font-semibold flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Execute Action</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Text Input Fallback Bar */}
        <div className="mt-6 pt-4 border-t border-neutral-800 flex gap-2">
          <input
            ref={textInputRef}
            type="text"
            value={typedInput}
            onChange={(e) => setTypedInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && typedInput.trim()) {
                handleProcessCommand(typedInput.trim());
                setTypedInput('');
              }
            }}
            placeholder="Type your command here (e.g. 'Add a task to complete my Python assignment tomorrow at 6 PM')..."
            className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white"
          />
          <button
            onClick={() => {
              if (typedInput.trim()) {
                handleProcessCommand(typedInput.trim());
                setTypedInput('');
              }
            }}
            className="px-4 py-2.5 bg-white text-black font-semibold text-xs rounded-xl hover:bg-neutral-200 transition-colors flex items-center gap-1.5"
          >
            <span>Run</span>
            <Send className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Example Prompt Chips */}
      <div className="glass-panel p-5 rounded-2xl space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Interactive Test Commands</span>
        </h3>
        <p className="text-xs text-neutral-500">
          Click any prompt below to test local NLP entity parsing and state execution without needing a microphone:
        </p>

        <div className="flex flex-wrap gap-2 pt-1">
          {commandSamples.map((sample) => (
            <button
              key={sample}
              onClick={() => handleProcessCommand(sample)}
              className="text-xs text-neutral-700 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white bg-white/50 dark:bg-neutral-900/50 hover:bg-white dark:hover:bg-neutral-800 border border-neutral-300 dark:border-neutral-800 rounded-lg px-3 py-1.5 text-left transition-colors"
            >
              "{sample}"
            </button>
          ))}
        </div>
      </div>

      {/* Voice Activity History */}
      <div className="glass-panel p-5 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
            <History className="w-3.5 h-3.5" />
            <span>Recent Voice Activity</span>
          </h3>
          {voiceActivities.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Clear all voice activity logs?')) {
                  dispatch({ type: 'CLEAR_VOICE_HISTORY' });
                }
              }}
              className="text-[11px] text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200"
            >
              Clear Voice History
            </button>
          )}
        </div>

        {voiceActivities.length === 0 ? (
          <p className="text-xs text-neutral-500 py-4 text-center">
            No voice commands executed yet.
          </p>
        ) : (
          <div className="space-y-2">
            {voiceActivities.slice(0, 5).map((act) => (
              <div
                key={act.id}
                className="p-3 rounded-xl bg-white/40 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                    {act.description}
                  </p>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <Mic className="w-3.5 h-3.5 text-neutral-400" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
