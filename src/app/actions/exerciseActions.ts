'use server';

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authConfig } from "@/lib/auth/auth.config";
import { prisma } from "@/lib/db";
import type { Exercise } from "@prisma/client";

const exerciseSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional().nullable(),
});

// Type for the structure returned by Zod's error.flatten()
// Made fieldErrors more generic to accommodate different forms
interface FlattenedError {
  formErrors: string[];
  fieldErrors: { [key: string]: string[] | undefined };
}

export interface CreateExerciseResponse {
  success: boolean;
  exercise?: Exercise;
  error?: string;
  details?: FlattenedError;
}

export async function createExerciseAction(
  prevState: CreateExerciseResponse | undefined,
  formData: FormData
): Promise<CreateExerciseResponse> {
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const name = formData.get("name") as string;
  const descriptionValue = formData.get("description");
  const description = descriptionValue && typeof descriptionValue === 'string' && descriptionValue.trim() !== "" 
                      ? descriptionValue.trim() 
                      : null;

  const parsedData = { name, description };
  const result = exerciseSchema.safeParse(parsedData);

  if (!result.success) {
    return { 
      success: false, 
      error: "Invalid exercise data", 
      details: result.error.flatten()
    };
  }

  try {
    const exercise = await prisma.exercise.create({
      data: {
        name: result.data.name,
        description: result.data.description,
        userId: session.user.id,
      },
    });
    revalidatePath("/exercises");
    revalidatePath("/dashboard");

    return { success: true, exercise };
  } catch (error) {
    console.error("Error creating exercise:", error);
    return { success: false, error: "Failed to create exercise. Please try again." };
  }
}

// New interface for update response
export interface UpdateExerciseResponse {
  success: boolean;
  exercise?: Exercise;
  error?: string;
  details?: FlattenedError; // For Zod validation errors
}

// Server action to update an existing exercise
export async function updateExerciseAction(
  exerciseId: string, // Added exerciseId parameter
  prevState: UpdateExerciseResponse | undefined, // prevState for useFormState, can be undefined if not used directly
  formData: FormData
): Promise<UpdateExerciseResponse> {
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const name = formData.get("name") as string;
  const descriptionValue = formData.get("description");
  const description = descriptionValue && typeof descriptionValue === 'string' && descriptionValue.trim() !== "" 
                      ? descriptionValue.trim() 
                      : null;

  const parsedData = { name, description };
  const result = exerciseSchema.safeParse(parsedData); // Using the same schema as create

  if (!result.success) {
    return { 
      success: false, 
      error: "Invalid exercise data", 
      details: result.error.flatten()
    };
  }

  try {
    // Check if the exercise exists and belongs to the user
    const existingExercise = await prisma.exercise.findUnique({
      where: { id: exerciseId },
    });

    if (!existingExercise) {
      return { success: false, error: "Exercise not found." };
    }

    if (existingExercise.userId !== session.user.id) {
      return { success: false, error: "Forbidden. You can only update your own exercises." };
    }

    const updatedExercise = await prisma.exercise.update({
      where: {
        id: exerciseId,
        // No need for userId here as we checked ownership above, but can be added for extra safety
        // userId: session.user.id, 
      },
      data: {
        name: result.data.name,
        description: result.data.description,
      },
    });

    revalidatePath("/exercises"); // Page listing all exercises
    revalidatePath(`/exercises/${exerciseId}`); // Specific exercise page if it exists
    revalidatePath("/dashboard"); // Dashboard if it shows exercise details

    return { success: true, exercise: updatedExercise };
  } catch (error) {
    console.error(`Error updating exercise ${exerciseId}:`, error);
    // Handle specific Prisma errors like P2002 for unique constraints if name should be unique globally or per user
    // For example, if a user tries to rename an exercise to a name that another of their exercises already has.
    // if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    //   return { success: false, error: "An exercise with this name already exists.", details: { fieldErrors: { name: ["Name already taken"] }, formErrors: [] } };
    // }
    return { success: false, error: "Failed to update exercise. Please try again." };
  }
}

// Interface for delete response
export interface DeleteExerciseResponse {
  success: boolean;
  error?: string;
  // Potentially include the ID of the deleted exercise if useful for UI updates
  // deletedExerciseId?: string;
}

