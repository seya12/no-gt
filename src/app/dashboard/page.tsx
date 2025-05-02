import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import { PlusCircle, Dumbbell, Calendar, ListChecks } from "lucide-react"
import Link from "next/link"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authConfig } from "@/lib/auth/auth.config"
import { prisma } from "@/lib/db"
import { format, startOfMonth, endOfMonth } from "date-fns"
import { MiniCalendar } from "@/components/dashboard/mini-calendar"

async function getRecentWorkouts(userId: string) {
  return prisma.workoutSession.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
    take: 3,
    include: {
      workoutPlan: true,
      sets: {
        include: {
          exercise: true,
        },
      },
    },
  });
}

async function getActivePlans(userId: string) {
  return prisma.workoutPlan.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    take: 3,
    include: {
      exercises: {
        include: {
          exercise: true,
        },
      },
    },
  });
}

export default async function DashboardPage() {
  const session = await getServerSession(authConfig)
  
  if (!session) {
    redirect("/login")
  }
  
  const recentWorkouts = await getRecentWorkouts(session.user.id);
  const activePlans = await getActivePlans(session.user.id);
  
  // Fetch workout data for the mini-calendar (current month)
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  
  const monthWorkouts = await prisma.workoutSession.findMany({
    where: {
      userId: session.user.id,
      date: {
        gte: monthStart,
        lte: monthEnd,
      },
    },
  });
  
  // Map the workouts to calendar data
  const workoutDays = monthWorkouts.map(workout => ({
    date: workout.date,
    hasWorkout: true,
    scheduled: false, // Default value since we can't access the field yet
  }));

  return (
    <div className="container mx-auto p-4 pb-20 space-y-6">
      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Link href="/workout/start">
          <Card className="h-full hover:bg-accent transition-colors">
            <CardContent className="p-4 flex flex-col items-center justify-center space-y-2">
              <Dumbbell className="h-8 w-8" />
              <span className="text-sm font-medium">Start Workout</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/workout/plans/new">
          <Card className="h-full hover:bg-accent transition-colors">
            <CardContent className="p-4 flex flex-col items-center justify-center space-y-2">
              <PlusCircle className="h-8 w-8" />
              <span className="text-sm font-medium">New Plan</span>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Two-column layout for desktop */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-6 md:col-span-2">
          {/* Recent Workouts */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Workouts</CardTitle>
              <CardAction>
                <Link href="/workout/history">
                  <Button variant="ghost" size="sm">View All</Button>
                </Link>
              </CardAction>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentWorkouts.length > 0 ? (
                  recentWorkouts.map((workout) => (
                    <div key={workout.id} className="flex justify-between items-center p-3 rounded-md bg-accent/50">
                      <div>
                        <p className="font-medium">{workout.workoutPlan.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {workout.sets.length} sets • {workout.sets.reduce((acc, set) => acc + (set.completed ? 1 : 0), 0)} completed
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">{format(new Date(workout.date), 'MMM d')}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    No recent workouts
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Active Plans */}
          <Card>
            <CardHeader>
              <CardTitle>Active Plans</CardTitle>
              <CardAction>
                <Link href="/workout/plans">
                  <Button variant="ghost" size="sm">View All</Button>
                </Link>
              </CardAction>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activePlans.length > 0 ? (
                  activePlans.map((plan) => (
                    <div key={plan.id} className="flex justify-between items-center p-3 rounded-md bg-accent/50">
                      <div>
                        <p className="font-medium">{plan.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {plan.exercises.length} exercises
                        </p>
                      </div>
                      <div>
                        <Link href={`/workout/session/new?planId=${plan.id}`}>
                          <Button size="sm" variant="outline">Start</Button>
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    No active plans
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Calendar Widget */}
          <MiniCalendar workoutDays={workoutDays} />

          {/* Quick Access */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Access</CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <div className="grid grid-cols-1 gap-4">
                <Link href="/exercises">
                  <Button variant="outline" className="w-full justify-start px-3 sm:px-4">
                    <ListChecks className="mr-2 h-4 w-4" />
                    Exercises
                  </Button>
                </Link>
                <Link href="/workout/calendar">
                  <Button variant="outline" className="w-full justify-start px-3 sm:px-4">
                    <Calendar className="mr-2 h-4 w-4" />
                    Calendar
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 