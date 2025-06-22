import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authConfig } from "@/lib/auth/auth.config";
import { prisma } from "@/lib/db";
import { format, parseISO } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Calendar, ChevronLeft, CheckCircle } from "lucide-react";
import { revalidatePath } from "next/cache";

interface SchedulePageProps {
  searchParams: Promise<{
    planId?: string;
    date?: string;
  }>
}

export default async function SchedulePage({ searchParams }: SchedulePageProps) {
  const session = await getServerSession(authConfig);

  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  // Get and validate parameters
  const params = await searchParams;
  
  // Validate parameters
  if (!params.planId || !params.date) {
    redirect("/dashboard");
  }

  const planId = params.planId;
  const date = parseISO(params.date);

  // Get workout plan details
  const workoutPlan = await prisma.workoutPlan.findFirst({
    where: {
      id: planId,
      userId: session.user.id,
    },
    include: {
      exercises: {
        include: {
          exercise: true,
        },
      },
    },
  });

  if (!workoutPlan) {
    redirect("/dashboard");
  }

  // Check if there's already a scheduled workout for this date and plan
  const existingScheduled = await prisma.workoutSession.findFirst({
    where: {
      userId: session.user.id,
      workoutPlanId: planId,
      date: {
        gte: new Date(date.setHours(0, 0, 0, 0)),
        lte: new Date(date.setHours(23, 59, 59, 999)),
      },
      scheduled: true,
    },
  });

  // Handle form submission to schedule workout
  async function scheduleWorkout(formData: FormData) {
    "use server";
    
    // Get parameters from form data
    const planId = formData.get('planId') as string;
    const dateStr = formData.get('date') as string;
    const date = parseISO(dateStr);
    
    // We need to re-check for existing workouts since server actions
    // don't have access to component variables
    const session = await getServerSession(authConfig);
    if (!session?.user) {
      return;
    }

    // Get workout plan and verify it exists
    const workoutPlan = await prisma.workoutPlan.findFirst({
      where: {
        id: planId,
        userId: session.user.id,
      },
      include: {
        exercises: {
          include: {
            exercise: true,
          },
        },
      },
    });

    if (!workoutPlan) {
      return; // Plan not found
    }

    // Check for existing scheduled workouts again
    const checkExisting = await prisma.workoutSession.findFirst({
      where: {
        userId: session.user.id,
        workoutPlanId: planId,
        date: {
          gte: new Date(date.setHours(0, 0, 0, 0)),
          lte: new Date(date.setHours(23, 59, 59, 999)),
        },
        scheduled: true,
      },
    });

    if (checkExisting) {
      return; // Already scheduled
    }

    // Create a scheduled workout session with proper Prisma types
    await prisma.workoutSession.create({
      data: {
        userId: session.user.id,
        workoutPlanId: planId,
        date: date,
        scheduled: true,
      },
    }).then(async (createdSession) => {
      // Now create sets for each exercise
      for (const exercise of workoutPlan!.exercises) {
        // Create sets for this exercise
        const sets = Array.from({ length: exercise.defaultSets || 3 }).map(() => ({
          workoutSessionId: createdSession.id,
          exerciseId: exercise.exerciseId,
          targetReps: exercise.defaultReps || 10,
          weight: exercise.startingWeight || 0,
          completed: false,
        }));

        // Insert sets in a separate operation
        await prisma.set.createMany({
          data: sets,
        });
      }
    });

    // Revalidate the dashboard and calendar paths
    revalidatePath("/dashboard");
    revalidatePath("/workout/calendar");
    revalidatePath(`/workout/day/${format(date, 'yyyy-MM-dd')}`);
    
    redirect(`/workout/day/${format(date, 'yyyy-MM-dd')}`);
  }

  return (
    <div className="container p-4 pb-20 space-y-6">
      <div className="flex items-center space-x-2">
        <Link href={`/workout/day/${format(date, 'yyyy-MM-dd')}`}>
          <Button variant="ghost" size="sm" className="flex items-center">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Schedule Workout</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Schedule &quot;{workoutPlan.name}&quot;</CardTitle>
          <CardDescription>
            for {format(date, 'EEEE, MMMM d, yyyy')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{format(date, 'MMMM d, yyyy')}</span>
          </div>
          
          <div className="space-y-2">
            <div className="text-sm font-medium">Exercises</div>
            <div className="space-y-2">
              {workoutPlan.exercises.map((exercise) => (
                <div 
                  key={exercise.id} 
                  className="flex items-center p-2 rounded-md bg-background border"
                >
                  <div className="flex-1">
                    <div className="font-medium">{exercise.exercise.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {exercise.defaultSets || 3} sets • {exercise.defaultReps || 10} reps • {exercise.startingWeight || 0}kg
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Link href={`/workout/day/${format(date, 'yyyy-MM-dd')}`}>
            <Button variant="outline">Cancel</Button>
          </Link>
          {existingScheduled ? (
            <Button disabled className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />
              Already Scheduled
            </Button>
          ) : (
            <form action={scheduleWorkout}>
              <input type="hidden" name="planId" value={planId} />
              <input type="hidden" name="date" value={params.date} />
              <Button type="submit">Schedule Workout</Button>
            </form>
          )}
        </CardFooter>
      </Card>
    </div>
  );
} 