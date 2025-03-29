"use client"

import { useState } from "react"
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

// Validation schema for exercise form
const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface ExerciseFormProps {
  exercise?: Exercise | null
}

export function ExerciseForm({ exercise = null }: ExerciseFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Initialize form with default values or existing exercise data
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: exercise?.name || "",
      description: exercise?.description || "",
    },
  })
  
  // Form submission handler
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)
    
    try {
      const url = exercise 
        ? `/api/exercises/${exercise.id}`
        : "/api/exercises"
      
      const method = exercise ? "PATCH" : "POST"
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })
      
      if (response.ok) {
        // Redirect to exercises list on success
        router.push("/exercises")
        router.refresh()
      } else {
        console.error("Form submission error:", await response.json())
        setIsSubmitting(false)
      }
    } catch (error) {
      console.error("Form submission error:", error)
      setIsSubmitting(false)
    }
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
                  />
                </FormControl>
                <FormDescription>
                  Details about the exercise, form cues, or targeted muscles
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
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