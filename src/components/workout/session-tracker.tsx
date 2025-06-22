"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { logExerciseProgressionAction } from "@/app/actions/exerciseActions"
import type { Set } from "@prisma/client"
import { completeWorkoutSessionAction, removeExerciseFromSessionAction } from "@/app/actions/workoutSessionActions"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { SetCompletionDialog } from "./set-completion-dialog"
import { ExerciseProgressionDialog } from "./exercise-progression-dialog"
import { WorkoutCompletionDialog } from "./workout-completion-dialog"
import { WorkoutProgressCard } from "./workout-progress-card"
import { ExerciseTrackerCard } from "./exercise-tracker-card"
import { RestTimerDisplay } from "./rest-timer-display"
import { updateWorkoutSetAction, UpdateWorkoutSetResponse } from "@/app/actions/workoutSetActions"
import { AddExerciseDialog } from "./add-exercise-dialog"

interface ExerciseGroup {
  exerciseId: string
  exerciseName: string
  sets: Set[]
}

type AvailableExercise = {
  id: string
  name: string
  userId: string
  description: string | null
  createdAt: Date
  updatedAt: Date
}

interface WorkoutSessionTrackerProps {
  exercises: ExerciseGroup[]
  sessionId: string
  availableExercises: AvailableExercise[]
}

