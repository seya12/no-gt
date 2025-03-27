"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Exercise } from "@prisma/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Define suggested exercise categories and exercises
const SUGGESTED_EXERCISES = {
  "Strength": [
    { name: "Squat", description: "Compound lower body exercise targeting quads, hamstrings, and glutes." },
    { name: "Deadlift", description: "Full body compound exercise that primarily targets the posterior chain." },
    { name: "Bench Press", description: "Upper body compound exercise focusing on chest, shoulders, and triceps." },
    { name: "Overhead Press", description: "Compound exercise targeting shoulders and triceps." },
    { name: "Barbell Row", description: "Compound back exercise focusing on lats and upper back muscles." },
    { name: "Pull-up", description: "Upper body exercise that targets the lats, biceps, and grip strength." },
  ],
  "Isolation": [
    { name: "Bicep Curl", description: "Isolation exercise targeting the biceps." },
    { name: "Tricep Extension", description: "Isolation exercise targeting the triceps." },
    { name: "Leg Extension", description: "Isolation exercise targeting the quadriceps." },
    { name: "Leg Curl", description: "Isolation exercise targeting the hamstrings." },
    { name: "Lateral Raise", description: "Isolation exercise targeting the lateral deltoids." },
    { name: "Calf Raise", description: "Isolation exercise targeting the calf muscles." },
  ],
  "Bodyweight": [
    { name: "Push-up", description: "Bodyweight exercise targeting chest, shoulders, and triceps." },
    { name: "Bodyweight Squat", description: "Bodyweight exercise targeting quads, hamstrings, and glutes." },
    { name: "Lunge", description: "Bodyweight or weighted exercise targeting quads, hamstrings, and glutes." },
    { name: "Plank", description: "Core stability exercise targeting the entire core region." },
    { name: "Mountain Climber", description: "Dynamic bodyweight exercise targeting core and cardiovascular system." },
    { name: "Burpee", description: "Full body exercise that combines strength and cardio elements." },
  ],
};

// Define template types to fix TypeScript errors
type TemplateType = "Push/Pull/Legs" | "Upper/Lower" | "Full Body";

// Common workout templates
const WORKOUT_TEMPLATES: Record<TemplateType, Record<string, string[]>> = {
  "Push/Pull/Legs": {
    "Push": ["Bench Press", "Overhead Press", "Tricep Extension"],
    "Pull": ["Barbell Row", "Pull-up", "Bicep Curl"],
    "Legs": ["Squat", "Deadlift", "Leg Extension", "Calf Raise"],
  },
  "Upper/Lower": {
    "Upper Body": ["Bench Press", "Barbell Row", "Overhead Press", "Pull-up", "Bicep Curl", "Tricep Extension"],
    "Lower Body": ["Squat", "Deadlift", "Leg Extension", "Leg Curl", "Calf Raise"],
  },
  "Full Body": {
    "Full Body": ["Squat", "Bench Press", "Barbell Row", "Overhead Press", "Deadlift"],
  },
};

interface SuggestedWorkoutExercisesProps {
  availableExercises: Exercise[];
  onAddExercise: (exerciseId: string, defaultSets?: number, defaultReps?: number) => void;
  onAddTemplate: (exercises: {exerciseId: string, defaultSets: number, defaultReps: number}[]) => void;
  onExerciseCreated?: (newExercise: Exercise) => void;
  onMultipleExercisesCreated?: (newExercises: Exercise[]) => void;
}

