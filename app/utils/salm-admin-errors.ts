// Textes français des codes d'erreur du back-office SALM (specs/007-salm-admin-contenus, research R10).
// Le serveur renvoie des codes (`data.code`, `data.errors[champ]`) ; l'interface les traduit ici.

// Constantes exportées par une liste : le scanner d'auto-imports de Nuxt prendrait les virgules
// d'une chaîne pour plusieurs déclarations.
const SALM_IMAGE_RULES = 'JPEG, PNG ou WebP, 5 Mo au plus'
const SALM_PDF_RULES = 'PDF, 10 Mo au plus'
const SALM_YOUTUBE_ERROR = 'Saisissez l\'adresse d\'une vidéo YouTube (ex. https://youtu.be/…).'
export { SALM_IMAGE_RULES, SALM_PDF_RULES, SALM_YOUTUBE_ERROR }

const GENERIC_ERROR = 'Une erreur est survenue. Réessayez dans un instant.'

export interface SalmAdminErrorContext {
  /** Année concernée (édition existante, verrou, duplication). */
  year?: number
  /** Nombre d'éléments concernés (établissements d'un type de stand). */
  count?: number
  /** Type de fichier envoyé, pour les messages de format et de poids. */
  kind?: 'image' | 'pdf'
}

/** Erreur lue dans une réponse `$fetch` ou un envoi XHR : statut, code et erreurs de champ. */
export interface SalmAdminError {
  status: number | undefined
  code: string | undefined
  errors: Record<string, string>
  data: Record<string, unknown>
}

export function parseSalmAdminError(err: unknown): SalmAdminError {
  const e = err as { status?: number; statusCode?: number; code?: string; data?: { data?: Record<string, unknown> } }
  const data = e?.data?.data ?? {}
  return {
    status: e?.status ?? e?.statusCode,
    code: (data.code as string | undefined) ?? e?.code,
    errors: (data.errors as Record<string, string> | undefined) ?? {},
    data,
  }
}

export function salmAdminErrorMessage(code: string | undefined, context: SalmAdminErrorContext = {}): string {
  const { year, count, kind } = context
  switch (code) {
    case 'UNAUTHORIZED':
      return 'Votre session a expiré. Reconnectez-vous.'
    case 'YEAR_TAKEN':
      return year ? `Une édition ${year} existe déjà.` : 'Une édition existe déjà pour cette année.'
    case 'YEAR_LOCKED':
      return 'L\'année ne peut plus changer : des badges ont déjà été émis pour cette édition.'
    case 'NO_DAYS':
      return 'Ajoutez au moins un jour au chronogramme avant de publier.'
    case 'EDITION_ENDED':
      return 'Ce salon est terminé : l\'édition ne peut plus être republiée.'
    case 'INVALID_TRANSITION':
      return 'Ce changement de statut n\'est pas possible.'
    case 'ALREADY_ARCHIVED':
      return 'Cette édition est déjà archivée.'
    case 'EDITION_NOT_DELETABLE':
      return 'Seul un brouillon qui n\'a jamais reçu d\'inscription peut être supprimé.'
    case 'LAST_DAY_OF_PUBLISHED':
      return 'Une édition publiée garde au moins un jour : ajoutez-en un autre avant de supprimer celui-ci.'
    case 'STAND_TYPE_IN_USE':
      return `Choisi par ${count ?? 'des'} établissement${(count ?? 2) > 1 ? 's' : ''} : vous pouvez seulement le masquer.`
    case 'ORDER_MISMATCH':
      return 'La liste a changé entre-temps. Elle a été rechargée : recommencez le déplacement.'
    case 'FILE_TOO_LARGE':
      return `Fichier trop lourd (${kind === 'pdf' ? SALM_PDF_RULES : SALM_IMAGE_RULES}).`
    case 'UNSUPPORTED_FORMAT':
      return `Format non accepté (${kind === 'pdf' ? SALM_PDF_RULES : SALM_IMAGE_RULES}).`
    case 'CORRUPTED_FILE':
      return `Fichier illisible ou endommagé (${kind === 'pdf' ? SALM_PDF_RULES : SALM_IMAGE_RULES}).`
    case 'FILE_NOT_FOUND':
      return 'Le fichier envoyé est introuvable. Envoyez-le à nouveau.'
    case 'NOT_FOUND':
      return 'Élément introuvable : il a peut-être été supprimé. Rechargez la page.'
    case 'NETWORK':
      return 'Erreur réseau : vérifiez votre connexion et réessayez.'
    case 'VALIDATION':
      return 'Certains champs sont à corriger.'
    default:
      return GENERIC_ERROR
  }
}

