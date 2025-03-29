"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Exercise } from "@prisma/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SUGGESTED_EXERCISES, WORKOUT_TEMPLATES } from "@/lib/constants/exercises";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

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
  const [isCustomDialogOpen, setIsCustomDialogOpen] = useState(false);
  const [customExercise, setCustomExercise] = useState({ name: "", description: "" });
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);
  
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
  const handleAddTemplateWithCreate = async (template: keyof typeof WORKOUT_TEMPLATES, split: string) => {
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

  // Create custom exercise
  const handleCreateCustomExercise = async () => {
    if (!customExercise.name) return;

    try {
      setIsCreatingCustom(true);
      
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
      
      // Notify parent component about the new exercise
      if (onExerciseCreated) {
        onExerciseCreated(newExercise);
      }
      
      // Reset form and close dialog
      setCustomExercise({ name: "", description: "" });
      setIsCustomDialogOpen(false);
    } catch (error) {
      console.error('Error creating custom exercise:', error);
    } finally {
      setIsCreatingCustom(false);
    }
  };

  return (
    <Tabs defaultValue="exercises" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="exercises">Individual Exercises</TabsTrigger>
        <TabsTrigger value="templates">Workout Templates</TabsTrigger>
      </TabsList>
      
      <TabsContent value="exercises" className="mt-4">
        <div className="space-y-6">
          <div className="flex justify-end">
            <Dialog open={isCustomDialogOpen} onOpenChange={setIsCustomDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Custom Exercise
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Custom Exercise</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
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
              </DialogContent>
            </Dialog>
          </div>

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

          <Card>
            <CardHeader>
              <CardTitle>Suggested Exercises</CardTitle>
              <CardDescription>
                Add common exercises to your workout plan
              </CardDescription>
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
        </div>
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
                            onClick={() => handleAddTemplateWithCreate(template as keyof typeof WORKOUT_TEMPLATES, split)}
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