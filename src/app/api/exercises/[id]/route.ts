import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/db"
import { authConfig } from "@/lib/auth/auth.config"
import { z } from "zod"

// Schema for validating exercise updates
const exerciseSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().optional(),
})

// GET /api/exercises/[id] - Get a specific exercise
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authConfig)
  const { id } = await params
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  try {
    const exercise = await prisma.exercise.findUnique({
      where: {
        id: id,
        userId: session.user.id,
      },
    })
    
    if (!exercise) {
      return NextResponse.json({ error: "Exercise not found" }, { status: 404 })
    }
    
    return NextResponse.json(exercise)
  } catch (error) {
    console.error("Error fetching exercise:", error)
    return NextResponse.json(
      { error: "Failed to fetch exercise" },
      { status: 500 }
    )
  }
}

// PATCH /api/exercises/[id] - Update a specific exercise
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authConfig)
  const { id } = await params
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  try {
    // Check if the exercise exists and belongs to the user
    const existingExercise = await prisma.exercise.findUnique({
      where: {
        id: id,
        userId: session.user.id,
      },
    })
    
    if (!existingExercise) {
      return NextResponse.json({ error: "Exercise not found" }, { status: 404 })
    }
    
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
    
    // Update the exercise
    const updatedExercise = await prisma.exercise.update({
      where: {
        id: id,
      },
      data: {
        name,
        description,
      },
    })
    
    return NextResponse.json(updatedExercise)
  } catch (error) {
    console.error("Error updating exercise:", error)
    return NextResponse.json(
      { error: "Failed to update exercise" },
      { status: 500 }
    )
  }
}

// DELETE /api/exercises/[id] - Delete a specific exercise
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authConfig)
  const { id } = await params
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  try {
    // Check if the exercise exists and belongs to the user
    const existingExercise = await prisma.exercise.findUnique({
      where: {
        id: id,
        userId: session.user.id,
      },
    })
    
    if (!existingExercise) {
      return NextResponse.json({ error: "Exercise not found" }, { status: 404 })
    }
    
    // Delete the exercise
    await prisma.exercise.delete({
      where: {
        id: id,
      },
    })
    
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("Error deleting exercise:", error)
    return NextResponse.json(
      { error: "Failed to delete exercise" },
      { status: 500 }
    )
  }
} 