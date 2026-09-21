import { useState, useRef } from 'react';
import { Camera, Upload, Sparkles, X, Image as ImageIcon } from 'lucide-react';
import { Language } from '../types';

interface CameraTranslateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTranslateResult: (originalText: string, translatedText: string, lang: Language) => void;
}

export function CameraTranslateModal({
  isOpen,
  onClose,
  onTranslateResult,
}: CameraTranslateModalProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrText, setOcrText] = useState('');
  const [transText, setTransText] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        processImageOCR(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const processImageOCR = async (base64Image: string) => {
    setIsProcessing(true);
    setOcrText('');
    setTransText('');
    try {
      const res = await fetch('/api/vision-translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image }),
      });
      const data = await res.json();
      if (data.success) {
        setOcrText(data.originalText || '');
        setTransText(data.translatedText || '');
        onTranslateResult(data.originalText, data.translatedText, data.detectedLang === 'zh' ? 'zh' : 'th');
      } else {
        alert(data.error || 'ไม่สามารถอ่านข้อความจากภาพได้');
      }
    } catch (e: any) {
      console.error(e);
      alert('เกิดข้อผิดพลาดในการประมวลผลรูปภาพ');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-md p-5 shadow-2xl text-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2 font-bold text-base text-slate-900">
            <Camera className="w-5 h-5 text-blue-600" />
            <span>แปลจากกล้อง / รูปภาพ (Camera)</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />

        {selectedImage ? (
          <div className="space-y-3">
            <div className="relative rounded-2xl overflow-hidden max-h-56 bg-slate-100 flex items-center justify-center border border-slate-200">
              <img
                src={selectedImage}
                alt="Selected"
                className="max-h-56 w-auto object-contain"
              />
              {isProcessing && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex flex-col items-center justify-center text-white space-y-2">
                  <div className="w-8 h-8 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span className="text-xs font-semibold">Gemini AI กำลังอ่านตัวอักษรและแปล...</span>
                </div>
              )}
            </div>

            {transText && (
              <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-xs sm:text-sm space-y-1">
                <div className="font-bold text-blue-900">คำแปล:</div>
                <div className="text-slate-800 font-medium">{transText}</div>
                {ocrText && (
                  <div className="text-[11px] text-slate-500 italic mt-1">
                    ข้อความต้นฉบับ: "{ocrText}"
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
            >
              เลือกรูปอื่นใหม่
            </button>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/50 rounded-3xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-3"
          >
            <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-inner">
              <Camera className="w-7 h-7" />
            </div>
            <div>
              <div className="font-bold text-sm text-slate-800">
                แตะเพื่อถ่ายรูปหรืออัปโหลดรูปภาพ
              </div>
              <div className="text-xs text-slate-400 mt-1">
                ป้ายสินค้า เมนูอาหาร ฉลาก หรือเอกสารภาษาจีน-ไทย
              </div>
            </div>
          </div>
        )}

        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-slate-600"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}
