import React, { useRef, useEffect, useState } from 'react';
import {
  Volume2,
  Copy,
  Check,
  Sparkles,
  Mic,
  MicOff,
  Bookmark,
  PlusCircle,
  X,
  FileText,
  Radio,
  Square,
  ChevronRight,
  Headphones,
} from 'lucide-react';
import { TranslationRecord, Language, ConversationSummary } from '../types';
import { RobotIcon } from './RobotIcon';
import { AudioWaveform } from './AudioWaveform';

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
  // Hands-free continuous auto-interpretation props
  isAutoListening?: boolean;
  autoStatus?: 'idle' | 'listening' | 'speaking' | 'processing';
  liveVolume?: number;
  onStartAutoListen?: () => void;
  onStopAndSummarize?: () => void;
  onOpenFullSummaryModal?: () => void;
  onSwitchAutoSpeaker?: (lang: Language) => void;
  onOpenOnePageReport?: () => void;
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
  isAutoListening = false,
  autoStatus = 'idle',
  liveVolume = 0,
  onStartAutoListen,
  onStopAndSummarize,
  onOpenFullSummaryModal,
  onSwitchAutoSpeaker,
  onOpenOnePageReport,
}: VoiceTranslatorTemplateProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('th');
  const [showSummaryCard, setShowSummaryCard] = useState(true);
  const [showManualToggles, setShowManualToggles] = useState(false);

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
  }, [records, interimTranscript, autoStatus]);

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

  const handleManualMicClick = () => {
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
      <div className="bg-white border-b border-slate-100 px-3 sm:px-4 py-2 flex items-center justify-between gap-2 max-w-2xl w-full mx-auto shadow-2xs z-10 shrink-0">
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
            onClick={onOpenFullSummaryModal || onSummarize}
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
            <Sparkles className={`w-3.5 h-3.5 ${isSummarizing ? 'animate-spin text-amber-600' : 'text-indigo-600'}`} />
            <span>{isSummarizing ? 'กำลังสรุป...' : 'สรุป AI'}</span>
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

      {/* AI Summary Card (เมื่อมีข้อความสรุป แสดงการ์ดย่อตรงนี้ แตะเพื่อเปิดดูเต็ม) */}
      {showSummaryCard && summaryOverview && (
        <div className="bg-gradient-to-r from-blue-50/95 via-indigo-50/95 to-blue-50/95 border-b border-indigo-100 px-4 py-2.5 max-w-2xl w-full mx-auto animate-fadeIn shrink-0 shadow-xs">
          <div className="flex items-start justify-between gap-2">
            <div
              onClick={onOpenFullSummaryModal}
              className="flex items-start gap-2 flex-1 min-w-0 cursor-pointer group"
            >
              <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs group-hover:scale-105 transition">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition">
                    AI สรุปบทสนทนา:
                  </span>
                  <span className="text-[10px] text-blue-700 font-semibold bg-white/80 px-2 py-0.5 rounded-full border border-blue-100">
                    {topicTitle}
                  </span>
                </div>
                <p className="text-xs text-slate-700 mt-1 leading-relaxed font-medium line-clamp-2">
                  {summaryOverview}
                </p>
                <div className="text-[11px] text-indigo-600 font-semibold mt-1 flex items-center gap-0.5">
                  <span>แตะเพื่อดูรายงานสรุปแบบละเอียด</span>
                  <ChevronRight className="w-3 h-3" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0 ml-1">
              {onOpenOnePageReport && (
                <button
                  type="button"
                  onClick={onOpenOnePageReport}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold shadow-2xs transition"
                  title="ดู One-Page และพิมพ์/บันทึก PDF"
                >
                  <FileText className="w-3 h-3" />
                  <span>One-Page / PDF</span>
                </button>
              )}
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
        {records.length === 0 && !isListening && !isAutoListening && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 my-auto animate-fadeIn">
            <div className="w-20 h-20 rounded-3xl bg-[#0066f5] p-3 shadow-lg shadow-blue-500/25 flex items-center justify-center transition-transform hover:scale-105">
              <RobotIcon size={64} robotColor="#ffffff" bgFill="#0066f5" hasBackground={false} />
            </div>
            <div>
              <div className="font-bold text-slate-800 text-base sm:text-lg">
                ล่ามแปลเสียงสด ไทย ⇄ จีน
              </div>
              <p className="text-xs sm:text-sm text-slate-500 max-w-xs mt-1.5 leading-relaxed">
                กดปุ่ม <span className="font-bold text-blue-600">"เริ่มคุยอัตโนมัติ"</span> ด้านล่าง แล้ววางโทรศัพท์ไว้ตรงกลาง คนไทยพูดก็แปล คนจีนพูดก็แปลทันที ไม่ต้องกดสลับ!
              </p>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 max-w-xs text-left text-xs text-slate-600 shadow-2xs space-y-2">
              <div className="font-bold text-slate-800 flex items-center gap-1.5 text-blue-600">
                <Radio className="w-3.5 h-3.5" />
                <span>ขั้นตอนการใช้งานง่ายๆ:</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                <span>กดปุ่มเริ่มคุยอัตโนมัติเพียงครั้งเดียว</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                <span>พูดคุยได้อย่างเป็นธรรมชาติ ระบบตรวจจับและแปลให้อัตโนมัติ</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                <span>เมื่อคุยเสร็จ กด <span className="font-bold text-indigo-600">"หยุดและให้ AI สรุป"</span> ได้ทันที</span>
              </div>
            </div>
          </div>
        )}

        {records.map((rec) => {
          const isThaiSpeaker = rec.speaker === 'th';

          return (
            <div key={rec.id} className="animate-fadeIn">
              {/* Vibrant Translation Card */}
              <div className={`rounded-2xl p-4 shadow-md text-white transition ${
                isThaiSpeaker ? 'bg-[#0066f5]' : 'bg-[#0f172a]'
              }`}>
                <div className="flex items-center justify-between mb-2 opacity-90">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{isThaiSpeaker ? '🇹🇭 ➔ 🇨🇳' : '🇨🇳 ➔ 🇹🇭'}</span>
                    <span className="text-xs font-bold text-blue-100 tracking-wider">
                      {isThaiSpeaker ? 'คำแปลภาษาจีน (Chinese)' : 'คำแปลภาษาไทย (Thai)'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onSpeak(rec.translatedText, isThaiSpeaker ? 'zh' : 'th')}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 transition"
                      title="ฟังเสียงแปล"
                    >
                      <Volume2 className="w-4 h-4 text-white" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopy(rec.translatedText, rec.id)}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 transition"
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
                  <div className="mt-2 pt-2 border-t border-white/20 text-xs sm:text-sm font-medium tracking-wide text-blue-100 font-mono flex items-center gap-2">
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/15 text-white font-sans font-bold">พินอิน</span>
                    <span>{rec.pinyin}</span>
                  </div>
                )}

                {/* Thai Phonetics pronunciation guide if available */}
                {rec.phoneticsForReader && (
                  <div className="mt-1.5 text-xs font-medium text-amber-200">
                    คำอ่าน: {rec.phoneticsForReader}
                  </div>
                )}

                {/* Original Spoken Text */}
                <div className="mt-3 pt-2 border-t border-white/20 flex items-center justify-between text-xs text-blue-100/90">
                  <span className="truncate max-w-[240px] sm:max-w-md">
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

        {/* Live recognition / auto interpretation interim state */}
        {isAutoListening && (
          <div className={`rounded-2xl p-4 border-2 transition-all ${
            autoStatus === 'speaking'
              ? 'border-blue-500 bg-blue-50/95 shadow-md ring-2 ring-blue-400/30'
              : autoStatus === 'processing'
              ? 'border-indigo-400 bg-indigo-50/90 animate-pulse'
              : 'border-emerald-400 bg-emerald-50/80 shadow-2xs'
          }`}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${
                  autoStatus === 'speaking'
                    ? 'bg-blue-600 animate-ping'
                    : autoStatus === 'processing'
                    ? 'bg-indigo-600 animate-spin'
                    : 'bg-emerald-500 animate-pulse'
                }`} />
                <span className="text-xs font-bold text-slate-800">
                  {autoStatus === 'speaking'
                    ? `🗣️ กำลังฟังเสียงฝ่าย${activeSpeaker === 'zh' ? 'จีน 🇨🇳' : 'ไทย 🇹🇭'}...`
                    : autoStatus === 'processing'
                    ? '⚡ กำลังถอดความและแปลภาษาทันที...'
                    : `🟢 กำลังเปิดไมค์รอฟังฝ่าย${activeSpeaker === 'zh' ? 'จีน 🇨🇳' : 'ไทย 🇹🇭'} (พูดได้เลย)`}
                </span>
              </div>
              <AudioWaveform isActive={autoStatus === 'speaking' || autoStatus === 'processing' || liveVolume > 5} color="bg-blue-600" barsCount={8} />
            </div>

            {/* Real-time interim speech recognized words */}
            {interimTranscript && (
              <div className="mt-2.5 pt-2 border-t border-blue-200/60 flex items-start gap-2 animate-fadeIn">
                <span className="text-[11px] font-bold text-blue-700 bg-blue-100/90 px-2 py-0.5 rounded-md shrink-0">
                  คำที่ได้ยิน:
                </span>
                <span className="text-sm font-semibold text-slate-800 break-words leading-snug">
                  "{interimTranscript}"
                </span>
              </div>
            )}
          </div>
        )}

        {/* Manual interim transcript */}
        {isListening && !isAutoListening && (
          <div className="rounded-2xl p-4 border-2 border-dashed border-blue-400 bg-blue-50/60 animate-pulse text-slate-700">
            <div className="text-xs font-bold text-blue-600 mb-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
              <span>
                กำลังฟังเสียงภาษา{selectedLanguage === 'th' ? 'ไทย 🇹🇭' : 'จีน 🇨🇳'}...
              </span>
            </div>
            <div className="font-medium text-slate-800 text-base">
              {interimTranscript || 'กำลังพูด...'}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Control Section */}
      <div className="p-3 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-lg shrink-0">
        <div className="max-w-md mx-auto space-y-2">
          {/* 1. If currently in Auto-Listening Mode: Speaker selector & Stop & Summarize Button */}
          {isAutoListening ? (
            <div className="space-y-2">
              {/* Speaker Selector Pill during Auto-listening */}
              <div className="bg-slate-100/90 p-1 rounded-2xl border border-slate-200/90 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onSwitchAutoSpeaker?.('th')}
                  className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    activeSpeaker === 'th'
                      ? 'bg-[#0066f5] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 bg-transparent'
                  }`}
                  title="แตะหากฝ่ายไทยต้องการพูดต่อ"
                >
                  <span>🇹🇭 ฝ่ายไทยพูด</span>
                  {activeSpeaker === 'th' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  )}
                </button>

                <div className="text-[10px] text-slate-400 font-bold shrink-0">⇄</div>

                <button
                  type="button"
                  onClick={() => onSwitchAutoSpeaker?.('zh')}
                  className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    activeSpeaker === 'zh'
                      ? 'bg-[#0066f5] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 bg-transparent'
                  }`}
                  title="แตะหากฝ่ายจีนต้องการพูดต่อ"
                >
                  <span>🇨🇳 ฝ่ายจีนพูด</span>
                  {activeSpeaker === 'zh' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  )}
                </button>
              </div>

              {/* Dynamic Live Status Bar */}
              <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span className="font-semibold text-slate-700">
                    {autoStatus === 'speaking'
                      ? 'ได้ยินเสียงกำลังพูด...'
                      : autoStatus === 'processing'
                      ? 'กำลังแปลภาษาทันที...'
                      : `เปิดไมค์อยู่ พูดภาษา${activeSpeaker === 'zh' ? 'จีน' : 'ไทย'}ได้เลย`}
                  </span>
                </div>
                <div className="text-[11px] text-blue-600 font-bold">
                  {records.length} ข้อความ
                </div>
              </div>

              {/* Master STOP & SUMMARIZE Button requested by user */}
              <button
                type="button"
                onClick={onStopAndSummarize}
                className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-rose-600 via-indigo-700 to-rose-600 text-white font-bold text-sm sm:text-base shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2.5 transition-all transform active:scale-[0.98] hover:shadow-xl animate-pulse"
                title="กดหยุดการสนทนา แล้วให้ AI สรุปเนื้อหาทันที"
              >
                <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <Square className="w-4 h-4 fill-white text-white" />
                </div>
                <div className="text-left">
                  <div className="font-bold flex items-center gap-1.5 leading-tight">
                    <span>หยุดคุย และให้ AI สรุปเนื้อหา</span>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                  </div>
                  <div className="text-[11px] text-rose-100 font-normal leading-tight mt-0.5">
                    กดหยุดเมื่อคุยจบ AI จะสรุปประเด็นและข้อตกลงให้ทันที
                  </div>
                </div>
              </button>
            </div>
          ) : (
            /* 2. When Not Listening: Big HERO "เริ่มคุยอัตโนมัติ" Button */
            <div className="space-y-2">
              <button
                type="button"
                onClick={onStartAutoListen}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 text-white font-bold shadow-lg shadow-blue-500/25 flex items-center justify-center gap-3 transition-all transform active:scale-[0.98] hover:shadow-xl hover:from-blue-700 hover:to-indigo-700"
              >
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0 shadow-xs">
                  <Mic className="w-5 h-5 text-white" />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <div className="text-sm sm:text-base font-bold flex items-center gap-2 leading-tight">
                    <span>เริ่มคุยอัตโนมัติ (ไทย ⇄ จีน)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-400 text-emerald-950 font-extrabold shrink-0">
                      ไม่ต้องกดตลอด
                    </span>
                  </div>
                  <div className="text-xs text-blue-100 font-normal leading-tight mt-1 truncate">
                    คนจีนพูดก็แปล คนไทยพูดก็แปลทันที คุยจบกดสรุปได้เลย
                  </div>
                </div>
              </button>

              {/* Sub-toggle for manual per-sentence talk if needed */}
              <div className="pt-1 flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => setShowManualToggles(!showManualToggles)}
                  className="text-[11px] text-slate-400 hover:text-slate-600 transition flex items-center gap-1 font-medium"
                >
                  <span>{showManualToggles ? 'ซ่อนโหมดกดพูดทีละประโยค' : 'หรือต้องการกดพูดทีละประโยค?'}</span>
                  <ChevronRight className={`w-3 h-3 transition-transform ${showManualToggles ? 'rotate-90' : ''}`} />
                </button>
              </div>

              {/* Collapsible Manual Talk Buttons */}
              {showManualToggles && (
                <div className="flex items-center justify-between gap-2 pt-1 animate-fadeIn">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLanguage('th');
                      if (isListening && activeSpeaker !== 'th') {
                        onStopListening();
                        setTimeout(() => onStartListening('th'), 150);
                      }
                    }}
                    className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs transition border ${
                      selectedLanguage === 'th'
                        ? 'bg-blue-50 border-blue-500 text-[#0066f5]'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    🇹🇭 พูดไทย
                  </button>

                  <button
                    type="button"
                    onClick={handleManualMicClick}
                    className={`w-10 h-10 rounded-full flex items-center justify-center shadow transition active:scale-95 shrink-0 ${
                      isListening
                        ? 'bg-rose-500 text-white ring-4 ring-rose-300 animate-pulse'
                        : 'bg-slate-800 text-white hover:bg-slate-900'
                    }`}
                    title={isListening ? 'แตะเพื่อหยุด' : 'แตะเพื่อพูดประโยคนี้'}
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLanguage('zh');
                      if (isListening && activeSpeaker !== 'zh') {
                        onStopListening();
                        setTimeout(() => onStartListening('zh'), 150);
                      }
                    }}
                    className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs transition border ${
                      selectedLanguage === 'zh'
                        ? 'bg-blue-50 border-blue-500 text-[#0066f5]'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    🇨🇳 พูดจีน
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

