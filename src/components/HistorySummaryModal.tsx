import { useState } from 'react';
import {
  Sparkles,
  X,
  Trash2,
  Volume2,
  Copy,
  Check,
  Clock,
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
      text += `📋 สาระสำคัญแยกตามหัวข้อ:\n`;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-slate-200/90 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-800">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-xs">
              <Sparkles className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-slate-900 text-base sm:text-lg">
                  ประวัติและการสรุปด้วย AI
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200">
                  {records.length} ข้อความ
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                สรุปสาระสำคัญเป็นหัวข้อย่อย หรือดูบทสนทนาย้อนหลัง
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
                className="text-xs text-rose-600 hover:text-rose-700 px-2.5 py-1.5 flex items-center gap-1 rounded-xl hover:bg-rose-50 transition"
                title="ลบประวัติทั้งหมด"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">ล้าง</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation (สลับดู สรุปเป็นหัวข้อ VS ประวัติข้อความ) */}
        <div className="flex items-center justify-between px-5 py-2.5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 rounded-2xl">
            <button
              type="button"
              onClick={() => setActiveTab('summary')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs ${
                activeTab === 'summary'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>สรุปเป็นหัวข้อ (AI Summary)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'chat'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition"
            >
              {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSummary ? 'คัดลอกแล้ว' : 'คัดลอกข้อสรุป'}</span>
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/40">
          {activeTab === 'summary' ? (
            /* AI Summary View */
            <div className="space-y-4">
              {/* Trigger Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>สรุปบทสนทนาเป็นหัวข้อย่อย</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    วิเคราะห์ข้อความทั้งหมด แยกประเด็น ตัวเลข ข้อตกลง และสิ่งที่ต้องทำต่อ
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateSummary}
                  disabled={records.length === 0 || isLoadingSummary}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#0066f5] hover:bg-blue-600 disabled:opacity-40 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isLoadingSummary ? 'กำลังวิเคราะห์...' : summaryData ? '🔄 สรุปใหม่อีกครั้ง' : '✨ สรุปทันที'}</span>
                </button>
              </div>

              {isLoadingSummary && (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                  <p className="text-xs sm:text-sm text-blue-700 font-medium">
                    AI กำลังอ่านและจัดแบ่งหัวข้อการสนทนา...
                  </p>
                </div>
              )}

              {!isLoadingSummary && !summaryData && (
                <div className="py-12 text-center text-slate-400 text-xs sm:text-sm space-y-2">
                  <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mx-auto mb-2">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div className="text-slate-600 font-medium">
                    แตะปุ่ม "✨ สรุปทันที" ด้านบน เพื่อให้ AI สรุปบทสนทนาที่เพิ่งคุยไปเป็นหัวข้อๆ ได้เลยครับ
                  </div>
                </div>
              )}

              {/* Structured Summary Output matching App Template */}
              {!isLoadingSummary && summaryData && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Topic Title Card */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/70 border border-blue-200/80">
                    <div className="flex items-center gap-1.5 text-xs text-blue-700 font-bold uppercase tracking-wider mb-1">
                      <Tag className="w-3.5 h-3.5" />
                      <span>หัวข้อการสนทนาหลัก</span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                      {summaryData.topicTitle}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                      {summaryData.overview}
                    </p>
                  </div>

                  {/* Topics Breakdown */}
                  {summaryData.topics && summaryData.topics.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-wider">
                        <ListOrdered className="w-3.5 h-3.5 text-blue-600" />
                        <span>สาระสำคัญแยกตามหัวข้อ</span>
                      </h4>

                      <div className="grid gap-3">
                        {summaryData.topics.map((topic, tIdx) => (
                          <div
                            key={tIdx}
                            className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs"
                          >
                            <div className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center shrink-0 font-bold">
                                {tIdx + 1}
                              </span>
                              <span>{topic.title}</span>
                            </div>

                            <ul className="space-y-1.5 pl-7">
                              {topic.bullets.map((b, bIdx) => (
                                <li
                                  key={bIdx}
                                  className="text-xs sm:text-sm text-slate-600 list-disc leading-relaxed marker:text-blue-500"
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
                    <div className="p-4 rounded-2xl bg-white border border-slate-200">
                      <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                        <span>🔍 รายละเอียดสำคัญ / ตัวเลข / ราคา</span>
                      </h4>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {summaryData.keyDetails.map((k, kIdx) => (
                          <div
                            key={kIdx}
                            className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 flex items-center gap-2"
                          >
                            <span className="text-blue-600 font-bold">•</span>
                            <span>{k}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Items */}
                  {summaryData.actionItems && summaryData.actionItems.length > 0 && (
                    <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                      <h4 className="text-xs font-bold text-emerald-800 flex items-center gap-1.5 mb-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>ข้อตกลงร่วมกัน หรือสิ่งที่ต้องทำต่อ</span>
                      </h4>
                      <ul className="space-y-1.5 pl-2">
                        {summaryData.actionItems.map((act, aIdx) => (
                          <li
                            key={aIdx}
                            className="text-xs sm:text-sm text-emerald-900 flex items-start gap-2 leading-relaxed"
                          >
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
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
            /* Chat History View (Matching Template Theme) */
            <div className="space-y-3">
              {records.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">
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
                      className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-slate-500 flex items-center gap-1">
                          <span>{isThai ? '🇹🇭 ผู้พูดภาษาไทย' : '🇨🇳 中文原声'}</span>
                          <ChevronRight className="w-3 h-3 text-slate-300" />
                          <span className="text-blue-600 font-medium">
                            {isThai ? 'แปลเป็นจีน' : 'แปลเป็นไทย'}
                          </span>
                        </span>

                        <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                          <Clock className="w-3 h-3" />
                          <span>{timeFormatted}</span>
                          <button
                            type="button"
                            onClick={() => onSpeak(rec.translatedText, isThai ? 'zh' : 'th')}
                            className="p-1 hover:text-blue-600 text-slate-400 transition"
                            title="ฟังเสียงอ่าน"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopyItem(rec.translatedText, rec.id)}
                            className="p-1 hover:text-blue-600 text-slate-400 transition"
                            title="คัดลอกคำแปล"
                          >
                            {copiedId === rec.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Original Speech */}
                      <div className="text-xs text-slate-400 italic">
                        "{rec.originalText}"
                      </div>

                      {/* Translated Text in vibrant blue card pill */}
                      <div className="mt-1.5 p-3 rounded-xl bg-[#0066f5] text-white">
                        <div className="text-sm font-semibold leading-snug">
                          {rec.translatedText}
                        </div>
                        {rec.pinyin && (
                          <div className="text-xs text-blue-100 font-mono mt-1 pt-1 border-t border-white/20">
                            {rec.pinyin}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-slate-100 flex justify-between items-center px-5">
          <div className="text-xs text-slate-400 font-medium">
            {records.length} ประโยคที่บันทึกไว้ในเครื่อง
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  );
}
