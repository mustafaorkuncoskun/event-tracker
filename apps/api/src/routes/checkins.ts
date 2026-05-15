import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import type { Server } from 'socket.io'

declare module 'fastify' {
  interface FastifyInstance {
    io: Server
  }
}

const checkInSchema = z.object({
  value: z.string().min(1),
  staffId: z.string().uuid(),
  eventId: z.string().uuid(),
})

const checkins: FastifyPluginAsync = async (fastify) => {
  fastify.post('/checkin', async (req, reply) => {
    const { value, staffId, eventId } = checkInSchema.parse(req.body)

    const staff = await fastify.prisma.staffUser.findUnique({ where: { id: staffId } })
    if (!staff) return reply.code(401).send({ error: 'Geçersiz görevli' })

    const isToken = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)

    const invitation = await fastify.prisma.invitation.findUnique({
      where: isToken ? { token: value } : { code: value },
      include: { employee: true, checkin: true },
    })

    if (!invitation) {
      return reply.code(404).send({ success: false, reason: 'not_found', message: 'Kod veya QR geçersiz' })
    }

    // Kodun bu etkinliğe ait olup olmadığını kontrol et
    if (invitation.eventId !== eventId) {
      return reply.code(400).send({ success: false, reason: 'wrong_event', message: 'Bu kod bu etkinliğe ait değil' })
    }

    if (invitation.checkin) {
      return reply.code(409).send({
        success: false,
        reason: 'already_checked_in',
        message: `${invitation.employee.name} zaten giriş yaptı`,
        checkedAt: invitation.checkin.checkedAt,
      })
    }

    const checkIn = await fastify.prisma.checkIn.create({
      data: { invitationId: invitation.id, staffId },
    })

    fastify.io.to(`event:${eventId}`).emit('checkin', {
      employeeName: invitation.employee.name,
      employeeDepartment: invitation.employee.department,
      checkedAt: checkIn.checkedAt,
      eventId,
    })

    return reply.code(201).send({
      success: true,
      message: `${invitation.employee.name} başarıyla giriş yaptı`,
      employee: invitation.employee,
      checkedAt: checkIn.checkedAt,
    })
  })
}

export default checkins
