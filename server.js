import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

dotenv.config();
const app = express();
const port = Number(process.env.PORT || 3000);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '32kb' }));
app.use('/api/', rateLimit({ windowMs: 60_000, limit: 20, standardHeaders: 'draft-7', legacyHeaders: false }));
app.use(express.static(__dirname));

app.get('/api/health', (_req, res) => res.json({ configured: Boolean(ai), provider: 'Google Gemini' }));

const systemInstruction = `You are Pulse, the intelligent fitness and wellness coach inside FITPULSE. Be as conversational, capable, clear, and context-aware as a high-quality general AI assistant, while specializing in fitness, exercise, nutrition, recovery, habits, and goal planning. Understand follow-up questions using the supplied conversation history. Ask a concise clarifying question when important information is missing. Personalize suggestions only from facts the user actually shares; never invent health data or claim to read wearable devices. Give practical, structured answers with realistic progression and alternatives for different fitness levels. Be supportive and non-judgmental. For nutrition, avoid extreme restriction and explain that calorie/protein needs vary. For pain, injury, pregnancy, chronic conditions, medication, eating disorders, or other medical concerns, recommend an appropriately qualified healthcare professional and do not diagnose. Mention emergency care for urgent symptoms. Do not claim to have changed dashboard data unless an actual app action has done so. You are an AI assistant, not a doctor. Keep replies readable and appropriately detailed.`;

app.post('/api/chat', async (req, res) => {
  try {
    if (!ai) return res.status(503).json({ error: 'Gemini is not configured yet. Add GEMINI_API_KEY to your .env file and restart the server.' });
    const messages = Array.isArray(req.body?.messages) ? req.body.messages.slice(-20) : [];
    if (!messages.length) return res.status(400).json({ error: 'Send a message to start chatting.' });
    const contents = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: String(m.text || '').slice(0, 6000) }]
    })).filter(m => m.parts[0].text.trim());
    if (!contents.length || contents[contents.length - 1].role !== 'user') return res.status(400).json({ error: 'The latest message must be from you.' });
    const ctx = req.body?.fitnessContext || {};
    const safeContext = `\n\nFITPULSE context supplied by the app (may be incomplete): display name: ${String(ctx.name || 'not provided').slice(0,80)}; logged water today: ${Number.isFinite(Number(ctx.waterLiters)) ? Number(ctx.waterLiters) : 'unknown'} L; logged food calories today: ${Number.isFinite(Number(ctx.foodCalories)) ? Number(ctx.foodCalories) : 'unknown'}. Treat these as user-entered demo tracker values, not verified measurements.`;
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
      contents,
      config: { systemInstruction: systemInstruction + safeContext, temperature: 0.75, maxOutputTokens: 1200 }
    });
    const reply = response.text?.trim();
    if (!reply) throw new Error('Gemini returned an empty response. Please try again.');
    res.json({ reply, model: process.env.GEMINI_MODEL || 'gemini-3.8-flash' });
  } catch (error) {
    console.error('Gemini request failed:', error?.message || error);
    const status = Number(error?.status) >= 400 && Number(error?.status) < 600 ? Number(error.status) : 502;
    res.status(status).json({ error: 'Gemini could not answer right now. Check your API key, model access, and usage limits, then try again.' });
  }
});

app.listen(port, '0.0.0.0', () => console.log(`FITPULSE running on port ${port} | Gemini ${ai ? 'configured' : 'key missing'}`));
