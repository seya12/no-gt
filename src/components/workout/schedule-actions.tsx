"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

interface ScheduleActionsProps {
  workoutId: string;
  // returnUrl: string; // No longer used by delete, can be re-added if Reschedule needs it
}

export function ScheduleActions({ workoutId }: ScheduleActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const router = useRouter();

  async function deleteWorkout() {
    setIsLoading(true);
    setIsDeleteDialogOpen(false);

    try {
      const response = await fetch(`/api/workout/schedule/${workoutId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete workout schedule");
      }

      toast.success("Workout schedule deleted");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete workout schedule. " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <div className="flex justify-between w-full space-x-2">
        <Button 
          variant="destructive"
          onClick={() => setIsDeleteDialogOpen(true)}
          disabled={isLoading}
          className="flex-1"
        >
          {isLoading ? "Deleting..." : "Delete"}
        </Button>
        
        <Button 
          variant="outline"
          disabled={isLoading}
          onClick={() => router.push(`/workout/schedule/edit/${workoutId}`)}
          className="flex-1"
        >
          Reschedule
        </Button>
      </div>

      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={deleteWorkout}
        title="Delete Scheduled Workout?"
        description="Are you sure you want to delete this scheduled workout? This action cannot be undone."
        confirmText="Delete"
      />
    </>
  );
} 