"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Dumbbell } from "lucide-react"
import { addExerciseToSessionAction } from "@/app/actions/workoutSessionActions"



type Exercise = {
  id: string
  name: string
  category: string
  muscleGroups: string[]
}

interface AddExerciseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sessionId: string
  onExerciseAdded: (exerciseData: {
    exerciseId: string
    exerciseName: string
    sets: Array<{
      id: string
      exerciseId: string
      targetReps: number
      weight: number
      completed: boolean
    }>
  }) => void
  availableExercises: Exercise[]
}

export function AddExerciseDialog({
  open,
  onOpenChange,
  sessionId,
  onExerciseAdded,
  availableExercises
}: AddExerciseDialogProps) {
  const [selectedCategory, setSelectedCategory] = useState("strength")
  const [searchQuery, setSearchQuery] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  
  // Form state for adding exercise
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)
  const [sets, setSets] = useState<number | null>(3)
  const [reps, setReps] = useState<number | null>(12)
  const [weight, setWeight] = useState<number | null>(0)

  // Filter exercises based on category and search
  const filteredExercises = availableExercises.filter(exercise => {
    const matchesCategory = exercise.category.toLowerCase() === selectedCategory.toLowerCase()
    const matchesSearch = exercise.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const handleAddExercise = async () => {
    if (!selectedExercise) {
      toast.error("Please select an exercise")
      return
    }

    if (!sets || !reps || sets < 1 || reps < 1) {
      toast.error("Sets and reps must be at least 1")
      return
    }

    setIsAdding(true)

    try {
      const result = await addExerciseToSessionAction({
        sessionId,
        exerciseId: selectedExercise.id,
        sets: sets!,
        reps: reps!,
        weight: weight || 0,
      })

      if (result.success && result.sets) {
        toast.success(`Added ${selectedExercise.name} to workout!`)
        
        // Notify parent component
        onExerciseAdded({
          exerciseId: selectedExercise.id,
          exerciseName: selectedExercise.name,
          sets: result.sets.map(set => ({
            id: set.id,
            exerciseId: set.exerciseId,
            targetReps: set.targetReps,
            weight: set.weight,
            completed: set.completed,
          }))
        })

        // Reset form and close dialog
        setSelectedExercise(null)
        setSets(3)
        setReps(12)
        setWeight(0)
        setSearchQuery("")
        onOpenChange(false)
      } else {
        toast.error(result.error || "Failed to add exercise")
      }
    } catch (error) {
      console.error("Error adding exercise:", error)
      toast.error("An unexpected error occurred")
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            Add Exercise to Workout
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-4">
          {!selectedExercise ? (
            // Exercise selection view
            <>
              <div className="space-y-2">
                <Label htmlFor="search">Search Exercises</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by exercise name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="strength">Strength</TabsTrigger>
                  <TabsTrigger value="isolation">Isolation</TabsTrigger>
                  <TabsTrigger value="compound">Compound</TabsTrigger>
                </TabsList>

                <TabsContent value={selectedCategory} className="space-y-2 max-h-60 overflow-y-auto">
                  {filteredExercises.length > 0 ? (
                    filteredExercises.map((exercise) => (
                      <Card
                        key={exercise.id}
                        className="cursor-pointer hover:bg-accent/50 transition-colors"
                        onClick={() => setSelectedExercise(exercise)}
                      >
                        <CardHeader className="py-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">{exercise.name}</CardTitle>
                            <div className="flex gap-1">
                              {exercise.muscleGroups.slice(0, 2).map((muscle) => (
                                <Badge key={muscle} variant="outline" className="text-xs">
                                  {muscle}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </CardHeader>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Dumbbell className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No exercises found</p>
                      <p className="text-sm">Try adjusting your search or category</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </>
          ) : (
            // Exercise configuration view
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{selectedExercise.name}</h3>
                  <div className="flex gap-1 mt-1">
                    {selectedExercise.muscleGroups.map((muscle) => (
                      <Badge key={muscle} variant="outline" className="text-xs">
                        {muscle}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedExercise(null)}
                >
                  Change Exercise
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sets">Sets</Label>
                  <Input
                    id="sets"
                    type="number"
                    value={sets ?? ""}
                    onChange={(e) => {
                      const value = e.target.value
                      setSets(value === "" ? null : parseInt(value) || null)
                    }}
                    min="1"
                    max="10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reps">Reps</Label>
                  <Input
                    id="reps"
                    type="number"
                    value={reps ?? ""}
                    onChange={(e) => {
                      const value = e.target.value
                      setReps(value === "" ? null : parseInt(value) || null)
                    }}
                    min="1"
                    max="50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    value={weight ?? ""}
                    onChange={(e) => {
                      const value = e.target.value
                      setWeight(value === "" ? null : parseFloat(value) || null)
                    }}
                    min="0"
                    step="0.5"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {selectedExercise && (
            <Button onClick={handleAddExercise} disabled={isAdding}>
              {isAdding ? "Adding..." : "Add to Workout"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 