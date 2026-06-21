import 'dotenv/config'
import pg from 'pg'
import pkg from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const { PrismaClient } = pkg
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

export default prisma
