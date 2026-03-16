const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─────────────────────────────────────────────────────────────
//  CONFIGURATION — set these in Railway → Variables tab
//
//  AI_PROVIDER        = "magisterium" | "anthropic" | "gemini"
//                       (default: magisterium)
//
//  MAGISTERIUM_API_KEY = <key from magisterium.com/developers/api>
//  ANTHROPIC_API_KEY   = sk-ant-...
//  GEMINI_API_KEY      = AIza...
// ─────────────────────────────────────────────────────────────

const AI_PROVIDER      = (process.env.AI_PROVIDER || 'magisterium').toLowerCase();
const MAGISTERIUM_KEY  = process.env.MAGISTERIUM_API_KEY;
const ANTHROPIC_KEY    = process.env.ANTHROPIC_API_KEY;
const GEMINI_KEY       = process.env.GEMINI_API_KEY;

// System prompt used by Anthropic & Gemini only.
// Magisterium AI is already trained on Catholic documents — no system prompt needed.
const CATHOLIC_SYSTEM_PROMPT = `You are a faithful Catholic theological assistant for Holy Family OCIA — a program preparing candidates for Baptism, Confirmation, and First Holy Communion.

Your role is to answer questions strictly in accordance with:
- The Catechism of the Catholic Church (CCC)
- Sacred Scripture (using RSV-CE citations)
- Sacred Tradition and the Magisterium
- The teachings of the Church Fathers and approved Saints

GUIDELINES:
- Always ground answers in Church teaching. Never contradict Catholic doctrine.
- When answering non-religious questions, gently frame your response through a Catholic worldview and invite the person back to faith.
- Cite the CCC paragraph number when relevant (e.g., CCC 1213).
- Cite Scripture references when relevant.
- Keep answers warm, pastoral, and accessible — these are OCIA candidates new to the faith.
- If asked about controversial topics, respond charitably and return to what the Church teaches.
- Never speculate beyond Church teaching. Note clearly if something is debated.
- End responses with a brief closing thought, prayer, or Scripture quote when appropriate.
- Keep responses concise — 3 to 5 paragraphs maximum.`;

// ── /api/chat ──────────────────────────────────────────────────
app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  try {
    let result;

    if (AI_PROVIDER === 'magisterium') {
      result = await callMagisterium(messages);
    } else if (AI_PROVIDER === 'gemini') {
      result = await callGemini(messages);
    } else {
      result = await callAnthropic(messages);
    }

    res.json(result); // { reply, citations? }

  } catch (err) {
    console.error('AI proxy error:', err.message);
    res.status(500).json({ error: err.message || 'AI request failed' });
  }
});

// ── Magisterium AI handler ─────────────────────────────────────
// Docs: https://www.magisterium.com/developers/docs/chat
// - OpenAI-compatible endpoint
// - Model: magisterium-1
// - Returns citations[] with document_title, document_author,
//   document_reference, source_url, cited_text
async function callMagisterium(messages) {
  if (!MAGISTERIUM_KEY) throw new Error('MAGISTERIUM_API_KEY is not set in environment variables');

  const response = await fetch('https://www.magisterium.com/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MAGISTERIUM_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'magisterium-1',
      messages
    })
  });

  const data = await response.json();
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));

  const reply = data.choices?.[0]?.message?.content || '';

  // Pass citations through to the frontend
  const citations = (data.citations || []).map(c => ({
    title:     c.document_title     || null,
    author:    c.document_author    || null,
    reference: c.document_reference || null,
    year:      c.document_year      || null,
    url:       c.source_url         || null,
    excerpt:   c.cited_text         || null
  }));

  return { reply, citations };
}

// ── Anthropic handler ──────────────────────────────────────────
async function callAnthropic(messages) {
  if (!ANTHROPIC_KEY) throw new Error('ANTHROPIC_API_KEY is not set in environment variables');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      system: CATHOLIC_SYSTEM_PROMPT,
      messages
    })
  });

  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  const reply = data.content.filter(b => b.type === 'text').map(b => b.text).join('');
  return { reply };
}

// ── Gemini handler ─────────────────────────────────────────────
async function callGemini(messages) {
  if (!GEMINI_KEY) throw new Error('GEMINI_API_KEY is not set in environment variables');

  const geminiContents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: CATHOLIC_SYSTEM_PROMPT }] },
      contents: geminiContents,
      generationConfig: { maxOutputTokens: 1024, temperature: 0.4 }
    })
  });

  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  const candidate = data.candidates?.[0];
  if (!candidate) throw new Error('No response returned from Gemini');
  const reply = candidate.content.parts.map(p => p.text).join('');
  return { reply };
}

// ── Fallback SPA route ─────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Holy Family OCIA running on port ${PORT}`);
  console.log(`AI provider: ${AI_PROVIDER.toUpperCase()}`);
});
