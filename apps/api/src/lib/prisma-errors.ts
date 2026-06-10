import { Prisma } from '../generated/prisma/client'

/**
 * True jika error berasal dari pelanggaran unique constraint (P2002).
 * Dipakai untuk menangani race condition insert ganda secara graceful.
 */
export function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
}
