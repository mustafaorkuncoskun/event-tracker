import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'

const createSchema = z.object({
  title: z.string().min(1),
  date: z.string().datetime(),
  location: z.string().optional(),
})

const events: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', async () => {
    return fastify.prisma.event.findMany({ orderBy: { date: 'desc' } })
  })

  fastify.post('/', async (req, reply) => {
    const body = createSchema.parse(req.body)
    const event = await fastify.prisma.event.create({
      data: { ...body, date: new Date(body.date) },
    })
    return reply.code(201).send(event)
  })

  fastify.get('/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const event = await fastify.prisma.event.findUnique({ where: { id } })
    if (!event) return reply.code(404).send({ error: 'Etkinlik bulunamadı' })
    return event
  })

  fastify.put('/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const body = createSchema.partial().parse(req.body)
    const data: Record<string, unknown> = { ...body }
    if (body.date) data.date = new Date(body.date)
    const event = await fastify.prisma.event.update({ where: { id }, data })
    return event
  })

  fastify.delete('/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    await fastify.prisma.event.delete({ where: { id } })
    return reply.code(204).send()
  })

  // Dashboard istatistikleri
  fastify.get('/:id/dashboard', async (req, reply) => {
    const { id } = req.params as { id: string }
    const [total, checkedIn] = await Promise.all([
      fastify.prisma.invitation.count({ where: { eventId: id } }),
      fastify.prisma.checkIn.count({ where: { invitation: { eventId: id } } }),
    ])
    return { eventId: id, total, checkedIn, notArrived: total - checkedIn }
  })

  // Etkinliğe ait davetler + check-in durumu
  fastify.get('/:id/invitations', async (req, reply) => {
    const { id } = req.params as { id: string }
    return fastify.prisma.invitation.findMany({
      where: { eventId: id },
      include: { employee: true, checkin: { include: { staffUser: true } } },
      orderBy: { employee: { name: 'asc' } },
    })
  })

  // Etkinliğe ait check-in listesi
  fastify.get('/:id/checkins', async (req, reply) => {
    const { id } = req.params as { id: string }
    return fastify.prisma.checkIn.findMany({
      where: { invitation: { eventId: id } },
      include: { invitation: { include: { employee: true } }, staffUser: true },
      orderBy: { checkedAt: 'desc' },
    })
  })
}

export default events
