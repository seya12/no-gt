import { notFound, redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/db"
import { authConfig } from "@/lib/auth/auth.config"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Home } from "lucide-react"

export default async function CompleteWorkoutSessionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
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
        completedSets: 0,
        totalReps: 0,
        totalWeight: 0,
      }
    }
    
    acc[exerciseId].sets.push(set)
    
    // Count completed sets and statistics
    if (set.completed) {
      acc[exerciseId].completedSets++
      acc[exerciseId].totalReps += set.actualReps || 0
      acc[exerciseId].totalWeight += set.weight || 0
    }
    
    return acc
  }, {} as Record<string, { 
    exerciseId: string
    exerciseName: string
    sets: typeof workoutSession.sets
    completedSets: number
    totalReps: number
    totalWeight: number
  }>)
  
  // Convert to array for rendering
  const exerciseStats = Object.values(exerciseSets)
  
  // Calculate overall stats
  const totalSets = workoutSession.sets.length
  const completedSets = workoutSession.sets.filter(set => set.completed).length
  const completionRate = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0
  
  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Workout Complete</h1>
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard">
            <Home className="h-4 w-4 mr-2" />
            Dashboard
          </Link>
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Session Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-primary/10 rounded-lg text-center">
              <div className="text-sm font-medium text-muted-foreground">Plan</div>
              <div className="text-2xl font-bold mt-1">{workoutSession.workoutPlan.name}</div>
            </div>
            <div className="p-4 bg-primary/10 rounded-lg text-center">
              <div className="text-sm font-medium text-muted-foreground">Completion</div>
              <div className="text-2xl font-bold mt-1">{completionRate}%</div>
            </div>
            <div className="p-4 bg-primary/10 rounded-lg text-center">
              <div className="text-sm font-medium text-muted-foreground">Sets</div>
              <div className="text-2xl font-bold mt-1">{completedSets}/{totalSets}</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Exercise Details</h2>
        
        {exerciseStats.map(exercise => (
          <Card key={exercise.exerciseId} className="overflow-hidden">
            <CardHeader className="bg-primary/5 py-4">
              <CardTitle className="text-lg font-medium">{exercise.exerciseName}</CardTitle>
            </CardHeader>
            <CardContent className="py-4 space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Sets</div>
                  <div className="font-medium mt-1">
                    {exercise.completedSets}/{exercise.sets.length}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Total Reps</div>
                  <div className="font-medium mt-1">{exercise.totalReps}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Volume (kg)</div>
                  <div className="font-medium mt-1">{exercise.totalWeight}</div>
                </div>
              </div>
              
              <div className="mt-4">
                <div className="text-sm font-medium mb-2">Sets:</div>
                <div className="flex flex-wrap gap-2">
                  {exercise.sets.map((set, index) => (
                    <Badge 
                      key={set.id} 
                      variant={set.completed ? "default" : "outline"}
                      className={set.completed ? "" : "text-muted-foreground"}
                    >
                      {set.completed ? (
                        <Check className="h-3 w-3 mr-1" />
                      ) : null}
                      Set {index + 1}: 
                      {set.completed
                        ? ` ${set.actualReps || 0} reps @ ${set.weight}kg`
                        : " Skipped"}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>What&apos;s Next?</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Your workout has been saved. You can start a new workout or view your history.
          </p>
        </CardContent>
        <CardFooter className="flex gap-4">
          <Button asChild variant="outline">
            <Link href="/workout/start">Start New Workout</Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard">Return to Dashboard</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
} 