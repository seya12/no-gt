import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth/auth.config"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { PlusCircle, Target, TrendingUp, Calendar, Zap } from "lucide-react"
import Link from "next/link"
import { WorkoutPlanList } from "@/components/workout/plan-list"

export default async function WorkoutPlansPage() {
  const session = await getServerSession(authConfig)
  
  if (!session) {
    redirect("/login")
  }
  
  const workoutPlans = await prisma.workoutPlan.findMany({
    where: {
      userId: session.user.id
    },
    orderBy: {
      name: 'asc'
    },
    include: {
      exercises: {
        include: {
          exercise: true
        }
      }
    }
  })

  // Calculate stats
  const totalExercises = workoutPlans.reduce((sum, plan) => sum + plan.exercises.length, 0)
  const avgExercisesPerPlan = workoutPlans.length > 0 ? Math.round(totalExercises / workoutPlans.length) : 0
  const plansWithExercises = workoutPlans.filter(plan => plan.exercises.length > 0).length

  return (
    <div className="container mx-auto p-4 pb-20 space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-background border border-green-500/20 p-6 md:p-8">
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center">
                <Target className="h-8 w-8 mr-3 text-green-500" />
                Workout Plans
              </h1>
              <p className="text-muted-foreground text-lg">
                Design and organize your perfect workout routines
              </p>
            </div>
            <Link href="/workout/plans/new">
              <Button size="lg" className="bg-green-500 hover:bg-green-600 shadow-lg">
                <PlusCircle className="mr-2 h-5 w-5" />
                Create Plan
              </Button>
            </Link>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl"></div>
      </div>

      {/* Main Content */}
      <Card className="shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center">
                <Target className="h-6 w-6 mr-2 text-primary" />
                Your Workout Plans
              </CardTitle>
              <CardDescription className="text-base mt-1">
                Create structured routines and track your progress over time
              </CardDescription>
            </div>
            {workoutPlans.length > 0 && (
              <Link href="/workout/plans/new" className="hidden sm:block">
                <Button variant="outline" className="hover:bg-primary hover:text-primary-foreground">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Plan
                </Button>
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {workoutPlans.length === 0 ? (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <div className="p-4 rounded-full bg-green-500/10 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <Target className="h-10 w-10 text-green-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Create Your First Workout Plan</h3>
                <p className="text-muted-foreground mb-6">
                  Design structured workout routines with your favorite exercises. 
                  Set target reps, sets, and weights to track your progress over time.
                </p>
                <div className="space-y-3">
                  <Link href="/workout/plans/new">
                    <Button size="lg" className="bg-green-500 hover:bg-green-600 w-full">
                      <PlusCircle className="mr-2 h-5 w-5" />
                      Create Custom Plan
                    </Button>
                  </Link>
                  <Link href="/workout/plans/new/template">
                    <Button size="lg" variant="outline" className="w-full hover:bg-primary hover:text-primary-foreground">
                      <Target className="mr-2 h-5 w-5" />
                      Use Template
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <WorkoutPlanList workoutPlans={workoutPlans} />
          )}
        </CardContent>
      </Card>

      {/* Stats Cards - Moved to bottom */}
      {workoutPlans.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-background">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <Target className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{workoutPlans.length}</p>
                  <p className="text-sm text-muted-foreground">Total Plans</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-background">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalExercises}</p>
                  <p className="text-sm text-muted-foreground">Total Exercises</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-background">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <Calendar className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{avgExercisesPerPlan}</p>
                  <p className="text-sm text-muted-foreground">Avg per Plan</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-background">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-orange-500/20">
                  <Zap className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{plansWithExercises}</p>
                  <p className="text-sm text-muted-foreground">Ready to Use</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
} 