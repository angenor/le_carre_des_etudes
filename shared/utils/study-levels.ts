// Niveaux d'étude communs au module magazine (DownloadModal, /api/downloads) et au module SALM.
export const STUDY_LEVELS = [
  'Terminale / Futur bachelier',
  'BTS / DUT (Bac+2)',
  'Licence (Bac+3)',
  'Master (Bac+5)',
  'Doctorat',
  'Autre',
] as const

export type StudyLevel = (typeof STUDY_LEVELS)[number]

export function isStudyLevel(value: unknown): value is StudyLevel {
  return typeof value === 'string' && (STUDY_LEVELS as readonly string[]).includes(value)
}
