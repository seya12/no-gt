import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth/auth.config"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { PlusCircle } from "lucide-react"
import Link from "next/link"
import { ExerciseList } from "@/components/exercises/exercise-list"

export default async function ExercisesPage() {
  const session = await getServerSession(authConfig)
  
  if (!session) {
    redirect("/login")
  }
  
  const exercises = await prisma.exercise.findMany({
    where: {
      userId: session.user.id
    },
    orderBy: {
      name: 'asc'
    }
  })

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Exercises</h1>
        <Link href="/exercises/new">
          <Button size="sm">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Exercise
          </Button>
        </Link>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Your Exercises</CardTitle>
          <CardDescription>
            Manage your exercise library
          </CardDescription>
        </CardHeader>
        <CardContent>
          {exercises.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground mb-4">You don't have any exercises yet</p>
              <Link href="/exercises/new">
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create your first exercise
                </Button>
              </Link>
            </div>
          ) : (
            <ExerciseList exercises={exercises} />
          )}
        </CardContent>
      </Card>
    </div>
  )
} 