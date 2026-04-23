import type { FastifyInstance } from 'fastify'
import type {
  ChatRequest,
  ChatHit,
  ChatMetaEvent,
  ChatTextEvent,
  ChatDoneEvent,
  ChatErrorEvent,
} from '@rag-playground/shared'
import { answer } from '../chat/answer.js'

/**
 * POST /api/chat
 *
 * 以 Server-Sent Events 回傳：
 *   event: meta  → { hits }         先把檢索來源送出，UI 可立刻顯示
 *   event: text  → { text }         Claude 產生的 token（可多次）
 *   event: done  → { usage }        結束，附上 token 用量
 *   event: error → { message }      錯誤
 *
 * 為何用 SSE 而非 WebSocket：單向 server→client 串流、瀏覽器原生支援
 * （EventSource）、經得起 HTTP proxy，RAG chat 用不到雙向通訊。
 */

const bodySchema = {
  type: 'object',
  required: ['query'],
  additionalProperties: false,
  properties: {
    query: { type: 'string', minLength: 1, maxLength: 1000 },
    topK: { type: 'integer', minimum: 1, maximum: 20 },
  },
} as const

export async function chatRoutes(app: FastifyInstance) {
  app.post<{ Body: ChatRequest }>(
    '/api/chat',
    { schema: { body: bodySchema } },
    async (req, reply) => {
      const { query, topK } = req.body

      // hijack：告訴 Fastify「接下來我自己處理 response」，避免它幫忙補 body
      reply.hijack()
      reply.raw.writeHead(200, {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        // 有些反向代理會 buffer SSE，這行叫 nginx 關掉 buffer
        'X-Accel-Buffering': 'no',
      })

      const send = (event: string, data: unknown) => {
        reply.raw.write(`event: ${event}\n`)
        reply.raw.write(`data: ${JSON.stringify(data)}\n\n`)
      }

      try {
        const result = await answer(query, {
          topK,
          onHits: (hits) => {
            const payload: ChatMetaEvent = {
              hits: hits.map<ChatHit>((h) => ({
                id: h.id,
                title: String(h.metadata.title ?? `chunk-${h.chunkIndex}`),
                source: h.source,
                chunkIndex: h.chunkIndex,
                similarity: h.similarity,
              })),
            }
            send('meta', payload)
          },
          onText: (text) => {
            const payload: ChatTextEvent = { text }
            send('text', payload)
          },
        })

        const done: ChatDoneEvent = {
          usage: {
            input_tokens: result.usage.input_tokens,
            output_tokens: result.usage.output_tokens,
            cache_read_input_tokens: result.usage.cache_read_input_tokens,
            cache_creation_input_tokens: result.usage.cache_creation_input_tokens,
          },
        }
        send('done', done)
      } catch (err) {
        req.log.error({ err }, 'chat route failed')
        const payload: ChatErrorEvent = {
          message: err instanceof Error ? err.message : String(err),
        }
        send('error', payload)
      } finally {
        reply.raw.end()
      }
    },
  )
}
