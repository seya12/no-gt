"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Play, Dumbbell, Loader2, Target, Calendar } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { deleteWorkoutPlanAction } from "@/app/actions/workoutPlanActions"
import { toast } from "sonner"

type WorkoutPlanWithExercises = {
  id: string
  name: string
  createdAt: Date
  updatedAt: Date
  userId: string
  exercises: {
    id: string
    exerciseId: string
    workoutPlanId: string
    defaultSets: number
    defaultReps: number
    startingWeight: number | null
    exercise: {
      id: string
      name: string
      description: string | null
      createdAt: Date
      updatedAt: Date
      userId: string
    }
  }[]
}

type WorkoutPlanListProps = {
  workoutPlans: WorkoutPlanWithExercises[]
}

export function WorkoutPlanList({ workoutPlans }: WorkoutPlanListProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [planToDelete, setPlanToDelete] = useState<WorkoutPlanWithExercises | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleDelete = async () => {
    if (!planToDelete) return
    
    startTransition(async () => {
      const result: { success: boolean; error?: string } = await deleteWorkoutPlanAction(planToDelete.id)

      if (result.success) {
        toast.success(`Workout plan "${planToDelete.name}" deleted.`)
        router.refresh()
      } else {
        toast.error(result.error || "Failed to delete workout plan.")
      }
      setOpen(false)
      setPlanToDelete(null)
    })
  }

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {workoutPlans.map((plan) => (
          <Card key={plan.id} className="group hover:shadow-xl transition-all duration-300 border-border hover:border-primary/30 bg-gradient-to-br from-background to-accent/5">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="p-2.5 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Target className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-xl truncate group-hover:text-primary transition-colors">
                      {plan.name}
                    </CardTitle>
                    <CardDescription className="flex items-center mt-1">
                      <Dumbbell className="h-4 w-4 mr-1" />
                      {plan.exercises.length} exercise{plan.exercises.length !== 1 ? 's' : ''}
                    </CardDescription>
                  </div>
                </div>
                
                {/* Quick Actions */}
                <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link href={`/workout/plans/${plan.id}/edit`}>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-primary/10">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      setPlanToDelete(plan)
                      setOpen(true)
                    }}
                    disabled={isPending}
                  >
                    {isPending && planToDelete?.id === plan.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="flex-grow pb-4">
              {plan.exercises.length > 0 ? (
                <div className="space-y-3">
                  {plan.exercises.slice(0, 4).map((planExercise) => (
                    <div key={planExercise.id} className="flex items-center justify-between p-2.5 rounded-lg bg-accent/20 hover:bg-accent/30 transition-colors">
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <div className="p-1.5 rounded bg-primary/10">
                          <Dumbbell className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <span className="text-sm font-medium truncate">{planExercise.exercise.name}</span>
                      </div>
                      <div className="flex space-x-1 flex-shrink-0">
                        <Badge variant="outline" className="text-xs bg-background/50">
                          {planExercise.defaultSets}×{planExercise.defaultReps}
                        </Badge>
                        {planExercise.startingWeight && (
                          <Badge variant="outline" className="text-xs bg-background/50">
                            {planExercise.startingWeight}kg
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  {plan.exercises.length > 4 && (
                    <div className="text-center">
                      <Badge variant="secondary" className="text-xs">
                        +{plan.exercises.length - 4} more exercises
                      </Badge>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="p-3 rounded-full bg-muted/50 w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                    <Target className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">No exercises added yet</p>
                  <Link href={`/workout/plans/${plan.id}/edit`}>
                    <Button size="sm" variant="outline" className="mt-2 text-xs">
                      Add Exercises
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
            
            <CardFooter className="flex items-center justify-between border-t bg-accent/5 p-4">
              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Created {new Date(plan.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Link href={`/workout/plans/${plan.id}/edit`}>
                  <Button size="sm" variant="outline" className="hover:bg-primary hover:text-primary-foreground">
                    <Edit className="mr-1 h-3.5 w-3.5" />
                    Edit
                  </Button>
                </Link>
                <Link href={`/workout/session/new?planId=${plan.id}`}>
                  <Button size="sm" className="bg-primary hover:bg-primary/90 shadow-sm">
                    <Play className="mr-1 h-3.5 w-3.5" />
                    Start
                  </Button>
                </Link>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workout Plan</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{planToDelete?.name}&quot;? 
              This will permanently remove the workout plan and all of its exercises. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90" 
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Plan"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 