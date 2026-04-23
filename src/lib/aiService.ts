import { GoogleGenAI } from '@google/genai';

const MAX_RETRIES = 3;

/**
 * Exponential backoff sleep helper
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Dispatch a custom event for the UI to show notifications
 */
export function notifyUser(message: string, type: 'error' | 'info' = 'error') {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('app-notification', { 
      detail: { message, type } 
    }));
  }
}

async function callOpenRouter(prompt: string, attempt = 0): Promise<string> {
  const metaEnv = (import.meta as any).env;
  const apiKey = (metaEnv?.VITE_OPENROUTER_API_KEY) || 
                 (process.env.VITE_OPENROUTER_API_KEY) || 
                 (process.env.OPENROUTER_API_KEY);
                 
  if (!apiKey) {
    console.warn('OpenRouter API key is missing, fallback unavailable.');
    throw new Error('Dịch vụ AI hiện tại đang quá tải và không có khóa dự phòng. Vui lòng thử lại sau.');
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://ais-dev-y6l5t2btwrj4vneapcgeym-486939816062.asia-east1.run.app',
        'X-Title': 'SOMENH.AI'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-001', // Using reliable free model
        messages: [
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData.error?.message || response.statusText;
      
      // Retry on rate limit (429) or server errors (5xx)
      if ((response.status === 429 || response.status >= 500) && attempt < MAX_RETRIES) {
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
        console.warn(`OpenRouter task failed (${response.status}), retrying in ${Math.round(delay)}ms...`);
        await sleep(delay);
        return callOpenRouter(prompt, attempt + 1);
      }
      
      throw new Error(`OpenRouter Error (${response.status}): ${message}`);
    }

    const data = await response.json();
    if (!data || !data.choices || data.choices.length === 0) {
      throw new Error('Empty response from OpenRouter');
    }
    
    return data.choices[0].message?.content || '';
  } catch (error: any) {
    const errorMsg = error.message || '';
    if (attempt < MAX_RETRIES && (errorMsg.includes('fetch') || errorMsg.includes('429') || error.name === 'TypeError')) {
      const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
      await sleep(delay);
      return callOpenRouter(prompt, attempt + 1);
    }
    throw error;
  }
}

export async function getAICompletion(prompt: string, attempt = 0): Promise<string> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const metaEnv = (import.meta as any).env;
  const openRouterKey = (metaEnv?.VITE_OPENROUTER_API_KEY) || 
                        (process.env.VITE_OPENROUTER_API_KEY) || 
                        (process.env.OPENROUTER_API_KEY);

  // Ưu tiên Gemini API trực tiếp (thường ổn định hơn trong môi trường này)
  if (geminiKey) {
    try {
      if (attempt === 0) notifyUser('Đang truy vấn bằng Gemini API...', 'info');
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const response = await ai.models.generateContent({ 
        model: 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });
      return response.text ?? '';
    } catch (geminiError: any) {
      console.warn('Gemini API failed, attempting OpenRouter fallback...', geminiError);
      
      if (openRouterKey) {
        try {
          notifyUser('Gemini quá tải, đang chuyển sang OpenRouter dự phòng...', 'info');
          return await callOpenRouter(prompt);
        } catch (orError: any) {
          console.error('OpenRouter Fallback Error:', orError);
          throw geminiError; // Ném lỗi gốc nếu cả hai đều thất bại
        }
      } else {
        throw geminiError;
      }
    }
  } else if (openRouterKey) {
    // Nếu không có Gemini, dùng OpenRouter làm chính
    try {
      if (attempt === 0) notifyUser('Đang truy vấn bằng OpenRouter API...', 'info');
      return await callOpenRouter(prompt);
    } catch (error: any) {
      throw error;
    }
  }
  
  throw new Error('Không có cấu hình API Key nào (Gemini hoặc OpenRouter) khả dụng.');
}
