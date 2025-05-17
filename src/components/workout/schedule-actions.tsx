"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { deleteWorkoutSessionAction, DeleteWorkoutSessionResponse } from "@/app/actions/workoutScheduleActions";
import { Loader2, MoreHorizontal, Edit, Trash2 } from "lucide-react";

interface ScheduleActionsProps {
  workoutId: string;
}

export function ScheduleActions({ workoutId }: ScheduleActionsProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const router = useRouter();

  const handleDeleteWorkout = async () => {
    if (!workoutId) {
      toast.error("Workout ID is missing.");
      return;
    }
    setIsDeleting(true);
    const result: DeleteWorkoutSessionResponse = await deleteWorkoutSessionAction(workoutId);

    if (result.success) {
      toast.success("Workout schedule deleted.");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to delete workout schedule.");
    }
    setIsDeleting(false);
    setIsDeleteDialogOpen(false);
  };
  
  const handleReschedule = () => {
    setIsRescheduling(true);
    router.push(`/workout/schedule/edit/${workoutId}`);
  }

  return (
    <>
      <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="flex h-8 w-8 p-0 data-[state=open]:bg-muted">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]">
          <DropdownMenuItem 
            onClick={() => { 
              setIsMenuOpen(false);
              handleReschedule(); 
            }} 
            disabled={isRescheduling || isDeleting}
          >
            {isRescheduling ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Edit className="mr-2 h-4 w-4" />
            )}
            Reschedule
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              setIsMenuOpen(false);
              setIsDeleteDialogOpen(true);
            }}
            className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-700/10 dark:focus:text-red-500"
            disabled={isDeleting || isRescheduling}
          >
            {isDeleting && !isDeleteDialogOpen ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteWorkout}
        title="Delete Scheduled Workout?"
        description="Are you sure you want to delete this scheduled workout? This action cannot be undone."
        confirmText={isDeleting ? "Deleting..." : "Delete"}
      />
    </>
  );
} 