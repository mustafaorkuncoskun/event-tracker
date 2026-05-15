import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'

export function generateToken(): string {
  return uuidv4()
}

export async function generateUniqueCode(prisma: PrismaClient): Promise<string> {
  let code: string
  let exists = true

  do {
    // 100000000 - 999999999 arası 9 haneli rastgele sayı
    code = Math.floor(100000000 + Math.random() * 900000000).toString()
    const found = await prisma.invitation.findUnique({ where: { code } })
    exists = found !== null
  } while (exists)

  return code
}
