import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/db"
import { WorkoutPlanForm } from "@/components/workout/plan-form"
import { authConfig } from "@/lib/auth/auth.config"

export default async function NewWorkoutPlanPage() {
  const session = await getServerSession(authConfig)
  
  if (!session?.user) {
    redirect("/api/auth/signin")
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
      <h1 className="text-2xl font-bold mb-6">Create New Workout Plan</h1>
      <WorkoutPlanForm exercises={exercises} />
    </div>
  )
} 