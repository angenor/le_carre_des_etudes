import { defineEventHandler, readMultipartFormData, createError, setResponseStatus } from 'h3'
import { mkdir, writeFile } from 'node:fs/promises'
import { join, extname } from 'node:path'
import sharp from 'sharp'

const ALLOWED_CATEGORIES = ['magazines', 'rubriques', 'partenaires', 'homepage'] as const
type Category = typeof ALLOWED_CATEGORIES[number]

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.tiff']

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
 * Redimensionnée à 1200x630, JPEG qualité 80.
 */
async function generateOgImage(buffer: Buffer, outputPath: string): Promise<void> {
  await sharp(buffer)
    .resize(1200, 630, { fit: 'cover', position: 'center' })
    .jpeg({ quality: 80, progressive: true })
    .toFile(outputPath)
}

export default defineEventHandler(async (event) => {
  const formData = await readMultipartFormData(event)

  if (!formData || formData.length === 0) {
    throw createError({
      statusCode: 400,
      message: 'Aucune donnée reçue. Envoyez un formulaire multipart avec un fichier et une catégorie.',
    })
  }

  // Extraire le fichier et la catégorie depuis les champs du formulaire
  const filePart = formData.find((part) => part.name === 'file')
  const categoryPart = formData.find((part) => part.name === 'category')

  if (!filePart || !filePart.data || !filePart.filename) {
    throw createError({
      statusCode: 400,
      message: 'Le champ "file" est requis et doit contenir un fichier.',
    })
  }

  const category = categoryPart?.data?.toString().trim()

  if (!category) {
    throw createError({
      statusCode: 400,
      message: 'Le champ "category" est requis.',
    })
  }

  if (!ALLOWED_CATEGORIES.includes(category as Category)) {
    throw createError({
      statusCode: 400,
      message: `Catégorie invalide : "${category}". Valeurs acceptées : ${ALLOWED_CATEGORIES.join(', ')}.`,
    })
  }

  // Générer un nom de fichier unique : timestamp + nom original nettoyé
  const timestamp = Date.now()
  const sanitized = sanitizeFilename(filePart.filename)
  const uniqueFilename = `${timestamp}-${sanitized}`

  // Résoudre le chemin de destination
  const uploadDir = join(process.cwd(), 'public', 'uploads', category)
  const filePath = join(uploadDir, uniqueFilename)

  // Créer le répertoire s'il n'existe pas
  await mkdir(uploadDir, { recursive: true })

  // Écrire le fichier original sur le disque
  await writeFile(filePath, filePart.data)

  // Chemin public du fichier original
  const publicPath = `/uploads/${category}/${uniqueFilename}`

  // Générer la version OG si c'est une image
  const ext = extname(sanitized).toLowerCase()
  let ogPath: string | null = null

  if (IMAGE_EXTENSIONS.includes(ext)) {
    const baseName = sanitized.slice(0, sanitized.length - ext.length)
    const ogFilename = `${timestamp}-${baseName}-og.jpg`
    const ogFilePath = join(uploadDir, ogFilename)

    try {
      await generateOgImage(filePart.data, ogFilePath)
      ogPath = `/uploads/${category}/${ogFilename}`
    } catch {
      // Si la génération OG échoue, on continue sans (non bloquant)
    }
  }

  setResponseStatus(event, 201)
  return { path: publicPath, ogPath }
})
