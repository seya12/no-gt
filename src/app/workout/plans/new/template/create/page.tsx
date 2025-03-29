import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/db"
import { authConfig } from "@/lib/auth/auth.config"
import { WorkoutPlanForm } from "@/components/workout/plan-form"
import { WORKOUT_TEMPLATES } from "@/lib/constants/exercises"
import type { WorkoutPlanExercise } from "@/components/workout/plan-form"

interface NewWorkoutPlanTemplateCreatePageProps {
  searchParams: {
    type?: string;
    split?: string;
  }
}

export default async function NewWorkoutPlanTemplateCreatePage({
  searchParams,
}: NewWorkoutPlanTemplateCreatePageProps) {
  const session = await getServerSession(authConfig)
  
  if (!session?.user) {
    redirect("/api/auth/signin")
  }

  const { type, split } = searchParams
  
  if (!type || !split || !WORKOUT_TEMPLATES[type as keyof typeof WORKOUT_TEMPLATES]?.[split]) {
    redirect("/workout/plans/new/template")
  }

  // Get the exercises for this template
  const templateExercises = WORKOUT_TEMPLATES[type as keyof typeof WORKOUT_TEMPLATES][split]
  
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

  // Create initial form data with template exercises
  const initialData = {
    name: split,
    exercises: templateExercises
      .map(name => {
        const exercise = exercises.find(e => e.name.toLowerCase() === name.toLowerCase())
        if (!exercise) return null
        return {
          exerciseId: exercise.id,
          defaultSets: 3,
          defaultReps: 10,
          startingWeight: null
        }
      })
      .filter((e): e is NonNullable<typeof e> => e !== null)
  }
  
  return (
    <div className="container p-4 md:py-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Create {split} Plan</h1>
      <WorkoutPlanForm exercises={exercises} defaultValues={initialData} />
    </div>
  )
} 