import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import { PlusCircle, Dumbbell, Calendar, ListChecks, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authConfig } from "@/lib/auth/auth.config"
import { prisma } from "@/lib/db"
import { format, eachDayOfInterval, isSameDay, addDays, subDays, parseISO } from "date-fns"

async function getWorkoutsForRange(userId: string, startDate: Date, endDate: Date) {
  return prisma.workoutSession.findMany({
    where: { 
      userId,
      date: {
        gte: startDate,
        lte: endDate
      }
    },
    orderBy: { date: 'asc' },
    include: {
      workoutPlan: true,
    },
  });
}

async function getActivePlans(userId: string) {
  return prisma.workoutPlan.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    take: 5,
    include: {
      exercises: {
        include: {
          exercise: true,
        },
      },
    },
  });
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { date?: string }
}) {
  const session = await getServerSession(authConfig)
  
  if (!session) {
    redirect("/login")
  }
  
  // Handle date from query or use current date
  const today = new Date();
  const selectedDate = searchParams.date ? parseISO(searchParams.date) : today;
  
  // Get a 7-day range centered on the selected date
  const startDate = subDays(selectedDate, 3);
  const endDate = addDays(selectedDate, 3);
  
  // Fetch workouts for the week view
  const weekWorkouts = await getWorkoutsForRange(session.user.id, startDate, endDate);
  
  // Get days in the current week
  const daysInRange = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });
  
  // Group workouts by day
  const workoutsByDay = daysInRange.map(day => {
    const dayWorkouts = weekWorkouts.filter(workout => 
      isSameDay(new Date(workout.date), day)
    );
    return {
      date: day,
      workouts: dayWorkouts,
      isToday: isSameDay(day, today)
    };
  });
  
  // Get all plans for more context
  const activePlans = await getActivePlans(session.user.id);
  
  // Navigation links
  const prevWeek = subDays(selectedDate, 7);
  const nextWeek = addDays(selectedDate, 7);
  
  const prevWeekLink = `/dashboard?date=${format(prevWeek, 'yyyy-MM-dd')}`;
  const nextWeekLink = `/dashboard?date=${format(nextWeek, 'yyyy-MM-dd')}`;
  const todayLink = `/dashboard?date=${format(today, 'yyyy-MM-dd')}`;

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

      {/* Calendar Week View */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-xl font-medium flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Workout Calendar
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Link href={prevWeekLink}>
              <Button variant="outline" size="icon">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </Link>
            <Link href={todayLink}>
              <Button variant="outline" size="sm">Today</Button>
            </Link>
            <Link href={nextWeekLink}>
              <Button variant="outline" size="icon">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/workout/calendar">
              <Button variant="ghost" size="sm" className="hidden sm:flex">Full Calendar</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {/* Mobile view (3 days) */}
          <div className="sm:hidden">
            <div className="grid grid-cols-3 gap-1">
              {/* Day headers for mobile */}
              {workoutsByDay.slice(2, 5).map((day) => (
                <div key={`header-mobile-${day.date.toISOString()}`} className="p-2 text-center">
                  <div className="text-sm font-semibold">{format(day.date, 'EEE')}</div>
                  <div className={`text-lg font-bold rounded-full w-8 h-8 flex items-center justify-center mx-auto
                    ${day.isToday ? 'bg-primary text-primary-foreground' : ''}`}>
                    {format(day.date, 'd')}
                  </div>
                </div>
              ))}
              
              {/* Calendar cells for mobile */}
              {workoutsByDay.slice(2, 5).map((day) => (
                <div 
                  key={`cell-mobile-${day.date.toISOString()}`}
                  className={`p-2 border rounded-md min-h-[120px] overflow-y-auto ${
                    day.isToday ? 'bg-accent/20 border-primary' : ''
                  }`}
                >
                  <div className="space-y-1">
                    {day.workouts.length > 0 ? (
                      day.workouts.map((workout) => (
                        <Link 
                          key={workout.id} 
                          href={`/workout/session/${workout.id}`}
                          className="block"
                        >
                          <div className={`text-xs p-2 rounded truncate hover:bg-accent/50 transition-colors ${
                            workout.scheduled ? 'bg-accent/30' : 'bg-primary/20'
                          }`}>
                            {workout.workoutPlan.name}
                          </div>
                        </Link>
                      ))
                    ) : (
                      <Link 
                        href={`/workout/calendar?month=${day.date.getMonth() + 1}&year=${day.date.getFullYear()}`}
                        className="flex h-full min-h-[40px] items-center justify-center"
                      >
                        <Button variant="ghost" size="sm" className="h-8 text-xs">
                          <PlusCircle className="h-3 w-3 mr-1" />
                          Add
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-center mt-2">
              <Link href="/workout/calendar">
                <Button variant="outline" size="sm" className="w-full">
                  <Calendar className="h-4 w-4 mr-2" />
                  View Full Calendar
                </Button>
              </Link>
            </div>
          </div>

          {/* Desktop view (7 days) */}
          <div className="hidden sm:block">
            <div className="grid grid-cols-7 gap-1">
              {/* Day headers for desktop */}
              {workoutsByDay.map((day) => (
                <div key={`header-desktop-${day.date.toISOString()}`} className="p-2 text-center">
                  <div className="text-sm font-semibold">{format(day.date, 'EEE')}</div>
                  <div className={`text-lg font-bold rounded-full w-8 h-8 flex items-center justify-center mx-auto
                    ${day.isToday ? 'bg-primary text-primary-foreground' : ''}`}>
                    {format(day.date, 'd')}
                  </div>
                </div>
              ))}
              
              {/* Calendar cells for desktop */}
              {workoutsByDay.map((day) => (
                <div 
                  key={`cell-desktop-${day.date.toISOString()}`}
                  className={`p-2 border rounded-md min-h-[100px] overflow-y-auto ${
                    day.isToday ? 'bg-accent/20 border-primary' : ''
                  }`}
                >
                  <div className="space-y-1">
                    {day.workouts.length > 0 ? (
                      day.workouts.map((workout) => (
                        <Link 
                          key={workout.id} 
                          href={`/workout/session/${workout.id}`}
                          className="block"
                        >
                          <div className={`text-xs p-1.5 rounded truncate hover:bg-accent/50 transition-colors ${
                            workout.scheduled ? 'bg-accent/30' : 'bg-primary/20'
                          }`}>
                            {workout.workoutPlan.name}
                          </div>
                        </Link>
                      ))
                    ) : (
                      <Link 
                        href={`/workout/calendar?month=${day.date.getMonth() + 1}&year=${day.date.getFullYear()}`}
                        className="flex h-full min-h-[40px] items-center justify-center"
                      >
                        <Button variant="ghost" size="sm" className="h-6 text-xs">
                          <PlusCircle className="h-3 w-3 mr-1" />
                          Add
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Plans and Quick Access */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            <div className="space-y-3">
              {activePlans.length > 0 ? (
                activePlans.map((plan) => (
                  <div key={plan.id} className="flex justify-between items-center p-2.5 rounded-md bg-accent/30">
                    <div>
                      <p className="font-medium">{plan.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {plan.exercises.length} exercises
                      </p>
                    </div>
                    <Link href={`/workout/session/new?planId=${plan.id}`}>
                      <Button size="sm" variant="outline">Start</Button>
                    </Link>
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

        {/* Quick Access */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Access</CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="grid grid-cols-1 gap-3">
              <Link href="/exercises">
                <Button variant="outline" className="w-full justify-start px-3 sm:px-4">
                  <ListChecks className="mr-2 h-4 w-4" />
                  Exercises
                </Button>
              </Link>
              <Link href="/workout/history">
                <Button variant="outline" className="w-full justify-start px-3 sm:px-4">
                  <Dumbbell className="mr-2 h-4 w-4" />
                  Workout History
                </Button>
              </Link>
              <Link href="/workout/calendar">
                <Button variant="outline" className="w-full justify-start px-3 sm:px-4">
                  <Calendar className="mr-2 h-4 w-4" />
                  Full Calendar
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 