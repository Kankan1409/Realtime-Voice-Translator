// Audio and Speech utilities for Thai-Chinese real-time translation

// Type declaration for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export class SpeechRecognitionSession {
  private recognition: any = null;
  private isListening = false;
  private onResultCb?: (text: string, isFinal: boolean) => void;
  private onErrorCb?: (error: string) => void;
  private onEndCb?: () => void;
  private targetLanguage: 'th-TH' | 'zh-CN' = 'th-TH';
  private latestTranscript = '';
  private silenceTimer: any = null;
  private isCompleted = false;

  constructor() {
    // Initialized on demand in start() for iOS reliability
  }

  async start(
    lang: 'th' | 'zh',
    onResult: (text: string, isFinal: boolean) => void,
    onError?: (error: string) => void,
    onEnd?: () => void
  ) {
    const SpeechRec = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
    if (!SpeechRec) {
      onError?.('Speech recognition is not supported in this browser.');
      return;
    }

    // Stop and clean up any previous instance
    this.stop();

    this.targetLanguage = lang === 'th' ? 'th-TH' : 'zh-CN';
    this.onResultCb = onResult;
    this.onErrorCb = onError;
    this.onEndCb = onEnd;
    this.isListening = true;
    this.latestTranscript = '';
    this.isCompleted = false;

    try {
      this.recognition = new SpeechRec();
      this.recognition.continuous = false; // continuous: false is much more reliable on mobile
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;
      this.recognition.lang = this.targetLanguage;

      this.recognition.onresult = (event: any) => {
        if (this.isCompleted) return;

        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const result = event.results[i];
          const transcript = result[0].transcript;
          if (result.isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        const currentSpeech = (finalTranscript || interimTranscript).trim();
        if (currentSpeech) {
          this.latestTranscript = currentSpeech;
        }

        if (finalTranscript && this.onResultCb) {
          this.isCompleted = true;
          if (this.silenceTimer) clearTimeout(this.silenceTimer);
          this.onResultCb(finalTranscript.trim(), true);
          return;
        }

        if (interimTranscript && this.onResultCb) {
          this.onResultCb(interimTranscript.trim(), false);

          // Fast silence detector: if user pauses for 750ms after speaking, immediately commit translation
          if (this.silenceTimer) clearTimeout(this.silenceTimer);
          this.silenceTimer = setTimeout(() => {
            if (!this.isCompleted && this.latestTranscript.trim() && this.onResultCb) {
              this.isCompleted = true;
              const textToTranslate = this.latestTranscript.trim();
              this.onResultCb(textToTranslate, true);
              try {
                this.recognition?.stop();
              } catch (e) {}
            }
          }, 750);
        }
      };

      this.recognition.onerror = (event: any) => {
        if (this.silenceTimer) clearTimeout(this.silenceTimer);
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          this.onErrorCb?.('ไมโครโฟนถูกปฏิเสธ กรุณาอนุญาตไมโครโฟนในการตั้งค่า');
        } else if (event.error !== 'no-speech') {
          this.onErrorCb?.(event.error);
        }
      };

      this.recognition.onend = () => {
        if (this.silenceTimer) clearTimeout(this.silenceTimer);
        this.isListening = false;
        // If not completed yet and we have a transcript, commit it now
        if (!this.isCompleted && this.latestTranscript.trim() && this.onResultCb) {
          this.isCompleted = true;
          this.onResultCb(this.latestTranscript.trim(), true);
        }
        if (this.onEndCb) this.onEndCb();
      };

      this.recognition.start();
    } catch (e: any) {
      if (this.silenceTimer) clearTimeout(this.silenceTimer);
      console.warn('Recognition start error:', e);
      this.isListening = false;
      this.onErrorCb?.(e.message || 'ไม่สามารถเปิดไมโครโฟนได้');
    }
  }

  stop(): string {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    const pendingText = this.latestTranscript.trim();
    if (!this.isCompleted && pendingText && this.onResultCb) {
      this.isCompleted = true;
      this.onResultCb(pendingText, true);
    }

    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        try {
          this.recognition.abort();
        } catch {}
      }
      this.recognition = null;
    }
    return pendingText;
  }
}

