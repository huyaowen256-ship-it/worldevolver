// AI Router — unified adapter for DeepSeek / Ollama / Custom models
// Routes to first available provider; each is a drop-in replacement

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.join(__dirname, '..', '.env') });

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:7b';

const CUSTOM_API_KEY = process.env.CUSTOM_API_KEY;
const CUSTOM_BASE_URL = process.env.CUSTOM_BASE_URL;
const CUSTOM_MODEL = process.env.CUSTOM_MODEL;

const CUSTOM2_API_KEY = process.env.CUSTOM2_API_KEY;
const CUSTOM2_BASE_URL = process.env.CUSTOM2_BASE_URL;
const CUSTOM2_MODEL = process.env.CUSTOM2_MODEL;

const MAX_TOKENS = parseInt(process.env.AI_MAX_TOKENS || '2048');
const TEMPERATURE = parseFloat(process.env.AI_TEMPERATURE || '0.8');

// Build the unified /chat completion call for OpenAI-compatible APIs
async function openAICompatibleChat({ baseUrl, apiKey, model, messages, temperature = TEMPERATURE, max_tokens = MAX_TOKENS }) {
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({ model, messages, temperature, max_tokens }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`AI API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? '';
}

// Attempt DeepSeek
async function callDeepSeek(messages) {
  if (!DEEPSEEK_API_KEY) return null;
  try {
    return await openAICompatibleChat({
      baseUrl: DEEPSEEK_BASE_URL,
      apiKey: DEEPSEEK_API_KEY,
      model: DEEPSEEK_MODEL,
      messages,
    });
  } catch (err) {
    console.warn('[AI Router] DeepSeek failed:', err.message);
    return null;
  }
}

// Attempt Ollama (local)
async function callOllama(messages) {
  try {
    return await openAICompatibleChat({
      baseUrl: OLLAMA_BASE_URL,
      apiKey: null,
      model: OLLAMA_MODEL,
      messages,
    });
  } catch (err) {
    console.warn('[AI Router] Ollama failed:', err.message);
    return null;
  }
}

// Attempt Custom 1
async function callCustom1(messages) {
  if (!CUSTOM_API_KEY || !CUSTOM_BASE_URL || !CUSTOM_MODEL) return null;
  try {
    return await openAICompatibleChat({
      baseUrl: CUSTOM_BASE_URL,
      apiKey: CUSTOM_API_KEY,
      model: CUSTOM_MODEL,
      messages,
    });
  } catch (err) {
    console.warn('[AI Router] Custom1 failed:', err.message);
    return null;
  }
}

// Attempt Custom 2
async function callCustom2(messages) {
  if (!CUSTOM2_API_KEY || !CUSTOM2_BASE_URL || !CUSTOM2_MODEL) return null;
  try {
    return await openAICompatibleChat({
      baseUrl: CUSTOM2_BASE_URL,
      apiKey: CUSTOM2_API_KEY,
      model: CUSTOM2_MODEL,
      messages,
    });
  } catch (err) {
    console.warn('[AI Router] Custom2 failed:', err.message);
    return null;
  }
}

// Unified entry point — tries providers in priority order
export async function callAI(messages, { temperature = TEMPERATURE, max_tokens = MAX_TOKENS } = {}) {
  // If messages is a string, wrap in system+user
  const msgArray = typeof messages === 'string'
    ? [
        { role: 'system', content: '你是一个严格遵循指令的AI助手。' },
        { role: 'user', content: messages },
      ]
    : messages;

  // Try in order: DeepSeek → Custom2 → Custom1 → Ollama
  const providers = [
    ['DeepSeek', () => callDeepSeek(msgArray)],
    ['Custom2', () => callCustom2(msgArray)],
    ['Custom1', () => callCustom1(msgArray)],
    ['Ollama', () => callOllama(msgArray)],
  ];

  for (const [name, fn] of providers) {
    const result = await fn();
    if (result !== null) {
      console.log(`[AI Router] ✓ Response from ${name}`);
      return result;
    }
  }

  throw new Error('所有 AI Provider 均不可用，请检查配置');
}

export { MAX_TOKENS, TEMPERATURE };
