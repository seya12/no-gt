import { notFound, redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/db"
import { WorkoutPlanForm } from "@/components/workout/plan-form"
import { authConfig } from "@/lib/auth/auth.config"

export default async function EditWorkoutPlanPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authConfig)
  
  if (!session?.user) {
    redirect("/api/auth/signin")
  }
  
  // Fetch the workout plan with exercises
  const workoutPlan = await prisma.workoutPlan.findUnique({
    where: {
      id: params.id,
      userId: session.user.id,
    },
    include: {
      exercises: {
        include: {
          exercise: true,
        },
      },
    },
  })
  
  if (!workoutPlan) {
    notFound()
  }
  
  // Fetch all exercises for the form
  const exercises = await prisma.exercise.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      name: "asc",
    },
  })
  
  return (
    <div className="container py-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Edit Workout Plan</h1>
      <WorkoutPlanForm workoutPlan={workoutPlan} exercises={exercises} />
    </div>
  )
} 