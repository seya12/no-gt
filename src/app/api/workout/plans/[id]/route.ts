import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/db"
import { authConfig } from "@/lib/auth/auth.config"
import { z } from "zod"

// Schema for validating workout plan updates
const workoutPlanSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  exercises: z.array(
    z.object({
      id: z.string().optional(), // Existing exercise ID if updating
      exerciseId: z.string(),
      defaultSets: z.number().int().min(1),
      defaultReps: z.number().int().min(1),
      startingWeight: z.number().optional().nullable(),
    })
  ).optional(),
})

// GET /api/workout/plans/[id] - Get a specific workout plan
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authConfig);
  const { id } = await params;

  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  try {
    const workoutPlan = await prisma.workoutPlan.findUnique({
      where: {
        id: id,
        userId: session.user.id,
      },
      include: {
        exercises: {
          include: {
            exercise: true,
          },
        },
      },
    })
    
    if (!workoutPlan) {
      return NextResponse.json({ error: "Workout plan not found" }, { status: 404 })
    }
    
    return NextResponse.json(workoutPlan)
  } catch (error) {
    console.error("Error fetching workout plan:", error)
    return NextResponse.json(
      { error: "Failed to fetch workout plan" },
      { status: 500 }
    )
  }
}

// PATCH /api/workout/plans/[id] - Update a specific workout plan
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authConfig)
  const { id } = await params;
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  try {
    // Check if the workout plan exists and belongs to the user
    const existingPlan = await prisma.workoutPlan.findUnique({
      where: {
        id: id,
        userId: session.user.id,
      },
      include: {
        exercises: true,
      },
    })
    
    if (!existingPlan) {
      return NextResponse.json({ error: "Workout plan not found" }, { status: 404 })
    }
    
    const json = await request.json()
    
    // Validate the input data
    const result = workoutPlanSchema.safeParse(json)
    
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid workout plan data", details: result.error.format() },
        { status: 400 }
      )
    }
    
    const { name, exercises = [] } = result.data
    
    // Update the workout plan with exercises in a transaction
    const updatedPlan = await prisma.$transaction(async (tx) => {
      // Update the plan name
      await tx.workoutPlan.update({
        where: { id: id },
        data: { name },
      })
      
      // Get existing exercise IDs
      const existingExerciseIds = existingPlan.exercises.map(e => e.id)
      
      // Prepare exercises to update or create
      const exercisesToUpsert = exercises.filter(e => e.id).map(e => ({
        id: e.id as string,
        workoutPlanId: id,
        exerciseId: e.exerciseId,
        defaultSets: e.defaultSets,
        defaultReps: e.defaultReps,
        startingWeight: e.startingWeight,
      }))
      
      // Prepare new exercises to create
      const exercisesToCreate = exercises
        .filter(e => !e.id)
        .map(e => ({
          workoutPlanId: id,
          exerciseId: e.exerciseId,
          defaultSets: e.defaultSets,
          defaultReps: e.defaultReps,
          startingWeight: e.startingWeight,
        }))
      
      // Find IDs to delete (existing IDs not in the update list)
      const idsToDelete = existingExerciseIds.filter(
        id => !exercises.some(e => e.id === id)
      )
      
      // Delete removed exercises
      if (idsToDelete.length > 0) {
        await tx.workoutPlanExercise.deleteMany({
          where: {
            id: { in: idsToDelete },
          },
        })
      }
      
      // Update existing exercises
      for (const exercise of exercisesToUpsert) {
        await tx.workoutPlanExercise.update({
          where: { id: exercise.id },
          data: {
            exerciseId: exercise.exerciseId,
            defaultSets: exercise.defaultSets,
            defaultReps: exercise.defaultReps,
            startingWeight: exercise.startingWeight,
          },
        })
      }
      
      // Create new exercises
      if (exercisesToCreate.length > 0) {
        await tx.workoutPlanExercise.createMany({
          data: exercisesToCreate,
        })
      }
      
      // Return the updated plan with exercises
      return tx.workoutPlan.findUnique({
        where: { id: id },
        include: {
          exercises: {
            include: {
              exercise: true,
            },
          },
        },
      })
    })
    
    return NextResponse.json(updatedPlan)
  } catch (error) {
    console.error("Error updating workout plan:", error)
    return NextResponse.json(
      { error: "Failed to update workout plan" },
      { status: 500 }
    )
  }
}

// DELETE /api/workout/plans/[id] - Delete a specific workout plan
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authConfig)
  const { id } = await params;
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  try {
    // Check if the workout plan exists and belongs to the user
    const existingPlan = await prisma.workoutPlan.findUnique({
      where: {
        id: id,
        userId: session.user.id,
      },
    })
    
    if (!existingPlan) {
      return NextResponse.json({ error: "Workout plan not found" }, { status: 404 })
    }
    
    // Delete the workout plan (cascades to WorkoutPlanExercise)
    await prisma.workoutPlan.delete({
      where: {
        id: id,
      },
    })
    
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("Error deleting workout plan:", error)
    return NextResponse.json(
      { error: "Failed to delete workout plan" },
      { status: 500 }
    )
  }
} 