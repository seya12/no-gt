import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth/auth.config";
import { prisma } from "@/lib/db";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;

    // Verify the session belongs to the user
    const workoutSession = await prisma.workoutSession.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!workoutSession) {
      return new NextResponse("Not found or not authorized", { status: 404 });
    }

    // Delete the workout session
    await prisma.workoutSession.delete({
      where: {
        id,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting workout session:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 