import { useState } from 'react';
import { X, Volume2, ArrowRight } from 'lucide-react';
import { QUICK_PHRASES } from '../data/phrases';
import { QuickPhrase } from '../types';

interface QuickPhrasesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPhrase: (phrase: QuickPhrase, speaker: 'th' | 'zh') => void;
  onSpeak: (text: string, lang: 'th' | 'zh') => void;
}

export function QuickPhrasesModal({
  isOpen,
  onClose,
  onSelectPhrase,
  onSpeak,
}: QuickPhrasesModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  if (!isOpen) return null;

  const categories = [
    { id: 'all', label: 'ทั้งหมด (全部)' },
    { id: 'greeting', label: 'ทักทาย (问候)' },
    { id: 'shopping', label: 'ซื้อของ/จ่ายเงิน (购物)' },
    { id: 'dining', label: 'ร้านอาหาร (餐饮)' },
    { id: 'travel', label: 'เดินทาง/แท็กซี่ (交通)' },
    { id: 'emergency', label: 'ช่วยเหลือ (求助)' },
  ];

  const filteredPhrases =
    selectedCategory === 'all'
      ? QUICK_PHRASES
      : QUICK_PHRASES.filter((p) => p.category === selectedCategory);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/50">
          <div>
            <h3 className="text-base font-semibold text-white">
              ประโยคด่วนที่ใช้บ่อย (常用中泰短语)
            </h3>
            <p className="text-xs text-slate-400">
              แตะเพื่อส่งและแปลสดทันที หรือกดไอคอนเพื่อฟังเสียงอ่าน
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 px-5 py-2.5 overflow-x-auto border-b border-slate-800/60 bg-slate-950/40">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${
                selectedCategory === cat.id
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Phrases List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {filteredPhrases.map((phrase) => (
            <div
              key={phrase.id}
              className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/50 hover:border-amber-500/40 transition group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 flex-1">
                  <div className="text-sm font-medium text-amber-200 font-thai flex items-baseline gap-1.5">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">TH</span>
                    <span>{phrase.th}</span>
                  </div>
                  <div className="text-sm font-medium text-rose-200 font-chinese flex items-baseline gap-1.5">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300">ZH</span>
                    <span>{phrase.zh}</span>
                  </div>
                  <div className="text-xs text-slate-400 font-mono pl-7">
                    {phrase.pinyin}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => onSpeak(phrase.zh, 'zh')}
                    className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition"
                    title="ฟังเสียงจีน"
                  >
                    <Volume2 className="w-4 h-4 text-rose-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onSpeak(phrase.th, 'th')}
                    className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition"
                    title="ฟังเสียงไทย"
                  >
                    <Volume2 className="w-4 h-4 text-amber-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onSelectPhrase(phrase, 'th');
                      onClose();
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium transition ml-1"
                    title="ส่งเข้าบทสนทนา"
                  >
                    <span>แปลสด</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
