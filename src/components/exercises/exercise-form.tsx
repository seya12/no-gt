"use client"

import { useRouter } from "next/navigation"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Exercise } from "@prisma/client"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { createExerciseAction, updateExerciseAction } from "@/app/actions/exerciseActions"

// Validation schema for exercise form - aligning with server action
const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500, "Description cannot exceed 500 characters").optional().nullable(),
})

type FormValues = z.infer<typeof formSchema>

interface ExerciseFormProps {
  exercise?: Exercise | null
  onSuccess?: () => void // Optional callback for success
}

export function ExerciseForm({ exercise = null, onSuccess }: ExerciseFormProps) {
  const router = useRouter()
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: exercise?.name || "",
      description: exercise?.description || null, // Ensure null if not present
    },
  })
  
  const onSubmit = async (data: FormValues) => {
    const formData = new FormData()
    formData.append("name", data.name)
    if (data.description !== null && data.description !== undefined) {
      formData.append("description", data.description)
    }

    if (exercise && exercise.id) { // Update existing exercise
      const result = await updateExerciseAction(exercise.id, undefined, formData)
      
      if (result.success) {
        toast.success("Exercise updated successfully!")
        if (onSuccess) {
          onSuccess()
        } else {
          router.push("/exercises")
        }
        // router.refresh() // Revalidation handled by server action
      } else {
        let errorMessage = result.error || "Failed to update exercise."
        if (result.details?.formErrors?.length) {
          errorMessage = result.details.formErrors.join(", ")
        }
        toast.error(errorMessage)

        if (result.details?.fieldErrors) {
          if (result.details.fieldErrors.name) {
            form.setError("name", { type: "server", message: result.details.fieldErrors.name.join(", ") })
          }
          if (result.details.fieldErrors.description) {
            form.setError("description", { type: "server", message: result.details.fieldErrors.description.join(", ") })
          }
        }
      }
    } else { // Create new exercise (existing logic)
      const result = await createExerciseAction(undefined, formData)
      
      if (result.success) {
        toast.success("Exercise created successfully!")
        if (onSuccess) {
          onSuccess()
        } else {
          router.push("/exercises") 
        }
      } else {
        let errorMessage = result.error || "Failed to create exercise."
        if (result.details?.formErrors?.length) {
          errorMessage = result.details.formErrors.join(", ")
        }
        toast.error(errorMessage)

        if (result.details?.fieldErrors) {
          if (result.details.fieldErrors.name) {
            form.setError("name", { type: "server", message: result.details.fieldErrors.name.join(", ") })
          }
          if (result.details.fieldErrors.description) {
            form.setError("description", { type: "server", message: result.details.fieldErrors.description.join(", ") })
          }
        }
      }
    }
    // react-hook-form handles setting isSubmitting to false
  }
  
  return (
    <div className="space-y-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Bench Press" {...field} />
                </FormControl>
                <FormDescription>
                  The name of the exercise
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="A compound exercise that targets the chest, shoulders, and triceps."
                    className="min-h-[100px]"
                    {...field}
                    value={field.value ?? ""} 
                    onChange={(e) => field.onChange(e.target.value === "" ? null : e.target.value)}
                  />
                </FormControl>
                <FormDescription>
                  Details about the exercise, form cues, or targeted muscles
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {exercise ? "Updating..." : "Creating..."}
              </>
            ) : (
              exercise ? "Update Exercise" : "Create Exercise"
            )}
          </Button>
        </form>
      </Form>
    </div>
  )
} 