// Browser TTS with guaranteed completion callback and garbage-collection safety
export function speakText(
  text: string,
  lang: 'th' | 'zh',
  rate = 1.0,
  onStart?: () => void,
  onEnd?: () => void
) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onEnd?.();
    return;
  }

  try {
    window.speechSynthesis.cancel(); // cancel pending speech
    const utterance = new SpeechSynthesisUtterance(text);
    const targetLangCode = lang === 'th' ? 'th-TH' : 'zh-CN';
    utterance.lang = targetLangCode;
    utterance.rate = rate;

    let hasEnded = false;
    const finish = () => {
      if (!hasEnded) {
        hasEnded = true;
        onEnd?.();
      }
    };

    // Safety timeout: max 4.0s for conversational turns, ensures onEnd is ALWAYS called
    const estimatedDuration = Math.min(4000, Math.max(800, text.length * 150));
    const timer = setTimeout(finish, estimatedDuration);

    utterance.onstart = () => {
      onStart?.();
    };

    utterance.onend = () => {
      clearTimeout(timer);
      finish();
    };

    utterance.onerror = () => {
      clearTimeout(timer);
      finish();
    };

    // Keep global reference on window to prevent garbage collection in WebKit/Chromium
    (window as any).__activeTtsUtterance = utterance;

    // Try finding matching voice
    const voices = window.speechSynthesis.getVoices();
    const matchedVoice = voices.find((v) => v.lang.startsWith(lang === 'th' ? 'th' : 'zh'));
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.error('Speech synthesis error:', err);
    onEnd?.();
  }
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
  }
}

// MediaRecorder Audio Capture for Gemini Direct Translation
export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;

  async start(): Promise<boolean> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      this.audioChunks = [];
      let supportedMimeType = '';
      const candidateTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/aac',
        'audio/ogg',
        'audio/wav',
      ];
      for (const t of candidateTypes) {
        if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) {
          supportedMimeType = t;
          break;
        }
      }

      const options = supportedMimeType ? { mimeType: supportedMimeType } : undefined;
      this.mediaRecorder = options ? new MediaRecorder(this.stream, options) : new MediaRecorder(this.stream);
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };
      this.mediaRecorder.start(250);
      return true;
    } catch (err) {
      console.error('Failed to start audio recording:', err);
      return false;
    }
  }

  stop(): Promise<{ base64: string; mimeType: string } | null> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        this.cleanup();
        resolve(null);
        return;
      }

      this.mediaRecorder.onstop = () => {
        const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
        const audioBlob = new Blob(this.audioChunks, { type: mimeType });
        const reader = new FileReader();

        reader.onloadend = () => {
          const base64Data = (reader.result as string).split(',')[1];
          this.cleanup();
          resolve({ base64: base64Data, mimeType });
        };

        reader.onerror = () => {
          this.cleanup();
          resolve(null);
        };

        reader.readAsDataURL(audioBlob);
      };

      this.mediaRecorder.stop();
    });
  }

  private cleanup() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    this.mediaRecorder = null;
    this.audioChunks = [];
  }
}

// Continuous Hands-Free Bilingual Live Interpreter Engine
// Listens continuously, detects human voice automatically, translates Thai ⇄ Chinese without clicking
export interface AutoInterpreterCallbacks {
  onStatusChange: (status: 'idle' | 'listening' | 'speaking' | 'processing') => void;
  onVolumeChange: (volume: number) => void;
  onTranslation: (data: {
    originalText: string;
    translatedText: string;
    detectedLang: 'th' | 'zh';
    targetLang: 'th' | 'zh';
    pinyin?: string;
    phoneticsForReader?: string;
  }) => void;
  onError: (errorMsg: string) => void;
}

export class ContinuousAutoInterpreter {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private isRunning = false;
  private isSpeaking = false;
  private isMutedForTTS = false;
  private ttsMuteTimer: any = null;
  private isProcessingNetwork = false;
  private speechStartTime = 0;
  private silenceTimer: any = null;
  private animationLoopId: number | null = null;
  private callbacks: AutoInterpreterCallbacks;
  private supportedMimeType = '';

