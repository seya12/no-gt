'use server';

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authConfig } from "@/lib/auth/auth.config";
import { prisma } from "@/lib/db";
import type { WorkoutPlan, WorkoutPlanExercise, Exercise } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

// Schema for validating workout plan creation (copied from API route)
const workoutPlanSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  exercises: z.array(
    z.object({
      exerciseId: z.string(),
      defaultSets: z.coerce.number().int().min(1), // use coerce for form data if needed
      defaultReps: z.coerce.number().int().min(1),
      startingWeight: z.coerce.number().optional().nullable(),
    })
  ).optional(),
});

// Define the input type based on the schema
export type CreateWorkoutPlanInput = z.infer<typeof workoutPlanSchema>;

// For Zod error flattening
interface FlattenedError {
  formErrors: string[];
  fieldErrors: { [key: string]: string[] | undefined };
}

export type WorkoutPlanWithExercises = WorkoutPlan & {
  exercises: (WorkoutPlanExercise & {
    exercise: Exercise;
  })[];
};

export interface CreateWorkoutPlanResponse {
  success: boolean;
  error?: string;
  details?: FlattenedError;
  workoutPlan?: WorkoutPlanWithExercises;
}

export async function createWorkoutPlanAction(
  planData: CreateWorkoutPlanInput // Changed from formData: FormData
): Promise<CreateWorkoutPlanResponse> {
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const validationResult = workoutPlanSchema.safeParse(planData);

  if (!validationResult.success) {
    return {
      success: false,
      error: "Invalid workout plan data",
      details: validationResult.error.flatten() as FlattenedError,
    };
  }

  const { name, exercises = [] } = validationResult.data;

  try {
    const workoutPlan = await prisma.$transaction(async (tx) => {
      const plan = await tx.workoutPlan.create({
        data: {
          name,
          userId: session.user!.id, // user.id is checked above
        },
      });

      if (exercises.length > 0) {
        await tx.workoutPlanExercise.createMany({
          data: exercises.map((exercise) => ({
            workoutPlanId: plan.id,
            exerciseId: exercise.exerciseId,
            defaultSets: exercise.defaultSets,
            defaultReps: exercise.defaultReps,
            startingWeight: exercise.startingWeight,
          })),
        });
      }
      // Fetch the created plan with exercises to return
      // Cast to WorkoutPlanWithExercises is safe due to includes
      return await tx.workoutPlan.findUnique({
        where: { id: plan.id },
        include: {
          exercises: {
            include: {
              exercise: true,
            },
          },
        },
      }) as WorkoutPlanWithExercises;
    });

    revalidatePath("/workout/plans"); // Or wherever plans are listed
    revalidatePath("/dashboard");

    return { success: true, workoutPlan };

  } catch (error) {
    console.error("Error creating workout plan:", error);
    return { success: false, error: "Failed to create workout plan" };
  }
}

// Input type for update action
export type UpdateWorkoutPlanInput = z.infer<typeof workoutPlanSchema>;

export interface UpdateWorkoutPlanResponse {
  success: boolean;
  error?: string;
  details?: FlattenedError;
  workoutPlan?: WorkoutPlanWithExercises;
}

