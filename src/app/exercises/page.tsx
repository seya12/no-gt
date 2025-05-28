import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth/auth.config"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { PlusCircle, Dumbbell, Target, TrendingUp } from "lucide-react"
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
    <div className="container mx-auto p-4 pb-20 space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-background border border-blue-500/20 p-6 md:p-8">
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center">
                <Dumbbell className="h-8 w-8 mr-3 text-blue-500" />
                Exercise Library
              </h1>
              <p className="text-muted-foreground text-lg">
                Build and manage your personal exercise collection
              </p>
            </div>
            <Link href="/exercises/new">
              <Button size="lg" className="bg-blue-500 hover:bg-blue-600 shadow-lg">
                <PlusCircle className="mr-2 h-5 w-5" />
                Add Exercise
              </Button>
            </Link>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl"></div>
      </div>

      {/* Stats Cards */}
      {exercises.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-background">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <Target className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{exercises.length}</p>
                  <p className="text-sm text-muted-foreground">Total Exercises</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-background">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{exercises.filter(e => e.description).length}</p>
                  <p className="text-sm text-muted-foreground">With Descriptions</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-background">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <Dumbbell className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">Ready</p>
                  <p className="text-sm text-muted-foreground">For Workouts</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Main Content */}
      <Card className="shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center">
                <Target className="h-6 w-6 mr-2 text-primary" />
                Your Exercises
              </CardTitle>
              <CardDescription className="text-base mt-1">
                Manage your exercise library and track your movements
              </CardDescription>
            </div>
            {exercises.length > 0 && (
              <Link href="/exercises/new" className="hidden sm:block">
                <Button variant="outline" className="hover:bg-primary hover:text-primary-foreground">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Exercise
                </Button>
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {exercises.length === 0 ? (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <div className="p-4 rounded-full bg-blue-500/10 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <Dumbbell className="h-10 w-10 text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Build Your Exercise Library</h3>
                <p className="text-muted-foreground mb-6">
                  Start by adding exercises you want to track. You can include descriptions, 
                  target muscle groups, and any notes to help you remember proper form.
                </p>
                <Link href="/exercises/new">
                  <Button size="lg" className="bg-blue-500 hover:bg-blue-600">
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Create Your First Exercise
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <ExerciseList exercises={exercises} />
          )}
        </CardContent>
      </Card>
    </div>
  )
} 