  constructor(callbacks: AutoInterpreterCallbacks) {
    this.callbacks = callbacks;
  }

  async start(): Promise<boolean> {
    if (this.isRunning) return true;

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Find supported audio mime type
      const candidateTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/aac',
        'audio/ogg',
        'audio/wav',
      ];
      for (const t of candidateTypes) {
        if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) {
          this.supportedMimeType = t;
          break;
        }
      }

      // Initialize Web Audio API Analyser for Voice Activity Detection
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx();
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      const source = this.audioContext.createMediaStreamSource(this.stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.3;
      source.connect(this.analyser);

      this.isRunning = true;
      this.isSpeaking = false;
      this.isProcessingNetwork = false;
      this.callbacks.onStatusChange('listening');

      this.startVADLoop();
      return true;
    } catch (err: any) {
      console.error('Failed to start ContinuousAutoInterpreter:', err);
      this.callbacks.onError(err.message || 'ไม่สามารถเปิดไมโครโฟนได้');
      this.stop();
      return false;
    }
  }

  public setMutedForTTS(muted: boolean, maxDurationMs = 2500) {
    if (this.ttsMuteTimer) {
      clearTimeout(this.ttsMuteTimer);
      this.ttsMuteTimer = null;
    }

    this.isMutedForTTS = muted;
    if (muted) {
      // Abort current recording chunk so TTS is not picked up
      if (this.silenceTimer) {
        clearTimeout(this.silenceTimer);
        this.silenceTimer = null;
      }
      if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
        try {
          this.mediaRecorder.stop();
        } catch {}
      }
      this.isSpeaking = false;

      // Absolute safety timeout: ALWAYS auto-unmute even if TTS event is delayed
      this.ttsMuteTimer = setTimeout(() => {
        this.isMutedForTTS = false;
        this.ttsMuteTimer = null;
        if (this.isRunning && !this.isSpeaking) {
          this.callbacks.onStatusChange('listening');
        }
      }, maxDurationMs);
    } else {
      if (this.isRunning && !this.isSpeaking) {
        this.callbacks.onStatusChange('listening');
      }
    }
  }

  private startVADLoop() {
    if (!this.analyser) return;

    const buffer = new Uint8Array(this.analyser.frequencyBinCount);

    const checkVolume = () => {
      if (!this.isRunning || !this.analyser) return;

      // Auto-resume AudioContext on iOS Safari if suspended after TTS or system interruption
      if (this.audioContext && (this.audioContext.state === 'suspended' || (this.audioContext.state as any) === 'interrupted')) {
        this.audioContext.resume().catch(() => {});
      }

      this.analyser.getByteFrequencyData(buffer);
      let sum = 0;
      for (let i = 0; i < buffer.length; i++) {
        sum += buffer[i];
      }
      const average = sum / buffer.length;
      const normalizedVolume = Math.min(100, Math.round((average / 128) * 100));

      this.callbacks.onVolumeChange(normalizedVolume);

      // Sensitive Voice Activity Detection threshold for normal & soft speech
      const VOICE_THRESHOLD = 7;

      // Only evaluate if not currently muted for TTS
      if (!this.isMutedForTTS) {
        if (normalizedVolume >= VOICE_THRESHOLD) {
          // Human voice detected
          if (this.silenceTimer) {
            clearTimeout(this.silenceTimer);
            this.silenceTimer = null;
          }

          if (!this.isSpeaking) {
            this.isSpeaking = true;
            this.speechStartTime = Date.now();
            this.callbacks.onStatusChange('speaking');
            this.startRecordingChunk();
          }
        } else if (this.isSpeaking) {
          // Volume dropped below threshold -> start fast silence countdown
          if (!this.silenceTimer) {
            this.silenceTimer = setTimeout(() => {
              this.finishRecordingChunk();
            }, 450); // 450ms silence pause indicates speaker finished sentence
          }
        }
      }

      this.animationLoopId = requestAnimationFrame(checkVolume);
    };

    this.animationLoopId = requestAnimationFrame(checkVolume);
  }

  private startRecordingChunk() {
    if (!this.stream) return;

    try {
      this.audioChunks = [];
      const options = this.supportedMimeType ? { mimeType: this.supportedMimeType } : undefined;
      this.mediaRecorder = options ? new MediaRecorder(this.stream, options) : new MediaRecorder(this.stream);

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          this.audioChunks.push(e.data);
        }
      };

      this.mediaRecorder.start(80);
    } catch (e) {
      console.warn('Failed to start recording chunk:', e);
    }
  }

  private finishRecordingChunk() {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }

    if (!this.mediaRecorder || this.mediaRecorder.state !== 'recording') {
      this.isSpeaking = false;
      if (!this.isProcessingNetwork) {
        this.callbacks.onStatusChange('listening');
      }
      return;
    }

    const duration = Date.now() - this.speechStartTime;
    // Discard ultra-short click noises (less than 180ms)
    if (duration < 180) {
      this.isSpeaking = false;
      try {
        this.mediaRecorder.stop();
      } catch {}
      if (!this.isProcessingNetwork) {
        this.callbacks.onStatusChange('listening');
      }
      return;
    }

    this.isSpeaking = false;
    this.isProcessingNetwork = true;
    this.callbacks.onStatusChange('processing');

    this.mediaRecorder.onstop = async () => {
      const mimeType = this.mediaRecorder?.mimeType || this.supportedMimeType || 'audio/webm';
      const audioBlob = new Blob(this.audioChunks, { type: mimeType });
      this.audioChunks = [];

      // Ready for next speech immediately - do not lock mic!
      if (this.isRunning && !this.isSpeaking && !this.isMutedForTTS) {
        this.callbacks.onStatusChange('listening');
      }

      try {
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const res = (reader.result as string).split(',')[1];
            resolve(res);
          };
          reader.onerror = reject;
          reader.readAsDataURL(audioBlob);
        });

        // Fast fetch with 7-second timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 7000);

        const response = await fetch('/api/transcribe-translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioBase64: base64Data,
            mimeType,
            sourceLang: 'auto',
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        const data = await response.json();
        if (data.success && data.originalText && data.originalText.trim()) {
          this.callbacks.onTranslation({
            originalText: data.originalText.trim(),
            translatedText: data.translatedText.trim(),
            detectedLang: data.detectedLang === 'zh' ? 'zh' : 'th',
            targetLang: data.targetLang === 'zh' ? 'zh' : 'th',
            pinyin: data.pinyin,
            phoneticsForReader: data.phoneticsForReader,
          });
        }
      } catch (err: any) {
        console.warn('Auto translation chunk error:', err);
      } finally {
        this.isProcessingNetwork = false;
        if (this.isRunning && !this.isSpeaking && !this.isMutedForTTS) {
          this.callbacks.onStatusChange('listening');
        }
      }
    };

    try {
      this.mediaRecorder.stop();
    } catch {}
  }

  stop() {
    this.isRunning = false;
    this.isSpeaking = false;
    this.isProcessingNetwork = false;
    this.isMutedForTTS = false;

    if (this.ttsMuteTimer) {
      clearTimeout(this.ttsMuteTimer);
      this.ttsMuteTimer = null;
    }

    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }

    if (this.animationLoopId) {
      cancelAnimationFrame(this.animationLoopId);
      this.animationLoopId = null;
    }

    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      try {
        this.mediaRecorder.stop();
      } catch {}
    }
    this.mediaRecorder = null;
    this.audioChunks = [];

    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close();
      } catch {}
    }
    this.audioContext = null;
    this.analyser = null;

    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    this.callbacks.onStatusChange('idle');
    this.callbacks.onVolumeChange(0);
  }
}

