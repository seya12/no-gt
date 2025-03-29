import { notFound, redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/db"
import { WorkoutPlanForm } from "@/components/workout/plan-form"
import { authConfig } from "@/lib/auth/auth.config"

export default async function EditWorkoutPlanPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getServerSession(authConfig)
  const { id } = await params;

  
  if (!session?.user) {
    redirect("/api/auth/signin")
  }
  
  // Fetch the workout plan with exercises
  const workoutPlan = await prisma.workoutPlan.findUnique({
    where: {
      id: id,
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
      OR: [
        { userId: session.user.id },
        { user: { email: 'system@no-gt.local' } }
      ]
    },
    orderBy: {
      name: "asc",
    },
  })
  
  // Transform the workout plan data into the format expected by the form
  const defaultValues = {
    name: workoutPlan.name,
    exercises: workoutPlan.exercises.map(e => ({
      exerciseId: e.exerciseId,
      defaultSets: e.defaultSets,
      defaultReps: e.defaultReps,
      startingWeight: e.startingWeight,
    }))
  }
  
  return (
    <div className="container p-4 md:py-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Edit Workout Plan</h1>
      <WorkoutPlanForm 
        exercises={exercises} 
        defaultValues={defaultValues}
        planId={workoutPlan.id}
      />
    </div>
  )
} 