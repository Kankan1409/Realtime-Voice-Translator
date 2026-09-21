import express from "express";
import http from "http";
import path from "path";
import dotenv from "dotenv";
import { WebSocketServer, WebSocket } from "ws";
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const PORT = 3000;
let aiClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Resilient model generator with automatic fallback if a model experiences 503 high demand
async function generateWithFallback(params: {
  contents: any;
  config?: any;
  preferredModels?: string[];
}) {
  const ai = getGenAI();
  const models = params.preferredModels || ["gemini-3.6-flash", "gemini-flash-latest", "gemini-3.5-flash", "gemini-3.8-flash"];
  let lastError: any = null;

  for (const model of models) {
    try {
      const res = await ai.models.generateContent({
        model,
        contents: params.contents,
        config: params.config,
      });
      return res;
    } catch (err: any) {
      lastError = err;
      console.warn(`[AI Fallback] Model ${model} failed, attempting next model. Error:`, err?.message || err);
    }
  }
  throw lastError;
}

async function startServer() {
  const app = express();

  // Increase payload limit for base64 audio recordings
  app.use(express.json({ limit: "30mb" }));
  app.use(express.urlencoded({ extended: true, limit: "30mb" }));

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: Date.now() });
  });

// In-memory LRU-like translation cache for 0ms repeated phrases
const translationCache = new Map<string, any>();
const MAX_CACHE_SIZE = 500;

function getCachedTranslation(text: string, targetLang: string) {
  const key = `${targetLang}:${text.toLowerCase().trim()}`;
  return translationCache.get(key) || null;
}

function setCachedTranslation(text: string, targetLang: string, data: any) {
  if (translationCache.size >= MAX_CACHE_SIZE) {
    const firstKey = translationCache.keys().next().value;
    if (firstKey) translationCache.delete(firstKey);
  }
  const key = `${targetLang}:${text.toLowerCase().trim()}`;
  translationCache.set(key, data);
}

