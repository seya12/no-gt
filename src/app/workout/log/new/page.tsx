import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/db"
import { authConfig } from "@/lib/auth/auth.config"
import { format, parseISO } from "date-fns"
import { LogWorkoutForm } from "@/components/workout/log-workout-form"

interface LogWorkoutNewPageProps {
  searchParams: Promise<{
    planId?: string
    date?: string // YYYY-MM-DD format
  }>
}

export default async function LogWorkoutNewPage({
  searchParams,
}: LogWorkoutNewPageProps) {
  const { planId, date } = await searchParams
  
  if (!planId || !date) {
    redirect("/workout/log")
  }
  
  const session = await getServerSession(authConfig)
  
  if (!session?.user) {
    redirect("/api/auth/signin")
  }
  
  // Fetch the workout plan with exercises
  const workoutPlan = await prisma.workoutPlan.findUnique({
    where: {
      id: planId,
      userId: session.user.id,
    },
    include: {
      exercises: {
        include: {
          exercise: true,
        },
        orderBy: {
          id: "asc",
        },
      },
    },
  })
  
  if (!workoutPlan) {
    redirect("/workout/log")
  }
  
  const selectedDate = parseISO(date)
  
  return (
    <div className="container p-4 md:py-6 space-y-6">
      <div className="flex items-center space-x-2">
        <h1 className="text-2xl font-bold">Log Workout</h1>
      </div>
      
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">{workoutPlan.name}</h2>
        <p className="text-muted-foreground">
          {format(selectedDate, 'MMMM d, yyyy')}
        </p>
      </div>
      
      <LogWorkoutForm 
        workoutPlan={workoutPlan}
        date={date}
      />
    </div>
  )
} 