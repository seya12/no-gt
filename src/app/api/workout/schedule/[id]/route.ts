import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth/auth.config";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workoutId = params.id;

    // Verify the workout belongs to the user and is scheduled
    const workout = await prisma.workoutSession.findFirst({
      where: {
        id: workoutId,
        userId: session.user.id,
        scheduled: true,
      },
    });

    if (!workout) {
      return NextResponse.json(
        { error: "Workout not found or not scheduled" },
        { status: 404 }
      );
    }

    // Delete the workout session and its sets
    await prisma.workoutSession.delete({
      where: {
        id: workoutId,
      },
    });

    // Revalidate relevant paths
    revalidatePath("/dashboard");
    revalidatePath("/workout/calendar");
    revalidatePath(`/workout/day/${workout.date.toISOString().split('T')[0]}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error canceling workout:", error);
    return NextResponse.json(
      { error: "Failed to cancel workout" },
      { status: 500 }
    );
  }
} 