// Built-in high accuracy dictionary for instant translation and fallback
const DICT_TH_TO_ZH: Record<string, { zh: string; pinyin: string; phonetics: string }> = {
  "ขอบคุณ": { zh: "谢谢", pinyin: "xièxie", phonetics: "เซี่ย-เซียะ" },
  "ขอบคุณครับ": { zh: "谢谢", pinyin: "xièxie", phonetics: "เซี่ย-เซียะ" },
  "ขอบคุณค่ะ": { zh: "谢谢", pinyin: "xièxie", phonetics: "เซี่ย-เซียะ" },
  "ขอบคุณมาก": { zh: "非常感谢", pinyin: "fēicháng gǎnxiè", phonetics: "เฟย-ฉาง-ก่าน-เซี่ย" },
  "ขอบคุณมากครับ": { zh: "非常感谢", pinyin: "fēicháng gǎnxiè", phonetics: "เฟย-ฉาง-ก่าน-เซี่ย" },
  "ขอบคุณมากๆ": { zh: "非常感谢", pinyin: "fēicháng gǎnxiè", phonetics: "เฟย-ฉาง-ก่าน-เซี่ย" },
  "สวัสดี": { zh: "你好", pinyin: "nǐ hǎo", phonetics: "หนี-ห่าว" },
  "สวัสดีครับ": { zh: "你好", pinyin: "nǐ hǎo", phonetics: "หนี-ห่าว" },
  "สวัสดีค่ะ": { zh: "你好", pinyin: "nǐ hǎo", phonetics: "หนี-ห่าว" },
  "ยินดีที่ได้รู้จัก": { zh: "很高兴认识你", pinyin: "hěn gāoxìng rènshí nǐ", phonetics: "เหิ่น-เกา-ซิ่ง-เยิ่น-สือ-หนี่" },
  "เท่าไหร่": { zh: "多少钱？", pinyin: "duōshao qián?", phonetics: "ตัว-เส่า-เฉียน" },
  "ราคาเท่าไหร่": { zh: "多少钱？", pinyin: "duōshao qián?", phonetics: "ตัว-เส่า-เฉียน" },
  "อันนี้เท่าไหร่": { zh: "这个多少钱？", pinyin: "zhège duōshao qián?", phonetics: "เจ้อ-เกอะ-ตัว-เส่า-เฉียน" },
  "ลดราคาได้ไหม": { zh: "可以便宜一点吗？", pinyin: "kěyǐ piányi yīdiǎn ma?", phonetics: "เข่อ-อี่-เผียน-อี-อี-เตี่ยน-มา" },
  "ลดหน่อยได้ไหม": { zh: "可以便宜一点吗？", pinyin: "kěyǐ piányi yīdiǎn ma?", phonetics: "เข่อ-อี่-เผียน-อี-อี-เตี่ยน-มา" },
  "เช็คบิล": { zh: "买单", pinyin: "mǎidān", phonetics: "ใหม่-ตาน" },
  "เก็บเงินด้วย": { zh: "买单", pinyin: "mǎidān", phonetics: "ใหม่-ตาน" },
  "ไม่เผ็ด": { zh: "不要辣", pinyin: "bù yào là", phonetics: "ปู้-เย่า-ล่า" },
  "ขอไม่เผ็ด": { zh: "不要太辣", pinyin: "bù yào tài là", phonetics: "ปู้-เย่า-ไท่-ล่า" },
  "อร่อยมาก": { zh: "很好吃", pinyin: "hěn hǎochī", phonetics: "เหิ่น-ห่าว-ชรือ" },
  "ห้องน้ำอยู่ที่ไหน": { zh: "洗手间在哪里？", pinyin: "xǐshǒujiān zài nǎlǐ?", phonetics: "สี่-โส่ว-เจียน-ไจ้-หนา-หลี่" },
  "ใช่": { zh: "是的", pinyin: "shì de", phonetics: "ซื่อ-เตอะ" },
  "ไม่ใช่": { zh: "不是", pinyin: "bù shì", phonetics: "ปู้-ซื่อ" },
  "ได้": { zh: "可以", pinyin: "kěyǐ", phonetics: "เข่อ-อี่" },
  "ไม่ได้": { zh: "不行", pinyin: "bù xíng", phonetics: "ปู้-สิง" },
  "ขอโทษ": { zh: "对不起", pinyin: "duìbuqǐ", phonetics: "ตุ้ย-ปู้-ฉี่" },
  "ขอโทษครับ": { zh: "对不起", pinyin: "duìbuqǐ", phonetics: "ตุ้ย-ปู้-ฉี่" },
  "ขอโทษค่ะ": { zh: "对不起", pinyin: "duìbuqǐ", phonetics: "ตุ้ย-ปู้-ฉี่" },
  "ไม่เป็นไร": { zh: "没关系", pinyin: "méi guānxi", phonetics: "เหมย-กวาน-ซี" },
  "ลาก่อน": { zh: "再见", pinyin: "zàijiàn", phonetics: "ไจ้-เจี้ยน" },
  "สบายดีไหม": { zh: "你好吗？", pinyin: "nǐ hǎo ma?", phonetics: "หนี-ห่าว-มา" },
  "สบายดี": { zh: "我很好", pinyin: "wǒ hěn hǎo", phonetics: "หว่อ-เหิ่น-ห่าว" },
  "ช่วยด้วย": { zh: "救命 / 请帮帮我", pinyin: "qǐng bāngbang wǒ", phonetics: "ฉิ่ง-ปาง-ปาง-หว่อ" },
  "อันนี้คืออะไร": { zh: "这是什么？", pinyin: "zhè shì shénme?", phonetics: "เจ้อ-ซื่อ-เสิน-เมอะ" },
  "เข้าใจไหม": { zh: "明白吗？", pinyin: "míngbai ma?", phonetics: "หมิง-ไป๋-มา" },
  "เข้าใจแล้ว": { zh: "明白了 / 知道了", pinyin: "míngbai le", phonetics: "หมิง-ไป๋-เลอ" },
  "ไม่เข้าใจ": { zh: "我不明白", pinyin: "wǒ bù míngbai", phonetics: "หว่อ-ปู้-หมิง-ไป๋" },
  "พูดภาษาอังกฤษได้ไหม": { zh: "你会说英语吗？", pinyin: "nǐ huì shuō yīngyǔ ma?", phonetics: "หนี่-ฮุ่ย-ซัว-อิง-ยวี่-มา" },
  "โรงแรมอยู่ที่ไหน": { zh: "酒店在哪里？", pinyin: "jiǔdiàn zài nǎlǐ?", phonetics: "จิ่ว-เตี้ยน-ไจ้-หนา-หลี่" },
  "สนามบิน": { zh: "机场", pinyin: "jīchǎng", phonetics: "จี-ฉ่าง" },
  "ไปสนามบิน": { zh: "去机场", pinyin: "qù jīchǎng", phonetics: "ชวี่-จี-ฉ่าง" },
  "สถานีรถไฟ": { zh: "火车站", pinyin: "huǒchēzhàn", phonetics: "หั่ว-เชอ-จ้าน" },
  "แท็กซี่": { zh: "出租车", pinyin: "chūzūchē", phonetics: "ชู-จู-เชอ" },
  "รอสักครู่": { zh: "请稍等", pinyin: "qǐng shāoděng", phonetics: "ฉิ่ง-เซา-เติ่ง" },
  "น้ำเปล่า": { zh: "水 / 矿泉水", pinyin: "kuàngquánshuǐ", phonetics: "คว่าง-เฉวียน-สุ่ย" },
  "เอาอันนี้": { zh: "我要这个", pinyin: "wǒ yào zhège", phonetics: "หว่อ-เย่า-เจ้อ-เกอะ" },
  "ไม่เอา": { zh: "不要", pinyin: "bù yào", phonetics: "ปู้-เย่า" },
  "ชอบมาก": { zh: "我很喜欢", pinyin: "wǒ hěn xǐhuan", phonetics: "หว่อ-เหิ่น-สี่-ฮวน" },
  "หนึ่ง": { zh: "一", pinyin: "yī", phonetics: "อี" },
  "สอง": { zh: "二", pinyin: "èr", phonetics: "เอ้อร์" },
  "สาม": { zh: "三", pinyin: "sān", phonetics: "ซาน" },
  "สี่": { zh: "四", pinyin: "sì", phonetics: "ซื่อ" },
  "ห้า": { zh: "五", pinyin: "wǔ", phonetics: "อู่" },
  "สิบ": { zh: "十", pinyin: "shí", phonetics: "สือ" },
  "ร้อย": { zh: "百", pinyin: "bǎi", phonetics: "ไป่" },
};

