import { config } from '../config.js'

/**
 * Voyage AI embedding wrapper。
 *
 * 重點：
 * - `input_type` 要分 document / query（Voyage 是 asymmetric embedding，
 *   ingest 時標 document、搜尋時標 query，檢索品質會更好）
 * - 單次 request 上限 128 筆 or 120k token，超過要分批
 * - 429 / 5xx 做 exponential backoff 重試
 */

const VOYAGE_ENDPOINT = 'https://api.voyageai.com/v1/embeddings'
const VOYAGE_MODEL = 'voyage-3'
const BATCH_SIZE = 128
const MAX_RETRIES = 3

interface VoyageEmbeddingResponse {
  data: Array<{ object: 'embedding'; embedding: number[]; index: number }>
  model: string
  usage: { total_tokens: number }
}

export type InputType = 'document' | 'query'

export async function embedTexts(
  texts: string[],
  inputType: InputType,
): Promise<number[][]> {
  if (!config.voyageApiKey) {
    throw new Error('VOYAGE_API_KEY 未設定 (.env)')
  }

  const results: number[][] = []
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE)
    const vectors = await embedBatch(batch, inputType)
    results.push(...vectors)
    console.log(
      `  📡 Voyage embed ${Math.min(i + BATCH_SIZE, texts.length)}/${texts.length}`,
    )
  }
  return results
}

async function embedBatch(
  texts: string[],
  inputType: InputType,
  attempt = 1,
): Promise<number[][]> {
  const res = await fetch(VOYAGE_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.voyageApiKey}`,
    },
    body: JSON.stringify({
      input: texts,
      model: VOYAGE_MODEL,
      input_type: inputType,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    const retriable = res.status === 429 || res.status >= 500
    if (retriable && attempt <= MAX_RETRIES) {
      const wait = 1000 * 2 ** (attempt - 1)
      console.warn(
        `  ⚠️ Voyage ${res.status}，${wait}ms 後重試 (attempt ${attempt}/${MAX_RETRIES})`,
      )
      await new Promise((r) => setTimeout(r, wait))
      return embedBatch(texts, inputType, attempt + 1)
    }
    throw new Error(`Voyage API ${res.status}: ${body}`)
  }

  const json = (await res.json()) as VoyageEmbeddingResponse
  // API 回傳 data 帶 index，依 index 排序以保險對齊輸入順序
  return [...json.data]
    .sort((a, b) => a.index - b.index)
    .map((d) => d.embedding)
}
