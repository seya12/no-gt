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

export interface AddExerciseToSessionResponse {
  success: boolean;
  error?: string;
  sets?: Array<{
    id: string;
    exerciseId: string;
    targetReps: number;
    weight: number;
    completed: boolean;
    exercise: {
      id: string;
      name: string;
    };
  }>;
}

export interface RemoveExerciseFromSessionResponse {
  success: boolean;
  error?: string;
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

export async function addExerciseToSessionAction(data: {
  sessionId: string;
  exerciseId: string;
  sets: number;
  reps: number;
  weight: number;
}): Promise<AddExerciseToSessionResponse> {
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const { sessionId, exerciseId, sets: setsCount, reps, weight } = data;

    if (!sessionId || !exerciseId || setsCount < 1) {
      return { success: false, error: "Missing required fields" };
    }

    // Verify the workout session belongs to the user and is active
    const workoutSession = await prisma.workoutSession.findUnique({
      where: {
        id: sessionId,
        userId: session.user.id,
      },
    });

    if (!workoutSession) {
      return { success: false, error: "Workout session not found or not authorized" };
    }

    if (workoutSession.completedAt) {
      return { success: false, error: "Cannot add exercises to a completed workout" };
    }

    // Verify the exercise exists
    const exercise = await prisma.exercise.findUnique({
      where: { id: exerciseId },
    });

    if (!exercise) {
      return { success: false, error: "Exercise not found" };
    }

    // If weight is 0, try to get it from the workout plan
    let finalWeight = weight;
    if (weight === 0) {
      // Check if this exercise is in any of the user's workout plans to get default weight
      const planExercise = await prisma.workoutPlanExercise.findFirst({
        where: {
          exerciseId: exerciseId,
          workoutPlan: {
            userId: session.user.id,
          },
        },
        orderBy: {
          workoutPlan: {
            updatedAt: 'desc', // Get the most recently updated plan
          },
        },
      });
      
      if (planExercise?.startingWeight) {
        finalWeight = planExercise.startingWeight;
      }
    }

    // Create the sets for the new exercise
    const newSets = await Promise.all(
      Array.from({ length: setsCount }, () =>
        prisma.set.create({
          data: {
            workoutSessionId: sessionId,
            exerciseId: exerciseId,
            targetReps: reps,
            weight: finalWeight,
            completed: false,
          },
          include: {
            exercise: true,
          },
        })
      )
    );

    // Revalidate the workout session page
    revalidatePath(`/workout/session/${sessionId}`);

    return { 
      success: true, 
      sets: newSets 
    };

  } catch (error) {
    console.error("Error adding exercise to session:", error);
    return { success: false, error: "Failed to add exercise to workout. Please try again." };
  }
}

export async function removeExerciseFromSessionAction(data: {
  sessionId: string;
  exerciseId: string;
}): Promise<RemoveExerciseFromSessionResponse> {
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const { sessionId, exerciseId } = data;

    if (!sessionId || !exerciseId) {
      return { success: false, error: "Missing required fields" };
    }

    // Verify the workout session belongs to the user and is active
    const workoutSession = await prisma.workoutSession.findUnique({
      where: {
        id: sessionId,
        userId: session.user.id,
      },
    });

    if (!workoutSession) {
      return { success: false, error: "Workout session not found or not authorized" };
    }

    if (workoutSession.completedAt) {
      return { success: false, error: "Cannot remove exercises from a completed workout" };
    }

    // Delete all sets for this exercise in this session
    await prisma.set.deleteMany({
      where: {
        workoutSessionId: sessionId,
        exerciseId: exerciseId,
      },
    });

    // Revalidate the workout session page
    revalidatePath(`/workout/session/${sessionId}`);

    return { success: true };

  } catch (error) {
    console.error("Error removing exercise from session:", error);
    return { success: false, error: "Failed to remove exercise from workout. Please try again." };
  }
} 