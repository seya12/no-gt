"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface ScheduleActionsProps {
  workoutId: string;
  returnUrl: string;
}

export function ScheduleActions({ workoutId, returnUrl }: ScheduleActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function cancelWorkout() {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/workout/schedule/${workoutId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to cancel workout");
      }

      toast.success("Workout canceled");
      router.refresh();
      router.push(returnUrl);
    } catch (error) {
      console.error(error);
      toast.error("Failed to cancel workout");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex justify-between">
      <Button 
        variant="outline" 
        onClick={cancelWorkout}
        disabled={isLoading}
      >
        {isLoading ? "Canceling..." : "Cancel"}
      </Button>
      
      <Button 
        variant="ghost"
        disabled={isLoading}
        onClick={() => router.push(`/workout/schedule/edit/${workoutId}`)}
      >
        Reschedule
      </Button>
    </div>
  );
} 