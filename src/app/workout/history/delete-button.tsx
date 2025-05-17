"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
// Import the server action
import { deleteWorkoutSessionAction, DeleteWorkoutSessionResponse } from "@/app/actions/workoutScheduleActions";

interface DeleteWorkoutButtonProps {
  workoutId: string;
}

export default function DeleteWorkoutButton({ workoutId }: DeleteWorkoutButtonProps) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // Call the server action
      const result: DeleteWorkoutSessionResponse = await deleteWorkoutSessionAction(workoutId);

      if (result.success) {
        toast.success("Workout deleted successfully.");
        // Revalidation is handled by the server action, router.refresh() ensures UI update.
        router.refresh(); 
      } else {
        toast.error(result.error || "Failed to delete workout.");
      }
    } catch (error) {
      console.error("Error deleting workout:", error);
      toast.error("An unexpected error occurred while deleting the workout.");
    } finally {
      setIsDeleting(false);
      setOpen(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        disabled={isDeleting}
        aria-label="Delete workout"
      >
        <Trash2 className="h-4 w-4 text-red-500" />
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this workout? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault(); // Prevent default form submission if any
                handleDelete();
              }}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 