import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth/auth.config"
import { redirect } from "next/navigation"
import { ExerciseForm } from "@/components/exercises/exercise-form"

export default async function NewExercisePage() {
  const session = await getServerSession(authConfig)
  
  if (!session) {
    redirect("/login")
  }

  return (
    <div className="container mx-auto p-4 pb-20 space-y-6">
      <h1 className="text-2xl font-bold">Create New Exercise</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Exercise Details</CardTitle>
          <CardDescription>
            Add a new exercise to your library
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ExerciseForm />
        </CardContent>
      </Card>
    </div>
  )
} 