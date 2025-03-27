import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth/auth.config";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { format } from "date-fns";
import { WorkoutSession, Set } from "@prisma/client";

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
      date: 'desc',
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
      <div className="flex flex-col items-center justify-center min-h-screen py-12 bg-gray-50">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Workout History</h1>
          <p className="text-gray-600">No workout sessions found. Start a workout to see your history!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Workout History</h1>
      <div className="space-y-6">
        {workoutHistory.map((session: WorkoutSessionWithRelations) => (
          <div key={session.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{session.workoutPlan.name}</h2>
              <span className="text-gray-600">
                {format(new Date(session.date), 'PPP')}
              </span>
            </div>
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
              }, []).map((exercise: ExerciseGroup) => (
                <div key={exercise.exerciseId} className="border-t pt-4">
                  <h3 className="font-medium mb-2">{exercise.exerciseName}</h3>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    {exercise.sets.map((set) => (
                      <div key={set.id} className="bg-gray-50 p-2 rounded">
                        <p>{set.actualReps || set.targetReps} reps</p>
                        <p>{set.weight} kg</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 