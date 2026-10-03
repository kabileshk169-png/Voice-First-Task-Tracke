import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  X,
  Check,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Send,
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

interface VoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  sender: 'user' | 'assistant';
  text: string;
  time: string;
}

export const VoiceModal: React.FC<VoiceModalProps> = ({ isOpen, onClose }) => {
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
    executeUndo,
  } = useApp();

  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [typedInput, setTypedInput] = useState('');
  const [parsed, setParsed] = useState<ParsedCommand | null>(null);
  const [lastExecutedUndo, setLastExecutedUndo] = useState<(() => void) | null>(null);
  const [conversation, setConversation] = useState<Message[]>([
    {
      sender: 'assistant',
      text: 'Hello. I can create, move, search, or check off your daily tasks. Tap the microphone or select a prompt below.',
      time: 'Now',
    },
  ]);
  const [micPermission, setMicPermission] = useState<MicPermissionState>('unknown');
  const [editableParsed, setEditableParsed] = useState<{
    title: string;
    date: string;
    time: string;
    priority: TaskPriority;
  }>({
    title: '',
    date: '',
    time: '',
    priority: 'medium',
  });
  const [isEditingInterpretation, setIsEditingInterpretation] = useState(false);

  const textInputRef = useRef<HTMLInputElement | null>(null);
  const speechControllerRef = useRef<SpeechController | null>(null);
  const isIframe = typeof window !== 'undefined' && window.self !== window.top;

  // Escape key closes modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Check microphone permissions
  useEffect(() => {
    if (isOpen) {
      checkMicrophonePermission().then(setMicPermission);
    }
  }, [isOpen]);

  // Initialize Speech Controller
  useEffect(() => {
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
          if (listening) {
            setVoiceState('listening');
          }
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

    const userMsg: Message = { sender: 'user', text, time: 'Just now' };
    setConversation(prev => [...prev, userMsg]);

    setTimeout(() => {
      const activeTasks = state.tasks.filter(t => !t.deletedAt);
      const result = parseVoiceCommand(text, activeTasks, state.currentScreen, state.reminders);
      setParsed(result);

      setEditableParsed({
        title: result.taskTitle || 'New Task',
        date: result.dueDate || '',
        time: result.dueTime || '',
        priority: result.priority || 'medium',
      });

      if (result.clarificationQuestion) {
        setVoiceState('followup');
        const assistantMsg: Message = {
          sender: 'assistant',
          text: result.clarificationQuestion,
          time: 'Just now',
        };
        setConversation(prev => [...prev, assistantMsg]);
        if (state.settings.voiceResponse) {
          speakResponse(result.clarificationQuestion, state.settings.voiceLanguage);
        }
        return;
      }

      // Destructive actions MUST ALWAYS require confirmation (Section 7)
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
        const title = isEditingInterpretation ? editableParsed.title : (cmd.taskTitle || 'New Task');
        const dueDate = isEditingInterpretation ? editableParsed.date : cmd.dueDate;
        const dueTime = isEditingInterpretation ? editableParsed.time : cmd.dueTime;
        const priority = isEditingInterpretation ? editableParsed.priority : (cmd.priority || 'medium');

        const createdId = createTask({
          title,
          dueDate,
          dueTime,
          priority,
          category: cmd.category || 'General',
          tags: cmd.tags || ['voice'],
          subtasks: [],
          source: 'voice',
        });

        undoFn = () => {
          dispatch({ type: 'DELETE_TASK', payload: { id: createdId, hard: true } });
          showToast('Task creation undone.', { type: 'info' });
        };

        const dateLabel = dueDate ? formatDateLabel(dueDate) : 'today';
        const timeLabel = dueTime ? ` at ${formatTime12h(dueTime)}` : '';
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
        } else {
          successMessage = `Could not find task "${cmd.taskTitle}".`;
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
        } else {
          successMessage = `Could not find task "${cmd.taskTitle}".`;
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
        successMessage = 'Opened Calendar schedule.';
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
    const assistantMsg: Message = { sender: 'assistant', text: successMessage, time: 'Just now' };
    setConversation(prev => [...prev, assistantMsg]);

    if (state.settings.voiceResponse) {
      speakResponse(successMessage, state.settings.voiceLanguage);
    }

    dispatch({
      type: 'LOG_ACTIVITY',
      payload: {
        type: 'voice_command',
        title: 'Voice command executed',
        description: `"${cmd.rawText}"`,
        isVoice: true,
        rawVoiceText: cmd.rawText,
      },
    });
  };

  const examplePrompts = [
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

  if (!isOpen) return null;

  const isSpeechSupported = isSpeechRecognitionSupported();
  const isMicBlockedOrUnavailable = !isSpeechSupported || micPermission === 'denied';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl max-h-[90vh] glass-panel-elevated bg-neutral-900/95 dark:bg-neutral-950/95 border border-neutral-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-neutral-100 z-10">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-neutral-100 text-neutral-950 flex items-center justify-center font-bold">
              <Mic className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold tracking-tight text-white">Voice Assistant</h2>
                <span className="text-[10px] uppercase font-mono-numbers px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
                  Context: {state.currentScreen}
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Rule-based speech & natural language parser (100% local)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Center Stage */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section 5: Voice Fallback Notification when mic is unavailable or blocked */}
          {isMicBlockedOrUnavailable && (
            <div className="p-3.5 rounded-xl bg-neutral-950/90 border border-neutral-700/80 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-neutral-200 font-semibold">
                <AlertCircle className="w-4 h-4 text-neutral-300 shrink-0" />
                <span>Voice input isn't available here.</span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Microphone access is unavailable or restricted by browser permissions. You can use typed commands with the exact same parser pipeline.
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

          {/* Main Visualizer & Mic Button */}
          <div className="flex flex-col items-center justify-center py-4 text-center">
            {voiceState === 'listening' ? (
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-1.5 h-10 px-4">
                  {[40, 70, 100, 60, 90, 40, 80, 50].map((h, i) => (
                    <div
                      key={i}
                      className="w-1.5 bg-white rounded-full animate-voice-bar"
                      style={{
                        animationDelay: `${i * 0.12}s`,
                        height: `${h}%`,
                      }}
                    />
                  ))}
                </div>
                <div className="text-sm font-medium text-neutral-200 animate-pulse">
                  Listening to your voice...
                </div>
                <p className="text-xs text-neutral-400 max-w-sm italic">
                  "{transcript || 'Say something like: Add a task to complete my Python assignment tomorrow at 6 PM'}"
                </p>
                <button
                  onClick={handleStopListening}
                  className="mt-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold rounded-lg border border-neutral-700"
                >
                  Done Speaking
                </button>
              </div>
            ) : voiceState === 'processing' ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                <span className="text-sm font-medium text-neutral-200">
                  Understanding your request...
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <button
                  onClick={handleStartListening}
                  className="w-20 h-20 rounded-full bg-white text-black hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center justify-center border-4 border-neutral-800"
                  aria-label="Tap to speak"
                >
                  <Mic className="w-8 h-8 stroke-[2.2]" />
                </button>
                <span className="text-xs font-medium text-neutral-300">
                  Tap microphone or select a command below
                </span>
              </div>
            )}
          </div>

          {/* 4-Block Structured Interpretation Display */}
          {parsed && (voiceState === 'confirmation' || voiceState === 'success') && (
            <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Structured Interpretation
                </span>
                <span className="text-[10px] font-mono-numbers text-neutral-500 uppercase">
                  Intent: {parsed.intent}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Block 1: WHAT YOU SAID */}
                <div className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800">
                  <div className="text-[10px] font-semibold text-neutral-500 uppercase">
                    1. What You Said
                  </div>
                  <div className="mt-1 font-medium text-white italic">
                    "{parsed.rawText}"
                  </div>
                </div>

                {/* Block 2: HOW I UNDERSTOOD IT */}
                <div className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800">
                  <div className="text-[10px] font-semibold text-neutral-500 uppercase">
                    2. Interpretation
                  </div>
                  <div className="mt-1 space-y-0.5 text-neutral-300 font-mono-numbers">
                    <div>Target: <strong className="text-white">{isEditingInterpretation ? editableParsed.title : (parsed.taskTitle || 'N/A')}</strong></div>
                    {(parsed.dueDate || isEditingInterpretation) && (
                      <div>Date: <strong className="text-white">{formatDateLabel(isEditingInterpretation ? editableParsed.date : parsed.dueDate)}</strong></div>
                    )}
                    {(parsed.dueTime || isEditingInterpretation) && (
                      <div>Time: <strong className="text-white">{formatTime12h(isEditingInterpretation ? editableParsed.time : parsed.dueTime)}</strong></div>
                    )}
                    <div>Confidence: <span className="text-white">{Math.round(parsed.confidence * 100)}%</span></div>
                  </div>
                </div>

                {/* Block 3: ACTION TO PERFORM */}
                <div className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800">
                  <div className="text-[10px] font-semibold text-neutral-500 uppercase">
                    3. Action to Perform
                  </div>
                  <div className="mt-1 text-white font-medium capitalize">
                    {parsed.intent === 'create' && 'Create new task'}
                    {parsed.intent === 'complete' && 'Mark task completed'}
                    {parsed.intent === 'delete' && 'Delete task'}
                    {parsed.intent === 'update' && 'Reschedule/Update task'}
                    {parsed.intent === 'search' && 'Filter and search tasks'}
                    {parsed.intent === 'filter' && `Show ${parsed.filterMode} tasks`}
                    {parsed.intent === 'navigation' && `Navigate to ${parsed.navigationTarget}`}
                    {parsed.intent === 'create_reminder' && 'Schedule reminder alert'}
                    {parsed.intent === 'delete_reminder' && 'Delete reminder alert'}
                    {parsed.intent === 'update_reminder' && 'Update reminder schedule'}
                    {parsed.intent === 'calendar' && 'Open calendar schedule'}
                    {parsed.intent === 'analytics' && 'Show productivity breakdown'}
                  </div>
                </div>

                {/* Block 4: RESULT & UNDO */}
                <div className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800 flex flex-col justify-between">
                  <div>
                    <div className="text-[10px] font-semibold text-neutral-500 uppercase">
                      4. Result State
                    </div>
                    <div className="mt-1 font-medium">
                      {voiceState === 'success' ? (
                        <span className="inline-flex items-center gap-1.5 text-white">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Action successfully executed</span>
                        </span>
                      ) : (
                        <span className="text-neutral-400">Awaiting confirmation</span>
                      )}
                    </div>
                  </div>

                  {/* Immediate Voice Undo in Modal */}
                  {voiceState === 'success' && lastExecutedUndo && (
                    <div className="mt-2 pt-2 border-t border-neutral-800">
                      <button
                        onClick={() => {
                          lastExecutedUndo();
                          setLastExecutedUndo(null);
                          setVoiceState('idle');
                          const assistantMsg: Message = { sender: 'assistant', text: 'Action undone.', time: 'Just now' };
                          setConversation(prev => [...prev, assistantMsg]);
                          if (state.settings.voiceResponse) {
                            speakResponse('Action undone.', state.settings.voiceLanguage);
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-white text-[11px] font-semibold border border-neutral-700 transition-colors"
                      >
                        <RotateCcw className="w-3 h-3 stroke-[2.5]" />
                        <span>Undo This Action</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Inline Edit Form when Edit is clicked */}
              {isEditingInterpretation && (
                <div className="pt-3 border-t border-neutral-800 space-y-2">
                  <div className="text-[11px] font-semibold text-neutral-400">
                    Adjust parsed values:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={editableParsed.title}
                      onChange={(e) => setEditableParsed({ ...editableParsed, title: e.target.value })}
                      placeholder="Title"
                      className="bg-neutral-800 border border-neutral-700 rounded px-2.5 py-1.5 text-xs text-white"
                    />
                    <input
                      type="date"
                      value={editableParsed.date}
                      onChange={(e) => setEditableParsed({ ...editableParsed, date: e.target.value })}
                      className="bg-neutral-800 border border-neutral-700 rounded px-2.5 py-1.5 text-xs text-white"
                    />
                    <input
                      type="time"
                      value={editableParsed.time}
                      onChange={(e) => setEditableParsed({ ...editableParsed, time: e.target.value })}
                      className="bg-neutral-800 border border-neutral-700 rounded px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons: Confirm / Edit / Cancel */}
              {voiceState === 'confirmation' && (
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => {
                      setVoiceState('idle');
                      setParsed(null);
                    }}
                    className="px-3 py-1.5 rounded-lg border border-neutral-700 text-xs font-medium text-neutral-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setIsEditingInterpretation(!isEditingInterpretation)}
                    className="px-3 py-1.5 rounded-lg border border-neutral-700 text-xs font-medium text-neutral-300 hover:text-white"
                  >
                    {isEditingInterpretation ? 'Save Edits' : 'Edit'}
                  </button>
                  <button
                    onClick={() => executeParsedAction(parsed)}
                    className="px-4 py-1.5 rounded-lg bg-white text-black hover:bg-neutral-200 text-xs font-semibold shadow-sm flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Confirm</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Conversation Transcript Log */}
          <div className="space-y-2 border-t border-neutral-800/60 pt-4">
            <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
              Dialogue Flow
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {conversation.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-xl px-3.5 py-2 text-xs ${
                      msg.sender === 'user'
                        ? 'bg-neutral-200 text-neutral-900 font-medium'
                        : 'bg-neutral-800/80 text-neutral-200 border border-neutral-700/60'
                    }`}
                  >
                    <p>{msg.text}</p>
                    <span className="text-[10px] opacity-60 mt-0.5 block text-right">
                      {msg.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Example Command Chips */}
          <div className="border-t border-neutral-800/60 pt-4">
            <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-2">
              Example Voice Prompts (Click to Test)
            </div>
            <div className="flex flex-wrap gap-1.5">
              {examplePrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleProcessCommand(prompt)}
                  className="text-[11px] text-neutral-300 hover:text-white bg-neutral-800/60 hover:bg-neutral-800 border border-neutral-700/70 rounded-lg px-2.5 py-1 text-left transition-colors flex items-center gap-1"
                >
                  <span>"{prompt}"</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Command Bar: Type instead fallback */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950 flex items-center gap-2">
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
            placeholder="Type a command (e.g. 'Add a task to complete my Python assignment tomorrow at 6 PM')..."
            className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white"
          />
          <button
            onClick={() => {
              if (typedInput.trim()) {
                handleProcessCommand(typedInput.trim());
                setTypedInput('');
              }
            }}
            className="px-3.5 py-2 bg-white text-black hover:bg-neutral-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <span>Send</span>
            <Send className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
