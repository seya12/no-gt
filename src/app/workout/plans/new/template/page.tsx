import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth/auth.config"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Plus } from "lucide-react"
import Link from "next/link"
import { WORKOUT_TEMPLATES } from "@/lib/constants/exercises"

export default async function NewWorkoutPlanTemplatePage() {
  const session = await getServerSession(authConfig)
  
  if (!session?.user) {
    redirect("/api/auth/signin")
  }
  
  return (
    <div className="container p-4 md:py-6 pb-20 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/workout/plans/new">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Choose a Template</h1>
      </div>

      <div className="grid gap-6">
        {Object.entries(WORKOUT_TEMPLATES).map(([template, splits]) => (
          <Card key={template}>
            <CardHeader>
              <CardTitle>{template}</CardTitle>
              <CardDescription>
                {template === "Push/Pull/Legs" 
                  ? "A 3-day split focusing on pushing movements, pulling movements, and leg exercises"
                  : "A 2-day split alternating between upper body and lower body exercises"}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {Object.entries(splits).map(([split, exercises]) => (
                <div 
                  key={split}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div>
                    <h3 className="font-medium">{split}</h3>
                    <p className="text-sm text-muted-foreground">
                      {exercises.join(", ")}
                    </p>
                  </div>
                  <Link href={`/workout/plans/new/template/create?type=${template}&split=${split}`}>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Use This Split
                    </Button>
                  </Link>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
} 