# Source-of-Truth Fix Report

## Root causes removed

1. Exercise identity used manually guessed names/aliases/metadata and historically used destructive normalization/fuzzy matching.
2. Human-readable names were coupled to streak/progress lookup, so API display-name changes could affect historical identity.
3. Multiple old exercise media/cache generations could keep incorrect name->GIF results.
4. Lat Pulldown had a legacy local reference image path.
5. Food mixed local meal identity/instructions with separately sourced images/recipes, so the name, image and instructions could describe different dishes.
6. Old food-media caches could preserve those mismatched records.

## Files intentionally changed

- `js/config.js` — stable workout keys and exact one-time ExerciseDB bootstrap names.
- `js/storage.js` — safe stable-key history mirror/migration while retaining legacy index history.
- `js/streak.js` — stable exercise key identity.
- `js/progress.js` — stable exercise key identity.
- `js/app.js` — one ExerciseDB ID/record resolver and one popup media renderer.
- `js/food.js` — one TheMealDB record drives complete meal identity/media/recipe.
- `sw.js` — new PWA cache and obsolete media removal.
- `tests/source-of-truth-static-validation.mjs` — architecture validation.
- `dev/API_SOURCE_OF_TRUTH_VERIFICATION.md` — live verification instructions.

The existing visual popup/layout classes were retained.

## Exercise architecture

`slotKey + exercise.key` are stable internal identities. Historical completion/weight/reps data is retained in its legacy index form and mirrored into `exerciseByKey` / `loadsByKey`.

`exercise.key -> cached exerciseId -> getExerciseRecord(exerciseId) -> same record name/gif/instructions`

The first online migration of an install without pinned IDs performs exact-name bootstrap only. Successful results store the stable `exerciseId`; future rendering is ID-first.

### Scheduled ExerciseDB-backed identities

| Internal key | Exact bootstrap API name(s) | ExerciseDB ID |
|---|---|---|
| cable-lat-pulldown | cable lat pulldown full range of motion; cable pulldown | pinned automatically on first exact online sync |
| lever-chest-press | lever chest press | pinned automatically on first exact online sync |
| cable-seated-row | cable seated row; cable low seated row; cable straight back seated row | pinned automatically on first exact online sync |
| dumbbell-incline-bench-press | dumbbell incline bench press | pinned automatically on first exact online sync |
| dumbbell-lateral-raise | dumbbell lateral raise | pinned automatically on first exact online sync |
| cable-rope-pushdown | cable pushdown (with rope attachment) | pinned automatically on first exact online sync |
| dumbbell-biceps-curl | dumbbell biceps curl | pinned automatically on first exact online sync |
| walking-treadmill | walking on treadmill | pinned automatically on first exact online sync |
| sled-leg-press | sled leg press; sled 45° leg press | pinned automatically on first exact online sync |
| barbell-romanian-deadlift | barbell romanian deadlift | pinned automatically on first exact online sync |
| lever-lying-leg-curl | lever lying leg curl | pinned automatically on first exact online sync |
| lever-leg-extension | lever leg extension | pinned automatically on first exact online sync |
| standing-calf-raise | standing calf raise | pinned automatically on first exact online sync |
| cable-kneeling-crunch | cable kneeling crunch | pinned automatically on first exact online sync |
| front-plank | front plank; plank | pinned automatically on first exact online sync |
| walking | walking | pinned automatically on first exact online sync |
| bodyweight-squat | bodyweight squat | pinned automatically on first exact online sync |
| incline-push-up | incline push-up; incline push up | pinned automatically on first exact online sync |
| dumbbell-step-up | dumbbell step-up; dumbbell step up | pinned automatically on first exact online sync |
| mountain-climber | mountain climber | pinned automatically on first exact online sync |
| reverse-lunge | reverse lunge; bodyweight rear lunge | pinned automatically on first exact online sync |
| assisted-pull-up | assisted pull-up; assisted pull up | pinned automatically on first exact online sync |
| chest-supported-row | chest supported row; dumbbell incline row | pinned automatically on first exact online sync |
| dumbbell-seated-shoulder-press | dumbbell seated shoulder press | pinned automatically on first exact online sync |
| cable-standing-face-pull | cable standing face pull | pinned automatically on first exact online sync |
| dumbbell-hammer-curl | dumbbell hammer curl | pinned automatically on first exact online sync |
| cable-overhead-triceps-extension | cable overhead triceps extension | pinned automatically on first exact online sync |
| dumbbell-goblet-squat | dumbbell goblet squat | pinned automatically on first exact online sync |
| dumbbell-walking-lunge | dumbbell walking lunge | pinned automatically on first exact online sync |
| hanging-knee-raise | hanging knee raise | pinned automatically on first exact online sync |
| push-up | push-up; push up | pinned automatically on first exact online sync |
| upper-back-stretch | upper back stretch | pinned automatically on first exact online sync |

`meal-prep-review` is non-exercise and never calls ExerciseDB.

> Build-environment limitation: this coding environment cannot resolve the live `oss.exercisedb.dev/api/v1/...` endpoint, so no ExerciseDB IDs were fabricated. The application performs the exact-name bootstrap once on the real online client and pins the returned IDs. Run `await verifyAllWorkoutExerciseRecords()` to print the actual pinned ID/name/equipment/target/GIF table.

## Lat Pulldown

No special branch exists. `assets/lat-pulldown-reference.png` has been removed and is not precached. Lat Pulldown uses the same resolver and renderer as all other exercises.

## Food architecture

Primary recipe API: TheMealDB only. There is no Wikipedia/DummyJSON/local-recipe media assembly.

| Recipe ID | API meal name used in rotation |
|---|---|
| 53076 | Bread omelette |
| 53215 | Shakshouka |
| 52915 | French Omelette |
| 52795 | Chicken Handi |
| 53358 | Chicken Mandi |
| 53011 | Chicken Quinoa Greek Salad |
| 53367 | Chicken Fried Rice |
| 52852 | Tuna Nicoise |
| 52955 | Egg Drop Soup |
| 52806 | Tandoori chicken |
| 52851 | Nutty Chicken Curry |
| 53218 | Chicken Shawarma with homemade garlic herb yoghurt sauce |
| 53039 | Piri-piri chicken and slaw |

For every card, the displayed name is `strMeal`, the image is `strMealThumb`, ingredients are `strIngredient* + strMeasure*`, and recipe steps come from `strInstructions` of that exact lookup record.

Fitness portion guidance is local and intentionally displayed as guidance, not as part of the API recipe identity. TheMealDB does not supply the app with calorie/macronutrient values in this implementation.

## Cache versions

- Exercise exact-record cache: `moinExerciseRecordCache:v5`
- Recipe exact-record cache: `moinRecipeCache:v4`
- Service worker: `moin-gym-source-of-truth-v6-20260817`

Old `moinExerciseDemo*`, `moinExerciseMedia*`, `moinFoodMedia*`, old record cache versions, and old PWA caches are invalidated.
