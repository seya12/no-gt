'use server';

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authConfig } from "@/lib/auth/auth.config";
import { prisma } from "@/lib/db";
import { format, parseISO } from "date-fns";

export interface CompleteWorkoutSessionResponse {
  success: boolean;
  error?: string;
  redirectUrl?: string; // For client-side navigation after completion
  // completedSession?: any; // Optional: return the completed session data if needed
}

export interface StartWorkoutSessionResponse {
  success: boolean;
  error?: string;
}

export interface LogWorkoutResponse {
  success: boolean;
  error?: string;
  sessionId?: string;
}

type LoggedSet = {
  exerciseId: string;
  reps: number;
  weight: number;
}

export async function logWorkoutAction(data: {
  workoutPlanId: string;
  date: string; // YYYY-MM-DD format
  sets: LoggedSet[];
}): Promise<LogWorkoutResponse> {
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const { workoutPlanId, date, sets } = data;

    if (!workoutPlanId || !date || !sets.length) {
      return { success: false, error: "Missing required fields" };
    }

    // Verify the workout plan belongs to the user
    const workoutPlan = await prisma.workoutPlan.findUnique({
      where: {
        id: workoutPlanId,
        userId: session.user.id,
      },
    });

    if (!workoutPlan) {
      return { success: false, error: "Workout plan not found or not authorized" };
    }

    const selectedDate = parseISO(date);
    
    // Create the workout session with all sets marked as completed
    const workoutSession = await prisma.workoutSession.create({
      data: {
        date: selectedDate,
        completedAt: selectedDate, // Mark as completed immediately
        userId: session.user.id,
        workoutPlanId: workoutPlan.id,
        scheduled: false,
        sets: {
          create: sets.map(set => ({
            exerciseId: set.exerciseId,
            targetReps: set.reps,
            actualReps: set.reps,
            weight: set.weight,
            completed: true, // All sets are pre-completed
          })),
        },
      },
    });

    // Revalidate relevant paths
    revalidatePath("/dashboard");
    revalidatePath("/workout/history");
    revalidatePath(`/workout/day/${date}`);
    revalidatePath("/workout/calendar");

    return { 
      success: true, 
      sessionId: workoutSession.id 
    };

  } catch (error) {
    console.error("Error logging workout:", error);
    return { success: false, error: "Failed to log workout. Please try again." };
  }
}

export async function completeWorkoutSessionAction(
  sessionId: string
): Promise<CompleteWorkoutSessionResponse> {
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  if (!sessionId) {
    return { success: false, error: "Session ID is required." };
  }

  try {
    const workoutSession = await prisma.workoutSession.findUnique({
      where: {
        id: sessionId,
        userId: session.user.id,
      },
      include: {
        sets: true, // Need sets to verify completion
      },
    });

    if (!workoutSession) {
      return { success: false, error: "Workout session not found or not authorized." };
    }

    if (workoutSession.completedAt) {
      // Already completed, maybe redirect or just confirm success
      return { 
        success: true, 
        redirectUrl: `/workout/session/${sessionId}/complete` 
      };
    }

    // Check if all sets are marked as completed
    const allSetsCompleted = workoutSession.sets.every(set => set.completed);
    if (!allSetsCompleted) {
      return { success: false, error: "Not all sets are completed. Please complete all sets before finishing the workout." };
    }

    const updatedSession = await prisma.workoutSession.update({
      where: {
        id: sessionId,
      },
      data: {
        completedAt: new Date(),
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/workout/calendar");
    if (updatedSession.date) {
      revalidatePath(`/workout/day/${format(new Date(updatedSession.date), 'yyyy-MM-dd')}`);
    }
    revalidatePath(`/workout/history`); // Assuming a history page might exist
    revalidatePath(`/workout/session/${sessionId}/complete`);

    return { 
      success: true, 
      redirectUrl: `/workout/session/${sessionId}/complete`
      // completedSession: updatedSession 
    };

  } catch (error) {
    console.error(`Error completing workout session ${sessionId}:`, error);
    return { success: false, error: "Failed to complete workout session. Please try again." };
  }
}

export async function startWorkoutSessionAction(sessionId: string): Promise<StartWorkoutSessionResponse> {
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Verify the session belongs to the user and is scheduled
    const workoutSession = await prisma.workoutSession.findFirst({
      where: {
        id: sessionId,
        userId: session.user.id,
        scheduled: true,
        startedAt: null,
      },
    });

    if (!workoutSession) {
      return { success: false, error: "Workout session not found or already started" };
    }

    // Mark as started
    await prisma.workoutSession.update({
      where: { id: sessionId },
      data: { 
        startedAt: new Date(),
        scheduled: false // Convert from scheduled to active workout
      }
    });

    // Revalidate relevant paths
    revalidatePath("/dashboard");
    revalidatePath(`/workout/session/${sessionId}`);

    return { success: true };
  } catch (error) {
    console.error("Failed to start workout session:", error);
    return { success: false, error: "Failed to start workout session" };
  }
} 