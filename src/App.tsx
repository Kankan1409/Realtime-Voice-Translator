import { useState, useRef, useEffect, useCallback } from 'react';
import { VoiceHeader } from './components/VoiceHeader';
import { VoiceTranslatorTemplate } from './components/VoiceTranslatorTemplate';
import { VoiceBottomNav, BottomNavTab } from './components/VoiceBottomNav';
import { SettingsModal } from './components/SettingsModal';
import { KeyboardInputModal } from './components/KeyboardInputModal';
import { CameraTranslateModal } from './components/CameraTranslateModal';
import { TextTranslateModal } from './components/TextTranslateModal';
import { HistorySummaryModal } from './components/HistorySummaryModal';
import { TranslationRecord, Language } from './types';
import {
  SpeechRecognitionSession,
  isSpeechRecognitionSupported,
  speakText,
  AudioRecorder,
} from './utils/audio';

const STORAGE_KEY = 'sinothai_translator_records_v1';

const INITIAL_RECORDS: TranslationRecord[] = [
  {
    id: 'demo-1',
    timestamp: Date.now() - 40000,
    speaker: 'th',
    originalText: 'ผมมาเที่ยวพักผ่อนที่นี่ มีสถานที่เที่ยวที่ไหนแนะนำที่ไม่ใช่ที่ดักนักท่องเที่ยวบ้างครับ?',
    translatedText: '我是来这里度假的。你有什么推荐的非旅游陷阱的地方吗？',
    pinyin: 'Wǒ shì lái zhèlǐ dùjià de. Nǐ yǒu shénme tuījiàn de fēi lǚyóu xiànjǐng de dìfāng ma?',
  },
  {
    id: 'demo-2',
    timestamp: Date.now() - 20000,
    speaker: 'zh',
    originalText: '我推荐你去索罗拉博物馆，那才是真正画家生前居住过的地方。',
    translatedText: 'ผมแนะนำให้คุณไปที่พิพิธภัณฑ์โซรอยาครับ นั่นคือบ้านที่ศิลปินเคยอาศัยอยู่จริงๆ เลย',
    pinyin: 'Wǒ tuījiàn nǐ qù Suǒluólā bówùguǎn, nà cái shì zhēnzhèng huàjiā shēngqián jūzhù guò de dìfāng.',
  },
];

