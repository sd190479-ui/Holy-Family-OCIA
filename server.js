const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
// Serve static files but disable automatic index.html so our / route controls the landing page
app.use(express.static(path.join(__dirname, 'public'), { index: false }));

// ─────────────────────────────────────────────────────────────
//  AI CHAT CONFIGURATION — set in Railway → Variables tab
//
//  AI_PROVIDER         = "magisterium" | "anthropic" | "gemini"
//  MAGISTERIUM_API_KEY = key from magisterium.com/developers/api
//  ANTHROPIC_API_KEY   = sk-ant-...
//  GEMINI_API_KEY      = AIza...
//
// ─────────────────────────────────────────────────────────────

const AI_PROVIDER     = (process.env.AI_PROVIDER || 'magisterium').toLowerCase();
const MAGISTERIUM_KEY = process.env.MAGISTERIUM_API_KEY;
const ANTHROPIC_KEY   = process.env.ANTHROPIC_API_KEY;
const GEMINI_KEY      = process.env.GEMINI_API_KEY;


const CATHOLIC_SYSTEM_PROMPT = `You are a faithful Catholic theological assistant for Holy Family OCIA — a program preparing candidates for Baptism, Confirmation, and First Holy Communion.

Your role is to answer questions strictly in accordance with:
- The Catechism of the Catholic Church (CCC)
- Sacred Scripture (using RSV-CE citations)
- Sacred Tradition and the Magisterium
- The teachings of the Church Fathers and approved Saints

GUIDELINES:
- Always ground answers in Church teaching. Never contradict Catholic doctrine.
- When answering non-religious questions, gently frame your response through a Catholic worldview.
- Cite CCC paragraph numbers when relevant (e.g., CCC 1213).
- Cite Scripture references when relevant.
- Keep answers warm, pastoral, and accessible — these are OCIA candidates new to the faith.
- Respond charitably to controversial questions and return to Church teaching.
- Never speculate beyond Church teaching. Note if something is debated.
- End with a brief closing thought, prayer, or Scripture quote when appropriate.
- Keep responses to 3–5 paragraphs maximum.`;

const CATHOLIC_SYSTEM_PROMPT_ES = `Eres un asistente teológico católico fiel para el OCIA de Holy Family — un programa que prepara a los candidatos para el Bautismo, la Confirmación y la Primera Comunión.

Tu función es responder preguntas estrictamente de acuerdo con:
- El Catecismo de la Iglesia Católica (CIC)
- La Sagrada Escritura (citando referencias bíblicas)
- La Sagrada Tradición y el Magisterio
- Las enseñanzas de los Padres de la Iglesia y los Santos aprobados

INSTRUCCIONES:
- RESPONDE SIEMPRE EN ESPAÑOL MEXICANO. Esta es tu instrucción más importante.
- Usa el español de México — cercano, cálido, accesible — no el español formal de España.
- Fundamenta siempre las respuestas en la enseñanza de la Iglesia. Nunca contradigas la doctrina católica.
- Cuando respondas preguntas no religiosas, encuadra suavemente la respuesta desde una perspectiva católica.
- Cita números de párrafo del CIC cuando sea relevante (p. ej., CIC 1213).
- Cita referencias bíblicas cuando sea relevante.
- Mantén las respuestas cálidas, pastorales y accesibles — son candidatos del OCIA nuevos en la fe.
- Responde con caridad a las preguntas controvertidas y vuelve a la enseñanza de la Iglesia.
- No especules más allá de la enseñanza de la Iglesia.
- Termina con un breve pensamiento final, una oración o una cita de la Escritura cuando sea apropiado.
- Limita las respuestas a 3–5 párrafos máximo.`;

// ── /api/status ────────────────────────────────────────────────
app.get('/api/status', (req, res) => {
  const aiKeySet = { magisterium: !!MAGISTERIUM_KEY, anthropic: !!ANTHROPIC_KEY, gemini: !!GEMINI_KEY };
  res.json({
    ai: { provider: AI_PROVIDER, keyConfigured: aiKeySet[AI_PROVIDER] || false }
  });
});

