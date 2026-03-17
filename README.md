# Holy Family OCIA

A Catholic Sacrament Assistant for OCIA candidates at Holy Family Franciscan Parish.

Covers all 7 Sacraments, Scripture, Prayers, interactive Rosary & Chaplets, Saints, and a Catholic AI assistant powered by Magisterium AI, Anthropic Claude, or Google Gemini.

---

## Project Files

```
holy-family-ocia/
├── public/
│   ├── index.html        ← The entire app (single page)
│   └── logo.png          ← Holy Family logo (embedded as base64)
├── server.js             ← Express server + secure AI proxy
├── package.json          ← Node dependencies
├── railway.toml          ← Railway deployment config
├── .env.example          ← Template for your API key
└── .gitignore            ← Keeps secrets out of GitHub
```

---

## STEP-BY-STEP: GitHub → Railway Deployment

### STEP 1 — Create a GitHub Account (if you don't have one)
1. Go to **https://github.com**
2. Click **Sign up** and create a free account
3. Verify your email address

---

### STEP 2 — Create a New Repository on GitHub
1. Once logged in, click the **+** icon in the top-right corner
2. Click **New repository**
3. Fill in:
   - **Repository name:** `holy-family-ocia`
   - **Description:** Holy Family OCIA Catholic Sacrament Assistant
   - **Visibility:** Public (or Private — both work with Railway)
   - Leave everything else as default
4. Click **Create repository**
5. GitHub will show you an empty repo page — **leave this tab open**

---

### STEP 3 — Install Git on Your Computer (if needed)
- **Mac:** Open Terminal and run `git --version`. If not installed, it will prompt you to install it.
- **Windows:** Download from **https://git-scm.com/download/win** and install with default settings.

---

### STEP 4 — Upload the Project Files

**Option A — Using the GitHub website (easiest, no command line)**

1. Unzip the `holy-family-ocia.zip` file on your computer
2. On your empty GitHub repo page, click **uploading an existing file**
3. Drag and drop ALL the files and folders from inside the unzipped folder
   - `public/` folder (with `index.html` inside)
   - `server.js`
   - `package.json`
   - `railway.toml`
   - `.env.example`
   - `.gitignore`
   - `README.md`
4. Scroll down, add a commit message like `"Initial upload"`
5. Click **Commit changes**

**Option B — Using the command line (Terminal / Git Bash)**

```bash
# 1. Unzip and open the folder
cd holy-family-ocia

# 2. Initialize git and connect to your GitHub repo
git init
git add .
git commit -m "Initial upload"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/holy-family-ocia.git
git push -u origin main
```

Replace `YOUR-USERNAME` with your actual GitHub username.

---

### STEP 5 — Create a Railway Account
1. Go to **https://railway.app**
2. Click **Login** → **Login with GitHub**
3. Authorize Railway to access your GitHub account
4. You now have a free Railway account

---

### STEP 6 — Deploy from GitHub to Railway
1. On the Railway dashboard, click **New Project**
2. Click **Deploy from GitHub repo**
3. Find and click **holy-family-ocia** in the list
4. Railway will automatically detect Node.js and start building
5. Wait about 60 seconds — you will see a green **Active** status when done

---

### STEP 7 — Add Your AI API Key (REQUIRED for the chat feature)

The AI assistant will not work until you add an API key. The key stays on the server — it is never visible to users.

**Get a Magisterium AI key (recommended):**
- Go to **https://www.magisterium.com/developers/api**
- Create an account and copy your API key

1. In Railway, click your project → click your service
2. Click the **Variables** tab
3. Click **New Variable** and add:

| Variable Name         | Value                        |
|-----------------------|------------------------------|
| `AI_PROVIDER`         | `magisterium`                |
| `MAGISTERIUM_API_KEY` | `your-key-here`              |

4. Railway will automatically restart with the new key — done.

**Other options:**
- Anthropic (Claude): `AI_PROVIDER=anthropic` + `ANTHROPIC_API_KEY=sk-ant-...`
  Get key at: https://console.anthropic.com/settings/keys
- Google Gemini: `AI_PROVIDER=gemini` + `GEMINI_API_KEY=AIza...`
  Get key at: https://aistudio.google.com/app/apikey

---

### STEP 8 — Get Your Live URL
1. In Railway, click your service
2. Click the **Settings** tab → **Networking** → **Generate Domain**
3. Railway gives you a free URL like `holy-family-ocia-production.up.railway.app`
4. Share this URL with your OCIA candidates

---

## Making Updates

After any change to the files, push to GitHub and Railway auto-deploys:

```bash
git add .
git commit -m "describe your change"
git push
```

Railway detects the push and redeploys in about 60 seconds.

---

## Local Testing (Optional)

```bash
# Install dependencies
npm install

# Copy env template and add your key
cp .env.example .env
# Edit .env and paste your API key

# Start the app
npm start
# Open http://localhost:3000
```
