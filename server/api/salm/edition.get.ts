import { defineEventHandler } from 'h3'
import { getPublicEditionPayload } from '../../utils/salm-edition'

// Contenu complet de l'édition publiée, ou { edition: null, previous: null } (FR-019).
export default defineEventHandler(() => getPublicEditionPayload())
