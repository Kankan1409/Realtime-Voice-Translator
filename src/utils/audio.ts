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

          // Silence detector: allow natural conversational pause (850ms) in meetings before committing translation
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
          }, 850);
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

    // Safety watchdog: ensures onEnd is called even if browser fails onend event, without prematurely unmuting mic
    const estimatedDuration = Math.min(15000, Math.max(2000, text.length * 350));
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
  // Vocal band & noise calibration
  private ambientNoiseFloor = 8;
  private calibrationFrames = 0;
  private noiseSensitivity: 'high' | 'medium' | 'low' = 'high';

  constructor(callbacks: AutoInterpreterCallbacks) {
    this.callbacks = callbacks;
  }

  public setNoiseSensitivity(sensitivity: 'high' | 'medium' | 'low') {
    this.noiseSensitivity = sensitivity;
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
      this.calibrationFrames = 0;
      this.ambientNoiseFloor = 8;
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

  public setMutedForTTS(muted: boolean, maxDurationMs = 5000) {
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
    let calibrationSum = 0;

    const checkVolume = () => {
      if (!this.isRunning || !this.analyser) return;

      // Auto-resume AudioContext on iOS Safari if suspended after TTS or system interruption
      if (this.audioContext && (this.audioContext.state === 'suspended' || (this.audioContext.state as any) === 'interrupted')) {
        this.audioContext.resume().catch(() => {});
      }

      this.analyser.getByteFrequencyData(buffer);

      // Human vocal frequency isolation (approx. 200Hz - 3800Hz, bins 2 to 44)
      let vocalSum = 0;
      const startBin = 2;
      const endBin = Math.min(buffer.length - 1, 44);
      for (let i = startBin; i <= endBin; i++) {
        vocalSum += buffer[i];
      }
      const vocalAverage = vocalSum / (endBin - startBin + 1);
      const vocalVolume = Math.min(100, Math.round((vocalAverage / 128) * 100));

      // Visual feedback volume
      let totalSum = 0;
      for (let i = 0; i < buffer.length; i++) {
        totalSum += buffer[i];
      }
      const rawVolume = Math.min(100, Math.round(((totalSum / buffer.length) / 128) * 100));
      this.callbacks.onVolumeChange(rawVolume);

      // Fast initial ambient noise floor calibration (first 20 frames ~300ms)
      if (this.calibrationFrames < 20) {
        calibrationSum += vocalVolume;
        this.calibrationFrames++;
        if (this.calibrationFrames === 20) {
          this.ambientNoiseFloor = Math.max(8, Math.round(calibrationSum / 20));
        }
      } else if (!this.isSpeaking && !this.isProcessingNetwork) {
        // Continuous ambient noise adaptation (slow leaky integrator)
        this.ambientNoiseFloor = this.ambientNoiseFloor * 0.97 + vocalVolume * 0.03;
      }

      // If currently waiting for translation from network, don't interrupt with new chunk
      if (this.isProcessingNetwork) {
        this.animationLoopId = requestAnimationFrame(checkVolume);
        return;
      }

      // Voice Activity Detection threshold:
      // Human speech is typically 22 - 75 volume.
      // Ambient noise is typically 6 - 15 volume.
      const offset = this.noiseSensitivity === 'high' ? 8 : this.noiseSensitivity === 'medium' ? 12 : 16;
      const minFloor = this.noiseSensitivity === 'high' ? 14 : this.noiseSensitivity === 'medium' ? 18 : 22;
      const VOICE_THRESHOLD = Math.max(minFloor, Math.round(this.ambientNoiseFloor + offset));

      // Only evaluate if not currently muted for TTS
      if (!this.isMutedForTTS) {
        if (vocalVolume >= VOICE_THRESHOLD) {
          // Genuine voice detected
          if (this.silenceTimer) {
            clearTimeout(this.silenceTimer);
            this.silenceTimer = null;
          }

          if (!this.isSpeaking) {
            this.isSpeaking = true;
            this.speechStartTime = Date.now();
            this.callbacks.onStatusChange('speaking');
            this.startRecordingChunk();
          } else if (Date.now() - this.speechStartTime > 4200) {
            // Spoken for 4.2s continuously -> finish chunk so it translates without lag
            this.finishRecordingChunk();
          }
        } else if (this.isSpeaking) {
          // Volume dropped below threshold -> user paused or finished speaking
          if (!this.silenceTimer) {
            this.silenceTimer = setTimeout(() => {
              this.finishRecordingChunk();
            }, 380); // 380ms pause triggers completion
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

      this.mediaRecorder.start(250);
    } catch (e) {
      console.warn('Failed to start recording chunk:', e);
    }
  }

  private finishRecordingChunk() {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }

    if (this.isProcessingNetwork) return;

    if (!this.mediaRecorder || this.mediaRecorder.state !== 'recording') {
      this.isSpeaking = false;
      this.callbacks.onStatusChange('listening');
      return;
    }

    const duration = Date.now() - this.speechStartTime;
    // Discard clicks, taps, or mic rustle shorter than 220ms
    if (duration < 220) {
      this.isSpeaking = false;
      try {
        this.mediaRecorder.stop();
      } catch {}
      this.callbacks.onStatusChange('listening');
      return;
    }

    this.isSpeaking = false;
    this.isProcessingNetwork = true;
    this.callbacks.onStatusChange('processing');

    this.mediaRecorder.onstop = async () => {
      const mimeType = this.mediaRecorder?.mimeType || this.supportedMimeType || 'audio/webm';
      const audioBlob = new Blob(this.audioChunks, { type: mimeType });
      this.audioChunks = [];

      if (audioBlob.size < 400) {
        this.isProcessingNetwork = false;
        if (this.isRunning && !this.isMutedForTTS) {
          this.callbacks.onStatusChange('listening');
        }
        return;
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

        // Fast fetch with 12-second timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

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
        if (data.success && !data.isEmpty && data.originalText && data.originalText.trim()) {
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
      if (this.mediaRecorder.state === 'recording') {
        this.mediaRecorder.requestData();
      }
    } catch {}
    try {
      if (this.mediaRecorder.state === 'recording') {
        this.mediaRecorder.stop();
      }
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
 * High-performance bilingual continuous translation engine:
 * 1. Uses browser neural SpeechRecognition when available (zero background noise pickup, instantaneous word-by-word streaming).
 * 2. Instant AI translation via /api/translate with ThinkingLevel.MINIMAL (<250ms latency).
 * 3. Graceful fallback to vocal-band filtered ContinuousAutoInterpreter.
 */
export class ContinuousConversationManager {
  private isRunning = false;
  private isPausedForTTS = false;
  private activeSpeaker: 'th' | 'zh' = 'th';
  private interpreter: ContinuousAutoInterpreter | null = null;
  private recognitionSession: SpeechRecognitionSession | null = null;
  private callbacks: ContinuousConversationCallbacks;
  private isTranslating = false;
  private restartTimer: any = null;
  private consecutiveErrors = 0;

  public autoAlternate: boolean = false;

  constructor(callbacks: ContinuousConversationCallbacks, initialSpeaker: 'th' | 'zh' = 'th') {
    this.callbacks = callbacks;
    this.activeSpeaker = initialSpeaker;
  }

  public setAutoAlternate(enabled: boolean) {
    this.autoAlternate = enabled;
  }

  public getSpeaker(): 'th' | 'zh' {
    return this.activeSpeaker;
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }

  async start(): Promise<boolean> {
    this.stop();
    this.isRunning = true;
    this.isPausedForTTS = false;
    this.isTranslating = false;
    this.consecutiveErrors = 0;

    // If SpeechRecognition is supported (Chrome, Edge, Safari iOS 14.5+, Android Chrome),
    // use it for zero-latency on-device transcription with no API key requirement for STT.
    if (isSpeechRecognitionSupported()) {
      return this.startSpeechRecognitionLoop();
    } else {
      return this.startAutoInterpreterFallback();
    }
  }

  private startSpeechRecognitionLoop(): boolean {
    if (!this.isRunning || this.isPausedForTTS) return false;

    this.recognitionSession = new SpeechRecognitionSession();
    this.callbacks.onStatusChange('listening');

    this.recognitionSession.start(
      this.activeSpeaker,
      async (text: string, isFinal: boolean) => {
        if (!this.isRunning) return;

        if (!isFinal) {
          this.callbacks.onStatusChange('speaking');
          this.callbacks.onInterimText(text);
          return;
        }

        // Final spoken sentence received
        const cleanText = text.trim();
        if (!cleanText || this.isTranslating) return;

        this.isTranslating = true;
        this.callbacks.onStatusChange('processing');
        this.callbacks.onInterimText(cleanText);

        try {
          // Automatically detect language based on actual characters spoken
          let detectedLang: 'th' | 'zh' = this.activeSpeaker;
          let targetLang: 'th' | 'zh' = this.activeSpeaker === 'th' ? 'zh' : 'th';

          if (/[\u0E00-\u0E7F]/.test(cleanText)) {
            detectedLang = 'th';
            targetLang = 'zh';
          } else if (/[\u4E00-\u9FFF]/.test(cleanText)) {
            detectedLang = 'zh';
            targetLang = 'th';
          }

          // Alternate active speaker only if autoAlternate mode is enabled
          if (this.autoAlternate) {
            this.activeSpeaker = targetLang;
            this.callbacks.onSpeakerChange(targetLang);
          }

          // Fast translation API call (<250ms)
          const resp = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: cleanText,
              sourceLang: detectedLang,
              targetLang: targetLang,
            }),
          });

          const data = await resp.json();
          if (data.success && data.translatedText) {
            this.callbacks.onTranslation({
              originalText: cleanText,
              translatedText: data.translatedText,
              detectedLang,
              targetLang,
              pinyin: data.pinyin,
              phoneticsForReader: data.phoneticsForReader,
            });
          }
        } catch (err: any) {
          console.warn('Speech translation error:', err);
        } finally {
          this.isTranslating = false;
          this.callbacks.onInterimText('');
          this.consecutiveErrors = 0;
          // If not paused for TTS, schedule quick restart
          if (this.isRunning && !this.isPausedForTTS) {
            this.scheduleRecognitionRestart(60);
          }
        }
      },
      (error) => {
        if (!this.isRunning || this.isPausedForTTS) return;

        // Normal pause between conversation turns is NOT an error
        if (error === 'no-speech') {
          this.scheduleRecognitionRestart(100);
          return;
        }

        this.consecutiveErrors++;
        console.warn('Continuous speech recognition warning:', error, 'count:', this.consecutiveErrors);

        if (this.consecutiveErrors >= 5) {
          console.info('Switching to ContinuousAutoInterpreter fallback after repeated speech recognition errors');
          this.recognitionSession?.stop();
          this.recognitionSession = null;
          this.startAutoInterpreterFallback();
          return;
        }

        // Restart after transient error
        this.scheduleRecognitionRestart(300);
      },
      () => {
        // Recognition cycle ended
        if (this.isRunning && !this.isPausedForTTS && !this.isTranslating) {
          this.scheduleRecognitionRestart(50);
        }
      }
    );

    return true;
  }

  private scheduleRecognitionRestart(delayMs = 60) {
    if (this.restartTimer) clearTimeout(this.restartTimer);
    if (!this.isRunning || this.isPausedForTTS) return;

    this.restartTimer = setTimeout(() => {
      if (this.isRunning && !this.isPausedForTTS && !this.isTranslating) {
        this.startSpeechRecognitionLoop();
      }
    }, delayMs);
  }

  private async startAutoInterpreterFallback(): Promise<boolean> {
    this.interpreter = new ContinuousAutoInterpreter({
      onStatusChange: (status) => this.callbacks.onStatusChange(status),
      onVolumeChange: (vol) => this.callbacks.onVolumeChange(vol),
      onTranslation: (data) => {
        this.activeSpeaker = data.detectedLang;
        this.callbacks.onSpeakerChange(data.detectedLang);
        this.callbacks.onTranslation(data);
      },
      onError: (err) => {
        console.warn('Auto interpreter fallback error:', err);
        this.callbacks.onError(err);
      },
    });

    const ok = await this.interpreter.start();
    if (!ok) {
      this.isRunning = false;
    }
    return ok;
  }

  /**
   * Called when TTS begins speaking translation
   * Pauses microphone so it never captures the device's own speaker audio
   */
  public onTTSSpeakStart() {
    this.isPausedForTTS = true;

    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }

    if (this.recognitionSession) {
      this.recognitionSession.stop();
    }

    if (this.interpreter) {
      this.interpreter.setMutedForTTS(true, 6000);
    }
  }

  /**
   * Called when TTS finishes speaking translation
   * Resumes listening immediately for the next speaker
   */
  public onTTSSpeakEnd() {
    this.isPausedForTTS = false;

    if (this.interpreter) {
      this.interpreter.setMutedForTTS(false);
    }

    if (this.isRunning && !this.isTranslating) {
      if (isSpeechRecognitionSupported()) {
        this.scheduleRecognitionRestart(100);
      } else {
        this.callbacks.onStatusChange('listening');
      }
    }
  }

  /**
   * Switch speaker language
   */
  public switchSpeaker(lang: 'th' | 'zh') {
    this.activeSpeaker = lang;
    this.callbacks.onSpeakerChange(lang);

    if (this.isRunning && isSpeechRecognitionSupported() && !this.isPausedForTTS) {
      if (this.recognitionSession) {
        this.recognitionSession.stop();
      }
      this.scheduleRecognitionRestart(50);
    }
  }

  public stop() {
    this.isRunning = false;
    this.isPausedForTTS = false;
    this.isTranslating = false;

    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }

    if (this.recognitionSession) {
      this.recognitionSession.stop();
      this.recognitionSession = null;
    }

    if (this.interpreter) {
      this.interpreter.stop();
      this.interpreter = null;
    }

    this.callbacks.onStatusChange('idle');
    this.callbacks.onInterimText('');
    this.callbacks.onVolumeChange(0);
  }
}

