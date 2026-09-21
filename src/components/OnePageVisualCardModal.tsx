import React, { useState, useRef } from 'react';
import {
  X,
  Download,
  Share2,
  Copy,
  Check,
  Sparkles,
  Palette,
  Calendar,
  MessageSquare,
  CheckCircle2,
  Zap,
  Bookmark,
  Layers,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { ConversationSummary, TranslationRecord } from '../types';
import { RobotIcon } from './RobotIcon';

interface OnePageVisualCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  topicTitle: string;
  summaryData?: ConversationSummary;
  overview?: string;
  records: TranslationRecord[];
  createdAt?: number;
}

type CardTheme = 'royal' | 'sunset' | 'emerald' | 'slate';

export function OnePageVisualCardModal({
  isOpen,
  onClose,
  topicTitle,
  summaryData,
  overview,
  records,
  createdAt = Date.now(),
}: OnePageVisualCardModalProps) {
  const [selectedTheme, setSelectedTheme] = useState<CardTheme>('royal');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const cardRef = useRef<HTMLDivElement | null>(null);

  if (!isOpen) return null;

  const thCount = records.filter((r) => r.speaker === 'th').length;
  const zhCount = records.filter((r) => r.speaker === 'zh').length;

  const formattedDate = new Date(createdAt).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const formattedTime = new Date(createdAt).toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const displayTitle = summaryData?.topicTitle || topicTitle || 'บทสรุปการสนทนา (ไทย ⇄ จีน)';
  const displayStory =
    summaryData?.storyNarration ||
    summaryData?.overview ||
    overview ||
    'การพูดคุยสื่อสารและแลกเปลี่ยนความเข้าใจระหว่างคู่สนทนาอย่างราบรื่น';
  const displayTakeaway =
    summaryData?.keyTakeaway ||
    (summaryData?.topics && summaryData.topics[0]?.bullets[0]) ||
    'การสื่อสารและเจรจาดำเนินไปด้วยความเข้าใจอันดีและได้ข้อสรุปที่ตรงกัน';

  const showNotification = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Theme style configurations
  const themes = {
    royal: {
      name: 'Royal Blue',
      gradientHeader: 'from-blue-600 via-indigo-600 to-sky-600',
      badgeBg: 'bg-blue-100 text-blue-800 border-blue-200',
      cardBorder: 'border-blue-200/90',
      accentColor: '#2563eb',
      accentBg: 'bg-blue-50',
      accentText: 'text-blue-700',
      highlightBox: 'bg-gradient-to-r from-blue-50 to-indigo-50/70 border-blue-200',
      statPill: 'bg-blue-50/80 border-blue-200 text-blue-800',
      buttonBg: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
    sunset: {
      name: 'Warm Sunset',
      gradientHeader: 'from-amber-500 via-rose-500 to-pink-600',
      badgeBg: 'bg-amber-100 text-amber-900 border-amber-200',
      cardBorder: 'border-rose-200/90',
      accentColor: '#e11d48',
      accentBg: 'bg-rose-50',
      accentText: 'text-rose-700',
      highlightBox: 'bg-gradient-to-r from-amber-50 to-rose-50/70 border-rose-200',
      statPill: 'bg-rose-50/80 border-rose-200 text-rose-800',
      buttonBg: 'bg-gradient-to-r from-amber-500 to-rose-600 hover:opacity-95 text-white',
    },
    emerald: {
      name: 'Emerald Mint',
      gradientHeader: 'from-emerald-600 via-teal-600 to-cyan-700',
      badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      cardBorder: 'border-emerald-200/90',
      accentColor: '#059669',
      accentBg: 'bg-emerald-50',
      accentText: 'text-emerald-700',
      highlightBox: 'bg-gradient-to-r from-emerald-50 to-teal-50/70 border-emerald-200',
      statPill: 'bg-emerald-50/80 border-emerald-200 text-emerald-800',
      buttonBg: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    },
    slate: {
      name: 'Modern Slate',
      gradientHeader: 'from-slate-800 via-slate-900 to-zinc-900',
      badgeBg: 'bg-slate-200 text-slate-800 border-slate-300',
      cardBorder: 'border-slate-300',
      accentColor: '#0f172a',
      accentBg: 'bg-slate-100',
      accentText: 'text-slate-800',
      highlightBox: 'bg-slate-100 border-slate-300',
      statPill: 'bg-slate-100 border-slate-300 text-slate-800',
      buttonBg: 'bg-slate-900 hover:bg-slate-800 text-white',
    },
  };

  const currentTheme = themes[selectedTheme];

  // Capture the visual template and download as high-res PNG image
  const handleDownloadImage = async () => {
    if (!cardRef.current || isGenerating) return;
    setIsGenerating(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2.5, // Crisp retina resolution
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      const safeTitle = displayTitle.replace(/[^a-zA-Z0-9ก-๙_-]/g, '_').substring(0, 30);
      link.download = `VoiceTrans_Summary_${safeTitle}_${Date.now()}.png`;
      link.href = image;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showNotification('✅ บันทึกรูปภาพสรุปเรียบร้อยแล้ว');
    } catch (e) {
      console.error('Download image error', e);
      showNotification('❌ เกิดข้อผิดพลาดในการสร้างรูปภาพ');
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy Image directly to clipboard so user can paste into LINE, WeChat, WhatsApp
  const handleCopyImage = async () => {
    if (!cardRef.current || isGenerating) return;
    setIsGenerating(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2.0,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      canvas.toBlob(async (blob) => {
        if (!blob) {
          showNotification('❌ ไม่สามารถสร้างภาพได้');
          setIsGenerating(false);
          return;
        }

        try {
          if (navigator.clipboard && (window as any).ClipboardItem) {
            const item = new (window as any).ClipboardItem({ 'image/png': blob });
            await navigator.clipboard.write([item]);
            setCopiedImage(true);
            showNotification('📋 คัดลอกรูปภาพแล้ว! สามารถวาง (Paste) ในแชทได้ทันที');
            setTimeout(() => setCopiedImage(false), 2500);
          } else {
            handleDownloadImage();
          }
        } catch (clipErr) {
          console.warn('Clipboard write image failed, falling back to download', clipErr);
          handleDownloadImage();
        } finally {
          setIsGenerating(false);
        }
      }, 'image/png');
    } catch (err) {
      console.error(err);
      setIsGenerating(false);
      showNotification('❌ ไม่สามารถคัดลอกรูปภาพได้');
    }
  };

  // Web Share API
  const handleShare = async () => {
    if (!cardRef.current || isGenerating) return;
    setIsGenerating(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2.0,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      canvas.toBlob(async (blob) => {
        if (blob && navigator.share && navigator.canShare) {
          const file = new File([blob], `summary_${Date.now()}.png`, { type: 'image/png' });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: displayTitle,
              text: `บทสรุปการสนทนา: ${displayTitle}\n${displayTakeaway}`,
              files: [file],
            });
            showNotification('📤 แชร์รูปภาพสรุปเรียบร้อย');
            setIsGenerating(false);
            return;
          }
        }

        // Fallback: share text
        if (navigator.share) {
          await navigator.share({
            title: displayTitle,
            text: `📌 บทสรุป: ${displayTitle}\n💡 ใจความสำคัญ: ${displayTakeaway}\n📖 สรุปเรื่องราว: ${displayStory}`,
          });
          showNotification('📤 แชร์ข้อความสรุปเรียบร้อย');
        } else {
          handleDownloadImage();
        }
        setIsGenerating(false);
      }, 'image/png');
    } catch (e) {
      console.error('Share error', e);
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-3xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-800 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-white text-sm sm:text-base">
                  รูปสรุป One-Page (Visual Summary Card)
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold border border-blue-400/30">
                  Infographic Template
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                เทมเพลตรูปภาพสรุปเรื่องราวและประเด็นสำคัญ สวยงามพร้อมบันทึกหรือแชร์
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

        {/* Action Controls & Theme Selector Strip */}
        <div className="px-4 sm:px-6 py-2.5 bg-slate-800/80 border-b border-slate-700/70 flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Theme Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px] font-semibold flex items-center gap-1 mr-1">
              <Palette className="w-3.5 h-3.5" />
              <span>ธีมสี:</span>
            </span>
            {(['royal', 'sunset', 'emerald', 'slate'] as CardTheme[]).map((thm) => (
              <button
                key={thm}
                type="button"
                onClick={() => setSelectedTheme(thm)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                  selectedTheme === thm
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                {themes[thm].name}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyImage}
              disabled={isGenerating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold transition active:scale-95 text-xs shadow-xs"
              title="คัดลอกรูปภาพ เพื่อนำไปวางในแชท LINE, WeChat"
            >
              {copiedImage ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedImage ? 'คัดลอกรูปแล้ว' : 'คัดลอกรูป'}</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              disabled={isGenerating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold transition active:scale-95 text-xs shadow-xs"
              title="แชร์การ์ดสรุป"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">แชร์</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadImage}
              disabled={isGenerating}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold transition active:scale-95 text-xs shadow-sm ${currentTheme.buttonBg}`}
              title="ดาวน์โหลดรูปภาพสรุป (PNG คมชัดสูง)"
            >
              {isGenerating ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>บันทึกรูปภาพ (PNG)</span>
            </button>
          </div>
        </div>

        {/* Scrollable Visual Card Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 bg-slate-950 flex justify-center items-start">
          
          {/* ========================================================
              THE ACTUAL VISUAL SUMMARY POSTER (Captured by html2canvas)
              ======================================================== */}
          <div
            ref={cardRef}
            className={`w-full max-w-[620px] bg-white rounded-3xl overflow-hidden shadow-2xl border ${currentTheme.cardBorder} text-slate-800 transition-all font-sans select-none`}
            style={{ minHeight: '680px' }}
          >
            {/* Header Banner */}
            <div className={`p-6 bg-gradient-to-r ${currentTheme.gradientHeader} text-white relative overflow-hidden`}>
              {/* Subtle visual decoration dots */}
              <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 rounded-full blur-xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-lg pointer-events-none" />

              <div className="relative z-10 flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center p-1 border border-white/30 shadow-inner">
                    <RobotIcon size={24} robotColor="#ffffff" bgFill="transparent" hasBackground={false} />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold tracking-widest text-white/80 uppercase">
                      VoiceTrans AI Summary
                    </div>
                    <div className="text-xs font-semibold text-white/95">
                      บทสรุปเรื่องราวการสนทนา ไทย ⇄ จีน
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 bg-black/20 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-bold border border-white/20">
                  <span>🇹🇭 ไทย</span>
                  <span className="text-white/60">⇄</span>
                  <span>🇨🇳 จีน</span>
                </div>
              </div>

              {/* Topic Headline */}
              <div className="relative z-10">
                <div className="inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/25 backdrop-blur-sm text-white border border-white/30 mb-2">
                  หัวข้อเรื่อง
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-white leading-tight drop-shadow-xs">
                  {displayTitle}
                </h1>
                <div className="flex items-center gap-2 text-xs text-white/85 mt-2.5 font-medium">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 opacity-80" />
                    {formattedDate} · {formattedTime} น.
                  </span>
                  <span>·</span>
                  <span>สนทนารวม {records.length} ครั้ง</span>
                </div>
              </div>
            </div>

            {/* Poster Body */}
            <div className="p-5 sm:p-6 space-y-4 bg-white">
              
              {/* Highlight Card: Key Takeaway (ใจความสำคัญที่สุด) */}
              <div className={`p-4 rounded-2xl border ${currentTheme.highlightBox} relative`}>
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider mb-1.5 text-amber-800">
                  <Zap className="w-4 h-4 text-amber-600 fill-amber-500" />
                  <span>ใจความสำคัญที่สุด (Key Takeaway)</span>
                </div>
                <p className="text-sm font-bold text-slate-900 leading-relaxed">
                  "{displayTakeaway}"
                </p>
              </div>

              {/* Story Narration: สรุปเรื่องราวว่าพูดอะไรกัน */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider mb-2 text-slate-700">
                  <Bookmark className={`w-3.5 h-3.5 ${currentTheme.accentText}`} />
                  <span>เรื่องราวบทสนทนา (Conversation Story)</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                  {displayStory}
                </p>
              </div>

              {/* Core Topics: ประเด็นสำคัญที่พูดคุย (Synthesized takeaways, strictly NO raw transcript) */}
              {summaryData?.topics && summaryData.topics.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
                    <Layers className={`w-3.5 h-3.5 ${currentTheme.accentText}`} />
                    <span>ประเด็นสาระสำคัญ (Key Discussion Points)</span>
                  </div>

                  <div className="space-y-2">
                    {summaryData.topics.map((top, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-1.5"
                      >
                        <div className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${currentTheme.accentBg} ${currentTheme.accentText} inline-block shrink-0`} style={{ backgroundColor: currentTheme.accentColor }} />
                          <span>{top.title}</span>
                        </div>
                        <ul className="space-y-1 pl-4">
                          {top.bullets.map((b, bIdx) => (
                            <li key={bIdx} className="text-xs text-slate-600 flex items-start gap-1.5 leading-relaxed">
                              <span className="text-slate-400 font-bold shrink-0">•</span>
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Items / Agreements */}
              {summaryData?.actionItems && summaryData.actionItems.length > 0 && (
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/90">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-900 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>ข้อสรุปและสิ่งที่ต้องทำต่อ (Outcomes & Action Items)</span>
                  </div>
                  <ul className="space-y-1.5">
                    {summaryData.actionItems.map((item, idx) => (
                      <li key={idx} className="text-xs text-slate-800 font-medium flex items-start gap-2 leading-relaxed">
                        <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Dialogue Stats Pills */}
              <div className="grid grid-cols-3 gap-2 pt-2">
                <div className={`p-2.5 rounded-xl border text-center ${currentTheme.statPill}`}>
                  <div className="text-[10px] font-semibold text-slate-500">บทสนทนา</div>
                  <div className="text-base font-extrabold">{records.length} ข้อความ</div>
                </div>
                <div className={`p-2.5 rounded-xl border text-center ${currentTheme.statPill}`}>
                  <div className="text-[10px] font-semibold text-slate-500">ภาษาไทย 🇹🇭</div>
                  <div className="text-base font-extrabold">{thCount} ประโยค</div>
                </div>
                <div className={`p-2.5 rounded-xl border text-center ${currentTheme.statPill}`}>
                  <div className="text-[10px] font-semibold text-slate-500">ภาษาจีน 🇨🇳</div>
                  <div className="text-base font-extrabold">{zhCount} ประโยค</div>
                </div>
              </div>

              {/* Template Card Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-1 font-semibold text-slate-500">
                  <span>VoiceTrans AI</span>
                  <span>·</span>
                  <span>Verified Summary Card</span>
                </div>
                <div>สร้างเมื่อ {formattedDate}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-3 sm:p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-2 shrink-0">
          <div className="text-xs text-slate-400 hidden sm:block">
            {toastMsg ? (
              <span className="text-emerald-400 font-bold">{toastMsg}</span>
            ) : (
              <span>✨ แตะ <strong>"บันทึกรูปภาพ"</strong> เพื่อเซฟเป็นรูป PNG หรือแตะ <strong>"คัดลอกรูป"</strong> เพื่อส่งในแชทได้ทันที</span>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={handleDownloadImage}
              disabled={isGenerating}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold transition active:scale-95 text-xs shadow-md ${currentTheme.buttonBg}`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>บันทึกเป็นรูปภาพ (Save Image)</span>
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
