import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkDatabase() {
  try {
    // Try to connect and perform a simple query
    await prisma.$connect()
    // Try to query the User table
    await prisma.user.findFirst()
    console.log('✅ Database connection successful')
    process.exit(0)
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

checkDatabase() 