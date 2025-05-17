"use client"

import { Exercise } from "@prisma/client"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Loader2 } from "lucide-react"
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
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">Description</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {exercises.map((exercise) => (
              <TableRow key={exercise.id}>
                <TableCell className="font-medium">{exercise.name}</TableCell>
                <TableCell className="hidden md:table-cell">
                  {exercise.description || "No description"}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Link href={`/exercises/${exercise.id}/edit`}>
                      <Button size="icon" variant="ghost" title="Edit exercise">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      title="Delete exercise"
                      onClick={() => {
                        setExerciseToDelete(exercise)
                        setOpen(true)
                      }}
                      disabled={isDeleting && exerciseToDelete?.id === exercise.id}
                      className="text-destructive hover:text-destructive/90"
                    >
                      {isDeleting && exerciseToDelete?.id === exercise.id 
                        ? <Loader2 className="h-4 w-4 animate-spin" /> 
                        : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the exercise &quot;{exerciseToDelete?.name}&quot;
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
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 