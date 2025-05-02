"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  addMonths, 
  subMonths 
} from "date-fns";

interface WorkoutDay {
  date: Date;
  hasWorkout: boolean;
  scheduled: boolean;
}

interface MiniCalendarProps {
  workoutDays: WorkoutDay[];
}

export function MiniCalendar({ workoutDays }: MiniCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const today = new Date();
  
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  
  const daysInMonth = eachDayOfInterval({
    start: monthStart,
    end: monthEnd,
  });
  
  const navigatePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };
  
  const navigateNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };
  
  const isWorkoutDay = (day: Date): { hasWorkout: boolean, scheduled: boolean } => {
    const workout = workoutDays.find(wd => isSameDay(new Date(wd.date), day));
    return {
      hasWorkout: !!workout,
      scheduled: workout?.scheduled || false
    };
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium flex items-center">
          <Calendar className="h-4 w-4 mr-2" />
          Calendar
        </CardTitle>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={navigatePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-sm font-medium">
            {format(currentDate, 'MMM yyyy')}
          </div>
          <Button variant="ghost" size="icon" onClick={navigateNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
            <div key={i} className="p-1 font-medium">
              {day}
            </div>
          ))}
          
          {/* Empty cells for days before the start of the month */}
          {Array.from({ length: monthStart.getDay() }).map((_, i) => (
            <div key={`empty-start-${i}`} className="p-1"></div>
          ))}
          
          {/* Days of the month */}
          {daysInMonth.map((day) => {
            const { hasWorkout, scheduled } = isWorkoutDay(day);
            const isToday = isSameDay(day, today);
            
            return (
              <Link 
                key={day.toISOString()} 
                href={`/workout/calendar?month=${day.getMonth() + 1}&year=${day.getFullYear()}`}
              >
                <div 
                  className={`
                    p-1 aspect-square flex items-center justify-center text-center rounded-full
                    cursor-pointer hover:bg-accent/50 transition-colors
                    ${isToday ? 'bg-primary text-primary-foreground' : ''}
                    ${hasWorkout && !isToday && !scheduled ? 'bg-primary/20' : ''}
                    ${scheduled && !isToday ? 'bg-accent/30' : ''}
                  `}
                >
                  {format(day, 'd')}
                </div>
              </Link>
            );
          })}
          
          {/* Empty cells for days after the end of the month */}
          {Array.from({ length: 6 - monthEnd.getDay() }).map((_, i) => (
            <div key={`empty-end-${i}`} className="p-1"></div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 