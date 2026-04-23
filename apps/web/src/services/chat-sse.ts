import type {
  ChatDoneEvent,
  ChatErrorEvent,
  ChatMetaEvent,
  ChatTextEvent,
} from '@rag-playground/shared'

/**
 * 用 fetch + ReadableStream 解 SSE。
 *
 * 為什麼不用 EventSource：瀏覽器原生 EventSource 只支援 GET，
 * 且不能帶 JSON body。我們的 /api/chat 是 POST，所以手動解 SSE 協定：
 *   - 訊息以兩個 `\n` (空行) 分隔
 *   - 每則訊息由 `event: <name>\n` 和 `data: <json>\n` 組成
 */

export interface StreamChatHandlers {
  onMeta?: (e: ChatMetaEvent) => void
  onText?: (e: ChatTextEvent) => void
  onDone?: (e: ChatDoneEvent) => void
  onError?: (e: ChatErrorEvent) => void
}

export async function streamChat(
  query: string,
  handlers: StreamChatHandlers,
  topK?: number,
): Promise<void> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(topK !== undefined ? { query, topK } : { query }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`HTTP ${res.status}: ${text}`)
  }
  if (!res.body) {
    throw new Error('Response 沒有 body（是否為 SSE 串流？）')
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    const blocks = buffer.split('\n\n')
    // 最後一段可能被切斷，留到下一輪
    buffer = blocks.pop() ?? ''

    for (const block of blocks) {
      dispatch(block, handlers)
    }
  }

  // flush 任何殘餘（正常情況不該有，保險起見）
  if (buffer.trim()) dispatch(buffer, handlers)
}

function dispatch(block: string, handlers: StreamChatHandlers) {
  let event: string | undefined
  const dataLines: string[] = []
  for (const line of block.split('\n')) {
    if (line.startsWith('event:')) {
      event = line.slice(6).trim()
    } else if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trim())
    }
  }
  if (!event) return

  const raw = dataLines.join('\n')
  const payload = raw ? JSON.parse(raw) : {}

  switch (event) {
    case 'meta':
      handlers.onMeta?.(payload as ChatMetaEvent)
      break
    case 'text':
      handlers.onText?.(payload as ChatTextEvent)
      break
    case 'done':
      handlers.onDone?.(payload as ChatDoneEvent)
      break
    case 'error':
      handlers.onError?.(payload as ChatErrorEvent)
      break
  }
}
