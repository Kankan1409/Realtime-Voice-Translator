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
  topicTitle: string; // หัวข้อหลักของเรื่อง
  overview: string; // สรุปภาพรวมสั้นๆ
  storyNarration?: string; // สรุปเรื่องราวการสนทนาแบบบรรยาย ร้อยเรียงว่าเกิดอะไรขึ้น พูดคุยเรื่องอะไรกัน
  keyTakeaway?: string; // ประเด็นใจความสำคัญที่สุดของการสนทนา
  topics: SummaryTopic[]; // แต่ละหัวข้อย่อยที่สังเคราะห์แล้ว
  actionItems?: string[]; // สิ่งที่ตกลงกัน หรือผลลัพธ์
  keyDetails?: string[]; // รายละเอียดตัวเลข ราคา วันเวลา หรือสาระสำคัญ
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
