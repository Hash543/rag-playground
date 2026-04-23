/** 共用型別定義 */

export interface HealthResponse {
  status: 'ok' | 'error'
  timestamp: string
}

/** 文件 chunk 的基本結構 */
export interface DocumentChunk {
  id: string
  source: string
  chunkIndex: number
  content: string
  metadata: Record<string, unknown>
}

/** Chat 訊息 */
export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

/** POST /api/chat 的請求 body */
export interface ChatRequest {
  query: string
  topK?: number
}

/** SSE meta 事件：檢索到的來源 */
export interface ChatHit {
  id: number
  title: string
  source: string
  chunkIndex: number
  similarity: number
}

export interface ChatMetaEvent {
  hits: ChatHit[]
}

/** SSE text 事件：一段 token delta */
export interface ChatTextEvent {
  text: string
}

/** SSE done 事件：總用量 */
export interface ChatDoneEvent {
  usage: {
    input_tokens: number
    output_tokens: number
    cache_read_input_tokens?: number | null
    cache_creation_input_tokens?: number | null
  }
}

/** SSE error 事件 */
export interface ChatErrorEvent {
  message: string
}
