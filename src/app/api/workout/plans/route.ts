import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/db"
import { authConfig } from "@/lib/auth/auth.config"
import { z } from "zod"

// Schema for validating workout plan creation
const workoutPlanSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  exercises: z.array(
    z.object({
      exerciseId: z.string(),
      defaultSets: z.number().int().min(1),
      defaultReps: z.number().int().min(1),
      startingWeight: z.number().optional().nullable(),
    })
  ).optional(),
})

// GET /api/workout/plans - Get all workout plans for the current user
export async function GET() {
  const session = await getServerSession(authConfig)
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  try {
    const workoutPlans = await prisma.workoutPlan.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        exercises: {
          include: {
            exercise: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })
    
    return NextResponse.json(workoutPlans)
  } catch (error) {
    console.error("Error fetching workout plans:", error)
    return NextResponse.json(
      { error: "Failed to fetch workout plans" },
      { status: 500 }
    )
  }
}

// POST /api/workout/plans - Create a new workout plan
export async function POST(request: NextRequest) {
  const session = await getServerSession(authConfig)
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  try {
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
    
    // Create the workout plan with exercises in a transaction
    const workoutPlan = await prisma.$transaction(async (tx) => {
      // Create the workout plan
      const plan = await tx.workoutPlan.create({
        data: {
          name,
          userId: session.user.id,
        },
      })
      
      // Add exercises to the plan
      if (exercises.length > 0) {
        await tx.workoutPlanExercise.createMany({
          data: exercises.map((exercise) => ({
            workoutPlanId: plan.id,
            exerciseId: exercise.exerciseId,
            defaultSets: exercise.defaultSets,
            defaultReps: exercise.defaultReps,
            startingWeight: exercise.startingWeight,
          })),
        })
      }
      
      // Return the created plan with exercises
      return tx.workoutPlan.findUnique({
        where: { id: plan.id },
        include: {
          exercises: {
            include: {
              exercise: true,
            },
          },
        },
      })
    })
    
    return NextResponse.json(workoutPlan, { status: 201 })
  } catch (error) {
    console.error("Error creating workout plan:", error)
    return NextResponse.json(
      { error: "Failed to create workout plan" },
      { status: 500 }
    )
  }
} 