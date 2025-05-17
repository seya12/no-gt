import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authConfig } from "@/lib/auth/auth.config";
import { prisma } from "@/lib/db";
import { format, parseISO, isBefore, isSameDay, isAfter } from "date-fns";
import Link from "next/link";
import { 
  CalendarClock, 
  ChevronLeft,
  Calendar, 
  Dumbbell, 
  PlusCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScheduleActions } from "@/components/workout/schedule-actions";

interface DayPageProps {
  params: Promise<{
    date: string; // YYYY-MM-DD format
  }>;
}

export default async function DayPage({ params }: DayPageProps) {
  const session = await getServerSession(authConfig);

  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  const { date } = await params;
  const today = new Date();
  const selectedDate = parseISO(date);
  
  // Determine time context
  const isPast = isBefore(selectedDate, today) && !isSameDay(selectedDate, today);
  const isToday = isSameDay(selectedDate, today);
  const isFuture = isAfter(selectedDate, today);

  // Fetch workouts for this day
  const workouts = await prisma.workoutSession.findMany({
    where: {
      userId: session.user.id,
      date: {
        gte: new Date(selectedDate.setHours(0, 0, 0, 0)),
        lte: new Date(selectedDate.setHours(23, 59, 59, 999)),
      }
    },
    include: {
      workoutPlan: true,
      sets: {
        include: {
          exercise: true,
        },
      },
    },
    orderBy: {
      date: "asc",
    },
  });

  // Fetch available workout plans for today or future scheduling
  const workoutPlans = !isPast ? await prisma.workoutPlan.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      updatedAt: "desc",
    },
    include: {
      exercises: {
        include: {
          exercise: true,
        },
      },
    },
    take: 5,
  }) : [];

  // Define page title based on time context
  const pageTitle = isToday 
    ? "Today's Workout" 
    : isPast 
      ? `Workout on ${format(selectedDate, 'MMMM d, yyyy')}` 
      : `Schedule for ${format(selectedDate, 'MMMM d, yyyy')}`;

  return (
    <div className="container p-4 pb-20 space-y-6">
      <div className="flex items-center space-x-2">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="flex items-center">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">{pageTitle}</h1>
      </div>

      {/* Past day view: Show workout history */}
      {isPast && (
        <div className="space-y-4">
          {workouts.length > 0 ? (
            <>
              <h2 className="text-lg font-medium">Completed Workouts</h2>
              <div className="space-y-4">
                {workouts.map((workout) => (
                  <Card key={workout.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>{workout.workoutPlan.name}</CardTitle>
                          <CardDescription>
                            {format(new Date(workout.date), 'hh:mm a')}
                          </CardDescription>
                        </div>
                        <Badge 
                          variant="outline" 
                          className="bg-primary/10 text-primary"
                        >
                          Completed
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="text-sm font-medium mb-1">Exercises:</div>
                        <div className="flex flex-wrap gap-2">
                          {Array.from(new Set(workout.sets.map(set => set.exercise.name))).map((name) => (
                            <Badge key={name} variant="secondary">
                              {name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Sets: {workout.sets.length}</span>
                        <span>Completed: {workout.sets.filter(set => set.completed).length}</span>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Link href={`/workout/session/${workout.id}`}>
                        <Button variant="outline">View Details</Button>
                      </Link>
                      <Link href={`/workout/session/new?planId=${workout.workoutPlanId}`}>
                        <Button>
                          <Dumbbell className="h-4 w-4 mr-2" />
                          Repeat This Workout
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Workouts Found</CardTitle>
                <CardDescription>
                  You don&apos;t have any recorded workouts for this day.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Would you like to log a workout for this date?
                </p>
              </CardContent>
              <CardFooter>
                <Link href={`/workout/session/new?date=${date}`}>
                  <Button>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Log a Workout
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          )}
        </div>
      )}

      {/* Today's view: Start today's workout */}
      {isToday && (
        <div className="space-y-6">
          {/* Scheduled workouts section */}
          <div className="space-y-4">
            {workouts.some(w => w.scheduled) && (
              <>
                <h2 className="text-lg font-medium flex items-center">
                  <CalendarClock className="h-5 w-5 mr-2" />
                  Scheduled for Today
                </h2>
                <div className="space-y-4">
                  {workouts
                    .filter(w => w.scheduled)
                    .map((workout) => (
                      <Card key={workout.id} className="border-accent">
                        <CardHeader>
                          <div className="flex justify-between items-center">
                            <CardTitle>{workout.workoutPlan.name}</CardTitle>
                            <Badge variant="outline" className="bg-accent/20">Scheduled</Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {Array.from(new Set(workout.sets.map(set => set.exercise.name))).map((name) => (
                              <Badge key={name} variant="secondary">
                                {name}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                        <CardFooter>
                          <Link href={`/workout/session/${workout.id}`} className="w-full mb-2">
                            <Button className="w-full">
                              <Dumbbell className="h-4 w-4 mr-2" />
                              Start This Workout
                            </Button>
                          </Link>
                          <ScheduleActions workoutId={workout.id} />
                        </CardFooter>
                      </Card>
                    ))}
                </div>
              </>
            )}
            {/* Always show the schedule button - Replaced with a list of plans to schedule */}
            <div className="space-y-2 mt-4">
              <h3 className="text-md font-medium">
                {workouts.some(w => w.scheduled) ? 'Schedule Another Workout:' : 'Schedule a Workout:'}
              </h3>
              {workoutPlans.length > 0 ? (
                workoutPlans.map((plan) => (
                  <Link 
                    key={plan.id} 
                    href={`/workout/schedule?planId=${plan.id}&date=${date}`} 
                    className="block w-full"
                  >
                    <Button variant="outline" className="w-full justify-start">
                      <Calendar className="h-4 w-4 mr-2" />
                      {plan.name}
                    </Button>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  You have no workout plans to schedule. Create a plan first.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Future day view: Schedule a workout */}
      {isFuture && (
        <div className="space-y-6">
          {/* Scheduled workouts section */}
          <div className="space-y-4">
            {workouts.some(w => w.scheduled) && (
              <>
                <h2 className="text-lg font-medium flex items-center">
                  <CalendarClock className="h-5 w-5 mr-2" />
                  Scheduled Workouts
                </h2>
                <div className="space-y-4">
                  {workouts
                    .filter(w => w.scheduled)
                    .map((workout) => (
                      <Card key={workout.id} className="border-accent">
                        <CardHeader>
                          <div className="flex justify-between items-center">
                            <CardTitle>{workout.workoutPlan.name}</CardTitle>
                            <Badge variant="outline" className="bg-accent/20">Scheduled</Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {Array.from(new Set(workout.sets.map(set => set.exercise.name))).map((name) => (
                              <Badge key={name} variant="secondary">
                                {name}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                        <CardFooter>
                          <ScheduleActions 
                            workoutId={workout.id} 
                          />
                        </CardFooter>
                      </Card>
                    ))}
                </div>
              </>
            )}
            {/* Always show the schedule button - Replaced with a list of plans to schedule */}
            <div className="space-y-2 mt-4">
              <h3 className="text-md font-medium">
                {workouts.some(w => w.scheduled) ? 'Schedule Another Workout:' : 'Schedule a Workout:'}
              </h3>
              {workoutPlans.length > 0 ? (
                workoutPlans.map((plan) => (
                  <Link 
                    key={plan.id} 
                    href={`/workout/schedule?planId=${plan.id}&date=${date}`} 
                    className="block w-full"
                  >
                    <Button variant="outline" className="w-full justify-start">
                      <Calendar className="h-4 w-4 mr-2" />
                      {plan.name}
                    </Button>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  You have no workout plans to schedule. Create a plan first.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 