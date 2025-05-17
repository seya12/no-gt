'use server';

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authConfig } from "@/lib/auth/auth.config";
import { prisma } from "@/lib/db";
import { format } from "date-fns";

export interface DeleteWorkoutSessionResponse {
  success: boolean;
  error?: string;
}

export async function deleteWorkoutSessionAction(
  workoutSessionId: string
): Promise<DeleteWorkoutSessionResponse> {
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  if (!workoutSessionId) {
    return { success: false, error: "Workout Session ID is required." };
  }

  try {
    const workoutSession = await prisma.workoutSession.findFirst({
      where: {
        id: workoutSessionId,
        userId: session.user.id,
      },
    });

    if (!workoutSession) {
      return { success: false, error: "Workout session not found or not authorized." };
    }

    await prisma.workoutSession.delete({
      where: {
        id: workoutSessionId,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/workout/calendar");
    if (workoutSession.date) {
        revalidatePath(`/workout/day/${format(new Date(workoutSession.date), 'yyyy-MM-dd')}`);
    }
    revalidatePath("/workout/history");
    
    return { success: true };

  } catch (error) {
    console.error(`Error deleting workout session ${workoutSessionId}:`, error);
    return { success: false, error: "Failed to delete workout session. Please try again." };
  }
} 