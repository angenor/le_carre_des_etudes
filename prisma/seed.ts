// Point d'entrée de `pnpm prisma db seed` (prisma.config.ts → migrations.seed).
import { prisma } from '../server/utils/prisma'
import { seedSalm } from './seed/salm'

async function main() {
  const salm = await seedSalm()
  console.log('Seed SALM terminé :')
  console.table(salm)
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
