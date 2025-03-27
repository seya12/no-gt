"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";

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

interface SuggestedExercisesProps {
  onSelectExercise: (name: string, description: string) => void;
}

export function SuggestedExercises({ onSelectExercise }: SuggestedExercisesProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("Strength");
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Suggested Exercises</CardTitle>
        <CardDescription>
          Choose from common exercises to get started quickly
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-4">
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
        
        <div className="grid gap-2">
          {SUGGESTED_EXERCISES[selectedCategory as keyof typeof SUGGESTED_EXERCISES].map((exercise) => (
            <div 
              key={exercise.name} 
              className="flex items-center justify-between p-3 border rounded-md hover:bg-accent/50 transition-colors"
            >
              <div>
                <h3 className="font-medium">{exercise.name}</h3>
                <p className="text-sm text-muted-foreground">{exercise.description}</p>
              </div>
              <Button 
                size="icon" 
                variant="ghost"
                onClick={() => onSelectExercise(exercise.name, exercise.description || "")}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 