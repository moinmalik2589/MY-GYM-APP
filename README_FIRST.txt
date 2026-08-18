MOIN MALIK GYM TRACKER — EXERCISE + FOOD SOURCE-OF-TRUTH FIX

SCOPE
Only the exercise identity/demo path, food/recipe identity path, stable workout-key migration,
and their caches/service-worker behavior were changed. Existing UI layout, navigation, themes,
progress rings, charts, body measurements, journey, settings, and general responsive styling
were not intentionally redesigned.

EXERCISES
Production identity flow:
  stable internal workout key
    -> pinned ExerciseDB exerciseId
    -> exact ExerciseDB record
    -> record.name
    -> record.gifUrl
    -> record.instructions

Important:
- Human-readable exercise names are no longer workout-history keys.
- Existing daily index history is preserved and mirrored into exerciseByKey / loadsByKey.
- Old name-based exercise caches are invalidated.
- Exercise record cache: moinExerciseRecordCache:v5
- Once an ExerciseDB ID is pinned, rendering is ID based.
- First online sync only: if an older install has no pinned ID yet, the app uses an exact-name
  bootstrap list to discover a record whose normalized API name exactly equals the requested
  bootstrap name. There is no fuzzy score, broad substring matching, or metadata guess.
- If no exact record is found, the popup says Demo temporarily unavailable.
- There is no special Lat Pulldown renderer or local Lat Pulldown reference PNG.
- Meal Prep + Weekly Review is explicitly non-exercise and never queries ExerciseDB.

FOOD
Primary and only recipe API: TheMealDB.

Production identity flow:
  meal slot
    -> verified TheMealDB recipe ID
    -> exact lookup record
    -> record.strMeal
    -> record.strMealThumb
    -> record.strIngredient*/strMeasure*
    -> record.strInstructions

Important:
- Wikipedia, Wikimedia, DummyJSON, local fake meal names, and mixed-source recipe assembly are gone.
- Food cache: moinRecipeCache:v4, keyed by recipe ID.
- Old moinFoodMedia* and older recipe caches are invalidated.
- Local text is limited to fitness portion guidance; it does not rename the API recipe or replace
  the API image/ingredients/instructions.
- Friday fasting layout is preserved: breakfast/lunch are fasting states; Iftar/snack and dinner
  use exact recipe IDs.
- The rotation currently contains 13 distinct TheMealDB recipe IDs distributed across breakfast,
  lunch, snack and dinner, with controlled weekly/day rotation across the 90-day program.

PWA / SERVICE WORKER
Service-worker cache:
  moin-gym-source-of-truth-v6-20260817

Activation deletes old service-worker caches.
External API/GIF/image requests are no longer stored in Cache Storage; exact validated API records
are cached in localStorage by ID instead.

DEVELOPMENT VALIDATION
While the hosted app is online, open DevTools and run:

  await primeExerciseRegistryInBackground();
  await verifyAllWorkoutExerciseRecords();
  await verifyMealRotationRecords();

Static validation from the project root:

  node tests/source-of-truth-static-validation.mjs

See:
  dev/API_SOURCE_OF_TRUTH_VERIFICATION.md
  dev/SOURCE_OF_TRUTH_FIX_REPORT.md
