# SAP MM AI Assistant — Deployment Guide

## Quick Start (Local Development)

> [!IMPORTANT]
> Prerequisites: Node.js 18+, an **OpenAI API Key**.

### Step 1: Add your API Key
Open `d:\my-app\.env` and set:
```
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx
```

### Step 2: Run the Ingestion Pipeline
This embeds all 30+ SAP MM knowledge chunks and saves the vector store:
```powershell
# In d:\my-app terminal
npm run ingest
```
Expected output: `✅ Ingestion complete! 30 chunks embedded and saved.`

### Step 3: Start the Backend API Server
Open a **new terminal** tab:
```powershell
npm run server
```
Expected output:
```
🚀 SAP MM RAG Assistant running on http://localhost:3001
   Vector Store: ✅ Loaded
   OpenAI Key: ✅ Set
```

### Step 4: Start the Frontend (already running)
```powershell
npm run dev
```
The Vite proxy will forward `/api` requests to the Express backend.

### Step 5: Test the AI Assistant
Open the chat bubble (bottom-right, green indicator) and try:
- *"What is the Procure-to-Pay cycle?"*
- *"How does MM integrate with FI?"*
- *"List all movement types for subcontracting"*

### Step 6 (Optional): Run Evaluation Tests
With the backend running:
```powershell
npx tsx server/eval.ts
```

---

## Architecture

```
User Browser
     │
     ▼ (Vite Proxy /api → :3001)
Express Backend (server/index.ts)
     │  1. Embed question (OpenAI text-embedding-3-small)
     │  2. Cosine similarity search → top 4 chunks
     │  3. Build prompt: System Prompt + Context + Question
     │  4. Call GPT-4o-mini
     ▼
Structured JSON Vector Store (server/vector_store.json)
  └─ 30+ semantic chunks from SapLearningModule.tsx
     (via server/knowledgeBase.ts)
```

---

## Production Deployment

### Frontend + Backend on Render / Railway
1. **Build frontend**: `npm run build` → serves `dist/` via Express static middleware.
2. Add to `server/index.ts`:
   ```typescript
   app.use(express.static(path.join(process.cwd(), 'dist')));
   ```
3. Set environment variable `OPENAI_API_KEY` in the hosting dashboard.
4. Run `npm run ingest` once to pre-generate `vector_store.json`.
5. Deploy the whole repo — one server handles both API and static files.

### Scaling to Cloud Vector DBs (Pinecone / Supabase pgvector)
The architecture is modular. To swap from file-based to cloud:
1. Replace the `cosineSimilarity` section in `server/index.ts` with a Pinecone client call.
2. Update `scripts/ingest.ts` to upsert into Pinecone instead of writing a JSON file.

### Adding New SAP Modules (Modular Design)
To add SD, PP, QM content:
1. Add new `KnowledgeChunk[]` entries to `server/knowledgeBase.ts`.
2. Re-run `npm run ingest` to embed and index the new content.
3. No backend code changes needed — the RAG pipeline is content-agnostic.
