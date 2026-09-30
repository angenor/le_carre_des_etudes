import { defineEventHandler, createError, setResponseStatus, getRequestHeaders, type H3Event } from 'h3'
import { mkdir, open, rename, stat, unlink } from 'node:fs/promises'
import { createWriteStream } from 'node:fs'
import { join, extname } from 'node:path'
import { Readable, Transform } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import Busboy from 'busboy'
import sharp from 'sharp'

const ALLOWED_CATEGORIES = ['magazines', 'rubriques', 'partenaires', 'homepage', 'salm'] as const
type Category = typeof ALLOWED_CATEGORIES[number]

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.tiff']
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50 Mo

// Catégorie `salm` (specs/007-salm-admin-contenus, research R2) : contenu réel contrôlé, pas d'image OG.
const SALM_MAX_UPLOAD = 10 * 1024 * 1024 // 10 Mo
const SALM_MAX_IMAGE = 5 * 1024 * 1024 // 5 Mo
const SALM_IMAGE_FORMATS: Record<string, string> = { jpeg: '.jpg', png: '.png', webp: '.webp' }

// `variants=web` : images agrandissables au clic (photos SALM, rubriques). Le fichier reçu est gardé tel quel
// (`originalPath`, affiché en grand) et une version web légère en est tirée (`path`, affichée partout ailleurs).
const WEB_MAX_SIDE = 1600
const WEB_QUALITY = 80

function salmError(statusCode: number, code: string) {
  return createError({ statusCode, message: code, data: { code } })
}

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

/** Version web : WebP, 1600 px au plus sur le plus grand côté, jamais agrandie. */
async function generateWebImage(inputPath: string, outputPath: string): Promise<void> {
  await sharp(inputPath)
    .rotate()
    .resize({ width: WEB_MAX_SIDE, height: WEB_MAX_SIDE, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: WEB_QUALITY })
    .toFile(outputPath)
}

/**
 * Crée la version web à côté de l'original (`<nom>-web.webp`) et renvoie son chemin public.
 * En cas d'échec, l'original est supprimé : on ne garde pas une image à moitié enregistrée.
 */
