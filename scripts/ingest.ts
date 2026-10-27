/**
 * Ingestion script: reads knowledgeBase.ts and builds vector_store.json.
 * Run: npm run ingest
 * Requires OPENAI_API_KEY in .env
 */
import { SAP_MM_KNOWLEDGE_BASE } from './knowledgeBase.js';
import { OpenAIEmbeddings } from '@langchain/openai';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const VECTOR_STORE_PATH = path.join(process.cwd(), 'server', 'vector_store.json');

async function runIngest() {
  console.log(`📚 Processing ${SAP_MM_KNOWLEDGE_BASE.length} knowledge chunks...`);

  const embeddings = new OpenAIEmbeddings({ modelName: 'text-embedding-3-small' });

  const texts = SAP_MM_KNOWLEDGE_BASE.map(chunk => `${chunk.title}\n\n${chunk.content}`);
  const vecs = await embeddings.embedDocuments(texts);

  const store = SAP_MM_KNOWLEDGE_BASE.map((chunk, i) => ({
    id: chunk.id,
    section: chunk.section,
    title: chunk.title,
    content: chunk.content,
    embedding: vecs[i],
  }));

  if (!fs.existsSync(path.join(process.cwd(), 'server'))) {
    fs.mkdirSync(path.join(process.cwd(), 'server'), { recursive: true });
  }

  fs.writeFileSync(VECTOR_STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');
  console.log(`✅ Ingestion complete! ${store.length} chunks embedded and saved to ${VECTOR_STORE_PATH}`);
}

runIngest().catch(console.error);
