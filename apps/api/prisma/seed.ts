import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.staffUser.createMany({
    data: [
      { name: 'Görevli 1', pinCode: '1234' },
      { name: 'Görevli 2', pinCode: '5678' },
    ],
    skipDuplicates: true,
  })

  const event = await prisma.event.upsert({
    where: { id: 'seed-event-1' },
    update: {},
    create: {
      id: 'seed-event-1',
      title: 'Test Etkinliği',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      location: 'Toplantı Salonu A',
    },
  })

  console.log('Seed tamamlandı:', { event })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
