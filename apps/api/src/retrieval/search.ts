import pgvector from 'pgvector'
import { embedTexts } from '../ingest/embed.js'
import { pool } from '../ingest/db.js'

/**
 * 向量檢索：把 query 轉向量 → pgvector cosine KNN → 取 top-K。
 *
 * 關鍵：
 * - query 端 embedding 用 `input_type='query'`，跟 ingest 時的 `document` 配對
 *   （Voyage 是 asymmetric embedding，標錯會降低檢索品質）
 * - 使用 `<=>` (cosine distance) 運算子，才會命中 init.sql 建的
 *   `vector_cosine_ops` HNSW 索引
 * - distance ∈ [0, 2]：0 = 完全相同、1 = 正交、2 = 完全相反
 *   similarity = 1 - distance（平常看的相似度）
 */

export interface SearchHit {
  id: number
  source: string
  chunkIndex: number
  content: string
  metadata: Record<string, unknown>
  distance: number
  similarity: number
}

export async function search(query: string, topK = 5): Promise<SearchHit[]> {
  const [vec] = await embedTexts([query], 'query')
  if (!vec) throw new Error('Voyage 回傳空向量')

  const { rows } = await pool.query(
    `SELECT id, source, chunk_index, content, metadata,
            embedding <=> $1 AS distance
       FROM documents
      ORDER BY embedding <=> $1
      LIMIT $2`,
    [pgvector.toSql(vec), topK],
  )

  return rows.map((r) => {
    const distance = Number(r.distance)
    return {
      id: Number(r.id),
      source: r.source,
      chunkIndex: r.chunk_index,
      content: r.content,
      metadata: r.metadata,
      distance,
      similarity: 1 - distance,
    }
  })
}
