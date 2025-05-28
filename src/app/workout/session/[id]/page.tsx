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

async function getWorkoutSessionWithSets(sessionId: string, userId: string) {
  return prisma.workoutSession.findUnique({
    where: {
      id: sessionId,
      userId: userId,
    },
    include: {
      workoutPlan: {
        include: {
          exercises: {
            include: {
              exercise: true,
            },
            orderBy: {
              id: "asc",
            },
          },
        },
      },
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
  let workoutSession = await getWorkoutSessionWithSets(id, session.user.id)
  
  if (!workoutSession) {
    notFound()
  }

  // If this is a scheduled workout that hasn't been started yet, mark it as started and create sets
  if (workoutSession.scheduled && !workoutSession.startedAt) {
    // Create sets if they don't exist
    if (workoutSession.sets.length === 0) {
      const setsToCreate = workoutSession.workoutPlan.exercises.flatMap(exercise => 
        Array.from({ length: exercise.defaultSets }, () => ({
          exerciseId: exercise.exerciseId,
          targetReps: exercise.defaultReps,
          weight: exercise.startingWeight || 0,
          completed: false,
          workoutSessionId: workoutSession!.id,
        }))
      )

      await prisma.set.createMany({
        data: setsToCreate,
      })
    }

    // Mark as started and no longer scheduled
    await prisma.workoutSession.update({
      where: { id: workoutSession.id },
      data: { 
        startedAt: new Date(),
        scheduled: false,
      },
    })
    
    // Refetch the updated session with sets
    const updatedSession = await getWorkoutSessionWithSets(id, session.user.id)
    
    if (!updatedSession) {
      notFound()
    }
    
    workoutSession = updatedSession
  }
  
  // Group sets by exercise
  type SetWithExercise = {
    id: string;
    exerciseId: string;
    workoutSessionId: string;
    targetReps: number;
    actualReps: number | null;
    weight: number;
    notes: string | null;
    completed: boolean;
    nextWeightAdjustment: string | null;
    exercise: {
      id: string;
      name: string;
      description: string | null;
      createdAt: Date;
      updatedAt: Date;
      userId: string;
    };
  };
  
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
  }, {} as Record<string, { exerciseId: string; exerciseName: string; sets: SetWithExercise[] }> )
  
  // Convert to array for rendering
  const groupedSets = Object.values(exerciseSets)
  
  return (
    <div className="container p-4 md:py-6 space-y-6">
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
          sessionId={id}
        />
      </div>
    </div>
  )
} 