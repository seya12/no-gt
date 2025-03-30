"use client"

import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Set as WorkoutSet } from "@prisma/client"
import useSWR from "swr"

interface WorkoutSessionTrackerProps {
  sessionId: string
  onComplete?: () => void
}

interface GroupedSet {
  exerciseId: string
  exerciseName: string
  sets: WorkoutSet[]
}

export function WorkoutSessionTracker({ sessionId, onComplete }: WorkoutSessionTrackerProps) {
  const { data: groupedSets, mutate } = useSWR<GroupedSet[]>(
    `/api/workout/session/${sessionId}/sets`,
    async (url: string) => {
      const response = await fetch(url)
      if (!response.ok) throw new Error("Failed to fetch sets")
      return response.json()
    }
  )

  const handleSetComplete = async (setId: string) => {
    try {
      const response = await fetch(`/api/workout/set/${setId}/complete`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to complete set")
      }

      await response.json()
      mutate()

      // Check if all sets are completed
      const allSetsCompleted = groupedSets?.every((group: GroupedSet) =>
        group.sets.every((set: WorkoutSet) => set.completed)
      )

      if (allSetsCompleted) {
        toast.success("Workout completed! Great job!", {
          description: "You've completed all sets in this workout.",
          action: {
            label: "View Summary",
            onClick: () => onComplete?.()
          }
        })
      } else {
        toast.success("Set completed!", {
          description: "Keep up the great work!"
        })
      }
    } catch (error) {
      console.error("Error completing set:", error)
      toast.error("Failed to complete set", {
        description: "Please try again."
      })
    }
  }

  const handleSetUncomplete = async (setId: string) => {
    try {
      const response = await fetch(`/api/workout/set/${setId}/uncomplete`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to uncomplete set")
      }

      await response.json()
      mutate()

      toast.success("Set uncompleted", {
        description: "Set marked as not completed."
      })
    } catch (error) {
      console.error("Error uncompleting set:", error)
      toast.error("Failed to uncomplete set", {
        description: "Please try again."
      })
    }
  }

  if (!groupedSets) {
    return <div>Loading...</div>
  }

  return (
    <ScrollArea className="h-[calc(100vh-12rem)]">
      <div className="space-y-6 p-6">
        {groupedSets.map((group: GroupedSet) => (
          <Card key={group.exerciseId}>
            <CardHeader>
              <CardTitle>{group.exerciseName}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {group.sets.map((set: WorkoutSet, index: number) => (
                  <div key={set.id} className="flex items-center space-x-4">
                    <Checkbox
                      checked={set.completed}
                      onCheckedChange={(checked: boolean | "indeterminate") => {
                        if (checked === true) {
                          handleSetComplete(set.id)
                        } else if (checked === false) {
                          handleSetUncomplete(set.id)
                        }
                      }}
                    />
                    <div>
                      <div className="font-medium">Set {index + 1}</div>
                      <div className="text-sm text-muted-foreground">
                        {set.targetReps} reps × {set.weight}kg
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  )
} 