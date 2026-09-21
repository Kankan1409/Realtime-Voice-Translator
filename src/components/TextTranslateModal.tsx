import { useState } from 'react';
import { Type, Sparkles, Send, Volume2, Copy, Check } from 'lucide-react';
import { Language } from '../types';

interface TextTranslateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTranslate: (text: string, targetLang: Language) => Promise<void>;
  onSpeak: (text: string, lang: Language) => void;
}

export function TextTranslateModal({
  isOpen,
  onClose,
  onTranslate,
  onSpeak,
}: TextTranslateModalProps) {
  const [inputText, setInputText] = useState('');
  const [sourceLang, setSourceLang] = useState<Language>('th');
  const [translatedText, setTranslatedText] = useState('');
  const [pinyin, setPinyin] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleTranslate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isTranslating) return;

    setIsTranslating(true);
    setTranslatedText('');
    setPinyin('');
    try {
      const targetLang = sourceLang === 'th' ? 'zh' : 'th';
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText.trim(),
          sourceLang,
          targetLang,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTranslatedText(data.translatedText);
        setPinyin(data.pinyin || '');
        await onTranslate(inputText.trim(), targetLang);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleCopy = () => {
    if (!translatedText) return;
    navigator.clipboard.writeText(translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-md p-5 shadow-2xl text-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2 font-bold text-base text-slate-900">
            <Type className="w-5 h-5 text-blue-600" />
            <span>แปลข้อความ (Text Translator)</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-slate-600 font-semibold"
          >
            ปิด
          </button>
        </div>

        {/* Language switch */}
        <div className="flex p-1 bg-slate-100 rounded-2xl">
          <button
            type="button"
            onClick={() => setSourceLang('th')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
              sourceLang === 'th'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🇹🇭 ภาษาไทย ➔ ภาษาจีน
          </button>
          <button
            type="button"
            onClick={() => setSourceLang('zh')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
              sourceLang === 'zh'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🇨🇳 中文 ➔ 泰语
          </button>
        </div>

        <form onSubmit={handleTranslate} className="space-y-3">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              sourceLang === 'th'
                ? 'พิมพ์หรือวางข้อความภาษาไทยที่นี่...'
                : '在这里输入或粘贴中文...'
            }
            rows={3}
            className="w-full p-3.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm placeholder:text-slate-400 resize-none"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || isTranslating}
            className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isTranslating ? 'กำลังแปล...' : 'แปลข้อความ'}</span>
          </button>
        </form>

        {translatedText && (
          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between text-xs text-blue-800 font-semibold">
              <span>คำแปล:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onSpeak(translatedText, sourceLang === 'th' ? 'zh' : 'th')}
                  className="p-1 hover:bg-blue-100 rounded text-blue-700"
                  title="ฟังเสียง"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-1 hover:bg-blue-100 rounded text-blue-700"
                  title="คัดลอก"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="text-base font-bold text-slate-900 leading-snug">
              {translatedText}
            </div>
            {pinyin && (
              <div className="text-xs text-blue-600 font-mono">
                {pinyin}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