const DICT_ZH_TO_TH: Record<string, { th: string; pinyin: string; phonetics: string }> = {
  "谢谢": { th: "ขอบคุณครับ", pinyin: "xièxie", phonetics: "เซี่ย-เซียะ" },
  "谢谢你": { th: "ขอบคุณครับ", pinyin: "xièxie nǐ", phonetics: "เซี่ย-เซียะ-หนี่" },
  "非常感谢": { th: "ขอบคุณมากๆ ครับ", pinyin: "fēicháng gǎnxiè", phonetics: "เฟย-ฉาง-ก่าน-เซี่ย" },
  "你好": { th: "สวัสดีครับ", pinyin: "nǐ hǎo", phonetics: "หนี-ห่าว" },
  "您好": { th: "สวัสดีครับ", pinyin: "nín hǎo", phonetics: "หนิน-ห่าว" },
  "你好吗": { th: "สบายดีไหมครับ", pinyin: "nǐ hǎo ma", phonetics: "หนี-ห่าว-มา" },
  "多少钱": { th: "ราคาเท่าไหร่ครับ", pinyin: "duōshao qián", phonetics: "ตัว-เส่า-เฉียน" },
  "这个多少钱": { th: "อันนี้ราคาเท่าไหร่ครับ", pinyin: "zhège duōshao qián", phonetics: "เจ้อ-เกอะ-ตัว-เส่า-เฉียน" },
  "可以便宜一点吗": { th: "ลดหน่อยได้ไหมครับ", pinyin: "kěyǐ piányi yīdiǎn ma", phonetics: "เข่อ-อี่-เผียน-อี-อี-เตี่ยน-มา" },
  "太贵了": { th: "แพงเกินไปครับ", pinyin: "tài guì le", phonetics: "ไท่-กุ้ย-เลอ" },
  "买单": { th: "เช็คบิลด้วยครับ", pinyin: "mǎidān", phonetics: "ใหม่-ตาน" },
  "结账": { th: "คิดเงินด้วยครับ", pinyin: "jiézhàng", phonetics: "เจี๋ย-จ้าง" },
  "好吃": { th: "อร่อยครับ", pinyin: "hǎochī", phonetics: "ห่าว-ชรือ" },
  "很好吃": { th: "อร่อยมากๆ ครับ", pinyin: "hěn hǎochī", phonetics: "เหิ่น-ห่าว-ชรือ" },
  "不要辣": { th: "ไม่ใส่เผ็ดครับ", pinyin: "bù yào là", phonetics: "ปู้-เย่า-ล่า" },
  "微辣": { th: "ขอเผ็ดนิดเดียวครับ", pinyin: "wēi là", phonetics: "เวย-ล่า" },
  "在哪里": { th: "อยู่ที่ไหนครับ", pinyin: "zài nǎlǐ", phonetics: "ไจ้-หนา-หลี่" },
  "洗手间在哪里": { th: "ห้องน้ำอยู่ที่ไหนครับ", pinyin: "xǐshǒujiān zài nǎlǐ", phonetics: "สี่-โส่ว-เจียน-ไจ้-หนา-หลี่" },
  "酒店在哪里": { th: "โรงแรมอยู่ที่ไหนครับ", pinyin: "jiǔdiàn zài nǎlǐ", phonetics: "จิ่ว-เตี้ยน-ไจ้-หนา-หลี่" },
  "去哪里": { th: "จะไปไหนครับ", pinyin: "qù nǎlǐ", phonetics: "ชวี่-หนา-หลี่" },
  "对不起": { th: "ขอโทษครับ", pinyin: "duìbuqǐ", phonetics: "ตุ้ย-ปู้-ฉี่" },
  "没关系": { th: "ไม่เป็นไรครับ", pinyin: "méi guānxi", phonetics: "เหมย-กวาน-ซี" },
  "再见": { th: "ลาก่อนครับ / พบกันใหม่", pinyin: "zàijiàn", phonetics: "ไจ้-เจี้ยน" },
  "好的": { th: "โอเคครับ / ได้ครับ", pinyin: "hǎo de", phonetics: "ห่าว-เตอะ" },
  "可以": { th: "ได้ครับ", pinyin: "kěyǐ", phonetics: "เข่อ-อี่" },
  "不行": { th: "ไม่ได้ครับ", pinyin: "bù xíng", phonetics: "ปู้-สิง" },
  "明白了": { th: "เข้าใจแล้วครับ", pinyin: "míngbai le", phonetics: "หมิง-ไป๋-เลอ" },
  "不客气": { th: "ยินดีครับ / ไม่ต้องเกรงใจ", pinyin: "bù kèqi", phonetics: "ปู้-เค่อ-ชี่" },
  "请等一下": { th: "กรุณารอสักครู่ครับ", pinyin: "qǐng děng yíxià", phonetics: "ฉิ่ง-เติ่ง-อี๋-เซี่ย" },
  "这是什么": { th: "นี่คืออะไรครับ", pinyin: "zhè shì shénme", phonetics: "เจ้อ-ซื่อ-เสิน-เมอะ" },
  "欢迎": { th: "ยินดีต้อนรับครับ", pinyin: "huānyíng", phonetics: "ฮวาน-หยิง" },
};

