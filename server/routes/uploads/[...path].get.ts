import { defineEventHandler, createError, setResponseHeader, sendStream } from 'h3'
import { createReadStream, existsSync } from 'node:fs'
import { join, extname } from 'node:path'

const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
}

export default defineEventHandler(async (event) => {
  const path = event.context.params?.path
  if (!path) {
    throw createError({ statusCode: 400, message: 'Chemin manquant' })
  }

  // Empecher la traversee de repertoire
  if (path.includes('..')) {
    throw createError({ statusCode: 400, message: 'Chemin invalide' })
  }

  const filePath = join(process.cwd(), 'public', 'uploads', path)

  if (!existsSync(filePath)) {
    throw createError({ statusCode: 404, message: 'Fichier non trouve' })
  }

  const ext = extname(filePath).toLowerCase()
  const contentType = MIME_TYPES[ext] || 'application/octet-stream'

  setResponseHeader(event, 'Content-Type', contentType)
  setResponseHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')

  return sendStream(event, createReadStream(filePath))
})
