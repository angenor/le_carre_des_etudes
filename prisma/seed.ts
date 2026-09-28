// Point d'entrée de `pnpm prisma db seed` (prisma.config.ts → migrations.seed).
import { prisma } from '../server/utils/prisma'
import { seedSalm } from './seed/salm'

async function main() {
  const salm = await seedSalm()
  if (salm.length) {
    console.log('Seed SALM terminé, éditions créées :')
    console.table(salm)
  }
  else {
    console.log('Seed SALM terminé : aucune édition à créer.')
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error('Échec du seed :', error)
    await prisma.$disconnect()
    process.exit(1)
  })
