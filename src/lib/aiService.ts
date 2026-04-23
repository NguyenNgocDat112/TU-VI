import { GoogleGenAI } from '@google/genai';
import { doc, setDoc, serverTimestamp, collection, addDoc, increment } from 'firebase/firestore';
import { db } from './firebase';

const MAX_RETRIES = 3;

/**
 * Ghi nhận số lượt dùng API Key vào CSDL
 */
export async function trackKeyUsage(keyId: string) {
  if (!db || !keyId) return;
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    await setDoc(doc(db, 'api_key_usage', keyId), {
      totalUses: increment(1),
      [`dailyUses.${todayStr}`]: increment(1),
      lastUsedAt: serverTimestamp()
    }, { merge: true });
  } catch (err) {
    console.error("Không thể ghi nhận lượt dùng API:", err);
  }
}

/**
 * Exponential backoff sleep helper
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Dispatch a custom event for the UI to show notifications
 */
export function notifyUser(message: string, type: 'error' | 'info' | 'success' | 'warning' = 'error') {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('app-notification', { 
      detail: { message, type } 
    }));
  }
}

/**
 * Gửi thông báo trực tiếp vào Admin Dashboard / CSDL
 */
async function alertAdmin(errorDetails: any, type: string = 'ResourceExhausted', keyUsed?: string) {
  try {
    if (!db) return;
    await addDoc(collection(db, 'admin_alerts'), {
      type,
      keyUsed: keyUsed || 'Unknown',
      error: errorDetails.message || String(errorDetails),
      timestamp: serverTimestamp(),
      resolved: false
    });
  } catch (err) {
    console.error("Không thể ghi log admin:", err);
  }
}

/**
 * Lấy ngẫu nhiên 1 API key từ danh sách tối đa 5 key kèm theo ID nhận diện
 */
function getRandomApiKey(baseName: string): { key: string, id: string } | undefined {
  const metaEnv = (import.meta as any).env;
  const keys: { key: string, id: string }[] = [];

  const baseKey = metaEnv?.[`VITE_${baseName}`] || 
                  (typeof process !== 'undefined' ? process.env[`VITE_${baseName}`] || process.env[baseName] : undefined);
  if (baseKey) keys.push({ key: baseKey, id: `VITE_${baseName}` });

  for (let i = 1; i <= 5; i++) {
    const varName = `VITE_${baseName}_${i}`;
    const k = metaEnv?.[varName] || 
              (typeof process !== 'undefined' ? process.env[varName] || process.env[`${baseName}_${i}`] : undefined);
    if (k) keys.push({ key: k, id: varName });
  }

  if (keys.length === 0) return undefined;
  
  const randomIndex = Math.floor(Math.random() * keys.length);
  return keys[randomIndex];
}

/**
 * Trả về danh sách thông tin các API Key đang được cấu hình (đã che mã)
 */
export function getAvailableApiKeysInfo() {
  const metaEnv = (import.meta as any).env;
  const keyStats: { id: string, masked: string, provider: string }[] = [];

  const checkKey = (baseName: string, provider: string) => {
    const check = (name: string, plainName: string) => {
      const k = metaEnv?.[name] || (typeof process !== 'undefined' ? (process.env[name] || process.env[plainName]) : undefined);
      if (k && typeof k === 'string') {
        const masked = k.length > 12 ? k.slice(0, 6) + '......' + k.slice(-4) : '***';
        keyStats.push({ id: name, masked, provider });
      }
    };
    check(`VITE_${baseName}`, baseName);
    for(let i=1; i<=5; i++) check(`VITE_${baseName}_${i}`, `${baseName}_${i}`);
  }

  checkKey('GEMINI_API_KEY', 'Gemini');
  checkKey('OPENROUTER_API_KEY', 'OpenRouter');

  return keyStats;
}

