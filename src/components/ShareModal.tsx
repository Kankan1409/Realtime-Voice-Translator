import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, X, Copy, Check, ExternalLink, Smartphone } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShareModal({ isOpen, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Detect current URL or fallback
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative text-center">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon & Title */}
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mx-auto flex items-center justify-center mb-3">
          <Smartphone className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-white mb-1">
          เปิดบนมือถือ (Open on Mobile)
        </h3>
        <p className="text-xs text-slate-400 mb-5">
          หยิบกล้องมือถือส่องสแกน QR Code เพื่อเปิดใช้งานทันที
        </p>

        {/* QR Code Canvas */}
        <div className="p-4 bg-white rounded-2xl inline-block shadow-inner mb-5">
          <QRCodeSVG
            value={currentUrl}
            size={180}
            level="H"
            includeMargin={true}
          />
        </div>

        {/* Quick Link Copy */}
        <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800 mb-4 text-left">
          <span className="text-xs text-slate-300 truncate flex-1 pl-2">
            {currentUrl}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium transition shrink-0"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>คัดลอกแล้ว</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>คัดลอกลิงก์</span>
              </>
            )}
          </button>
        </div>

        <p className="text-[11px] text-slate-500 leading-relaxed">
          * เมื่อเปิดในมือถือแล้ว สามารถกดปุ่ม <b>"ติดตั้งแอป (安装)"</b> หรือเลือก <b>"Add to Home Screen"</b> เพื่อบันทึกเป็นไอคอนแอปได้เลย
        </p>
      </div>
    </div>
  );
}
