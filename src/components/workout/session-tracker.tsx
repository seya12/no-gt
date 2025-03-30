"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Check, Minus, Plus, Timer, Play, Pause, CheckCircle2, ChevronDown, ChevronUp, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"

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
  sessionId: string
}

export function WorkoutSessionTracker({
  exercises,
  sessionId,
}: WorkoutSessionTrackerProps) {
  const router = useRouter()
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
  const [showProgressionDialog, setShowProgressionDialog] = useState(false)
  const [restTimer, setRestTimer] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [tempReps, setTempReps] = useState<number | null>(null)
  const [tempWeight, setTempWeight] = useState<number>(0)
  const [tempRestDuration, setTempRestDuration] = useState(90)
  const [minimizedExercises, setMinimizedExercises] = useState<Record<string, boolean>>({})
  const [progressionAmount, setProgressionAmount] = useState(2.5)
  const [shouldProgress, setShouldProgress] = useState(true)
  const [showWorkoutCompletionDialog, setShowWorkoutCompletionDialog] = useState(false)
  
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
  
  const parseRestDuration = (minutes: number, seconds: number) => {
    return Math.max(0, minutes * 60 + seconds)
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
  
  const toggleExerciseMinimized = (exerciseId: string) => {
    setMinimizedExercises(prev => ({
      ...prev,
      [exerciseId]: !prev[exerciseId]
    }))
  }

  const quitExercise = () => {
    setActiveExerciseId(null)
    setActiveSetId(null)
    setRestTimer(0)
    setIsTimerRunning(false)
  }

  const initiateSetCompletion = (exerciseId: string, setId: string) => {
    const set = sets[setId]
    const exercise = exercises.find(e => e.exerciseId === exerciseId)
    
    if (!exercise) return
    
    // Check if this is not the next uncompleted set
    const uncompletedSetIndex = exercise.sets.findIndex(s => !sets[s.id].completed)
    const currentSetIndex = exercise.sets.findIndex(s => s.id === setId)
    
    if (currentSetIndex !== uncompletedSetIndex) {
      return // Don't allow completing sets out of order
    }
    
    // If starting a new exercise, quit the current one
    if (activeExerciseId && activeExerciseId !== exerciseId) {
      quitExercise()
    }
    
    setActiveExerciseId(exerciseId)
    setActiveSetId(setId)
    setTempReps(set.actualReps || set.targetReps)
    setTempWeight(set.weight)
    setShowCompletionDialog(true)
  }

  const adjustTempReps = (amount: number) => {
    setTempReps(prev => Math.max(0, (prev || 0) + amount))
  }
  
  const adjustTempWeight = (amount: number) => {
    setTempWeight(Math.max(0, tempWeight + amount))
  }
  
  const completeSet = () => {
    if (!activeSetId || !activeExerciseId) return
    
    updateSet(activeSetId, {
      completed: true,
      actualReps: tempReps,
      weight: tempWeight,
    })
    
    // Check if this was the last set of the exercise
    const exercise = exercises.find(e => e.exerciseId === activeExerciseId)
    if (exercise) {
      const isLastSet = exercise.sets.every(s => 
        s.id === activeSetId || sets[s.id].completed
      )
      
      if (isLastSet) {
        setShowCompletionDialog(false)
        setShowProgressionDialog(true)
        return
      }
    }
    
    setShowCompletionDialog(false)
    startRestTimer()
  }

  const handleProgression = async () => {
    if (!activeSetId || !activeExerciseId) return
    
    // Find the exercise group
    const exerciseGroup = exercises.find(group => group.exerciseId === activeExerciseId)
    if (!exerciseGroup) {
      console.error("Exercise group not found for ID:", activeExerciseId)
      toast.error("Could not find exercise data")
      return
    }
    
    // Get all available exercise data for debugging
    const activeSet = sets[activeSetId]
    
    console.log("Active Set:", activeSet)
    console.log("Active Set ID:", activeSetId)
    console.log("Active Exercise ID from state:", activeExerciseId)
    console.log("Exercise Group:", exerciseGroup)
    console.log("Exercise Group ID:", exerciseGroup.exerciseId)
    console.log("API URL:", `/api/exercises/${exerciseGroup.exerciseId}/progression`)
    
    toast.info("Saving progression data...", { duration: 2000 })
    
    try {
      const response = await fetch(`/api/exercises/${exerciseGroup.exerciseId}/progression`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          shouldProgress,
          progressionAmount,
        }),
      })
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Progression error:", response.status, errorText);
        
        if (response.status === 404) {
          throw new Error("Exercise not found. It may have been deleted or you don't have access to it.");
        } else if (response.status === 401) {
          throw new Error("You're not authorized to update this exercise. Please log in again.");
        } else {
          throw new Error(`Failed to save progression: ${response.status} ${response.statusText}`);
        }
      }
      
      toast.success("Progression saved successfully!", { duration: 3000 })
    } catch (error) {
      console.error("Error updating progression:", error)
      toast.error(`Error: ${error instanceof Error ? error.message : "Failed to save progression"}`, { 
        duration: 5000,
        description: "You can dismiss this message and continue your workout."
      })
    }
    
    setShowProgressionDialog(false)
    quitExercise()

    // Check if this was the last exercise
    const allExercisesCompleted = exercises.every(exercise =>
      exercise.sets.every(set => sets[set.id].completed)
    )

    if (allExercisesCompleted) {
      setShowWorkoutCompletionDialog(true)
    }
  }

  const handleWorkoutCompletion = async () => {
    try {
      const response = await fetch(`/api/workout/session/${sessionId}/complete`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to complete workout")
      }

      setShowWorkoutCompletionDialog(false)
      router.push(`/workout/session/${sessionId}/complete`)
    } catch (error) {
      console.error("Error completing workout:", error)
      toast.error("Failed to complete workout. Please try again.")
    }
  }
  
  return (
    <div className="space-y-8 pb-20">
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
        const isMinimized = minimizedExercises[exercise.exerciseId]
        
        return (
          <Card 
            key={exercise.exerciseId} 
            className={`overflow-hidden ${isActive ? 'ring-2 ring-primary' : ''}`}
          >
            <CardHeader className="bg-primary/5 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => toggleExerciseMinimized(exercise.exerciseId)}
                  >
                    {isMinimized ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronUp className="h-4 w-4" />
                    )}
                  </Button>
                  <CardTitle className="text-lg font-medium">
                    {exercise.exerciseName}
                  </CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  {isActive && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={quitExercise}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Quit
                    </Button>
                  )}
                  <Badge variant="outline">
                    {completedSets}/{exercise.sets.length} Sets
                  </Badge>
                </div>
              </div>
              <Progress value={progress} className="mt-2" />
            </CardHeader>
            {!isMinimized && (
              <CardContent className="p-0">
                <div className="divide-y">
                  {exercise.sets.map((set, index) => {
                    const currentSet = sets[set.id]
                    if (!currentSet) return null
                    
                    const isNextSet = index === exercise.sets.findIndex(s => !sets[s.id].completed)
                    
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
                            disabled={Boolean(currentSet.completed || !isNextSet || (activeExerciseId && activeExerciseId !== exercise.exerciseId))}
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
            )}
          </Card>
        )
      })}
      
      {/* Set Completion Dialog */}
      {showCompletionDialog && (
        <Dialog 
          open={true}
          onOpenChange={(open) => {
            if (!open) setShowCompletionDialog(false)
          }}
        >
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
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => adjustTempReps(-1)}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    className="w-20 text-center"
                    value={tempReps?.toString() ?? ""}
                    onChange={(e) => setTempReps(e.target.value ? Number(e.target.value) : 0)}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => adjustTempReps(1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
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
                <label className="text-sm font-medium">Rest Timer</label>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      className="w-16 text-center"
                      value={Math.floor(tempRestDuration / 60)}
                      onChange={(e) => {
                        const mins = Math.max(0, parseInt(e.target.value) || 0)
                        const secs = tempRestDuration % 60
                        setTempRestDuration(parseRestDuration(mins, secs))
                      }}
                      min="0"
                      placeholder="0"
                    />
                    <span className="text-sm font-medium">min</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      className="w-16 text-center"
                      value={tempRestDuration % 60}
                      onChange={(e) => {
                        const mins = Math.floor(tempRestDuration / 60)
                        const secs = Math.max(0, parseInt(e.target.value) || 0) % 60
                        setTempRestDuration(parseRestDuration(mins, secs))
                      }}
                      min="0"
                      max="59"
                      placeholder="0"
                    />
                    <span className="text-sm font-medium">sec</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        const currentSeconds = tempRestDuration % 60
                        const newSeconds = Math.max(0, currentSeconds - 15)
                        const minutes = Math.floor(tempRestDuration / 60)
                        setTempRestDuration(parseRestDuration(minutes, newSeconds))
                      }}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        const currentSeconds = tempRestDuration % 60
                        const newSeconds = (currentSeconds + 15) % 60
                        const minutes = Math.floor(tempRestDuration / 60) + (currentSeconds + 15 >= 60 ? 1 : 0)
                        setTempRestDuration(parseRestDuration(minutes, newSeconds))
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
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
      )}

      {/* Exercise Progression Dialog */}
      {showProgressionDialog && (
        <Dialog 
          open={true}
          onOpenChange={(open) => {
            if (!open) setShowProgressionDialog(false)
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Exercise Completed</DialogTitle>
              <DialogDescription>
                Would you like to increase the weight for this exercise in your next workout?
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-6 py-4">
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant={shouldProgress ? "default" : "outline"}
                    onClick={() => setShouldProgress(true)}
                    className="w-full"
                  >
                    Yes, increase
                  </Button>
                  <Button
                    variant={!shouldProgress ? "default" : "outline"}
                    onClick={() => setShouldProgress(false)}
                    className="w-full"
                  >
                    Keep current
                  </Button>
                </div>

                {shouldProgress && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Increase by (kg)</label>
                      <div className="flex items-center justify-center gap-4">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setProgressionAmount(Math.max(0.5, progressionAmount - 0.5))}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-16 text-center text-lg font-medium">{progressionAmount}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setProgressionAmount(progressionAmount + 0.5)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <DialogFooter>
              <Button onClick={handleProgression} className="w-full">
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Workout Completion Dialog */}
      {showWorkoutCompletionDialog && (
        <Dialog 
          open={true}
          onOpenChange={(open) => {
            if (!open) setShowWorkoutCompletionDialog(false)
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Workout Complete! &nbsp;🎉</DialogTitle>
              <DialogDescription>
                Great job! You&apos;ve completed all exercises in this workout.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-6">
              <Button 
                onClick={handleWorkoutCompletion} 
                className="w-full"
                disabled={false}
              >
                Finish Workout
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
} 