import { defineEventHandler } from 'h3'
import { getDashboardSummary } from '../../../utils/salm-stats'

// Encart SALM du tableau de bord : `null` sans édition publiée (contrat § 11, FR-197a).
export default defineEventHandler(() => getDashboardSummary())
