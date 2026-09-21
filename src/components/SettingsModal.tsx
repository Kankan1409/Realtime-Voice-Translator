import { useState } from 'react';
import { Settings, Volume2, Sparkles, X, Check, QrCode, Smartphone, Copy, ExternalLink } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

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
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const currentUrl =
    typeof window !== 'undefined' && window.location.href && !window.location.href.startsWith('about:')
      ? window.location.href
      : 'https://ais-pre-tamqoxxdji5mevf3dukz75-911647309951.asia-east1.run.app';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-sm max-h-[92vh] overflow-y-auto p-5 shadow-2xl text-slate-800 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3 sticky top-0 bg-white z-10">
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

        {/* Mobile QR Code Section */}
        <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/90 text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-blue-900 uppercase tracking-wider">
            <Smartphone className="w-4 h-4 text-blue-600" />
            <span>สแกนเปิดใช้งานบนมือถือ</span>
          </div>

          <div className="flex justify-center p-3 bg-white rounded-2xl border border-blue-100 shadow-xs w-fit mx-auto">
            <QRCodeSVG
              value={currentUrl}
              size={150}
              level="M"
              includeMargin={false}
              className="rounded-lg"
            />
          </div>

          <p className="text-[11px] text-slate-500 leading-tight">
            เปิดกล้องมือถือสแกนเพื่อเปิดใช้งานล่ามแปลเสียงบนโทรศัพท์ได้ทันที
          </p>

          <button
            type="button"
            onClick={handleCopyLink}
            className="w-full py-2 px-3 rounded-xl bg-white hover:bg-blue-100/70 border border-blue-200 text-blue-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-2xs"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">คัดลอกลิงก์สำเร็จแล้ว!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>คัดลอกลิงก์ URL</span>
              </>
            )}
          </button>
        </div>

        {/* Translation Preferences */}
        <div className="space-y-3.5 text-sm pt-1">
          {/* Auto Speak */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-800 text-xs sm:text-sm">อ่านออกเสียงอัตโนมัติ</div>
              <div className="text-[11px] text-slate-400">พูดคำแปลทันทีหลังแปลเสร็จ</div>
            </div>
            <button
              type="button"
              onClick={onToggleAutoSpeak}
              className={`w-11 h-6 rounded-full transition p-0.5 ${
                autoSpeak ? 'bg-[#0066f5]' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  autoSpeak ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Show Pinyin */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-800 text-xs sm:text-sm">แสดงพินอิน (Pinyin)</div>
              <div className="text-[11px] text-slate-400">ช่วยการอ่านออกเสียงภาษาจีน</div>
            </div>
            <button
              type="button"
              onClick={onTogglePinyin}
              className={`w-11 h-6 rounded-full transition p-0.5 ${
                showPinyin ? 'bg-[#0066f5]' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  showPinyin ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Font Size */}
          <div>
            <div className="font-semibold text-slate-800 text-xs sm:text-sm mb-1.5">ขนาดตัวอักษร</div>
            <div className="grid grid-cols-3 gap-2">
              {(['normal', 'large', 'huge'] as const).map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => onChangeFontSize(size)}
                  className={`py-1.5 rounded-xl border text-xs font-semibold capitalize transition ${
                    fontSize === size
                      ? 'border-[#0066f5] bg-blue-50 text-blue-600 font-bold'
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
                if (confirm('คุณต้องการล้างหัวข้อบทสนทนาทั้งหมดใช่หรือไม่?')) {
                  onClearHistory();
                  onClose();
                }
              }}
              className="w-full py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition border border-rose-200"
            >
              ล้างประวัติหัวข้อบทสนทนาทั้งหมด
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-2xl bg-[#0066f5] hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md transition"
        >
          บันทึกและปิด
        </button>
      </div>
    </div>
  );
}
