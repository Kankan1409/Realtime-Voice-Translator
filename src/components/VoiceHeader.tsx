import { Sparkles, Settings, FileText, QrCode } from 'lucide-react';

interface VoiceHeaderProps {
  onOpenSettings: () => void;
  onOpenSummary: () => void;
  historyCount: number;
}

export function VoiceHeader({
  onOpenSettings,
  onOpenSummary,
  historyCount,
}: VoiceHeaderProps) {
  return (
    <header className="flex items-center justify-between px-5 py-3 bg-white border-b border-slate-100 text-slate-800 sticky top-0 z-30 shadow-xs">
      {/* Left AI Sparkle / Summary Button */}
      <button
        type="button"
        onClick={onOpenSummary}
        className="flex items-center gap-1.5 p-2 rounded-xl text-blue-600 hover:bg-blue-50 transition"
        title="สรุปการสนทนาด้วย AI"
      >
        <Sparkles className="w-5 h-5 text-blue-600 fill-blue-600/20" />
        {historyCount > 0 && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
            {historyCount}
          </span>
        )}
      </button>

      {/* Center Title */}
      <div className="flex flex-col items-center">
        <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
          Voice Translator
        </h1>
        <span className="text-[10px] text-slate-400 font-medium">ไทย ⇄ 中文</span>
      </div>

      {/* Right Settings Button (Blue gear icon) */}
      <button
        type="button"
        onClick={onOpenSettings}
        className="p-2 rounded-xl text-blue-600 hover:bg-blue-50 transition"
        title="ตั้งค่า"
      >
        <Settings className="w-5 h-5 text-blue-600" />
      </button>
    </header>
  );
}
