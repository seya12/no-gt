# Gym Tracker Requirements

## Core Features

### Exercise Management
- [ ] Create and manage exercises
- [ ] Each exercise has:
  - Name
  - Description (optional)
  - Default sets and reps
  - Weight tracking
  - Notes per set (optional)

### Workout Sessions
- [ ] Create and track workout sessions
- [ ] Each session contains:
  - Date and time
  - List of exercises
  - Sets and reps for each exercise
  - Weight used for each set
  - Actual reps completed

### Set Tracking
- [ ] For each set:
  - Pre-filled target reps based on plan
  - Actual reps completed
  - Weight used (in 0.5kg increments)
  - Notes (optional)
  - Option to mark as completed
  - Feedback for next session (increase/decrease/keep weight)

### Workout Plans
- [ ] Create and manage workout plans
- [ ] Plans should include:
  - List of exercises
  - Default sets and reps for each exercise
  - Starting weights (optional)
- [ ] Plans should be fully customizable

## Technical Requirements

### Mobile-First Design
- [ ] Optimized for mobile devices
- [ ] Touch-friendly interface
- [ ] Responsive design
- [ ] Easy input for numbers and weights
- [ ] Quick set completion workflow

### Tech Stack
- [ ] Next.js for frontend and backend
- [ ] shadcn/ui for component library
- [ ] Vercel for hosting
- [ ] Vercel Postgres for database
- [ ] NextAuth.js for authentication
- [ ] Mobile-first approach with:
  - Bottom navigation bar
  - Touch-optimized components (min 44x44px touch targets)
  - Native-like number inputs
  - Swipe gestures where appropriate

## Open Questions

1. User Management
   - Should users be able to create accounts?
   - Should there be different user roles (e.g., admin, regular user)?

2. Data Persistence
   - How long should workout history be kept?
   - Should there be data export functionality?

3. UI/UX
   - Should we include progress tracking/visualization?
   - How should we handle offline functionality?

4. Additional Features
   - Should we include rest timer functionality?
   - Do we need exercise categories or tags?
   - Should we include exercise form guides or videos?

5. Technical Considerations
   - Should we include data backup functionality?
   - How to handle data synchronization across devices?

## Future Enhancements
- [ ] Progress tracking and visualization
- [ ] Exercise library with form guides
- [ ] Rest timer
- [ ] Personal records tracking
- [ ] Workout statistics and analytics
- [ ] Progressive overload tracking
- [ ] Multiple workout plans support 