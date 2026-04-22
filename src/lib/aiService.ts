import { GoogleGenAI } from '@google/genai';

const MAX_RETRIES = 3;

/**
 * Exponential backoff sleep helper
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Dispatch a custom event for the UI to show notifications
 */
function notifyUser(message: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('app-notification', { 
      detail: { message, type: 'error' } 
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
        'X-Title': 'SOMENH.AI',
      },
      body: JSON.stringify({
        model: 'google/gemma-3-27b-it:free', // Using standard OpenRouter model identifier
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
      
      throw new Error(`OpenRouter error: ${message}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error: any) {
    if (attempt < MAX_RETRIES && (error.message?.includes('fetch') || error.name === 'TypeError')) {
      const delay = Math.pow(2, attempt) * 1000;
      await sleep(delay);
      return callOpenRouter(prompt, attempt + 1);
    }
    throw error;
  }
}

export async function getAICompletion(prompt: string, attempt = 0): Promise<string> {
  const geminiKey = process.env.GEMINI_API_KEY;
  
  if (geminiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const response = await ai.models.generateContent({ 
        model: 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });
      
      return response.text ?? '';
    } catch (error: any) {
      console.error('Gemini API Error details:', error);
      const errorMsg = error.message || '';
      const isRateLimit = errorMsg.includes('429') || errorMsg.includes('RESOURCES_EXHAUSTED') || errorMsg.includes('quota');
      
      // If it's a rate limit and we haven't exhausted retries, try again with backoff
      if (isRateLimit && attempt < MAX_RETRIES) {
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
        console.warn(`Gemini rate limited, retrying in ${Math.round(delay)}ms...`);
        await sleep(delay);
        return getAICompletion(prompt, attempt + 1);
      }

      // If still failing after retries or not a rate limit, fallback to OpenRouter
      console.warn('Gemini API failed permanently or not a retryable error, attempting OpenRouter fallback...', error);
      
      try {
        return await callOpenRouter(prompt);
      } catch (orError: any) {
        // notifyUser handles showing the alert
        throw orError;
      }
    }
  } else {
    console.warn('GEMINI_API_KEY is missing in process.env, trying OpenRouter fallback...');
    return callOpenRouter(prompt);
  }
}
