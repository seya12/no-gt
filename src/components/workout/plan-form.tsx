"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { Exercise } from "@prisma/client"
import { ExercisePickerDialog } from "../shared/exercise-picker-dialog"
import { Plus } from "lucide-react"
import { createWorkoutPlanAction, updateWorkoutPlanAction } from "@/app/actions/workoutPlanActions"

// Validation schema for the workout plan form
const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  exercises: z.array(
    z.object({
      exerciseId: z.string(),
      defaultSets: z.coerce.number().int().min(1, "Minimum 1 set"),
      defaultReps: z.coerce.number().int().min(1, "Minimum 1 rep"),
      startingWeight: z.coerce.number().nullable().optional(),
    })
  ),
})

type FormValues = z.infer<typeof formSchema>

interface WorkoutPlanFormProps {
  defaultValues?: {
    name: string;
    exercises: {
      exerciseId: string;
      defaultSets: number;
      defaultReps: number;
      startingWeight: number | null;
    }[];
  };
  exercises: Exercise[];
  onSuccess?: () => void;
  planId?: string;
}

export function WorkoutPlanForm({
  defaultValues,
  exercises: initialExercises,
  onSuccess,
  planId,
}: WorkoutPlanFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isExerciseDialogOpen, setIsExerciseDialogOpen] = useState(false)
  const [exercises, setExercises] = useState(initialExercises)

  // Initialize the form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues || {
      name: "",
      exercises: [],
    },
  })

  // Handle form submission
  async function onSubmit(values: FormValues) {
    startTransition(async () => {
      try {
        if (planId) {
          const result = await updateWorkoutPlanAction(planId, values);
          if (result.success) {
            if (onSuccess) {
              onSuccess();
            } else {
              router.push("/workout/plans");
              router.refresh(); 
            }
          } else {
            console.error("Error updating workout plan:", result.error, result.details);
            // TODO: Display error to user (e.g., using react-toast or form.setError)
            // if (result.details?.fieldErrors) { ... }
            // form.setError(\"root\", { message: result.error || \"Failed to update plan\" });
          }
        } else {
          const result = await createWorkoutPlanAction(values);
          if (result.success) {
            if (onSuccess) {
              onSuccess();
            } else {
              router.push("/workout/plans");
              router.refresh();
            }
          } else {
            console.error("Error creating workout plan:", result.error, result.details);
            // TODO: Display error to user
            // form.setError(\"root\", { message: result.error || \"Failed to create plan\" });
          }
        }
      } catch (error) {
        console.error("Unhandled error in form submission:", error);
        // TODO: Display generic error to user
        // form.setError(\"root\", { message: \"An unexpected error occurred.\" });
      }
    });
  }

  // Add an exercise from suggestions
  const addSuggestedExercise = (exerciseId: string, exerciseName: string, sets = 3, reps = 10, weight?: number) => {
    // Ensure the exercise is in our exercises list (in case of timing issues with state updates)
    const exerciseExists = exercises.find(ex => ex.id === exerciseId)
    
    if (!exerciseExists) {
      // If exercise doesn't exist in our list, create a minimal exercise object
      // This can happen with newly created exercises due to state timing
      const newExercise = {
        id: exerciseId,
        name: exerciseName,
        description: null,
        userId: '', // This will be set properly by the server
        createdAt: new Date(),
        updatedAt: new Date()
      }
      setExercises(prev => [...prev, newExercise])
    }

    // Add the exercise to the form
    form.setValue("exercises", [
      ...form.getValues("exercises"),
      {
        exerciseId,
        defaultSets: sets,
        defaultReps: reps,
        startingWeight: weight || null,
      },
    ])
  }

  // Handle when a new exercise is created
  const handleExerciseCreated = async (newExercise: Exercise) => {
    // Update the local exercises list
    setExercises(prev => [...prev, newExercise])
    
    // No need to automatically add the exercise here - the configuration screen
    // will handle adding it with the user's chosen sets/reps/weight values
  }

  // Remove an exercise from the form
  const removeExercise = (index: number) => {
    const currentExercises = form.getValues("exercises")
    form.setValue(
      "exercises",
      currentExercises.filter((_, i) => i !== index)
    )
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-20 md:pb-8">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Workout Plan Name</FormLabel>
                <FormControl>
                  <Input placeholder="My Workout Plan" {...field} disabled={isPending} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Exercises</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsExerciseDialogOpen(true)}
                disabled={isPending}
                className="hidden md:flex"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Exercise
              </Button>
            </div>

            {form.watch("exercises").length === 0 && (
              <div className="text-center py-12 border border-dashed rounded-lg">
                <p className="text-muted-foreground mb-4">No exercises added yet</p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsExerciseDialogOpen(true)}
                  disabled={isPending}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Exercise
                </Button>
              </div>
            )}

            <div className="space-y-4">
              {form.watch("exercises").map((exercise, index) => (
                <div
                  key={index}
                  className="flex flex-col gap-4 p-4 border rounded-lg"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <FormField
                        control={form.control}
                        name={`exercises.${index}.exerciseId`}
                        render={({ field }) => (
                          <FormItem>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Select Exercise" />
                              </SelectTrigger>
                              <SelectContent>
                                {exercises.map((exercise) => (
                                  <SelectItem
                                    key={exercise.id}
                                    value={exercise.id}
                                  >
                                    {exercise.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeExercise(index)}
                    >
                      Remove
                    </Button>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name={`exercises.${index}.defaultSets`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sets</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`exercises.${index}.defaultReps`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reps</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`exercises.${index}.startingWeight`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Weight (kg)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) => {
                                const value = e.target.value
                                field.onChange(value === "" ? null : Number(value))
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>

            {form.watch("exercises").length > 0 && (
              <div className="flex justify-center pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsExerciseDialogOpen(true)}
                  disabled={isPending}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Another Exercise
                </Button>
              </div>
            )}
          </div>

          <div className="pt-6">
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Saving..." : planId ? "Save Changes" : "Create Plan"}
            </Button>
          </div>
        </form>
      </Form>



      <ExercisePickerDialog
        open={isExerciseDialogOpen}
        onOpenChange={setIsExerciseDialogOpen}
        availableExercises={exercises}
        onExerciseSelected={addSuggestedExercise}
        onExerciseCreated={handleExerciseCreated}
        title="Add Exercises"
        showCreateOption={true}
        showSetConfiguration={true}
      />
    </>
  )
} 