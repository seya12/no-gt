"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Check, Minus, Plus, Timer, Play, Pause, CheckCircle2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"

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
  
  // New state for active exercise and set
  const [activeExerciseId, setActiveExerciseId] = useState<string | null>(null)
  const [activeSetId, setActiveSetId] = useState<string | null>(null)
  const [showCompletionDialog, setShowCompletionDialog] = useState(false)
  const [restTimer, setRestTimer] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [tempReps, setTempReps] = useState<number | null>(null)
  const [tempWeight, setTempWeight] = useState<number>(0)
  const [tempRestDuration, setTempRestDuration] = useState(90)
  
  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (isTimerRunning && restTimer > 0) {
      interval = setInterval(() => {
        setRestTimer((prev) => prev - 1)
      }, 1000)
    } else if (restTimer === 0) {
      setIsTimerRunning(false)
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isTimerRunning, restTimer])
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  const startRestTimer = (duration: number = tempRestDuration) => {
    setRestTimer(duration)
    setIsTimerRunning(true)
  }
  
  const toggleTimer = () => {
    setIsTimerRunning(!isTimerRunning)
  }
  
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
  
  const initiateSetCompletion = (exerciseId: string, setId: string) => {
    const set = sets[setId]
    setActiveExerciseId(exerciseId)
    setActiveSetId(setId)
    setTempReps(set.actualReps || set.targetReps)
    setTempWeight(set.weight)
    setShowCompletionDialog(true)
  }
  
  const completeSet = () => {
    if (!activeSetId) return
    
    updateSet(activeSetId, {
      completed: true,
      actualReps: tempReps,
      weight: tempWeight,
    })
    
    setShowCompletionDialog(false)
    startRestTimer()
  }
  
  const adjustTempWeight = (amount: number) => {
    setTempWeight(Math.max(0, tempWeight + amount))
  }
  
  return (
    <div className="space-y-8">
      {/* Rest Timer */}
      {restTimer > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Timer className="h-5 w-5 text-primary" />
                <span className="text-xl font-bold">{formatTime(restTimer)}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleTimer}
              >
                {isTimerRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
            </div>
            <Progress value={(restTimer / tempRestDuration) * 100} className="mt-2" />
          </CardContent>
        </Card>
      )}
      
      {exercises.map(exercise => {
        const isActive = exercise.exerciseId === activeExerciseId
        const completedSets = exercise.sets.filter(s => sets[s.id]?.completed).length
        const progress = (completedSets / exercise.sets.length) * 100
        
        return (
          <Card 
            key={exercise.exerciseId} 
            className={`overflow-hidden ${isActive ? 'ring-2 ring-primary' : ''}`}
          >
            <CardHeader className="bg-primary/5 py-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-medium">
                  {exercise.exerciseName}
                </CardTitle>
                <Badge variant="outline">
                  {completedSets}/{exercise.sets.length} Sets
                </Badge>
              </div>
              <Progress value={progress} className="mt-2" />
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
                      
                      <div className="col-span-8 flex items-center justify-center gap-4">
                        <div className="text-center">
                          <span className="text-xs text-muted-foreground block">Target</span>
                          <span className="font-medium">
                            {currentSet.targetReps} × {currentSet.weight}kg
                          </span>
                        </div>
                        {currentSet.completed && (
                          <div className="text-center">
                            <span className="text-xs text-muted-foreground block">Actual</span>
                            <span className="font-medium">
                              {currentSet.actualReps} × {currentSet.weight}kg
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="col-span-2 flex justify-center">
                        <Button
                          variant={currentSet.completed ? "secondary" : "default"}
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => initiateSetCompletion(exercise.exerciseId, set.id)}
                          disabled={currentSet.completed}
                        >
                          {currentSet.completed ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )
      })}
      
      {/* Set Completion Dialog */}
      <Dialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Set</DialogTitle>
            <DialogDescription>
              Confirm the number of reps and weight for this set.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Reps</label>
              <Input
                type="number"
                value={tempReps || ""}
                onChange={(e) => setTempReps(e.target.value ? Number(e.target.value) : null)}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Weight (kg)</label>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => adjustTempWeight(-2.5)}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-20 text-center font-medium">{tempWeight}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => adjustTempWeight(2.5)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Rest Timer (seconds)</label>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setTempRestDuration(Math.max(0, tempRestDuration - 15))}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  className="w-20 text-center"
                  value={tempRestDuration}
                  onChange={(e) => setTempRestDuration(Math.max(0, parseInt(e.target.value) || 0))}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setTempRestDuration(tempRestDuration + 15)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompletionDialog(false)}>
              Cancel
            </Button>
            <Button onClick={completeSet}>
              Complete Set
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 