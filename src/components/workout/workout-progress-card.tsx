"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, Loader2 } from "lucide-react"

interface WorkoutProgressCardProps {
  progressValue: number
  completedSetsCount: number
  totalSetsCount: number
  allSetsCompleted: boolean
  onFinishWorkoutClick: () => void
  isCompletingWorkout: boolean
}

export function WorkoutProgressCard({
  progressValue,
  completedSetsCount,
  totalSetsCount,
  allSetsCompleted,
  onFinishWorkoutClick,
  isCompletingWorkout,
}: WorkoutProgressCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Workout Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <Progress value={progressValue} className="w-full" />
        <p className="text-sm text-muted-foreground mt-2">
          {completedSetsCount} of {totalSetsCount} sets completed.
        </p>
        {allSetsCompleted && (
          <Button 
            onClick={onFinishWorkoutClick} 
            className="w-full mt-4" 
            disabled={isCompletingWorkout}
          >
            {isCompletingWorkout ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
            Finish Workout
          </Button>
        )}
      </CardContent>
    </Card>
  )
} 