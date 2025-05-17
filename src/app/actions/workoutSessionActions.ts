'use server';

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authConfig } from "@/lib/auth/auth.config";
import { prisma } from "@/lib/db";
import { format } from "date-fns";

export interface CompleteWorkoutSessionResponse {
  success: boolean;
  error?: string;
  redirectUrl?: string; // For client-side navigation after completion
  // completedSession?: any; // Optional: return the completed session data if needed
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