export async function updateWorkoutPlanAction(
  planId: string,
  planData: UpdateWorkoutPlanInput
): Promise<UpdateWorkoutPlanResponse> {
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const validationResult = workoutPlanSchema.safeParse(planData);

  if (!validationResult.success) {
    return {
      success: false,
      error: "Invalid workout plan data",
      details: validationResult.error.flatten() as FlattenedError,
    };
  }

  const { name, exercises = [] } = validationResult.data;

  try {
    // Check if the workout plan exists and belongs to the user
    const existingPlan = await prisma.workoutPlan.findUnique({
      where: {
        id: planId,
        userId: session.user.id,
      },
      include: {
        exercises: true, // Include existing exercises to compare for updates/deletions
      },
    });

    if (!existingPlan) {
      return { success: false, error: "Workout plan not found or access denied" };
    }

    const updatedPlan = await prisma.$transaction(async (tx) => {
      // Update the plan name
      await tx.workoutPlan.update({
        where: { id: planId },
        data: { name },
      });

      // Get existing exercise IDs to determine which to delete/update/create
      const existingPlanExercises = existingPlan.exercises;
      const providedExercises = exercises;

      const exercisesToCreate = providedExercises.filter(
        (ex) => !existingPlanExercises.some(epe => epe.exerciseId === ex.exerciseId && epe.workoutPlanId === planId)
      );
      
      const exercisesToUpdate = providedExercises.filter(
        (ex) => existingPlanExercises.some(epe => epe.exerciseId === ex.exerciseId && epe.workoutPlanId === planId)
      );

      const exerciseIdsToDelete = existingPlanExercises
        .filter(epe => !providedExercises.some(ex => ex.exerciseId === epe.exerciseId))
        .map(epe => epe.id); // Assuming WorkoutPlanExercise has an `id` field for deletion by unique ID

      // Delete exercises no longer in the plan
      if (exerciseIdsToDelete.length > 0) {
        await tx.workoutPlanExercise.deleteMany({
          where: {
            id: { in: exerciseIdsToDelete },
            workoutPlanId: planId, // Ensure we only delete from this plan
          },
        });
      }

      // Update existing exercises (or upsert if some exerciseId might be new but matching an existing WorkoutPlanExercise record by a different logic - current logic is basic)
      for (const exercise of exercisesToUpdate) {
        const existing = existingPlanExercises.find(e => e.exerciseId === exercise.exerciseId);
        if (existing) {
            await tx.workoutPlanExercise.update({
              where: { id: existing.id }, // Assumes WorkoutPlanExercise has a unique `id`
              data: {
                defaultSets: exercise.defaultSets,
                defaultReps: exercise.defaultReps,
                startingWeight: exercise.startingWeight,
              },
            });
        }
      }
      
      // Create new exercises added to the plan
      if (exercisesToCreate.length > 0) {
        await tx.workoutPlanExercise.createMany({
          data: exercisesToCreate.map((exercise) => ({
            workoutPlanId: planId,
            exerciseId: exercise.exerciseId,
            defaultSets: exercise.defaultSets,
            defaultReps: exercise.defaultReps,
            startingWeight: exercise.startingWeight,
          })),
        });
      }

      // Return the updated plan with all its exercises
      return await tx.workoutPlan.findUnique({
        where: { id: planId },
        include: {
          exercises: {
            include: {
              exercise: true,
            },
          },
        },
      }) as WorkoutPlanWithExercises;
    });

    revalidatePath(`/workout/plans`);
    revalidatePath(`/workout/plans/${planId}`);
    revalidatePath("/dashboard");

    return { success: true, workoutPlan: updatedPlan };

  } catch (error) {
    console.error("Error updating workout plan:", error);
    return { success: false, error: "Failed to update workout plan" };
  }
}

export async function deleteWorkoutPlanAction(
  planId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Check if the workout plan exists and belongs to the user
    const existingPlan = await prisma.workoutPlan.findUnique({
      where: {
        id: planId,
        userId: session.user.id,
      },
    });

    if (!existingPlan) {
      return { success: false, error: "Workout plan not found or access denied" };
    }

    await prisma.workoutPlan.delete({
      where: { id: planId },
    });

    revalidatePath(`/workout/plans`);
    revalidatePath(`/workout/plans/${planId}`);
    revalidatePath("/dashboard");

    return { success: true };

  } catch (error) {
    console.error(`Error deleting workout plan ${planId}:`, error);
    // Consider more specific error messages if certain Prisma errors are common
    if (error instanceof PrismaClientKnownRequestError) {
        // P2025: Record to delete not found - already handled by the check above but good for defense
        // P2003: Foreign key constraint failed - e.g. if sessions are not cascade deleted (they are in your schema)
        if (error.code === 'P2003') {
             return { success: false, error: "Cannot delete plan. It might be in use by existing workout sessions." };
        }
    } else if (error instanceof Error) {
        return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to delete workout plan. Please try again." };
  }
}