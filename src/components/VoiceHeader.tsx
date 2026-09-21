import { Settings, QrCode, Video } from 'lucide-react';
import { RobotIcon } from './RobotIcon';

interface VoiceHeaderProps {
  onOpenSettings: () => void;
  onOpenSummary: () => void;
  onOpenShare?: () => void;
  onOpenLiveCall?: () => void;
  historyCount: number;
}

export function VoiceHeader({
  onOpenSettings,
  onOpenSummary,
  onOpenShare,
  onOpenLiveCall,
  historyCount,
}: VoiceHeaderProps) {
  return (
    <header className="flex items-center justify-between px-3 sm:px-5 py-2.5 bg-white border-b border-slate-100 text-slate-800 sticky top-0 z-30 shadow-xs">
      {/* Left AI Robot / Summary Button matching template image */}
      <div className="flex items-center gap-1.5">
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

        {/* Live Call Button */}
        {onOpenLiveCall && (
          <button
            type="button"
            onClick={onOpenLiveCall}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs shadow-xs active:scale-95 transition group"
            title="สร้างลิงก์วิดีโอคอลแปลสดส่งใน Facebook"
          >
            <Video className="w-3.5 h-3.5 group-hover:scale-110 transition" />
            <span className="hidden sm:inline">คอลแปลสด</span>
            <span className="sm:hidden">คอล</span>
          </button>
        )}
      </div>

      {/* Center Title */}
      <div className="flex flex-col items-center">
        <h1 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
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
