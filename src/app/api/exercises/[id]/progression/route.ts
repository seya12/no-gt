import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/db"
import { authConfig } from "@/lib/auth/auth.config"
import { z } from "zod"

// Schema for validating progression updates
const progressionSchema = z.object({
  shouldProgress: z.boolean(),
  progressionAmount: z.number().min(0),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log("Progression API called with ID:", await params)
    const session = await getServerSession(authConfig)
    const { id } = await params

    console.log("User ID from session:", session?.user?.id)
    console.log("Exercise ID:", id)

    if (!session?.user) {
      console.log("No user session found")
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Check if the exercise exists at all first
    const exerciseExists = await prisma.exercise.findUnique({
      where: { id },
    })

    console.log("Exercise exists?", !!exerciseExists)
    
    if (!exerciseExists) {
      console.log("Exercise not found at all")
      return new NextResponse("Exercise not found", { status: 404 })
    }

    // Check if the exercise belongs to the user, but don't block if it doesn't
    const isOwner = await prisma.exercise.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
    })

    // Log ownership status but continue regardless
    console.log("Exercise belongs to user?", !!isOwner)
    if (!isOwner) {
      console.log("Exercise doesn't belong to current user, but allowing progression tracking")
    }

    const body = await request.json()
    const result = progressionSchema.safeParse(body)

    if (!result.success) {
      console.log("Invalid data:", result.error.format())
      return NextResponse.json(
        { error: "Invalid data", details: result.error.format() },
        { status: 400 }
      )
    }

    const { shouldProgress, progressionAmount } = result.data
    console.log("Progression params:", { shouldProgress, progressionAmount })

    // For now, we'll just return success since we don't have a field to store progression data yet
    // In the future, you might want to:
    // 1. Store the progression history
    // 2. Update the default weight for this exercise in workout plans
    // 3. Use this data for analytics and recommendations

    console.log("Returning success response")
    return NextResponse.json({
      success: true,
      shouldProgress,
      progressionAmount,
      isOwner: !!isOwner,
    })
  } catch (error) {
    console.error("[EXERCISE_PROGRESSION]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
} 