/*
config.js
App constants, stable workout identities, and the default weekly plan.

Exercise identity architecture:
- `key` is the stable internal tracking identity used by streak/progress logic.
- `slotKey` is unique to a position in the weekly plan.
- `exerciseDbId` is the verified ExerciseDB V1 content identity.
- The user-facing name, GIF, instructions and metadata come from that exact record.
*/
const CONFIG={
  defaultJourneyStart:"2026-08-20",
  streakHistoryStart:"2026-08-17",
  normalGymTime:"07:45",
  bodyStart:{weight:90.5,waist:46.9,lower:41.9,chest:41.6,hip:43.8,biceps:14.2,thigh:26.2}
};

const VERIFIED_EXERCISE_DB_IDS=Object.freeze({
  "cable-lat-pulldown":"LEprlgG",
  "lever-chest-press":"T0yTjgW",
  "cable-seated-row":"fUBheHs",
  "dumbbell-incline-bench-press":"ns0SIbU",
  "dumbbell-lateral-raise":"DsgkuIt",
  "cable-rope-pushdown":"dU605di",
  "dumbbell-biceps-curl":"NbVPDMW",
  "walking-treadmill":"rjiM4L3",
  "sled-leg-press":"10Z2DXU",
  "barbell-romanian-deadlift":"wQ2c4XD",
  "lever-lying-leg-curl":"17lJ1kr",
  "lever-leg-extension":"my33uHU",
  "standing-calf-raise":"bJYHBIN",
  "cable-kneeling-crunch":"WW95auq",
  "front-plank":"VBAWRPG",
  "walking":"rjiM4L3",
  "bodyweight-squat":"JZuApnB",
  "incline-push-up":"B1EVP9F",
  "dumbbell-step-up":"aXtJhlg",
  "mountain-climber":"RJgzwny",
  "reverse-lunge":"VaP75jl",
  "assisted-pull-up":"f4xtKBj",
  "chest-supported-row":"7vG5o25",
  "dumbbell-seated-shoulder-press":"znQUdHY",
  "cable-standing-face-pull":"ZfyAGhK",
  "dumbbell-hammer-curl":"2NpxjC1",
  "cable-overhead-triceps-extension":"2IxROQ1",
  "dumbbell-goblet-squat":"yn8yg1r",
  "dumbbell-walking-lunge":"RRWFUcw",
  "hanging-knee-raise":"03lzqwk",
  "push-up":"I4hDWkc",
  "upper-back-stretch":"chfnQnM"
});

