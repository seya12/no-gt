import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/db"
import { authConfig } from "@/lib/auth/auth.config"
import { z } from "zod"

// Schema for validating set updates
const setUpdateSchema = z.object({
  actualReps: z.number().int().min(0).nullable().optional(),
  weight: z.number().min(0).optional(),
  completed: z.boolean().optional(),
  notes: z.string().optional().nullable(),
  nextWeightAdjustment: z.enum(["increase", "decrease", "keep"]).optional().nullable(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authConfig)
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  try {
    // Find the set and check if it belongs to the user
    const set = await prisma.set.findFirst({
      where: {
        id: params.id,
        workoutSession: {
          userId: session.user.id,
        },
      },
      include: {
        workoutSession: true,
      },
    })
    
    if (!set) {
      return NextResponse.json({ error: "Set not found" }, { status: 404 })
    }
    
    const body = await request.json()
    
    // Validate the input data
    const result = setUpdateSchema.safeParse(body)
    
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid data", details: result.error.format() },
        { status: 400 }
      )
    }
    
    // Update the set
    const updatedSet = await prisma.set.update({
      where: {
        id: params.id,
      },
      data: result.data,
    })
    
    return NextResponse.json(updatedSet)
  } catch (error) {
    console.error("Error updating set:", error)
    return NextResponse.json(
      { error: "Failed to update set" },
      { status: 500 }
    )
  }
} 