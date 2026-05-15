type DocumentBlock =
  | { type: 'heading'; text: string; level: number }
  | { type: 'paragraph'; text: string }
  | { type: 'bullet'; text: string }
  | { type: 'blank' }

function removeTailoringNotes(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  const cleaned: string[] = []

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    const normalized = line
      .replace(/^#{1,6}\s*/, '')
      .replace(/\*\*/g, '')
      .trim()
      .toLowerCase()

    const isTailoringHeading =
      normalized === 'anpassning för rollen' ||
      normalized === 'tailoring for this role' ||
      normalized === 'role tailoring' ||
      normalized === 'anpassning'

    if (!isTailoringHeading) {
      cleaned.push(line)
      continue
    }

    index += 1
    while (index < lines.length) {
      const nextLine = lines[index]
      const trimmed = nextLine.trim()
      const isBullet = /^[-*•]\s+/.test(trimmed)
      const isBlank = trimmed.length === 0
      const isNextHeading = /^#{1,6}\s+/.test(trimmed) || /^\*\*[^*]+\*\*$/.test(trimmed)

      if (!isBullet && !isBlank && isNextHeading) {
        index -= 1
        break
      }

      if (!isBullet && !isBlank && cleaned.length > 0) {
        index -= 1
        break
      }

      index += 1
    }
  }

  return cleaned.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

export function markdownToPlainText(markdown: string): string {
  return removeTailoringNotes(markdown)
    .replace(/\r\n/g, '\n')
    .replace(/^```[\w-]*\s*/gm, '')
    .replace(/```/g, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*_]{3,}\s*$/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*\n]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_\n]+)_/g, '$1')
    .replace(/^\s*[-*•]\s+/gm, '- ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function createFileName(title: string, extension: string): string {
  const safeTitle = title
    .toLowerCase()
    .replace(/[^a-z0-9åäö]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)

  return `${safeTitle || 'careerbridge-document'}.${extension}`
}

function downloadBlob(content: BlobPart, mimeType: string, fileName: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function parseMarkdown(markdown: string): DocumentBlock[] {
  return removeTailoringNotes(markdown)
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((rawLine): DocumentBlock => {
      const line = rawLine.trim()
      if (!line) return { type: 'blank' }

      const heading = line.match(/^(#{1,3})\s+(.+)$/)
      if (heading) {
        return {
          type: 'heading',
          level: heading[1].length,
          text: markdownToInlineText(heading[2]),
        }
      }

      const boldHeading = line.match(/^\*\*([^*]+)\*\*$/)
      if (boldHeading) {
        return { type: 'heading', level: 3, text: markdownToInlineText(boldHeading[1]) }
      }

      const bullet = line.match(/^[-*•]\s+(.+)$/)
      if (bullet) return { type: 'bullet', text: markdownToInlineText(bullet[1]) }

      return { type: 'paragraph', text: markdownToInlineText(line) }
    })
}

function markdownToInlineText(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*\n]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_\n]+)_/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim()
}

