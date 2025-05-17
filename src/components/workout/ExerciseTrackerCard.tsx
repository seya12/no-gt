"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, ChevronDown, ChevronUp } from "lucide-react"
import type { Set } from "@prisma/client"

interface ExerciseGroup {
  exerciseId: string
  exerciseName: string
  sets: Set[] // These are the original sets for structure, target reps/weight
}

interface ExerciseTrackerCardProps {
  exerciseGroup: ExerciseGroup
  currentSetsState: Record<string, Set> // This provides the live state (completed, actualReps, etc.)
  isMinimized: boolean
  onToggleMinimize: (exerciseId: string) => void
  onInitiateSetCompletion: (exerciseId: string, setId: string) => void
  activeSetId: string | null
  activeExerciseId: string | null
}

export function ExerciseTrackerCard({
  exerciseGroup,
  currentSetsState,
  isMinimized,
  onToggleMinimize,
  onInitiateSetCompletion,
  activeSetId,
  activeExerciseId,
}: ExerciseTrackerCardProps) {
  return (
    <Card key={exerciseGroup.exerciseId}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">{exerciseGroup.exerciseName}</CardTitle>
        <Button variant="ghost" size="sm" onClick={() => onToggleMinimize(exerciseGroup.exerciseId)}>
          {isMinimized ? <ChevronDown /> : <ChevronUp />}
        </Button>
      </CardHeader>
      {!isMinimized && (
        <CardContent className="space-y-4">
          {exerciseGroup.sets.map((originalSet, index) => {
            const liveSetState = currentSetsState[originalSet.id] || originalSet // Fallback to original if not in live state (should be)
            return (
              <div key={originalSet.id} className={`p-3 rounded-md ${liveSetState.completed ? 'bg-green-100 dark:bg-green-900' : 'bg-slate-50 dark:bg-slate-800'}`}>
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold">
                    Set {index + 1} - Target: {originalSet.targetReps} reps @ {originalSet.weight}kg
                  </h4>
                  {!liveSetState.completed && (
                    <Button 
                      size="sm" 
                      onClick={() => onInitiateSetCompletion(exerciseGroup.exerciseId, originalSet.id)}
                      disabled={activeSetId === originalSet.id || (activeExerciseId !== null && activeExerciseId !== exerciseGroup.exerciseId)}
                    >
                      Log Set
                    </Button>
                  )}
                  {liveSetState.completed && <CheckCircle2 className="text-green-500" />}
                </div>
                {liveSetState.completed && (
                  <p className="text-sm text-muted-foreground">
                    Completed: {liveSetState.actualReps} reps @ {liveSetState.weight}kg
                  </p>
                )}
              </div>
            )
          })}
        </CardContent>
      )}
    </Card>
  )
} 