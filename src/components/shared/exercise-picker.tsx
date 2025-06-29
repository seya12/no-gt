"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Plus, Dumbbell, Loader2 } from "lucide-react"
import { Exercise } from "@prisma/client"
import { SUGGESTED_EXERCISES } from "@/lib/constants/exercises"
import { createExerciseAction } from "@/app/actions/exerciseActions"
import { toast } from "sonner"
import { ScrollArea } from "@/components/ui/scroll-area"

type ExercisePickerMode = "workout" | "plan" | "simple"

interface ExercisePickerProps {
  // Core props
  availableExercises: Exercise[]
  onExerciseSelected: (exerciseId: string, exerciseName: string, sets?: number, reps?: number, weight?: number) => void
  onExerciseCreated?: (newExercise: Exercise) => void
  
  // Mode configuration
  mode?: ExercisePickerMode
  showCreateOption?: boolean
  showSetConfiguration?: boolean
  
  // Styling
  className?: string
  maxHeight?: string
}



export function ExercisePicker({
  availableExercises,
  onExerciseSelected,
  onExerciseCreated,
  showCreateOption = true,
  showSetConfiguration = false,
  className = "",
  maxHeight = "60vh"
}: ExercisePickerProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("Strength")
  const [pickerMode, setPickerMode] = useState<"browse" | "create">("browse")
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)
  const [creatingExercise, setCreatingExercise] = useState<string | null>(null)
  
  // Exercise configuration state (for workout mode)
  const [sets, setSets] = useState<number | null>(3)
  const [reps, setReps] = useState<number | null>(12)
  const [weight, setWeight] = useState<number | null>(0)
  
  // Custom exercise creation state
  const [customExercise, setCustomExercise] = useState({ name: "", description: "" })
  const [isCreatingCustom, setIsCreatingCustom] = useState(false)

  // Get user's custom exercises (excluding system exercises)
  const getCustomExercises = () => {
    return availableExercises.filter(exercise => {
      const isSystemExercise = Object.values(SUGGESTED_EXERCISES).flat().some(
        suggestedEx => suggestedEx.name.toLowerCase() === exercise.name.toLowerCase()
      )
      return !isSystemExercise
    })
  }

  const customExercises = getCustomExercises()

  // Filter exercises based on category and search
  const getFilteredExercises = () => {
    if (selectedCategory === "My Exercises") {
      return customExercises.filter(exercise =>
        exercise.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // For system exercises, check if they exist in available exercises
    const systemExercises = SUGGESTED_EXERCISES[selectedCategory as keyof typeof SUGGESTED_EXERCISES] || []
    return systemExercises.filter(exercise =>
      exercise.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }

  // Create and add a system exercise
  const createAndAddExercise = async (name: string, description: string) => {
    setCreatingExercise(name)
    try {
      const formData = new FormData()
      formData.append("name", name)
      formData.append("description", description)
      
      const result = await createExerciseAction(undefined, formData)
      
      if (result.success && result.exercise) {
        toast.success(`Created exercise: ${name}`)
        
        // If onExerciseCreated is provided, use it (for plan mode)
        // Otherwise, use handleExerciseSelection (for workout mode)
        if (onExerciseCreated) {
          onExerciseCreated(result.exercise)
        } else {
          handleExerciseSelection(result.exercise.id, result.exercise.name)
        }
      } else {
        toast.error(result.error || "Failed to create exercise")
      }
    } catch (error) {
      console.error("Error creating exercise:", error)
      toast.error("Failed to create exercise")
    } finally {
      setCreatingExercise(null)
    }
  }

  // Create custom exercise
  const handleCreateCustomExercise = async () => {
    if (!customExercise.name.trim()) {
      toast.error("Exercise name is required")
      return
    }

    setIsCreatingCustom(true)
    try {
      const formData = new FormData()
      formData.append("name", customExercise.name.trim())
      formData.append("description", customExercise.description.trim() || "")
      
      const result = await createExerciseAction(undefined, formData)

      if (result.success && result.exercise) {
        toast.success(`Created exercise: ${customExercise.name}`)
        
        // If onExerciseCreated is provided, use it (for plan mode)
        // Otherwise, use handleExerciseSelection (for workout mode)
        if (onExerciseCreated) {
          onExerciseCreated(result.exercise)
        } else {
          handleExerciseSelection(result.exercise.id, result.exercise.name)
        }
        
        setCustomExercise({ name: "", description: "" })
        setPickerMode("browse")
      } else {
        toast.error(result.error || "Failed to create exercise")
      }
    } catch (error) {
      console.error("Error creating custom exercise:", error)
      toast.error("Failed to create exercise")
    } finally {
      setIsCreatingCustom(false)
    }
  }

  // Handle exercise selection
  const handleExerciseSelection = (exerciseId: string, exerciseName: string) => {
    if (showSetConfiguration && !selectedExercise) {
      // Find the exercise object for configuration
      const exercise = availableExercises.find(ex => ex.id === exerciseId)
      if (exercise) {
        setSelectedExercise(exercise)
        return
      }
    }
    
    // Direct selection (for plan mode or simple mode)
    onExerciseSelected(exerciseId, exerciseName, sets || undefined, reps || undefined, weight || undefined)
  }

  // Confirm exercise with configuration
  const confirmExerciseSelection = () => {
    if (!selectedExercise) return
    
    onExerciseSelected(
      selectedExercise.id,
      selectedExercise.name,
      sets || undefined,
      reps || undefined,
      weight || undefined
    )
    
    // Reset state
    setSelectedExercise(null)
    setSets(3)
    setReps(12)
    setWeight(0)
  }

  const filteredExercises = getFilteredExercises()

  return (
    <div 
      className={`space-y-4 flex flex-col ${className}`} 
      style={{ 
        height: maxHeight === "none" ? "auto" : maxHeight, 
        maxHeight, 
        minHeight: 0,
        position: 'relative'
      }}
    >
      {showSetConfiguration && selectedExercise ? (
        // Exercise configuration view (for workout mode)
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">{selectedExercise.name}</h3>
              {selectedExercise.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedExercise.description}
                </p>
              )}
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

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setSelectedExercise(null)}>
              Back
            </Button>
            <Button onClick={confirmExerciseSelection}>
              Add to Workout
            </Button>
          </div>
        </div>
      ) : (
        // Exercise selection view
        <>
          {showCreateOption && (
            <div className="flex flex-wrap gap-2">
              <Button
                variant={pickerMode === "browse" ? "default" : "outline"}
                onClick={() => setPickerMode("browse")}
              >
                Choose Exercise
              </Button>
              <Button
                variant={pickerMode === "create" ? "default" : "outline"}
                onClick={() => setPickerMode("create")}
              >
                Create Custom
              </Button>
            </div>
          )}

          {pickerMode === "browse" ? (
            <>
              {/* Search */}
              <div className="space-y-2">
                <Label htmlFor="exercise-search">Search Exercises</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="exercise-search"
                    placeholder="Search by exercise name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Category tabs */}
              <div className="min-h-[40px] flex items-start">
                <div className="flex flex-wrap gap-2">
                  {Object.keys(SUGGESTED_EXERCISES).map((category) => (
                    <Button 
                      key={category}
                      variant={selectedCategory === category ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category}
                    </Button>
                  ))}
                  {customExercises.length > 0 && (
                    <Button 
                      variant={selectedCategory === "My Exercises" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory("My Exercises")}
                    >
                      My Exercises ({customExercises.length})
                    </Button>
                  )}
                </div>
              </div>

              {/* Exercise list */}
              <ScrollArea className="flex-1 min-h-[200px]">
                <div className="space-y-2">
                {selectedCategory === "My Exercises" ? (
                  // Show user's custom exercises
                  customExercises.length > 0 ? (
                    customExercises
                      .filter(exercise => exercise.name.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((exercise) => (
                        <Card
                          key={exercise.id}
                          className="cursor-pointer hover:bg-accent/50 transition-colors"
                          onClick={() => handleExerciseSelection(exercise.id, exercise.name)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-medium">{exercise.name}</h3>
                                {exercise.description && (
                                  <p className="text-sm text-muted-foreground">
                                    {exercise.description}
                                  </p>
                                )}
                              </div>
                              <Button size="sm" variant="outline">
                                <Plus className="h-4 w-4 mr-1" /> Add
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Dumbbell className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No custom exercises yet</p>
                      <p className="text-sm">Create some using the &ldquo;Create Custom&rdquo; tab!</p>
                    </div>
                  )
                ) : (
                  // Show system exercises for selected category
                  filteredExercises.length > 0 ? (
                    filteredExercises.map((exercise) => {
                      const existingExercise = availableExercises.find(
                        (e) => e.name.toLowerCase() === exercise.name.toLowerCase()
                      )
                      const isCreating = creatingExercise === exercise.name
                      
                      return (
                        <Card
                          key={exercise.name}
                          className="cursor-pointer hover:bg-accent/50 transition-colors"
                          onClick={() => {
                            if (existingExercise && !isCreating) {
                              handleExerciseSelection(existingExercise.id, existingExercise.name)
                            }
                          }}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-medium">{exercise.name}</h3>
                                <p className="text-sm text-muted-foreground">{exercise.description}</p>
                              </div>
                              {existingExercise ? (
                                <Button size="sm" variant="outline">
                                  <Plus className="h-4 w-4 mr-1" /> Add
                                </Button>
                              ) : (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    createAndAddExercise(exercise.name, exercise.description || "")
                                  }}
                                  disabled={isCreating}
                                >
                                  {isCreating ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Adding...
                                    </>
                                  ) : (
                                    <>
                                      <Plus className="h-4 w-4 mr-1" /> Add
                                    </>
                                  )}
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Dumbbell className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No exercises found</p>
                      <p className="text-sm">Try adjusting your search or category</p>
                    </div>
                  )
                )}
                </div>
              </ScrollArea>
            </>
          ) : (
            // Create custom exercise view
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-4">Create Custom Exercise</h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="custom-name">Exercise Name *</Label>
                    <Input
                      id="custom-name"
                      placeholder="e.g., Bulgarian Split Squat"
                      value={customExercise.name}
                      onChange={(e) => setCustomExercise(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="custom-description">Description (Optional)</Label>
                    <Textarea
                      id="custom-description"
                      placeholder="Describe the exercise, muscle groups, or form cues..."
                      value={customExercise.description}
                      onChange={(e) => setCustomExercise(prev => ({ ...prev, description: e.target.value }))}
                      className="min-h-[80px]"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setPickerMode("browse")
                        setCustomExercise({ name: "", description: "" })
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleCreateCustomExercise}
                      disabled={!customExercise.name.trim() || isCreatingCustom}
                    >
                      {isCreatingCustom ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Create & Add
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
} 