export interface ContinuousConversationCallbacks {
  onStatusChange: (status: 'idle' | 'listening' | 'speaking' | 'processing') => void;
  onInterimText: (text: string) => void;
  onSpeakerChange: (speaker: 'th' | 'zh') => void;
  onVolumeChange: (vol: number) => void;
  onTranslation: (data: {
    originalText: string;
    translatedText: string;
    detectedLang: 'th' | 'zh';
    targetLang: 'th' | 'zh';
    pinyin?: string;
    phoneticsForReader?: string;
  }) => void;
  onError: (errMsg: string) => void;
}

/**
 * ContinuousConversationManager
 * High-performance, real-time two-way voice conversation engine.
 * Automatically alternates between Thai and Chinese speakers, shows live words as spoken,
 * instantly translates with dictionary & AI, and never dies after one sentence.
 */
export class ContinuousConversationManager {
  private currentSpeaker: 'th' | 'zh' = 'th';
  private isRunning = false;
  private isPausedForTTS = false;
  private speechSession: SpeechRecognitionSession | null = null;
  private restartTimer: any = null;
  private fallbackInterpreter: ContinuousAutoInterpreter | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private volumeStream: MediaStream | null = null;
  private animFrameId: number | null = null;
  private callbacks: ContinuousConversationCallbacks;
  private consecutiveSpeechErrors = 0;