function renderHtmlDocument(markdown: string, title: string): string {
  const blocks = parseMarkdown(markdown)
  const body = blocks
    .map((block) => {
      if (block.type === 'blank') return '<div class="spacer"></div>'
      if (block.type === 'heading') {
        const tag = block.level === 1 ? 'h1' : block.level === 2 ? 'h2' : 'h3'
        return `<${tag}>${escapeHtml(block.text)}</${tag}>`
      }
      if (block.type === 'bullet') return `<p class="bullet">• ${escapeHtml(block.text)}</p>`
      return `<p>${escapeHtml(block.text)}</p>`
    })
    .join('\n')

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    body {
      color: #111827;
      font-family: Aptos, Calibri, Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.45;
      margin: 34px 46px;
    }
    h1 {
      border-bottom: 2px solid #2563eb;
      color: #0f172a;
      font-size: 22pt;
      margin: 0 0 14px;
      padding-bottom: 8px;
    }
    h2 {
      color: #1e3a8a;
      font-size: 14pt;
      margin: 18px 0 7px;
      text-transform: uppercase;
    }
    h3 {
      color: #0f172a;
      font-size: 12pt;
      margin: 13px 0 5px;
    }
    p {
      margin: 0 0 7px;
    }
    .bullet {
      margin-left: 16px;
    }
    .spacer {
      height: 8px;
    }
  </style>
</head>
<body>
${body}
</body>
</html>`
}

function pdfText(text: string): string {
  return text
    // Keep the hand-built PDF stream inside WinAnsi-friendly characters.
    .replace(/[•]/g, '-')
    .replace(/[–—]/g, '-')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[^\x09\x0a\x0d\x20-\xff]/g, '?')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (next.length > maxChars && current) {
      lines.push(current)
      current = word
    } else {
      current = next
    }
  }

  if (current) lines.push(current)
  return lines.length ? lines : ['']
}

function createPdf(markdown: string, title: string): Uint8Array {
  const pageWidth = 595
  const pageHeight = 842
  const marginX = 54
  const marginTop = 58
  const marginBottom = 54
  const maxWidth = pageWidth - marginX * 2
  const pages: string[] = []
  let content = ''
  let y = pageHeight - marginTop

  const addPage = () => {
    if (content) pages.push(content)
    content = ''
    y = pageHeight - marginTop
  }

  const addTextLine = (text: string, size: number, font: 'F1' | 'F2', indent = 0) => {
    if (y < marginBottom + size * 1.4) addPage()
    content += `BT /${font} ${size} Tf ${marginX + indent} ${y.toFixed(2)} Td (${pdfText(text)}) Tj ET\n`
    y -= size * 1.45
  }

  const addWrappedText = (text: string, size: number, font: 'F1' | 'F2', indent = 0) => {
    const maxChars = Math.max(24, Math.floor((maxWidth - indent) / (size * 0.48)))
    wrapText(text, maxChars).forEach((line) => addTextLine(line, size, font, indent))
  }

  addWrappedText(title, 20, 'F2')
  y -= 6

  for (const block of parseMarkdown(markdown)) {
    if (block.type === 'blank') {
      y -= 7
      continue
    }

    if (block.type === 'heading') {
      y -= block.level === 1 ? 10 : 7
      addWrappedText(block.text, block.level === 1 ? 18 : block.level === 2 ? 14 : 12, 'F2')
      y -= 2
      continue
    }

    if (block.type === 'bullet') {
      addWrappedText(`• ${block.text}`, 10.5, 'F1', 14)
      continue
    }

    addWrappedText(block.text, 10.5, 'F1')
  }

  addPage()

  const objects: string[] = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    // PDF page references must be wrapped in an array or Acrobat rejects the file.
    `<< /Type /Pages /Kids [${pages.map((_, index) => `${5 + index * 2} 0 R`).join(' ')}] /Count ${pages.length} >>`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
  ]

  pages.forEach((pageContent, index) => {
    const contentObjectNumber = 6 + index * 2
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`)
    // Length must describe the exact PDF stream byte count.
    objects.push(`<< /Length ${pageContent.length} >>\nstream\n${pageContent}\nendstream`)
  })

  let pdf = '%PDF-1.4\n'
  const offsets = [0]
  objects.forEach((object, index) => {
    offsets.push(pdf.length)
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`
  })
  const xrefOffset = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  offsets.slice(1).forEach((offset) => {
    pdf += `${offset.toString().padStart(10, '0')} 00000 n \n`
  })
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`

  return Uint8Array.from(pdf, (char) => char.charCodeAt(0) & 0xff)
}

export async function copyCleanText(markdown: string) {
  await navigator.clipboard.writeText(markdownToPlainText(markdown))
}

export function downloadCleanText(markdown: string, title: string) {
  downloadBlob(
    markdownToPlainText(markdown),
    'text/plain;charset=utf-8',
    createFileName(title, 'txt'),
  )
}

export function downloadCleanWordDocument(markdown: string, title: string) {
  downloadBlob(
    renderHtmlDocument(markdown, title),
    'application/msword;charset=utf-8',
    createFileName(title, 'doc'),
  )
}

export function downloadCleanPdf(markdown: string, title: string) {
  const pdf = createPdf(markdown, title)
  const pdfBytes = pdf.buffer.slice(pdf.byteOffset, pdf.byteOffset + pdf.byteLength) as ArrayBuffer
  downloadBlob(pdfBytes, 'application/pdf', createFileName(title, 'pdf'))
  return true
}

export const exportCleanPdf = downloadCleanPdf
