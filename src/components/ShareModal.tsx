import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, X, Copy, Check, Smartphone, ShieldCheck, ExternalLink } from 'lucide-react';
import { getPublicShareUrl } from '../utils/url';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShareModal({ isOpen, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Always use the public shared link (preventing Google 403 error on friend's phone)
  const currentUrl = getPublicShareUrl();

  const handleCopy = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl relative text-center border border-slate-100">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon & Title */}
        <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 mx-auto flex items-center justify-center mb-3">
          <QrCode className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">
          แชร์ให้เพื่อนใช้งาน
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          เปิดกล้องมือถือส่องสแกน QR Code หรือส่งลิงก์เพื่อเปิดใช้งานได้ทันที (ทุกคนเข้าได้ ไม่ติด 403)
        </p>

        {/* QR Code Canvas */}
        <div className="p-3 bg-slate-50 rounded-2xl inline-block border border-slate-200 shadow-inner mb-4">
          <div className="bg-white p-3 rounded-xl shadow-xs">
            <QRCodeSVG
              value={currentUrl}
              size={170}
              level="M"
              includeMargin={false}
            />
          </div>
        </div>

        {/* Public Link Badge */}
        <div className="flex items-center justify-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-50 py-1 px-2.5 rounded-full w-fit mx-auto mb-3">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>ลิงก์สาธารณะ (เปิดได้ทุกคนโดยไม่ต้องล็อกอิน)</span>
        </div>

        {/* Share Button Notice if not published */}
        <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-2.5 mb-3 text-left">
          <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
            📢 <b>ขั้นตอนเปิดใช้งาน:</b> ให้คุณกดปุ่ม <b>"Share" (แชร์)</b> ที่มุมขวาบนของหน้าจอ AI Studio 1 ครั้ง เพื่อเปิดให้เพื่อนเข้าใช้งานได้ครับ
          </p>
        </div>

        {/* Quick Link Copy */}
        <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-xl border border-slate-200 mb-4 text-left">
          <span className="text-xs text-slate-700 truncate flex-1 pl-2 font-mono">
            {currentUrl}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition shrink-0 shadow-xs active:scale-95"
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
          💡 เมื่อเพื่อนเปิดบนมือถือแล้ว สามารถกด <b>"เพิ่มลงในหน้าจอโฮม (Add to Home Screen)"</b> เพื่อใช้งานเหมือนแอปจริงได้เลยครับ
        </p>
      </div>
    </div>
  );
}
