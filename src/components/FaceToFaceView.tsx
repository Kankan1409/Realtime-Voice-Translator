import { useState } from 'react';
import { Mic, MicOff, Volume2, Copy, Check, ArrowDownUp, Sparkles, Send } from 'lucide-react';
import { TranslationRecord, Language } from '../types';
import { AudioWaveform } from './AudioWaveform';

interface FaceToFaceViewProps {
  records: TranslationRecord[];
  activeSpeaker: Language | null;
  interimTranscript: string;
  isListening: boolean;
  onStartListening: (lang: Language) => void;
  onStopListening: () => void;
  onSpeak: (text: string, lang: Language) => void;
  onTranslateText: (text: string, sourceLang: Language) => void;
  showPinyin: boolean;
}

export function FaceToFaceView({
  records,
  activeSpeaker,
  interimTranscript,
  isListening,
  onStartListening,
  onStopListening,
  onSpeak,
  onTranslateText,
  showPinyin,
}: FaceToFaceViewProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [customZhText, setCustomZhText] = useState('');
  const [customThText, setCustomThText] = useState('');
  const [showInputZh, setShowInputZh] = useState(false);
  const [showInputTh, setShowInputTh] = useState(false);

  // Latest message for Chinese speaker (translated from Thai)
  const latestForChinese = records
    .slice()
    .reverse()
    .find((r) => r.speaker === 'th');

  // Latest message for Thai speaker (translated from Chinese)
  const latestForThai = records
    .slice()
    .reverse()
    .find((r) => r.speaker === 'zh');

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-65px)] max-w-5xl mx-auto w-full overflow-hidden bg-slate-950 p-2 sm:p-4 gap-2 sm:gap-3">
      {/* TOP SECTION: For the Chinese speaker (Rotated 180 degrees) */}
      <div className="flex-1 flex flex-col justify-between p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-rose-950/40 via-slate-900 to-slate-900 border border-rose-900/40 relative rotate-180 transition-all shadow-inner overflow-hidden">
        {/* Header tag */}
        <div className="flex items-center justify-between border-b border-rose-900/30 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">🇨🇳</span>
            <span className="text-xs font-semibold text-rose-300 uppercase tracking-wider font-chinese">
              中文使用者视角 (对面视角)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowInputZh(!showInputZh)}
              className="text-[11px] px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              {showInputZh ? '收起键盘' : '打字输入'}
            </button>
            <span className="text-[11px] text-slate-400">
              泰语翻译结果
            </span>
          </div>
        </div>

        {/* Translation display for Chinese speaker (what Thai person said, translated to Chinese) */}
        <div className="my-auto py-2 overflow-y-auto max-h-[160px] sm:max-h-[220px]">
          {activeSpeaker === 'th' && isListening ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-amber-400">
                <AudioWaveform isActive={true} color="bg-amber-400" />
                <span className="text-xs font-medium animate-pulse">对方正在说泰语...</span>
              </div>
              <p className="text-lg sm:text-2xl text-slate-300 font-light italic">
                "{interimTranscript || '聆听中...'}"
              </p>
            </div>
          ) : latestForChinese ? (
            <div className="space-y-1.5 animate-fadeIn">
              <div className="flex items-start justify-between gap-2">
                <div className="text-2xl sm:text-4xl font-bold text-white tracking-wide leading-relaxed font-chinese">
                  {latestForChinese.translatedText}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => onSpeak(latestForChinese.translatedText, 'zh')}
                    className="p-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 transition"
                    title="朗读中文 (Play Audio)"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(latestForChinese.translatedText, latestForChinese.id)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                    title="复制"
                  >
                    {copiedId === latestForChinese.id ? (
                      <Check className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Pinyin */}
              {showPinyin && latestForChinese.pinyin && (
                <div className="text-sm sm:text-base text-amber-400/90 font-mono tracking-wide">
                  {latestForChinese.pinyin}
                </div>
              )}

              {/* Original Thai text */}
              <div className="text-xs sm:text-sm text-slate-400 flex items-center gap-1.5 pt-1">
                <span className="text-slate-500">原文(泰):</span>
                <span>{latestForChinese.originalText}</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-slate-500 space-y-1">
              <p className="text-base sm:text-lg font-chinese">等待对方说话或点击下方按钮开始发言</p>
              <p className="text-xs text-slate-600">泰语将实时翻译成中文大字显示在此</p>
            </div>
          )}
        </div>

        {/* Manual text input for Chinese side */}
        {showInputZh && (
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={customZhText}
              onChange={(e) => setCustomZhText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && customZhText.trim()) {
                  onTranslateText(customZhText, 'zh');
                  setCustomZhText('');
                }
              }}
              placeholder="输入中文按回车翻译给对方..."
              className="flex-1 bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-rose-500"
            />
            <button
              type="button"
              onClick={() => {
                if (customZhText.trim()) {
                  onTranslateText(customZhText, 'zh');
                  setCustomZhText('');
                }
              }}
              className="px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-medium flex items-center gap-1"
            >
              <Send className="w-3.5 h-3.5" />
              <span>发送</span>
            </button>
          </div>
        )}

        {/* Chinese Speaker Speak Button */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
          <div className="text-[11px] text-slate-400">
            {activeSpeaker === 'zh' && isListening ? (
              <span className="text-rose-400 font-medium animate-pulse">● 正在录音翻译...</span>
            ) : (
              <span>点击麦克风说中文 (Speak Chinese)</span>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              if (activeSpeaker === 'zh' && isListening) {
                onStopListening();
              } else {
                onStartListening('zh');
              }
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm transition-all shadow-lg ${
              activeSpeaker === 'zh' && isListening
                ? 'bg-rose-600 text-white shadow-rose-600/40 ring-4 ring-rose-500/30 animate-pulse'
                : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40'
            }`}
          >
            {activeSpeaker === 'zh' && isListening ? (
              <>
                <MicOff className="w-4 h-4" />
                <span>停止录音</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 text-rose-400" />
                <span>开始说中文</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* DIVIDER: Elegant visual bridge */}
      <div className="flex items-center justify-center gap-3 py-0.5 text-xs text-slate-500 shrink-0">
        <div className="h-[1px] bg-slate-800 flex-1" />
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400 text-[11px]">
          <ArrowDownUp className="w-3 h-3 text-amber-400" />
          <span>โหมดแปลกลับหัว นั่งคุยตรงข้ามกัน (面对面同传)</span>
        </div>
        <div className="h-[1px] bg-slate-800 flex-1" />
      </div>

      {/* BOTTOM SECTION: For the Thai speaker (Normal orientation) */}
      <div className="flex-1 flex flex-col justify-between p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-slate-900 to-amber-950/30 border border-amber-900/40 relative transition-all shadow-inner overflow-hidden">
        {/* Header tag */}
        <div className="flex items-center justify-between border-b border-amber-900/30 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">🇹🇭</span>
            <span className="text-xs font-semibold text-amber-300 uppercase tracking-wider font-thai">
              ฝั่งคนไทย (มุมมองของคุณ)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowInputTh(!showInputTh)}
              className="text-[11px] px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              {showInputTh ? 'ซ่อนแป้นพิมพ์' : 'พิมพ์ข้อความ'}
            </button>
            <span className="text-[11px] text-slate-400">
              แปลจากภาษาจีน
            </span>
          </div>
        </div>

        {/* Translation display for Thai speaker (what Chinese person said, translated to Thai) */}
        <div className="my-auto py-2 overflow-y-auto max-h-[160px] sm:max-h-[220px]">
          {activeSpeaker === 'zh' && isListening ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-rose-400">
                <AudioWaveform isActive={true} color="bg-rose-400" />
                <span className="text-xs font-medium animate-pulse">คนจีนกำลังพูดภาษาจีน...</span>
              </div>
              <p className="text-lg sm:text-2xl text-slate-300 font-light italic">
                "{interimTranscript || 'กำลังฟังเสียง...'}"
              </p>
            </div>
          ) : latestForThai ? (
            <div className="space-y-1.5 animate-fadeIn">
              <div className="flex items-start justify-between gap-2">
                <div className="text-2xl sm:text-4xl font-bold text-white tracking-wide leading-relaxed font-thai">
                  {latestForThai.translatedText}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => onSpeak(latestForThai.translatedText, 'th')}
                    className="p-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 transition"
                    title="อ่านออกเสียงภาษาไทย (Play Audio)"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(latestForThai.translatedText, latestForThai.id)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                    title="คัดลอกข้อความ"
                  >
                    {copiedId === latestForThai.id ? (
                      <Check className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Chinese original & pinyin */}
              <div className="text-xs sm:text-sm text-slate-400 flex flex-wrap items-center gap-2 pt-1">
                <span className="text-slate-500">ต้นฉบับจีน:</span>
                <span className="text-slate-300 font-chinese">{latestForThai.originalText}</span>
                {latestForThai.pinyin && (
                  <span className="text-amber-400/80 font-mono">({latestForThai.pinyin})</span>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-slate-500 space-y-1">
              <p className="text-base sm:text-lg font-thai">รอคนจีนพูด หรือแตะปุ่มด้านล่างเพื่อพูดภาษาไทย</p>
              <p className="text-xs text-slate-600">ข้อความที่คนจีนพูดจะแปลเป็นไทยและปรากฏตัวใหญ่ที่นี่</p>
            </div>
          )}
        </div>

        {/* Manual text input for Thai side */}
        {showInputTh && (
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={customThText}
              onChange={(e) => setCustomThText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && customThText.trim()) {
                  onTranslateText(customThText, 'th');
                  setCustomThText('');
                }
              }}
              placeholder="พิมพ์ข้อความภาษาไทยแล้วกดส่ง..."
              className="flex-1 bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
            />
            <button
              type="button"
              onClick={() => {
                if (customThText.trim()) {
                  onTranslateText(customThText, 'th');
                  setCustomThText('');
                }
              }}
              className="px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-medium flex items-center gap-1"
            >
              <Send className="w-3.5 h-3.5" />
              <span>ส่ง</span>
            </button>
          </div>
        )}

        {/* Thai Speaker Speak Button */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
          <div className="text-[11px] text-slate-400">
            {activeSpeaker === 'th' && isListening ? (
              <span className="text-amber-400 font-medium animate-pulse">● กำลังฟังเสียงภาษาไทย...</span>
            ) : (
              <span>แตะไมค์แล้วพูดภาษาไทย (Speak Thai)</span>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              if (activeSpeaker === 'th' && isListening) {
                onStopListening();
              } else {
                onStartListening('th');
              }
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm transition-all shadow-lg ${
              activeSpeaker === 'th' && isListening
                ? 'bg-amber-600 text-white shadow-amber-600/40 ring-4 ring-amber-500/30 animate-pulse'
                : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40'
            }`}
          >
            {activeSpeaker === 'th' && isListening ? (
              <>
                <MicOff className="w-4 h-4" />
                <span>หยุดฟัง</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 text-amber-400" />
                <span>แตะพูดภาษาไทย</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
