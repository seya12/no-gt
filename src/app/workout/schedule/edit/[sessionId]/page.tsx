import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authConfig } from "@/lib/auth/auth.config";
import { prisma } from "@/lib/db";
import { format } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { revalidatePath } from "next/cache";
import { EditScheduleForm } from "@/components/workout/edit-schedule-form";

interface EditSchedulePageProps {
  params: Promise<{
    sessionId: string; 
  }>;
}

async function updateScheduledWorkout(formData: FormData) {
  "use server";

  const session = await getServerSession(authConfig);
  if (!session?.user) {
    redirect("/api/auth/signin"); 
  }

  const currentSessionId = formData.get("sessionId") as string;
  const newPlanId = formData.get("planId") as string;
  const newDateString = formData.get("date") as string;

  if (!currentSessionId || !newPlanId || !newDateString) {
    console.error("UpdateScheduledWorkout: Missing form data.");
    throw new Error("Missing form data. Please ensure all fields are selected.");
  }

  const newDate = new Date(newDateString + 'T00:00:00');
  if (isNaN(newDate.getTime())) {
      console.error("UpdateScheduledWorkout: Invalid date format.");
      throw new Error("Invalid date format.");
  }

  try {
    const newWorkoutPlan = await prisma.workoutPlan.findUnique({
      where: { id: newPlanId, userId: session.user.id },
      include: { exercises: { include: { exercise: true } } }
    });

    if (!newWorkoutPlan) {
      console.error("UpdateScheduledWorkout: New workout plan not found.");
      throw new Error("Selected workout plan not found.");
    }

    const originalSession = await prisma.workoutSession.findUnique({
      where: { id: currentSessionId, userId: session.user.id },
      select: { date: true }
    });
    const originalDate = originalSession?.date;

    await prisma.$transaction(async (tx) => {
      await tx.workoutSession.update({
        where: { id: currentSessionId, userId: session.user.id },
        data: { workoutPlanId: newPlanId, date: newDate },
      });
      await tx.set.deleteMany({ where: { workoutSessionId: currentSessionId } });
      if (newWorkoutPlan.exercises.length > 0) {
        const setsToCreate = newWorkoutPlan.exercises.flatMap(planExercise => 
          Array.from({ length: planExercise.defaultSets || 3 }).map(() => ({
            workoutSessionId: currentSessionId,
            exerciseId: planExercise.exerciseId,
            targetReps: planExercise.defaultReps || 10,
            weight: planExercise.startingWeight || 0,
            completed: false,
          }))
        );
        if (setsToCreate.length > 0) {
          await tx.set.createMany({ data: setsToCreate });
        }
      }
    });

    if (originalDate) {
      revalidatePath(`/workout/day/${format(originalDate, 'yyyy-MM-dd')}`);
    }
    revalidatePath(`/workout/day/${format(newDate, 'yyyy-MM-dd')}`);
    revalidatePath("/dashboard");
    revalidatePath("/workout/calendar");

    return {
      success: true,
      redirectUrl: `/workout/day/${format(newDate, 'yyyy-MM-dd')}`,
      message: "Workout rescheduled successfully!"
    };

  } catch (e: unknown) {
    const error = e as ErrorWithDigest;
    console.error("Failed to update scheduled workout:", error);

    if (error instanceof Error) {
      if (error.message.includes("Missing form data") || 
          error.message.includes("Invalid date") || 
          error.message.includes("plan not found")) {
        return { success: false, error: error.message };
      }
    }
    return { success: false, error: "An unexpected error occurred while updating the schedule." };
  }
}

// Helper type for error with a potential digest property
interface ErrorWithDigest extends Error {
  digest?: string;
}

export default async function EditSchedulePage({ params }: EditSchedulePageProps) {
  const session = await getServerSession(authConfig);
  if (!session?.user) redirect("/api/auth/signin");

  const { sessionId } = await params;
  if (!sessionId) {
    console.error("EditSchedulePage: sessionId is missing");
    redirect("/dashboard");
  }

  const workoutSession = await prisma.workoutSession.findUnique({
    where: { id: sessionId, userId: session.user.id, scheduled: true },
    include: { workoutPlan: true },
  });

  if (!workoutSession) {
    console.error(`EditSchedulePage: Workout session with ID ${sessionId} not found or not editable.`);
    redirect("/dashboard"); 
  }

  const allUserPlans = await prisma.workoutPlan.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });

  const clientSafeWorkoutSession = {
    ...workoutSession,
    date: workoutSession.date.toISOString(),
  };

  const pageTitle = "Reschedule Workout";
  const currentDate = workoutSession.date;

  return (
    <div className="container p-4 pb-20 space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center space-x-2 mb-4">
        <Link href={`/workout/day/${format(currentDate, 'yyyy-MM-dd')}`}>
          <Button variant="ghost" size="sm" className="flex items-center">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Day View
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">{pageTitle}</h1>
      </div>

      <EditScheduleForm 
        sessionId={sessionId}
        workoutSession={clientSafeWorkoutSession}
        allUserPlans={allUserPlans}
        updateAction={updateScheduledWorkout}
      />
    </div>
  );
} 