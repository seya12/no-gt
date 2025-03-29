import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth/auth.config"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dumbbell, LayoutTemplate } from "lucide-react"
import Link from "next/link"

export default async function NewWorkoutPlanPage() {
  const session = await getServerSession(authConfig)
  
  if (!session?.user) {
    redirect("/api/auth/signin")
  }
  
  return (
    <div className="container p-4 md:py-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Create New Workout Plan</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Link href="/workout/plans/new/template">
          <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <LayoutTemplate className="w-8 h-8 mb-2" />
              <CardTitle>Use Template</CardTitle>
              <CardDescription>
                Start with a pre-built workout split like Push/Pull/Legs or Upper/Lower
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/workout/plans/new/custom">
          <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <Dumbbell className="w-8 h-8 mb-2" />
              <CardTitle>Create Custom Plan</CardTitle>
              <CardDescription>
                Start with an empty plan and build it from scratch with our exercise library
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  )
} 