"use client";

import { format, isSameDay } from "date-fns";
import Link from "next/link";
import { CalendarClock, CheckCircle } from "lucide-react";

interface CalendarDayProps {
  day: Date;
  today: Date;
  workouts: Array<{
    id: string;
    scheduled?: boolean;
    completedAt?: Date | null;
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
  const completedWorkouts = workouts.filter(w => w.completedAt || !w.scheduled);
  const scheduledWorkouts = workouts.filter(w => w.scheduled && !w.completedAt);
  
  const totalWorkouts = completedWorkouts.length + scheduledWorkouts.length;
  const formattedDate = format(day, 'yyyy-MM-dd');

  return (
    <Link
      href={`/workout/day/${formattedDate}`}
      className={`
        group relative h-20 sm:h-24 p-2 border rounded-lg transition-all duration-200 
        hover:shadow-md hover:border-primary/50
        ${isToday 
          ? 'bg-primary/10 border-primary/50 shadow-sm' 
          : isPast 
            ? 'bg-muted/30 border-border/50 hover:bg-muted/40' 
            : 'bg-background border-border hover:bg-accent/30'
        }
      `}
    >
      {/* Day number */}
      <div className={`
        text-sm sm:text-base font-semibold mb-1 flex items-center justify-between
        ${isToday ? 'text-primary' : isPast ? 'text-muted-foreground' : 'text-foreground'}
      `}>
        <span>{format(day, 'd')}</span>
        {isToday && (
          <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
        )}
      </div>
      
      {/* Workouts */}
      <div className="space-y-0.5 overflow-hidden">
        {totalWorkouts === 0 ? (
          <div className="text-center py-1 opacity-0 group-hover:opacity-60 transition-opacity">
            <div className="w-1 h-1 bg-muted-foreground/30 rounded-full mx-auto"></div>
          </div>
        ) : (
          <>
            {/* Show up to 3 workouts */}
            {[...completedWorkouts.slice(0, 3), ...scheduledWorkouts.slice(0, 3 - completedWorkouts.slice(0, 3).length)].map((workout) => (
              <div
                key={workout.id}
                className={`
                  text-xs px-1.5 py-0.5 rounded truncate flex items-center space-x-1
                  ${workout.completedAt || !workout.scheduled
                    ? 'bg-green-500/20 text-green-700' 
                    : 'bg-orange-500/20 text-orange-700'
                  }
                `}
              >
                {workout.completedAt || !workout.scheduled ? (
                  <CheckCircle className="h-2 w-2 flex-shrink-0" />
                ) : (
                  <CalendarClock className="h-2 w-2 flex-shrink-0" />
                )}
                <span className="truncate text-xs">{workout.workoutPlan.name}</span>
              </div>
            ))}
            
            {/* Show count if more than 3 workouts */}
            {totalWorkouts > 3 && (
              <div className="text-xs text-center text-muted-foreground py-0.5">
                +{totalWorkouts - 3} more
              </div>
            )}
          </>
        )}
      </div>
    </Link>
  );
} 