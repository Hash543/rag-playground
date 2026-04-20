import type { DocumentChunk } from '@rag-playground/shared'

/**
 * 把 Markdown 以 `## ` 標題為邊界切成獨立 chunk。
 *
 * 設計假設：
 * - 每個 `## ` 區塊在語意上自成完整單位（例如一個配方）
 * - `## ` 之前的內容（檔頭說明）會被捨棄，不進入檢索
 *
 * metadata 額外抽出 title 與 category，讓後續檢索/過濾能直接用結構化欄位。
 */
export function chunkByHeading(
  source: string,
  markdown: string,
): DocumentChunk[] {
  // 以行首 `## `（不含 `### `）切割。slice(1) 丟棄第一段——那是檔頭，不是內容。
  const sections = markdown.split(/^## /m).slice(1)

  return sections.map((section, index) => {
    const content = `## ${section}`.trim()
    const title = section.split(/\r?\n/, 1)[0]?.trim() ?? `chunk-${index}`
    const category = content.match(/\*\*分類\*\*：(.+)/)?.[1]?.trim() ?? ''

    return {
      id: `${source}#${index}`,
      source,
      chunkIndex: index,
      content,
      metadata: { title, category },
    }
  })
}
