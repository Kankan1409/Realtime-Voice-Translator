import React, { useState, useRef } from 'react';
import {
  X,
  Printer,
  Download,
  FileText,
  Copy,
  Check,
  Calendar,
  MessageSquare,
  Building2,
  CheckCircle,
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ConversationSummary, TranslationRecord } from '../types';

interface PDFDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  topicTitle: string;
  summaryData?: ConversationSummary;
  overview?: string;
  records: TranslationRecord[];
  createdAt?: number;
}

export function PDFDocumentModal({
  isOpen,
  onClose,
  topicTitle,
  summaryData,
  overview,
  records,
  createdAt = Date.now(),
}: PDFDocumentModalProps) {
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const documentRef = useRef<HTMLDivElement | null>(null);

  if (!isOpen) return null;

  const thRecords = records.filter((r) => r.speaker === 'th');
  const zhRecords = records.filter((r) => r.speaker === 'zh');

  const formattedDate = new Date(createdAt).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = new Date(createdAt).toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const displayTitle = summaryData?.topicTitle || topicTitle || 'รายงานสรุปผลการสนทนาและการแปลภาษา';
  const displayStory =
    summaryData?.storyNarration ||
    summaryData?.overview ||
    overview ||
    'การพูดคุยสื่อสารระหว่างคู่สนทนาอย่างราบรื่น';
  const displayTakeaway =
    summaryData?.keyTakeaway ||
    (summaryData?.topics && summaryData.topics[0]?.bullets[0]) ||
    'การสื่อสารและเจรจาดำเนินไปด้วยความเข้าใจอันดีและได้ข้อสรุปที่ตรงกัน';

  const showNotification = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Direct PDF Download using jsPDF + html2canvas
  const handleDownloadPDF = async () => {
    if (!documentRef.current || isExportingPDF) return;
    setIsExportingPDF(true);
    showNotification('⏳ กำลังจัดเตรียมเอกสาร PDF...');

    try {
      const element = documentRef.current;
      const canvas = await html2canvas(element, {
        scale: 2, // High resolution
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const safeTitle = displayTitle.replace(/[^a-zA-Z0-9ก-๙_-]/g, '_').substring(0, 30);
      pdf.save(`VoiceTrans_Report_${safeTitle}_${Date.now()}.pdf`);
      showNotification('✅ ดาวน์โหลดไฟล์ PDF สำเร็จแล้ว');
    } catch (err) {
      console.error('PDF export error:', err);
      showNotification('❌ ไม่สามารถสร้างไฟล์ PDF ได้');
    } finally {
      setIsExportingPDF(false);
    }
  };

  // Browser Print
  const handlePrint = () => {
    window.print();
  };

  // Copy plain text summary
  const handleCopyText = async () => {
    const textLines = [
      `รายงานสรุปผลการสนทนา (VoiceTrans AI Report)`,
      `หัวข้อ: ${displayTitle}`,
      `วันที่: ${formattedDate} เวลา ${formattedTime} น.`,
      `จำนวนข้อความ: ทั้งหมด ${records.length} ข้อความ (ภาษาไทย ${thRecords.length}, ภาษาจีน ${zhRecords.length})`,
      ``,
      `[ใจความสำคัญที่สุด (Key Takeaway)]`,
      displayTakeaway,
      ``,
      `[เรื่องราวบทสนทนา (Conversation Story)]`,
      displayStory,
      ``,
    ];

    if (summaryData?.topics && summaryData.topics.length > 0) {
      textLines.push(`[ประเด็นสำคัญที่พูดคุย]`);
      summaryData.topics.forEach((top) => {
        textLines.push(`• ${top.title}`);
        top.bullets.forEach((b) => textLines.push(`  - ${b}`));
      });
      textLines.push(``);
    }

    if (summaryData?.actionItems && summaryData.actionItems.length > 0) {
      textLines.push(`[ข้อสรุปและสิ่งที่ต้องทำต่อ]`);
      summaryData.actionItems.forEach((item) => textLines.push(`✓ ${item}`));
      textLines.push(``);
    }

    try {
      await navigator.clipboard.writeText(textLines.join('\n'));
      setCopiedText(true);
      showNotification('📋 คัดลอกข้อความสรุปเอกสารแล้ว');
      setTimeout(() => setCopiedText(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-4xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-800 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-xs">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-white text-sm sm:text-base">
                  เอกสารรายงาน PDF (Official Document Report)
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 font-bold border border-red-400/30">
                  PDF / A4 Format
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                เอกสารบันทึกรายงานการประชุมและบทสนทนา 2 ภาษาฉบับทางการ
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="ปิด"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Buttons Strip */}
        <div className="px-4 sm:px-6 py-2.5 bg-slate-800/80 border-b border-slate-700/70 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>{formattedDate}</span>
            <span>·</span>
            <span>{records.length} รายการ</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyText}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold transition active:scale-95 text-xs shadow-xs"
              title="คัดลอกข้อความสรุปเอกสาร"
            >
              {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedText ? 'คัดลอกแล้ว' : 'คัดลอกเนื้อหา'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold transition active:scale-95 text-xs shadow-xs"
              title="พิมพ์เอกสาร A4 หรือบันทึก PDF ผ่านเบราว์เซอร์"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>พิมพ์เอกสาร</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isExportingPDF}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition active:scale-95 text-xs shadow-sm"
              title="ดาวน์โหลดเป็นไฟล์ PDF ทันที"
            >
              {isExportingPDF ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>ดาวน์โหลดไฟล์ PDF</span>
            </button>
          </div>
        </div>

        {/* Scrollable Document Area (Formal A4 sheet look) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 bg-slate-950 flex justify-center items-start">
          
          {/* ========================================================
              FORMAL A4 DOCUMENT SHEET (Rendered to PDF by jsPDF)
              ======================================================== */}
          <div
            ref={documentRef}
            className="w-full max-w-[760px] bg-white text-slate-800 p-8 sm:p-12 shadow-2xl rounded-sm border border-slate-300 font-sans"
            style={{ minHeight: '1000px' }}
          >
            {/* Document Header */}
            <div className="border-b-2 border-slate-900 pb-5 mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-[12px] font-extrabold uppercase tracking-widest text-slate-500">
                    OFFICIAL CONVERSATION & TRANSLATION REPORT
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-950 mt-1">
                    รายงานสรุปผลการสนทนาและการแปลภาษา
                  </h1>
                  <div className="text-sm font-bold text-blue-700 mt-1">
                    หัวข้อ: {displayTitle}
                  </div>
                </div>

                <div className="text-right text-xs text-slate-500 space-y-1">
                  <div><strong>เลขที่เอกสาร:</strong> TR-{Date.now().toString().slice(-6)}</div>
                  <div><strong>วันที่:</strong> {formattedDate}</div>
                  <div><strong>เวลา:</strong> {formattedTime} น.</div>
                  <div className="inline-block px-2 py-0.5 rounded bg-slate-100 font-bold text-slate-700 mt-1">
                    ภาษา: ไทย (TH) ⇄ จีน (ZH)
                  </div>
                </div>
              </div>
            </div>

            {/* Section 1: Executive Summary */}
            <div className="mb-6 space-y-3">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5 border-b pb-1">
                <span>1. สรุปภาพรวมและใจความสำคัญ (Executive Summary)</span>
              </h2>

              {/* Key Takeaway Box */}
              <div className="p-3.5 rounded-lg bg-blue-50/70 border border-blue-200">
                <div className="text-xs font-bold text-blue-900 uppercase">
                  💡 ใจความสำคัญที่สุด (Key Takeaway)
                </div>
                <p className="text-xs sm:text-sm font-semibold text-slate-900 mt-1 leading-relaxed">
                  {displayTakeaway}
                </p>
              </div>

              {/* Story Narrative */}
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-xs font-bold text-slate-700 uppercase">
                  📖 เรื่องราวบทสนทนา (Conversation Narrative)
                </div>
                <p className="text-xs sm:text-sm text-slate-700 mt-1 leading-relaxed">
                  {displayStory}
                </p>
              </div>
            </div>

            {/* Section 2: Key Discussion Points */}
            {summaryData?.topics && summaryData.topics.length > 0 && (
              <div className="mb-6 space-y-3">
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5 border-b pb-1">
                  <span>2. ประเด็นสำคัญที่ได้จากการสนทนา (Key Discussion Points)</span>
                </h2>

                <div className="space-y-2.5">
                  {summaryData.topics.map((t, idx) => (
                    <div key={idx} className="p-3 rounded-lg border border-slate-200 bg-white">
                      <div className="text-xs font-bold text-slate-900 mb-1">
                        {idx + 1}. {t.title}
                      </div>
                      <ul className="list-disc list-inside text-xs text-slate-600 space-y-1 pl-1">
                        {t.bullets.map((b, bIdx) => (
                          <li key={bIdx}>{b}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section 3: Action Items & Outcomes */}
            {summaryData?.actionItems && summaryData.actionItems.length > 0 && (
              <div className="mb-6 space-y-3">
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5 border-b pb-1">
                  <span>3. ข้อตกลงและสิ่งที่ต้องดำเนินการต่อ (Action Items)</span>
                </h2>

                <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/50">
                  <ul className="space-y-1.5 text-xs text-slate-800">
                    {summaryData.actionItems.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-emerald-700 font-bold">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Section 4: Statistics */}
            <div className="mb-6 space-y-2">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 border-b pb-1">
                <span>4. ข้อมูลสถิติการสนทนา (Conversation Statistics)</span>
              </h2>
              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div className="p-2.5 border rounded-lg bg-slate-50">
                  <div className="text-slate-500 font-semibold">ข้อความทั้งหมด</div>
                  <div className="text-base font-bold text-slate-900 mt-0.5">{records.length} รายการ</div>
                </div>
                <div className="p-2.5 border rounded-lg bg-blue-50/50 border-blue-200">
                  <div className="text-blue-700 font-semibold">ภาษาไทย (Thai)</div>
                  <div className="text-base font-bold text-blue-900 mt-0.5">{thRecords.length} ประโยค</div>
                </div>
                <div className="p-2.5 border rounded-lg bg-red-50/50 border-red-200">
                  <div className="text-red-700 font-semibold">ภาษาจีน (Chinese)</div>
                  <div className="text-base font-bold text-red-900 mt-0.5">{zhRecords.length} ประโยค</div>
                </div>
              </div>
            </div>

            {/* Section 5: Transcript Log Table */}
            {records.length > 0 && (
              <div className="mb-8 space-y-2">
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 border-b pb-1">
                  <span>5. บันทึกบทสนทนาแนบท้าย (Conversation Transcript Log)</span>
                </h2>

                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                        <th className="p-2 w-12 text-center">ลำดับ</th>
                        <th className="p-2 w-20">ภาษา</th>
                        <th className="p-2">ข้อความต้นฉบับ</th>
                        <th className="p-2">คำแปล</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {records.map((rec, i) => (
                        <tr key={rec.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                          <td className="p-2 text-center text-slate-400 font-mono">{i + 1}</td>
                          <td className="p-2 font-bold">
                            {rec.speaker === 'th' ? (
                              <span className="text-blue-700">ภาษาไทย 🇹🇭</span>
                            ) : (
                              <span className="text-red-700">ภาษาจีน 🇨🇳</span>
                            )}
                          </td>
                          <td className="p-2 text-slate-900">{rec.originalText}</td>
                          <td className="p-2 text-slate-600">{rec.translatedText}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Signatures & Certification Block */}
            <div className="pt-8 border-t-2 border-slate-200 grid grid-cols-2 gap-8 text-xs text-center">
              <div>
                <div className="h-14 border-b border-dashed border-slate-400 flex items-end justify-center pb-1 text-slate-400 italic">
                  (ลงชื่อผู้สนทนา / ผู้บันทึก)
                </div>
                <div className="mt-2 font-bold text-slate-800">ผู้แทนการสนทนา / ผู้บันทึก</div>
                <div className="text-slate-400 text-[11px]">วันที่ ............. / ............. / .............</div>
              </div>

              <div>
                <div className="h-14 border-b border-dashed border-slate-400 flex items-end justify-center pb-1 text-slate-400 italic">
                  (签字 / Signature)
                </div>
                <div className="mt-2 font-bold text-slate-800">คู่สนทนา (签字 / Signature)</div>
                <div className="text-slate-400 text-[11px]">日期 / Date ............. / ............. / .............</div>
              </div>
            </div>

            {/* Document Footer */}
            <div className="mt-8 text-center text-[10px] text-slate-400 border-t pt-3">
              เอกสารนี้สร้างขึ้นโดยระบบ VoiceTrans AI Translation & Summary System · ลิขสิทธิ์ถูกต้อง
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-3 sm:p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-2 shrink-0">
          <div className="text-xs text-slate-400 hidden sm:block">
            {toastMsg ? (
              <span className="text-emerald-400 font-bold">{toastMsg}</span>
            ) : (
              <span>📄 เอกสารรายงาน PDF ฉบับเต็ม พร้อมตารางบันทึกและช่องลงนาม</span>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>พิมพ์</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isExportingPDF}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition shadow-md active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ดาวน์โหลดไฟล์ PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
            >
              ปิด
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
