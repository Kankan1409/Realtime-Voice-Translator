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
  Trash2,
  Video,
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
  onOpenOnePageReport?: () => void;
  onOpenOnePageVisual?: () => void;
  onOpenPDFReport?: () => void;
  onDeleteRecord?: (recordId: string) => void;
  onClearRecords?: () => void;
  onOpenLiveCall?: () => void;
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
  onOpenOnePageReport,
  onOpenOnePageVisual,
  onOpenPDFReport,
  onDeleteRecord,
  onClearRecords,
  onOpenLiveCall,
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

          {/* ปุ่ม ล้างข้อความ เมื่อมีข้อความ */}
          {records.length > 0 && onClearRecords && (
            <button
              type="button"
              onClick={onClearRecords}
              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition active:scale-95"
              title="ล้างข้อความในหัวข้อนี้"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Quick Live Video Call Banner for Facebook Messenger sharing */}
      {onOpenLiveCall && (
        <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border-b border-emerald-100/80 px-3.5 sm:px-4 py-1.5 max-w-2xl w-full mx-auto flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-700 font-semibold text-[11px] sm:text-xs truncate">
              ต้องการคอลวิดีโอ? ส่งลิงก์เข้า Facebook โทรคุยพร้อมซับไตเติลสด
            </span>
          </div>
          <button
            type="button"
            onClick={onOpenLiveCall}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs active:scale-95 transition shrink-0 ml-2"
          >
            <Video className="w-3.5 h-3.5" />
            <span>สร้างลิงก์คอล</span>
          </button>
        </div>
      )}

      {/* AI Summary Card (เมื่อมีข้อความสรุป แสดงการ์ดย่อตรงนี้ แตะเพื่อเปิดดูเต็ม) */}
      {showSummaryCard && summaryOverview && (
        <div className="bg-gradient-to-r from-blue-50/95 via-indigo-50/95 to-blue-50/95 border-b border-indigo-100/90 px-3.5 sm:px-4 py-2.5 max-w-2xl w-full mx-auto animate-fadeIn shrink-0 shadow-xs">
          {/* Top Bar: Title, Topic Pill, and Quick Actions (Copy & Close) */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div
              onClick={onOpenFullSummaryModal}
              className="flex items-center gap-2 min-w-0 cursor-pointer group flex-1"
            >
              <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition">
                <Sparkles className="w-3 h-3 text-amber-200" />
              </div>
              <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition">
                  AI สรุปบทสนทนา
                </span>
                {topicTitle && (
                  <span className="text-[10px] text-blue-700 font-semibold bg-white/90 px-2 py-0.5 rounded-full border border-blue-100 truncate max-w-[150px] sm:max-w-[200px]">
                    {topicTitle}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handleCopySummary}
                className="flex items-center gap-1 px-1.5 py-1 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-white/80 transition text-[11px] font-medium"
                title="คัดลอกข้อความสรุป"
              >
                {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{copiedSummary ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowSummaryCard(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white/80 transition"
                title="ปิดกล่องสรุป"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body: Full-width Summary text with click-to-expand */}
          <div
            onClick={onOpenFullSummaryModal}
            className="cursor-pointer group bg-white/60 hover:bg-white/80 border border-indigo-100/60 rounded-xl p-2.5 transition"
          >
            <p className="text-xs text-slate-700 leading-relaxed font-medium line-clamp-2">
              {summaryOverview}
            </p>
            <div className="text-[11px] text-indigo-600 font-semibold mt-1 flex items-center gap-0.5">
              <span>แตะเพื่อดูรายงานสรุปแบบละเอียด</span>
              <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* Bottom Action Buttons: Full width 2-button layout */}
          <div className="flex items-center gap-2 mt-2">
            {onOpenOnePageVisual && (
              <button
                type="button"
                onClick={onOpenOnePageVisual}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-2xs transition active:scale-98"
                title="เปิดรูปสรุป One-Page ดีไซน์สวยงาม บันทึกภาพ PNG หรือแชร์"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span className="truncate">รูปสรุป One-Page</span>
              </button>
            )}

            {(onOpenPDFReport || onOpenOnePageReport) && (
              <button
                type="button"
                onClick={onOpenPDFReport || onOpenOnePageReport}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-2xs transition active:scale-98"
                title="เปิดเอกสารรายงาน PDF ฉบับทางการ พร้อมดาวน์โหลดหรือพิมพ์"
              >
                <FileText className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">เอกสาร PDF</span>
              </button>
            )}
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
                ล่ามแปลเสียงสดอัตโนมัติ ไทย ⇄ จีน
              </div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 max-w-xs text-left text-xs text-slate-600 shadow-2xs space-y-2">
              <div className="font-bold text-slate-800 flex items-center gap-1.5 text-blue-600">
                <Radio className="w-3.5 h-3.5" />
                <span>โหมดพูดพรีเซนต์ / บทสนทนาอัตโนมัติ:</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                <span>กดเปิดไมค์เพียงครั้งเดียว แล้วพูดพรีเซนต์หรือสนทนาได้ต่อเนื่อง</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                <span><strong>พูดไทย:</strong> ทวนคำพูดไทยด้านบน + แปลจีนวางไว้ข้างใต้ทันที</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-rose-100 text-rose-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                <span><strong>พูดจีน:</strong> ทวนคำพูดจีนด้านบน + แปลไทยวางไว้ข้างใต้ทันที</span>
              </div>
              <div className="mt-2 text-[11px] bg-blue-50 text-blue-900 p-2.5 rounded-xl border border-blue-200/80 flex items-start gap-2">
                <span className="shrink-0 text-sm">✨</span>
                <span>ตรวจจับภาษาอัตโนมัติ 100% ไม่ต้องมานั่งกดสลับฝั่งให้ยุ่งยาก</span>
              </div>
            </div>
          </div>
        )}

        {records.map((rec) => {
          const isThaiSpeaker = rec.speaker === 'th';

          return (
            <div key={rec.id} className="animate-fadeIn">
              {/* Dual-language Script Card: Spoken words on top, Translation directly below */}
              <div className="rounded-2xl p-4 shadow-sm border border-slate-700/60 bg-[#0f172a] text-white transition">
                {/* Header Tag & Action Buttons */}
                <div className="flex items-center justify-between mb-3 opacity-90">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5 shadow-2xs ${
                      isThaiSpeaker
                        ? 'bg-blue-600/30 text-blue-200 border border-blue-400/30'
                        : 'bg-rose-600/30 text-rose-200 border border-rose-400/30'
                    }`}>
                      <span>{isThaiSpeaker ? '🇹🇭 ผู้พูดภาษาไทย' : '🇨🇳 ผู้พูดภาษาจีน'}</span>
                      <span className="text-[10px] opacity-75">➔ {isThaiSpeaker ? 'แปลเป็นจีน' : 'แปลเป็นไทย'}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {/* Speak translation */}
                    <button
                      type="button"
                      onClick={() => onSpeak(rec.translatedText, isThaiSpeaker ? 'zh' : 'th')}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 transition text-white"
                      title="ฟังเสียงแปล"
                    >
                      <Volume2 className="w-4 h-4 text-white" />
                    </button>
                    {/* Speak original */}
                    <button
                      type="button"
                      onClick={() => onSpeak(rec.originalText, rec.speaker)}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 transition text-slate-300"
                      title="ฟังเสียงทวนคำพูดเดิม"
                    >
                      <span className="text-[10px] font-bold">ต้นฉบับ</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopy(`${rec.originalText}\n${rec.translatedText}`, rec.id)}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 transition"
                      title="คัดลอกทั้งบทพูดและคำแปล"
                    >
                      {copiedId === rec.id ? (
                        <Check className="w-4 h-4 text-emerald-300" />
                      ) : (
                        <Copy className="w-4 h-4 text-white" />
                      )}
                    </button>
                    {onDeleteRecord && (
                      <button
                        type="button"
                        onClick={() => onDeleteRecord(rec.id)}
                        className="p-1.5 rounded-lg bg-white/10 hover:bg-rose-500/40 hover:text-rose-200 active:scale-95 transition text-slate-300"
                        title="ลบข้อความนี้"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* 1. TOP: Spoken sentence (ทวนคำพูดที่พูดจริง) */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                    <span>{isThaiSpeaker ? '🇹🇭 ข้อความที่พูด (ไทย):' : '🇨🇳 ข้อความที่พูด (จีน):'}</span>
                  </div>
                  <div className={`font-semibold text-white leading-relaxed ${textSizeClass}`}>
                    {rec.originalText}
                  </div>
                </div>

                {/* Visual Arrow Divider */}
                <div className="my-2.5 flex items-center gap-2 text-slate-500 text-xs">
                  <div className="h-px bg-white/15 flex-1" />
                  <span className="text-[11px] font-bold text-slate-400 bg-white/5 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <span>↓</span>
                    <span>{isThaiSpeaker ? 'แปลเป็นจีน' : 'แปลเป็นไทย'}</span>
                  </span>
                  <div className="h-px bg-white/15 flex-1" />
                </div>

                {/* 2. BOTTOM: Translated sentence (แปลภาษาไว้ใต้คำพูด) */}
                <div className="space-y-1.5 bg-white/5 rounded-xl p-3 border border-white/10">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                    <span>{isThaiSpeaker ? '🇨🇳 คำแปล (จีน):' : '🇹🇭 คำแปล (ไทย):'}</span>
                  </div>
                  <div className={`font-bold leading-relaxed text-amber-200 ${textSizeClass}`}>
                    {rec.translatedText}
                  </div>

                  {/* Pinyin (shown for Chinese target or Chinese original) */}
                  {showPinyin && rec.pinyin && (
                    <div className="pt-1.5 border-t border-white/10 text-xs sm:text-sm font-medium tracking-wide text-blue-200 font-mono flex items-center gap-2">
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/15 text-white font-sans font-bold">พินอิน</span>
                      <span>{rec.pinyin}</span>
                    </div>
                  )}

                  {/* Thai Phonetics pronunciation guide for Chinese */}
                  {rec.phoneticsForReader && (
                    <div className="text-xs font-medium text-amber-300">
                      คำอ่าน: {rec.phoneticsForReader}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Live recognition / auto interpretation interim state for Meetings */}
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
                    ? '🗣️ กำลังจับเสียงพูด...'
                    : autoStatus === 'processing'
                    ? '⚡ กำลังทวนคำพูดและแปลภาษาอัตโนมัติ...'
                    : '🟢 ไมค์เปิดอยู่... พูดพรีเซนต์ได้เลย (ไทย ⇄ จีน)'}
                </span>
              </div>
              <AudioWaveform isActive={autoStatus === 'speaking' || autoStatus === 'processing' || liveVolume > 5} color="bg-blue-600" barsCount={8} />
            </div>

            {/* Real-time interim speech recognized words */}
            {interimTranscript && (
              <div className="mt-2.5 pt-2 border-t border-blue-200/60 flex items-start gap-2 animate-fadeIn">
                <span className="text-[11px] font-bold text-blue-700 bg-blue-100/90 px-2 py-0.5 rounded-md shrink-0">
                  กำลังพูดสด:
                </span>
                <span className="text-sm sm:text-base font-semibold text-slate-900 break-words leading-snug">
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
                กำลังฟังเสียง... (พูดไทยหรือจีน ระบบแปลให้อัตโนมัติ)
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
        <div className="max-w-md mx-auto space-y-2.5">
          {/* 1. If currently in Auto-Listening Mode: Live status & Stop/Summarize Button */}
          {isAutoListening ? (
            <div className="space-y-2.5">
              {/* Auto-Detection Status Pill - Single Unified Meeting Room Mic */}
              <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 p-3 rounded-2xl border border-blue-200/90 shadow-2xs space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-700 text-white">
                      <Mic className="w-4 h-4 text-white" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-bold text-blue-950 flex items-center gap-1.5 truncate">
                        <span>🎙️ ไมค์เปิดอยู่: ตรวจจับเสียงพูดอัตโนมัติ (ไทย ⇄ จีน)</span>
                      </div>
                      <div className="text-[11px] text-blue-800/80 truncate">
                        พูดภาษาไทยหรือจีนได้เลย ระบบตรวจจับภาษาจากเสียงแล้วแปลให้อีกภาษาทันที
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    <span>กำลังฟัง</span>
                  </div>
                </div>
              </div>

              {/* Dynamic Live Status Bar */}
              <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    autoStatus === 'speaking'
                      ? 'bg-blue-600 animate-ping'
                      : autoStatus === 'processing'
                      ? 'bg-indigo-600 animate-spin'
                      : 'bg-emerald-500 animate-pulse'
                  }`} />
                  <span className="font-semibold text-slate-700 truncate">
                    {autoStatus === 'speaking'
                      ? '🗣️ กำลังจับเสียงพูด...'
                      : autoStatus === 'processing'
                      ? '⚡ กำลังตรวจจับภาษาและแปลทันที...'
                      : '🟢 ไมค์พร้อมฟัง... พูดไทยหรือจีนได้ทันที ไม่ต้องกดสลับฝั่ง'}
                  </span>
                </div>
                <div className="text-xs text-blue-600 font-bold shrink-0">
                  {records.length} ข้อความ
                </div>
              </div>

              {/* Master STOP & SUMMARIZE Button for Meeting Minutes */}
              <button
                type="button"
                onClick={onStopAndSummarize}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-rose-600 via-indigo-700 to-rose-600 text-white font-bold text-sm sm:text-base shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2.5 transition-all transform active:scale-[0.98] hover:shadow-xl"
                title="กดหยุดการประชุม แล้วให้ AI สรุปรายงานการประชุมทันที"
              >
                <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <Square className="w-4 h-4 fill-white text-white" />
                </div>
                <div className="text-left">
                  <div className="font-bold flex items-center gap-1.5 leading-tight">
                    <span>หยุดประชุม & ให้ AI สรุปรายงาน</span>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                  </div>
                  <div className="text-[11px] text-rose-100 font-normal leading-tight mt-0.5">
                    สรุปประเด็น ข้อตกลง และสิ่งที่ต้องดำเนินการ (Action Items)
                  </div>
                </div>
              </button>
            </div>
          ) : (
            /* 2. When Not Listening: Single Unified Meeting Microphone Button */
            <button
              type="button"
              onClick={onStartAutoListen}
              className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white font-bold text-base shadow-lg shadow-blue-500/25 flex items-center justify-center gap-3.5 transition-all transform active:scale-[0.98] hover:shadow-xl hover:from-blue-700 hover:to-indigo-800"
            >
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0 shadow-xs">
                <Mic className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <div className="font-bold text-base sm:text-lg leading-tight">
                  เปิดไมค์แปลเสียงสด (ไทย ⇄ จีน)
                </div>
                <div className="text-xs text-blue-100 font-normal leading-tight mt-0.5">
                  ตรวจจับภาษาจากเสียงพูดอัตโนมัติ — พูดไทยแปลเป็นจีน หรือพูดจีนแปลเป็นไทยได้ทันที
                </div>
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

