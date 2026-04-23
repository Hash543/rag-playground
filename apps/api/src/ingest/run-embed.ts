import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import pgvector from 'pgvector'
import type { DocumentChunk } from '@rag-playground/shared'
import { embedTexts } from './embed.js'
import { pool } from './db.js'

/**
 * 讀切塊 JSON → 呼叫 Voyage embedding → 寫入 pgvector。
 *
 * 支援 `--dry-run`：只跑 embedding，印預覽，不寫 DB。
 *
 * upsert 邏輯依賴 `UNIQUE(source, chunk_index)` 索引（見 infra/init.sql），
 * 因此重跑安全——切塊策略或模型換了直接再跑一次就好。
 */

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, '../../../../')
const inputPath = resolve(repoRoot, 'data/processed/cube-recipes.json')

const dryRun = process.argv.includes('--dry-run')

const raw = await readFile(inputPath, 'utf8')
const chunks = JSON.parse(raw) as DocumentChunk[]

console.log(`📄 讀取 ${chunks.length} 個 chunk from ${inputPath}`)
console.log(`🔢 呼叫 Voyage embedding (input_type=document)...`)

const vectors = await embedTexts(
  chunks.map((c) => c.content),
  'document',
)

console.log(`\n✅ 取得 ${vectors.length} 個向量，維度 = ${vectors[0]?.length}`)
console.log('第一筆預覽：')
console.log(`  source      = ${chunks[0]?.source}`)
console.log(`  chunk_index = ${chunks[0]?.chunkIndex}`)
console.log(`  title       = ${chunks[0]?.metadata.title}`)
console.log(`  vector[0:8] = [${vectors[0]?.slice(0, 8).map((n) => n.toFixed(4)).join(', ')}, ...]`)

if (dryRun) {
  console.log('\n🧪 --dry-run 模式，不寫入 DB。')
  process.exit(0)
}

console.log('\n💾 寫入 Postgres (upsert on source+chunk_index)...')
const client = await pool.connect()
try {
  let written = 0
  for (let i = 0; i < chunks.length; i++) {
    const c = chunks[i]!
    const v = vectors[i]!
    await client.query(
      `INSERT INTO documents (source, chunk_index, content, embedding, metadata)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (source, chunk_index) DO UPDATE
         SET content   = EXCLUDED.content,
             embedding = EXCLUDED.embedding,
             metadata  = EXCLUDED.metadata`,
      [c.source, c.chunkIndex, c.content, pgvector.toSql(v), c.metadata],
    )
    written++
    if (written % 20 === 0 || written === chunks.length) {
      console.log(`  ${written}/${chunks.length}`)
    }
  }
  console.log(`\n✅ 已寫入 ${written} 筆`)
} finally {
  client.release()
  await pool.end()
}
