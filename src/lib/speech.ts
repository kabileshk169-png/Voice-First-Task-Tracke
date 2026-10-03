// Type definitions for Web Speech API
type SpeechRecognitionEvent = any;
type SpeechRecognitionErrorEvent = any;

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

export type MicPermissionState = 'granted' | 'denied' | 'prompt' | 'unavailable' | 'unknown';

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export async function checkMicrophonePermission(): Promise<MicPermissionState> {
  if (typeof navigator === 'undefined' || !navigator.permissions) {
    return 'unknown';
  }
  try {
    const status = await navigator.permissions.query({ name: 'microphone' as PermissionName });
    return status.state as MicPermissionState;
  } catch {
    return 'unknown';
  }
}

export function playFeedbackTone(type: 'start' | 'success' | 'error' | 'click') {
  if (typeof window === 'undefined' || !window.AudioContext && !(window as any).webkitAudioContext) {
    return;
  }
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === 'start') {
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'success') {
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'error') {
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.setValueAtTime(180, now + 0.1);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else {
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    }
  } catch {
    // Ignore audio context autoplay limitations
  }
}

export function speakResponse(text: string, lang = 'en-US'): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  } catch {
    // Graceful fallback
  }
}

export class SpeechController {
  private recognition: SpeechRecognitionInstance | null = null;
  private isListening = false;

  constructor(
    private onTranscript: (transcript: string, isFinal: boolean) => void,
    private onError: (errorMsg: string) => void,
    private onStateChange: (listening: boolean) => void
  ) {
    this.init();
  }

  private init() {
    if (!isSpeechRecognitionSupported()) return;
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) return;

    this.recognition = new SpeechRec();
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onstart = () => {
      this.isListening = true;
      this.onStateChange(true);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.onStateChange(false);
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      this.isListening = false;
      this.onStateChange(false);
      let message = 'Speech recognition error';
      if (event.error === 'not-allowed') {
        message = 'Microphone permission was denied. Please allow microphone access or use text input.';
      } else if (event.error === 'no-speech') {
        message = 'No speech detected. Please try again.';
      } else if (event.error === 'network') {
        message = 'Network error during speech recognition.';
      }
      this.onError(message);
    };

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
        this.onTranscript(finalTranscript.trim(), true);
      } else if (interim) {
        this.onTranscript(interim.trim(), false);
      }
    };
  }

  public start(lang = 'en-US') {
    if (!this.recognition) {
      this.onError('Speech recognition is unavailable in this browser.');
      return;
    }
    try {
      this.recognition.lang = lang;
      this.recognition.start();
    } catch (e: any) {
      if (e.name !== 'InvalidStateError') {
        this.onError('Unable to start speech recognition.');
      }
    }
  }

  public stop() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch {
        // Safe catch
      }
    }
  }

  public abort() {
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch {
        // Safe catch
      }
    }
  }
}
