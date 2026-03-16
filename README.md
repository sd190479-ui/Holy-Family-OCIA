# Holy Family OCIA

A Catholic Sacrament Assistant for OCIA candidates at Holy Family parish. Covers Baptism, Confirmation, First Holy Communion, Scripture, Confession, Prayers, the Rosary, and the Saints — with text-to-speech audio and a Catholic AI chat assistant.

---

## AI Provider Options

Three providers are supported. **Magisterium AI is recommended** — it is purpose-built for Catholic doctrine.

| Provider        | What it is                                                     | Get a key                                           |
|-----------------|----------------------------------------------------------------|-----------------------------------------------------|
| **Magisterium** | Trained on 29,000+ Church documents. Returns citations.        | https://www.magisterium.com/developers/api          |
| Anthropic       | Claude, guided by a strict Catholic system prompt              | https://console.anthropic.com/settings/keys         |
| Gemini          | Google Gemini, guided by a strict Catholic system prompt       | https://aistudio.google.com/app/apikey              |

---

## Setting Your API Key in Railway

1. Open your Railway project dashboard
2. Click your service → **Variables** tab
3. Add these variables:

| Variable Name         | Value                                      |
|-----------------------|--------------------------------------------|
| `AI_PROVIDER`         | `magisterium` (or `anthropic` or `gemini`) |
| `MAGISTERIUM_API_KEY` | your key from magisterium.com              |
| `ANTHROPIC_API_KEY`   | your key from console.anthropic.com        |
| `GEMINI_API_KEY`      | your key from aistudio.google.com          |

You only need to set the key for whichever provider you choose via `AI_PROVIDER`.

4. Railway restarts automatically — you're live.

---

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Create your local env file
cp .env.example .env
# Edit .env and set AI_PROVIDER + the matching API key

# 3. Start
npm start
```

Open http://localhost:3000

---

## How the Proxy Works

```
Browser
  └─ POST /api/chat  { messages: [...] }
        │
      server.js  ←── API key never leaves here
        │
      Magisterium AI  /  Anthropic  /  Gemini
        │
      { reply, citations? }  ──► back to browser
```

- API keys are stored only in Railway environment variables (or your local .env)
- The Catholic system prompt (for Anthropic/Gemini) is also kept server-side
- Magisterium responses include `citations[]` — document title, author, reference, excerpt, and source URL — which are rendered as source cards below each answer

---

## Deploy to Railway

```bash
git init
git add .
git commit -m "initial commit"
git remote add origin <your-github-repo-url>
git push -u origin main
```

Then in Railway: **New Project → Deploy from GitHub** → select repo → add Variables. Every `git push` auto-deploys.
