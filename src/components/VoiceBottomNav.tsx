import { Mic, FileText } from 'lucide-react';

export type BottomNavTab = 'voice' | 'history';

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
    <nav className="bg-white border-t border-slate-200/80 px-6 py-2 flex items-center justify-around text-slate-500 select-none pb-safe max-w-lg mx-auto w-full">
      {/* 1. Live Meeting Voice Translation */}
      <button
        type="button"
        onClick={() => onTabChange('voice')}
        className={`flex items-center gap-2 py-1.5 px-4 rounded-xl transition active:scale-95 ${
          currentTab === 'voice'
            ? 'text-blue-700 bg-blue-50 font-bold border border-blue-200/80 shadow-2xs'
            : 'hover:text-slate-700'
        }`}
      >
        <div className={`p-1 rounded-lg ${currentTab === 'voice' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>
          <Mic className="w-4 h-4" />
        </div>
        <span className="text-xs font-semibold">ห้องประชุมสด (Live Voice)</span>
      </button>

      {/* 2. Meeting Minutes & Archive */}
      <button
        type="button"
        onClick={() => onTabChange('history')}
        className={`flex items-center gap-2 py-1.5 px-4 rounded-xl transition active:scale-95 relative ${
          currentTab === 'history'
            ? 'text-blue-700 bg-blue-50 font-bold border border-blue-200/80 shadow-2xs'
            : 'hover:text-slate-700'
        }`}
      >
        <div className="relative">
          <div className={`p-1 rounded-lg ${currentTab === 'history' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>
            <FileText className="w-4 h-4" />
          </div>
          {historyCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full text-[9px] w-3.5 h-3.5 flex items-center justify-center font-bold">
              {historyCount > 9 ? '9+' : historyCount}
            </span>
          )}
        </div>
        <span className="text-xs font-semibold">สรุปการประชุม (Minutes)</span>
      </button>
    </nav>
  );
}

