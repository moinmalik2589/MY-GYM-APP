# MOIN MALIK GYM TRACKER

A 90-day fitness transformation web app I created to keep workouts, exercise demos, meals, recipes, progress, and body measurements in one place.

The main idea behind the app is simple: instead of searching separately for workouts, exercise demonstrations, and meals every day, the app organizes the complete 90-day journey in one dashboard.

## Workout & Exercise System

The workout plan uses ExerciseDB to load exercise information and demonstrations.

Each exercise in the workout plan has its own internal key and is connected to a specific ExerciseDB exercise ID.

The basic flow is:

**Workout Exercise → ExerciseDB ID → Exercise Details → Demo GIF → Instructions**

Exercise names are used for display, while workout history is stored using stable internal exercise keys. This helps keep completed exercises, weights, reps, and previous workout data connected to the correct exercise.

Exercise information loaded from ExerciseDB includes:

* Exercise name
* Demo GIF
* Target muscles
* Body part
* Exercise instructions

Exercise records are cached locally so the app does not need to request the same information every time.

Cache used:

`moinExerciseRecordCache:v5`

If an exercise demonstration cannot be loaded, the app displays:

**Demo temporarily unavailable**

Activities such as **Meal Prep + Weekly Review** are treated as non-exercise activities and do not make ExerciseDB requests.

---

## Food & Recipe System

The meal section uses **TheMealDB** for recipe information.

Meals in the 90-day plan are connected to specific TheMealDB recipe IDs.

The basic flow is:

**Meal Slot → TheMealDB Recipe ID → Recipe → Image → Ingredients → Measurements → Instructions**

Recipe information comes directly from the corresponding TheMealDB record, including:

* Recipe name
* Food image
* Ingredients
* Ingredient measurements
* Cooking instructions

I keep the fitness portion guidance separately so portions can match the transformation plan without changing the original recipe information.

Recipe records are stored locally using:

`moinRecipeCache:v4`

The current meal rotation contains **13 different TheMealDB recipes**, distributed across breakfast, lunch, snacks, and dinner throughout the 90-day program.

### Friday Plan

The Friday fasting schedule is also included.

Breakfast and lunch are shown as fasting periods, while Iftar/snack and dinner use their assigned recipes.

---

## Progress Tracking

The app keeps workout progress separate from the exercise names displayed on screen.

This allows workout records such as:

* Exercise completion
* Weight used
* Reps
* Daily workout history
* Progress
* Streak information

to remain connected to the correct workout exercise.

Existing workout history can also be carried into the exercise-key based storage structure.

---

## PWA & Offline Support

The app works as a Progressive Web App (PWA) and can be installed on supported phones and computers.

Current service-worker cache:

`moin-gym-source-of-truth-v6-20260817`

The service worker manages the main application files, while external exercise GIFs, recipe images, and API responses are handled separately.

Validated ExerciseDB and TheMealDB records are stored in localStorage using their IDs.

---

## Development & Testing

When the hosted app is online, the exercise and meal records can be checked from the browser DevTools console:

```javascript
await primeExerciseRegistryInBackground();
await verifyAllWorkoutExerciseRecords();
await verifyMealRotationRecords();
```

Static validation can also be run from the project root:

```bash
node tests/source-of-truth-static-validation.mjs
```

Additional technical notes are available in:

```text
dev/API_SOURCE_OF_TRUTH_VERIFICATION.md
dev/SOURCE_OF_TRUTH_FIX_REPORT.md
```

---

## APIs Used

**ExerciseDB**
Used for exercise records, exercise instructions, target muscles, and demonstration GIFs.

**TheMealDB**
Used for meal names, images, ingredients, measurements, and cooking instructions.

---

## About the Project

I created **Moin Malik Gym Tracker** as a personal 90-day transformation app that combines my workout routine, exercise guidance, meal planning, recipes, and progress tracking.

The goal is to make following the transformation plan easier by keeping everything needed for each day in one place.
