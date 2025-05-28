import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth/auth.config";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { format, isThisWeek, differenceInDays } from "date-fns";
import { WorkoutSession, Set } from "@prisma/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, TrendingUp, Target, Dumbbell, Clock, Weight, RotateCcw } from "lucide-react";
import Link from "next/link";
import DeleteWorkoutButton from "./delete-button";

type WorkoutSessionWithRelations = WorkoutSession & {
  workoutPlan: {
    name: string;
  };
  sets: (Set & {
    exercise: {
      id: string;
      name: string;
    };
  })[];
};

type ExerciseGroup = {
  exerciseId: string;
  exerciseName: string;
  sets: (Set & {
    exercise: {
      id: string;
      name: string;
    };
  })[];
};

async function getWorkoutHistory(): Promise<WorkoutSessionWithRelations[] | null> {
  const session = await getServerSession(authConfig);
  
  if (!session?.user) {
    return null;
  }

  return await prisma.workoutSession.findMany({
    where: {
      userId: session.user.id,
      completedAt: { not: null }, // Only show completed workouts
    },
    include: {
      workoutPlan: true,
      sets: {
        include: {
          exercise: true,
        },
      },
    },
    orderBy: {
      completedAt: 'desc',
    },
  });
}

export default async function WorkoutHistoryPage() {
  const session = await getServerSession(authConfig);
  
  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  const workoutHistory = await getWorkoutHistory();

  if (!workoutHistory || workoutHistory.length === 0) {
    return (
      <div className="container mx-auto p-4 pb-20 space-y-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500/10 via-indigo-500/5 to-background border border-purple-500/20 p-6 md:p-8">
          <div className="relative z-10">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center">
              <TrendingUp className="h-8 w-8 mr-3 text-purple-500" />
              Workout History
            </h1>
            <p className="text-muted-foreground text-lg">
              Track your fitness journey and celebrate your progress
            </p>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl"></div>
        </div>

        {/* Empty State */}
        <Card className="shadow-lg">
          <CardContent className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="p-4 rounded-full bg-purple-500/10 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <TrendingUp className="h-10 w-10 text-purple-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Start Your Fitness Journey</h3>
              <p className="text-muted-foreground mb-6">
                Complete your first workout to start tracking your progress and building healthy habits.
              </p>
              <Link href="/dashboard">
                <Button size="lg" className="bg-purple-500 hover:bg-purple-600">
                  <Dumbbell className="mr-2 h-5 w-5" />
                  Start a Workout
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate stats
  const totalWorkouts = workoutHistory.length;
  const thisWeekWorkouts = workoutHistory.filter(session => 
    session.completedAt && isThisWeek(new Date(session.completedAt))
  ).length;
  const totalSets = workoutHistory.reduce((sum, session) => sum + session.sets.length, 0);
  const lastWorkout = workoutHistory[0];
  const daysSinceLastWorkout = lastWorkout?.completedAt 
    ? differenceInDays(new Date(), new Date(lastWorkout.completedAt))
    : 0;

  return (
    <div className="container mx-auto p-4 pb-20 space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500/10 via-indigo-500/5 to-background border border-purple-500/20 p-6 md:p-8">
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center">
                <TrendingUp className="h-8 w-8 mr-3 text-purple-500" />
                Workout History
              </h1>
              <p className="text-muted-foreground text-lg">
                Track your fitness journey and celebrate your progress
              </p>
            </div>
            <Link href="/dashboard">
              <Button size="lg" className="bg-purple-500 hover:bg-purple-600 shadow-lg">
                <Dumbbell className="mr-2 h-5 w-5" />
                New Workout
              </Button>
            </Link>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl"></div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-background">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Target className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalWorkouts}</p>
                <p className="text-sm text-muted-foreground">Total Workouts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-background">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Calendar className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{thisWeekWorkouts}</p>
                <p className="text-sm text-muted-foreground">This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-background">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalSets}</p>
                <p className="text-sm text-muted-foreground">Total Sets</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-background">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-orange-500/20">
                <Clock className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{daysSinceLastWorkout}</p>
                <p className="text-sm text-muted-foreground">Days Since Last</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workout Sessions */}
      <div className="space-y-6">
        {workoutHistory.map((session) => (
          <Card key={session.id} className="shadow-lg hover:shadow-xl transition-shadow duration-200">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-lg bg-primary/10">
                    <Dumbbell className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{session.workoutPlan.name}</CardTitle>
                    <CardDescription className="flex items-center mt-1">
                      <Calendar className="h-4 w-4 mr-1" />
                      {session.completedAt ? format(new Date(session.completedAt), 'PPP') : format(new Date(session.date), 'PPP')}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="bg-green-500/10 text-green-700 border-green-500/20">
                    Completed
                  </Badge>
                  <DeleteWorkoutButton workoutId={session.id} />
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="space-y-4">
                {session.sets.reduce((acc: ExerciseGroup[], set) => {
                  const existingExercise = acc.find(
                    (item) => item.exerciseId === set.exerciseId
                  );

                  if (existingExercise) {
                    existingExercise.sets.push(set);
                  } else {
                    acc.push({
                      exerciseId: set.exerciseId,
                      exerciseName: set.exercise.name,
                      sets: [set],
                    });
                  }

                  return acc;
                }, []).map((exercise) => (
                  <div key={exercise.exerciseId} className="border-t border-border/50 pt-4 first:border-t-0 first:pt-0">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="p-1.5 rounded bg-primary/10">
                        <Target className="h-4 w-4 text-primary" />
                      </div>
                      <h3 className="font-semibold text-lg">{exercise.exerciseName}</h3>
                      <Badge variant="outline" className="ml-auto">
                        {exercise.sets.length} sets
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {exercise.sets.map((set, index) => (
                        <div key={set.id} className="p-3 rounded-lg bg-accent/20 border border-accent/30">
                          <div className="text-center space-y-1">
                            <p className="text-xs text-muted-foreground font-medium">Set {index + 1}</p>
                            <div className="flex items-center justify-center space-x-1">
                              <RotateCcw className="h-3 w-3 text-primary" />
                              <span className="font-semibold">{set.actualReps || set.targetReps}</span>
                            </div>
                            <div className="flex items-center justify-center space-x-1">
                              <Weight className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">{set.weight}kg</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 