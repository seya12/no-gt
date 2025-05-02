"use client";

import { format, isSameDay } from "date-fns";
import Link from "next/link";
import { CalendarClock } from "lucide-react";

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
}

export function CalendarDay({ day, today, workouts }: CalendarDayProps) {
  const isToday = isSameDay(day, today);
  const isPast = day < today && !isToday;
  
  // Separate completed and scheduled workouts
  const completedWorkouts = workouts.filter(w => !w.scheduled);
  const scheduledWorkouts = workouts.filter(w => w.scheduled);
  
  // For mobile displays, calculate if we need to truncate content
  const totalWorkouts = completedWorkouts.length + scheduledWorkouts.length;
  const formattedDate = format(day, 'yyyy-MM-dd');

  return (
    <Link
      href={`/workout/day/${formattedDate}`}
      className={`p-1 sm:p-2 border rounded-md h-full min-h-[70px] overflow-y-auto relative ${
        isToday ? 'bg-accent/50 border-primary' : isPast ? 'bg-muted/10' : ''
      }`}
    >
      <div className="text-xs sm:text-base font-medium">{format(day, 'd')}</div>
      
      <div className="space-y-0.5 sm:space-y-1 mt-0.5 sm:mt-1">
        {/* If too many workouts for mobile, show count instead */}
        {totalWorkouts > 2 && window.innerWidth < 640 ? (
          <div className="text-[10px] sm:text-xs p-0.5 sm:p-1 bg-secondary/20 rounded text-center">
            {totalWorkouts} workouts
          </div>
        ) : (
          <>
            {/* Completed workouts */}
            {completedWorkouts.map((workout) => (
              <div
                key={workout.id}
                className="text-[10px] sm:text-xs p-0.5 sm:p-1 bg-primary/10 rounded truncate"
              >
                {workout.workoutPlan.name}
              </div>
            ))}
            
            {/* Scheduled workouts */}
            {scheduledWorkouts.map((workout) => (
              <div
                key={workout.id}
                className="text-[10px] sm:text-xs p-0.5 sm:p-1 bg-accent/30 rounded truncate flex items-center"
              >
                <CalendarClock className="h-2 w-2 sm:h-3 sm:w-3 mr-0.5 sm:mr-1 opacity-70" />
                {workout.workoutPlan.name}
              </div>
            ))}
          </>
        )}
      </div>
    </Link>
  );
} 