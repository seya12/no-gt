import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth/auth.config"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { ArrowLeft, X, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

interface AbandonWorkoutPageProps {
  params: Promise<{
    id: string
  }>
}

async function deleteWorkoutSession(sessionId: string, userId: string) {
  "use server"
  
  try {
    // First delete all related sets
    await prisma.set.deleteMany({
      where: {
        workoutSessionId: sessionId,
      },
    })
    
    // Then delete the workout session
    await prisma.workoutSession.delete({
      where: {
        id: sessionId,
        userId: userId, // Security: ensure user owns this session
      },
    })
  } catch (error) {
    console.error("Error deleting workout session:", error)
    throw new Error("Failed to delete workout session")
  }
  
  // Only redirect after successful deletion (outside try-catch)
  redirect("/dashboard")
}

export default async function AbandonWorkoutPage({
  params,
}: AbandonWorkoutPageProps) {
  const session = await getServerSession(authConfig)
  
  if (!session) {
    redirect("/login")
  }
  
  const { id } = await params
  
  // Fetch the workout session with details
  const workoutSession = await prisma.workoutSession.findUnique({
    where: {
      id: id,
      userId: session.user.id, // Security: ensure user owns this session
    },
    include: {
      workoutPlan: true,
      sets: {
        include: {
          exercise: true,
        },
      },
    },
  })
  
  if (!workoutSession) {
    redirect("/dashboard")
  }
  
  if (workoutSession.completedAt) {
    // Workout is already completed, redirect to dashboard
    redirect("/dashboard")
  }
  
  const completedSets = workoutSession.sets.filter(set => set.completed).length
  const totalSets = workoutSession.sets.length
  const progressPercentage = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0
  
  const handleAbandon = deleteWorkoutSession.bind(null, workoutSession.id, session.user.id)

    return (
    <div className="container mx-auto p-4 pb-32 max-w-2xl">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {/* Warning Card */}
        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-destructive text-lg">
              <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
              Stop Workout?
            </CardTitle>
            <CardDescription className="text-sm">
              You&apos;re about to abandon your current workout session. This action cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Workout Details */}
            <div className="bg-background/50 p-3 rounded-lg border">
              <h3 className="font-semibold text-base">{workoutSession.workoutPlan.name}</h3>
              <div className="space-y-2 mt-2 text-sm text-muted-foreground">
                <p>
                  Started: {workoutSession.startedAt ? format(new Date(workoutSession.startedAt), 'MMM d, yyyy \'at\' h:mm a') : 'Recently'}
                </p>
                {totalSets > 0 && (
                  <div className="space-y-2">
                    <p>
                      Progress: {completedSets} of {totalSets} sets completed ({progressPercentage}%)
                    </p>
                    {completedSets > 0 && (
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all" 
                          style={{ width: `${progressPercentage}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Warning Message */}
            <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-4 w-4 text-destructive mt-1 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="font-medium text-destructive text-sm">Warning: Data will be lost</p>
                  <p className="text-xs text-muted-foreground">
                    All progress from this workout session will be permanently deleted. 
                    If you want to save your progress, go back and complete the workout instead.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons - Mobile First */}
            <div className="space-y-3 pt-2">
              {/* Primary actions - full width on mobile */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href={`/workout/session/${workoutSession.id}`} className="flex-1">
                  <Button variant="outline" size="lg" className="w-full bg-primary/5 border-primary/20 hover:bg-primary hover:text-primary-foreground">
                    Continue Workout Instead
                  </Button>
                </Link>
                <form action={handleAbandon} className="flex-1">
                  <Button type="submit" variant="destructive" size="lg" className="w-full">
                    <X className="h-4 w-4 mr-2" />
                    Stop & Delete Workout
                  </Button>
                </form>
              </div>
              
              {/* Cancel button - secondary */}
              <div className="flex justify-center">
                <Link href="/dashboard">
                  <Button variant="ghost" className="text-muted-foreground">
                    Cancel
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 