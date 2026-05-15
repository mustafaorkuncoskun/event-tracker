import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { parse } from 'csv-parse/sync'

const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  department: z.string().optional(),
})

const employees: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', async () => {
    return fastify.prisma.employee.findMany({ orderBy: { name: 'asc' } })
  })

  fastify.post('/', async (req, reply) => {
    const body = createSchema.parse(req.body)
    const employee = await fastify.prisma.employee.create({ data: body })
    return reply.code(201).send(employee)
  })

  fastify.put('/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const body = createSchema.partial().parse(req.body)
    const employee = await fastify.prisma.employee.update({ where: { id }, data: body })
    return employee
  })

  fastify.delete('/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    await fastify.prisma.employee.delete({ where: { id } })
    return reply.code(204).send()
  })

  // CSV import: name,email,phone,department
  fastify.post('/import', async (req, reply) => {
    const data = req.body as { csv: string }
    const rows = parse(data.csv, { columns: true, skip_empty_lines: true, trim: true })
    const results = { created: 0, skipped: 0, errors: [] as string[] }

    for (const row of rows) {
      try {
        const parsed = createSchema.parse(row)
        await fastify.prisma.employee.upsert({
          where: { email: parsed.email },
          update: {},
          create: parsed,
        })
        results.created++
      } catch {
        results.skipped++
        results.errors.push(row.email ?? 'unknown')
      }
    }

    return results
  })
}

export default employees