/** Message principal d'une erreur `$fetch` ou XHR du back-office SALM. */
export function salmAdminErrorFrom(err: unknown, context: SalmAdminErrorContext = {}): string {
  const { status, code, data } = parseSalmAdminError(err)
  if (status === 401) return salmAdminErrorMessage('UNAUTHORIZED')
  return salmAdminErrorMessage(code, {
    ...context,
    year: typeof data.year === 'number' ? data.year : context.year,
    count: typeof data.count === 'number' ? data.count : context.count,
  })
}

const FIELD_SPECIFIC: Record<string, Partial<Record<string, string>>> = {
  youtubeUrl: { INVALID_FORMAT: SALM_YOUTUBE_ERROR, REQUIRED: SALM_YOUTUBE_ERROR },
  recapVideoUrl: { INVALID_FORMAT: SALM_YOUTUBE_ERROR },
  email: { INVALID_FORMAT: 'Adresse e-mail invalide.' },
  phone: { INVALID_FORMAT: 'Numéro ivoirien à 10 chiffres attendu (ex. 07 68 01 14 09).' },
  year: { INVALID_FORMAT: 'Année de 2020 à 2100 attendue.', DUPLICATE: 'Une édition existe déjà pour cette année.' },
  date: { INVALID_FORMAT: 'Date invalide.', DUPLICATE: 'Ce jour figure déjà au chronogramme.' },
  opensAt: { INVALID_FORMAT: 'Heure au format HH:MM attendue.' },
  closesAt: { INVALID_FORMAT: 'La fermeture doit être postérieure à l\'ouverture.' },
  startTime: { INVALID_FORMAT: 'Heure au format HH:MM attendue.' },
  endTime: { INVALID_FORMAT: 'La fin doit être postérieure au début.' },
  name: { DUPLICATE: 'Un type de stand porte déjà ce nom (majuscules et minuscules confondues).' },
  kind: { INVALID_CHOICE: 'Choisissez un type dans la liste.' },
  onBadge: { INVALID_CHOICE: 'Seul un téléphone peut être imprimé sur le badge.' },
  imagePath: { REQUIRED: 'Choisissez une image.', INVALID_FORMAT: `Image non acceptée (${SALM_IMAGE_RULES}).` },
  posterPath: { INVALID_FORMAT: `Image non acceptée (${SALM_IMAGE_RULES}).` },
  recapPosterPath: { INVALID_FORMAT: `Image non acceptée (${SALM_IMAGE_RULES}).` },
  programPdfPath: { INVALID_FORMAT: `Fichier non accepté (${SALM_PDF_RULES}).` },
  audiences: { TOO_MANY: '6 publics au plus.' },
  contacts: { TOO_MANY: '8 contacts au plus.' },
  keyFigures: { TOO_MANY: '6 chiffres au plus.' },
  body: { REQUIRED: 'Aucune modification à enregistrer.' },
}

const FIELD_GENERIC: Record<string, string> = {
  REQUIRED: 'Champ obligatoire.',
  TOO_SHORT: 'Texte trop court.',
  TOO_LONG: 'Texte trop long.',
  INVALID_FORMAT: 'Format invalide.',
  INVALID_CHOICE: 'Choix invalide.',
  INVALID_CHARS: 'Caractères non autorisés.',
  TOO_MANY: 'Trop d\'éléments.',
  DUPLICATE: 'Cette valeur existe déjà.',
  FILE_NOT_FOUND: 'Le fichier envoyé est introuvable. Envoyez-le à nouveau.',
}

/**
 * Message d'une erreur de champ. `field` est le nom du champ (`closesAt`, `youtubeUrl`…) ; pour un
 * champ de tableau (`contacts.2.value`), passer le nom qui porte le sens (`phone`, `email`…).
 */
export function salmFieldErrorMessage(field: string, code: string | undefined, maxLength?: number): string {
  if (!code) return ''
  const key = field.split('.').at(-1) ?? field
  const specific = FIELD_SPECIFIC[field]?.[code] ?? FIELD_SPECIFIC[key]?.[code]
  if (specific) return specific
  if (code === 'TOO_LONG' && maxLength) return `${maxLength} caractères au plus.`
  return FIELD_GENERIC[code] ?? GENERIC_ERROR
}
