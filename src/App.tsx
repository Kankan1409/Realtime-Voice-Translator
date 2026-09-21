import { useState, useRef, useEffect, useCallback } from 'react';
import { VoiceHeader } from './components/VoiceHeader';
import { VoiceTranslatorTemplate } from './components/VoiceTranslatorTemplate';
import { VoiceBottomNav, BottomNavTab } from './components/VoiceBottomNav';
import { SettingsModal } from './components/SettingsModal';
import { CameraTranslateModal } from './components/CameraTranslateModal';
import { TextTranslateModal } from './components/TextTranslateModal';
import { HistorySummaryModal } from './components/HistorySummaryModal';
import { TranslationRecord, Language, ConversationTopic } from './types';
import {
  SpeechRecognitionSession,
  isSpeechRecognitionSupported,
  speakText,
  AudioRecorder,
} from './utils/audio';

const TOPICS_STORAGE_KEY = 'voicetrans_topics_v3';
const CURRENT_TOPIC_ID_KEY = 'voicetrans_current_topic_id_v3';

function createNewTopic(title = 'เรื่องใหม่'): ConversationTopic {
  return {
    id: 'topic-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    title,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    records: [],
  };
}

export default function App() {
  // Load saved topics or initialize with one empty new topic
  const [topics, setTopics] = useState<ConversationTopic[]>(() => {
    try {
      const saved = localStorage.getItem(TOPICS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not load stored topics', e);
    }
    return [createNewTopic('เรื่องใหม่')];
  });

  const [currentTopicId, setCurrentTopicId] = useState<string>(() => {
    try {
      const savedId = localStorage.getItem(CURRENT_TOPIC_ID_KEY);
      if (savedId) return savedId;
    } catch (e) {}
    return topics[0]?.id || 'topic-init';
  });

  // Current active topic
  const currentTopic = topics.find((t) => t.id === currentTopicId) || topics[0] || createNewTopic('เรื่องใหม่');
  const records = currentTopic.records || [];

  const [activeSpeaker, setActiveSpeaker] = useState<Language | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [showPinyin, setShowPinyin] = useState(true);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'huge'>('large');
  const [isSummarizing, setIsSummarizing] = useState(false);

  // Modals & Navigation
  const [currentTab, setCurrentTab] = useState<BottomNavTab>('voice');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
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

  // Persist topics to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(TOPICS_STORAGE_KEY, JSON.stringify(topics));
    } catch (e) {
      console.warn('Could not save topics', e);
    }
  }, [topics]);

  // Persist currentTopicId to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CURRENT_TOPIC_ID_KEY, currentTopicId);
    } catch (e) {}
  }, [currentTopicId]);

  // Clean up listening session on unmount
  useEffect(() => {
    return () => {
      speechSessionRef.current?.stop();
    };
  }, []);

  // Request AI topic summarize in background when a topic accumulates messages
  const summarizeTopicInBackground = async (topicId: string, currentRecords: TranslationRecord[]) => {
    if (currentRecords.length === 0) return;
    try {
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history: currentRecords }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setTopics((prev) =>
          prev.map((t) => {
            if (t.id === topicId) {
              return {
                ...t,
                title: data.data.topicTitle || t.title,
                overview: data.data.overview || t.overview,
                summaryData: data.data,
                updatedAt: Date.now(),
              };
            }
            return t;
          })
        );
      }
    } catch (e) {
      console.warn('Background summarize error:', e);
    }
  };

  // Start a new topic/channel (user explicitly starts talking about something else)
  const handleStartNewTopic = () => {
    // If current topic has records, trigger summary for it
    if (records.length > 0 && currentTopic.title === 'เรื่องใหม่') {
      summarizeTopicInBackground(currentTopic.id, records);
    }

    const freshTopic = createNewTopic('เรื่องใหม่');
    setTopics((prev) => [freshTopic, ...prev]);
    setCurrentTopicId(freshTopic.id);
    showToast('✨ เปิดช่องคุยเรื่องใหม่เรียบร้อยแล้ว');
  };

  // Select an existing topic from archive
  const handleSelectTopic = (topicId: string) => {
    const target = topics.find((t) => t.id === topicId);
    if (target) {
      setCurrentTopicId(topicId);
      showToast(`เปิดเรื่อง: ${target.title}`);
    }
  };

  // Delete a topic
  const handleDeleteTopic = (topicId: string) => {
    setTopics((prev) => {
      const filtered = prev.filter((t) => t.id !== topicId);
      if (filtered.length === 0) {
        const fresh = createNewTopic('เรื่องใหม่');
        setCurrentTopicId(fresh.id);
        return [fresh];
      }
      if (currentTopicId === topicId) {
        setCurrentTopicId(filtered[0].id);
      }
      return filtered;
    });
    showToast('ลบหัวข้อเรียบร้อยแล้ว');
  };

  // Summarize current topic directly from the chat screen
  const handleSummarizeCurrentTopic = async () => {
    if (records.length === 0) {
      showToast('ยังไม่มีบทสนทนาในเรื่องนี้ให้สรุป');
      return;
    }

    setIsSummarizing(true);
    showToast('🤖 AI กำลังประมวลผลสรุปเนื้อหา...');

    try {
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history: records }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setTopics((prev) =>
          prev.map((t) => {
            if (t.id === currentTopicId) {
              return {
                ...t,
                title: data.data.topicTitle || t.title,
                overview: data.data.overview || t.overview,
                summaryData: data.data,
                updatedAt: Date.now(),
              };
            }
            return t;
          })
        );
        showToast('✨ AI สรุปบทสนทนาเรียบร้อยแล้ว');
      } else {
        showToast('ไม่สามารถสรุปได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง');
      }
    } catch (e) {
      console.error('Summarize error:', e);
      showToast('เกิดข้อผิดพลาดในการสรุปเนื้อหา');
    } finally {
      setIsSummarizing(false);
    }
  };

  // Add new translation record to current topic
  const addRecordToCurrentTopic = (newRecord: TranslationRecord) => {
    setTopics((prev) =>
      prev.map((t) => {
        if (t.id === currentTopicId) {
          const updatedRecords = [...t.records, newRecord];
          let updatedTitle = t.title;

          // If title is default 'เรื่องใหม่', use first phrase as temporary title
          if (updatedTitle === 'เรื่องใหม่' && updatedRecords.length === 1) {
            updatedTitle =
              newRecord.originalText.length > 25
                ? newRecord.originalText.substring(0, 25) + '...'
                : newRecord.originalText;
          }

          return {
            ...t,
            title: updatedTitle,
            updatedAt: Date.now(),
            records: updatedRecords,
          };
        }
        return t;
      })
    );

    // If accumulated 2 or more records, auto-summarize topic title in background
    const newCount = records.length + 1;
    if (newCount === 2 || newCount % 5 === 0) {
      setTimeout(() => {
        summarizeTopicInBackground(currentTopicId, [...records, newRecord]);
      }, 1200);
    }
  };

  const clientCache = useRef<Map<string, any>>(new Map());

  // Perform translation via backend API
  const handleTranslateText = useCallback(
    async (text: string, sourceLang: Language) => {
      const clean = text.trim();
      if (!clean) return;

      const targetLang: Language = sourceLang === 'th' ? 'zh' : 'th';
      const cacheKey = `${sourceLang}:${targetLang}:${clean.toLowerCase()}`;

      // Instant 0ms response if recently translated
      const cached = clientCache.current.get(cacheKey);
      if (cached) {
        const newRecord: TranslationRecord = {
          id: 'rec-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
          timestamp: Date.now(),
          speaker: sourceLang,
          originalText: cached.originalText || clean,
          translatedText: cached.translatedText,
          pinyin: cached.pinyin,
          phoneticsForReader: cached.phoneticsForReader,
        };
        addRecordToCurrentTopic(newRecord);
        if (autoSpeak) {
          speakText(cached.translatedText, targetLang);
        }
        return;
      }

      try {
        const response = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: clean,
            sourceLang,
            targetLang,
          }),
        });

        const data = await response.json();
        if (data.success) {
          clientCache.current.set(cacheKey, data);
          const newRecord: TranslationRecord = {
            id: 'rec-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
            timestamp: Date.now(),
            speaker: sourceLang,
            originalText: data.originalText || clean,
            translatedText: data.translatedText,
            pinyin: data.pinyin,
            phoneticsForReader: data.phoneticsForReader,
          };

          addRecordToCurrentTopic(newRecord);

          if (autoSpeak) {
            speakText(data.translatedText, targetLang);
          }
        }
      } catch (err) {
        console.error('Translation error:', err);
        showToast('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง');
      }
    },
    [autoSpeak, currentTopicId, records]
  );

  // Stop listening
  const handleStopListening = useCallback(() => {
    if (speechSessionRef.current) {
      speechSessionRef.current.stop();
      speechSessionRef.current = null;
    }
    if (audioRecorderRef.current) {
      if (activeSpeaker) {
        stopAudioRecordingAndTranslate(activeSpeaker);
      } else {
        audioRecorderRef.current.stop();
        audioRecorderRef.current = null;
      }
    }
    setIsListening(false);
    setActiveSpeaker(null);
    setInterimTranscript('');
  }, [activeSpeaker]);

  // Start listening for speech
  const handleStartListening = useCallback(
    async (lang: Language) => {
      if (isListening) {
        handleStopListening();
        return;
      }

      setActiveSpeaker(lang);
      setIsListening(true);
      setInterimTranscript('กำลังฟังเสียง...');

      if (isSpeechRecognitionSupported()) {
        try {
          const session = new SpeechRecognitionSession();
          speechSessionRef.current = session;
          session.start(
            lang,
            (text: string, isFinal: boolean) => {
              if (isFinal) {
                setInterimTranscript('');
                setIsListening(false);
                setActiveSpeaker(null);
                speechSessionRef.current = null;
                if (text.trim()) {
                  handleTranslateText(text, lang);
                }
              } else {
                setInterimTranscript(text || 'กำลังพูด...');
              }
            },
            (errorMsg: string) => {
              console.warn('SpeechRecognition failed, falling back to AudioRecorder:', errorMsg);
              startAudioRecordingFallback(lang);
            },
            () => {
              setIsListening(false);
              setActiveSpeaker(null);
            }
          );
          return;
        } catch (e) {
          console.warn('Could not start webkitSpeechRecognition:', e);
        }
      }

      startAudioRecordingFallback(lang);
    },
    [isListening, handleStopListening, handleTranslateText]
  );

  // Fallback direct audio recording
  const startAudioRecordingFallback = async (lang: Language) => {
    try {
      const recorder = new AudioRecorder();
      audioRecorderRef.current = recorder;
      await recorder.start();
      setInterimTranscript('กำลังบันทึกเสียง...');
    } catch (e) {
      console.error('Audio recorder failed:', e);
      setIsListening(false);
      setActiveSpeaker(null);
      setInterimTranscript('');
      showToast('กรุณากดอนุญาตการใช้ไมโครโฟนเพื่อพูดคุย');
    }
  };

  // Stop recording and translate
  const stopAudioRecordingAndTranslate = async (lang: Language) => {
    if (!audioRecorderRef.current) return;
    try {
      setInterimTranscript('กำลังแปลงเสียงเป็นข้อความ...');
      const audioData = await audioRecorderRef.current.stop();
      audioRecorderRef.current = null;
      setIsListening(false);
      setActiveSpeaker(null);

      if (!audioData) {
        setInterimTranscript('');
        return;
      }

      const targetLang: Language = lang === 'th' ? 'zh' : 'th';
      const response = await fetch('/api/voice-translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64: audioData.base64,
          mimeType: audioData.mimeType,
          sourceLang: lang,
          targetLang,
        }),
      });

      const data = await response.json();
      setInterimTranscript('');

      if (data.success && data.originalText) {
        const newRecord: TranslationRecord = {
          id: 'rec-' + Date.now(),
          timestamp: Date.now(),
          speaker: lang,
          originalText: data.originalText,
          translatedText: data.translatedText,
          pinyin: data.pinyin,
          phoneticsForReader: data.phoneticsForReader,
        };

        addRecordToCurrentTopic(newRecord);

        if (autoSpeak) {
          speakText(data.translatedText, targetLang);
        }
      } else {
        showToast('ไม่ได้ยินเสียง หรือเสียงเบาเกินไป กรุณาลองใหม่');
      }
    } catch (e) {
      console.error('Voice translate fallback error:', e);
      setInterimTranscript('');
      setIsListening(false);
      setActiveSpeaker(null);
      showToast('เกิดข้อผิดพลาดในการประมวลผลเสียง');
    }
  };

  const handleClearHistory = () => {
    const fresh = createNewTopic('เรื่องใหม่');
    setTopics([fresh]);
    setCurrentTopicId(fresh.id);
    showToast('ล้างประวัติหัวข้อทั้งหมดเรียบร้อยแล้ว');
  };

  // Handle bottom navigation tabs
  const handleTabChange = (tab: BottomNavTab) => {
    setCurrentTab(tab);
    if (tab === 'history') {
      setIsHistorySummaryOpen(true);
    } else if (tab === 'camera') {
      setIsCameraOpen(true);
    } else if (tab === 'text') {
      setIsTextOpen(true);
    }
  };

  return (
    <div className="h-screen w-full bg-[#f8fafc] text-slate-800 flex flex-col justify-between overflow-hidden">
      {/* 1. Header with AI Robot Topics Archive & Settings */}
      <VoiceHeader
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenSummary={() => setIsHistorySummaryOpen(true)}
        historyCount={topics.length}
      />

      {/* 2. Main Voice Chat Interface (Topic-based with "+ คุยเรื่องใหม่") */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <VoiceTranslatorTemplate
          records={records}
          activeSpeaker={activeSpeaker}
          isListening={isListening}
          interimTranscript={interimTranscript}
          onStartListening={handleStartListening}
          onStopListening={
            speechSessionRef.current
              ? handleStopListening
              : () => activeSpeaker && stopAudioRecordingAndTranslate(activeSpeaker)
          }
          onSpeak={speakText}
          showPinyin={showPinyin}
          fontSize={fontSize}
          topicTitle={currentTopic.title}
          onStartNewTopic={handleStartNewTopic}
          onOpenTopicHistory={() => setIsHistorySummaryOpen(true)}
          onSummarize={handleSummarizeCurrentTopic}
          isSummarizing={isSummarizing}
          summaryOverview={currentTopic.overview}
          summaryData={currentTopic.summaryData}
        />
      </main>

      {/* 3. Bottom 4-Tab Navigation Bar (Text | Camera | Voice | History) */}
      <VoiceBottomNav
        currentTab={currentTab}
        onTabChange={handleTabChange}
        historyCount={topics.length}
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
          addRecordToCurrentTopic(newRec);
        }}
      />

      {/* 4. Compact Topic Archive Modal */}
      <HistorySummaryModal
        isOpen={isHistorySummaryOpen}
        onClose={() => {
          setIsHistorySummaryOpen(false);
          setCurrentTab('voice');
        }}
        topics={topics}
        currentTopicId={currentTopicId}
        onSelectTopic={handleSelectTopic}
        onStartNewTopic={handleStartNewTopic}
        onDeleteTopic={handleDeleteTopic}
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
