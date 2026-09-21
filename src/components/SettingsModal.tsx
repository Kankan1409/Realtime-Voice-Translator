import { useState } from 'react';
import { Settings, Volume2, Sparkles, X, Check } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  autoSpeak: boolean;
  onToggleAutoSpeak: () => void;
  showPinyin: boolean;
  onTogglePinyin: () => void;
  fontSize: 'normal' | 'large' | 'huge';
  onChangeFontSize: (size: 'normal' | 'large' | 'huge') => void;
  onClearHistory: () => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  autoSpeak,
  onToggleAutoSpeak,
  showPinyin,
  onTogglePinyin,
  fontSize,
  onChangeFontSize,
  onClearHistory,
}: SettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-sm p-5 shadow-2xl text-slate-800 space-y-5">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2 font-bold text-base text-slate-900">
            <Settings className="w-5 h-5 text-blue-600" />
            <span>ตั้งค่า (Settings)</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options */}
        <div className="space-y-4 text-sm">
          {/* Auto Speak */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-800">อ่านออกเสียงอัตโนมัติ</div>
              <div className="text-xs text-slate-500">พูดคำแปลทันทีหลังแปลเสร็จ</div>
            </div>
            <button
              type="button"
              onClick={onToggleAutoSpeak}
              className={`w-12 h-6 rounded-full transition p-0.5 ${
                autoSpeak ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  autoSpeak ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Show Pinyin */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-800">แสดงพินอิน (Pinyin)</div>
              <div className="text-xs text-slate-500">ช่วยการอ่านออกเสียงภาษาจีน</div>
            </div>
            <button
              type="button"
              onClick={onTogglePinyin}
              className={`w-12 h-6 rounded-full transition p-0.5 ${
                showPinyin ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  showPinyin ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Font Size */}
          <div>
            <div className="font-semibold text-slate-800 mb-1.5">ขนาดตัวอักษร</div>
            <div className="grid grid-cols-3 gap-2">
              {(['normal', 'large', 'huge'] as const).map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => onChangeFontSize(size)}
                  className={`py-1.5 rounded-xl border text-xs font-semibold capitalize transition ${
                    fontSize === size
                      ? 'border-blue-600 bg-blue-50 text-blue-600'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {size === 'normal' ? 'ปกติ' : size === 'large' ? 'ใหญ่' : 'ยักษ์'}
                </button>
              ))}
            </div>
          </div>

          {/* Clear history */}
          <div className="pt-2 border-t">
            <button
              type="button"
              onClick={() => {
                if (confirm('คุณต้องการล้างประวัติข้อความทั้งหมดใช่หรือไม่?')) {
                  onClearHistory();
                  onClose();
                }
              }}
              className="w-full py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition border border-rose-200"
            >
              ล้างประวัติการสนทนาทั้งหมด
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition"
        >
          บันทึกและปิด
        </button>
      </div>
    </div>
  );
}
