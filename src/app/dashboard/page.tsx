import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

async function getTodaysWorkouts(userId: string, date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return prisma.workoutSession.findMany({
    where: { 
      userId,
      date: {
        gte: startOfDay,
        lte: endOfDay
      },
      scheduled: true
    },
    include: {
      workoutPlan: true,
    },
  });
}

async function getLastIncompleteWorkout(userId: string) {
  return prisma.workoutSession.findFirst({
    where: { 
      userId,
      startedAt: { not: null },
      completedAt: null,
      scheduled: false
    },
    orderBy: { startedAt: 'desc' },
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

async function getRecentPlans(userId: string) {
  return prisma.workoutPlan.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    take: 3,
  });
}

interface DashboardPageProps {
  searchParams: Promise<{
    date?: string
  }>
}

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const session = await getServerSession(authConfig)
  
  if (!session) {
    redirect("/login")
  }
  
  // Handle date from query or use current date
  const today = new Date();
  const { date } = await searchParams;
  const selectedDate = date ? parseISO(date) : today;
  
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
  
  // Get data for Quick Start section
  const todaysWorkouts = await getTodaysWorkouts(session.user.id, today);
  const lastIncompleteWorkout = await getLastIncompleteWorkout(session.user.id);
  const recentPlans = await getRecentPlans(session.user.id);
  
  // Navigation links - different offsets for mobile vs desktop
  const prevWeek = subDays(selectedDate, 7);  // Desktop: 7 days
  const nextWeek = addDays(selectedDate, 7);  // Desktop: 7 days
  const prev3Days = subDays(selectedDate, 3);  // Mobile: 3 days
  const next3Days = addDays(selectedDate, 3);  // Mobile: 3 days
  
  const prevWeekLink = `/dashboard?date=${format(prevWeek, 'yyyy-MM-dd')}`;
  const nextWeekLink = `/dashboard?date=${format(nextWeek, 'yyyy-MM-dd')}`;
  const prev3DaysLink = `/dashboard?date=${format(prev3Days, 'yyyy-MM-dd')}`;
  const next3DaysLink = `/dashboard?date=${format(next3Days, 'yyyy-MM-dd')}`;
  const todayLink = `/dashboard?date=${format(today, 'yyyy-MM-dd')}`;

  return (
    <div className="container mx-auto p-4 pb-20 space-y-6">
      {/* Calendar Week View */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-xl font-medium flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Workout Calendar
          </CardTitle>
          <div className="flex items-center space-x-2">
            {/* Different navigation links for mobile vs desktop */}
            <Link href={prev3DaysLink} className="sm:hidden">
              <Button variant="outline" size="icon">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </Link>
            <Link href={prevWeekLink} className="hidden sm:flex">
              <Button variant="outline" size="icon">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </Link>
            <Link href={todayLink}>
              <Button variant="outline" size="sm">Today</Button>
            </Link>
            <Link href={next3DaysLink} className="sm:hidden">
              <Button variant="outline" size="icon">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href={nextWeekLink} className="hidden sm:flex">
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
                <Link 
                  key={`cell-mobile-${day.date.toISOString()}`}
                  href={`/workout/day/${format(day.date, 'yyyy-MM-dd')}`}
                  className={`block p-2 border rounded-md min-h-[120px] overflow-y-auto ${
                    day.isToday ? 'bg-accent/20 border-primary' : ''
                  }`}
                >
                  <div className="space-y-1">
                    {day.workouts.length > 0 ? (
                      day.workouts.map((workout) => (
                        <div 
                          key={workout.id}
                          className={`text-xs p-2 rounded truncate hover:bg-accent/50 transition-colors ${
                            workout.scheduled ? 'bg-accent/30' : 'bg-primary/20'
                          }`}
                        >
                          {workout.workoutPlan.name}
                        </div>
                      ))
                    ) : (
                      <div className="flex h-full min-h-[40px] items-center justify-center">
                        <Button variant="ghost" size="sm" className="h-8 text-xs">
                          <PlusCircle className="h-3 w-3 mr-1" />
                          {day.isToday ? "Start" : "Add"}
                        </Button>
                      </div>
                    )}
                  </div>
                </Link>
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
                <Link 
                  key={`cell-desktop-${day.date.toISOString()}`}
                  href={`/workout/day/${format(day.date, 'yyyy-MM-dd')}`}
                  className={`block p-2 border rounded-md min-h-[100px] overflow-y-auto ${
                    day.isToday ? 'bg-accent/20 border-primary' : ''
                  }`}
                >
                  <div className="space-y-1">
                    {day.workouts.length > 0 ? (
                      day.workouts.map((workout) => (
                        <div 
                          key={workout.id}
                          className={`text-xs p-1.5 rounded truncate hover:bg-accent/50 transition-colors ${
                            workout.scheduled ? 'bg-accent/30' : 'bg-primary/20'
                          }`}
                        >
                          {workout.workoutPlan.name}
                        </div>
                      ))
                    ) : (
                      <div className="flex h-full min-h-[40px] items-center justify-center">
                        <Button variant="ghost" size="sm" className="h-6 text-xs">
                          <PlusCircle className="h-3 w-3 mr-1" />
                          {day.isToday ? "Start" : "Add"}
                        </Button>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Start and Quick Access */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quick Start */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Start</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Continue Last Workout */}
              {lastIncompleteWorkout && (
                <div className="p-3 rounded-md bg-primary/10 border border-primary/20">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-primary">Continue Workout</p>
                      <p className="text-sm text-muted-foreground">
                        {lastIncompleteWorkout.workoutPlan.name}
                      </p>
                    </div>
                    <Link href={`/workout/session/${lastIncompleteWorkout.id}`}>
                      <Button size="sm" className="bg-primary">Continue</Button>
                    </Link>
                  </div>
                </div>
              )}

              {/* Today's Scheduled Workouts */}
              {todaysWorkouts.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Today&apos;s Scheduled</p>
                  {todaysWorkouts.map((workout) => (
                    <div key={workout.id} className="flex justify-between items-center p-2.5 rounded-md bg-accent/30">
                      <div>
                        <p className="font-medium">{workout.workoutPlan.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Scheduled for today
                        </p>
                      </div>
                      <Link href={`/workout/session/${workout.id}`}>
                        <Button size="sm" variant="outline">Start</Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}

              {/* Quick Start Any Plan */}
              {recentPlans.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Quick Start</p>
                  {recentPlans.map((plan) => (
                    <div key={plan.id} className="flex justify-between items-center p-2.5 rounded-md bg-accent/20">
                      <div>
                        <p className="font-medium">{plan.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Start immediately
                        </p>
                      </div>
                      <Link href={`/workout/session/new?planId=${plan.id}`}>
                        <Button size="sm" variant="outline">Start</Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}

              {/* Fallback if no workouts */}
              {!lastIncompleteWorkout && todaysWorkouts.length === 0 && recentPlans.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-4">
                  <p>No workouts available</p>
                  <Link href="/workout/plans" className="text-primary hover:underline">
                    Create a workout plan
                  </Link>
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