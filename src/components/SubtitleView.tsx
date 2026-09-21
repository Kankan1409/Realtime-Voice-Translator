import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, Sparkles, Copy, Check, ArrowDown } from 'lucide-react';
import { TranslationRecord, Language } from '../types';
import { AudioWaveform } from './AudioWaveform';

interface SubtitleViewProps {
  records: TranslationRecord[];
  activeSpeaker: Language | null;
  interimTranscript: string;
  isListening: boolean;
  onStartListening: (lang: Language) => void;
  onStopListening: () => void;
  onSpeak: (text: string, lang: Language) => void;
  onOpenSummary?: () => void;
  showPinyin: boolean;
  fontSize: 'normal' | 'large' | 'huge';
}

export function SubtitleView({
  records,
  activeSpeaker,
  interimTranscript,
  isListening,
  onStartListening,
  onStopListening,
  onSpeak,
  onOpenSummary,
  showPinyin,
  fontSize,
}: SubtitleViewProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto scroll to latest subtitle when records update or interim changes
  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [records, interimTranscript, isListening]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Font size classes calculation
  const captionTextClass =
    fontSize === 'huge'
      ? 'text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight'
      : fontSize === 'large'
      ? 'text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-snug'
      : 'text-xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-snug';

  const pinyinClass =
    fontSize === 'huge'
      ? 'text-lg sm:text-2xl md:text-3xl font-mono'
      : fontSize === 'large'
      ? 'text-base sm:text-xl md:text-2xl font-mono'
      : 'text-sm sm:text-lg md:text-xl font-mono';

  const latestRecord = records[records.length - 1];
  const previousRecords = records.slice(0, Math.max(0, records.length - 1));

  return (
    <div className="flex-1 flex flex-col h-full bg-gradient-to-b from-slate-950 via-slate-900/90 to-slate-950 text-white relative overflow-hidden select-none">
      {/* Scrollable Subtitle Stream Canvas */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6 scroll-smooth flex flex-col justify-start"
      >
        {/* Subtle Top Indicator */}
        <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-900">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium tracking-wider text-slate-400">
              หน้าจอแคปชั่นสด (LIVE CAPTIONS)
            </span>
          </div>
          <div className="flex items-center gap-2">
            {records.length > 0 && onOpenSummary && (
              <button
                type="button"
                onClick={onOpenSummary}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[11px] font-semibold transition"
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>สรุปการคุย ({records.length})</span>
              </button>
            )}
            {!onOpenSummary && <div>{records.length} บทสนทนา</div>}
          </div>
        </div>

        {/* Previous Transcript (Faded roll-up style like movie subtitles/teleprompter) */}
        {previousRecords.length > 0 && (
          <div className="space-y-4 opacity-50 hover:opacity-90 transition-opacity duration-300">
            {previousRecords.slice(-4).map((rec) => {
              const isThai = rec.speaker === 'th';
              return (
                <div
                  key={rec.id}
                  className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-900/80 max-w-3xl mx-auto w-full"
                >
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span className="font-semibold">
                      {isThai ? '🇹🇭 ไทย → จีน' : '🇨🇳 中文 → 泰语'}
                    </span>
                    <button
                      type="button"
                      onClick={() => onSpeak(rec.translatedText, isThai ? 'zh' : 'th')}
                      className="p-1 hover:text-white text-slate-500 transition"
                      title="ฟังเสียงอ่าน"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="text-lg sm:text-xl font-medium text-slate-200">
                    {rec.translatedText}
                  </div>
                  <div className="text-xs text-slate-500 italic mt-0.5">
                    "{rec.originalText}"
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Current Active or Latest Prominent Caption */}
        <div className="my-auto py-4 flex flex-col items-center justify-center text-center w-full max-w-4xl mx-auto min-h-[220px]">
          {isListening ? (
            /* Live Audio Recognition in Progress */
            <div className="space-y-5 animate-fadeIn w-full px-4 py-8 rounded-3xl bg-slate-900/80 border border-slate-800/90 shadow-2xl backdrop-blur-sm">
              <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-900/90 border border-slate-700 text-xs sm:text-sm font-medium">
                <AudioWaveform
                  isActive={true}
                  color={activeSpeaker === 'th' ? 'bg-amber-400' : 'bg-rose-500'}
                  barsCount={18}
                />
                <span className={activeSpeaker === 'th' ? 'text-amber-300' : 'text-rose-300'}>
                  {activeSpeaker === 'th'
                    ? '🇹🇭 กำลังจับเสียงพูดภาษาไทย...'
                    : '🇨🇳 正在实时识别中文语音...'}
                </span>
              </div>

              {/* Streaming Interim Words */}
              <div className="min-h-[90px] flex items-center justify-center">
                <div className={`${captionTextClass} text-amber-200/90 font-light italic break-words px-2`}>
                  {interimTranscript ? `"${interimTranscript}"` : 'กำลังพูด...'}
                </div>
              </div>

              <div className="text-xs sm:text-sm text-slate-400 flex items-center justify-center gap-1.5 animate-pulse">
                <span>แตะปุ่มด้านล่างอีกครั้งเพื่อแปลแคปชั่นทันที</span>
                <ArrowDown className="w-3.5 h-3.5" />
              </div>
            </div>
          ) : latestRecord ? (
            /* Giant Translated Caption Banner */
            <div className="space-y-4 sm:space-y-6 w-full animate-fadeIn px-4 py-8 rounded-3xl bg-slate-900/80 border border-slate-800/90 shadow-2xl backdrop-blur-sm">
              {/* Speaker Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300 shadow-sm">
                {latestRecord.speaker === 'th' ? (
                  <>
                    <span className="font-semibold text-amber-300">🇹🇭 ไทยพูด</span>
                    <span className="text-slate-500">→</span>
                    <span className="font-bold text-rose-400">แปลเป็นภาษาจีน (中文)</span>
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-rose-300">🇨🇳 中文说</span>
                    <span className="text-slate-500">→</span>
                    <span className="font-bold text-amber-400">แปลเป็นภาษาไทย (Thai)</span>
                  </>
                )}
              </div>

              {/* Big Bold Headline Subtitle */}
              <h1
                className={`${captionTextClass} text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)] break-words`}
              >
                {latestRecord.translatedText}
              </h1>

              {/* Chinese Pinyin (if Chinese is involved and toggled on) */}
              {showPinyin && latestRecord.pinyin && (
                <div
                  className={`${pinyinClass} text-amber-400 tracking-wide bg-amber-950/30 px-4 py-1.5 rounded-xl border border-amber-800/30 inline-block`}
                >
                  {latestRecord.pinyin}
                </div>
              )}

              {/* Original Spoken Text */}
              <div className="text-sm sm:text-base text-slate-400 pt-1 flex items-center justify-center gap-2 max-w-2xl mx-auto">
                <span className="text-slate-600 shrink-0">ต้นทาง:</span>
                <span className="italic break-words text-slate-300">
                  "{latestRecord.originalText}"
                </span>
              </div>

              {/* Action Buttons: Play TTS & Copy */}
              <div className="flex items-center justify-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    onSpeak(
                      latestRecord.translatedText,
                      latestRecord.speaker === 'th' ? 'zh' : 'th'
                    )
                  }
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800 hover:bg-slate-700 text-white text-xs sm:text-sm font-medium transition shadow-md hover:scale-105 active:scale-95"
                >
                  <Volume2 className="w-4 h-4 text-amber-400" />
                  <span>ฟังเสียงอ่าน (朗读)</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(latestRecord.translatedText, latestRecord.id)
                  }
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs sm:text-sm font-medium transition shadow-md hover:scale-105 active:scale-95"
                >
                  {copiedId === latestRecord.id ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-300">คัดลอกแล้ว</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>คัดลอกแคปชั่น</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="space-y-4 text-slate-500 max-w-md px-4">
              <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 mx-auto flex items-center justify-center shadow-lg shadow-rose-950/20">
                <Sparkles className="w-8 h-8 text-rose-400" />
              </div>
              <h2 className="text-2xl font-bold text-slate-100">พร้อมแปลสดแบบแคปชั่น</h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                แตะปุ่มไมค์ด้านล่างเพื่อพูดภาษาไทยหรือจีน ตัวอักษรแคปชั่นขนาดใหญ่จะแสดงขึ้นมาบนจอให้อีกฝ่ายอ่านได้ทันทีแบบเรียลไทม์
              </p>
            </div>
          )}
        </div>

        <div ref={scrollEndRef} className="h-2" />
      </div>

      {/* Ergonomic Dual Bottom Mic Bar */}
      <div className="p-3 sm:p-4 bg-slate-950/95 backdrop-blur border-t border-slate-900">
        <div className="max-w-3xl mx-auto grid grid-cols-2 gap-2.5 sm:gap-4">
          {/* Thai speaker mic button */}
          <button
            type="button"
            onClick={() => {
              if (activeSpeaker === 'th' && isListening) {
                onStopListening();
              } else {
                onStartListening('th');
              }
            }}
            className={`flex items-center justify-center gap-2.5 sm:gap-3 py-3.5 sm:py-4 px-3 sm:px-5 rounded-2xl font-semibold text-sm sm:text-base transition-all shadow-lg ${
              activeSpeaker === 'th' && isListening
                ? 'bg-amber-500 text-slate-950 shadow-amber-500/50 ring-4 ring-amber-400/40 animate-pulse scale-[1.02]'
                : 'bg-gradient-to-r from-amber-600/25 to-amber-700/20 hover:from-amber-600/35 hover:to-amber-700/30 text-amber-200 border border-amber-500/40 active:scale-[0.98]'
            }`}
          >
            {activeSpeaker === 'th' && isListening ? (
              <>
                <MicOff className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 text-slate-950 animate-bounce" />
                <div className="text-left">
                  <div className="font-extrabold text-xs sm:text-sm text-slate-950">
                    กำลังฟัง... (แตะเมื่อพูดจบ)
                  </div>
                  <div className="text-[10px] sm:text-xs text-slate-900">กำลังถอดเสียงไทยสด</div>
                </div>
              </>
            ) : (
              <>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                  <Mic className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-xs sm:text-sm text-amber-100">
                    🇹🇭 คนไทยพูด (Thai)
                  </div>
                  <div className="text-[10px] sm:text-xs text-amber-300/80">
                    แปลเป็นภาษาจีน (中文)
                  </div>
                </div>
              </>
            )}
          </button>

          {/* Chinese speaker mic button */}
          <button
            type="button"
            onClick={() => {
              if (activeSpeaker === 'zh' && isListening) {
                onStopListening();
              } else {
                onStartListening('zh');
              }
            }}
            className={`flex items-center justify-center gap-2.5 sm:gap-3 py-3.5 sm:py-4 px-3 sm:px-5 rounded-2xl font-semibold text-sm sm:text-base transition-all shadow-lg ${
              activeSpeaker === 'zh' && isListening
                ? 'bg-rose-500 text-white shadow-rose-500/50 ring-4 ring-rose-400/40 animate-pulse scale-[1.02]'
                : 'bg-gradient-to-r from-rose-600/25 to-rose-700/20 hover:from-rose-600/35 hover:to-rose-700/30 text-rose-200 border border-rose-500/40 active:scale-[0.98]'
            }`}
          >
            {activeSpeaker === 'zh' && isListening ? (
              <>
                <MicOff className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 text-white animate-bounce" />
                <div className="text-left">
                  <div className="font-extrabold text-xs sm:text-sm text-white">
                    正在听... (说完请点击)
                  </div>
                  <div className="text-[10px] sm:text-xs text-rose-100">实时语音识别中</div>
                </div>
              </>
            ) : (
              <>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-rose-500/20 flex items-center justify-center shrink-0">
                  <Mic className="w-5 h-5 sm:w-6 sm:h-6 text-rose-400" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-xs sm:text-sm text-rose-100">
                    🇨🇳 中国人说 (Chinese)
                  </div>
                  <div className="text-[10px] sm:text-xs text-rose-300/80">
                    翻译为泰语字幕
                  </div>
                </div>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
