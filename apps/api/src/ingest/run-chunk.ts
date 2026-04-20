import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chunkByHeading } from './chunk.js'

// 用 import.meta.url 定位檔案，避免依賴 cwd——不管從哪裡 pnpm run 都能對上路徑
const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, '../../../../')
const inputPath = resolve(repoRoot, 'data/raw/cube-recipes.md')
const outputPath = resolve(repoRoot, 'data/processed/cube-recipes.json')

const markdown = await readFile(inputPath, 'utf8')
const chunks = chunkByHeading('cube-recipes.md', markdown)

await mkdir(dirname(outputPath), { recursive: true })
await writeFile(outputPath, JSON.stringify(chunks, null, 2), 'utf8')

console.log(`✅ 產生 ${chunks.length} 個 chunk → ${outputPath}`)
console.log('\n第一個 chunk 預覽：')
console.log(chunks[0])
console.log('\n分類分布：')
const counts = chunks.reduce<Record<string, number>>((acc, c) => {
  const cat = String(c.metadata.category || '未知')
  acc[cat] = (acc[cat] ?? 0) + 1
  return acc
}, {})
console.table(counts)
