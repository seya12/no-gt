"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
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

// Validation schema for the workout plan form
const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  exercises: z.array(
    z.object({
      id: z.string().optional(),
      exerciseId: z.string(),
      defaultSets: z.coerce.number().int().min(1, "Minimum 1 set"),
      defaultReps: z.coerce.number().int().min(1, "Minimum 1 rep"),
      startingWeight: z.coerce.number().nullable().optional(),
    })
  ),
})

type FormValues = z.infer<typeof formSchema>

type WorkoutPlanExercise = {
  id?: string
  exerciseId: string
  defaultSets: number
  defaultReps: number
  startingWeight: number | null
  exercise?: Exercise
}

interface WorkoutPlan {
  id: string
  name: string
  exercises: WorkoutPlanExercise[]
}

interface WorkoutPlanFormProps {
  workoutPlan?: WorkoutPlan | null
  exercises: Exercise[]
  onSuccess?: () => void
}

export function WorkoutPlanForm({
  workoutPlan = null,
  exercises,
  onSuccess,
}: WorkoutPlanFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize the form with default values or existing workout plan data
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: workoutPlan?.name || "",
      exercises: workoutPlan?.exercises?.length
        ? workoutPlan.exercises.map((exercise) => ({
            id: exercise.id,
            exerciseId: exercise.exerciseId,
            defaultSets: exercise.defaultSets,
            defaultReps: exercise.defaultReps,
            startingWeight: exercise.startingWeight,
          }))
        : [],
    },
  })

  // Handle form submission
  async function onSubmit(values: FormValues) {
    setIsSubmitting(true)
    
    try {
      const endpoint = workoutPlan
        ? `/api/workout/plans/${workoutPlan.id}`
        : "/api/workout/plans"
      
      const method = workoutPlan ? "PATCH" : "POST"
      
      const response = await fetch(endpoint, {
        method,
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

  // Add a new empty exercise to the form
  const addExercise = () => {
    form.setValue("exercises", [
      ...form.getValues("exercises"),
      {
        exerciseId: "",
        defaultSets: 3,
        defaultReps: 10,
        startingWeight: null,
      },
    ])
  }

  // Remove an exercise from the form
  const removeExercise = (index: number) => {
    const currentExercises = form.getValues("exercises")
    form.setValue(
      "exercises",
      currentExercises.filter((_, i) => i !== index)
    )
  }

  // Get a readable exercise name from ID
  const getExerciseName = (exerciseId: string) => {
    const exercise = exercises.find((e) => e.id === exerciseId)
    return exercise?.name || "Unknown Exercise"
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
              onClick={addExercise}
            >
              Add Exercise
            </Button>
          </div>

          {form.watch("exercises").length === 0 && (
            <Card className="border-dashed">
              <CardContent className="pt-6 text-center text-muted-foreground">
                No exercises added yet. Click &quot;Add Exercise&quot; to start building
                your workout plan.
              </CardContent>
            </Card>
          )}

          {form.watch("exercises").map((exercise, index) => (
            <Card key={index} className="overflow-hidden">
              <CardHeader className="bg-muted/50 py-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">
                    {exercise.exerciseId
                      ? getExerciseName(exercise.exerciseId)
                      : `Exercise ${index + 1}`}
                  </h4>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeExercise(index)}
                  >
                    Remove
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 pt-6">
                <FormField
                  control={form.control}
                  name={`exercises.${index}.exerciseId`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exercise</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an exercise" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {exercises.map((exercise) => (
                            <SelectItem key={exercise.id} value={exercise.id}>
                              {exercise.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name={`exercises.${index}.defaultSets`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sets</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            {...field}
                          />
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
                          <Input
                            type="number"
                            min="1"
                            {...field}
                          />
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
                            min="0"
                            step="0.5"
                            value={field.value === null ? "" : field.value}
                            onChange={(e) => {
                              const value = e.target.value === "" 
                                ? null 
                                : parseFloat(e.target.value)
                              field.onChange(value)
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : workoutPlan ? "Update Plan" : "Create Plan"}
        </Button>
      </form>
    </Form>
  )
} 