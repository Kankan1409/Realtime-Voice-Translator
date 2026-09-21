import { Settings, QrCode } from 'lucide-react';
import { RobotIcon } from './RobotIcon';

interface VoiceHeaderProps {
  onOpenSettings: () => void;
  onOpenSummary: () => void;
  onOpenShare?: () => void;
  historyCount: number;
}

export function VoiceHeader({
  onOpenSettings,
  onOpenSummary,
  onOpenShare,
  historyCount,
}: VoiceHeaderProps) {
  return (
    <header className="flex items-center justify-between px-5 py-3 bg-white border-b border-slate-100 text-slate-800 sticky top-0 z-30 shadow-xs">
      {/* Left AI Robot / Summary Button matching template image */}
      <button
        type="button"
        onClick={onOpenSummary}
        className="flex items-center gap-1.5 py-1 px-1.5 rounded-xl hover:bg-blue-50 transition active:scale-95"
        title="สรุปการสนทนาด้วย AI"
      >
        <div className="w-8 h-8 rounded-xl bg-[#0066f5] flex items-center justify-center shadow-xs overflow-hidden">
          <RobotIcon size={24} robotColor="#ffffff" bgFill="#0066f5" hasBackground={true} />
        </div>
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

      {/* Right Action Buttons */}
      <div className="flex items-center gap-1">
        {onOpenShare && (
          <button
            type="button"
            onClick={onOpenShare}
            className="p-2 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition"
            title="แชร์ QR Code ให้เพื่อน"
          >
            <QrCode className="w-5 h-5" />
          </button>
        )}
        <button
          type="button"
          onClick={onOpenSettings}
          className="p-2 rounded-xl text-blue-600 hover:bg-blue-50 transition"
          title="ตั้งค่า"
        >
          <Settings className="w-5 h-5 text-blue-600" />
        </button>
      </div>
    </header>
  );
}
