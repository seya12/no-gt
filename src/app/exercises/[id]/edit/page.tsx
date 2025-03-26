import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth/auth.config"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { ExerciseForm } from "@/components/exercises/exercise-form"
import { notFound } from "next/navigation"

export default async function EditExercisePage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authConfig)
  
  if (!session) {
    redirect("/login")
  }
  
  // Fetch the exercise by ID
  const exercise = await prisma.exercise.findUnique({
    where: {
      id: params.id,
      userId: session.user.id,
    },
  })
  
  // If the exercise doesn't exist or doesn't belong to the user, return 404
  if (!exercise) {
    notFound()
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">Edit Exercise</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Exercise Details</CardTitle>
          <CardDescription>
            Update your exercise information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ExerciseForm exercise={exercise} />
        </CardContent>
      </Card>
    </div>
  )
} 