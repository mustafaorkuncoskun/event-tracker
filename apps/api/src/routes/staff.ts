import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().min(1),
  pinCode: z.string().length(4).regex(/^\d{4}$/),
})

const staff: FastifyPluginAsync = async (fastify) => {
  fastify.post('/staff/login', async (req, reply) => {
    const { pinCode } = z.object({ pinCode: z.string() }).parse(req.body)
    const user = await fastify.prisma.staffUser.findUnique({ where: { pinCode } })
    if (!user) return reply.code(401).send({ error: 'Hatalı PIN' })
    return { id: user.id, name: user.name }
  })

  fastify.get('/staff', async () => {
    return fastify.prisma.staffUser.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    })
  })

  fastify.post('/staff', async (req, reply) => {
    const body = createSchema.parse(req.body)
    const user = await fastify.prisma.staffUser.create({
      data: body,
      select: { id: true, name: true },
    })
    return reply.code(201).send(user)
  })

  fastify.delete('/staff/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    await fastify.prisma.staffUser.delete({ where: { id } })
    return reply.code(204).send()
  })
}

export default staff
