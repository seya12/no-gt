'use server';

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache"; // May not be strictly needed if client updates state optimistically
import { z } from "zod";
import { authConfig } from "@/lib/auth/auth.config";
import { prisma } from "@/lib/db";
import type { Set } from "@prisma/client";
import { format } from "date-fns";

// Schema for validating set updates (copied from API route)
const setUpdateSchema = z.object({
  actualReps: z.number().int().min(0).nullable().optional(),
  weight: z.number().min(0).optional(),
  completed: z.boolean().optional(),
  notes: z.string().optional().nullable(),
  nextWeightAdjustment: z.enum(["increase", "decrease", "keep"]).optional().nullable(),
});

interface FlattenedError {
  formErrors: string[];
  fieldErrors: { [key: string]: string[] | undefined };
}

export interface UpdateWorkoutSetResponse {
  success: boolean;
  error?: string;
  details?: FlattenedError;
  updatedSet?: Set;
}

export async function updateWorkoutSetAction(
  setId: string,
  updates: Partial<Omit<Set, 'id' | 'exerciseId' | 'workoutSessionId'>> // Ensure only updatable fields are passed
): Promise<UpdateWorkoutSetResponse> {
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  if (!setId) {
    return { success: false, error: "Set ID is required." };
  }

  const validationResult = setUpdateSchema.safeParse(updates);
  if (!validationResult.success) {
    return {
      success: false,
      error: "Invalid data provided for set update.",
      details: validationResult.error.flatten() as FlattenedError,
    };
  }

  try {
    // First, verify the set belongs to the user to prevent unauthorized updates
    const existingSet = await prisma.set.findFirst({
      where: {
        id: setId,
        workoutSession: {
          userId: session.user.id,
        },
      },
      select: {
        id: true, // Select only necessary fields for verification
        workoutSessionId: true, // For potential revalidation
        workoutSession: { select: { date: true } } // For revalidation by date
      }
    });

    if (!existingSet) {
      return { success: false, error: "Set not found or not authorized." };
    }

    const updatedSet = await prisma.set.update({
      where: {
        id: setId,
      },
      data: validationResult.data,
    });

    // Consider revalidation if data displayed elsewhere depends on this
    // For instance, if a workout summary page shows details of sets.
    // Revalidating the specific workout day path could be useful.
    if (existingSet.workoutSession?.date) {
        revalidatePath(`/workout/day/${format(new Date(existingSet.workoutSession.date), 'yyyy-MM-dd')}`);
    }
    // Potentially revalidate a specific session page if one exists that shows set details.
    // revalidatePath(`/workout/session/${existingSet.workoutSessionId}`);

    return { success: true, updatedSet };

  } catch (error) {
    console.error(`Error updating set ${setId}:`, error);
    return { success: false, error: "Failed to update set. Please try again." };
  }
} 