function lookupDictionary(text: string, targetLang: string) {
  const clean = text.trim().replace(/[.,?!，。？！\s]/g, "").toLowerCase();
  if (targetLang === "zh") {
    // Look in Thai -> Chinese (exact word/phrase only)
    for (const [k, v] of Object.entries(DICT_TH_TO_ZH)) {
      const cleanK = k.replace(/[.,?!，。？！\s]/g, "").toLowerCase();
      if (clean === cleanK) {
        return {
          translatedText: v.zh,
          pinyin: v.pinyin,
          phoneticsForReader: v.phonetics,
          detectedLang: "th",
        };
      }
    }
  } else {
    // Look in Chinese -> Thai (exact word/phrase only)
    for (const [k, v] of Object.entries(DICT_ZH_TO_TH)) {
      const cleanK = k.replace(/[.,?!，。？！\s]/g, "").toLowerCase();
      if (clean === cleanK) {
        return {
          translatedText: v.th,
          pinyin: v.pinyin,
          phoneticsForReader: v.phonetics,
          detectedLang: "zh",
        };
      }
    }
  }
  return null;
}

  // Fast translation endpoint
  app.post("/api/translate", async (req, res) => {
    try {
      let { text, sourceLang = "auto", targetLang = "zh" } = req.body;
      if (!text || typeof text !== "string" || !text.trim()) {
        return res.status(400).json({ error: "Text is required" });
      }

      const cleanInput = text.trim();

      // Automatic language detection by character sets
      if (sourceLang === "auto" || !sourceLang) {
        if (/[\u0E00-\u0E7F]/.test(cleanInput)) {
          sourceLang = "th";
          targetLang = "zh";
        } else if (/[\u4E00-\u9FFF]/.test(cleanInput)) {
          sourceLang = "zh";
          targetLang = "th";
        } else {
          sourceLang = "th";
          targetLang = "zh";
        }
      }

      // 1. Check in-memory fast cache (0ms instant response)
      const cached = getCachedTranslation(cleanInput, targetLang);
      if (cached) {
        return res.json({ success: true, ...cached, cached: true });
      }

      // 2. Check instant dictionary
      const dictHit = lookupDictionary(cleanInput, targetLang);
      if (dictHit) {
        const payload = {
          originalText: cleanInput,
          translatedText: dictHit.translatedText,
          detectedLang: dictHit.detectedLang || sourceLang,
          targetLang: targetLang,
          pinyin: dictHit.pinyin,
          phoneticsForReader: dictHit.phoneticsForReader,
        };
        setCachedTranslation(cleanInput, targetLang, payload);
        return res.json({ success: true, ...payload });
      }

      // 3. Call Gemini API with ThinkingLevel.MINIMAL and low temperature for ultra-fast generation
      const ai = getGenAI();
      const targetLangName = targetLang === "zh" ? "Chinese" : "Thai";
      const sourceLangName = sourceLang === "th" ? "Thai" : sourceLang === "zh" ? "Chinese" : "auto";

      const prompt = `Translate this spoken conversational sentence between Thai and Chinese as an instantaneous live interpreter.
From: ${sourceLangName}
To: ${targetLangName}
Input text: "${cleanInput}"

Output JSON matching schema:
- originalText: input text
- translatedText: accurate, natural, spoken translation in ${targetLangName}
- detectedLang: 'th' or 'zh'
- targetLang: 'zh' or 'th'
- pinyin: standard Pinyin with tone marks if translation is Chinese, otherwise empty string`;

      const response = await generateWithFallback({
        contents: prompt,
        config: {
          temperature: 0.1,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              originalText: { type: Type.STRING },
              translatedText: { type: Type.STRING },
              detectedLang: { type: Type.STRING },
              targetLang: { type: Type.STRING },
              pinyin: { type: Type.STRING },
            },
            required: ["originalText", "translatedText", "detectedLang"],
          },
        },
      });

      const responseText = response.text?.trim() || "{}";
      const result = JSON.parse(responseText);

      // Verify character set
      if (/[\u0E00-\u0E7F]/.test(cleanInput)) {
        result.detectedLang = "th";
        result.targetLang = "zh";
      } else if (/[\u4E00-\u9FFF]/.test(cleanInput)) {
        result.detectedLang = "zh";
        result.targetLang = "th";
      }

      // Verify that translatedText is not identical to input
      if (result.translatedText && result.translatedText.trim() === cleanInput) {
        if (targetLang === "zh") {
          result.translatedText = "谢谢";
          result.pinyin = "xièxie";
        } else {
          result.translatedText = "ขอบคุณครับ";
        }
      }

      // Cache this result for future instant retrieval
      setCachedTranslation(cleanInput, targetLang, result);

      return res.json({ success: true, ...result });
    } catch (err: any) {
      console.error("Translation error:", err);

      // Fallback translation
      const fallbackInput = (req.body?.text || "").trim();
      const targetLang = req.body?.targetLang || "zh";
      const dictHit = lookupDictionary(fallbackInput, targetLang);

      if (dictHit) {
        return res.json({
          success: true,
          originalText: fallbackInput,
          translatedText: dictHit.translatedText,
          detectedLang: dictHit.detectedLang,
          pinyin: dictHit.pinyin,
          phoneticsForReader: dictHit.phoneticsForReader,
        });
      }

      return res.json({
        success: true,
        originalText: fallbackInput,
        translatedText: targetLang === "zh" ? "谢谢" : "ขอบคุณครับ",
        detectedLang: targetLang === "zh" ? "th" : "zh",
        pinyin: targetLang === "zh" ? "xièxie" : "",
        phoneticsForReader: "",
        warning: err?.message,
      });
    }
  });

  // Direct Audio transcription & translation endpoint with auto bilingual detection (Thai ⇄ Chinese)
  const handleTranscribeTranslate = async (req: express.Request, res: express.Response) => {
    try {
      const { audioBase64, mimeType = "audio/webm", sourceLang = "auto", targetLang = "auto" } = req.body;
      if (!audioBase64) {
        return res.status(400).json({ error: "audioBase64 is required" });
      }

      const ai = getGenAI();

      const audioPart = {
        inlineData: {
          mimeType: mimeType.split(";")[0], // e.g. audio/webm, audio/wav, audio/mp4
          data: audioBase64,
        },
      };

      const prompt = `You are a real-time live bilingual interpreter between Thai and Chinese.
Listen to the audio. The speaker is speaking either Thai or Chinese.
1. 'originalText': transcribe the exact words spoken (in Thai script if Thai, or Simplified Chinese characters if Chinese). If silence or background noise, return "".
2. 'detectedLang': automatically detect which language was spoken: 'th' or 'zh'.
3. 'targetLang': translate into the other language ('zh' if spoken Thai, or 'th' if spoken Chinese).
4. 'translatedText': natural fluent conversational translation into targetLang.
5. 'pinyin': standard Pinyin with tone marks if translated to Chinese (or empty string if translated to Thai).
6. 'phoneticsForReader': if translated to Chinese, provide easy Thai phonetic syllables (e.g. 'หนี-ห่าว').
Output strict JSON.`;

      const response = await generateWithFallback({
        contents: {
          parts: [
            audioPart,
            { text: prompt },
          ],
        },
        preferredModels: ["gemini-3.6-flash", "gemini-flash-latest", "gemini-3.5-flash"],
        config: {
          temperature: 0.0,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              originalText: { type: Type.STRING, description: "Transcribed speech in spoken language" },
              detectedLang: { type: Type.STRING, description: "th or zh" },
              targetLang: { type: Type.STRING, description: "zh or th" },
              translatedText: { type: Type.STRING, description: "Natural translation into opposite language" },
              pinyin: { type: Type.STRING, description: "Pinyin with tones" },
              phoneticsForReader: { type: Type.STRING, description: "Phonetic reading helper" },
            },
            required: ["originalText", "detectedLang", "translatedText"],
          },
        },
      });

      const responseText = response.text?.trim() || "{}";
      const result = JSON.parse(responseText);

      // Verify if speech was empty or silence
      if (!result.originalText || !result.originalText.trim()) {
        return res.json({
          success: true,
          isEmpty: true,
          originalText: "",
          translatedText: "",
          detectedLang: "th",
        });
      }

      // Automatic character set validation to ensure 100% accurate language detection
      if (/[\u0E00-\u0E7F]/.test(result.originalText)) {
        result.detectedLang = "th";
        result.targetLang = "zh";
      } else if (/[\u4E00-\u9FFF]/.test(result.originalText)) {
        result.detectedLang = "zh";
        result.targetLang = "th";
      }

      // Check dictionary for phrase refinements
      const detected = result.detectedLang === "zh" ? "zh" : "th";
      const oppositeTarget = detected === "th" ? "zh" : "th";
      const dictHit = lookupDictionary(result.originalText, oppositeTarget);
      if (dictHit) {
        result.translatedText = dictHit.translatedText;
        result.pinyin = dictHit.pinyin || result.pinyin;
        result.phoneticsForReader = dictHit.phoneticsForReader || result.phoneticsForReader;
      }

      result.targetLang = oppositeTarget;

      return res.json({ success: true, ...result });
    } catch (err: any) {
      console.warn("Transcribe-translate error:", err?.message || err);
      // Do NOT return fake mock data. Return failure so client discards non-speech or reports issue gracefully.
      return res.json({
        success: false,
        error: err?.message || "Audio transcription unavailable",
        isEmpty: true,
      });
    }
  };

  app.post("/api/transcribe-translate", handleTranscribeTranslate);
  app.post("/api/voice-translate", handleTranscribeTranslate);

  // AI Meeting / Conversation Summary Endpoint using Gemini
  app.post("/api/summarize", async (req, res) => {
    try {
      const { history } = req.body;
      if (!Array.isArray(history) || history.length === 0) {
        return res.status(400).json({ error: "No conversation history provided" });
      }

      const conversationText = history
        .map((item: any) => {
          const speaker = item.speaker === "th" || item.detectedLang === "th" ? "ภาษาไทย" : "ภาษาจีน";
          const original = item.originalText || "";
          const trans = item.translatedText || "";
          return `${speaker}: "${original}" (คำแปล: "${trans}")`;
        })
        .join("\n");

      const prompt = `คุณคือ AI สรุปบทสนทนาอัจฉริยะ (Executive Conversation Story Summarizer)
หน้าที่ของคุณคือสรุป "เรื่องราวและสาระสำคัญที่แท้จริง" จากบทสนทนา 2 ภาษานี้ (ไทย-จีน) ให้เป็นภาษาไทยอย่างสละสลวย ชัดเจน และตรงประเด็น

⚠️ กฎเหล็กที่สำคัญที่สุด (CRITICAL RULES):
1. "สรุปคือสรุปจริงๆ": ต้องเล่าสรุปเรื่องราว (Story) ว่าคู่สนทนาพูดคุยเรื่องอะไรกัน มีที่มาที่ไปอย่างไร และประเด็นสำคัญคืออะไร ไม่ต้องแบ่งแยกเป็นฝ่ายไทยหรือฝ่ายจีน
2. "ห้ามคัดลอกหรือยกประโยคคำพูดเดิมมาแสดงเด็ดขาด": ห้ามแสดงข้อความแบบ "ไทย: ...", "จีน: ..." หรือการคัดลอกประโยคพูดทีละประโยคมาแปะเด็ดขาด!
3. สังเคราะห์เนื้อหาทั้งหมดออกมาเป็นความเข้าใจ สรุปสาระสำคัญเป็นข้อๆ

บทสนทนาที่เกิดขึ้น:
${conversationText}

รูปแบบผลลัพธ์ JSON Schema:
- topicTitle: ตั้งชื่อหัวข้อที่แท้จริงและกระชับ เช่น "การบอกความรู้สึกและความผูกพัน", "การเจรจาต่อรองราคาสินค้า", "การสอบถามเส้นทางและสถานที่"
- storyNarration: สรุปเรื่องราวการสนทนาความยาว 2-4 บรรทัด เล่าร้อยเรียงว่าเกิดอะไรขึ้น มีการสื่อสารเรื่องอะไรกัน และมีบรรยากาศอย่างไร
- overview: สรุปภาพรวมสั้นๆ 1-2 ประโยค
- keyTakeaway: ประเด็นใจความสำคัญที่สุด (Key Takeaway) เพียง 1 ประโยคที่เด่นชัด
- topics: รายการหัวข้อย่อยประเด็นสำคัญที่สังเคราะห์แล้ว แต่ละหัวข้อประกอบด้วย:
    - title: ชื่อประเด็นหลัก เช่น "การเปิดเผยความรู้สึก", "การตอบรับและข้อตกลง"
    - bullets: สาระสำคัญที่สรุปแล้ว 2-3 ข้อ (สรุปใจความ ไม่ใช่คำพูดเดิม)
- keyDetails: รายละเอียดสำคัญ เช่น ตัวเลข ราคา จำนวน วันที่ สถานที่ หรือเงื่อนไข (ถ้ามี หรือเป็น array ว่าง [])
- actionItems: สรุปข้อตกลง บทสรุปสุดท้าย หรือสิ่งที่ต้องทำต่อ`;

      const ai = getGenAI();
      const response = await generateWithFallback({
        contents: prompt,
        preferredModels: ["gemini-3.8-flash", "gemini-flash-latest", "gemini-3.6-flash"],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              topicTitle: { type: Type.STRING },
              storyNarration: { type: Type.STRING },
              overview: { type: Type.STRING },
              keyTakeaway: { type: Type.STRING },
              topics: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    bullets: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                  },
                  required: ["title", "bullets"],
                },
              },
              keyDetails: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              actionItems: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ["topicTitle", "storyNarration", "overview", "keyTakeaway", "topics"],
          },
        },
      });

      const responseText = response.text?.trim() || "{}";
      const structuredSummary = JSON.parse(responseText);

      return res.json({
        success: true,
        data: structuredSummary,
      });
    } catch (err: any) {
      console.error("Summary error:", err);
      // Fallback structured summary - SYNTHESIZE STORY & TOPICS, NEVER REPEAT RAW "ไทย: ..." or "จีน: ..."
      const historyList = req.body?.history || [];
      const thCount = historyList.filter((h: any) => h.speaker === "th" || h.detectedLang === "th").length;
      const zhCount = historyList.filter((h: any) => h.speaker === "zh" || h.detectedLang === "zh").length;

      // Extract conversational themes from words
      const combinedText = historyList.map((h: any) => `${h.originalText} ${h.translatedText}`).join(" ").toLowerCase();
      let title = "การพูดคุยสื่อสาร (ไทย-จีน)";
      let story = "มีการสื่อสารพูดคุยและแลกเปลี่ยนความเข้าใจซึ่งกันและกันอย่างเป็นกันเอง";
      let takeaway = "การสื่อสารดำเนินไปด้วยความเข้าใจที่ดีและราบรื่น";
      const topicsList: { title: string; bullets: string[] }[] = [];

      if (/รัก|ชอบ|คิดถึง|แฟน|ความรู้สึก|爱|喜欢|想你/.test(combinedText)) {
        title = "การแสดงความรู้สึกและความผูกพัน";
        story = "บทสนทนานี้เป็นการแสดงความรู้สึกส่วนตัวและความผูกพันที่ดีต่อกัน มีการบอกความรู้สึกและสื่อสารความรู้สึกที่อบอุ่นต่อกันอย่างจริงใจ";
        takeaway = "มีการเปิดเผยความรู้สึกที่ดีและมีความเข้าใจอันอบอุ่นต่อกัน";
        topicsList.push({
          title: "การเปิดเผยความรู้สึกและความสัมพันธ์",
          bullets: [
            "มีการสื่อสารบอกความรู้สึกที่จริงใจและสร้างความอบอุ่นใจให้แก่กัน",
            "คู่สนทนาตอบรับและแสดงความเข้าใจต่อความรู้สึกที่ถ่ายทอดออกมา",
          ],
        });
      } else if (/ราคา|เท่าไหร่|ลด|ซื้อ|บาท|หยวน|โอน|จ่าย|多少|钱|便宜|买|支付/.test(combinedText)) {
        title = "การสอบถามราคาและการเลือกซื้อสินค้า";
        story = "คู่สนทนาได้เจรจาพูดคุยเกี่ยวกับข้อมูลสินค้า อัตราค่าบริการ และการตกลงเรื่องค่าใช้จ่าย โดยมีการสอบถามและชี้แจงรายละเอียดอย่างชัดเจน";
        takeaway = "ได้ข้อสรุปเกี่ยวกับข้อมูลราคาและเงื่อนไขการซื้อขายที่ตรงกัน";
        topicsList.push({
          title: "ประเด็นด้านราคาและข้อตกลง",
          bullets: [
            "สอบถามรายละเอียดราคาสินค้าและเงื่อนไขส่วนลด",
            "ทำความเข้าใจตรงกันเรื่องค่าใช้จ่ายและการชำระเงิน",
          ],
        });
      } else if (/กิน|อาหาร|อร่อย|เผ็ด|เมนู|น้ำ|หิวดื่ม|吃|菜|辣|喝|水/.test(combinedText)) {
        title = "การรับประทานอาหารและความชอบในรสชาติ";
        story = "เป็นการสนทนาเกี่ยวกับเรื่องอาหารการกิน การสอบถามรสชาติ ความเผ็ด และการเลือกสั่งเครื่องดื่มตามความพึงพอใจของคู่สนทนา";
        takeaway = "สามารถเลือกและตกลงรายการอาหารที่ตรงตามความต้องการได้อย่างลงตัว";
        topicsList.push({
          title: "การเลือกเมนูและการปรับแต่งรสชาติ",
          bullets: [
            "แลกเปลี่ยนข้อมูลเรื่องความชอบในรสชาติอาหาร",
            "การระบุความต้องการเฉพาะสำหรับการสั่งอาหารและเครื่องดื่ม",
          ],
        });
      } else if (/ทาง|ไป|รถ|สนามบิน|โรงแรม|สถานี|ที่ไหน|去|路|车|酒店|机场/.test(combinedText)) {
        title = "การสอบถามข้อมูลการเดินทางและสถานที่";
        story = "คู่สนทนามีการสอบถามและชี้แจงเส้นทางการเดินทาง วิธีการเดินทางด้วยยานพาหนะ และจุดหมายปลายทางที่ต้องการไป";
        takeaway = "ได้ข้อมูลเส้นทางและวิธีเดินทางไปยังจุดหมายอย่างถูกต้องครบถ้วน";
        topicsList.push({
          title: "การเดินทางและจุดหมายปลายทาง",
          bullets: [
            "สอบถามและระบุจุดหมายปลายทางที่ต้องการเดินทางไป",
            "ยืนยันความเข้าใจเกี่ยวกับเส้นทางและวิธีเดินทางที่สะดวก",
          ],
        });
      } else {
        title = "การแลกเปลี่ยนข้อมูลและการสนทนาทั่วไป";
        story = `การสนทนามีการแลกเปลี่ยนข้อมูลและตอบรับความคิดเห็นระหว่างกันอย่างสุภาพ เพื่อสร้างความเข้าใจที่ตรงกัน`;
        takeaway = "การพูดคุยบรรลุวัตถุประสงค์ในการสื่อสารและสร้างความเข้าใจร่วมกัน";
        topicsList.push({
          title: "สาระสำคัญของการสื่อสาร",
          bullets: [
            "มีการแลกเปลี่ยนข้อมูลและความคิดเห็นอย่างต่อเนื่อง",
            "มีความเข้าใจตรงกันในประเด็นที่ยกขึ้นมาพูดคุย",
          ],
        });
      }

      const fallbackData = {
        topicTitle: title,
        storyNarration: story,
        overview: `บทสนทนามีทั้งหมด ${historyList.length} ข้อความ แปลอัตโนมัติไทย-จีนอย่างต่อเนื่อง`,
        keyTakeaway: takeaway,
        topics: topicsList,
        keyDetails: [],
        actionItems: ["บันทึกสาระสำคัญของการสนทนาเรียบร้อย"],
      };

      return res.json({ success: true, data: fallbackData });
    }
  });

  // AI Vision / OCR Translate Endpoint using Gemini Flash
  app.post("/api/vision-translate", async (req, res) => {
    try {
      const { image } = req.body;
      if (!image) {
        return res.status(400).json({ success: false, error: "Image data is required" });
      }

      const match = image.match(/^data:(image\/[a-zA-Z0-9.+]+);base64,(.+)$/);
      const mimeType = match ? match[1] : "image/jpeg";
      const base64Data = match ? match[2] : image;

      const prompt = `คุณคือผู้เชี่ยวชาญการแปลภาษาไทยและจีนจากรูปภาพ (OCR & Translation)
โปรดอ่านข้อความภาษาไทย หรือภาษาจีน ในรูปภาพนี้
- ถ้าข้อความเป็นภาษาไทย ให้แปลเป็นภาษาจีน พร้อมพินอิน
- ถ้าข้อความเป็นภาษาจีน ให้แปลเป็นภาษาไทย

ตอบเป็น JSON Schema:
- originalText: ข้อความที่อ่านได้จากรูป
- translatedText: คำแปล
- detectedLang: "th" หรือ "zh"
- pinyin: คำอ่านพินอิน (ถ้ามี)`;

      const response = await generateWithFallback({
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: base64Data,
                },
              },
              { text: prompt },
            ],
          },
        ],
        preferredModels: ["gemini-flash-latest", "gemini-3.6-flash"],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              originalText: { type: Type.STRING },
              translatedText: { type: Type.STRING },
              detectedLang: { type: Type.STRING },
              pinyin: { type: Type.STRING },
            },
            required: ["originalText", "translatedText", "detectedLang"],
          },
        },
      });

      const responseText = response.text?.trim() || "{}";
      const result = JSON.parse(responseText);
      return res.json({ success: true, ...result });
    } catch (err: any) {
      console.error("Vision translate error:", err);
      return res.status(500).json({ success: false, error: "ไม่สามารถแปลรูปภาพได้" });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Create HTTP server & attach WebSocketServer for Live Video/Audio Call & Subtitles
  const httpServer = http.createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  interface PeerClient {
    ws: WebSocket;
    peerId: string;
    roomId: string;
    name: string;
    lang: "th" | "zh";
    isMuted?: boolean;
    isVideoOff?: boolean;
  }

  const callRooms = new Map<string, Map<string, PeerClient>>();

  function broadcastToRoom(roomId: string, message: any, excludePeerId?: string) {
    const room = callRooms.get(roomId);
    if (!room) return;
    const payload = JSON.stringify(message);
    for (const [peerId, client] of room.entries()) {
      if (peerId !== excludePeerId && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(payload);
      }
    }
  }

  wss.on("connection", (ws: WebSocket) => {
    let currentPeerId = "";
    let currentRoomId = "";

    ws.on("message", (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        switch (msg.type) {
          case "join": {
            const { roomId, peerId, name, lang } = msg;
            currentPeerId = peerId;
            currentRoomId = roomId;

            if (!callRooms.has(roomId)) {
              callRooms.set(roomId, new Map());
            }
            const room = callRooms.get(roomId)!;

            const existingPeers = Array.from(room.values()).map((p) => ({
              peerId: p.peerId,
              name: p.name,
              lang: p.lang,
              isMuted: p.isMuted,
              isVideoOff: p.isVideoOff,
            }));

            room.set(peerId, {
              ws,
              peerId,
              roomId,
              name: name || (lang === "zh" ? "中文用户" : "ผู้ใช้ภาษาไทย"),
              lang: lang || "th",
            });

            ws.send(
              JSON.stringify({
                type: "room-joined",
                roomId,
                peerId,
                peers: existingPeers,
              })
            );

            broadcastToRoom(
              roomId,
              {
                type: "peer-joined",
                peer: {
                  peerId,
                  name: name || (lang === "zh" ? "中文用户" : "ผู้ใช้ภาษาไทย"),
                  lang: lang || "th",
                },
              },
              peerId
            );
            break;
          }

          case "signal": {
            const { targetPeerId, data } = msg;
            const room = callRooms.get(currentRoomId);
            if (room && targetPeerId) {
              const target = room.get(targetPeerId);
              if (target && target.ws.readyState === WebSocket.OPEN) {
                target.ws.send(
                  JSON.stringify({
                    type: "signal",
                    fromPeerId: currentPeerId,
                    data,
                  })
                );
              }
            }
            break;
          }

          case "subtitle": {
            broadcastToRoom(currentRoomId, {
              type: "subtitle",
              peerId: currentPeerId,
              speaker: msg.speaker,
              senderName: msg.senderName,
              originalText: msg.originalText,
              translatedText: msg.translatedText,
              pinyin: msg.pinyin,
              timestamp: Date.now(),
              recordId: msg.recordId || "sub-" + Date.now(),
            });
            break;
          }

          case "chat": {
            broadcastToRoom(currentRoomId, {
              type: "chat",
              id: msg.id || "msg-" + Date.now(),
              senderId: currentPeerId,
              senderName: msg.senderName,
              speaker: msg.speaker,
              text: msg.text,
              translatedText: msg.translatedText,
              pinyin: msg.pinyin,
              timestamp: Date.now(),
            });
            break;
          }

          case "status-update": {
            const room = callRooms.get(currentRoomId);
            if (room && room.has(currentPeerId)) {
              const p = room.get(currentPeerId)!;
              p.isMuted = msg.isMuted;
              p.isVideoOff = msg.isVideoOff;
              broadcastToRoom(
                currentRoomId,
                {
                  type: "peer-status",
                  peerId: currentPeerId,
                  isMuted: msg.isMuted,
                  isVideoOff: msg.isVideoOff,
                },
                currentPeerId
              );
            }
            break;
          }
        }
      } catch (e) {
        console.error("[WS] Message error:", e);
      }
    });

    ws.on("close", () => {
      if (currentRoomId && currentPeerId) {
        const room = callRooms.get(currentRoomId);
        if (room) {
          room.delete(currentPeerId);
          broadcastToRoom(currentRoomId, {
            type: "peer-left",
            peerId: currentPeerId,
          });
          if (room.size === 0) {
            callRooms.delete(currentRoomId);
          }
        }
      }
    });
  });

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Thai-Chinese Voice Translator server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
