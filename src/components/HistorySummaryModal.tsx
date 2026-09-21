import React from 'react';
import {
  X,
  Trash2,
  PlusCircle,
  FolderOpen,
  Calendar,
  MessageSquare,
  ChevronRight,
  FileText,
} from 'lucide-react';
import { ConversationTopic } from '../types';
import { RobotIcon } from './RobotIcon';

interface HistorySummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  topics: ConversationTopic[];
  currentTopicId: string;
  onSelectTopic: (topicId: string) => void;
  onStartNewTopic: () => void;
  onDeleteTopic: (topicId: string) => void;
  onOpenOnePageReport?: (topic: ConversationTopic) => void;
}

export function HistorySummaryModal({
  isOpen,
  onClose,
  topics,
  currentTopicId,
  onSelectTopic,
  onStartNewTopic,
  onDeleteTopic,
  onOpenOnePageReport,
}: HistorySummaryModalProps) {
  if (!isOpen) return null;

  const handleStartNew = () => {
    onStartNewTopic();
    onClose();
  };

  const handleOpenTopic = (id: string) => {
    onSelectTopic(id);
    onClose();
  };

  const formatDateTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    const timeStr = date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    if (isToday) {
      return `วันนี้ ${timeStr} น.`;
    }
    return `${date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })} ${timeStr}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-slate-200/90 rounded-3xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-slate-800">
        
        {/* Compact Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#0066f5] flex items-center justify-center text-white p-1">
              <RobotIcon size={22} robotColor="#ffffff" bgFill="#0066f5" hasBackground={false} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-slate-900 text-base">
                  หัวข้อบทสนทนา
                </h2>
                <span className="text-[11px] px-2 py-0.2 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200">
                  {topics.length}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleStartNew}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#0066f5] hover:bg-blue-700 text-white text-xs font-bold shadow-xs active:scale-95 transition"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>คุยเรื่องใหม่</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              title="ปิด"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Clean, Compact Topics List (No oversized cards, just neat topics) */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-[#f8fafc]">
          {topics.length === 0 ? (
            <div className="h-52 flex flex-col items-center justify-center text-center p-6 space-y-2 text-slate-400">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <FolderOpen className="w-6 h-6" />
              </div>
              <div className="font-bold text-slate-700 text-sm">
                ยังไม่มีหัวข้อบทสนทนา
              </div>
              <p className="text-xs text-slate-400 max-w-xs">
                เมื่อเริ่มพูดแปลภาษา ระบบจะสร้างหัวข้อเรื่องให้อัตโนมัติ
              </p>
            </div>
          ) : (
            topics.map((topic) => {
              const isCurrent = topic.id === currentTopicId;

              return (
                <div
                  key={topic.id}
                  onClick={() => handleOpenTopic(topic.id)}
                  className={`group flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all duration-150 ${
                    isCurrent
                      ? 'bg-blue-50/70 border-blue-400 shadow-xs ring-1 ring-blue-400/30'
                      : 'bg-white border-slate-200/80 hover:border-blue-300 hover:shadow-xs'
                  }`}
                >
                  {/* Topic Title & Meta Info */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition ${
                        isCurrent
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600'
                      }`}
                    >
                      <MessageSquare className="w-4 h-4" />
                    </div>

                    <div className="min-w-0 flex-1 pr-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-800 text-sm truncate group-hover:text-blue-600 transition">
                          {topic.title || 'บทสนทนาใหม่'}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-blue-200/80 text-blue-800">
                            คุยอยู่นี้
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {formatDateTime(topic.createdAt)}
                        </span>
                        <span>·</span>
                        <span>{topic.records.length} ข้อความ</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Actions: One-Page PDF, Delete & Arrow */}
                  <div className="flex items-center gap-1 shrink-0">
                    {onOpenOnePageReport && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenOnePageReport(topic);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                        title="ดูรายงาน One-Page และพิมพ์/บันทึกเป็น PDF"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteTopic(topic.id);
                      }}
                      className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition"
                      title="ลบหัวข้อนี้"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-3 bg-white border-t border-slate-100 flex justify-between items-center text-xs">
          <span className="text-slate-400">
            รวม {topics.length} หัวข้อ
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
          >
            ปิด
          </button>
        </div>

      </div>
    </div>
  );
}
