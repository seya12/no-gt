import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/db"
import { authConfig } from "@/lib/auth/auth.config"
import { format, parseISO } from "date-fns"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PlusCircle, Calendar } from "lucide-react"

interface LogWorkoutPageProps {
  searchParams: Promise<{
    date?: string // YYYY-MM-DD format
  }>
}

export default async function LogWorkoutPage({
  searchParams,
}: LogWorkoutPageProps) {
  const session = await getServerSession(authConfig)
  
  if (!session?.user) {
    redirect("/api/auth/signin")
  }
  
  const { date } = await searchParams
  
  // Default to current date if no date provided
  const selectedDate = date ? parseISO(date) : new Date()
  
  // Fetch user's workout plans
  const workoutPlans = await prisma.workoutPlan.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      exercises: {
        include: {
          exercise: true,
        },
      },
      _count: {
        select: {
          sessions: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  })
  
  return (
    <div className="container p-4 md:py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Log Workout</h1>
          <p className="text-muted-foreground flex items-center mt-1">
            <Calendar className="h-4 w-4 mr-1" />
            {format(selectedDate, 'MMMM d, yyyy')}
          </p>
        </div>
        <Link href="/workout/plans/new">
          <Button size="sm" variant="outline">
            <PlusCircle className="h-4 w-4 mr-2" />
            New Plan
          </Button>
        </Link>
      </div>
      
      {workoutPlans.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Workout Plans</CardTitle>
            <CardDescription>
              You don&apos;t have any workout plans yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Create a workout plan to log your workouts.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/workout/plans/new">
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                Create Workout Plan
              </Button>
            </Link>
          </CardFooter>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workoutPlans.map((plan) => (
            <Link key={plan.id} href={`/workout/log/new?planId=${plan.id}&date=${format(selectedDate, 'yyyy-MM-dd')}`}>
              <Card className="h-full hover:bg-accent/50 transition-colors">
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>
                    {plan._count.sessions} {plan._count.sessions === 1 ? "time" : "times"} completed
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Exercises:</div>
                    <div className="flex flex-wrap gap-2">
                      {plan.exercises.map((exercise) => (
                        <Badge key={exercise.id} variant="outline">
                          {exercise.exercise.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">Log This Workout</Button>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
} 