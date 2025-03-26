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
import { Edit, Trash2 } from "lucide-react"
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

type ExerciseListProps = {
  exercises: Exercise[]
}

export function ExerciseList({ exercises }: ExerciseListProps) {
  const [open, setOpen] = useState(false)
  const [exerciseToDelete, setExerciseToDelete] = useState<Exercise | null>(null)

  const handleDelete = async () => {
    if (!exerciseToDelete) return
    
    try {
      const response = await fetch(`/api/exercises/${exerciseToDelete.id}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        // Refresh the page to show updated list
        window.location.reload()
      } else {
        console.error('Failed to delete exercise')
      }
    } catch (error) {
      console.error('Error deleting exercise:', error)
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
                    >
                      <Trash2 className="h-4 w-4" />
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
              and remove it from any workout plans.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 