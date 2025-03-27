import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authConfig } from "@/lib/auth/auth.config";
import { prisma } from "@/lib/db";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from "date-fns";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: { month?: string; year?: string };
}) {
  const session = await getServerSession(authConfig);

  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  // Get current date or use the one from query params
  const today = new Date();
  const month = searchParams.month 
    ? parseInt(searchParams.month) - 1 
    : today.getMonth();
  const year = searchParams.year 
    ? parseInt(searchParams.year) 
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

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-bold">Workout Calendar</CardTitle>
          <div className="flex items-center space-x-2">
            <Link href={prevMonthLink}>
              <Button variant="outline" size="icon">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="font-medium">
              {format(currentDate, 'MMMM yyyy')}
            </div>
            <Link href={nextMonthLink}>
              <Button variant="outline" size="icon">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 text-center">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="p-2 font-semibold">
                {day}
              </div>
            ))}

            {/* Add empty cells for days before the start of the month */}
            {Array.from({ length: monthStart.getDay() }).map((_, i) => (
              <div key={`empty-start-${i}`} className="p-2 h-24"></div>
            ))}

            {/* Calendar days */}
            {daysInMonth.map((day) => {
              const dayWorkouts = workouts.filter((workout) => 
                isSameDay(new Date(workout.date), day)
              );
              
              const isToday = isSameDay(day, today);
              
              return (
                <div 
                  key={day.toISOString()} 
                  className={`p-2 border rounded-md h-24 overflow-y-auto ${
                    isToday ? 'bg-accent/50 border-primary' : ''
                  }`}
                >
                  <div className="font-medium">{format(day, 'd')}</div>
                  <div className="space-y-1 mt-1">
                    {dayWorkouts.map((workout) => (
                      <Link 
                        key={workout.id} 
                        href={`/workout/session/${workout.id}`}
                      >
                        <div className="text-xs p-1 bg-primary/10 rounded truncate">
                          {workout.workoutPlan.name}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Add empty cells for days after the end of the month */}
            {Array.from({ length: 6 - monthEnd.getDay() }).map((_, i) => (
              <div key={`empty-end-${i}`} className="p-2 h-24"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 