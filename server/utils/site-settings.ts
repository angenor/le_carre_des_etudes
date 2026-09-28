import { prisma } from './prisma'

// Réglages globaux du site (ligne unique id = 1). Cache mémoire court : le conteneur est mono-processus,
// et l'écriture passe par setMaintenanceMode, qui met le cache à jour immédiatement.

const CACHE_MS = 5000
let cache: { maintenanceMode: boolean; at: number } | null = null

export async function isMaintenanceMode(): Promise<boolean> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.maintenanceMode
  const row = await prisma.siteSettings.findUnique({ where: { id: 1 }, select: { maintenanceMode: true } })
  cache = { maintenanceMode: row?.maintenanceMode ?? false, at: Date.now() }
  return cache.maintenanceMode
}

export async function setMaintenanceMode(enabled: boolean): Promise<boolean> {
  const row = await prisma.siteSettings.upsert({
    where: { id: 1 },
    create: { id: 1, maintenanceMode: enabled },
    update: { maintenanceMode: enabled },
    select: { maintenanceMode: true },
  })
  cache = { maintenanceMode: row.maintenanceMode, at: Date.now() }
  return row.maintenanceMode
}
