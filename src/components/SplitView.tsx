import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, Copy, Check, Send, Sparkles } from 'lucide-react';
import { TranslationRecord, Language } from '../types';
import { AudioWaveform } from './AudioWaveform';

interface SplitViewProps {
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

export function SplitView({
  records,
  activeSpeaker,
  interimTranscript,
  isListening,
  onStartListening,
  onStopListening,
  onSpeak,
  onTranslateText,
  showPinyin,
}: SplitViewProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [inputTh, setInputTh] = useState('');
  const [inputZh, setInputZh] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [records, interimTranscript]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-65px)] max-w-6xl mx-auto w-full overflow-hidden bg-slate-950 p-2 sm:p-4">
      {/* Top Controls Bar */}
      <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-800 shrink-0">
        {/* Thai Speaker Control */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-amber-900/40">
          <div className="flex items-center gap-2">
            <span className="text-xl">🇹🇭</span>
            <div>
              <div className="text-xs font-semibold text-amber-300 font-thai">คนไทยพูด (Thai)</div>
              <div className="text-[10px] text-slate-400">แปลออกเป็นภาษาจีน</div>
            </div>
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
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition shadow ${
              activeSpeaker === 'th' && isListening
                ? 'bg-amber-600 text-white shadow-amber-600/40 ring-2 ring-amber-400 animate-pulse'
                : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30'
            }`}
          >
            {activeSpeaker === 'th' && isListening ? (
              <>
                <MicOff className="w-3.5 h-3.5" />
                <span>กำลังฟัง...</span>
              </>
            ) : (
              <>
                <Mic className="w-3.5 h-3.5 text-amber-400" />
                <span>พูดภาษาไทย</span>
              </>
            )}
          </button>
        </div>

        {/* Chinese Speaker Control */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-rose-900/40">
          <div className="flex items-center gap-2">
            <span className="text-xl">🇨🇳</span>
            <div>
              <div className="text-xs font-semibold text-rose-300 font-chinese">中国人说 (Chinese)</div>
              <div className="text-[10px] text-slate-400">翻译为泰语文字</div>
            </div>
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
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition shadow ${
              activeSpeaker === 'zh' && isListening
                ? 'bg-rose-600 text-white shadow-rose-600/40 ring-2 ring-rose-400 animate-pulse'
                : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/30'
            }`}
          >
            {activeSpeaker === 'zh' && isListening ? (
              <>
                <MicOff className="w-3.5 h-3.5" />
                <span>正在录音...</span>
              </>
            ) : (
              <>
                <Mic className="w-3.5 h-3.5 text-rose-400" />
                <span>说中文</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Live Active Audio Waveform Banner */}
      {isListening && (
        <div className="my-2 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3 animate-fadeIn shrink-0">
          <div className="flex items-center gap-2">
            <AudioWaveform
              isActive={true}
              color={activeSpeaker === 'th' ? 'bg-amber-400' : 'bg-rose-400'}
            />
            <span className="text-xs text-slate-300 font-medium">
              {activeSpeaker === 'th' ? 'คนไทยกำลังพูด:' : '中国人正在说话:'}
            </span>
            <span className="text-xs text-white italic font-light truncate max-w-md">
              "{interimTranscript || (activeSpeaker === 'th' ? 'กำลังฟังเสียง...' : '正在聆听...')}"
            </span>
          </div>
          <button
            type="button"
            onClick={onStopListening}
            className="text-xs px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300"
          >
            หยุด (Stop)
          </button>
        </div>
      )}

      {/* Synchronized Conversation Feed */}
      <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1">
        {records.length === 0 && !isListening ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-3">
              <Sparkles className="w-8 h-8 text-amber-500/60" />
            </div>
            <h3 className="text-base font-semibold text-slate-300">ยังไม่มีบทสนทนา</h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              กดปุ่มไมโครโฟนด้านบนเพื่อเริ่มพูดภาษาไทย หรือภาษาจีน ระบบจะแปลผลแบบแคปชั่นสดทันที
            </p>
          </div>
        ) : (
          records.map((record) => {
            const isThaiSpeaker = record.speaker === 'th';
            return (
              <div
                key={record.id}
                className={`flex flex-col ${isThaiSpeaker ? 'items-start' : 'items-end'}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 shadow-md transition-all ${
                    isThaiSpeaker
                      ? 'bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 border border-amber-900/40 text-slate-100 rounded-tl-sm'
                      : 'bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-900 border border-rose-900/40 text-slate-100 rounded-tr-sm'
                  }`}
                >
                  {/* Speaker Badge */}
                  <div className="flex items-center justify-between gap-3 text-xs mb-1.5 pb-1 border-b border-slate-800/80">
                    <span className="flex items-center gap-1.5 font-medium">
                      <span>{isThaiSpeaker ? '🇹🇭 คนไทยพูด' : '🇨🇳 中国人说'}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(record.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          onSpeak(
                            record.translatedText,
                            isThaiSpeaker ? 'zh' : 'th'
                          )
                        }
                        className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
                        title="ฟังเสียงแปล (Play Audio)"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(record.translatedText, record.id)}
                        className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
                        title="คัดลอก (Copy)"
                      >
                        {copiedId === record.id ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Translated Main Result */}
                  <div className="text-xl sm:text-2xl font-semibold text-white tracking-wide leading-snug">
                    {record.translatedText}
                  </div>

                  {/* Pinyin (if translated to Chinese, or original was Chinese) */}
                  {showPinyin && record.pinyin && (
                    <div className="text-xs sm:text-sm text-amber-400/90 font-mono mt-1">
                      {record.pinyin}
                    </div>
                  )}

                  {/* Original Speech */}
                  <div className="text-xs text-slate-400 mt-2 pt-1.5 border-t border-slate-800/60 flex items-baseline gap-1.5">
                    <span className="text-slate-500">ต้นฉบับ:</span>
                    <span className="italic">{record.originalText}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Dual Text Input Bar at Bottom */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-800 shrink-0">
        {/* Thai manual input */}
        <div className="flex gap-1.5">
          <input
            type="text"
            value={inputTh}
            onChange={(e) => setInputTh(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && inputTh.trim()) {
                onTranslateText(inputTh, 'th');
                setInputTh('');
              }
            }}
            placeholder="พิมพ์ภาษาไทยเพื่อแปลเป็นจีน..."
            className="flex-1 bg-slate-900 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500 font-thai"
          />
          <button
            type="button"
            onClick={() => {
              if (inputTh.trim()) {
                onTranslateText(inputTh, 'th');
                setInputTh('');
              }
            }}
            className="px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-medium flex items-center gap-1 transition"
          >
            <Send className="w-3 h-3" />
            <span>ส่ง</span>
          </button>
        </div>

        {/* Chinese manual input */}
        <div className="flex gap-1.5">
          <input
            type="text"
            value={inputZh}
            onChange={(e) => setInputZh(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && inputZh.trim()) {
                onTranslateText(inputZh, 'zh');
                setInputZh('');
              }
            }}
            placeholder="输入中文以翻译为泰语..."
            className="flex-1 bg-slate-900 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-rose-500 font-chinese"
          />
          <button
            type="button"
            onClick={() => {
              if (inputZh.trim()) {
                onTranslateText(inputZh, 'zh');
                setInputZh('');
              }
            }}
            className="px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-medium flex items-center gap-1 transition"
          >
            <Send className="w-3 h-3" />
            <span>发送</span>
          </button>
        </div>
      </div>
    </div>
  );
}
