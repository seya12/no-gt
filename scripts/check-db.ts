/**
 * This script checks if the database is available and working correctly.
 * It's used both for local development and in the build process.
 */

import { prisma } from "../src/lib/db"

async function main() {
  console.log("🔍 Checking database connection...")
  
  try {
    // Try to connect to the database
    await prisma.$connect()
    console.log("✅ Database connection successful!")
    
    // Try to execute a simple query
    const startTime = Date.now()
    await prisma.$queryRaw`SELECT 1`
    const duration = Date.now() - startTime
    
    console.log(`⏱️ Query latency: ${duration}ms`)
    
    // Check if there are any users (helpful to know if setup is needed)
    const userCount = await prisma.user.count()
    console.log(`👤 User count: ${userCount}`)
    
    return { success: true }
  } catch (error) {
    console.error("❌ Database connection failed:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .then(() => {
    console.log("✨ All checks passed!")
    process.exit(0)
  })
  .catch((error) => {
    console.error("❌ Checks failed:", error)
    process.exit(1)
  }) 