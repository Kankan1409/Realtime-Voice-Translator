import { Type, Camera, Mic, Keyboard, History } from 'lucide-react';

export type BottomNavTab = 'text' | 'camera' | 'voice' | 'keyboard' | 'history';

interface VoiceBottomNavProps {
  currentTab: BottomNavTab;
  onTabChange: (tab: BottomNavTab) => void;
  historyCount: number;
}

export function VoiceBottomNav({
  currentTab,
  onTabChange,
  historyCount,
}: VoiceBottomNavProps) {
  return (
    <nav className="bg-white border-t border-slate-200/80 px-3 py-2 flex items-center justify-around text-slate-400 select-none pb-safe">
      {/* 1. Text */}
      <button
        type="button"
        onClick={() => onTabChange('text')}
        className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
          currentTab === 'text'
            ? 'text-blue-600 font-bold'
            : 'hover:text-slate-600'
        }`}
      >
        <Type className="w-5 h-5" />
        <span className="text-[11px] font-medium">Text</span>
      </button>

      {/* 2. Camera */}
      <button
        type="button"
        onClick={() => onTabChange('camera')}
        className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
          currentTab === 'camera'
            ? 'text-blue-600 font-bold'
            : 'hover:text-slate-600'
        }`}
      >
        <Camera className="w-5 h-5" />
        <span className="text-[11px] font-medium">Camera</span>
      </button>

      {/* 3. Voice (Active center tab with pill background like screenshot) */}
      <button
        type="button"
        onClick={() => onTabChange('voice')}
        className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
          currentTab === 'voice'
            ? 'text-blue-600 font-bold'
            : 'hover:text-slate-600'
        }`}
      >
        <div
          className={`p-1 rounded-full ${
            currentTab === 'voice' ? 'bg-blue-50 text-blue-600' : ''
          }`}
        >
          <Mic className="w-5 h-5" />
        </div>
        <span className="text-[11px] font-medium">Voice</span>
      </button>

      {/* 4. Keyboard */}
      <button
        type="button"
        onClick={() => onTabChange('keyboard')}
        className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
          currentTab === 'keyboard'
            ? 'text-blue-600 font-bold'
            : 'hover:text-slate-600'
        }`}
      >
        <Keyboard className="w-5 h-5" />
        <span className="text-[11px] font-medium">Keyboard</span>
      </button>

      {/* 5. History */}
      <button
        type="button"
        onClick={() => onTabChange('history')}
        className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition relative ${
          currentTab === 'history'
            ? 'text-blue-600 font-bold'
            : 'hover:text-slate-600'
        }`}
      >
        <div className="relative">
          <History className="w-5 h-5" />
          {historyCount > 0 && (
            <span className="absolute -top-1 -right-2 bg-blue-600 text-white rounded-full text-[9px] w-4 h-4 flex items-center justify-center font-bold">
              {historyCount > 9 ? '9+' : historyCount}
            </span>
          )}
        </div>
        <span className="text-[11px] font-medium">History</span>
      </button>
    </nav>
  );
}
