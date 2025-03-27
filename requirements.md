# Gym Tracker Requirements

## Core Features

### Exercise Management

- [x] Create and manage exercises
- [x] Each exercise has:
  - Name
  - Description (optional)
  - Default sets and reps
  - Weight tracking
  - Notes per set (optional)
- [x] Delete exercises

### Workout Sessions

- [x] Create and track workout sessions
- [x] Each session contains:
  - Date and time
  - List of exercises
  - Sets and reps for each exercise
  - Weight used for each set
  - Actual reps completed
- [x] Delete workout sessions

### Set Tracking

- [x] For each set:
  - Pre-filled target reps based on plan
  - Actual reps completed
  - Weight used (in 0.5kg increments)
  - Notes (optional)
  - Option to mark as completed
  - Feedback for next session (increase/decrease/keep weight)

### Workout Plans

- [x] Create and manage workout plans
- [x] Plans should include:
  - List of exercises
  - Default sets and reps for each exercise
  - Starting weights (optional)
- [x] Plans should be fully customizable
- [x] Delete workout plans

### Workout History

- [x] View history of all workout sessions
- [x] Calendar view of workout sessions
- [x] Detailed view of each workout session
- [x] Recent workouts display on dashboard

## Technical Requirements

### Mobile-First Design

- [x] Optimized for mobile devices
- [x] Touch-friendly interface
- [x] Responsive design
- [x] Easy input for numbers and weights
- [x] Quick set completion workflow

### Tech Stack

- [x] Next.js for frontend and backend
- [x] shadcn/ui for component library
- [x] Vercel for hosting
- [x] PostgreSQL for database
- [x] NextAuth.js for authentication
- [x] Mobile-first approach with:
  - Bottom navigation bar
  - Touch-optimized components (min 44x44px touch targets)
  - Native-like number inputs
  - Swipe gestures where appropriate

### User Experience

- [x] Dashboard with recent workouts and active plans
- [x] User authentication and account management
- [x] Intuitive navigation between features
- [x] Confirmation dialogs for destructive actions
- [x] Form validation for all inputs

## Implemented Features

### User Management

- [x] User authentication with Next Auth
- [x] User-specific data (exercises, plans, sessions)
- [x] Profile page

### Data Management

- [x] CRUD operations for exercises
- [x] CRUD operations for workout plans
- [x] CRUD operations for workout sessions
- [x] Database schema with relationships

### UI/UX

- [x] Dashboard with recent activities
- [x] Calendar view for workout history
- [x] Consistent design across all pages
- [x] Mobile-optimized inputs and controls
- [x] Confirmation dialogs for deletions

## Open Questions

### Data Persistence

- Should workout history be kept indefinitely or should there be data retention policies?
- Should there be data export functionality?

### Additional Features

- Should we include rest timer functionality?
- Do we need exercise categories or tags?
- Should we include exercise form guides or videos?

### Technical Considerations

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
- [ ] Data export and backup
- [ ] Offline functionality
- [ ] Exercise categories and tags
- [ ] Filter and search functionality for workout history
