import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authConfig } from "@/lib/auth/auth.config";
import { prisma } from "@/lib/db";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from "date-fns";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  
  // Create navigation links
  const prevMonth = subMonths(currentDate, 1);
  const nextMonth = addMonths(currentDate, 1);
  
  const prevMonthLink = `/workout/calendar?month=${prevMonth.getMonth() + 1}&year=${prevMonth.getFullYear()}`;
  const nextMonthLink = `/workout/calendar?month=${nextMonth.getMonth() + 1}&year=${nextMonth.getFullYear()}`;
  const todayLink = `/workout/calendar?month=${today.getMonth() + 1}&year=${today.getFullYear()}`;

  return (
    <div className="container mx-auto p-4 pb-20 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center justify-center">
          <Calendar className="h-8 w-8 mr-3 text-primary" />
          Workout Calendar
        </h1>
        <p className="text-muted-foreground text-lg">
          Plan and track your fitness schedule
        </p>
      </div>

      {/* Calendar */}
      <Card className="shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">
                {format(currentDate, 'MMMM yyyy')}
              </CardTitle>
              <CardDescription className="text-base mt-1">
                Click on any day to view or schedule workouts
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Link href={prevMonthLink}>
                <Button variant="outline" size="icon" className="hover:bg-primary hover:text-primary-foreground">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </Link>
              <Link href={todayLink}>
                <Button variant="outline" size="sm" className="hover:bg-primary hover:text-primary-foreground">
                  Today
                </Button>
              </Link>
              <Link href={nextMonthLink}>
                <Button variant="outline" size="icon" className="hover:bg-primary hover:text-primary-foreground">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
              <div key={day} className="p-2 text-center font-medium text-muted-foreground text-sm">
                <span className="hidden sm:inline">{day.slice(0, 3)}</span>
                <span className="sm:hidden">{day.slice(0, 1)}</span>
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for days before the start of the month */}
            {Array.from({ length: monthStart.getDay() }).map((_, i) => (
              <div key={`empty-start-${i}`} className="h-20 sm:h-24"></div>
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
                />
              );
            })}

            {/* Empty cells for days after the end of the month */}
            {Array.from({ length: 6 - monthEnd.getDay() }).map((_, i) => (
              <div key={`empty-end-${i}`} className="h-20 sm:h-24"></div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Legend */}
      <div className="flex items-center justify-center space-x-6 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500/30 border border-green-500/50 rounded"></div>
          <span>Completed</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-orange-500/30 border border-orange-500/50 rounded"></div>
          <span>Scheduled</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-primary/30 border border-primary/50 rounded"></div>
          <span>Today</span>
        </div>
      </div>
    </div>
  );
} 