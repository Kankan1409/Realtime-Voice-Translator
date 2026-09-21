import React, { useRef, useEffect } from 'react';
import { Volume2, Copy, Check, Sparkles, Mic, MicOff, RefreshCw } from 'lucide-react';
import { TranslationRecord, Language } from '../types';

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
}: VoiceTranslatorTemplateProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  // Default selected speaker language for the center mic button
  const [selectedLanguage, setSelectedLanguage] = React.useState<Language>('th');

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [records, interimTranscript, isListening]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
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
      {/* Messages Scroll Area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4 max-w-2xl w-full mx-auto"
      >
        {records.length === 0 && !isListening && (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-3 my-auto">
            <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shadow-inner">
              <Sparkles className="w-8 h-8" />
            </div>
            <div className="font-bold text-slate-700 text-base">พร้อมแปลเสียงสนทนา</div>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xs">
              เลือกภาษา (ไทย หรือ จีน) แล้วแตะปุ่มไมโครโฟนสีน้ำเงินตรงกลางเพื่อเริ่มพูด
            </p>
          </div>
        )}

        {records.map((rec) => {
          const isThaiSpeaker = rec.speaker === 'th';

          return (
            <div key={rec.id} className="space-y-2.5 animate-fadeIn">
              {/* Original Speech Bubble: White Card with shadow */}
              <div
                className={`rounded-2xl p-4 shadow-sm border transition ${
                  isThaiSpeaker
                    ? 'bg-white border-slate-200/80 mr-6 sm:mr-12'
                    : 'bg-white border-slate-200/80 mr-6 sm:mr-12'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {isThaiSpeaker ? '🇹🇭 ผู้พูดภาษาไทย (Thai)' : '🇨🇳 中文原声 (Chinese)'}
                  </span>
                  <button
                    type="button"
                    onClick={() => onSpeak(rec.originalText, isThaiSpeaker ? 'th' : 'zh')}
                    className="p-1 text-slate-400 hover:text-blue-600 transition"
                    title="ฟังเสียงต้นฉบับ"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
                <p className={`${textSizeClass} text-slate-800 font-medium leading-relaxed`}>
                  {rec.originalText}
                </p>
              </div>

              {/* Translated Speech Bubble: Vibrant Solid Blue Card (Exact style from screenshot) */}
              <div
                className={`rounded-2xl p-4 shadow-md transition ${
                  isThaiSpeaker
                    ? 'bg-[#0066f5] text-white ml-6 sm:ml-12'
                    : 'bg-[#0066f5] text-white ml-6 sm:ml-12'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5 opacity-90">
                  <span className="text-[11px] font-semibold text-blue-100 tracking-wider">
                    {isThaiSpeaker ? '🇨🇳 คำแปลภาษาจีน (Chinese)' : '🇹🇭 คำแปลภาษาไทย (Thai)'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onSpeak(rec.translatedText, isThaiSpeaker ? 'zh' : 'th')}
                      className="p-1 hover:bg-white/20 rounded-lg text-white transition"
                      title="ฟังเสียงอ่าน"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopy(rec.translatedText, rec.id)}
                      className="p-1 hover:bg-white/20 rounded-lg text-white transition"
                      title="คัดลอก"
                    >
                      {copiedId === rec.id ? (
                        <Check className="w-4 h-4 text-emerald-300" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <p className={`${textSizeClass} font-semibold leading-relaxed tracking-wide`}>
                  {rec.translatedText}
                </p>

                {showPinyin && rec.pinyin && isThaiSpeaker && (
                  <div className="text-xs text-blue-100 font-mono mt-1.5 pt-1 border-t border-white/20">
                    {rec.pinyin}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Real-time Listening Interim Card */}
        {isListening && (
          <div className="space-y-2 animate-fadeIn">
            <div className="rounded-2xl p-4 bg-white border-2 border-blue-400 shadow-md">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-600 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping" />
                <span>
                  กำลังฟังเสียง{activeSpeaker === 'th' ? 'ภาษาไทย...' : 'ภาษาจีน...'}
                </span>
              </div>
              <p className={`${textSizeClass} text-slate-800 font-semibold italic min-h-[24px]`}>
                {interimTranscript || 'กำลังพูด...'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Floating Control Box (Exact Replica of the Pill Box in screenshot) */}
      <div className="p-4 bg-gradient-to-t from-slate-100 via-slate-100/90 to-transparent">
        <div className="max-w-md mx-auto bg-white rounded-3xl p-3 shadow-xl border border-slate-200/90 flex items-center justify-between gap-3">
          
          {/* Left Language Pill Button (Thai / English style) */}
          <button
            type="button"
            onClick={() => {
              if (isListening && activeSpeaker !== 'th') {
                onStopListening();
              }
              setSelectedLanguage('th');
              if (!isListening) {
                onStartListening('th');
              }
            }}
            className={`flex-1 py-3 px-3 rounded-2xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 shadow-xs border ${
              selectedLanguage === 'th' || activeSpeaker === 'th'
                ? 'bg-white border-slate-300 text-slate-800 shadow-sm ring-2 ring-blue-500/20'
                : 'bg-slate-50 border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>ไทย (Thai)</span>
          </button>

          {/* Center Blue Voice Mic Button (Big Blue Circle with Wave pulse) */}
          <div className="relative shrink-0 flex items-center justify-center">
            {isListening && (
              <span className="absolute -inset-2 rounded-full bg-blue-500/30 animate-ping" />
            )}
            <button
              type="button"
              onClick={handleCenterMicClick}
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 z-10 ${
                isListening
                  ? 'bg-rose-600 text-white shadow-rose-500/50 animate-pulse'
                  : 'bg-[#0066f5] hover:bg-[#0052cc] text-white shadow-blue-500/40 hover:scale-105'
              }`}
              title={isListening ? 'กดเพื่อหยุดและแปล' : 'แตะเพื่อพูด'}
            >
              {isListening ? (
                <MicOff className="w-6 h-6 sm:w-7 sm:h-7" />
              ) : (
                <Mic className="w-6 h-6 sm:w-7 sm:h-7" />
              )}
            </button>
          </div>

          {/* Right Language Pill Button (Spanish / Chinese style) */}
          <button
            type="button"
            onClick={() => {
              if (isListening && activeSpeaker !== 'zh') {
                onStopListening();
              }
              setSelectedLanguage('zh');
              if (!isListening) {
                onStartListening('zh');
              }
            }}
            className={`flex-1 py-3 px-3 rounded-2xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 shadow-xs ${
              selectedLanguage === 'zh' || activeSpeaker === 'zh'
                ? 'bg-[#0066f5] text-white shadow-md'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            }`}
          >
            <span>中文 (Chinese)</span>
          </button>

        </div>
      </div>
    </div>
  );
}
