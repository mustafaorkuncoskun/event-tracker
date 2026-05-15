import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import type { Server } from 'socket.io'

declare module 'fastify' {
  interface FastifyInstance {
    io: Server
  }
}

const checkInSchema = z.object({
  value: z.string().min(1), // UUID token veya 9 haneli kod
  staffId: z.string().uuid(),
})

const checkins: FastifyPluginAsync = async (fastify) => {
  fastify.post('/checkin', async (req, reply) => {
    const { value, staffId } = checkInSchema.parse(req.body)

    const staff = await fastify.prisma.staffUser.findUnique({ where: { id: staffId } })
    if (!staff) return reply.code(401).send({ error: 'Geçersiz görevli' })

    // UUID token mu yoksa 9 haneli kod mu?
    const isToken = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)

    const invitation = await fastify.prisma.invitation.findUnique({
      where: isToken ? { token: value } : { code: value },
      include: { employee: true, checkin: true, event: true },
    })

    if (!invitation) {
      return reply.code(404).send({ success: false, reason: 'not_found', message: 'Kod veya QR geçersiz' })
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
      include: { invitation: { include: { employee: true } } },
    })

    // Dashboard'a anlık bildirim
    fastify.io.to(`event:${invitation.eventId}`).emit('checkin', {
      employeeName: invitation.employee.name,
      employeeDepartment: invitation.employee.department,
      checkedAt: checkIn.checkedAt,
      eventId: invitation.eventId,
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
