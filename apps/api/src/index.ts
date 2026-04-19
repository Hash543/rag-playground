import Fastify from 'fastify'
import cors from '@fastify/cors'
import { config } from './config.js'
import type { HealthResponse } from '@rag-playground/shared'

const app = Fastify({ logger: true })

await app.register(cors)

/** 健康檢查端點 */
app.get<{ Reply: HealthResponse }>('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() }
})

try {
  await app.listen({ port: config.port, host: '0.0.0.0' })
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
