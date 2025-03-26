"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Check, Minus, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface Set {
  id: string
  exerciseId: string
  targetReps: number
  actualReps: number | null
  weight: number
  completed: boolean
  exercise: {
    name: string
  }
}

interface ExerciseGroup {
  exerciseId: string
  exerciseName: string
  sets: Set[]
}

interface WorkoutSessionTrackerProps {
  exercises: ExerciseGroup[]
}

export function WorkoutSessionTracker({
  exercises,
}: WorkoutSessionTrackerProps) {
  const [sets, setSets] = useState<Record<string, Set>>(() => {
    // Initialize state from props
    const initialSets: Record<string, Set> = {}
    exercises.forEach(exercise => {
      exercise.sets.forEach(set => {
        initialSets[set.id] = set
      })
    })
    return initialSets
  })
  
  const updateSet = async (setId: string, updates: Partial<Set>) => {
    const updatedSet = { ...sets[setId], ...updates }
    
    try {
      const response = await fetch(`/api/workout/sets/${setId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      })
      
      if (!response.ok) {
        throw new Error("Failed to update set")
      }
      
      // Update local state
      setSets(prevSets => ({
        ...prevSets,
        [setId]: updatedSet,
      }))
    } catch (error) {
      console.error("Error updating set:", error)
    }
  }
  
  const toggleSetCompletion = (setId: string) => {
    const set = sets[setId]
    updateSet(setId, { 
      completed: !set.completed,
      // If completing and no actual reps recorded, use target reps
      ...((!set.completed && set.actualReps === null) && { actualReps: set.targetReps }),
    })
  }
  
  const adjustWeight = (setId: string, amount: number) => {
    const set = sets[setId]
    // Prevent negative weights
    const newWeight = Math.max(0, set.weight + amount)
    updateSet(setId, { weight: newWeight })
  }
  
  const handleRepsChange = (setId: string, value: string) => {
    const reps = value === "" ? null : parseInt(value)
    updateSet(setId, { actualReps: reps })
  }
  
  return (
    <div className="space-y-8">
      {exercises.map(exercise => (
        <Card key={exercise.exerciseId} className="overflow-hidden">
          <CardHeader className="bg-primary/5 py-4">
            <CardTitle className="text-lg font-medium">{exercise.exerciseName}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {exercise.sets.map((set, index) => {
                const currentSet = sets[set.id]
                if (!currentSet) return null
                
                return (
                  <div 
                    key={set.id} 
                    className={`grid grid-cols-12 gap-2 items-center p-4 ${
                      currentSet.completed ? "bg-primary/5" : ""
                    }`}
                  >
                    <div className="col-span-2 flex justify-center">
                      <Badge variant="outline">Set {index + 1}</Badge>
                    </div>
                    
                    <div className="col-span-3 flex flex-col items-center">
                      <span className="text-xs text-muted-foreground mb-1">Reps</span>
                      <Input
                        type="number"
                        min="0"
                        className="h-8 text-center"
                        value={currentSet.actualReps === null ? "" : currentSet.actualReps}
                        onChange={(e) => handleRepsChange(set.id, e.target.value)}
                        placeholder={currentSet.targetReps.toString()}
                        disabled={currentSet.completed}
                      />
                    </div>
                    
                    <div className="col-span-5 flex flex-col items-center">
                      <span className="text-xs text-muted-foreground mb-1">Weight</span>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => adjustWeight(set.id, -2.5)}
                          disabled={currentSet.completed || currentSet.weight <= 0}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-12 text-center font-medium">
                          {currentSet.weight}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => adjustWeight(set.id, 2.5)}
                          disabled={currentSet.completed}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="col-span-2 flex justify-center">
                      <Button
                        variant={currentSet.completed ? "secondary" : "outline"}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => toggleSetCompletion(set.id)}
                      >
                        <Check className={`h-4 w-4 ${currentSet.completed ? "text-primary" : ""}`} />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
} 