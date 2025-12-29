import { PrismaClient } from "@/generated/prisma"
import { PrismaNeon } from "@prisma/adapter-neon"

const globalForPrisma = globalThis as unknown as {
    prisma:PrismaClient | undefined
}

// Prisma 7.x: 使用 Neon serverless 驱动和 adapter
// @neondatabase/serverless 是 Neon 提供的 serverless 优化驱动
// @prisma/adapter-neon 是 Prisma 7 提供的 Neon adapter
function getPrismaClient() {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma
  }

  // 在构建时，如果 DATABASE_URL 不存在，使用占位符
  // 这允许构建通过，但运行时需要真实的 DATABASE_URL
  const connectionString = process.env.DATABASE_URL || 'postgresql://placeholder:placeholder@localhost:5432/placeholder'
  
  // PrismaNeon 接受 PoolConfig 对象，直接传递连接字符串配置
  const adapter = new PrismaNeon({
    connectionString: connectionString,
  })
  
  const client = new PrismaClient({ adapter })
  
  if(process.env.NODE_ENV!=='production'){
    globalForPrisma.prisma=client
  }
  
  return client
}

export const prisma = getPrismaClient()