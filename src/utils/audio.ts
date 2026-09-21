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
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch (e) {}
      this.recognition = null;
    }

    this.targetLanguage = lang === 'th' ? 'th-TH' : 'zh-CN';
    this.onResultCb = onResult;
    this.onErrorCb = onError;
    this.onEndCb = onEnd;
    this.isListening = true;

    try {
      this.recognition = new SpeechRec();
      this.recognition.continuous = false; // continuous: false is much more reliable on iOS Safari
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;
      this.recognition.lang = this.targetLanguage;

      this.recognition.onresult = (event: any) => {
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

        if (finalTranscript && this.onResultCb) {
          this.onResultCb(finalTranscript.trim(), true);
        } else if (interimTranscript && this.onResultCb) {
          this.onResultCb(interimTranscript.trim(), false);
        }
      };

      this.recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          this.onErrorCb?.('ไมโครโฟนถูกปฏิเสธ กรุณาอนุญาตไมโครโฟนในการตั้งค่า');
        } else if (event.error !== 'no-speech') {
          this.onErrorCb?.(event.error);
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
        if (this.onEndCb) this.onEndCb();
      };

      this.recognition.start();
    } catch (e: any) {
      console.warn('Recognition start error:', e);
      this.isListening = false;
      this.onErrorCb?.(e.message || 'ไม่สามารถเปิดไมโครโฟนได้');
    }
  }

  stop() {
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        try {
          this.recognition.abort();
        } catch {}
      }
    }
  }
}

// Browser TTS
export function speakText(text: string, lang: 'th' | 'zh', rate = 1.0) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return;
  }

  try {
    window.speechSynthesis.cancel(); // cancel pending speech
    const utterance = new SpeechSynthesisUtterance(text);
    const targetLangCode = lang === 'th' ? 'th-TH' : 'zh-CN';
    utterance.lang = targetLangCode;
    utterance.rate = rate;

    // Try finding matching voice
    const voices = window.speechSynthesis.getVoices();
    const matchedVoice = voices.find(v => v.lang.startsWith(lang === 'th' ? 'th' : 'zh'));
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.error('Speech synthesis error:', err);
  }
}

// MediaRecorder Audio Capture for Gemini Direct Translation
export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;

  async start(): Promise<boolean> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioChunks = [];
      let supportedMimeType = '';
      const candidateTypes = [
        'audio/mp4',
        'audio/aac',
        'audio/m4a',
        'audio/webm;codecs=opus',
        'audio/webm',
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
