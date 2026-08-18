# Exercise Demo Verification

The current verification instructions are maintained in:

`dev/API_SOURCE_OF_TRUTH_VERIFICATION.md`

Use:

```js
await primeExerciseRegistryInBackground();
await verifyAllWorkoutExerciseRecords();
```

The current exact-record cache is `moinExerciseRecordCache:v5`, keyed by ExerciseDB ID after first exact online sync.
