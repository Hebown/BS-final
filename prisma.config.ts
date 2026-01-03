// Prisma 7.x 配置文件
// 用于 Prisma Migrate 和 Prisma Studio
// 位置：项目根目录

import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: { 
    url: env("DATABASE_URL") 
  }
});
