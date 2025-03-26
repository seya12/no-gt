import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth/auth.config"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { PlusCircle } from "lucide-react"
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

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Workout Plans</h1>
        <Link href="/workout/plans/new">
          <Button size="sm">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Plan
          </Button>
        </Link>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Your Workout Plans</CardTitle>
          <CardDescription>
            Create and manage your workout routines
          </CardDescription>
        </CardHeader>
        <CardContent>
          {workoutPlans.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground mb-4">You don&apos;t have any workout plans yet</p>
              <Link href="/workout/plans/new">
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create your first workout plan
                </Button>
              </Link>
            </div>
          ) : (
            <WorkoutPlanList workoutPlans={workoutPlans} />
          )}
        </CardContent>
      </Card>
    </div>
  )
} 