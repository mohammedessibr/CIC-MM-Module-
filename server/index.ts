import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { SAP_JOULE_SYSTEM_PROMPT } from './systemPrompt.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 3001;

// ─── Types ───────────────────────────────────────────────────────────────────
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// ─── /api/chat endpoint ───────────────────────────────────────────────────────
app.post('/api/chat', async (req, res) => {
  const { messages }: { messages: ChatMessage[] } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || apiKey === 'your_openai_api_key_here') {
    return res.status(503).json({
      error: 'OpenAI API key not configured.',
      answer:
        '⚠️ SAP Joule requires an OpenAI API key. Please add your `OPENAI_API_KEY` to the `.env` file and restart the server with `npm run server`.',
    });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.4,
        messages: [
          { role: 'system', content: SAP_JOULE_SYSTEM_PROMPT },
          ...messages.map((m) => ({ role: m.role, content: m.content })),
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error((err as any)?.error?.message || `OpenAI error ${response.status}`);
    }

    const data = (await response.json()) as any;
    const answer = data.choices?.[0]?.message?.content ?? "I'm sorry, I couldn't process that.";

    res.json({ answer });
  } catch (error: any) {
    console.error('SAP Joule error:', error?.message || error);
    res.status(500).json({ error: 'Failed to generate response', detail: error?.message });
  }
});

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    assistant: 'SAP Joule',
    openAIConfigured:
      !!process.env.OPENAI_API_KEY &&
      process.env.OPENAI_API_KEY !== 'your_openai_api_key_here',
  });
});

app.listen(port, () => {
  console.log(`🚀 SAP Joule AI Assistant running on http://localhost:${port}`);
  console.log(
    `   OpenAI Key: ${
      process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here'
        ? '✅ Set'
        : '❌ Missing — add OPENAI_API_KEY to .env'
    }`,
  );
});
