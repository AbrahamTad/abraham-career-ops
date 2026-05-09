// CV text extraction from uploaded files

export async function extractTextFromFile(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  if (mimeType === 'text/plain' || mimeType === 'text/markdown') {
    return buffer.toString('utf-8')
  }

  if (mimeType === 'application/pdf') {
    const pdfParse = (await import('pdf-parse')).default
    const data = await pdfParse(buffer)
    return data.text
  }

  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword'
  ) {
    const mammoth = await import('mammoth')
    const result = await mammoth.extractRawText({ buffer })
    return result.value
  }

  throw new Error(`Unsupported file type: ${mimeType}`)
}

export function validateCVText(text: string): { valid: boolean; error?: string } {
  if (text.length < 100) {
    return { valid: false, error: 'CV verkar vara för kort. Kontrollera att filen innehåller text.' }
  }
  if (text.length > 50000) {
    return { valid: false, error: 'CV är för långt. Maximalt 50 000 tecken.' }
  }
  return { valid: true }
}