export default function App() {
  const [records, setRecords] = useState<TranslationRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Could not load stored records', e);
    }
    return INITIAL_RECORDS;
  });

  const [activeSpeaker, setActiveSpeaker] = useState<Language | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [showPinyin, setShowPinyin] = useState(true);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'huge'>('large');

  // Modals & Navigation
  const [currentTab, setCurrentTab] = useState<BottomNavTab>('voice');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isTextOpen, setIsTextOpen] = useState(false);
  const [isHistorySummaryOpen, setIsHistorySummaryOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const speechSessionRef = useRef<SpeechRecognitionSession | null>(null);
  const audioRecorderRef = useRef<AudioRecorder | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Save records to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch (e) {
      console.warn('Could not save records', e);
    }
  }, [records]);

  // Clean up listening session on unmount
  useEffect(() => {
    return () => {
      speechSessionRef.current?.stop();
    };
  }, []);

  // Perform translation via backend API
  const handleTranslateText = useCallback(
    async (text: string, sourceLang: Language) => {
      if (!text.trim()) return;

      const targetLang: Language = sourceLang === 'th' ? 'zh' : 'th';
      try {
        const response = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            sourceLang,
            targetLang,
          }),
        });

        const data = await response.json();
        if (data.success) {
          const newRecord: TranslationRecord = {
            id: 'rec-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
            timestamp: Date.now(),
            speaker: sourceLang,
            originalText: data.originalText || text,
            translatedText: data.translatedText,
            pinyin: data.pinyin,
            phoneticsForReader: data.phoneticsForReader,
          };

          setRecords((prev) => [...prev, newRecord]);

          if (autoSpeak) {
            speakText(data.translatedText, targetLang);
          }
        }
      } catch (e) {
        console.error('Translation fetch failed', e);
        showToast('การแปลขัดข้อง กรุณาลองใหม่อีกครั้ง');
      }
    },
    [autoSpeak]
  );

  // Start speech recognition
  const handleStartListening = useCallback(
    (lang: Language) => {
      // If already listening, stop first
      if (speechSessionRef.current) {
        speechSessionRef.current.stop();
        speechSessionRef.current = null;
      }

      setActiveSpeaker(lang);
      setIsListening(true);
      setInterimTranscript('');

      if (isSpeechRecognitionSupported()) {
        const session = new SpeechRecognitionSession();
        speechSessionRef.current = session;

        session.start(
          lang,
          (text, isFinal) => {
            setInterimTranscript(text);
            if (isFinal) {
              handleTranslateText(text, lang);
              setIsListening(false);
              setInterimTranscript('');
            }
          },
          (err) => {
            console.warn('Speech recognition warning:', err);
            setIsListening(false);
          },
          () => {
            setIsListening(false);
          }
        );
      } else {
        // Fallback Audio Recorder
        const recorder = new AudioRecorder();
        audioRecorderRef.current = recorder;
        recorder
          .start()
          .then(() => {
            setInterimTranscript('กำลังบันทึกเสียง...');
          })
          .catch((err) => {
            console.error('AudioRecorder failed:', err);
            setIsListening(false);
            showToast('ไม่สามารถเข้าถึงไมโครโฟนได้');
          });
      }
    },
    [handleTranslateText]
  );

  // Stop listening
  const handleStopListening = useCallback(async () => {
    if (!isListening) return;

    if (speechSessionRef.current) {
      speechSessionRef.current.stop();
      speechSessionRef.current = null;
      setIsListening(false);

      if (interimTranscript.trim() && activeSpeaker) {
        handleTranslateText(interimTranscript, activeSpeaker);
        setInterimTranscript('');
      }
    } else if (audioRecorderRef.current) {
      const audioBlob = await audioRecorderRef.current.stop();
      setIsListening(false);
      setInterimTranscript('กำลังประมวลผลเสียง...');

      if (audioBlob && activeSpeaker) {
        try {
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64Audio = reader.result as string;
            const targetLang = activeSpeaker === 'th' ? 'zh' : 'th';
            const response = await fetch('/api/transcribe-translate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                audio: base64Audio,
                sourceLang: activeSpeaker,
                targetLang,
              }),
            });

            const data = await response.json();
            if (data.success && data.translatedText) {
              const newRecord: TranslationRecord = {
                id: 'rec-' + Date.now(),
                timestamp: Date.now(),
                speaker: activeSpeaker,
                originalText: data.originalText,
                translatedText: data.translatedText,
                pinyin: data.pinyin,
                phoneticsForReader: data.phoneticsForReader,
              };
              setRecords((prev) => [...prev, newRecord]);
              if (autoSpeak) {
                speakText(data.translatedText, activeSpeaker === 'th' ? 'zh' : 'th');
              }
            }
          };
        } catch (e) {
          console.error(e);
          showToast('แปลเสียงไม่สำเร็จ');
        }
      }
    }
  }, [isListening, interimTranscript, activeSpeaker, handleTranslateText, autoSpeak]);

  const handleClearHistory = () => {
    setRecords([]);
    localStorage.removeItem(STORAGE_KEY);
    showToast('ล้างประวัติข้อความเรียบร้อย');
  };

  const handleTabChange = (tab: BottomNavTab) => {
    setCurrentTab(tab);
    if (tab === 'text') {
      setIsTextOpen(true);
    } else if (tab === 'camera') {
      setIsCameraOpen(true);
    } else if (tab === 'keyboard') {
      setIsKeyboardOpen(true);
    } else if (tab === 'history') {
      setIsHistorySummaryOpen(true);
    }
  };

  return (
    <div className="h-screen w-full bg-[#f8fafc] text-slate-800 flex flex-col justify-between overflow-hidden">
      {/* 1. Header (Matching Voice Translator screenshot with Sparkle AI & Settings Gear) */}
      <VoiceHeader
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenSummary={() => setIsHistorySummaryOpen(true)}
        historyCount={records.length}
      />

      {/* 2. Main Voice Chat Interface (Clean white card & solid blue bubble style) */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <VoiceTranslatorTemplate
          records={records}
          activeSpeaker={activeSpeaker}
          isListening={isListening}
          interimTranscript={interimTranscript}
          onStartListening={handleStartListening}
          onStopListening={handleStopListening}
          onSpeak={speakText}
          showPinyin={showPinyin}
          fontSize={fontSize}
        />
      </main>

      {/* 3. Bottom 5-Tab Navigation Bar (Text | Camera | Voice | Keyboard | History) */}
      <VoiceBottomNav
        currentTab={currentTab}
        onTabChange={handleTabChange}
        historyCount={records.length}
      />

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        autoSpeak={autoSpeak}
        onToggleAutoSpeak={() => setAutoSpeak(!autoSpeak)}
        showPinyin={showPinyin}
        onTogglePinyin={() => setShowPinyin(!showPinyin)}
        fontSize={fontSize}
        onChangeFontSize={setFontSize}
        onClearHistory={handleClearHistory}
      />

      <KeyboardInputModal
        isOpen={isKeyboardOpen}
        onClose={() => {
          setIsKeyboardOpen(false);
          setCurrentTab('voice');
        }}
        onSendText={async (text, lang) => {
          await handleTranslateText(text, lang);
        }}
      />

      <TextTranslateModal
        isOpen={isTextOpen}
        onClose={() => {
          setIsTextOpen(false);
          setCurrentTab('voice');
        }}
        onTranslate={async (text, targetLang) => {
          const sourceLang = targetLang === 'zh' ? 'th' : 'zh';
          await handleTranslateText(text, sourceLang);
        }}
        onSpeak={speakText}
      />

      <CameraTranslateModal
        isOpen={isCameraOpen}
        onClose={() => {
          setIsCameraOpen(false);
          setCurrentTab('voice');
        }}
        onTranslateResult={(original, translated, speaker) => {
          const newRec: TranslationRecord = {
            id: 'cam-' + Date.now(),
            timestamp: Date.now(),
            speaker,
            originalText: original,
            translatedText: translated,
          };
          setRecords((prev) => [...prev, newRec]);
        }}
      />

      <HistorySummaryModal
        isOpen={isHistorySummaryOpen}
        onClose={() => {
          setIsHistorySummaryOpen(false);
          setCurrentTab('voice');
        }}
        records={records}
        onClearHistory={handleClearHistory}
        onSpeak={speakText}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2 rounded-2xl text-xs font-semibold shadow-xl animate-fadeIn">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
