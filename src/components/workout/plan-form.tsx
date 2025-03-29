"use client"

import { useState } from "react"
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Exercise } from "@prisma/client"
import { SuggestedWorkoutExercises } from "./suggested-workout-exercises"
import { Plus } from "lucide-react"

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
  const [isSubmitting, setIsSubmitting] = useState(false)
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
    setIsSubmitting(true)
    
    try {
      const response = await fetch(`/api/workout/plans${planId ? `/${planId}` : ''}`, {
        method: planId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to save workout plan")
      }
      
      if (onSuccess) {
        onSuccess()
      } else {
        router.push("/workout/plans")
        router.refresh()
      }
    } catch (error) {
      console.error("Error saving workout plan:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Add an exercise from suggestions
  const addSuggestedExercise = async (exerciseId: string, defaultSets = 3, defaultReps = 10) => {
    // Add the exercise to the form
    form.setValue("exercises", [
      ...form.getValues("exercises"),
      {
        exerciseId,
        defaultSets,
        defaultReps,
        startingWeight: null,
      },
    ])
    // Close the dialog after adding
    setIsExerciseDialogOpen(false)
  }

  // Handle when a new exercise is created
  const handleExerciseCreated = async (newExercise: Exercise) => {
    // Update the local exercises list
    setExercises(prev => [...prev, newExercise])
    
    // Add the new exercise to the form
    addSuggestedExercise(newExercise.id, 3, 10)
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-24 md:pb-8">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Workout Plan Name</FormLabel>
                <FormControl>
                  <Input placeholder="My Workout Plan" {...field} />
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
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Exercise
              </Button>
            </div>

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
          </div>

          <Button type="submit" disabled={isSubmitting}>
            {planId ? "Update Plan" : "Create Plan"}
          </Button>
        </form>
      </Form>

      <Dialog open={isExerciseDialogOpen} onOpenChange={setIsExerciseDialogOpen}>
        <DialogContent className="sm:max-w-[425px] md:max-w-[700px] lg:max-w-[900px] h-[90vh] md:h-[80vh] p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle>Add Exercises</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto px-6 py-4">
            <SuggestedWorkoutExercises 
              availableExercises={exercises}
              onAddExercise={addSuggestedExercise}
              onExerciseCreated={handleExerciseCreated}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
} 