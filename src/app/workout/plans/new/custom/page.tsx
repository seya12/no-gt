import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/db"
import { authConfig } from "@/lib/auth/auth.config"
import { WorkoutPlanForm } from "@/components/workout/plan-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function NewWorkoutPlanCustomPage() {
  const session = await getServerSession(authConfig)
  
  if (!session?.user) {
    redirect("/api/auth/signin")
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
  
  return (
    <div className="container py-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/workout/plans/new">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Build Custom Plan</h1>
      </div>

      <WorkoutPlanForm exercises={exercises} />
    </div>
  )
} 