async function addWebVariant(category: string, filename: string): Promise<string> {
  const dir = join(process.cwd(), 'public', 'uploads', category)
  const base = filename.slice(0, filename.length - extname(filename).length)
  const webFilename = `${base}-web.webp`
  try {
    await generateWebImage(join(dir, filename), join(dir, webFilename))
  }
  catch {
    try { await unlink(join(dir, filename)) } catch { /* ignore */ }
    try { await unlink(join(dir, webFilename)) } catch { /* ignore */ }
    throw category === 'salm'
      ? salmError(422, 'CORRUPTED_FILE')
      : createError({ statusCode: 422, message: "Impossible de préparer la version web de l'image." })
  }
  return `/uploads/${category}/${webFilename}`
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
  kind: string
  variants: string
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
    let kind = ''
    let variants = ''
    let filename = ''
    let filePath = ''
    let uploadDir = ''
    let bytesWritten = 0
    let fileProcessed = false
    let fileLimitExceeded = false
    let salmLimitExceeded = false
    let pipelinePromise: Promise<void> | null = null

    busboy.on('field', (name, value) => {
      if (name === 'category') {
        category = value.trim()
      }
      if (name === 'kind') {
        kind = value.trim()
      }
      if (name === 'variants') {
        variants = value.trim()
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

      // Limite de 10 Mo pour `salm` (catégorie envoyée avant le fichier) : l'excédent est écarté
      // sans interrompre la lecture de la requête.
      const cap = category === 'salm' ? SALM_MAX_UPLOAD : Infinity
      let capped = 0
      const limiter = new Transform({
        transform(chunk: Buffer, _encoding, callback) {
          capped += chunk.length
          if (capped > cap) salmLimitExceeded = true
          callback(null, salmLimitExceeded ? undefined : chunk)
        },
      })

      pipelinePromise = pipeline(stream, limiter, writeStream)
        .then(() => { fileProcessed = true })
        .catch((err) => {
          if (!fileLimitExceeded) reject(err)
        })
    })

    busboy.on('finish', async () => {
      // Attendre que le fichier soit entièrement écrit sur le disque
      // avant de vérifier fileProcessed (évite la race condition)
      if (pipelinePromise) {
        await pipelinePromise
      }

      if (salmLimitExceeded || (fileLimitExceeded && category === 'salm')) {
        try { await unlink(filePath) } catch { /* ignore */ }
        return reject(salmError(413, 'FILE_TOO_LARGE'))
      }

      if (fileLimitExceeded) {
        // Nettoyer le fichier partiel
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
      await rename(filePath, finalPath)

      resolve({ filename, filePath: finalPath, category, kind, variants, bytesWritten })
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

/**
 * Contrôles de la catégorie `salm` : format réel et poids. Renvoie le nom définitif du fichier
 * (extension déduite du contenu, sans `_`, pour respecter les chemins acceptés par les contenus SALM).
 * Un fichier refusé est supprimé.
 */
async function checkSalmUpload(parsed: ParsedUpload): Promise<string> {
  const reject = async (statusCode: number, code: string) => {
    try { await unlink(parsed.filePath) } catch { /* ignore */ }
    return salmError(statusCode, code)
  }
  const { size } = await stat(parsed.filePath)
  const ext = extname(parsed.filename)
  const base = parsed.filename.slice(0, parsed.filename.length - ext.length).replace(/_/g, '-')
  let finalExt: string

  if (parsed.kind === 'pdf') {
    if (size > SALM_MAX_UPLOAD) throw await reject(413, 'FILE_TOO_LARGE')
    const handle = await open(parsed.filePath, 'r')
    const head = Buffer.alloc(5)
    try { await handle.read(head, 0, 5, 0) } finally { await handle.close() }
    if (head.toString('latin1') !== '%PDF-') throw await reject(415, 'UNSUPPORTED_FORMAT')
    finalExt = '.pdf'
  }
  else if (!parsed.kind || parsed.kind === 'image') {
    // Un original gardé pour l'agrandissement peut peser jusqu'à 10 Mo : c'est sa version web qui est servie en liste
    if (size > (parsed.variants === 'web' ? SALM_MAX_UPLOAD : SALM_MAX_IMAGE)) throw await reject(413, 'FILE_TOO_LARGE')
    let format: string | undefined
    try {
      format = (await sharp(parsed.filePath).metadata()).format
    }
    catch {
      throw await reject(422, 'CORRUPTED_FILE')
    }
    const imageExt = format ? SALM_IMAGE_FORMATS[format] : undefined
    if (!imageExt) throw await reject(415, 'UNSUPPORTED_FORMAT')
    finalExt = imageExt
  }
  else {
    throw await reject(400, 'INVALID_KIND')
  }

  const filename = `${base}${finalExt}`
  if (filename !== parsed.filename) {
    await rename(parsed.filePath, join(process.cwd(), 'public', 'uploads', 'salm', filename))
  }
  return filename
}

async function handleUpload(event: H3Event) {
  const parsed = await parseMultipart(event)

  if (parsed.category === 'salm') {
    const filename = await checkSalmUpload(parsed)
    const publicPath = `/uploads/salm/${filename}`
    setResponseStatus(event, 201)
    if (parsed.variants === 'web' && parsed.kind !== 'pdf') {
      return { path: await addWebVariant('salm', filename), originalPath: publicPath, ogPath: null }
    }
    return { path: publicPath, originalPath: null, ogPath: null }
  }

  const publicPath = `/uploads/${parsed.category}/${parsed.filename}`

  // Générer la version OG si c'est une image (lecture depuis le disque)
  const ext = extname(parsed.filename).toLowerCase()
  let ogPath: string | null = null
  const webPath = parsed.variants === 'web' && IMAGE_EXTENSIONS.includes(ext)
    ? await addWebVariant(parsed.category, parsed.filename)
    : null

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
  return webPath
    ? { path: webPath, originalPath: publicPath, ogPath }
    : { path: publicPath, originalPath: null, ogPath }
}