// Server action to delete an existing exercise
export async function deleteExerciseAction(
  exerciseId: string,
  // prevState can be added if using useFormState, but often not needed for simple delete
  // prevState: DeleteExerciseResponse | undefined 
): Promise<DeleteExerciseResponse> {
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  if (!exerciseId) {
    return { success: false, error: "Exercise ID is required." };
  }

  try {
    // Check if the exercise exists and belongs to the user
    const existingExercise = await prisma.exercise.findUnique({
      where: { id: exerciseId },
    });

    if (!existingExercise) {
      return { success: false, error: "Exercise not found." };
    }

    if (existingExercise.userId !== session.user.id) {
      return { success: false, error: "Forbidden. You can only delete your own exercises." };
    }

    await prisma.exercise.delete({
      where: {
        id: exerciseId,
        // userId: session.user.id, // Ensured by the check above
      },
    });

    revalidatePath("/exercises"); // Page listing all exercises
    revalidatePath("/dashboard"); // Dashboard if it shows exercise summaries or counts
    // Consider revalidating other paths where this exercise might have been listed
    // or affected counts, e.g., workout plans that used this exercise.

    return { success: true };
  } catch (error) {
    console.error(`Error deleting exercise ${exerciseId}:`, error);
    // Handle specific Prisma errors if necessary, e.g., if deletion is constrained by other records.
    // if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
    //   return { success: false, error: "Cannot delete this exercise as it is part of a scheduled workout or plan. Please remove it from those first." };
    // }
    return { success: false, error: "Failed to delete exercise. Please try again." };
  }
}

// Schema for validating progression updates (from the original API route)
const progressionSchema = z.object({
  exerciseId: z.string(), // Added exerciseId to be part of the form data
  shouldProgress: z.boolean(),
  progressionAmount: z.number().min(0),
});

export interface LogProgressionResponse {
  success: boolean;
  error?: string;
  details?: FlattenedError; // Reusing FlattenedError for Zod validation
  // Include any data returned by the action, e.g.:
  // shouldProgress?: boolean;
  // progressionAmount?: number;
}

// Server action to log exercise progression
export async function logExerciseProgressionAction(
  prevState: LogProgressionResponse | undefined,
  formData: FormData
): Promise<LogProgressionResponse> {
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const exerciseId = formData.get("exerciseId") as string;
  // Zod expects boolean and number, FormData gives strings. Need to coerce.
  const shouldProgressStr = formData.get("shouldProgress") as string;
  const progressionAmountStr = formData.get("progressionAmount") as string;

  const parsedData = {
    exerciseId,
    shouldProgress: shouldProgressStr === "true",
    progressionAmount: progressionAmountStr ? parseFloat(progressionAmountStr) : 0,
  };

  const result = progressionSchema.safeParse(parsedData);

  if (!result.success) {
    return { 
      success: false, 
      error: "Invalid progression data", 
      details: result.error.flatten() 
    };
  }

  const { exerciseId: validatedExerciseId, shouldProgress, progressionAmount } = result.data;

  try {
    // Verify the exercise exists and belongs to the user (or is a public exercise they can track against)
    // The original API route had a check for existence and ownership, logging if not owned but still proceeding.
    // For a server action, we might want stricter ownership or clear logic for non-owned exercises.
    const exercise = await prisma.exercise.findUnique({
      where: { id: validatedExerciseId },
    });

    if (!exercise) {
      return { success: false, error: "Exercise not found." };
    }
    
    // Optional: Check ownership if progression should only be logged for owned exercises
    // if (exercise.userId !== session.user.id) {
    //   return { success: false, error: "Forbidden. You can only log progression for your own exercises." };
    // }

    // Placeholder for actual progression logging logic
    // This might involve creating/updating a ProgressionLog table, updating Exercise.currentWeight, etc.
    console.log("Logging progression for exercise:", validatedExerciseId, {
      userId: session.user.id,
      shouldProgress,
      progressionAmount,
    });

    // For now, just revalidate paths where progression might be displayed
    revalidatePath(`/exercises/${validatedExerciseId}`);
    revalidatePath("/dashboard"); // If dashboard shows progression summaries

    return { success: true /*, shouldProgress, progressionAmount */ }; // Return relevant data if needed by client

  } catch (error) {
    console.error(`Error logging progression for exercise ${validatedExerciseId}:`, error);
    return { success: false, error: "Failed to log exercise progression. Please try again." };
  }
} 