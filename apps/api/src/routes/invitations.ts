import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { generateUniqueCode, generateToken } from '../lib/codegen.js'
import { generateInvitationPDF } from '../lib/qrpdf.js'

const createSchema = z.object({
  employeeIds: z.array(z.string().uuid()).min(1),
})

const invitations: FastifyPluginAsync = async (fastify) => {
  // Belirli etkinlik için davet oluştur
  fastify.post('/events/:eventId/invitations', async (req, reply) => {
    const { eventId } = req.params as { eventId: string }
    const { employeeIds } = createSchema.parse(req.body)

    const event = await fastify.prisma.event.findUnique({ where: { id: eventId } })
    if (!event) return reply.code(404).send({ error: 'Etkinlik bulunamadı' })

    const created = []
    const skipped = []

    for (const employeeId of employeeIds) {
      const existing = await fastify.prisma.invitation.findUnique({
        where: { employeeId_eventId: { employeeId, eventId } },
      })
      if (existing) { skipped.push(employeeId); continue }

      const [token, code] = await Promise.all([
        generateToken(),
        generateUniqueCode(fastify.prisma),
      ])

      const invitation = await fastify.prisma.invitation.create({
        data: { employeeId, eventId, token, code },
        include: { employee: true },
      })
      created.push(invitation)
    }

    return reply.code(201).send({ created: created.length, skipped: skipped.length, invitations: created })
  })

  // Tüm çalışanlara toplu davet
  fastify.post('/events/:eventId/invitations/all', async (req, reply) => {
    const { eventId } = req.params as { eventId: string }

    const event = await fastify.prisma.event.findUnique({ where: { id: eventId } })
    if (!event) return reply.code(404).send({ error: 'Etkinlik bulunamadı' })

    const employees = await fastify.prisma.employee.findMany()
    const created = []

    for (const emp of employees) {
      const existing = await fastify.prisma.invitation.findUnique({
        where: { employeeId_eventId: { employeeId: emp.id, eventId } },
      })
      if (existing) continue

      const [token, code] = await Promise.all([
        generateToken(),
        generateUniqueCode(fastify.prisma),
      ])
      const inv = await fastify.prisma.invitation.create({
        data: { employeeId: emp.id, eventId, token, code },
        include: { employee: true },
      })
      created.push(inv)
    }

    return reply.code(201).send({ created: created.length })
  })

  // Davet PDF'i indir
  fastify.get('/invitations/:id/pdf', async (req, reply) => {
    const { id } = req.params as { id: string }

    const invitation = await fastify.prisma.invitation.findUnique({
      where: { id },
      include: { employee: true, event: true },
    })
    if (!invitation) return reply.code(404).send({ error: 'Davet bulunamadı' })

    const pdf = await generateInvitationPDF(
      invitation,
      invitation.event.title,
      invitation.event.date,
      invitation.event.location
    )

    return reply
      .header('Content-Type', 'application/pdf')
      .header('Content-Disposition', `attachment; filename="davet-${invitation.code}.pdf"`)
      .send(pdf)
  })

  // Davet sil
  fastify.delete('/invitations/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    await fastify.prisma.invitation.delete({ where: { id } })
    return reply.code(204).send()
  })
}

export default invitations
