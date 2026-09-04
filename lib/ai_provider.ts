/**
 * Karez 2.0 - AI Provider Layer
 *
 * Gemini is the default provider; Alibaba Cloud Qwen (DashScope) is an
 * optional fallback enabled by setting DASHSCOPE_API_KEY. Order is
 * controlled by PROVIDER_ORDER (default "gemini,qwen").
 *
 * HARD RULE: this layer THROWS when every provider/model fails. It never
 * returns synthetic or fallback data — callers must surface the error to
 * the user instead of showing fabricated tender content.
 */

import { GoogleGenAI } from '@google/genai';

export interface InlineImagePart {
  inlineData: { mimeType: string; data: string };
}
export interface TextPart {
  text: string;
}
export type ProviderPart = TextPart | InlineImagePart;

export interface ProviderResult {
  text: string;
  provider: 'gemini' | 'qwen';
  model: string;
}

interface GenerateArgs {
  parts: ProviderPart[];
  systemInstruction?: string;
  timeoutMs?: number;
}

const DEFAULT_GEMINI_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.7-flash',
  'gemini-3.1-pro-preview',
  'gemini-flash-latest',
];

const DEFAULT_QWEN_VISION_MODELS = ['qwen-vl-max', 'qwen-vl-plus'];
const DEFAULT_QWEN_TEXT_MODELS = ['qwen-max', 'qwen-plus'];

function envList(name: string, fallback: string[]): string[] {
  const raw = process.env[name];
  if (!raw) return fallback;
  const list = raw.split(',').map((s) => s.trim()).filter(Boolean);
  return list.length > 0 ? list : fallback;
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${Math.round(ms / 1000)}s`)), ms)
    ),
  ]);
}

function stripCodeFences(text: string): string {
  return text.replace(/```json\n?/gi, '').replace(/```\n?/gi, '').trim();
}

async function tryGemini(args: GenerateArgs, errors: string[]): Promise<ProviderResult | null> {
  // trim() also strips a UTF-8 BOM (U+FEFF) that Windows tooling can prepend
  // when the secret is piped into the deployment platform.
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey) {
    errors.push('gemini: GEMINI_API_KEY not configured');
    return null;
  }

  const ai = new GoogleGenAI({ apiKey });
  const models = envList('GEMINI_MODELS', DEFAULT_GEMINI_MODELS);
  const timeoutMs = args.timeoutMs ?? 50000;

  for (const model of models) {
    try {
      const response = (await withTimeout(
        ai.models.generateContent({
          model,
          contents: { parts: args.parts as any[] },
          config: {
            systemInstruction: args.systemInstruction,
            responseMimeType: 'application/json',
          },
        }),
        timeoutMs,
        `Gemini ${model}`
      )) as any;

      const text = stripCodeFences(response.text || '');
      if (text) {
        return { text, provider: 'gemini', model };
      }
      errors.push(`gemini/${model}: empty response`);
    } catch (err: any) {
      errors.push(`gemini/${model}: ${err?.status || ''} ${err?.message || err}`.trim());
      await new Promise((r) => setTimeout(r, 300));
    }
  }
  return null;
}

async function tryQwen(args: GenerateArgs, errors: string[]): Promise<ProviderResult | null> {
  const apiKey = (process.env.DASHSCOPE_API_KEY || '').trim();
  if (!apiKey) {
    errors.push('qwen: DASHSCOPE_API_KEY not configured');
    return null;
  }

  const baseUrl = (process.env.DASHSCOPE_BASE_URL || 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1').replace(/\/$/, '');
  const hasImages = args.parts.some((p) => 'inlineData' in p);
  const models = hasImages
    ? envList('QWEN_VISION_MODELS', DEFAULT_QWEN_VISION_MODELS)
    : envList('QWEN_TEXT_MODELS', DEFAULT_QWEN_TEXT_MODELS);
  const timeoutMs = args.timeoutMs ?? 50000;

  // Convert parts to OpenAI-compatible message content
  const content: any[] = args.parts.map((p) => {
    if ('text' in p) return { type: 'text', text: p.text };
    return {
      type: 'image_url',
      image_url: { url: `data:${p.inlineData.mimeType};base64,${p.inlineData.data}` },
    };
  });

  const messages: any[] = [];
  if (args.systemInstruction) {
    messages.push({ role: 'system', content: args.systemInstruction });
  }
  messages.push({ role: 'user', content });

  for (const model of models) {
    try {
      const res = (await withTimeout(
        fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({ model, messages }),
        }),
        timeoutMs,
        `Qwen ${model}`
      )) as Response;

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        errors.push(`qwen/${model}: HTTP ${res.status} ${body.slice(0, 200)}`);
        continue;
      }

      const data = await res.json();
      const text = stripCodeFences(data?.choices?.[0]?.message?.content || '');
      if (text) {
        return { text, provider: 'qwen', model };
      }
      errors.push(`qwen/${model}: empty response`);
    } catch (err: any) {
      errors.push(`qwen/${model}: ${err?.message || err}`);
      await new Promise((r) => setTimeout(r, 300));
    }
  }
  return null;
}

/**
 * Runs the prompt through the configured providers in order and returns the
 * first successful raw text response. Throws with a diagnostic message when
 * every provider/model attempt fails — never returns fabricated data.
 *
 * Note: Qwen (DashScope's OpenAI-compatible endpoint) cannot ingest raw PDF
 * inline data; callers sending a whole PDF should expect only Gemini to
 * handle it and fall back to page images for Qwen.
 */
export async function generateWithProviders(args: GenerateArgs): Promise<ProviderResult> {
  const order = envList('PROVIDER_ORDER', ['gemini', 'qwen']);
  const errors: string[] = [];
  const hasPdf = args.parts.some(
    (p) => 'inlineData' in p && p.inlineData.mimeType === 'application/pdf'
  );

  for (const provider of order) {
    let result: ProviderResult | null = null;
    if (provider === 'gemini') {
      result = await tryGemini(args, errors);
    } else if (provider === 'qwen') {
      if (hasPdf) {
        errors.push('qwen: skipped (cannot ingest inline PDF — re-upload as page images to use Qwen)');
      } else {
        result = await tryQwen(args, errors);
      }
    } else {
      errors.push(`unknown provider '${provider}' in PROVIDER_ORDER`);
    }
    if (result) return result;
  }

  throw new Error(
    `All AI providers failed. No synthetic data will be returned. Attempts: ${errors.join(' | ')}`
  );
}
