export type Language = 'th' | 'zh';

export interface TranslationRecord {
  id: string;
  timestamp: number;
  speaker: Language; // 'th' (Thai speaker) or 'zh' (Chinese speaker)
  originalText: string;
  translatedText: string;
  pinyin?: string;
  phoneticsForReader?: string;
  sentimentOrTone?: string;
  isPartial?: boolean;
}

export interface SummaryTopic {
  title: string;
  bullets: string[];
}

export interface ConversationSummary {
  topicTitle: string; // หัวข้อหลักของแชท เช่น "ต่อรองราคาสินค้าและค่าจัดส่ง"
  overview: string; // สรุปภาพรวมสั้นๆ
  topics: SummaryTopic[]; // แต่ละหัวข้อย่อย
  actionItems?: string[]; // สิ่งที่ตกลงกัน หรือต้องทำต่อ
  keyDetails?: string[]; // รายละเอียดตัวเลข ราคา วันเวลา
}

export interface ConversationTopic {
  id: string;
  title: string;
  overview?: string;
  createdAt: number;
  updatedAt: number;
  records: TranslationRecord[];
  summaryData?: ConversationSummary;
}

export type DisplayMode = 'face-to-face' | 'split' | 'subtitles';

export interface QuickPhrase {
  id: string;
  category: 'greeting' | 'shopping' | 'dining' | 'travel' | 'emergency';
  th: string;
  zh: string;
  pinyin: string;
}
