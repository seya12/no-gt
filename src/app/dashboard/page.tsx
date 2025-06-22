import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusCircle, Dumbbell, Calendar, ListChecks, ChevronLeft, ChevronRight, Play, Clock, Zap, Target, X } from "lucide-react"
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
    <div className="container mx-auto p-4 pb-20 space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20 p-6 md:p-8">
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Welcome back, {session.user.name?.split(' ')[0] || 'Athlete'}! 💪
          </h1>
          <p className="text-muted-foreground text-lg">
            Ready to crush your fitness goals today?
          </p>
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl"></div>
      </div>

      {/* Quick Actions - Priority Section */}
      {(lastIncompleteWorkout || todaysWorkouts.length > 0) && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold flex items-center">
            <Zap className="h-6 w-6 mr-2 text-primary" />
            Ready to Go
          </h2>
          
          <div className="grid gap-4">
            {/* Continue Last Workout - Hero Treatment */}
            {lastIncompleteWorkout && (
              <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10 shadow-lg">
                <CardContent className="p-4 sm:p-6">
                  {/* Mobile-first layout */}
                  <div className="space-y-4">
                    {/* Header with icon and title */}
                    <div className="flex items-center space-x-3">
                      <div className="p-2 sm:p-3 rounded-full bg-primary/20">
                        <Play className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg sm:text-xl font-semibold text-primary">Continue Workout</h3>
                        <p className="text-base sm:text-lg font-medium truncate">{lastIncompleteWorkout.workoutPlan.name}</p>
                      </div>
                    </div>

                    {/* Workout details */}
                    <div className="space-y-2 pl-11 sm:pl-14">
                      <p className="text-sm text-muted-foreground">
                        Started {lastIncompleteWorkout.startedAt ? format(new Date(lastIncompleteWorkout.startedAt), 'MMM d, h:mm a') : 'recently'}
                      </p>
                      {lastIncompleteWorkout.sets.length > 0 && (
                        <>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0">
                            <span className="text-sm text-muted-foreground">
                              {lastIncompleteWorkout.sets.filter(set => set.completed).length} of {lastIncompleteWorkout.sets.length} sets completed
                            </span>
                            <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full w-fit">
                              {Math.round((lastIncompleteWorkout.sets.filter(set => set.completed).length / lastIncompleteWorkout.sets.length) * 100)}% done
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Next: {lastIncompleteWorkout.sets.find(set => !set.completed)?.exercise?.name || 'Complete workout'}
                          </p>
                        </>
                      )}
                    </div>

                    {/* Action buttons - mobile first */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <Link href={`/workout/session/${lastIncompleteWorkout.id}`} className="order-1 sm:order-2">
                        <Button size="lg" className="w-full bg-primary hover:bg-primary/90 shadow-lg">
                          <Play className="h-4 w-4 mr-2" />
                          Continue Workout
                        </Button>
                      </Link>
                      <Link href={`/workout/session/${lastIncompleteWorkout.id}/abandon`} className="order-2 sm:order-1">
                        <Button variant="outline" size="lg" className="w-full text-destructive hover:bg-destructive hover:text-destructive-foreground border-destructive/30">
                          <X className="h-4 w-4 mr-2" />
                          Stop Workout
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Today's Scheduled Workouts */}
            {todaysWorkouts.length > 0 && (
              <div className="grid gap-3">
                <h3 className="text-lg font-medium flex items-center text-muted-foreground">
                  <Clock className="h-5 w-5 mr-2" />
                  Today&apos;s Schedule
                </h3>
                {todaysWorkouts.map((workout) => (
                  <Card key={workout.id} className="border-accent/50 hover:border-primary/30 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-lg bg-accent/30">
                            <Target className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold">{workout.workoutPlan.name}</p>
                            <p className="text-sm text-muted-foreground">Scheduled for today</p>
                          </div>
                        </div>
                        <Link href={`/workout/session/${workout.id}`}>
                          <Button variant="outline" className="hover:bg-primary hover:text-primary-foreground">
                            Start
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Calendar Week View */}
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-2xl font-semibold flex items-center">
            <Calendar className="h-6 w-6 mr-3 text-primary" />
            This Week
          </CardTitle>
          <div className="flex items-center space-x-2">
            {/* Different navigation links for mobile vs desktop */}
            <Link href={prev3DaysLink} className="sm:hidden">
              <Button variant="outline" size="icon" className="hover:bg-primary hover:text-primary-foreground">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </Link>
            <Link href={prevWeekLink} className="hidden sm:flex">
              <Button variant="outline" size="icon" className="hover:bg-primary hover:text-primary-foreground">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </Link>
            <Link href={todayLink}>
              <Button variant="outline" size="sm" className="hover:bg-primary hover:text-primary-foreground">Today</Button>
            </Link>
            <Link href={next3DaysLink} className="sm:hidden">
              <Button variant="outline" size="icon" className="hover:bg-primary hover:text-primary-foreground">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href={nextWeekLink} className="hidden sm:flex">
              <Button variant="outline" size="icon" className="hover:bg-primary hover:text-primary-foreground">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/workout/calendar">
              <Button variant="ghost" size="sm" className="hidden sm:flex hover:bg-primary/10">Full Calendar</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Mobile view (3 days) */}
          <div className="sm:hidden">
            <div className="grid grid-cols-3 gap-2">
              {/* Day headers for mobile */}
              {workoutsByDay.slice(2, 5).map((day) => (
                <div key={`header-mobile-${day.date.toISOString()}`} className="p-3 text-center">
                  <div className="text-sm font-semibold text-muted-foreground">{format(day.date, 'EEE')}</div>
                  <div className={`text-xl font-bold rounded-full w-10 h-10 flex items-center justify-center mx-auto mt-1 transition-colors
                    ${day.isToday ? 'bg-primary text-primary-foreground shadow-lg' : 'hover:bg-accent'}`}>
                    {format(day.date, 'd')}
                  </div>
                </div>
              ))}
              
              {/* Calendar cells for mobile */}
              {workoutsByDay.slice(2, 5).map((day) => (
                <Link 
                  key={`cell-mobile-${day.date.toISOString()}`}
                  href={`/workout/day/${format(day.date, 'yyyy-MM-dd')}`}
                  className={`block p-3 border-2 rounded-xl min-h-[140px] overflow-y-auto transition-all hover:shadow-md ${
                    day.isToday ? 'bg-primary/5 border-primary shadow-lg' : 'border-border hover:border-primary/30'
                  }`}
                >
                  <div className="space-y-2">
                    {day.workouts.length > 0 ? (
                      day.workouts.map((workout) => (
                        <div 
                          key={workout.id}
                          className={`text-xs p-2.5 rounded-lg truncate transition-colors ${
                            workout.scheduled ? 'bg-accent/40 hover:bg-accent/60' : 'bg-primary/20 hover:bg-primary/30'
                          }`}
                        >
                          {workout.workoutPlan.name}
                        </div>
                      ))
                    ) : (
                      <div className="flex h-full min-h-[60px] items-center justify-center">
                        <Button variant="ghost" size="sm" className="h-auto py-2 text-xs hover:bg-primary/10">
                          <PlusCircle className="h-4 w-4 mr-1" />
                          {day.isToday ? "Start" : "Add"}
                        </Button>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
            <div className="flex justify-center mt-4">
              <Link href="/workout/calendar">
                <Button variant="outline" size="sm" className="w-full hover:bg-primary hover:text-primary-foreground">
                  <Calendar className="h-4 w-4 mr-2" />
                  View Full Calendar
                </Button>
              </Link>
            </div>
          </div>

          {/* Desktop view (7 days) */}
          <div className="hidden sm:block">
            <div className="grid grid-cols-7 gap-2">
              {/* Day headers for desktop */}
              {workoutsByDay.map((day) => (
                <div key={`header-desktop-${day.date.toISOString()}`} className="p-3 text-center">
                  <div className="text-sm font-semibold text-muted-foreground">{format(day.date, 'EEE')}</div>
                  <div className={`text-xl font-bold rounded-full w-10 h-10 flex items-center justify-center mx-auto mt-1 transition-colors
                    ${day.isToday ? 'bg-primary text-primary-foreground shadow-lg' : 'hover:bg-accent'}`}>
                    {format(day.date, 'd')}
                  </div>
                </div>
              ))}
              
              {/* Calendar cells for desktop */}
              {workoutsByDay.map((day) => (
                <Link 
                  key={`cell-desktop-${day.date.toISOString()}`}
                  href={`/workout/day/${format(day.date, 'yyyy-MM-dd')}`}
                  className={`block p-3 border-2 rounded-xl min-h-[120px] overflow-y-auto transition-all hover:shadow-md ${
                    day.isToday ? 'bg-primary/5 border-primary shadow-lg' : 'border-border hover:border-primary/30'
                  }`}
                >
                  <div className="space-y-2">
                    {day.workouts.length > 0 ? (
                      day.workouts.map((workout) => (
                        <div 
                          key={workout.id}
                          className={`text-xs p-2 rounded-lg truncate transition-colors ${
                            workout.scheduled ? 'bg-accent/40 hover:bg-accent/60' : 'bg-primary/20 hover:bg-primary/30'
                          }`}
                        >
                          {workout.workoutPlan.name}
                        </div>
                      ))
                    ) : (
                      <div className="flex h-full min-h-[50px] items-center justify-center">
                        <Button variant="ghost" size="sm" className="h-auto py-2 text-xs hover:bg-primary/10">
                          <PlusCircle className="h-4 w-4 mr-1" />
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

      {/* Bottom Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quick Start Plans */}
        {recentPlans.length > 0 && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Dumbbell className="h-5 w-5 mr-2 text-primary" />
                Quick Start
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentPlans.map((plan) => (
                  <div key={plan.id} className="flex items-center justify-between p-3 rounded-lg bg-accent/20 hover:bg-accent/30 transition-colors">
                    <div>
                      <p className="font-medium">{plan.name}</p>
                      <p className="text-sm text-muted-foreground">Start immediately</p>
                    </div>
                    <Link href={`/workout/session/new?planId=${plan.id}`}>
                      <Button size="sm" variant="outline" className="hover:bg-primary hover:text-primary-foreground">
                        <Play className="h-3 w-3 mr-1" />
                        Start
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Access */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="h-5 w-5 mr-2 text-primary" />
              Quick Access
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3">
              <Link href="/exercises">
                <Button variant="outline" className="w-full justify-start h-12 hover:bg-primary hover:text-primary-foreground transition-colors">
                  <ListChecks className="mr-3 h-5 w-5" />
                  <span className="font-medium">Exercises</span>
                </Button>
              </Link>
              <Link href="/workout/history">
                <Button variant="outline" className="w-full justify-start h-12 hover:bg-primary hover:text-primary-foreground transition-colors">
                  <Dumbbell className="mr-3 h-5 w-5" />
                  <span className="font-medium">Workout History</span>
                </Button>
              </Link>
              <Link href="/workout/calendar">
                <Button variant="outline" className="w-full justify-start h-12 hover:bg-primary hover:text-primary-foreground transition-colors">
                  <Calendar className="mr-3 h-5 w-5" />
                  <span className="font-medium">Full Calendar</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Empty State */}
      {!lastIncompleteWorkout && todaysWorkouts.length === 0 && recentPlans.length === 0 && (
        <Card className="shadow-lg">
          <CardContent className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="p-4 rounded-full bg-primary/10 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Dumbbell className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Ready to Start Your Fitness Journey?</h3>
              <p className="text-muted-foreground mb-6">
                Create your first workout plan and start building healthy habits today.
              </p>
              <Link href="/workout/plans">
                <Button size="lg" className="bg-primary hover:bg-primary/90">
                  <PlusCircle className="h-5 w-5 mr-2" />
                  Create Workout Plan
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 