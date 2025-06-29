"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Exercise } from "@prisma/client"
import { ExercisePicker } from "./exercise-picker"
import { Plus } from "lucide-react"

interface ExercisePickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  availableExercises: Exercise[]
  onExerciseSelected: (exerciseId: string, exerciseName: string, sets?: number, reps?: number, weight?: number) => void
  onExerciseCreated?: (newExercise: Exercise) => void
  
  // Dialog customization
  title?: string
  
  // ExercisePicker configuration
  showCreateOption?: boolean
  showSetConfiguration?: boolean
  mode?: "workout" | "plan" | "simple"
}

export function ExercisePickerDialog({
  open,
  onOpenChange,
  availableExercises,
  onExerciseSelected,
  onExerciseCreated,
  title = "Add Exercise",
  showCreateOption = true,
  showSetConfiguration = false
}: ExercisePickerDialogProps) {
  
  const handleExerciseSelected = (exerciseId: string, exerciseName: string, sets?: number, reps?: number, weight?: number) => {
    onExerciseSelected(exerciseId, exerciseName, sets, reps, weight)
    onOpenChange(false) // Close dialog after selection
  }

  const handleExerciseCreated = (newExercise: Exercise) => {
    // If we're in workout mode with set configuration, don't close dialog yet
    // The configuration screen should be shown within the same dialog
    if (showSetConfiguration) {
      // Don't close dialog - let the exercise picker handle the configuration flow
      onExerciseCreated?.(newExercise)
    } else {
      // For plan mode or simple mode, close dialog after creation
      onExerciseCreated?.(newExercise)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] md:max-w-[700px] lg:max-w-[900px] max-h-[90vh] md:max-h-[80vh] p-0 flex flex-col overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
          <DialogTitle className="flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 px-6 py-4 min-h-0">
          <ExercisePicker
            availableExercises={availableExercises}
            onExerciseSelected={handleExerciseSelected}
            onExerciseCreated={handleExerciseCreated}
            showCreateOption={showCreateOption}
            showSetConfiguration={showSetConfiguration}
            maxHeight="calc(90vh - 120px)"
            className="h-full"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
} 