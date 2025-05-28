"use client"

import { Exercise } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Edit, Trash2, Loader2, FileText, Target } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { deleteExerciseAction } from "@/app/actions/exerciseActions"
import { useRouter } from "next/navigation"

type ExerciseListProps = {
  exercises: Exercise[]
}

export function ExerciseList({ exercises }: ExerciseListProps) {
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [exerciseToDelete, setExerciseToDelete] = useState<Exercise | null>(null)
  const router = useRouter()

  const handleDelete = async () => {
    if (!exerciseToDelete) return
    
    setIsDeleting(true)
    try {
      const result = await deleteExerciseAction(exerciseToDelete.id)
      
      if (result.success) {
        toast.success(`Exercise "${exerciseToDelete.name}" deleted successfully.`)
        router.refresh()
      } else {
        toast.error(result.error || "Failed to delete exercise.")
      }
    } catch (error) {
      console.error('Error deleting exercise:', error)
      toast.error("An unexpected error occurred while deleting the exercise.")
    } finally {
      setIsDeleting(false)
      setOpen(false)
      setExerciseToDelete(null)
    }
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {exercises.map((exercise) => (
          <Card key={exercise.id} className="group hover:shadow-lg transition-all duration-200 border-border hover:border-primary/30">
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <Target className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                        {exercise.name}
                      </h3>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link href={`/exercises/${exercise.id}/edit`}>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-primary/10">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        setExerciseToDelete(exercise)
                        setOpen(true)
                      }}
                      disabled={isDeleting && exerciseToDelete?.id === exercise.id}
                    >
                      {isDeleting && exerciseToDelete?.id === exercise.id 
                        ? <Loader2 className="h-4 w-4 animate-spin" /> 
                        : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  {exercise.description ? (
                    <div className="flex items-start space-x-2">
                      <FileText className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {exercise.description}
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 text-muted-foreground/60">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm italic">No description added</span>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="pt-2 border-t border-border/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Created {new Date(exercise.createdAt).toLocaleDateString()}
                    </span>
                    <Link href={`/exercises/${exercise.id}/edit`}>
                      <Button size="sm" variant="outline" className="h-7 text-xs hover:bg-primary hover:text-primary-foreground">
                        Edit
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Exercise</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{exerciseToDelete?.name}&quot;? 
              This action cannot be undone and will remove the exercise from all workout plans.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => { 
                e.preventDefault()
                handleDelete()
              }} 
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Exercise"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 