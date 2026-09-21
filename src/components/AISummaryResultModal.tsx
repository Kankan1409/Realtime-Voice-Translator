import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Copy,
  Check,
  PlusCircle,
  Calendar,
  MessageSquare,
  ListOrdered,
  FileCheck,
  Hash,
  ArrowRight,
  FileText,
} from 'lucide-react';
import { ConversationSummary, TranslationRecord } from '../types';
import { RobotIcon } from './RobotIcon';

interface AISummaryResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  topicTitle: string;
  summaryData?: ConversationSummary;
  overview?: string;
  records: TranslationRecord[];
  onStartNewTopic: () => void;
  isLoading?: boolean;
  onOpenOnePageReport?: () => void;
}

export function AISummaryResultModal({
  isOpen,
  onClose,
  topicTitle,
  summaryData,
  overview,
  records,
  onStartNewTopic,
  isLoading = false,
  onOpenOnePageReport,
}: AISummaryResultModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const thCount = records.filter((r) => r.speaker === 'th').length;
  const zhCount = records.filter((r) => r.speaker === 'zh').length;

  const handleCopyAll = () => {
    let text = `🤖 บทสรุปการสนทนา (ไทย ⇄ จีน)\n`;
    text += `📌 เรื่อง: ${summaryData?.topicTitle || topicTitle || 'การสนทนา'}\n`;
    if (overview || summaryData?.overview) {
      text += `\n📝 ภาพรวม:\n${summaryData?.overview || overview}\n`;
    }

    if (summaryData?.topics && summaryData.topics.length > 0) {
      text += `\n📋 ประเด็นสำคัญที่คุยกัน:\n`;
      summaryData.topics.forEach((t, i) => {
        text += `${i + 1}. ${t.title}\n`;
        t.bullets.forEach((b) => {
          text += `   • ${b}\n`;
        });
      });
    }

    if (summaryData?.keyDetails && summaryData.keyDetails.length > 0) {
      text += `\n🔢 ข้อมูลสำคัญ / ตัวเลข / เงื่อนไข:\n`;
      summaryData.keyDetails.forEach((k) => {
        text += `   • ${k}\n`;
      });
    }

    if (summaryData?.actionItems && summaryData.actionItems.length > 0) {
      text += `\n✅ ข้อตกลงและสิ่งที่ต้องทำต่อ:\n`;
      summaryData.actionItems.forEach((a) => {
        text += `   • ${a}\n`;
      });
    }

    text += `\n(บันทึกการแปลทั้งหมด ${records.length} ข้อความ: ไทย ${thCount} ครั้ง, จีน ${zhCount} ครั้ง)`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartFresh = () => {
    onStartNewTopic();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/65 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-slate-200/90 rounded-3xl w-full max-w-lg max-h-[88vh] flex flex-col shadow-2xl overflow-hidden text-slate-800 animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-indigo-100 bg-gradient-to-r from-blue-50/80 via-indigo-50/80 to-blue-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-slate-900 text-base">
                  AI สรุปบทสนทนา
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold border border-indigo-200">
                  Gemini Flash
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                สรุปเนื้อหาจากการพูดคุยอัตโนมัติ
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white/80 transition"
            title="ปิด"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-[#f8fafc]">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center animate-spin">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="font-bold text-slate-800 text-sm">
                AI กำลังประมวลผลสรุปเนื้อหาบทสนทนา...
              </div>
              <p className="text-xs text-slate-400 max-w-xs">
                กำลังรวบรวมประเด็นสำคัญ ตัวเลข และข้อตกลงทั้งภาษาไทยและจีน
              </p>
            </div>
          ) : (
            <>
              {/* Topic Title Card */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
                <div className="text-[11px] font-bold text-blue-600 flex items-center gap-1 mb-1">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>หัวข้อเรื่อง</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  {summaryData?.topicTitle || topicTitle || 'บทสนทนาทั่วไป (ไทย ⇄ จีน)'}
                </h3>
                <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2">
                  <span>คุยทั้งหมด {records.length} ข้อความ</span>
                  <span>·</span>
                  <span className="text-blue-600 font-medium">🇹🇭 ไทย {thCount} ครั้ง</span>
                  <span>·</span>
                  <span className="text-amber-600 font-medium">🇨🇳 จีน {zhCount} ครั้ง</span>
                </div>
              </div>

              {/* Overview */}
              {(summaryData?.overview || overview) && (
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
                  <div className="text-[11px] font-bold text-indigo-600 flex items-center gap-1 mb-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>ภาพรวมการสนทนา</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                    {summaryData?.overview || overview}
                  </p>
                </div>
              )}

              {/* Main Topics / Sub-points */}
              {summaryData?.topics && summaryData.topics.length > 0 && (
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
                  <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <ListOrdered className="w-3.5 h-3.5 text-blue-600" />
                    <span>ประเด็นสำคัญที่คุยกัน</span>
                  </div>
                  <div className="space-y-3">
                    {summaryData.topics.map((top, idx) => (
                      <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div className="font-bold text-xs text-slate-900 mb-1.5">
                          {top.title}
                        </div>
                        <ul className="space-y-1">
                          {top.bullets.map((b, bIdx) => (
                            <li key={bIdx} className="text-xs text-slate-600 flex items-start gap-1.5">
                              <span className="text-blue-500 font-bold shrink-0 leading-tight">•</span>
                              <span className="leading-relaxed">{b}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Details (Numbers, Prices, Conditions) */}
              {summaryData?.keyDetails && summaryData.keyDetails.length > 0 && (
                <div className="bg-white p-4 rounded-2xl border border-amber-200/70 shadow-2xs bg-amber-50/30">
                  <div className="text-[11px] font-bold text-amber-800 flex items-center gap-1 mb-2">
                    <Hash className="w-3.5 h-3.5 text-amber-600" />
                    <span>ตัวเลข / ราคา / เงื่อนไขสำคัญ</span>
                  </div>
                  <ul className="space-y-1">
                    {summaryData.keyDetails.map((k, idx) => (
                      <li key={idx} className="text-xs text-slate-700 font-medium flex items-start gap-1.5">
                        <span className="text-amber-500 font-bold shrink-0">•</span>
                        <span>{k}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Items */}
              {summaryData?.actionItems && summaryData.actionItems.length > 0 && (
                <div className="bg-white p-4 rounded-2xl border border-emerald-200/70 shadow-2xs bg-emerald-50/30">
                  <div className="text-[11px] font-bold text-emerald-800 flex items-center gap-1 mb-2">
                    <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>ข้อตกลงและสิ่งที่ต้องทำต่อ</span>
                  </div>
                  <ul className="space-y-1">
                    {summaryData.actionItems.map((a, idx) => (
                      <li key={idx} className="text-xs text-slate-700 font-medium flex items-start gap-1.5">
                        <span className="text-emerald-500 font-bold shrink-0">✓</span>
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyAll}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition active:scale-95 shadow-2xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'คัดลอกแล้ว!' : 'คัดลอก'}</span>
            </button>

            {onOpenOnePageReport && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenOnePageReport();
                }}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold transition active:scale-95 shadow-xs"
                title="เปิดรายงานแบบ One-Page และพิมพ์/บันทึกเป็น PDF"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>One-Page & PDF</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleStartFresh}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition active:scale-95 border border-blue-100"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>เริ่มคุยเรื่องใหม่</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#0066f5] hover:bg-blue-700 text-white text-xs font-bold transition active:scale-95 shadow-xs"
            >
              เรียบร้อย
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
