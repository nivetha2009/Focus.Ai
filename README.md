# ◎ Focus – AI study companion
Chat with an AI tutor, upload PDF/PPTX/DOCX/TXT, and generate summaries, MCQs, flashcards, papers, notes and plans. Claude runs **only on the server** (`/api`).

## Structure
```
api/      chat.js, generate.js, extract.js   (Vercel serverless routes)
lib/      claude.js (AI service) · prompts.js · extract.js · http.js
public/   index.html, styles.css, app.js      (frontend, hash routes)
```
## Run locally
```
npm install
cp .env.example .env      # then put your key in .env (never commit it)
npm run dev               # Vercel CLI; run `npx vercel login` once. Opens http://localhost:3000
```
## Deploy
1. `git init && git add . && git commit -m "Focus" && git branch -M main`
2. Create an empty GitHub repo, then `git remote add origin <url> && git push -u origin main`
3. vercel.com → Add New Project → import the repo (no build settings needed).
4. Project → Settings → Environment Variables → add `ANTHROPIC_API_KEY` → Redeploy.

## Notes / limits
- Profile and study data live in the browser (localStorage). For real multi-device accounts plug in Supabase/Clerk/Firebase.
- Upload limit 3 MB (Vercel body cap); scanned PDFs and legacy .doc/.ppt aren't supported.
- Set `ANTHROPIC_MODEL` to change the model.
