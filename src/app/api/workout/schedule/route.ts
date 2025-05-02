import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth/auth.config";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { planId, date } = body;

    if (!planId || !date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify that the plan exists and belongs to the user
    const plan = await prisma.workoutPlan.findUnique({
      where: {
        id: planId,
        userId: session.user.id,
      },
      include: {
        exercises: {
          include: {
            exercise: true,
          },
        },
      },
    });

    if (!plan) {
      return NextResponse.json({ error: "Workout plan not found" }, { status: 404 });
    }

    // Create a new workout session
    const workoutSession = await prisma.workoutSession.create({
      data: {
        date: new Date(date),
        userId: session.user.id,
        workoutPlanId: planId,
        scheduled: true, // Mark as scheduled
        sets: {
          create: plan.exercises.map((planExercise) => ({
            exerciseId: planExercise.exerciseId,
            targetReps: planExercise.defaultReps,
            weight: planExercise.startingWeight || 0,
            completed: false,
          })),
        },
      },
    });

    return NextResponse.json(workoutSession);
  } catch (error) {
    console.error("Error scheduling workout:", error);
    return NextResponse.json(
      { error: "Failed to schedule workout" },
      { status: 500 }
    );
  }
} 