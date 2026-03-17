# ⚠️ IMPORTANT: How to Upload Files to GitHub Correctly

The most common mistake is uploading the files INSIDE a subfolder.
Railway needs `package.json` at the ROOT of the repository — not inside a folder.

---

## ✅ CORRECT structure in GitHub (what Railway needs to see):

```
your-repo/
├── public/
│   └── index.html
├── server.js          ← must be here at root
├── package.json       ← must be here at root
├── railway.toml       ← must be here at root
├── nixpacks.toml      ← must be here at root
└── .gitignore
```

## ❌ WRONG structure (causes the "cannot determine how to build" error):

```
your-repo/
└── holy-family-ocia/     ← extra folder — this breaks Railway
    ├── public/
    ├── server.js
    └── package.json
```

---

## How to fix it on GitHub

### If you uploaded a zip and got the wrong structure:

1. Go to your GitHub repository
2. Delete all the files (Settings → Danger Zone → Delete repository, then recreate it)
3. Go to your new empty repo and click **"uploading an existing file"**
4. **Unzip** the `holy-family-ocia.zip` on your computer first
5. Open the unzipped `holy-family-ocia` folder so you can SEE the files inside it
6. Select ALL the files and folders INSIDE that folder (not the folder itself):
   - `public/` folder
   - `server.js`
   - `package.json`
   - `railway.toml`
   - `nixpacks.toml`
   - `.gitignore`
   - `.env.example`
   - `README.md`
7. Drag them directly into the GitHub upload area
8. Click **Commit changes**

GitHub should now show `package.json` right at the top level of your repo.

---

## After fixing — redeploy on Railway

1. Go to railway.app → your project
2. Click **Deploy** → **Redeploy** (or push a new commit)
3. Railway will detect Node.js and build successfully