/* Maps historical names from older app versions to stable tracking keys. */
const LEGACY_EXERCISE_KEY_MAP={
  "Lat Pulldown":"cable-lat-pulldown","Cable Lat Pulldown":"cable-lat-pulldown",
  "Machine Chest Press":"lever-chest-press","Lever Chest Press":"lever-chest-press",
  "Seated Cable Row":"cable-seated-row","Cable Seated Row":"cable-seated-row",
  "Incline Dumbbell Press":"dumbbell-incline-bench-press","Dumbbell Incline Bench Press":"dumbbell-incline-bench-press",
  "Dumbbell Lateral Raise":"dumbbell-lateral-raise","Lateral Raise":"dumbbell-lateral-raise",
  "Rope Triceps Pushdown":"cable-rope-pushdown","Cable Pushdown with Rope Attachment":"cable-rope-pushdown",
  "Dumbbell Curl":"dumbbell-biceps-curl","Dumbbell Biceps Curl":"dumbbell-biceps-curl",
  "Incline Treadmill":"walking-treadmill","Incline Walk":"walking-treadmill","Brisk / Incline Walk":"walking-treadmill","Walking on Treadmill":"walking-treadmill",
  "Leg Press":"sled-leg-press","Sled Leg Press":"sled-leg-press",
  "Romanian Deadlift":"barbell-romanian-deadlift","Barbell Romanian Deadlift":"barbell-romanian-deadlift",
  "Leg Curl":"lever-lying-leg-curl","Lever Lying Leg Curl":"lever-lying-leg-curl",
  "Leg Extension":"lever-leg-extension","Lever Leg Extension":"lever-leg-extension",
  "Standing Calf Raise":"standing-calf-raise","Calf Raise":"standing-calf-raise",
  "Cable Crunch":"cable-kneeling-crunch","Cable Kneeling Crunch":"cable-kneeling-crunch",
  "Plank":"front-plank","Front Plank":"front-plank",
  "Brisk Walk":"walking","Easy Walk":"walking","Relaxed Walking":"walking","Walking":"walking",
  "Bodyweight Squat":"bodyweight-squat",
  "Incline / Normal Push-up":"incline-push-up","Incline Push-up":"incline-push-up",
  "Step-ups":"dumbbell-step-up","Dumbbell Step-up":"dumbbell-step-up",
  "Mountain Climbers":"mountain-climber","Mountain Climber":"mountain-climber",
  "Reverse Lunge":"reverse-lunge",
  "Assisted Pull-up / Pulldown":"assisted-pull-up","Assisted Pull-up":"assisted-pull-up",
  "Chest-Supported Row":"chest-supported-row","Chest Supported Row":"chest-supported-row",
  "Machine / DB Shoulder Press":"dumbbell-seated-shoulder-press","Dumbbell Seated Shoulder Press":"dumbbell-seated-shoulder-press",
  "Face Pull":"cable-standing-face-pull","Cable Standing Face Pull":"cable-standing-face-pull",
  "Hammer Curl":"dumbbell-hammer-curl","Dumbbell Hammer Curl":"dumbbell-hammer-curl",
  "Overhead Rope Extension":"cable-overhead-triceps-extension","Cable Overhead Triceps Extension":"cable-overhead-triceps-extension",
  "Goblet Squat / Hack Squat":"dumbbell-goblet-squat","Dumbbell Goblet Squat":"dumbbell-goblet-squat",
  "Walking Lunges":"dumbbell-walking-lunge","Dumbbell Walking Lunge":"dumbbell-walking-lunge",
  "Hanging Knee Raise":"hanging-knee-raise",
  "Push-ups":"push-up","Push-up":"push-up",
  "Mobility / Stretching":"upper-back-stretch","Light Mobility":"upper-back-stretch","Upper Back Stretch":"upper-back-stretch",
  "Meal Prep + Weekly Review":"meal-prep-review"
};

/*
The displayed name is deliberately NOT stored here as final truth.
`fallbackName` is only used while offline/before a verified API record is available.
*/
const EXERCISE_FALLBACK_NAMES={
  "cable-lat-pulldown":"Cable Lat Pulldown",
  "lever-chest-press":"Lever Chest Press",
  "cable-seated-row":"Cable Seated Row",
  "dumbbell-incline-bench-press":"Dumbbell Incline Bench Press",
  "dumbbell-lateral-raise":"Dumbbell Lateral Raise",
  "cable-rope-pushdown":"Cable Pushdown with Rope Attachment",
  "dumbbell-biceps-curl":"Dumbbell Biceps Curl",
  "walking-treadmill":"Walking on Treadmill",
  "sled-leg-press":"Sled Leg Press",
  "barbell-romanian-deadlift":"Barbell Romanian Deadlift",
  "lever-lying-leg-curl":"Lever Lying Leg Curl",
  "lever-leg-extension":"Lever Leg Extension",
  "standing-calf-raise":"Standing Calf Raise",
  "cable-kneeling-crunch":"Cable Kneeling Crunch",
  "front-plank":"Front Plank",
  "walking":"Walking",
  "bodyweight-squat":"Bodyweight Squat",
  "incline-push-up":"Incline Push-up",
  "dumbbell-step-up":"Dumbbell Step-up",
  "mountain-climber":"Mountain Climber",
  "reverse-lunge":"Reverse Lunge",
  "assisted-pull-up":"Assisted Pull-up",
  "chest-supported-row":"Chest Supported Row",
  "dumbbell-seated-shoulder-press":"Dumbbell Seated Shoulder Press",
  "cable-standing-face-pull":"Cable Standing Face Pull",
  "dumbbell-hammer-curl":"Dumbbell Hammer Curl",
  "cable-overhead-triceps-extension":"Cable Overhead Triceps Extension",
  "dumbbell-goblet-squat":"Dumbbell Goblet Squat",
  "dumbbell-walking-lunge":"Dumbbell Walking Lunge",
  "hanging-knee-raise":"Hanging Knee Raise",
  "push-up":"Push-up",
  "upper-back-stretch":"Upper Back Stretch",
  "meal-prep-review":"Meal Prep + Weekly Review"
};

