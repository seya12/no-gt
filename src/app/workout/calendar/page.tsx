import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authConfig } from "@/lib/auth/auth.config";
import { prisma } from "@/lib/db";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from "date-fns";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDay } from "@/components/workout/calendar-day";

interface CalendarPageProps {
  searchParams: Promise<{
    month?: string;
    year?: string;
  }>
}

export default async function CalendarPage({
  searchParams,
}: CalendarPageProps) {
  const session = await getServerSession(authConfig);

  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  // Get current date or use the one from query params
  const today = new Date();
  const { month: monthParam, year: yearParam } = await searchParams;
  
  const month = monthParam 
    ? parseInt(monthParam) - 1 
    : today.getMonth();
  const year = yearParam 
    ? parseInt(yearParam) 
    : today.getFullYear();
  
  const currentDate = new Date(year, month);
  
  // Get start and end of month
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  
  // Get all days in the month
  const daysInMonth = eachDayOfInterval({
    start: monthStart,
    end: monthEnd,
  });

  // Fetch workout sessions for the selected month
  const workouts = await prisma.workoutSession.findMany({
    where: {
      userId: session.user.id,
      date: {
        gte: monthStart,
        lte: monthEnd,
      },
    },
    include: {
      workoutPlan: true,
    },
    orderBy: {
      date: "asc",
    },
  });
  
  // Fetch all workout plans for this user (for scheduling)
  const workoutPlans = await prisma.workoutPlan.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
    },
  });

  // Create navigation links
  const prevMonth = subMonths(currentDate, 1);
  const nextMonth = addMonths(currentDate, 1);
  
  const prevMonthLink = `/workout/calendar?month=${prevMonth.getMonth() + 1}&year=${prevMonth.getFullYear()}`;
  const nextMonthLink = `/workout/calendar?month=${nextMonth.getMonth() + 1}&year=${nextMonth.getFullYear()}`;

  return (
    <div className="container mx-auto p-2 sm:p-4 pb-16 flex flex-col h-[calc(100vh-4rem)] space-y-4">
      <Card className="flex-1 flex flex-col">
        <CardHeader className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0 p-4">
          <CardTitle className="text-xl font-bold">Workout Calendar</CardTitle>
          <div className="flex items-center space-x-2">
            <Link href={prevMonthLink}>
              <Button variant="outline" size="icon">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="font-medium min-w-[120px] text-center">
              {format(currentDate, 'MMMM yyyy')}
            </div>
            <Link href={nextMonthLink}>
              <Button variant="outline" size="icon">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-1 sm:p-4 flex-1 flex flex-col">
          {/* Day labels - abbreviate on mobile */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <div key={day + i} className="p-1 font-medium text-xs sm:text-sm sm:p-2">
                <span className="hidden sm:inline">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i]}</span>
                <span className="sm:hidden">{day}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 flex-1 h-full">
            {/* Add empty cells for days before the start of the month */}
            {Array.from({ length: monthStart.getDay() }).map((_, i) => (
              <div key={`empty-start-${i}`} className="p-1 h-auto"></div>
            ))}

            {/* Calendar days */}
            {daysInMonth.map((day) => {
              const dayWorkouts = workouts.filter((workout) => 
                isSameDay(new Date(workout.date), day)
              );
              
              return (
                <CalendarDay
                  key={day.toISOString()}
                  day={day}
                  today={today}
                  workouts={dayWorkouts}
                  workoutPlans={workoutPlans}
                />
              );
            })}

            {/* Add empty cells for days after the end of the month */}
            {Array.from({ length: 6 - monthEnd.getDay() }).map((_, i) => (
              <div key={`empty-end-${i}`} className="p-1 h-auto"></div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Legend */}
      <div className="text-xs sm:text-sm flex justify-center space-x-4">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-primary/10 rounded mr-1"></div>
          <span>Completed</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-accent/30 rounded mr-1"></div>
          <span>Scheduled</span>
        </div>
      </div>
    </div>
  );
} 