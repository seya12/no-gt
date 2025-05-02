"use client";

import { useState } from "react";
import { format, isSameDay } from "date-fns";
import Link from "next/link";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger, 
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { PlusCircle, CalendarClock } from "lucide-react";
import { toast } from "sonner";

interface CalendarDayProps {
  day: Date;
  today: Date;
  workouts: Array<{
    id: string;
    scheduled?: boolean;
    workoutPlan: {
      id: string;
      name: string;
    };
  }>;
  workoutPlans: Array<{
    id: string;
    name: string;
  }>;
}

export function CalendarDay({ day, today, workouts, workoutPlans }: CalendarDayProps) {
  const [open, setOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [isScheduling, setIsScheduling] = useState(false);
  
  const isToday = isSameDay(day, today);
  const isPast = day < today && !isToday;
  
  // Separate completed and scheduled workouts
  const completedWorkouts = workouts.filter(w => !w.scheduled);
  const scheduledWorkouts = workouts.filter(w => w.scheduled);
  
  async function scheduleWorkout() {
    if (!selectedPlanId) return;
    
    setIsScheduling(true);
    
    try {
      const response = await fetch("/api/workout/schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planId: selectedPlanId,
          date: day.toISOString(),
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to schedule workout");
      }
      
      toast.success("Workout scheduled!");
      setOpen(false);
      // Reload the page to reflect changes
      window.location.reload();
    } catch (error) {
      console.error(error);
      toast.error("Failed to schedule workout");
    } finally {
      setIsScheduling(false);
    }
  }

  return (
    <div 
      className={`p-2 border rounded-md h-24 overflow-y-auto relative ${
        isToday ? 'bg-accent/50 border-primary' : isPast ? 'bg-muted/10' : ''
      }`}
    >
      <div className="font-medium">{format(day, 'd')}</div>
      
      <div className="space-y-1 mt-1">
        {/* Completed workouts */}
        {completedWorkouts.map((workout) => (
          <Link 
            key={workout.id} 
            href={`/workout/session/${workout.id}`}
          >
            <div className="text-xs p-1 bg-primary/10 rounded truncate">
              {workout.workoutPlan.name}
            </div>
          </Link>
        ))}
        
        {/* Scheduled workouts */}
        {scheduledWorkouts.map((workout) => (
          <Link 
            key={workout.id} 
            href={`/workout/session/${workout.id}`}
          >
            <div className="text-xs p-1 bg-accent/30 rounded truncate flex items-center">
              <CalendarClock className="h-3 w-3 mr-1 opacity-70" />
              {workout.workoutPlan.name}
            </div>
          </Link>
        ))}
      </div>
      
      {/* Add Workout button - only for today and future days */}
      {!isPast && workoutPlans.length > 0 && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button 
              size="icon" 
              variant="ghost" 
              className="absolute bottom-1 right-1 h-5 w-5 p-0.5 opacity-50 hover:opacity-100"
            >
              <PlusCircle className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule Workout for {format(day, 'MMM d, yyyy')}</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <label className="text-sm font-medium mb-2 block">
                Select Workout Plan
              </label>
              <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a workout plan" />
                </SelectTrigger>
                <SelectContent>
                  {workoutPlans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button 
                onClick={scheduleWorkout} 
                disabled={!selectedPlanId || isScheduling}
              >
                {isScheduling ? "Scheduling..." : "Schedule Workout"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 