export function SuggestedWorkoutExercises({ 
  availableExercises, 
  onAddExercise,
  onAddTemplate,
  onExerciseCreated,
  onMultipleExercisesCreated
}: SuggestedWorkoutExercisesProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("Strength");
  const [creatingExercise, setCreatingExercise] = useState<string | null>(null);
  const [creatingTemplate, setCreatingTemplate] = useState<string | null>(null);
  
  // Find exercise ID by name
  const findExerciseId = (name: string): string | undefined => {
    const exercise = availableExercises.find(
      (e) => e.name.toLowerCase() === name.toLowerCase()
    );
    return exercise?.id;
  };

  // Create exercise and add to plan
  const createAndAddExercise = async (name: string, description: string) => {
    try {
      setCreatingExercise(name);
      
      // Create the exercise
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
      
      // Notify parent component about the new exercise
      if (onExerciseCreated) {
        onExerciseCreated(newExercise);
      } else {
        // Fall back to regular add if callback not provided
        onAddExercise(newExercise.id, 3, 10);
      }
      
      return newExercise.id;
    } catch (error) {
      console.error('Error creating exercise:', error);
      return undefined;
    } finally {
      setCreatingExercise(null);
    }
  };

  // Handle adding a template with auto-create
  const handleAddTemplateWithCreate = async (template: TemplateType, split: string) => {
    try {
      setCreatingTemplate(`${template}:${split}`);
      
      const exercises = WORKOUT_TEMPLATES[template][split];
      const exercisesToAdd: {exerciseId: string, defaultSets: number, defaultReps: number}[] = [];
      const newlyCreatedExercises: Exercise[] = [];
      
      // Process each exercise
      for (const exerciseName of exercises) {
        // Try to find existing exercise first
        let exerciseId = findExerciseId(exerciseName);
        
        // If not found, create it
        if (!exerciseId) {
          // Find the exercise details
          const category = Object.keys(SUGGESTED_EXERCISES).find(cat => 
            SUGGESTED_EXERCISES[cat as keyof typeof SUGGESTED_EXERCISES].some(e => 
              e.name.toLowerCase() === exerciseName.toLowerCase()
            )
          );
          
          if (category) {
            const exerciseDetails = SUGGESTED_EXERCISES[category as keyof typeof SUGGESTED_EXERCISES].find(
              e => e.name.toLowerCase() === exerciseName.toLowerCase()
            );
            
            if (exerciseDetails) {
              // Create the exercise
              const response = await fetch('/api/exercises', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                  name: exerciseDetails.name, 
                  description: exerciseDetails.description || "" 
                }),
              });
              
              if (response.ok) {
                const newExercise = await response.json();
                exerciseId = newExercise.id;
                newlyCreatedExercises.push(newExercise);
              }
            }
          }
        }
        
        // Add to list if we have an ID
        if (exerciseId) {
          exercisesToAdd.push({
            exerciseId,
            defaultSets: 3,
            defaultReps: 10
          });
        }
      }
      
      // Add all exercises to plan
      if (exercisesToAdd.length > 0) {
        // Notify parent about new exercises
        if (newlyCreatedExercises.length > 0 && onMultipleExercisesCreated) {
          onMultipleExercisesCreated(newlyCreatedExercises);
        }
        
        onAddTemplate(exercisesToAdd);
      }
    } catch (error) {
      console.error('Error creating template exercises:', error);
    } finally {
      setCreatingTemplate(null);
    }
  };
  
  return (
    <Tabs defaultValue="exercises" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="exercises">Individual Exercises</TabsTrigger>
        <TabsTrigger value="templates">Workout Templates</TabsTrigger>
      </TabsList>
      
      <TabsContent value="exercises" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Suggested Exercises</CardTitle>
            <CardDescription>
              Add common exercises to your workout plan
            </CardDescription>
            <div className="flex flex-wrap gap-2 mt-2">
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
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
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
                        <Plus className="h-4 w-4 mr-1" /> Add to Plan
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
                            <Plus className="h-4 w-4 mr-1" /> Add to Plan
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="templates" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Workout Templates</CardTitle>
            <CardDescription>
              Add pre-built workout splits to your plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              {Object.entries(WORKOUT_TEMPLATES).map(([template, splits]) => (
                <div key={template}>
                  <h3 className="font-medium text-lg mb-2">{template}</h3>
                  <div className="grid gap-3">
                    {Object.entries(splits).map(([split, exercises]) => (
                      <div 
                        key={split}
                        className="p-4 border rounded-md"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">{split}</h4>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleAddTemplateWithCreate(template as TemplateType, split)}
                            disabled={creatingTemplate === `${template}:${split}`}
                          >
                            {creatingTemplate === `${template}:${split}` ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Adding...
                              </>
                            ) : (
                              <>
                                <Plus className="h-4 w-4 mr-1" /> Add
                              </>
                            )}
                          </Button>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {exercises.join(", ")}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
} 