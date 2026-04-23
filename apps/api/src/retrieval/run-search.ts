import { search } from './search.js'
import { pool } from '../ingest/db.js'

/**
 * CLI：從 terminal 測試檢索品質。
 *
 * 用法：
 *   pnpm -F api search -- "火把怎麼合成"
 *   pnpm -F api search -- "完美寶石" --k 10
 */

const args = process.argv.slice(2)
let topK = 5
const queryParts: string[] = []

for (let i = 0; i < args.length; i++) {
  const a = args[i]!
  if (a === '--') continue // pnpm 的 argv 分隔符有時會漏進來，忽略
  if (a === '--k' || a === '-k') {
    topK = Number(args[++i])
  } else {
    queryParts.push(a)
  }
}

const query = queryParts.join(' ').trim()

if (!query) {
  console.error('用法：pnpm -F api search -- "<query>" [--k N]')
  process.exit(1)
}

console.log(`🔍 query: "${query}" (top ${topK})\n`)

try {
  const hits = await search(query, topK)
  hits.forEach((h, i) => {
    const title = (h.metadata.title as string | undefined) ?? '(no title)'
    const category = (h.metadata.category as string | undefined) ?? ''
    const preview = h.content
      .split('\n')
      .slice(0, 4)
      .join(' ⏎ ')
      .slice(0, 160)
    console.log(
      `[#${i + 1}] similarity=${h.similarity.toFixed(4)}  distance=${h.distance.toFixed(4)}`,
    )
    console.log(`  title   : ${title}`)
    console.log(`  category: ${category}`)
    console.log(`  source  : ${h.source}#${h.chunkIndex}`)
    console.log(`  preview : ${preview}...`)
    console.log()
  })
} finally {
  await pool.end()
}
