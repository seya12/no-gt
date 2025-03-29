import { PrismaClient } from '@prisma/client'

// Define the exercise type
interface Exercise {
  name: string
  description: string | null
}

// Define our basic exercises
const SUGGESTED_EXERCISES: Record<string, Exercise[]> = {
  "Strength": [
    {
      name: "Deadlift",
      description: "Full body compound exercise that primarily targets the posterior chain."
    },
    {
      name: "Bench Press",
      description: "Upper body compound exercise focusing on chest, shoulders, and triceps."
    },
    {
      name: "Overhead Press",
      description: "Compound exercise targeting shoulders and triceps."
    },
    {
      name: "Barbell Row",
      description: "Compound back exercise focusing on lats and upper back muscles."
    },
    {
      name: "Pull-up",
      description: "Upper body exercise that targets the lats, biceps, and grip strength."
    },
    {
      name: "Squat",
      description: "Lower body compound exercise targeting quadriceps, hamstrings, and glutes."
    }
  ],
  "Isolation": [
    {
      name: "Bicep Curl",
      description: "Isolation exercise for the biceps."
    },
    {
      name: "Tricep Extension",
      description: "Isolation exercise targeting the triceps."
    },
    {
      name: "Lateral Raise",
      description: "Shoulder isolation exercise focusing on the lateral deltoids."
    },
    {
      name: "Leg Extension",
      description: "Isolation exercise targeting the quadriceps."
    },
    {
      name: "Leg Curl",
      description: "Isolation exercise for the hamstrings."
    },
    {
      name: "Calf Raise",
      description: "Isolation exercise for the calves."
    }
  ],
  "Bodyweight": [
    {
      name: "Push-up",
      description: "Bodyweight exercise targeting chest, shoulders, and triceps."
    },
    {
      name: "Dip",
      description: "Compound bodyweight exercise for chest, shoulders, and triceps."
    },
    {
      name: "Chin-up",
      description: "Bodyweight exercise targeting back and biceps."
    },
    {
      name: "Bodyweight Squat",
      description: "Lower body bodyweight exercise."
    },
    {
      name: "Plank",
      description: "Core strengthening isometric exercise."
    },
    {
      name: "Lunge",
      description: "Unilateral lower body exercise."
    }
  ]
}

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