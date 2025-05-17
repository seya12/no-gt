"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Calendar as CalendarIcon, Save } from "lucide-react";
import { Calendar } from "@/components/ui/calendar"; // Ensure this is installed
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"; // Ensure this is installed
import { cn } from "@/lib/utils";
import { toast } from 'sonner';

// Define the expected response structure from the server action
export interface UpdateScheduleResponse {
  success: boolean;
  redirectUrl?: string;
  error?: string;
  message?: string; // Optional: for success messages if not redirecting immediately
}

// Types mirroring what the server component will pass
interface WorkoutPlan {
  id: string;
  name: string;
}

interface WorkoutSessionData {
  id: string;
  date: string; // Expect ISO string from server, will be parsed to Date in useState
  workoutPlanId: string;
  workoutPlan: { name: string; };
}

interface EditScheduleFormProps {
  sessionId: string;
  workoutSession: WorkoutSessionData;
  allUserPlans: WorkoutPlan[];
  updateAction: (formData: FormData) => Promise<UpdateScheduleResponse>; // Updated return type
}

export function EditScheduleForm({
  sessionId,
  workoutSession, // workoutSession.date is now an ISO string
  allUserPlans,
  updateAction,
}: EditScheduleFormProps) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    // Parse the ISO string to a Date object for the DatePicker
    workoutSession.date ? parseISO(workoutSession.date) : undefined 
  );
  const [selectedPlanId, setSelectedPlanId] = useState<string>(workoutSession.workoutPlanId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    if (!selectedDate) {
      toast.error("Please select a date.");
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData();
    formData.append("sessionId", sessionId);
    formData.append("planId", selectedPlanId);
    formData.append("date", format(selectedDate, "yyyy-MM-dd"));

    try {
      const response = await updateAction(formData);
      
      if (response.success) {
        toast.success(response.message || "Workout rescheduled successfully!");
        if (response.redirectUrl) {
          router.push(response.redirectUrl); // Client-side redirect
        }
      } else {
        toast.error(response.error || "Failed to reschedule workout.");
      }
    } catch (error) {
      // This catch block is for unexpected errors from the action not returning the above structure
      console.error("Unexpected error during form submission:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Editing: {workoutSession.workoutPlan.name}</CardTitle>
          <CardDescription>
            Currently scheduled for: {format(parseISO(workoutSession.date), 'EEEE, MMMM d, yyyy')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label htmlFor="planId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Workout Plan
            </label>
            <select 
              id="planId" 
              name="planId"
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              disabled={isSubmitting}
            >
              {allUserPlans.map(plan => (
                <option key={plan.id} value={plan.id}>
                  {plan.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              New Date
            </label>
            <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                  disabled={isSubmitting}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date: Date | undefined) => {
                    setSelectedDate(date);
                    setIsDatePickerOpen(false); // Close picker on select
                  }}
                  initialFocus
                  disabled={isSubmitting}
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? "Updating..." : "Update Schedule"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
} 