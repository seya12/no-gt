"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { deleteWorkoutSessionAction, DeleteWorkoutSessionResponse } from "@/app/actions/workoutScheduleActions";
import { Loader2 } from "lucide-react";

interface ScheduleActionsProps {
  workoutId: string;
}

export function ScheduleActions({ workoutId }: ScheduleActionsProps) {
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
      <div className="flex justify-between w-full space-x-2">
        <Button 
          variant="destructive"
          onClick={() => setIsDeleteDialogOpen(true)}
          disabled={isDeleting || isRescheduling}
          className="flex-1"
        >
          {isDeleting ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...</>
          ) : (
            "Delete"
          )}
        </Button>
        
        <Button 
          variant="outline"
          disabled={isDeleting || isRescheduling}
          onClick={handleReschedule}
          className="flex-1"
        >
          {isRescheduling ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...</>
          ) : (
            "Reschedule"
          )}
        </Button>
      </div>

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