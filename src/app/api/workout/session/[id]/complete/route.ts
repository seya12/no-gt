import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/db"
import { authConfig } from "@/lib/auth/auth.config"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authConfig)
    const { id } = await params

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const workoutSession = await prisma.workoutSession.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        sets: true,
      },
    })

    if (!workoutSession) {
      return new NextResponse("Not found", { status: 404 })
    }

    // Check if all sets are completed
    const allSetsCompleted = workoutSession.sets.every(set => set.completed)
    if (!allSetsCompleted) {
      return new NextResponse("Not all sets are completed", { status: 400 })
    }

    // Update the workout session
    const updatedSession = await prisma.workoutSession.update({
      where: {
        id,
      },
      data: {
        completedAt: new Date(),
      },
    })

    return NextResponse.json(updatedSession)
  } catch (error) {
    console.error("[WORKOUT_SESSION_COMPLETE]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
} 