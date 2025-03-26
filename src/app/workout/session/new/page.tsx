import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/db"
import { authConfig } from "@/lib/auth/auth.config"

interface NewWorkoutSessionPageProps {
  searchParams: Promise<{
    planId?: string
  }>
}

export default async function NewWorkoutSessionPage({
  searchParams,
}: NewWorkoutSessionPageProps) {
  const { planId } = await searchParams
  
  if (!planId) {
    redirect("/workout/start")
  }
  
  const session = await getServerSession(authConfig)
  
  if (!session?.user) {
    redirect("/api/auth/signin")
  }
  
  // Fetch the workout plan with exercises
  const workoutPlan = await prisma.workoutPlan.findUnique({
    where: {
      id: planId,
      userId: session.user.id,
    },
    include: {
      exercises: {
        include: {
          exercise: true,
        },
        orderBy: {
          id: "asc", // Consistent ordering
        },
      },
    },
  })
  
  if (!workoutPlan) {
    redirect("/workout/start")
  }
  
  // Create a new workout session
  const workoutSession = await prisma.workoutSession.create({
    data: {
      date: new Date(),
      userId: session.user.id,
      workoutPlanId: workoutPlan.id,
      // Create sets for each exercise based on default values
      sets: {
        create: workoutPlan.exercises.flatMap(exercise => 
          Array.from({ length: exercise.defaultSets }, () => ({
            exerciseId: exercise.exerciseId,
            targetReps: exercise.defaultReps,
            weight: exercise.startingWeight || 0,
            completed: false,
          }))
        ),
      },
    },
    include: {
      sets: {
        include: {
          exercise: true,
        },
      },
    },
  })
  
  // Redirect to the workout session page
  redirect(`/workout/session/${workoutSession.id}`)
} 