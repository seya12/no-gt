"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Play, Dumbbell } from "lucide-react"
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

  const handleDelete = async () => {
    if (!planToDelete) return
    
    try {
      const response = await fetch(`/api/workout/plans/${planToDelete.id}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        // Refresh the page to show updated list
        router.refresh()
      } else {
        console.error('Failed to delete workout plan')
      }
    } catch (error) {
      console.error('Error deleting workout plan:', error)
    } finally {
      setOpen(false)
    }
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {workoutPlans.map((plan) => (
          <Card key={plan.id} className="flex flex-col">
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>
                {plan.exercises.length} exercises
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="space-y-2">
                {plan.exercises.slice(0, 3).map((planExercise) => (
                  <div key={planExercise.id} className="flex items-center">
                    <Dumbbell className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{planExercise.exercise.name}</span>
                    <div className="ml-auto flex space-x-1">
                      <Badge variant="outline" className="text-xs">
                        {planExercise.defaultSets}×{planExercise.defaultReps}
                      </Badge>
                    </div>
                  </div>
                ))}
                {plan.exercises.length > 3 && (
                  <p className="text-sm text-muted-foreground">
                    +{plan.exercises.length - 3} more exercises
                  </p>
                )}
                {plan.exercises.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No exercises added yet
                  </p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t p-4">
              <div className="flex space-x-2">
                <Link href={`/workout/plans/${plan.id}/edit`}>
                  <Button size="sm" variant="ghost">
                    <Edit className="mr-1 h-4 w-4" />
                    Edit
                  </Button>
                </Link>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => {
                    setPlanToDelete(plan)
                    setOpen(true)
                  }}
                >
                  <Trash2 className="mr-1 h-4 w-4" />
                  Delete
                </Button>
              </div>
              <Link href={`/workout/start?planId=${plan.id}`}>
                <Button size="sm">
                  <Play className="mr-1 h-4 w-4" />
                  Start
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the workout plan &quot;{planToDelete?.name}&quot;
              and all of its associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 