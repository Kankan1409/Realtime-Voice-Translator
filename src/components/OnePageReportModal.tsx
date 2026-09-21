import React, { useState } from 'react';
import {
  X,
  Printer,
  Download,
  Copy,
  Check,
  Sparkles,
  Calendar,
  MessageSquare,
  FileText,
  ListOrdered,
  Hash,
  FileCheck,
  CheckCircle2,
  Share2,
} from 'lucide-react';
import { ConversationSummary, TranslationRecord } from '../types';
import { RobotIcon } from './RobotIcon';

interface OnePageReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  topicTitle: string;
  summaryData?: ConversationSummary;
  overview?: string;
  records: TranslationRecord[];
  createdAt?: number;
}

export function OnePageReportModal({
  isOpen,
  onClose,
  topicTitle,
  summaryData,
  overview,
  records,
  createdAt = Date.now(),
}: OnePageReportModalProps) {
  const [includeTranscript, setIncludeTranscript] = useState(true);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const thCount = records.filter((r) => r.speaker === 'th').length;
  const zhCount = records.filter((r) => r.speaker === 'zh').length;

  const formattedDate = new Date(createdAt).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const formattedTime = new Date(createdAt).toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Native browser print (triggers "Save as PDF" / "พิมพ์เอกสาร")
  const handlePrint = () => {
    try {
      window.print();
    } catch (e) {
      console.warn('Print trigger error', e);
    }
  };

  // Copy full summary to clipboard
  const handleCopySummary = () => {
    let text = `📄 สรุปบทสนทนา One-Page (ไทย ⇄ จีน)\n`;
    text += `เรื่อง: ${summaryData?.topicTitle || topicTitle || 'การสนทนา'}\n`;
    text += `วันที่: ${formattedDate} เวลา: ${formattedTime} น.\n`;
    text += `สถิติ: ข้อความรวม ${records.length} ครั้ง (ไทย ${thCount}, จีน ${zhCount})\n\n`;

    if (summaryData?.overview || overview) {
      text += `[ภาพรวม]\n${summaryData?.overview || overview}\n\n`;
    }

    if (summaryData?.topics && summaryData.topics.length > 0) {
      text += `[ประเด็นสำคัญ]\n`;
      summaryData.topics.forEach((t, i) => {
        text += `${i + 1}. ${t.title}\n`;
        t.bullets.forEach((b) => {
          text += `   - ${b}\n`;
        });
      });
      text += `\n`;
    }

    if (summaryData?.keyDetails && summaryData.keyDetails.length > 0) {
      text += `[ตัวเลข / ราคา / เงื่อนไข]\n`;
      summaryData.keyDetails.forEach((k) => {
        text += `   • ${k}\n`;
      });
      text += `\n`;
    }

    if (summaryData?.actionItems && summaryData.actionItems.length > 0) {
      text += `[ข้อตกลงและสิ่งที่ต้องทำต่อ]\n`;
      summaryData.actionItems.forEach((a) => {
        text += `   [ ] ${a}\n`;
      });
      text += `\n`;
    }

    text += `(จัดทำโดย VoiceTrans AI)`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download standalone self-contained HTML file (Openable in any browser / convertible to PDF)
  const handleDownloadHTML = () => {
    const title = summaryData?.topicTitle || topicTitle || 'VoiceTrans_Summary';
    const cleanFileName = `VoiceTrans_OnePage_${title.replace(/[^a-zA-Z0-9ก-๙_-]/g, '_')}_${Date.now()}.html`;

    const htmlContent = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - VoiceTrans One-Page Report</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;600;700&family=Prompt:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    @page { size: A4 portrait; margin: 12mm 15mm; }
    * { box-sizing: border-box; }
    body {
      font-family: 'Prompt', 'Noto Sans SC', system-ui, -apple-system, sans-serif;
      background: #f8fafc;
      color: #0f172a;
      margin: 0;
      padding: 24px;
      line-height: 1.5;
    }
    .container {
      max-width: 820px;
      margin: 0 auto;
      background: #ffffff;
      padding: 36px 40px;
      border-radius: 20px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.06);
      border: 1px solid #e2e8f0;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .brand-title {
      font-size: 22px;
      font-weight: 700;
      color: #1e293b;
      margin: 0;
    }
    .brand-sub {
      font-size: 13px;
      color: #64748b;
      margin-top: 4px;
    }
    .badge {
      display: inline-block;
      background: #eff6ff;
      color: #1d4ed8;
      font-size: 12px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 9999px;
      border: 1px solid #bfdbfe;
    }
    .meta-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      background: #f8fafc;
      padding: 12px 16px;
      border-radius: 12px;
      font-size: 13px;
      color: #475569;
      margin-bottom: 24px;
      border: 1px solid #e2e8f0;
    }
    .meta-item strong { color: #0f172a; }
    .section {
      margin-bottom: 20px;
      page-break-inside: avoid;
    }
    .section-title {
      font-size: 14px;
      font-weight: 700;
      color: #2563eb;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 14px 16px;
      font-size: 13.5px;
    }
    .topic-item {
      margin-bottom: 12px;
      padding-bottom: 10px;
      border-bottom: 1px dashed #cbd5e1;
    }
    .topic-item:last-child { margin-bottom: 0; padding-bottom: 0; border-bottom: none; }
    .topic-header { font-weight: 600; color: #0f172a; margin-bottom: 4px; }
    .bullet-list { margin: 0; padding-left: 20px; }
    .bullet-list li { margin-bottom: 3px; color: #334155; }
    .highlight-card {
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 12px;
      padding: 14px 16px;
    }
    .action-card {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 12px;
      padding: 14px 16px;
    }
    .transcript-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12.5px;
      margin-top: 8px;
    }
    .transcript-table th {
      background: #f1f5f9;
      padding: 8px 12px;
      text-align: left;
      font-weight: 600;
      color: #475569;
      border: 1px solid #cbd5e1;
    }
    .transcript-table td {
      padding: 8px 12px;
      border: 1px solid #e2e8f0;
      vertical-align: top;
    }
    .pinyin { color: #d97706; font-size: 11px; margin-top: 2px; }
    .footer {
      margin-top: 30px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11.5px;
      color: #94a3b8;
    }
    .signature-box {
      display: flex;
      gap: 32px;
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px dashed #cbd5e1;
    }
    .sig-line {
      flex: 1;
      text-align: center;
      font-size: 12px;
      color: #64748b;
    }
    .sig-line div { border-bottom: 1px solid #94a3b8; height: 36px; margin-bottom: 6px; }
    @media print {
      body { background: #ffffff; padding: 0; }
      .container { border: none; box-shadow: none; padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <h1 class="brand-title">VoiceTrans One-Page Executive Report</h1>
        <div class="brand-sub">เอกสารสรุปบทสนทนาแปลภาษา ไทย ⇄ จีน (Thai-Chinese AI Summary)</div>
      </div>
      <div>
        <span class="badge">Official Document</span>
      </div>
    </div>

    <div class="meta-bar">
      <div class="meta-item"><strong>หัวข้อ:</strong> ${title}</div>
      <div class="meta-item"><strong>วันที่:</strong> ${formattedDate}</div>
      <div class="meta-item"><strong>เวลา:</strong> ${formattedTime} น.</div>
      <div class="meta-item"><strong>บทสนทนา:</strong> รวม ${records.length} ข้อความ (🇹🇭 ไทย ${thCount} / 🇨🇳 จีน ${zhCount})</div>
    </div>

    ${
      summaryData?.overview || overview
        ? `
    <div class="section">
      <div class="section-title">📌 1. สรุปภาพรวมการสนทนา (Executive Overview)</div>
      <div class="card" style="font-weight: 500; color: #1e293b;">
        ${summaryData?.overview || overview}
      </div>
    </div>
    `
        : ''
    }

    ${
      summaryData?.topics && summaryData.topics.length > 0
        ? `
    <div class="section">
      <div class="section-title">📋 2. ประเด็นสำคัญที่พูดคุย (Key Discussion Topics)</div>
      <div class="card">
        ${summaryData.topics
          .map(
            (t) => `
          <div class="topic-item">
            <div class="topic-header">• ${t.title}</div>
            <ul class="bullet-list">
              ${t.bullets.map((b) => `<li>${b}</li>`).join('')}
            </ul>
          </div>
        `
          )
          .join('')}
      </div>
    </div>
    `
        : ''
    }

    ${
      summaryData?.keyDetails && summaryData.keyDetails.length > 0
        ? `
    <div class="section">
      <div class="section-title">🔢 3. ตัวเลข ราคา และเงื่อนไขการค้า (Key Numbers & Terms)</div>
      <div class="highlight-card">
        <ul class="bullet-list" style="color: #78350f; font-weight: 500;">
          ${summaryData.keyDetails.map((k) => `<li>${k}</li>`).join('')}
        </ul>
      </div>
    </div>
    `
        : ''
    }

    ${
      summaryData?.actionItems && summaryData.actionItems.length > 0
        ? `
    <div class="section">
      <div class="section-title">✅ 4. ข้อตกลงและสิ่งที่ต้องทำต่อ (Action Items & Agreements)</div>
      <div class="action-card">
        <ul class="bullet-list" style="color: #14532d; font-weight: 500;">
          ${summaryData.actionItems.map((a) => `<li>☑️ ${a}</li>`).join('')}
        </ul>
      </div>
    </div>
    `
        : ''
    }

    ${
      records.length > 0
        ? `
    <div class="section">
      <div class="section-title">💬 5. บันทึกคำพูดบทสนทนา (Dialogue Transcript)</div>
      <table class="transcript-table">
        <thead>
          <tr>
            <th style="width: 14%;">ผู้พูด</th>
            <th style="width: 43%;">ข้อความต้นฉบับ</th>
            <th style="width: 43%;">คำแปล</th>
          </tr>
        </thead>
        <tbody>
          ${records
            .map(
              (r) => `
            <tr>
              <td><strong>${r.speaker === 'th' ? '🇹🇭 ไทย' : '🇨🇳 จีน'}</strong></td>
              <td>${r.originalText}</td>
              <td>
                ${r.translatedText}
                ${r.pinyin ? `<div class="pinyin">${r.pinyin}</div>` : ''}
              </td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    </div>
    `
        : ''
    }

    <div class="signature-box">
      <div class="sig-line">
        <div></div>
        <span>ลงชื่อผู้สรุป / ผู้สนทนา</span>
      </div>
      <div class="sig-line">
        <div></div>
        <span>ลงชื่อคู่สนทนา (签字 / Signature)</span>
      </div>
    </div>

    <div class="footer">
      <div>จัดทำโดย VoiceTrans Real-Time AI Translation Engine</div>
      <div>พิมพ์เมื่อ: ${new Date().toLocaleString('th-TH')}</div>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = cleanFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-slate-200/90 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-800">
        
        {/* Top Action Bar (hidden when printing) */}
        <div className="no-print flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-200 bg-slate-50/90 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#0066f5] flex items-center justify-center text-white shadow-xs">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-slate-900 text-sm sm:text-base">
                  One-Page Summary & PDF Export
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold border border-blue-200">
                  A4 Ready
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                ดูตัวอย่าง สั่งพิมพ์ หรือบันทึกเป็น PDF หน้าเดียว
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Toggle Transcript */}
            <button
              type="button"
              onClick={() => setIncludeTranscript(!includeTranscript)}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                includeTranscript
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
              title="สลับแสดง/ซ่อนบันทึกคำพูดบทสนทนา"
            >
              <span>{includeTranscript ? '✓ แนบบทสนทนา' : '+ แนบบทสนทนา'}</span>
            </button>

            {/* Copy Button */}
            <button
              type="button"
              onClick={handleCopySummary}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition active:scale-95 shadow-2xs"
              title="คัดลอกข้อความสรุป"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
            </button>

            {/* Download HTML Button */}
            <button
              type="button"
              onClick={handleDownloadHTML}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition active:scale-95 shadow-2xs"
              title="ดาวน์โหลดไฟล์ One-Page HTML"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">โหลดไฟล์</span>
            </button>

            {/* Print / Save as PDF Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0066f5] hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition active:scale-95"
              title="เปิดหน้าต่างสั่งพิมพ์ หรือเลือก 'บันทึกเป็น PDF' ในเบราว์เซอร์"
            >
              <Printer className="w-3.5 h-3.5 text-white" />
              <span>พิมพ์ / บันทึก PDF</span>
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition ml-1"
              title="ปิด"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Preview Container */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 md:p-8 bg-slate-200/70">
          
          {/* THE PRINTABLE ONE-PAGE REPORT (A4 SHEET) */}
          <div
            id="printable-one-page-report"
            className="bg-white rounded-2xl shadow-md border border-slate-300/80 p-6 sm:p-9 md:p-10 max-w-[780px] mx-auto text-slate-900 leading-relaxed font-sans transition-all"
          >
            {/* Report Header */}
            <div className="flex items-start justify-between border-b-2 border-[#0066f5] pb-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0066f5] flex items-center justify-center text-white shrink-0 p-1.5">
                  <RobotIcon size={28} robotColor="#ffffff" bgFill="#0066f5" hasBackground={false} />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 leading-tight">
                    VoiceTrans Executive Summary
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium">
                    เอกสารสรุปบทสนทนาการแปลภาษา ไทย ⇄ จีน (One-Page Report)
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-block bg-blue-50 text-blue-700 text-[11px] font-bold px-2.5 py-1 rounded-full border border-blue-200">
                  OFFICIAL SUMMARY
                </span>
                <div className="text-[11px] text-slate-400 mt-1">
                  AI Verified · Gemini Flash
                </div>
              </div>
            </div>

            {/* Metadata Strip */}
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/90 text-xs text-slate-600 mb-6 flex flex-wrap items-center justify-between gap-y-2 gap-x-4">
              <div>
                <span className="text-slate-400 font-medium">หัวข้อ: </span>
                <span className="font-bold text-slate-800">
                  {summaryData?.topicTitle || topicTitle || 'บทสนทนาทั่วไป (ไทย ⇄ จีน)'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-medium">วันที่: </span>
                <span className="font-semibold text-slate-700">{formattedDate}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium">เวลา: </span>
                <span className="font-semibold text-slate-700">{formattedTime} น.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-blue-600">🇹🇭 ไทย {thCount}</span>
                <span>·</span>
                <span className="font-semibold text-amber-600">🇨🇳 จีน {zhCount}</span>
                <span>·</span>
                <span className="font-bold text-slate-700">รวม {records.length} ประโยค</span>
              </div>
            </div>

            {/* Section 1: Overview */}
            {(summaryData?.overview || overview) && (
              <div className="mb-5 print-avoid-break">
                <div className="text-xs font-bold text-[#0066f5] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>1. สรุปภาพรวมบทสนทนา (Executive Overview)</span>
                </div>
                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3.5 text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                  {summaryData?.overview || overview}
                </div>
              </div>
            )}

            {/* Section 2: Key Discussion Topics */}
            {summaryData?.topics && summaryData.topics.length > 0 && (
              <div className="mb-5 print-avoid-break">
                <div className="text-xs font-bold text-[#0066f5] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <ListOrdered className="w-3.5 h-3.5" />
                  <span>2. ประเด็นสำคัญที่พูดคุย (Key Discussion Topics)</span>
                </div>
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2.5">
                  {summaryData.topics.map((t, idx) => (
                    <div key={idx} className="pb-2 border-b border-slate-200/70 last:border-b-0 last:pb-0">
                      <div className="font-bold text-xs sm:text-sm text-slate-900 mb-1">
                        • {t.title}
                      </div>
                      <ul className="pl-4 space-y-1">
                        {t.bullets.map((b, bIdx) => (
                          <li key={bIdx} className="text-xs text-slate-700 list-disc leading-relaxed">
                            {b}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section 3: Critical Numbers, Prices, Conditions */}
            {summaryData?.keyDetails && summaryData.keyDetails.length > 0 && (
              <div className="mb-5 print-avoid-break">
                <div className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-amber-600" />
                  <span>3. ตัวเลข ราคา และเงื่อนไขสำคัญ (Key Numbers & Terms)</span>
                </div>
                <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-3.5">
                  <ul className="space-y-1.5 pl-4 text-xs sm:text-sm text-slate-800 font-medium list-disc">
                    {summaryData.keyDetails.map((k, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {k}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Section 4: Action Items & Agreements */}
            {summaryData?.actionItems && summaryData.actionItems.length > 0 && (
              <div className="mb-6 print-avoid-break">
                <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>4. ข้อตกลงและสิ่งที่ต้องทำต่อ (Agreements & Action Items)</span>
                </div>
                <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-3.5">
                  <ul className="space-y-1.5 pl-2 text-xs sm:text-sm text-slate-800 font-medium">
                    {summaryData.actionItems.map((a, idx) => (
                      <li key={idx} className="flex items-start gap-2 leading-relaxed">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Section 5: Bilingual Transcript Table */}
            {includeTranscript && records.length > 0 && (
              <div className="mb-6">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                  <span>5. บันทึกบทสนทนาฉบับเต็ม (Bilingual Dialogue Log)</span>
                </div>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <th className="py-2 px-3 w-[15%]">ผู้พูด</th>
                        <th className="py-2 px-3 w-[42%]">ข้อความต้นฉบับ</th>
                        <th className="py-2 px-3 w-[43%]">คำแปล</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {records.map((r, idx) => (
                        <tr key={r.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                          <td className="py-2 px-3 font-bold align-top">
                            {r.speaker === 'th' ? (
                              <span className="text-blue-700">🇹🇭 ไทย</span>
                            ) : (
                              <span className="text-amber-700">🇨🇳 จีน</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-slate-800 align-top break-words">
                            {r.originalText}
                          </td>
                          <td className="py-2 px-3 text-slate-800 align-top break-words">
                            <div className="font-medium">{r.translatedText}</div>
                            {r.pinyin && (
                              <div className="text-[11px] text-amber-600 font-mono mt-0.5">
                                {r.pinyin}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Signature & Verification Lines for Formal Meetings */}
            <div className="print-avoid-break pt-4 border-t border-dashed border-slate-300 mt-6 grid grid-cols-2 gap-8 text-center text-xs text-slate-500">
              <div>
                <div className="h-10 border-b border-slate-400 mb-1.5"></div>
                <span className="font-medium">ลงชื่อผู้สรุป / ผู้สนทนา</span>
              </div>
              <div>
                <div className="h-10 border-b border-slate-400 mb-1.5"></div>
                <span className="font-medium">ลงชื่อคู่สนทนา (签字 / Signature)</span>
              </div>
            </div>

            {/* Document Footer */}
            <div className="pt-4 mt-6 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
              <div>จัดทำโดย VoiceTrans AI Engine · แปลภาษาไทย-จีนแบบเรียลไทม์</div>
              <div>เอกสารสรุปอัตโนมัติ (A4 Format)</div>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="no-print p-3 sm:p-4 bg-white border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 hidden sm:block">
            💡 กดปุ่ม <strong>"พิมพ์ / บันทึก PDF"</strong> แล้วเลือกปลายทางเป็น <strong>"Save as PDF"</strong> ในหน้าต่างพิมพ์
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0066f5] hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-xs active:scale-95 transition"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์ / บันทึกเป็น PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-bold active:scale-95 transition"
            >
              ปิด
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
