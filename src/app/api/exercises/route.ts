import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/db"
import { authConfig } from "@/lib/auth/auth.config"
import { z } from "zod"

// Schema for validating exercise creation
const exerciseSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().optional(),
})

// GET /api/exercises - Get all exercises for the current user
export async function GET() {
  const session = await getServerSession(authConfig)
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  try {
    const exercises = await prisma.exercise.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        name: 'asc',
      },
    })
    
    return NextResponse.json(exercises)
  } catch (error) {
    console.error("Error fetching exercises:", error)
    return NextResponse.json(
      { error: "Failed to fetch exercises" },
      { status: 500 }
    )
  }
}

// POST /api/exercises - Create a new exercise
export async function POST(request: NextRequest) {
  const session = await getServerSession(authConfig)
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  try {
    const json = await request.json()
    
    // Validate the input data
    const result = exerciseSchema.safeParse(json)
    
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid exercise data", details: result.error.format() },
        { status: 400 }
      )
    }
    
    const { name, description } = result.data
    
    // Create the exercise
    const exercise = await prisma.exercise.create({
      data: {
        name,
        description,
        userId: session.user.id,
      },
    })
    
    return NextResponse.json(exercise, { status: 201 })
  } catch (error) {
    console.error("Error creating exercise:", error)
    return NextResponse.json(
      { error: "Failed to create exercise" },
      { status: 500 }
    )
  }
} 