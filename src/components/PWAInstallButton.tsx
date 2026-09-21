import { useState } from 'react';
import { Download, Share2, PlusSquare, X, CheckCircle2, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export function PWAInstallButton() {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);

  // If already running as an installed standalone PWA, don't show the install button
  if (isInstalled) {
    return (
      <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-[11px] text-emerald-300 font-medium">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        <span>ติดตั้งแล้ว (App Mode)</span>
      </div>
    );
  }

  const handleOpenInstall = () => {
    if (isInstallable) {
      install();
    } else {
      setShowGuideModal(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpenInstall}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white shadow-md shadow-rose-900/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
        title="ติดตั้งเป็นแอปพลิเคชันลงบนมือถือหรือคอมพิวเตอร์"
      >
        <Smartphone className="w-3.5 h-3.5" />
        <span>ติดตั้งแอป (安装)</span>
      </button>

      {/* Installation Guide Modal (for iOS or browsers requiring manual add to home screen) */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700/80 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden p-5">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center font-bold text-white shadow-md">
                  中泰
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    ติดตั้งเป็นแอปบนอุปกรณ์ของคุณ
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    安装为独立应用程序 (PWA)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3.5 text-xs text-slate-300">
              {isIOS ? (
                <div className="space-y-2.5">
                  <p className="text-amber-300 font-medium">
                    สำหรับ iPhone / iPad (Safari):
                  </p>
                  <ol className="space-y-2 list-decimal list-inside bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-slate-300">
                    <li className="flex items-center gap-2">
                      <span>1. แตะปุ่มแชร์</span>
                      <Share2 className="w-4 h-4 text-sky-400 inline" />
                      <span>(Share) ที่แถบด้านล่าง Safari</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span>2. เลื่อนลงแล้วเลือก</span>
                      <span className="font-semibold text-white bg-slate-800 px-1.5 py-0.5 rounded flex items-center gap-1">
                        <PlusSquare className="w-3.5 h-3.5 text-amber-400" />
                        เพิ่มไปยังหน้าจอโฮม (Add to Home Screen)
                      </span>
                    </li>
                    <li>3. แตะ <strong>"เพิ่ม" (Add)</strong> ที่มุมขวาบน เพื่อสร้างไอคอนแอปบนหน้าจอ</li>
                  </ol>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <p className="text-slate-200">
                    สามารถติดตั้งเพื่อเปิดใช้งานแบบเต็มหน้าจอ (Standalone App) ได้ทันที:
                  </p>
                  <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-2 text-slate-300">
                    <div className="flex items-center gap-2">
                      <Download className="w-4 h-4 text-amber-400 shrink-0" />
                      <span><strong>Android / Chrome:</strong> แตะเมนู 3 จุด (⋮) เลือก <em>"ติดตั้งแอป" (Install App)</em> หรือ <em>"เพิ่มไปยังหน้าจอหลัก"</em></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-rose-400 shrink-0" />
                      <span><strong>คอมพิวเตอร์ (Chrome / Edge):</strong> คลิกไอคอน <em>ติดตั้ง</em> ที่แถบ URL ด้านบนขวา</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-900/40 text-[11px] text-rose-200 space-y-1">
                <div className="font-semibold text-rose-300">✨ ประโยชน์เมื่อติดตั้งเป็นแอป:</div>
                <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                  <li>เปิดใช้งานเต็มหน้าจอเสมือน Native App ไม่มีแถบเบราว์เซอร์กวนใจ</li>
                  <li>เข้าถึงได้เร็วกว่า เพียงแตะไอคอนที่หน้าจอมือถือ</li>
                  <li>ใช้ไมโครโฟนแปลเสียงสดได้สะดวกและลื่นไหล</li>
                </ul>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition"
              >
                เข้าใจแล้ว (关闭)
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
