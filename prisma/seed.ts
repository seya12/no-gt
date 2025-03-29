import { PrismaClient } from '@prisma/client'
import { SUGGESTED_EXERCISES } from '../src/lib/constants/exercises'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting to seed basic exercises...')

  // Create a system user for basic exercises
  const systemUser = await prisma.user.create({
    data: {
      email: 'system@no-gt.local',
      name: 'System',
    },
  })

  // Flatten all exercises from categories
  const allExercises = Object.values(SUGGESTED_EXERCISES).flat()

  // Create all exercises
  for (const exercise of allExercises) {
    await prisma.exercise.create({
      data: {
        name: exercise.name,
        description: exercise.description,
        userId: systemUser.id,
      },
    })
    console.log(`Created exercise: ${exercise.name}`)
  }

  console.log('Seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 