const DEFAULT_PLAN={
  1:{name:"Upper A",exercises:[
    ["cable-lat-pulldown","2","10–12"],["lever-chest-press","2","10–12"],["cable-seated-row","2","10–12"],["dumbbell-incline-bench-press","2","10–12"],["dumbbell-lateral-raise","2","12–15"],["cable-rope-pushdown","2","12–15"],["dumbbell-biceps-curl","2","10–12"],["walking-treadmill","1","15–20"]]},
  2:{name:"Lower A + Core",exercises:[
    ["sled-leg-press","2","10–12"],["barbell-romanian-deadlift","2","8–10"],["lever-lying-leg-curl","2","10–12"],["lever-leg-extension","2","12–15"],["standing-calf-raise","2","12–15"],["cable-kneeling-crunch","2","12–15"],["front-plank","2","30–45"],["walking-treadmill","1","15–20"]]},
  3:{name:"Military Conditioning",exercises:[
    ["walking","1","10"],["bodyweight-squat","3","15"],["incline-push-up","3","8–12"],["dumbbell-step-up","3","10"],["mountain-climber","3","20"],["reverse-lunge","3","8"],["front-plank","3","30"],["walking","1","20–25"]]},
  4:{name:"Upper B",exercises:[
    ["assisted-pull-up","3","8–12"],["chest-supported-row","3","10–12"],["lever-chest-press","2","10–12"],["dumbbell-seated-shoulder-press","2","10–12"],["dumbbell-lateral-raise","3","12–15"],["cable-standing-face-pull","3","12–15"],["dumbbell-hammer-curl","2","10–12"],["cable-overhead-triceps-extension","2","10–12"],["walking-treadmill","1","15–20"]]},
  5:{name:"Lower B + Abs",exercises:[
    ["dumbbell-goblet-squat","3","8–12"],["barbell-romanian-deadlift","3","8–10"],["dumbbell-walking-lunge","2","10"],["lever-lying-leg-curl","3","10–12"],["standing-calf-raise","3","12–15"],["hanging-knee-raise","3","8–12"],["cable-kneeling-crunch","3","12–15"],["walking-treadmill","1","15–20"]]},
  6:{name:"Fat-Loss Conditioning",exercises:[
    ["walking-treadmill","1","45–60"],["push-up","3","12"],["bodyweight-squat","3","15"],["front-plank","3","30–45"],["upper-back-stretch","1","10"]]},
  0:{name:"Recovery",exercises:[
    ["walking","1","8000"],["upper-back-stretch","1","10"],["meal-prep-review","1","1"]]}
};

Object.entries(DEFAULT_PLAN).forEach(([dayIndex,day])=>{
  day.exercises=day.exercises.map(([key,sets,reps],index)=>({
    key,
    slotKey:`day-${dayIndex}-exercise-${index+1}`,
    exerciseDbId:VERIFIED_EXERCISE_DB_IDS[key]||null,
    name:EXERCISE_FALLBACK_NAMES[key]||key,
    sets,
    reps
  }));
});