async function callOpenRouter(prompt: string, attempt = 0): Promise<string> {
  const keyObj = getRandomApiKey('OPENROUTER_API_KEY');
                 
  if (!keyObj) {
    throw new Error('MISSING_API_KEY');
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${keyObj.key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://ais-dev-y6l5t2btwrj4vneapcgeym-486939816062.asia-east1.run.app',
        'X-Title': 'SOMENH.AI'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-001', 
        messages: [
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 402 || response.status === 429) {
        throw { message: 'QUOTA_EXCEEDED', keyId: keyObj.id };
      }

      if (response.status >= 500 && attempt < MAX_RETRIES) {
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
        await sleep(delay);
        return callOpenRouter(prompt, attempt + 1);
      }
      
      throw { message: `OpenRouter Error (${response.status})`, keyId: keyObj.id };
    }

    const data = await response.json();
    if (!data || !data.choices || data.choices.length === 0) {
      throw { message: 'Empty response from OpenRouter', keyId: keyObj.id };
    }
    
    trackKeyUsage(keyObj.id).catch(console.error);

    return data.choices[0].message?.content || '';
  } catch (error: any) {
    if (error.message === 'QUOTA_EXCEEDED') throw error;

    if (attempt < MAX_RETRIES && (error.message?.includes('fetch') || error.name === 'TypeError')) {
      const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
      await sleep(delay);
      return callOpenRouter(prompt, attempt + 1);
    }
    error.keyId = keyObj.id;
    throw error;
  }
}

export async function getAICompletion(prompt: string, attempt = 0): Promise<string> {
  const geminiKeyInfo = getRandomApiKey('GEMINI_API_KEY');
  const openRouterKeyInfo = getRandomApiKey('OPENROUTER_API_KEY');

  // Xóa các màn hình Toast thông báo khó chịu, tự động chạy ngầm
  const handleExhaustionAndAlert = async (error: any, keyUsed: string) => {
    // Thông báo cho User biết hệ thống bận
    notifyUser('Hệ thống AI đang quá tải hoặc hết tài nguyên. Đã gửi báo cáo tự động đến Quản trị viên. Vui lòng thử lại sau!', 'warning');
    // Ghi log vào Firebase để Admin nhận được
    await alertAdmin(error, 'AI_RESOURCE_EXHAUSTION', keyUsed);
    throw new Error('AI Overloaded - Admin Notified');
  };

  if (geminiKeyInfo) {
    try {
      const ai = new GoogleGenAI({ apiKey: geminiKeyInfo.key });
      const response = await ai.models.generateContent({ 
        model: 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });
      
      trackKeyUsage(geminiKeyInfo.id).catch(console.error);

      return response.text ?? '';
    } catch (geminiError: any) {
      const errStr = String(geminiError).toLowerCase();
      // Nếu hết quota hoặc rate limit của Gemini
      if (errStr.includes('429') || errStr.includes('quota') || errStr.includes('exhausted') || errStr.includes('billing')) {
        if (openRouterKeyInfo) {
          try {
            return await callOpenRouter(prompt);
          } catch (orError: any) {
            await handleExhaustionAndAlert(
              `Gemini Lỗi: ${geminiError} | OpenRouter Lỗi: ${orError.message || orError}`, 
              `Gemini: ${geminiKeyInfo.id} | OpenRouter: ${orError.keyId || openRouterKeyInfo.id}`
            );
          }
        } else {
          await handleExhaustionAndAlert(geminiError, geminiKeyInfo.id);
        }
      }
      
      // Các lỗi khác thì thử fallback OpenRouter
      if (openRouterKeyInfo) {
        try {
          return await callOpenRouter(prompt);
        } catch (orError: any) {
          console.error(orError);
          throw geminiError;
        }
      } else {
        throw geminiError;
      }
    }
  } else if (openRouterKeyInfo) {
    try {
      return await callOpenRouter(prompt);
    } catch (error: any) {
      if (error.message === 'QUOTA_EXCEEDED' || error.message?.includes('429')) {
        await handleExhaustionAndAlert(error.message || error, error.keyId || openRouterKeyInfo.id);
      }
      throw error;
    }
  }
  
  const msg = 'Không có cấu hình API Key nào (Gemini/OpenRouter) khả dụng.';
  await alertAdmin({ message: msg }, 'MISSING_KEYS', 'None');
  notifyUser('Chưa cấu hình AI Key', 'error');
  throw new Error(msg);
}
