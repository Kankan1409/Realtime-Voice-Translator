import {
  Volume2,
  VolumeX,
  Languages,
  BookOpen,
  RotateCcw,
  Sparkles,
  Subtitles,
  Maximize2,
  Minimize2,
  QrCode,
  FileText,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  autoSpeak: boolean;
  onToggleAutoSpeak: () => void;
  showPinyin: boolean;
  onTogglePinyin: () => void;
  onOpenQuickPhrases: () => void;
  onOpenShareModal: () => void;
  onOpenHistorySummary: () => void;
  onClearHistory: () => void;
  historyCount: number;
  fontSize: 'normal' | 'large' | 'huge';
  onChangeFontSize: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export function Header({
  autoSpeak,
  onToggleAutoSpeak,
  showPinyin,
  onTogglePinyin,
  onOpenQuickPhrases,
  onOpenShareModal,
  onOpenHistorySummary,
  onClearHistory,
  historyCount,
  fontSize,
  onChangeFontSize,
  isFullscreen,
  onToggleFullscreen,
}: HeaderProps) {
  const fontLabel = fontSize === 'normal' ? 'ขนาด: ปกติ' : fontSize === 'large' ? 'ขนาด: ใหญ่' : 'ขนาด: ยักษ์';

  return (
    <header className="flex items-center justify-between gap-2 px-3 sm:px-5 py-2.5 bg-slate-950/95 backdrop-blur border-b border-slate-800/80 text-slate-200 sticky top-0 z-30">
      {/* Brand Title */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-500/20 text-white font-bold text-sm">
          中泰
        </div>
        <div>
          <div className="flex items-center gap-1.5 font-bold text-sm sm:text-base text-white tracking-wide">
            <Subtitles className="w-4 h-4 text-rose-400 hidden xs:inline" />
            <span>แคปชั่นแปลสด ไทย ⇄ จีน</span>
            <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-rose-500/20 text-rose-300 border border-rose-500/30">
              <Sparkles className="w-2.5 h-2.5 mr-1" />
              Live Captions
            </span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-400">
            中泰双向实时字幕同传 (Dual Voice Subtitles)
          </p>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        {/* History & AI Summary Button */}
        <button
          type="button"
          onClick={onOpenHistorySummary}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-amber-400 border border-amber-500/30 shadow-sm transition"
          title="ดูประวัติการคุย & AI สรุป (Conversation History & AI Summary)"
        >
          <FileText className="w-3.5 h-3.5 text-amber-400" />
          <span>ประวัติ</span>
          <span className="ml-0.5 px-1.5 py-0.2 bg-amber-500 text-slate-950 text-[10px] font-bold rounded-full">
            {historyCount}
          </span>
        </button>

        {/* QR Code / Share to Phone */}
        <button
          type="button"
          onClick={onOpenShareModal}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-rose-600/90 to-amber-600/90 hover:from-rose-500 hover:to-amber-500 text-white shadow-sm transition"
          title="สแกน QR Code เปิดบนมือถือ (Open on Mobile)"
        >
          <QrCode className="w-4 h-4" />
          <span className="hidden sm:inline">เปิดบนมือถือ</span>
        </button>

        {/* PWA Install Button */}
        <PWAInstallButton />

        {/* Font Size Toggle */}
        <button
          type="button"
          onClick={onChangeFontSize}
          className="px-2 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-medium transition flex items-center gap-1"
          title="ปรับขนาดตัวอักษรแคปชั่น (Font Size)"
        >
          <span className="font-bold text-rose-400">A</span>
          <span className="text-[10px] hidden md:inline text-slate-400">{fontLabel}</span>
        </button>

        {/* Quick Phrasebook */}
        <button
          type="button"
          onClick={onOpenQuickPhrases}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition"
          title="ประโยคด่วนที่ใช้บ่อย (常用短语)"
        >
          <BookOpen className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden md:inline">ประโยคด่วน</span>
        </button>

        {/* Pinyin toggle */}
        <button
          type="button"
          onClick={onTogglePinyin}
          className={`p-1.5 rounded-lg border text-xs font-medium transition ${
            showPinyin
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
          title={showPinyin ? 'ซ่อนพินอิน (Hide Pinyin)' : 'แสดงพินอิน (Show Pinyin)'}
        >
          <Languages className="w-4 h-4" />
        </button>

        {/* Auto TTS Speak toggle */}
        <button
          type="button"
          onClick={onToggleAutoSpeak}
          className={`p-1.5 rounded-lg border text-xs font-medium transition ${
            autoSpeak
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
          title={autoSpeak ? 'อ่านออกเสียงอัตโนมัติ: เปิด (Auto TTS ON)' : 'อ่านออกเสียงอัตโนมัติ: ปิด (Auto TTS OFF)'}
        >
          {autoSpeak ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Fullscreen toggle */}
        <button
          type="button"
          onClick={onToggleFullscreen}
          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
          title={isFullscreen ? 'ออกจากเต็มจอ' : 'แสดงเต็มจอ (Fullscreen)'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        {/* Clear History */}
        {historyCount > 0 && (
          <button
            type="button"
            onClick={onClearHistory}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-800/50 transition"
            title="ล้างแคปชั่นทั้งหมด (Clear Captions)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
}
