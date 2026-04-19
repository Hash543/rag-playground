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