  constructor(callbacks: ContinuousConversationCallbacks, initialSpeaker: 'th' | 'zh' = 'th') {
    this.callbacks = callbacks;
    this.currentSpeaker = initialSpeaker;
  }

  public getSpeaker(): 'th' | 'zh' {
    return this.currentSpeaker;
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }

  async start(): Promise<boolean> {
    this.stop();
    this.isRunning = true;
    this.isPausedForTTS = false;
    this.consecutiveSpeechErrors = 0;

    // Check if Web Speech API is supported
    if (!isSpeechRecognitionSupported()) {
      console.info('Web Speech API not available, launching ContinuousAutoInterpreter');
      return await this.switchToFallbackInterpreter();
    }

    // Start recognition loop directly (do NOT open separate volume getUserMedia which locks mic on iOS)
    this.startListeningTurn();
    return true;
  }

  private async switchToFallbackInterpreter(): Promise<boolean> {
    if (this.speechSession) {
      this.speechSession.stop();
      this.speechSession = null;
    }
    if (this.fallbackInterpreter) {
      this.fallbackInterpreter.stop();
    }

    this.fallbackInterpreter = new ContinuousAutoInterpreter({
      onStatusChange: (status) => this.callbacks.onStatusChange(status),
      onVolumeChange: (vol) => this.callbacks.onVolumeChange(vol),
      onTranslation: (data) => {
        this.callbacks.onSpeakerChange(data.detectedLang);
        this.callbacks.onTranslation(data);
      },
      onError: (err) => {
        console.warn('Fallback interpreter error:', err);
        this.callbacks.onError(err);
      },
    });

    const ok = await this.fallbackInterpreter.start();
    return ok;
  }

  private startListeningTurn() {
    if (!this.isRunning || this.isPausedForTTS) return;

    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }

    this.callbacks.onSpeakerChange(this.currentSpeaker);
    this.callbacks.onStatusChange('listening');
    this.callbacks.onInterimText('');

    if (!this.speechSession) {
      this.speechSession = new SpeechRecognitionSession();
    }

