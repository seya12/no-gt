"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Trash2, Plus, ArrowLeft } from "lucide-react"
import { logWorkoutAction } from "@/app/actions/workoutSessionActions"
import Link from "next/link"

type WorkoutPlan = {
  id: string
  name: string
  exercises: Array<{
    id: string
    exerciseId: string
    defaultSets: number
    defaultReps: number
    startingWeight: number | null
    exercise: {
      name: string
    }
  }>
}

type FormSet = {
  exerciseId: string
  reps: number | ""
  weight: number | ""
}

type LoggedSet = {
  exerciseId: string
  reps: number
  weight: number
}

interface LogWorkoutFormProps {
  workoutPlan: WorkoutPlan
  date: string
}

export function LogWorkoutForm({ workoutPlan, date }: LogWorkoutFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  
  // Initialize sets based on workout plan defaults
  const [exerciseSets, setExerciseSets] = useState<Record<string, FormSet[]>>(() => {
    const initialSets: Record<string, FormSet[]> = {}
    
    workoutPlan.exercises.forEach(exercise => {
      initialSets[exercise.exerciseId] = Array.from({ length: exercise.defaultSets }, () => ({
        exerciseId: exercise.exerciseId,
        reps: exercise.defaultReps,
        weight: exercise.startingWeight || "",
      }))
    })
    
    return initialSets
  })

  const addSet = (exerciseId: string) => {
    setExerciseSets(prev => {
      const currentSets = prev[exerciseId] || []
      const lastSet = currentSets[currentSets.length - 1]
      
      return {
        ...prev,
        [exerciseId]: [
          ...currentSets,
          {
            exerciseId,
            reps: (typeof lastSet?.reps === 'number' ? lastSet.reps : 12),
            weight: (typeof lastSet?.weight === 'number' ? lastSet.weight : ""),
          }
        ]
      }
    })
  }

  const removeSet = (exerciseId: string, setIndex: number) => {
    setExerciseSets(prev => ({
      ...prev,
      [exerciseId]: prev[exerciseId].filter((_, index) => index !== setIndex)
    }))
  }

  const updateSet = (exerciseId: string, setIndex: number, field: 'reps' | 'weight', value: number | "") => {
    setExerciseSets(prev => ({
      ...prev,
      [exerciseId]: prev[exerciseId].map((set, index) => 
        index === setIndex ? { ...set, [field]: value } : set
      )
    }))
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    
    try {
      // Flatten all sets into a single array and convert to proper format
      const allFormSets = Object.values(exerciseSets).flat()
      
      if (allFormSets.length === 0) {
        toast.error("Please add at least one set to log the workout.")
        return
      }

      // Convert FormSet to LoggedSet, filtering out invalid entries
      const allSets: LoggedSet[] = allFormSets
        .filter(set => set.reps !== "" && set.weight !== "")
        .map(set => ({
          exerciseId: set.exerciseId,
          reps: typeof set.reps === 'number' ? set.reps : 0,
          weight: typeof set.weight === 'number' ? set.weight : 0,
        }))

      if (allSets.length === 0) {
        toast.error("Please enter valid reps and weight for at least one set.")
        return
      }

      const result = await logWorkoutAction({
        workoutPlanId: workoutPlan.id,
        date,
        sets: allSets,
      })

      if (result.success) {
        toast.success("Workout logged successfully!")
        router.push(`/workout/day/${date}`)
      } else {
        toast.error(result.error || "Failed to log workout")
      }
    } catch (error) {
      console.error("Error logging workout:", error)
      toast.error("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4 pb-24">
      <div className="flex items-center space-x-2">
        <Link href={`/workout/log?date=${date}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </Link>
      </div>

      {workoutPlan.exercises.map((exercise) => {
        const sets = exerciseSets[exercise.exerciseId] || []
        
        return (
          <Card key={exercise.exerciseId}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{exercise.exercise.name}</CardTitle>
                <Badge variant="outline">
                  {sets.length} {sets.length === 1 ? 'set' : 'sets'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {sets.map((set, setIndex) => (
                <div key={setIndex} className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                  <div className="font-medium text-sm min-w-[60px]">
                    Set {setIndex + 1}
                  </div>
                  
                  <div className="flex-1 space-y-2 sm:space-y-0 sm:flex sm:space-x-3">
                    <div className="flex-1">
                      <Label htmlFor={`reps-${exercise.exerciseId}-${setIndex}`} className="text-xs">
                        Reps
                      </Label>
                      <Input
                        id={`reps-${exercise.exerciseId}-${setIndex}`}
                        type="number"
                        value={set.reps}
                        onChange={(e) => updateSet(exercise.exerciseId, setIndex, 'reps', e.target.value === "" ? "" : parseInt(e.target.value) || 0)}
                        className="w-full"
                        min="0"
                      />
                    </div>
                    
                    <div className="flex-1">
                      <Label htmlFor={`weight-${exercise.exerciseId}-${setIndex}`} className="text-xs">
                        Weight (kg)
                      </Label>
                      <Input
                        id={`weight-${exercise.exerciseId}-${setIndex}`}
                        type="number"
                        value={set.weight}
                        onChange={(e) => updateSet(exercise.exerciseId, setIndex, 'weight', e.target.value === "" ? "" : parseFloat(e.target.value) || 0)}
                        className="w-full"
                        min="0"
                        step="0.5"
                      />
                    </div>
                  </div>
                  
                  {sets.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeSet(exercise.exerciseId, setIndex)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => addSet(exercise.exerciseId)}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Set
              </Button>
            </CardContent>
          </Card>
        )
      })}

      <div className="flex gap-3 pt-4">
        <Link href={`/workout/log?date=${date}`} className="flex-1">
          <Button variant="outline" className="w-full">
            Cancel
          </Button>
        </Link>
        <Button 
          onClick={handleSubmit} 
          disabled={isLoading}
          className="flex-1"
        >
          {isLoading ? "Logging..." : "Log Workout"}
        </Button>
      </div>
    </div>
  )
} 