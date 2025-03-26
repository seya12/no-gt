import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import { PlusCircle, Dumbbell, Calendar, ListChecks } from "lucide-react"
import Link from "next/link"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authConfig } from "@/lib/auth/auth.config"

export default async function DashboardPage() {
  const session = await getServerSession(authConfig)
  
  if (!session) {
    redirect("/login")
  }
  
  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Link href="/workout/start">
          <Card className="h-full hover:bg-accent transition-colors">
            <CardContent className="p-4 flex flex-col items-center justify-center space-y-2">
              <Dumbbell className="h-8 w-8" />
              <span className="text-sm font-medium">Start Workout</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/workout/plans/new">
          <Card className="h-full hover:bg-accent transition-colors">
            <CardContent className="p-4 flex flex-col items-center justify-center space-y-2">
              <PlusCircle className="h-8 w-8" />
              <span className="text-sm font-medium">New Plan</span>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Workouts */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Workouts</CardTitle>
          <CardAction>
            <Link href="/workout/history">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Placeholder for recent workouts */}
            <div className="text-sm text-muted-foreground text-center py-4">
              No recent workouts
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Plans */}
      <Card>
        <CardHeader>
          <CardTitle>Active Plans</CardTitle>
          <CardAction>
            <Link href="/workout/plans">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Placeholder for active plans */}
            <div className="text-sm text-muted-foreground text-center py-4">
              No active plans
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Access */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Access</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <Link href="/exercises">
              <Button variant="outline" className="w-full justify-start">
                <ListChecks className="mr-2 h-4 w-4" />
                Exercises
              </Button>
            </Link>
            <Link href="/workout/calendar">
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="mr-2 h-4 w-4" />
                Calendar
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 