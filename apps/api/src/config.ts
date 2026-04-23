import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * 載入 repo root 的 .env——用 Node 20.12+ 原生 `process.loadEnvFile()`，
 * 不依賴 dotenv 套件。路徑以 `import.meta.url` 解析，跟執行 cwd 無關。
 *
 * 為何不走 CLI 的 `--env-file`：tsx 的 `watch` 子指令會跟 node flag 的
 * 順序打架（flag 放在 `watch` 前 → watch 被當成入口檔）。改在 config.ts
 * 處理可完全避開這個陷阱，且 pnpm script 也變乾淨。
 */
const here = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(here, '../../../.env')
try {
  process.loadEnvFile(envPath)
} catch {
  // .env 不存在時靜默跳過（prod / CI 用系統環境變數的情況）
}

/** 環境變數集中管理 */
export const config = {
  port: Number(process.env.PORT) || 4100,
  databaseUrl:
    process.env.DATABASE_URL ||
    'postgresql://rag:rag@localhost:25432/rag_playground',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  voyageApiKey: process.env.VOYAGE_API_KEY || '',
} as const
