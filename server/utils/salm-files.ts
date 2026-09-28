import { access, unlink } from 'node:fs/promises'
import { join } from 'node:path'
import { prisma } from './prisma'

// Fichiers du module SALM : chemins acceptés dans les contenus et libération des envois (research R3, R15).
// `/images/salm/…` : images statiques du seed, jamais supprimées.
// `/uploads/salm/…` : envois du back-office, supprimés quand plus aucune ligne ne les référence.

const IMAGE_PATH = /^\/(uploads|images)\/salm\/[a-z0-9][a-z0-9._/-]*\.(jpe?g|png|webp)$/i
const PDF_PATH = /^\/uploads\/salm\/[a-z0-9][a-z0-9._-]*\.pdf$/i
const UPLOAD_PREFIX = '/uploads/salm/'

export function isSalmImagePath(p: string): boolean {
  return IMAGE_PATH.test(p) && !p.includes('..')
}

export function isSalmPdfPath(p: string): boolean {
  return PDF_PATH.test(p) && !p.includes('..')
}

/** Un envoi doit exister sur le disque ; une image statique du seed est supposée présente. */
export async function salmFileExists(p: string): Promise<boolean> {
  if (!p.startsWith(UPLOAD_PREFIX)) return true
  try {
    await access(join(process.cwd(), 'public', p))
    return true
  }
  catch {
    return false
  }
}

async function referenceCount(p: string): Promise<number> {
  const counts = await Promise.all([
    prisma.salmEdition.count({ where: { OR: [{ posterPath: p }, { recapPosterPath: p }, { programPdfPath: p }] } }),
    prisma.salmHighlight.count({ where: { imagePath: p } }),
    prisma.salmPhoto.count({ where: { imagePath: p } }),
    prisma.salmVideo.count({ where: { thumbnailPath: p } }),
  ])
  return counts.reduce((a, b) => a + b, 0)
}

/** À appeler après l'écriture en base : supprime les envois qui ne sont plus référencés. */
export async function releaseSalmFiles(paths: (string | null | undefined)[]): Promise<void> {
  const uploads = [...new Set(paths.filter((p): p is string => !!p && p.startsWith(UPLOAD_PREFIX) && !p.includes('..')))]
  for (const p of uploads) {
    if (await referenceCount(p)) continue
    try {
      await unlink(join(process.cwd(), 'public', p))
    }
    catch {
      // Fichier déjà absent : rien à faire
    }
  }
}
