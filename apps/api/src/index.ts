import Fastify from 'fastify'
import cors from '@fastify/cors'
import { Server as SocketServer } from 'socket.io'
import prismaPlugin from './plugins/prisma.js'
import employeesRoute from './routes/employees.js'
import eventsRoute from './routes/events.js'
import invitationsRoute from './routes/invitations.js'
import checkinsRoute from './routes/checkins.js'
import staffRoute from './routes/staff.js'

const PORT = Number(process.env.PORT ?? 3001)
const CORS_ORIGINS = (process.env.CORS_ORIGIN ?? 'http://localhost:5173,http://localhost:5174').split(',')

const fastify = Fastify({ logger: { transport: { target: 'pino-pretty' } } })

// Socket.io doğrudan Fastify'ın kendi http sunucusuna bağlanıyor
const io = new SocketServer(fastify.server, {
  cors: { origin: CORS_ORIGINS, methods: ['GET', 'POST'] },
})

fastify.decorate('io', io)

await fastify.register(cors, { origin: CORS_ORIGINS })
await fastify.register(prismaPlugin)

await fastify.register(employeesRoute, { prefix: '/api/employees' })
await fastify.register(eventsRoute, { prefix: '/api/events' })
await fastify.register(invitationsRoute, { prefix: '/api' })
await fastify.register(checkinsRoute, { prefix: '/api' })
await fastify.register(staffRoute, { prefix: '/api' })

fastify.get('/health', async () => ({ status: 'ok' }))

io.on('connection', (socket) => {
  socket.on('join-event', (eventId: string) => socket.join(`event:${eventId}`))
  socket.on('leave-event', (eventId: string) => socket.leave(`event:${eventId}`))
})

try {
  await fastify.listen({ port: PORT, host: '0.0.0.0' })
  console.log(`API sunucusu çalışıyor: http://localhost:${PORT}`)
} catch (err) {
  fastify.log.error(err)
  process.exit(1)
}
