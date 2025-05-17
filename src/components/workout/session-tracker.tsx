"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { logExerciseProgressionAction } from "@/app/actions/exerciseActions"
import type { Set } from "@prisma/client"
import { completeWorkoutSessionAction } from "@/app/actions/workoutSessionActions"
import { SetCompletionDialog } from "./SetCompletionDialog"
import { ExerciseProgressionDialog } from "./ExerciseProgressionDialog"
import { WorkoutCompletionDialog } from "./WorkoutCompletionDialog"
import { WorkoutProgressCard } from "./WorkoutProgressCard"
import { ExerciseTrackerCard } from "./ExerciseTrackerCard"
import { RestTimerDisplay } from "./RestTimerDisplay"
import { updateWorkoutSetAction, UpdateWorkoutSetResponse } from "@/app/actions/workoutSetActions"

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
  const [tempWeight, setTempWeight] = useState<number | null>(0)
  const [tempRestDuration, setTempRestDuration] = useState(90)
  const [minimizedExercises, setMinimizedExercises] = useState<Record<string, boolean>>({})
  const [progressionAmount, setProgressionAmount] = useState(2.5)
  const [shouldProgress, setShouldProgress] = useState(true)
  const [showWorkoutCompletionDialog, setShowWorkoutCompletionDialog] = useState(false)
  const [isSavingProgression, setIsSavingProgression] = useState(false)
  const [isCompletingWorkout, setIsCompletingWorkout] = useState(false)
  
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
    const exercise = exercises.find(e => e.exerciseId === exerciseId)
    
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
    
    const exercise = exercises.find(e => e.exerciseId === activeExerciseId)
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

      const allExercisesCompleted = exercises.every(ex =>
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
  
  if (!exercises || exercises.length === 0) {
    return <p>No exercises in this session.</p>
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <WorkoutProgressCard 
        progressValue={workoutProgress}
        completedSetsCount={completedSetsCount}
        totalSetsCount={totalSetsCount}
        allSetsCompleted={allSetsCompleted}
        onFinishWorkoutClick={() => setShowWorkoutCompletionDialog(true)}
        isCompletingWorkout={isCompletingWorkout}
      />

      {exercises.map((exerciseGroup) => (
        <ExerciseTrackerCard
          key={exerciseGroup.exerciseId}
          exerciseGroup={exerciseGroup}
          currentSetsState={sets}
          isMinimized={minimizedExercises[exerciseGroup.exerciseId] || false}
          onToggleMinimize={toggleExerciseMinimized}
          onInitiateSetCompletion={initiateSetCompletion}
          activeSetId={activeSetId}
          activeExerciseId={activeExerciseId}
        />
      ))}

      <RestTimerDisplay 
        isVisible={isTimerRunning}
        formattedTime={formatTime(restTimer)}
        isTimerRunning={isTimerRunning}
        onToggleTimer={toggleTimer}
        onStopTimer={() => { setIsTimerRunning(false); setRestTimer(0); }}
        tempRestDurationMinutes={Math.floor(tempRestDuration / 60)}
        tempRestDurationSeconds={tempRestDuration % 60}
        onRestDurationMinutesChange={(mins) => setTempRestDuration(parseRestDuration(mins, tempRestDuration % 60))}
        onRestDurationSecondsChange={(secs) => setTempRestDuration(parseRestDuration(Math.floor(tempRestDuration / 60), secs))}
      />

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
        exerciseName={exercises.find(ex => ex.exerciseId === activeExerciseId)?.exerciseName}
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
    </div>
  )
} 