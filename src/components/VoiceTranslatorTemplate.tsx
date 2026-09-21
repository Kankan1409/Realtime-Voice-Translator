import React, { useRef, useEffect, useState } from 'react';
import {
  Volume2,
  Copy,
  Check,
  Sparkles,
  Mic,
  MicOff,
  RefreshCw,
  Bookmark,
  PlusCircle,
  X,
  FileText,
} from 'lucide-react';
import { TranslationRecord, Language, ConversationSummary } from '../types';
import { RobotIcon } from './RobotIcon';

interface VoiceTranslatorTemplateProps {
  records: TranslationRecord[];
  activeSpeaker: Language | null;
  isListening: boolean;
  interimTranscript: string;
  onStartListening: (lang: Language) => void;
  onStopListening: () => void;
  onSpeak: (text: string, lang: Language) => void;
  showPinyin: boolean;
  fontSize: 'normal' | 'large' | 'huge';
  topicTitle?: string;
  onStartNewTopic?: () => void;
  onOpenTopicHistory?: () => void;
  onSummarize?: () => void;
  isSummarizing?: boolean;
  summaryOverview?: string;
  summaryData?: ConversationSummary;
}

export function VoiceTranslatorTemplate({
  records,
  activeSpeaker,
  isListening,
  interimTranscript,
  onStartListening,
  onStopListening,
  onSpeak,
  showPinyin,
  fontSize,
  topicTitle,
  onStartNewTopic,
  onOpenTopicHistory,
  onSummarize,
  isSummarizing = false,
  summaryOverview,
  summaryData,
}: VoiceTranslatorTemplateProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('th');
  const [showSummaryCard, setShowSummaryCard] = useState(true);

  // Auto-show summary card when summary updates
  useEffect(() => {
    if (summaryOverview) {
      setShowSummaryCard(true);
    }
  }, [summaryOverview]);

  // Auto-scroll to bottom on new record or interim speech
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [records, interimTranscript]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleCopySummary = () => {
    if (!summaryOverview) return;
    const text = `📌 เรื่อง: ${topicTitle || 'บทสนทนา'}\n📝 สรุปโดย AI: ${summaryOverview}`;
    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  const handleCenterMicClick = () => {
    if (isListening) {
      onStopListening();
    } else {
      onStartListening(selectedLanguage);
    }
  };

  const textSizeClass =
    fontSize === 'normal'
      ? 'text-sm sm:text-base'
      : fontSize === 'large'
      ? 'text-base sm:text-lg'
      : 'text-lg sm:text-xl';

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8fafc] text-slate-800 relative overflow-hidden">
      {/* Current Topic Header Bar with "สรุป" & "+ คุยเรื่องใหม่" */}
      <div className="bg-white border-b border-slate-100 px-3 sm:px-4 py-2 flex items-center justify-between gap-2 max-w-2xl w-full mx-auto shadow-2xs z-10">
        <button
          type="button"
          onClick={onOpenTopicHistory}
          className="flex items-center gap-1.5 min-w-0 text-left hover:opacity-80 transition group flex-1"
          title="แตะเพื่อดูคลังหัวข้อทั้งหมด"
        >
          <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Bookmark className="w-3.5 h-3.5 fill-blue-600/20 text-blue-600" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] text-slate-400 font-medium leading-none">เรื่องที่กำลังคุย</div>
            <div className="text-xs font-bold text-slate-800 truncate group-hover:text-blue-600 transition">
              {topicTitle || 'บทสนทนาใหม่'}
            </div>
          </div>
        </button>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* ปุ่ม สรุป ในช่องคุยนั้นเลย */}
          <button
            type="button"
            onClick={onSummarize}
            disabled={isSummarizing || records.length === 0}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 border ${
              isSummarizing
                ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                : records.length === 0
                ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 shadow-2xs'
            }`}
            title={records.length === 0 ? 'เริ่มพูดคุยก่อนกดสรุป' : 'ให้ AI สรุปเรื่องนี้ในช่องคุยทันที'}
          >
            <Sparkles className={`w-3.5 h-3.5 ${isSummarizing ? 'animate-spin' : 'text-indigo-600'}`} />
            <span>{isSummarizing ? 'กำลังสรุป...' : 'สรุป'}</span>
          </button>

          {/* ปุ่ม + คุยเรื่องใหม่ */}
          <button
            type="button"
            onClick={onStartNewTopic}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition active:scale-95 border border-blue-100"
            title="เริ่มคุยเรื่องใหม่ แยกเก็บหัวข้อเก่าไว้"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ คุยเรื่องใหม่</span>
          </button>
        </div>
      </div>

      {/* AI Summary Card (เมื่อกดสรุป AI สรุปแสดงตรงนี้ในช่องคุยเลย) */}
      {showSummaryCard && summaryOverview && (
        <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/90 to-blue-50/90 border-b border-indigo-100 px-4 py-2.5 max-w-2xl w-full mx-auto animate-fadeIn shrink-0 shadow-xs">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 flex-1 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold text-slate-900">AI สรุปบทสนทนา:</span>
                  <span className="text-[10px] text-blue-700 font-semibold bg-white/80 px-2 py-0.5 rounded-full border border-blue-100">
                    {topicTitle}
                  </span>
                </div>
                <p className="text-xs text-slate-700 mt-1 leading-relaxed font-medium">
                  {summaryOverview}
                </p>

                {/* ประเด็นย่อย (ถ้ามี) */}
                {summaryData?.topics && summaryData.topics.length > 0 && (
                  <div className="mt-1.5 space-y-1">
                    {summaryData.topics.map((t, idx) => (
                      <div key={idx} className="text-[11px] text-slate-600 flex items-start gap-1">
                        <span className="text-blue-500 font-bold">•</span>
                        <span>
                          <strong className="text-slate-800">{t.title}:</strong> {t.bullets.join(', ')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0 ml-1">
              <button
                type="button"
                onClick={handleCopySummary}
                className="p-1.5 rounded-lg text-blue-600 hover:bg-white/80 transition"
                title="คัดลอกข้อความสรุป"
              >
                {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => setShowSummaryCard(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white/80 transition"
                title="ปิดกล่องสรุป"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4 max-w-2xl w-full mx-auto"
      >
        {records.length === 0 && !isListening && (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4 my-auto animate-fadeIn">
            <div className="w-24 h-24 rounded-3xl bg-[#0066f5] p-3 shadow-lg shadow-blue-500/25 flex items-center justify-center transition-transform hover:scale-105">
              <RobotIcon size={80} robotColor="#ffffff" bgFill="#0066f5" hasBackground={false} />
            </div>
            <div>
              <div className="font-bold text-slate-800 text-base sm:text-lg">
                ล่ามแปลเสียง ไทย ⇄ จีน
              </div>
              <p className="text-xs sm:text-sm text-slate-400 max-w-xs mt-1 leading-relaxed">
                แตะปุ่มไมโครโฟนเพื่อพูดคุย เมื่อคุยจบสามารถกดปุ่ม <span className="font-semibold text-indigo-600">"สรุป"</span> หรือ <span className="font-semibold text-blue-600">"+ คุยเรื่องใหม่"</span> ได้เลย
              </p>
            </div>
          </div>
        )}

        {records.map((rec) => {
          const isThaiSpeaker = rec.speaker === 'th';

          return (
            <div key={rec.id} className="animate-fadeIn">
              {/* Vibrant Solid Blue Card */}
              <div className="rounded-2xl p-4 shadow-md bg-[#0066f5] text-white transition">
                <div className="flex items-center justify-between mb-1.5 opacity-90">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">{isThaiSpeaker ? '🇨🇳' : '🇹🇭'}</span>
                    <span className="text-xs font-bold text-blue-100 tracking-wider">
                      {isThaiSpeaker ? 'คำแปลภาษาจีน (Chinese)' : 'คำแปลภาษาไทย (Thai)'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onSpeak(rec.translatedText, isThaiSpeaker ? 'zh' : 'th')}
                      className="p-1 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 transition"
                      title="ฟังเสียงแปล"
                    >
                      <Volume2 className="w-4 h-4 text-white" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopy(rec.translatedText, rec.id)}
                      className="p-1 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 transition"
                      title="คัดลอกข้อความ"
                    >
                      {copiedId === rec.id ? (
                        <Check className="w-4 h-4 text-emerald-300" />
                      ) : (
                        <Copy className="w-4 h-4 text-white" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Primary Large Translated Text */}
                <div className={`font-bold leading-relaxed tracking-normal ${textSizeClass}`}>
                  {rec.translatedText}
                </div>

                {/* Pinyin (shown for Chinese text) */}
                {showPinyin && rec.pinyin && (
                  <div className="mt-2 pt-2 border-t border-white/20 text-xs sm:text-sm font-medium tracking-wide text-blue-100 font-mono">
                    {rec.pinyin}
                  </div>
                )}

                {/* Original Spoken Text */}
                <div className="mt-3 pt-2 border-t border-white/20 flex items-center justify-between text-xs text-blue-100/90">
                  <span className="truncate max-w-[260px] sm:max-w-md">
                    เสียงต้นฉบับ: "{rec.originalText}"
                  </span>
                  <button
                    type="button"
                    onClick={() => onSpeak(rec.originalText, rec.speaker)}
                    className="p-1 hover:text-white transition"
                    title="ฟังเสียงต้นฉบับ"
                  >
                    <Volume2 className="w-3.5 h-3.5 opacity-80" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Interim / Live recognition state */}
        {isListening && (
          <div className="rounded-2xl p-4 border-2 border-dashed border-blue-400 bg-blue-50/60 animate-pulse text-slate-700">
            <div className="text-xs font-bold text-blue-600 mb-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
              <span>
                กำลังฟังเสียงภาษา{selectedLanguage === 'th' ? 'ไทย' : 'จีน'}...
              </span>
            </div>
            <div className="font-medium text-slate-800 text-base">
              {interimTranscript || 'กำลังพูด...'}
            </div>
          </div>
        )}
      </div>

      {/* Persistent Bottom Bar with 2 Language Buttons & Mic */}
      <div className="p-3 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-lg">
        <div className="max-w-md mx-auto flex items-center justify-between gap-3 px-2">
          {/* Thai Button */}
          <button
            type="button"
            onClick={() => {
              setSelectedLanguage('th');
              if (isListening && activeSpeaker !== 'th') {
                onStopListening();
                setTimeout(() => onStartListening('th'), 150);
              }
            }}
            className={`flex-1 py-3 px-4 rounded-2xl font-bold text-sm transition-all duration-200 border ${
              selectedLanguage === 'th'
                ? 'bg-blue-50 border-blue-500 text-[#0066f5] shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            ไทย (Thai)
          </button>

          {/* Center Mic Button */}
          <button
            type="button"
            onClick={handleCenterMicClick}
            className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 transform active:scale-95 shrink-0 ${
              isListening
                ? 'bg-rose-500 text-white ring-4 ring-rose-300 animate-pulse'
                : 'bg-[#0066f5] text-white hover:bg-blue-700 hover:shadow-blue-500/30'
            }`}
            title={isListening ? 'แตะเพื่อหยุด' : 'แตะเพื่อพูด'}
          >
            {isListening ? (
              <MicOff className="w-6 h-6 animate-bounce" />
            ) : (
              <Mic className="w-6 h-6" />
            )}
          </button>

          {/* Chinese Button */}
          <button
            type="button"
            onClick={() => {
              setSelectedLanguage('zh');
              if (isListening && activeSpeaker !== 'zh') {
                onStopListening();
                setTimeout(() => onStartListening('zh'), 150);
              }
            }}
            className={`flex-1 py-3 px-4 rounded-2xl font-bold text-sm transition-all duration-200 border ${
              selectedLanguage === 'zh'
                ? 'bg-blue-50 border-blue-500 text-[#0066f5] shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            中文 (Chinese)
          </button>
        </div>
      </div>
    </div>
  );
}
