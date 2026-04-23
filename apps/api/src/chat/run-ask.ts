import { answer } from './answer.js'
import { pool } from '../ingest/db.js'

/**
 * CLI：端到端測試 RAG chat。
 *
 * 用法：
 *   pnpm -F api ask -- "完美紅寶石怎麼合成"
 *   pnpm -F api ask -- "聖甲蟲 rune word" --k 8
 */

const args = process.argv.slice(2)
let topK = 5
const queryParts: string[] = []

for (let i = 0; i < args.length; i++) {
  const a = args[i]!
  if (a === '--') continue
  if (a === '--k' || a === '-k') {
    topK = Number(args[++i])
  } else {
    queryParts.push(a)
  }
}

const query = queryParts.join(' ').trim()
if (!query) {
  console.error('用法：pnpm -F api ask -- "<query>" [--k N]')
  process.exit(1)
}

console.log(`❓ ${query}\n`)
console.log('─'.repeat(60))

try {
  const { hits, usage } = await answer(query, {
    topK,
    onText: (t) => process.stdout.write(t),
  })

  console.log('\n' + '─'.repeat(60))
  console.log('📚 引用來源：')
  hits.forEach((h, i) => {
    const title = (h.metadata.title as string | undefined) ?? '(no title)'
    console.log(`  [${i + 1}] ${title}  (sim=${h.similarity.toFixed(3)})`)
  })

  console.log('\n💰 Usage：')
  console.log(`  input        : ${usage.input_tokens}`)
  console.log(`  output       : ${usage.output_tokens}`)
  if (usage.cache_read_input_tokens) {
    console.log(`  cache_read   : ${usage.cache_read_input_tokens}`)
  }
  if (usage.cache_creation_input_tokens) {
    console.log(`  cache_create : ${usage.cache_creation_input_tokens}`)
  }
} finally {
  await pool.end()
}
