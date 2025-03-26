import { notFound, redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/db"
import { authConfig } from "@/lib/auth/auth.config"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Check, Home, ArrowLeft } from "lucide-react"
import { WorkoutSessionTracker } from "@/components/workout/session-tracker"

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function WorkoutSessionPage({
  params,
}: PageProps) {
  const session = await getServerSession(authConfig)
  const { id } = await params

  if (!session?.user) {
    redirect("/api/auth/signin")
  }
  
  // Fetch the workout session with all related data
  const workoutSession = await prisma.workoutSession.findUnique({
    where: {
      id: id,
      userId: session.user.id,
    },
    include: {
      workoutPlan: true,
      sets: {
        include: {
          exercise: true,
        },
        orderBy: {
          id: "asc",
        },
      },
    },
  })
  
  if (!workoutSession) {
    notFound()
  }
  
  // Group sets by exercise
  const exerciseSets = workoutSession.sets.reduce((acc, set) => {
    const exerciseId = set.exerciseId
    
    if (!acc[exerciseId]) {
      acc[exerciseId] = {
        exerciseId,
        exerciseName: set.exercise.name,
        sets: [],
      }
    }
    
    acc[exerciseId].sets.push(set)
    return acc
  }, {} as Record<string, { exerciseId: string; exerciseName: string; sets: typeof workoutSession.sets }> )
  
  // Convert to array for rendering
  const groupedSets = Object.values(exerciseSets)
  
  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button asChild variant="ghost" size="icon" className="mr-2">
            <Link href="/workout/start">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">{workoutSession.workoutPlan.name}</h1>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard">
              <Home className="h-4 w-4 mr-2" />
              Home
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href={`/workout/session/${id}/complete`}>
              <Check className="h-4 w-4 mr-2" />
              Complete
            </Link>
          </Button>
        </div>
      </div>
      
      <div className="space-y-4">
        <WorkoutSessionTracker 
          exercises={groupedSets}
        />
      </div>
    </div>
  )
} 