export interface Exercise {
  name: string
  description: string | null
}

export interface WorkoutTemplate {
  [key: string]: string[]
}

export const WORKOUT_TEMPLATES: Record<string, WorkoutTemplate> = {
  "Push/Pull/Legs": {
    "Push": [
      "Bench Press",
      "Overhead Press",
      "Tricep Extension",
      "Push-up",
      "Dip"
    ],
    "Pull": [
      "Barbell Row",
      "Pull-up",
      "Chin-up",
      "Bicep Curl"
    ],
    "Legs": [
      "Squat",
      "Deadlift",
      "Leg Extension",
      "Leg Curl",
      "Calf Raise"
    ]
  },
  "Upper/Lower": {
    "Upper": [
      "Bench Press",
      "Overhead Press",
      "Barbell Row",
      "Pull-up",
      "Tricep Extension",
      "Bicep Curl"
    ],
    "Lower": [
      "Squat",
      "Deadlift",
      "Leg Extension",
      "Leg Curl",
      "Calf Raise"
    ]
  },
  "Full Body": {
    "A": [
      "Squat",
      "Bench Press",
      "Barbell Row",
      "Tricep Extension",
      "Bicep Curl"
    ],
    "B": [
      "Deadlift",
      "Overhead Press",
      "Pull-up",
      "Leg Extension",
      "Lateral Raise"
    ]
  }
}

export const SUGGESTED_EXERCISES: Record<string, Exercise[]> = {
  "Strength": [
    {
      name: "Deadlift",
      description: "Full body compound exercise that primarily targets the posterior chain."
    },
    {
      name: "Bench Press",
      description: "Upper body compound exercise focusing on chest, shoulders, and triceps."
    },
    {
      name: "Overhead Press",
      description: "Compound exercise targeting shoulders and triceps."
    },
    {
      name: "Barbell Row",
      description: "Compound back exercise focusing on lats and upper back muscles."
    },
    {
      name: "Pull-up",
      description: "Upper body exercise that targets the lats, biceps, and grip strength."
    },
    {
      name: "Squat",
      description: "Lower body compound exercise targeting quadriceps, hamstrings, and glutes."
    }
  ],
  "Isolation": [
    {
      name: "Bicep Curl",
      description: "Isolation exercise for the biceps."
    },
    {
      name: "Tricep Extension",
      description: "Isolation exercise targeting the triceps."
    },
    {
      name: "Lateral Raise",
      description: "Shoulder isolation exercise focusing on the lateral deltoids."
    },
    {
      name: "Leg Extension",
      description: "Isolation exercise targeting the quadriceps."
    },
    {
      name: "Leg Curl",
      description: "Isolation exercise for the hamstrings."
    },
    {
      name: "Calf Raise",
      description: "Isolation exercise for the calves."
    }
  ],
  "Bodyweight": [
    {
      name: "Push-up",
      description: "Bodyweight exercise targeting chest, shoulders, and triceps."
    },
    {
      name: "Dip",
      description: "Compound bodyweight exercise for chest, shoulders, and triceps."
    },
    {
      name: "Chin-up",
      description: "Bodyweight exercise targeting back and biceps."
    },
    {
      name: "Bodyweight Squat",
      description: "Lower body bodyweight exercise."
    },
    {
      name: "Plank",
      description: "Core strengthening isometric exercise."
    },
    {
      name: "Lunge",
      description: "Unilateral lower body exercise."
    }
  ]
} 