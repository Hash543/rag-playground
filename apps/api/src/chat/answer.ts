import Anthropic from '@anthropic-ai/sdk'
import { config } from '../config.js'
import { search, type SearchHit } from '../retrieval/search.js'

/**
 * RAG 生成：retrieve → 組 context → 呼叫 Claude（streaming）。
 *
 * 設計重點：
 * - 使用 claude-opus-4-7 + adaptive thinking：讓模型自行決定思考深度
 * - streaming：Anthropic 官方建議長 input 都用 stream 避免 HTTP timeout；
 *   CLI 也能邊跑邊印，體感好
 * - prompt caching：system prompt 固定、可快取；若 token 數超過 4096
 *   門檻會實際命中（目前 system 還短，結構先做對）
 * - context 包在 user message 而非 system：實務上 RAG context 會變動，
 *   塞進 system 會破壞快取前綴
 */

const MODEL = 'claude-opus-4-7'
const MAX_TOKENS = 2048

const SYSTEM_PROMPT = `你是《暗黑破壞神 2：獄火重生》(Diablo 2 Resurrected) 的攻略助理。

回答規則：
1. 只依據使用者訊息中 <context> 內的資料回答。
2. 找不到相關資料時，直接說「資料中沒有相關資訊」，不要自行編造。
3. 回答時引用配方標題（例如「依〈完美紅寶石〉配方...」）。
4. 用繁體中文回答，語氣自然、不囉唆。`

export interface AnswerOptions {
  topK?: number
  onText?: (text: string) => void
  /** 檢索完成後、Claude 開始生成前觸發，讓呼叫端可以先把來源送到前端 */
  onHits?: (hits: SearchHit[]) => void
}

export interface AnswerResult {
  answer: string
  hits: SearchHit[]
  usage: Anthropic.Usage
}

export async function answer(
  query: string,
  opts: AnswerOptions = {},
): Promise<AnswerResult> {
  if (!config.anthropicApiKey) {
    throw new Error('ANTHROPIC_API_KEY 未設定 (.env)')
  }
  const { topK = 5, onText, onHits } = opts

  const hits = await search(query, topK)
  onHits?.(hits)

  const contextBlock = hits
    .map((h, i) => {
      const title =
        (h.metadata.title as string | undefined) ?? `chunk-${h.chunkIndex}`
      return `[${i + 1}] ${title}\n${h.content}`
    })
    .join('\n\n---\n\n')

  const userMessage = `<context>\n${contextBlock}\n</context>\n\n問題：${query}`

  const client = new Anthropic({ apiKey: config.anthropicApiKey })

  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    thinking: { type: 'adaptive' },
    system: [
      {
        type: 'text',
        text: SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [{ role: 'user', content: userMessage }],
  })

  if (onText) {
    stream.on('text', onText)
  }

  const finalMessage = await stream.finalMessage()

  let fullText = ''
  for (const block of finalMessage.content) {
    if (block.type === 'text') fullText += block.text
  }

  return { answer: fullText, hits, usage: finalMessage.usage }
}