export function WorkoutSessionTracker({
  exercises,
  sessionId,
  availableExercises,
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
  const [tempWeight, setTempWeight] = useState<number | null>(0)
  const tempRestDuration = 90
  const [minimizedExercises, setMinimizedExercises] = useState<Record<string, boolean>>({})
  const [progressionAmount, setProgressionAmount] = useState(2.5)
  const [shouldProgress, setShouldProgress] = useState(true)
  const [showWorkoutCompletionDialog, setShowWorkoutCompletionDialog] = useState(false)
  const [isSavingProgression, setIsSavingProgression] = useState(false)
  const [isCompletingWorkout, setIsCompletingWorkout] = useState(false)
  const [showAddExerciseDialog, setShowAddExerciseDialog] = useState(false)
  const [currentExercises, setCurrentExercises] = useState<ExerciseGroup[]>(exercises)
  
  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (isTimerRunning && restTimer > 0) {
      interval = setInterval(() => {
        setRestTimer((prev) => prev - 1)
      }, 1000)
    } else if (restTimer === 0 && isTimerRunning) {
      setIsTimerRunning(false)
      toast.info("Rest timer finished!")
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
  
  const addTimeToTimer = (seconds: number) => {
    setRestTimer(prev => prev + seconds)
  }
  
  const updateSet = async (setId: string, updates: Partial<Set>) => {
    const originalSet = sets[setId]
    const updatedSetState = { ...originalSet, ...updates }
    setSets(prevSets => ({
      ...prevSets,
      [setId]: updatedSetState,
    }))

    try {
      const result: UpdateWorkoutSetResponse = await updateWorkoutSetAction(setId, updates)
      
      if (!result.success) {
        let errorMsg = result.error || "Failed to update set on server"
        if (result.details?.formErrors?.length) errorMsg = result.details.formErrors.join("; ")
        if (result.details?.fieldErrors) {
          Object.entries(result.details.fieldErrors).forEach(([field, errors]) => {
            if (errors) errorMsg += ` ${field}: ${errors.join(", ")}`
          })
        }
        toast.error(errorMsg)
        setSets(prevSets => ({ ...prevSets, [setId]: originalSet }))
        return
      }

    } catch (error) {
      console.error("Error calling updateWorkoutSetAction:", error)
      toast.error("An unexpected error occurred while updating the set.")
      setSets(prevSets => ({ ...prevSets, [setId]: originalSet }))
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
    const exercise = currentExercises.find(e => e.exerciseId === exerciseId)
    
    if (!set || !exercise) return
    
    const uncompletedSetIndex = exercise.sets.findIndex(s => !sets[s.id]?.completed)
    const currentSetIndex = exercise.sets.findIndex(s => s.id === setId)
    
    if (currentSetIndex !== uncompletedSetIndex && uncompletedSetIndex !== -1) {
      toast.info("Please complete sets in order.")
      return
    }
    
    if (activeExerciseId && activeExerciseId !== exerciseId) quitExercise()
    
    setActiveExerciseId(exerciseId)
    setActiveSetId(setId)
    setTempReps(set.actualReps ?? set.targetReps ?? 0)
    setTempWeight(set.weight ?? 0)
    setShowCompletionDialog(true)
  }

  const adjustTempReps = (amount: number) => {
    setTempReps(prev => Math.max(0, (prev || 0) + amount))
  }
  
  const adjustTempWeight = (amount: number) => {
    setTempWeight(prev => Math.max(0, (prev || 0) + amount))
  }
  
  const completeSet = () => {
    if (!activeSetId || !activeExerciseId) return
    
    updateSet(activeSetId, {
      completed: true,
      actualReps: tempReps,
      weight: tempWeight ?? 0,
    })
    
    const exercise = currentExercises.find(e => e.exerciseId === activeExerciseId)
    if (exercise) {
      const allSetsInExerciseCompleted = exercise.sets.every(s => 
        s.id === activeSetId || sets[s.id]?.completed
      )
      
      if (allSetsInExerciseCompleted) {
        setShowCompletionDialog(false)
        setShowProgressionDialog(true)
        return
      }
    }
    
    setShowCompletionDialog(false)
    startRestTimer()
  }

  const handleProgression = async () => {
    if (!activeExerciseId) {
      toast.error("No active exercise to log progression for.")
      return
    }

    setIsSavingProgression(true)
    toast.info("Saving progression data...", { duration: 2000 })

    const formData = new FormData()
    formData.append("exerciseId", activeExerciseId)
    formData.append("shouldProgress", shouldProgress.toString())
    formData.append("progressionAmount", progressionAmount.toString())

    try {
      const result = await logExerciseProgressionAction(undefined, formData)

      if (result.success) {
        toast.success("Progression saved successfully!", { duration: 3000 })
      } else {
        let errorMsg = result.error || "Failed to save progression."
        if (result.details?.formErrors?.length) errorMsg = result.details.formErrors.join("; ")
        if (result.details?.fieldErrors) {
          Object.entries(result.details.fieldErrors).forEach(([field, errors]) => {
            if (errors) errorMsg += ` ${field}: ${errors.join(", ")}`
          })
        }
        toast.error(errorMsg, { duration: 5000 })
      }
    } catch (error) {
      console.error("Error submitting progression action:", error)
      toast.error(`Error: ${error instanceof Error ? error.message : "Failed to save progression"}`, { 
        duration: 5000,
        description: "Please try again."
      })
    } finally {
      setIsSavingProgression(false)
      setShowProgressionDialog(false)
      quitExercise()

      const allExercisesCompleted = currentExercises.every(ex =>
        ex.sets.every(set => sets[set.id]?.completed)
      )
      if (allExercisesCompleted) {
        setShowWorkoutCompletionDialog(true)
      }
    }
  }

  const handleWorkoutCompletion = async () => {
    setIsCompletingWorkout(true)
    // setShowWorkoutCompletionDialog(false) // Dialog will be closed by onOpenChange or explicitly after action

    try {
      const result = await completeWorkoutSessionAction(sessionId)

      if (result.success && result.redirectUrl) {
        toast.success("Workout completed! Redirecting...")
        router.push(result.redirectUrl)
      } else {
        toast.error(result.error || "Failed to complete workout.")
        setShowWorkoutCompletionDialog(false) // Keep dialog open on error if not redirecting
      }
    } catch (error) {
      console.error("Error completing workout session:", error)
      toast.error("An unexpected error occurred while completing the workout.")
      setShowWorkoutCompletionDialog(false)
    } finally {
      setIsCompletingWorkout(false)
    }
  }

  const handleExerciseAdded = (exerciseData: {
    exerciseId: string
    exerciseName: string
    sets: Array<{
      id: string
      exerciseId: string
      targetReps: number
      weight: number
      completed: boolean
    }>
  }) => {
    // Add the new exercise to current exercises
    const newExerciseGroup: ExerciseGroup = {
      exerciseId: exerciseData.exerciseId,
      exerciseName: exerciseData.exerciseName,
      sets: exerciseData.sets.map(set => ({
        id: set.id,
        exerciseId: set.exerciseId,
        workoutSessionId: sessionId,
        targetReps: set.targetReps,
        actualReps: null,
        weight: set.weight,
        notes: null,
        completed: set.completed,
        nextWeightAdjustment: null,
      }))
    }

    setCurrentExercises(prev => [...prev, newExerciseGroup])

    // Add the new sets to the sets state
    const newSetsState: Record<string, Set> = {}
    exerciseData.sets.forEach(set => {
      newSetsState[set.id] = {
        id: set.id,
        exerciseId: set.exerciseId,
        workoutSessionId: sessionId,
        targetReps: set.targetReps,
        actualReps: null,
        weight: set.weight,
        notes: null,
        completed: set.completed,
        nextWeightAdjustment: null,
      }
    })

    setSets(prev => ({ ...prev, ...newSetsState }))
  }

  const handleRemoveExercise = async (exerciseId: string, exerciseName: string) => {
    if (!confirm(`Are you sure you want to remove "${exerciseName}" from this workout? All sets for this exercise will be deleted.`)) {
      return
    }

    try {
      const result = await removeExerciseFromSessionAction({
        sessionId,
        exerciseId,
      })

      if (result.success) {
        toast.success(`Removed ${exerciseName} from workout`)
        
        // Remove the exercise from current exercises
        setCurrentExercises(prev => prev.filter(ex => ex.exerciseId !== exerciseId))
        
        // Remove all sets for this exercise from the sets state
        setSets(prev => {
          const newSets = { ...prev }
          Object.keys(newSets).forEach(setId => {
            if (newSets[setId].exerciseId === exerciseId) {
              delete newSets[setId]
            }
          })
          return newSets
        })
      } else {
        toast.error(result.error || "Failed to remove exercise")
      }
    } catch (error) {
      console.error("Error removing exercise:", error)
      toast.error("An unexpected error occurred")
    }
  }
  
  // Calculate overall workout progress
  const completedSetsCount = Object.values(sets).filter(s => s.completed).length
  const totalSetsCount = Object.values(sets).length
  const workoutProgress = totalSetsCount > 0 ? (completedSetsCount / totalSetsCount) * 100 : 0
  const allSetsCompleted = completedSetsCount === totalSetsCount && totalSetsCount > 0

  useEffect(() => {
    if (allSetsCompleted && !showWorkoutCompletionDialog && !isCompletingWorkout) {
        // This was removed in summary, re-adding logic to show completion dialog automatically
        // The user might want a button instead, but this restores previous described behavior
        // Check if all exercises were completed in handleProgression and then set this
    }
  }, [allSetsCompleted, showWorkoutCompletionDialog, isCompletingWorkout])
  
  if (!currentExercises || currentExercises.length === 0) {
    return (
      <div className="space-y-6 p-4 md:p-6 pb-24">
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-6">No exercises in this session.</p>
          <Button
            variant="default"
            onClick={() => setShowAddExerciseDialog(true)}
            className="w-full max-w-sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Exercise
          </Button>
        </div>

        <AddExerciseDialog
          open={showAddExerciseDialog}
          onOpenChange={setShowAddExerciseDialog}
          sessionId={sessionId}
          onExerciseAdded={handleExerciseAdded}
          availableExercises={availableExercises.map(exercise => ({
            id: exercise.id,
            name: exercise.name,
            category: "strength", // Default category - you may want to add this to your Exercise model
            muscleGroups: [] // Default empty - you may want to add this to your Exercise model
          }))}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6 pb-24">
      <WorkoutProgressCard 
        progressValue={workoutProgress}
        completedSetsCount={completedSetsCount}
        totalSetsCount={totalSetsCount}
        allSetsCompleted={allSetsCompleted}
        onFinishWorkoutClick={() => setShowWorkoutCompletionDialog(true)}
        isCompletingWorkout={isCompletingWorkout}
      />

      <RestTimerDisplay 
        isVisible={isTimerRunning}
        formattedTime={formatTime(restTimer)}
        isTimerRunning={isTimerRunning}
        onToggleTimer={toggleTimer}
        onStopTimer={() => { setIsTimerRunning(false); setRestTimer(0); }}
        onAddTime={addTimeToTimer}
      />

      {currentExercises.map((exerciseGroup) => (
        <ExerciseTrackerCard
          key={exerciseGroup.exerciseId}
          exerciseGroup={exerciseGroup}
          currentSetsState={sets}
          isMinimized={minimizedExercises[exerciseGroup.exerciseId] || false}
          onToggleMinimize={toggleExerciseMinimized}
          onInitiateSetCompletion={initiateSetCompletion}
          onRemoveExercise={handleRemoveExercise}
          activeSetId={activeSetId}
          activeExerciseId={activeExerciseId}
        />
      ))}

      {/* Add Exercise Button */}
      <div className="flex justify-center pt-4">
        <Button
          variant="outline"
          onClick={() => setShowAddExerciseDialog(true)}
          className="w-full max-w-sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Exercise
        </Button>
      </div>

      <SetCompletionDialog
        open={showCompletionDialog}
        onOpenChange={setShowCompletionDialog}
        tempReps={tempReps}
        tempWeight={tempWeight}
        onConfirm={completeSet}
        onCancel={() => setShowCompletionDialog(false)}
        adjustTempReps={adjustTempReps}
        adjustTempWeight={adjustTempWeight}
        onTempRepsInputChange={setTempReps}
        onTempWeightInputChange={setTempWeight}
      />

      <ExerciseProgressionDialog
        open={showProgressionDialog}
        onOpenChange={setShowProgressionDialog}
        exerciseName={currentExercises.find(ex => ex.exerciseId === activeExerciseId)?.exerciseName}
        shouldProgress={shouldProgress}
        onShouldProgressChange={setShouldProgress}
        progressionAmount={progressionAmount}
        onProgressionAmountChange={setProgressionAmount}
        onConfirm={handleProgression}
        onSkip={() => { setShowProgressionDialog(false); quitExercise(); }}
        isSaving={isSavingProgression}
      />

      <WorkoutCompletionDialog
        open={showWorkoutCompletionDialog}
        onOpenChange={setShowWorkoutCompletionDialog}
        onConfirm={handleWorkoutCompletion}
        onCancel={() => setShowWorkoutCompletionDialog(false)}
        isCompleting={isCompletingWorkout}
      />

      <AddExerciseDialog
        open={showAddExerciseDialog}
        onOpenChange={setShowAddExerciseDialog}
        sessionId={sessionId}
        onExerciseAdded={handleExerciseAdded}
        availableExercises={availableExercises.map(exercise => ({
          id: exercise.id,
          name: exercise.name,
          category: "strength", // Default category - you may want to add this to your Exercise model
          muscleGroups: [] // Default empty - you may want to add this to your Exercise model
        }))}
      />
    </div>
  )
} 