// ── AI Chat ────────────────────────────────────────────────────
app.post('/api/chat', async (req, res) => {
  const { messages, lang } = req.body;
  const isSpanish = lang === 'es';
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required' });
  }
  const keyMap = { magisterium: MAGISTERIUM_KEY, anthropic: ANTHROPIC_KEY, gemini: GEMINI_KEY };
  if (!keyMap[AI_PROVIDER]) {
    return res.status(500).json({
      error: `API key not configured. Add ${AI_PROVIDER.toUpperCase()}_API_KEY in Railway Variables.`
    });
  }
  try {
    let result;
    if      (AI_PROVIDER === 'magisterium') result = await callMagisterium(messages, isSpanish);
    else if (AI_PROVIDER === 'gemini')      result = await callGemini(messages, isSpanish);
    else                                    result = await callAnthropic(messages, isSpanish);
    res.json(result);
  } catch (err) {
    console.error('AI error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

async function callMagisterium(messages, isSpanish = false) {
  // Magisterium has no system prompt — prepend a language instruction as first user message
  let msgs = messages;
  if (isSpanish) {
    msgs = [
      { role: 'user', content: 'INSTRUCCIÓN IMPORTANTE: Responde SIEMPRE en español mexicano, de manera cálida y pastoral.' },
      { role: 'assistant', content: 'Entendido. Responderé siempre en español mexicano.' },
      ...messages
    ];
  }
  const response = await fetch('https://www.magisterium.com/api/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${MAGISTERIUM_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'magisterium-1', messages: msgs })
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
  const reply = data.choices?.[0]?.message?.content || '';
  const citations = (data.citations || []).map(c => ({
    title: c.document_title || null, author: c.document_author || null,
    reference: c.document_reference || null, year: c.document_year || null,
    url: c.source_url || null, excerpt: c.cited_text || null
  }));
  return { reply, citations };
}

async function callAnthropic(messages, isSpanish = false) {
  const systemPrompt = isSpanish ? CATHOLIC_SYSTEM_PROMPT_ES : CATHOLIC_SYSTEM_PROMPT;
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 1024, system: systemPrompt, messages })
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return { reply: data.content.filter(b => b.type === 'text').map(b => b.text).join('') };
}

async function callGemini(messages, isSpanish = false) {
  const systemPrompt = isSpanish ? CATHOLIC_SYSTEM_PROMPT_ES : CATHOLIC_SYSTEM_PROMPT;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
      generationConfig: { maxOutputTokens: 1024, temperature: 0.4 }
    })
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  const candidate = data.candidates?.[0];
  if (!candidate) throw new Error('No response from Gemini');
  return { reply: candidate.content.parts.map(p => p.text).join('') };
}


// ═══════════════════════════════════════════════════════════════
//  OCIA CALENDAR — REST API
//  DRE_PASSWORD env var controls admin access
//  Calendar stored in data/calendar.json
// ═══════════════════════════════════════════════════════════════

const fs   = require('fs');
const DATA_FILE = path.join(__dirname, 'data', 'calendar.json');

function loadCalendar() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      const empty = { sessions: [], lastUpdated: new Date().toISOString(), updatedBy: 'system' };
      fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
      fs.writeFileSync(DATA_FILE, JSON.stringify(empty, null, 2));
      return empty;
    }
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch(e) {
    console.error('Calendar load error:', e.message);
    return { sessions: [], lastUpdated: new Date().toISOString(), updatedBy: 'system' };
  }
}

function saveCalendar(data) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// GET /api/calendar — public, returns all sessions
app.get('/api/calendar', (req, res) => {
  res.json(loadCalendar());
});

// POST /api/calendar/auth — verify DRE password
app.post('/api/calendar/auth', (req, res) => {
  const { password } = req.body;
  const DRE_PASSWORD = process.env.DRE_PASSWORD || 'HolyFamily2025';
  if (password === DRE_PASSWORD) {
    res.json({ ok: true });
  } else {
    res.status(401).json({ ok: false, error: 'Incorrect password' });
  }
});

// PUT /api/calendar — update full calendar (DRE only)
app.put('/api/calendar', (req, res) => {
  const { password, sessions } = req.body;
  const DRE_PASSWORD = process.env.DRE_PASSWORD || 'HolyFamily2025';
  if (password !== DRE_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (!Array.isArray(sessions)) {
    return res.status(400).json({ error: 'sessions must be an array' });
  }
  const data = {
    sessions: sessions.map((s, i) => ({
      id: s.id || String(Date.now() + i),
      date: s.date || '',
      title: s.title || '',
      instructor: s.instructor || '',
      topic: s.topic || '',
      notes: s.notes || '',
      location: s.location || ''
    })),
    lastUpdated: new Date().toISOString(),
    updatedBy: 'DRE'
  };
  saveCalendar(data);
  res.json({ ok: true, sessions: data.sessions.length });
});


// App (landing is now the Home tab inside the app)
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
// SPA fallback
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, () => {
  console.log(`\n✝ Holy Family OCIA on port ${PORT}`);
  console.log(`  AI  provider : ${AI_PROVIDER.toUpperCase()} (key: ${!!{ magisterium: MAGISTERIUM_KEY, anthropic: ANTHROPIC_KEY, gemini: GEMINI_KEY }[AI_PROVIDER]})`);
});
