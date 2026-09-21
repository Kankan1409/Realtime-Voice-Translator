import { useState } from 'react';
import {
  Sparkles,
  X,
  Trash2,
  Volume2,
  Copy,
  Check,
  Clock,
  Bot,
  FileText,
  ChevronRight,
  MessageSquare,
  CheckCircle2,
  ListOrdered,
  Tag,
} from 'lucide-react';
import { TranslationRecord, Language, ConversationSummary } from '../types';

interface HistorySummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: TranslationRecord[];
  onClearHistory: () => void;
  onSpeak: (text: string, lang: Language) => void;
}

export function HistorySummaryModal({
  isOpen,
  onClose,
  records,
  onClearHistory,
  onSpeak,
}: HistorySummaryModalProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'chat'>('summary');
  const [summaryData, setSummaryData] = useState<ConversationSummary | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerateSummary = async () => {
    if (records.length === 0) return;
    setIsLoadingSummary(true);
    try {
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history: records }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setSummaryData(data.data);
        setActiveTab('summary');
      }
    } catch (err: any) {
      console.error('Failed to summarize:', err);
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const handleCopySummaryFormatted = () => {
    if (!summaryData) return;

    let text = `📌 สรุปบทสนทนา: ${summaryData.topicTitle}\n\n`;
    text += `📝 ภาพรวม: ${summaryData.overview}\n\n`;

    if (summaryData.topics && summaryData.topics.length > 0) {
      text += `📋 หัวข้อหลักที่พูดคุยกัน:\n`;
      summaryData.topics.forEach((top, idx) => {
        text += `${idx + 1}. ${top.title}\n`;
        top.bullets.forEach((b) => {
          text += `   • ${b}\n`;
        });
      });
      text += `\n`;
    }

    if (summaryData.keyDetails && summaryData.keyDetails.length > 0) {
      text += `🔍 สาระสำคัญ / ตัวเลข:\n`;
      summaryData.keyDetails.forEach((k) => {
        text += `   - ${k}\n`;
      });
      text += `\n`;
    }

    if (summaryData.actionItems && summaryData.actionItems.length > 0) {
      text += `🤝 ข้อตกลง / สิ่งที่ต้องทำต่อ:\n`;
      summaryData.actionItems.forEach((a) => {
        text += `   ✓ ${a}\n`;
      });
    }

    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  const handleCopyItem = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-slate-950 font-bold shadow-md">
              <Bot className="w-4 h-4 text-slate-950" />
            </div>
            <div>
              <h2 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                <span>ประวัติและการสรุปด้วย AI</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 font-semibold border border-amber-500/20">
                  {records.length} ข้อความ
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                สรุปสาระสำคัญเป็นหัวข้อๆ เหมือน ChatGPT หรือดูบทสนทนาย้อนหลัง
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {records.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('ต้องการล้างประวัติการสนทนาทั้งหมดใช่หรือไม่?')) {
                    onClearHistory();
                    setSummaryData(null);
                  }
                }}
                className="text-xs text-rose-400 hover:text-rose-300 px-2 py-1 flex items-center gap-1 rounded-lg hover:bg-rose-950/30 transition"
                title="ลบประวัติทั้งหมด"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">ล้าง</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation (สลับดู สรุปเป็นหัวข้อ VS ประวัติแชท) */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-900 bg-slate-900/30">
          <div className="flex items-center gap-1 p-1 bg-slate-900/80 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('summary')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'summary'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>สรุปเป็นหัวข้อ (AI Summary)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'chat'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>ประวัติข้อความ ({records.length})</span>
            </button>
          </div>

          {activeTab === 'summary' && summaryData && (
            <button
              type="button"
              onClick={handleCopySummaryFormatted}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-medium transition"
            >
              {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSummary ? 'คัดลอกแล้ว' : 'คัดลอกข้อสรุป'}</span>
            </button>
          )}
        </div>

        {/* Tab Content: Summary vs Chat History */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {activeTab === 'summary' ? (
            /* AI Summary View (ChatGPT Style) */
            <div className="space-y-4">
              {/* Trigger Button if not generated or to regenerate */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 shadow-md">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>สรุปบทสนทนาเป็นหัวข้อๆ (สไตล์ ChatGPT)</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      วิเคราะห์ข้อความทั้งหมด แยกประเด็น ตัวเลข ข้อตกลง และสิ่งที่ต้องทำต่อ
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateSummary}
                    disabled={records.length === 0 || isLoadingSummary}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition shrink-0"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isLoadingSummary ? 'กำลังวิเคราะห์...' : summaryData ? '🔄 สรุปใหม่อีกครั้ง' : '✨ สรุปทันที'}</span>
                  </button>
                </div>
              </div>

              {isLoadingSummary && (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
                  <p className="text-xs sm:text-sm text-amber-300 font-medium">
                    AI กำลังอ่านและจัดแบ่งหัวข้อการสนทนา...
                  </p>
                </div>
              )}

              {!isLoadingSummary && !summaryData && (
                <div className="py-12 text-center text-slate-500 text-xs sm:text-sm space-y-2">
                  <div className="text-2xl">🤖</div>
                  <div>แตะปุ่ม "✨ สรุปทันที" ด้านบน เพื่อให้ AI สรุปบทสนทนาที่เพิ่งคุยไปเป็นหัวข้อๆ ได้เลยครับ</div>
                </div>
              )}

              {/* Structured ChatGPT-style Summary Output */}
              {!isLoadingSummary && summaryData && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Topic Title Card */}
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                    <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold uppercase tracking-wider mb-1">
                      <Tag className="w-3.5 h-3.5" />
                      <span>หัวข้อการสนทนาหลัก</span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-extrabold text-white">
                      {summaryData.topicTitle}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                      {summaryData.overview}
                    </p>
                  </div>

                  {/* Topics Breakdown (หัวข้อย่อยๆ เหมือน ChatGPT) */}
                  {summaryData.topics && summaryData.topics.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
                        <ListOrdered className="w-3.5 h-3.5 text-amber-400" />
                        <span>สาระสำคัญแยกตามหัวข้อ (Topics)</span>
                      </h4>

                      <div className="grid gap-3">
                        {summaryData.topics.map((topic, tIdx) => (
                          <div
                            key={tIdx}
                            className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm"
                          >
                            <div className="font-bold text-amber-300 text-sm mb-2 flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-xs flex items-center justify-center shrink-0">
                                {tIdx + 1}
                              </span>
                              <span>{topic.title}</span>
                            </div>

                            <ul className="space-y-1.5 pl-7">
                              {topic.bullets.map((b, bIdx) => (
                                <li
                                  key={bIdx}
                                  className="text-xs sm:text-sm text-slate-200 list-disc leading-relaxed marker:text-amber-400"
                                >
                                  {b}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Key Details & Figures */}
                  {summaryData.keyDetails && summaryData.keyDetails.length > 0 && (
                    <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800">
                      <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-2">
                        <span>🔍 รายละเอียดสำคัญ / ตัวเลข / ราคา</span>
                      </h4>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {summaryData.keyDetails.map((k, kIdx) => (
                          <div
                            key={kIdx}
                            className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs text-slate-200 flex items-center gap-2"
                          >
                            <span className="text-amber-400 font-bold">•</span>
                            <span>{k}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Agreements / Action Items */}
                  {summaryData.actionItems && summaryData.actionItems.length > 0 && (
                    <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30">
                      <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 mb-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>ข้อตกลงร่วมกัน หรือสิ่งที่ต้องทำต่อ</span>
                      </h4>
                      <ul className="space-y-1.5 pl-2">
                        {summaryData.actionItems.map((act, aIdx) => (
                          <li
                            key={aIdx}
                            className="text-xs sm:text-sm text-emerald-200 flex items-start gap-2 leading-relaxed"
                          >
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{act}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Individual Chat Stream View */
            <div className="space-y-2.5">
              {records.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-sm">
                  ยังไม่มีประวัติการสนทนา แตะไมค์ที่หน้าหลักเพื่อเริ่มพูดคุย
                </div>
              ) : (
                records.slice().reverse().map((rec) => {
                  const isThai = rec.speaker === 'th';
                  const timeFormatted = new Date(rec.timestamp).toLocaleTimeString('th-TH', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={rec.id}
                      className={`p-3.5 rounded-2xl border transition ${
                        isThai
                          ? 'bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40'
                          : 'bg-rose-500/5 border-rose-500/20 hover:border-rose-500/40'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span
                          className={`font-semibold flex items-center gap-1 ${
                            isThai ? 'text-amber-400' : 'text-rose-400'
                          }`}
                        >
                          <span>{isThai ? '🇹🇭 คนไทยพูด' : '🇨🇳 中国人说'}</span>
                          <ChevronRight className="w-3 h-3 opacity-40" />
                          <span className="opacity-80 font-normal">
                            {isThai ? 'แปลเป็นจีน' : 'แปลเป็นไทย'}
                          </span>
                        </span>

                        <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                          <Clock className="w-3 h-3" />
                          <span>{timeFormatted}</span>
                          <button
                            type="button"
                            onClick={() => onSpeak(rec.translatedText, isThai ? 'zh' : 'th')}
                            className="p-1 hover:text-white text-slate-400 transition"
                            title="ฟังเสียงอ่าน"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopyItem(rec.translatedText, rec.id)}
                            className="p-1 hover:text-white text-slate-400 transition"
                            title="คัดลอกคำแปล"
                          >
                            {copiedId === rec.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Translated Text */}
                      <div className="text-base sm:text-lg font-bold text-white leading-snug">
                        {rec.translatedText}
                      </div>

                      {/* Pinyin if available */}
                      {rec.pinyin && (
                        <div className="text-xs text-amber-300 font-mono mt-0.5">
                          {rec.pinyin}
                        </div>
                      )}

                      {/* Original Speech */}
                      <div className="text-xs text-slate-400 mt-1 italic">
                        "{rec.originalText}"
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-900/60 border-t border-slate-900 flex justify-between items-center px-5">
          <div className="text-[11px] text-slate-400">
            {records.length} ประโยคที่บันทึกไว้ในเครื่อง
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  );
}
