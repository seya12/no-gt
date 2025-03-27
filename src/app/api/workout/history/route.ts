import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth/auth.config";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const workoutSessions = await prisma.workoutSession.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        workoutPlan: true,
        sets: {
          include: {
            exercise: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    return NextResponse.json(workoutSessions);
  } catch (error) {
    console.error("Error fetching workout history:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 