    this.speechSession.start(
      this.currentSpeaker,
      async (text: string, isFinal: boolean) => {
        if (!this.isRunning) return;

        if (!isFinal) {
          this.consecutiveSpeechErrors = 0;
          this.callbacks.onStatusChange('speaking');
          this.callbacks.onVolumeChange(55 + Math.round(Math.random() * 30));
          this.callbacks.onInterimText(text);
          return;
        }

        const clean = text.trim();
        if (!clean) {
          // Empty pause -> loop back into listening immediately
          if (this.isRunning && !this.isPausedForTTS) {
            this.callbacks.onVolumeChange(0);
            this.scheduleRestart(100);
          }
          return;
        }

        this.consecutiveSpeechErrors = 0;
        this.callbacks.onStatusChange('processing');
        this.callbacks.onVolumeChange(0);
        this.callbacks.onInterimText(clean);

        const sourceLang = this.currentSpeaker;
        const targetLang: 'th' | 'zh' = sourceLang === 'th' ? 'zh' : 'th';

        try {
          const res = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: clean,
              sourceLang,
              targetLang,
            }),
          });
          const data = await res.json();
          if (data.success && this.isRunning) {
            this.callbacks.onTranslation({
              originalText: clean,
              translatedText: data.translatedText,
              detectedLang: sourceLang,
              targetLang,
              pinyin: data.pinyin,
              phoneticsForReader: data.phoneticsForReader,
            });
          }
        } catch (err) {
          console.error('Continuous translation network error:', err);
        }
      },
      (error) => {
        this.consecutiveSpeechErrors++;
        console.warn('SpeechRecognition error encountered:', error, 'count:', this.consecutiveSpeechErrors);
        // If repeated errors on this device (common on iOS/Safari), switch smoothly to fallback interpreter
        if (this.consecutiveSpeechErrors >= 2) {
          console.info('Switching to MediaRecorder ContinuousAutoInterpreter fallback');
          this.switchToFallbackInterpreter();
          return;
        }
        if (this.isRunning && !this.isPausedForTTS) {
          this.scheduleRestart(250);
        }
      },
      () => {
        // Recognition completed/paused -> continue listening if not paused for TTS
        if (this.isRunning && !this.isPausedForTTS) {
          this.scheduleRestart(150);
        }
      }
    );
  }

  private scheduleRestart(delayMs = 200) {
    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
    }
    this.restartTimer = setTimeout(() => {
      this.restartTimer = null;
      if (this.isRunning && !this.isPausedForTTS) {
        this.startListeningTurn();
      }
    }, delayMs);
  }

  /**
   * Called when TTS begins speaking translation
   * Pauses recognition so microphone does not hear the phone speaker
   */
  public onTTSSpeakStart() {
    this.isPausedForTTS = true;
    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }
    if (this.speechSession) {
      this.speechSession.stop();
    }
    if (this.fallbackInterpreter) {
      this.fallbackInterpreter.setMutedForTTS(true);
    }
  }

  /**
   * Called when TTS finishes speaking translation
   * Automatically flips to the other speaker (Thai ⇄ Chinese) and resumes listening immediately
   */
  public onTTSSpeakEnd() {
    this.isPausedForTTS = false;
    // Auto turn-taking: Thai finished -> now Chinese partner's turn; Chinese finished -> Thai turn!
    this.currentSpeaker = this.currentSpeaker === 'th' ? 'zh' : 'th';
    this.callbacks.onSpeakerChange(this.currentSpeaker);

    if (this.fallbackInterpreter) {
      this.fallbackInterpreter.setMutedForTTS(false);
    } else if (this.isRunning) {
      this.scheduleRestart(180);
    }
  }

  /**
   * Instant speaker switch by user tap (e.g. Thai speaker wants to speak multiple sentences)
   */
  public switchSpeaker(lang: 'th' | 'zh') {
    this.currentSpeaker = lang;
    this.callbacks.onSpeakerChange(lang);
    if (this.fallbackInterpreter) {
      return;
    }
    if (this.isRunning && !this.isPausedForTTS) {
      if (this.speechSession) {
        this.speechSession.stop();
      }
      this.scheduleRestart(80);
    }
  }

  public stop() {
    this.isRunning = false;
    this.isPausedForTTS = false;

    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }

    if (this.speechSession) {
      this.speechSession.stop();
      this.speechSession = null;
    }

    if (this.fallbackInterpreter) {
      this.fallbackInterpreter.stop();
      this.fallbackInterpreter = null;
    }

    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close();
      } catch {}
      this.audioContext = null;
    }

    if (this.volumeStream) {
      this.volumeStream.getTracks().forEach((t) => t.stop());
      this.volumeStream = null;
    }

    this.callbacks.onStatusChange('idle');
    this.callbacks.onInterimText('');
    this.callbacks.onVolumeChange(0);
  }
}

