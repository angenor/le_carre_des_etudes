import { defineEventHandler, createError, setResponseStatus, getRequestHeaders, type H3Event } from 'h3'
import { mkdir } from 'node:fs/promises'
import { createWriteStream } from 'node:fs'
import { join, extname } from 'node:path'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import Busboy from 'busboy'
import sharp from 'sharp'

const ALLOWED_CATEGORIES = ['magazines', 'rubriques', 'partenaires', 'homepage'] as const
type Category = typeof ALLOWED_CATEGORIES[number]

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.tiff']
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50 Mo

/**
 * Nettoie un nom de fichier : supprime les caractères spéciaux,
 * remplace les espaces par des tirets, met en minuscules.
 */
function sanitizeFilename(filename: string): string {
  const ext = extname(filename)
  const name = filename.slice(0, filename.length - ext.length)

  const sanitized = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
    .replace(/[^a-zA-Z0-9_\-. ]/g, '') // Garde uniquement alphanumérique, _, -, .
    .replace(/\s+/g, '-') // Espaces → tirets
    .replace(/-+/g, '-') // Tirets multiples → un seul
    .replace(/^-|-$/g, '') // Supprime tirets en début/fin
    .toLowerCase()

  return sanitized + ext.toLowerCase()
}

/**
 * Génère une version OG (Open Graph) optimisée pour le SEO.
 * Lit le fichier depuis le disque (pas de buffer en RAM).
 */
async function generateOgImage(inputPath: string, outputPath: string): Promise<void> {
  await sharp(inputPath)
    .resize(1200, 630, { fit: 'cover', position: 'center' })
    .jpeg({ quality: 80, progressive: true })
    .toFile(outputPath)
}

interface ParsedUpload {
  filename: string
  filePath: string
  category: string
  bytesWritten: number
}

/**
 * Parse le multipart en streaming : écrit le fichier directement sur le disque
 * sans jamais le charger entièrement en mémoire.
 */
function parseMultipart(event: H3Event): Promise<ParsedUpload> {
  return new Promise((resolve, reject) => {
    const headers = getRequestHeaders(event)
    const busboy = Busboy({
      headers: { 'content-type': headers['content-type'] || '' },
      limits: { fileSize: MAX_FILE_SIZE, files: 1 },
    })

    let category = ''
    let filename = ''
    let filePath = ''
    let uploadDir = ''
    let bytesWritten = 0
    let fileProcessed = false
    let fileLimitExceeded = false

    busboy.on('field', (name, value) => {
      if (name === 'category') {
        category = value.trim()
      }
    })

    busboy.on('file', async (fieldname, stream, info) => {
      if (fieldname !== 'file' || !info.filename) {
        stream.resume()
        return
      }

      // On doit attendre la catégorie — elle peut arriver après le fichier dans le multipart.
      // Mais en pratique le client envoie file puis category, ou l'inverse.
      // On écrit d'abord dans un dossier temporaire, puis on déplace si besoin.
      // Approche simplifiée : on attend que busboy ait lu la catégorie via un petit délai,
      // mais en fait FormData envoie les champs dans l'ordre d'append.
      // Le client append 'file' puis 'category', donc category arrive APRÈS le fichier.
      // Solution : écrire dans un temp, puis renommer.

      const timestamp = Date.now()
      const sanitized = sanitizeFilename(info.filename)
      filename = `${timestamp}-${sanitized}`

      // Écrire dans un dossier temporaire d'abord
      const tempDir = join(process.cwd(), 'public', 'uploads', '_tmp')
      await mkdir(tempDir, { recursive: true })
      filePath = join(tempDir, filename)

      const writeStream = createWriteStream(filePath)

      stream.on('data', (chunk: Buffer) => {
        bytesWritten += chunk.length
      })

      stream.on('limit', () => {
        fileLimitExceeded = true
        writeStream.destroy()
      })

      pipeline(stream, writeStream)
        .then(() => { fileProcessed = true })
        .catch((err) => {
          if (!fileLimitExceeded) reject(err)
        })
    })

    busboy.on('finish', async () => {
      if (fileLimitExceeded) {
        // Nettoyer le fichier partiel
        const { unlink } = await import('node:fs/promises')
        try { await unlink(filePath) } catch { /* ignore */ }
        return reject(createError({
          statusCode: 413,
          message: 'Le fichier dépasse la taille maximale autorisée (50 Mo).',
        }))
      }

      if (!filename || !fileProcessed) {
        return reject(createError({
          statusCode: 400,
          message: 'Le champ "file" est requis et doit contenir un fichier.',
        }))
      }

      if (!category) {
        return reject(createError({
          statusCode: 400,
          message: 'Le champ "category" est requis.',
        }))
      }

      if (!ALLOWED_CATEGORIES.includes(category as Category)) {
        const { unlink } = await import('node:fs/promises')
        try { await unlink(filePath) } catch { /* ignore */ }
        return reject(createError({
          statusCode: 400,
          message: `Catégorie invalide : "${category}". Valeurs acceptées : ${ALLOWED_CATEGORIES.join(', ')}.`,
        }))
      }

      // Déplacer le fichier du dossier temp vers le bon dossier catégorie
      uploadDir = join(process.cwd(), 'public', 'uploads', category)
      await mkdir(uploadDir, { recursive: true })
      const finalPath = join(uploadDir, filename)
      const { rename } = await import('node:fs/promises')
      await rename(filePath, finalPath)

      resolve({ filename, filePath: finalPath, category, bytesWritten })
    })

    busboy.on('error', reject)

    // Connecter la requête au parser busboy
    const nodeReq = event.node.req
    if (nodeReq.readable) {
      nodeReq.pipe(busboy)
    } else {
      // Fallback si le body a déjà été consommé partiellement
      Readable.from(nodeReq).pipe(busboy)
    }
  })
}

export default defineEventHandler(async (event) => {
  return await handleUpload(event)
})

async function handleUpload(event: H3Event) {
  const parsed = await parseMultipart(event)

  const publicPath = `/uploads/${parsed.category}/${parsed.filename}`

  // Générer la version OG si c'est une image (lecture depuis le disque)
  const ext = extname(parsed.filename).toLowerCase()
  let ogPath: string | null = null

  if (IMAGE_EXTENSIONS.includes(ext)) {
    const baseName = parsed.filename.slice(0, parsed.filename.length - ext.length)
    const ogFilename = `${baseName}-og.jpg`
    const uploadDir = join(process.cwd(), 'public', 'uploads', parsed.category)
    const ogFilePath = join(uploadDir, ogFilename)

    try {
      await generateOgImage(parsed.filePath, ogFilePath)
      ogPath = `/uploads/${parsed.category}/${ogFilename}`
    } catch {
      // Si la génération OG échoue, on continue sans (non bloquant)
    }
  }

  setResponseStatus(event, 201)
  return { path: publicPath, ogPath }
}
