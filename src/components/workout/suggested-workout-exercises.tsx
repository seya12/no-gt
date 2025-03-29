"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Exercise } from "@prisma/client";
import { Loader2, Plus } from "lucide-react";
import { SUGGESTED_EXERCISES } from "@/lib/constants/exercises";
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface SuggestedWorkoutExercisesProps {
  availableExercises: Exercise[];
  onAddExercise: (exerciseId: string, defaultSets?: number, defaultReps?: number) => void;
  onExerciseCreated?: (newExercise: Exercise) => void;
}

export function SuggestedWorkoutExercises({ 
  availableExercises, 
  onAddExercise,
  onExerciseCreated,
}: SuggestedWorkoutExercisesProps) {
  const [mode, setMode] = useState<"exercises" | "custom">("exercises");
  const [selectedCategory, setSelectedCategory] = useState<string>("Strength");
  const [creatingExercise, setCreatingExercise] = useState<string | null>(null);
  const [customExercise, setCustomExercise] = useState({ name: "", description: "" });
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);

  // Create custom exercise
  const handleCreateCustomExercise = async () => {
    if (!customExercise.name || isCreatingCustom) return;
    
    setIsCreatingCustom(true);
    
    try {
      const response = await fetch('/api/exercises', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customExercise),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create exercise');
      }
      
      const newExercise = await response.json();
      
      if (onExerciseCreated) {
        onExerciseCreated(newExercise);
      }
      
      // Reset form
      setCustomExercise({ name: "", description: "" });
      setMode("exercises");
    } catch (error) {
      console.error('Error creating custom exercise:', error);
    } finally {
      setIsCreatingCustom(false);
    }
  };

  // Create and add an exercise
  const createAndAddExercise = async (name: string, description: string) => {
    setCreatingExercise(name);
    
    try {
      const response = await fetch('/api/exercises', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, description }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create exercise');
      }
      
      const newExercise = await response.json();
      
      if (onExerciseCreated) {
        onExerciseCreated(newExercise);
      }
      
      onAddExercise(newExercise.id, 3, 10);
    } catch (error) {
      console.error('Error creating exercise:', error);
    } finally {
      setCreatingExercise(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button
          variant={mode === "exercises" ? "default" : "outline"}
          onClick={() => setMode("exercises")}
        >
          Choose Exercise
        </Button>
        <Button
          variant={mode === "custom" ? "default" : "outline"}
          onClick={() => setMode("custom")}
        >
          Create Custom
        </Button>
      </div>

      {mode === "exercises" && (
        <div className="space-y-6">
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
          </div>

          <div className="grid gap-4">
            {SUGGESTED_EXERCISES[selectedCategory as keyof typeof SUGGESTED_EXERCISES].map((exercise) => {
              const existingExercise = availableExercises.find(
                (e) => e.name.toLowerCase() === exercise.name.toLowerCase()
              );
              
              const isCreating = creatingExercise === exercise.name;
              
              return (
                <div 
                  key={exercise.name} 
                  className="flex items-center justify-between p-3 border rounded-md hover:bg-accent/50 transition-colors"
                >
                  <div>
                    <h3 className="font-medium">{exercise.name}</h3>
                    <p className="text-sm text-muted-foreground">{exercise.description}</p>
                  </div>
                  {existingExercise ? (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onAddExercise(existingExercise.id, 3, 10)}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                  ) : (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => createAndAddExercise(exercise.name, exercise.description || "")}
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
              );
            })}
          </div>
        </div>
      )}

      {mode === "custom" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Exercise Name</Label>
            <Input
              id="name"
              placeholder="e.g., Cable Flyes"
              value={customExercise.name}
              onChange={(e) => setCustomExercise(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the exercise..."
              value={customExercise.description}
              onChange={(e) => setCustomExercise(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>
          <Button 
            className="w-full" 
            onClick={handleCreateCustomExercise}
            disabled={isCreatingCustom || !customExercise.name}
          >
            {isCreatingCustom ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" /> Create Exercise
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
} 