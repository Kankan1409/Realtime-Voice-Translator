import { useState } from 'react';
import { Send, Volume2, Sparkles, Copy, Check } from 'lucide-react';
import { Language } from '../types';

interface KeyboardInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendText: (text: string, lang: Language) => Promise<void>;
}

export function KeyboardInputModal({
  isOpen,
  onClose,
  onSendText,
}: KeyboardInputModalProps) {
  const [text, setText] = useState('');
  const [lang, setLang] = useState<Language>('th');
  const [isTranslating, setIsTranslating] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isTranslating) return;
    setIsTranslating(true);
    try {
      await onSendText(text.trim(), lang);
      setText('');
      onClose();
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md p-5 shadow-2xl text-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="font-bold text-base text-slate-900">
            พิมพ์ข้อความเพื่อแปล (Keyboard)
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-slate-600 font-semibold"
          >
            ยกเลิก
          </button>
        </div>

        {/* Language selector tabs */}
        <div className="flex p-1 bg-slate-100 rounded-2xl">
          <button
            type="button"
            onClick={() => setLang('th')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
              lang === 'th'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🇹🇭 ภาษาไทย ➔ ภาษาจีน
          </button>
          <button
            type="button"
            onClick={() => setLang('zh')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
              lang === 'zh'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🇨🇳 中文 ➔ 泰语
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              lang === 'th'
                ? 'พิมพ์ภาษาไทยที่นี่ เช่น สอบถามราคาสินค้า...'
                : '在这里输入中文...'
            }
            rows={3}
            className="w-full p-3.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm placeholder:text-slate-400 resize-none"
            autoFocus
          />

          <button
            type="submit"
            disabled={!text.trim() || isTranslating}
            className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition"
          >
            <Send className="w-4 h-4" />
            <span>{isTranslating ? 'กำลังแปล...' : 'ส่งและแปลทันที'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
