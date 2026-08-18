# API Source-of-Truth Verification (development only)

This file documents the verification commands; it is not linked from the app UI.

## ExerciseDB

The production pipeline is:

`stable workout key -> pinned ExerciseDB exerciseId -> exact ExerciseDB record -> record.name + record.gifUrl + record.instructions`

On the first online run only, an unpinned stable key is bootstrapped by an **exact normalized ExerciseDB name** from `EXERCISE_REGISTRY.bootstrapExactNames`. No fuzzy score, generic substring selection, or metadata guessing is used. Once a record is verified, its `exerciseId` is pinned in `moinExerciseRecordCache:v5`, and subsequent rendering uses the ID path.

Open the hosted app while online and run in DevTools:

```js
await primeExerciseRegistryInBackground();
await verifyAllWorkoutExerciseRecords();
```

The verification function prints:

| Workout Slot | Internal Key | ExerciseDB ID | ExerciseDB Name | Equipment | Target | GIF URL | Match Method |
|---|---|---|---|---|---|---|---|

For a record to be considered valid, the popup title, GIF URL and written instructions all come from that single returned ExerciseDB object. A missing record produces **Demo temporarily unavailable**; there is no similar/cartoon/local-image substitution.

### Lat pulldown proof

There is no Lat Pulldown branch in `js/app.js`, and `assets/lat-pulldown-reference.png` is absent. `cable-lat-pulldown` passes through the same `resolveExerciseRecord()` -> `getExerciseRecord()` -> `renderExerciseRecordMedia()` path as every other exercise.

## TheMealDB

The production pipeline is:

`meal slot -> recipe ID -> TheMealDB lookup -> same record's strMeal + strMealThumb + ingredients/measures + strInstructions`

Run:

```js
await verifyMealRotationRecords();
```

It prints:

| Recipe ID | Displayed Name | API Name | Image URL | Recipe Source | Ingredients | Instructions |
|---|---|---|---|---|---|---|

`displayedName` and `apiName` are intentionally the same `strMeal` field.

## Static validation

From the project root:

```bash
node tests/source-of-truth-static-validation.mjs
```

This checks that legacy fuzzy exercise functions, Lat Pulldown special media, mixed food-media sources, and obsolete cache patterns are not part of the production architecture.
