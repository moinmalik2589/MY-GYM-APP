/*
storage.js
Browser storage only.

Workout history remains in the same `moinGymV9` object and daily array/index
shape. The migration below adds stable exercise keys to plan entries without
moving/deleting completion, weight, reps, measurements, settings, or journey data.
*/
const STORAGE_KEY="moinGymV9";

function deepCopy(value){return JSON.parse(JSON.stringify(value));}

let state=JSON.parse(localStorage.getItem(STORAGE_KEY)||"null")||{
  // Appearance starts with the original green design.
  theme:"classic",
  themePreset:"classic",
  themeColor:"#eefbf3",
  accentPreset:"green",
  accent:"#0a6b33",
  gymTime:CONFIG.normalGymTime,
  gymSchedule:{},
  customGymTiming:false,
  targets:{steps:8000,water:3,sleep:7},
  startDate:CONFIG.defaultJourneyStart,
  plan:deepCopy(DEFAULT_PLAN),
  daily:{},
  measurements:[{date:"2026-08-17",...CONFIG.bodyStart}]
};

if(!state.gymTime)state.gymTime=CONFIG.normalGymTime;
if(!state.gymSchedule)state.gymSchedule={};
if(typeof state.customGymTiming!=="boolean")state.customGymTiming=Object.keys(state.gymSchedule).length>0;
if(!state.targets)state.targets={steps:8000,water:3,sleep:7};
state.targets.steps=Number(state.targets.steps)||8000;state.targets.water=Number(state.targets.water)||3;state.targets.sleep=Number(state.targets.sleep)||7;

// Older saved settings are translated into the current preset model.
const LEGACY_ACCENTS={green:"#0a6b33",blue:"#075fc7",purple:"#6844cc",orange:"#c75c00",pink:"#b92968",teal:"#087e79"};
if(LEGACY_ACCENTS[state.accent]){
  state.accentPreset=state.accent;
  state.accent=LEGACY_ACCENTS[state.accent];
}
if(!state.themePreset){
  if(["light","dark","multicolor","midnight","ocean","warm","rose","classic"].includes(state.theme))state.themePreset=state.theme;
  else state.themePreset="classic";
}
if(!state.themeColor)state.themeColor="#eefbf3";
if(!state.accentPreset)state.accentPreset="green";
if(!/^#[0-9a-f]{6}$/i.test(state.accent||""))state.accent="#0a6b33";
if(!state.startDate)state.startDate=CONFIG.defaultJourneyStart;
if(!state.plan)state.plan=deepCopy(DEFAULT_PLAN);
if(!state.daily)state.daily={};
if(!state.measurements)state.measurements=[{date:"2026-08-17",...CONFIG.bodyStart}];

function saveState(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}

function normalizeLegacyExerciseName(value){
  return String(value||"").trim();
}

function migratePlanToStableExerciseKeys(){
  Object.entries(state.plan||{}).forEach(([dayIndex,day])=>{
    const defaultDay=DEFAULT_PLAN[dayIndex];

    (day.exercises||[]).forEach((exercise,index)=>{
      if(exercise.key && (VERIFIED_EXERCISE_DB_IDS[exercise.key] || exercise.key==="meal-prep-review")){
        if(!exercise.slotKey)exercise.slotKey=`day-${dayIndex}-exercise-${index+1}`;
        exercise.exerciseDbId=VERIFIED_EXERCISE_DB_IDS[exercise.key]||null;
        return;
      }

      const legacyName=normalizeLegacyExerciseName(exercise.name);
      const mappedKey=LEGACY_EXERCISE_KEY_MAP[legacyName];
      const defaultKey=defaultDay?.exercises?.[index]?.key;
      // Known historical names migrate to their stable key. A truly custom
      // edited name stays custom instead of inheriting an unrelated slot ID.
      const key=mappedKey || (!legacyName?defaultKey:null) || `custom-${dayIndex}-${index+1}`;

      exercise.key=key;
      exercise.slotKey=exercise.slotKey||`day-${dayIndex}-exercise-${index+1}`;
      exercise.exerciseDbId=VERIFIED_EXERCISE_DB_IDS[key]||null;
      // Keep the old name only as an offline label. It is no longer a logging key.
      exercise.name=EXERCISE_FALLBACK_NAMES[key]||legacyName||"Custom Exercise";
    });
  });
}

migratePlanToStableExerciseKeys();

function localWeekdayFromIso(date){
  const [year,month,day]=String(date).split("-").map(Number);
  return new Date(year,month-1,day).getDay();
}

/*
  Safe history migration:
  - Old versions stored exercise/load data by exercise index.
  - New versions ALSO mirror each value by stable exercise `key`.
  - Legacy index fields are retained, so no old history is deleted or rewritten.
*/
function migrateDailyHistoryToStableKeys(){
  Object.entries(state.daily||{}).forEach(([date,data])=>{
    if(!data || typeof data!=="object")return;
    data.exercise=data.exercise||{};
    data.loads=data.loads||{};
    data.exerciseByKey=data.exerciseByKey||{};
    data.loadsByKey=data.loadsByKey||{};
    data.habits=data.habits||{};

    const weekday=localWeekdayFromIso(date);
    const plan=state.plan?.[weekday];
    if(!plan)return;

    (plan.exercises||[]).forEach((exercise,index)=>{
      const key=exercise.key;
      if(!key)return;

      if(data.exerciseByKey[key]===undefined && data.exercise[index]!==undefined){
        data.exerciseByKey[key]=data.exercise[index];
      }
      if(data.loadsByKey[key]===undefined && data.loads[index]!==undefined){
        data.loadsByKey[key]=deepCopy(data.loads[index]);
      }
    });
  });
}

migrateDailyHistoryToStableKeys();
saveState();

function dayData(date){
  if(!state.daily[date])state.daily[date]={exercise:{},loads:{},exerciseByKey:{},loadsByKey:{},habits:{}};
  const data=state.daily[date];
  data.exercise=data.exercise||{};
  data.loads=data.loads||{};
  data.exerciseByKey=data.exerciseByKey||{};
  data.loadsByKey=data.loadsByKey||{};
  data.habits=data.habits||{};
  return data;
}

function exerciseDoneValue(date,exerciseKey,index){
  const data=state.daily?.[date];
  if(!data)return false;
  if(exerciseKey && data.exerciseByKey?.[exerciseKey]!==undefined){
    return data.exerciseByKey[exerciseKey]===true;
  }
  return data.exercise?.[index]===true;
}

function exerciseLoadValue(date,exerciseKey,index){
  const data=state.daily?.[date];
  if(!data)return{};
  if(exerciseKey && data.loadsByKey?.[exerciseKey]!==undefined){
    return data.loadsByKey[exerciseKey]||{};
  }
  return data.loads?.[index]||{};
}

function setExerciseDoneValue(date,exerciseKey,index,value){
  const data=dayData(date);
  data.exercise[index]=Boolean(value);               // backwards compatibility
  if(exerciseKey)data.exerciseByKey[exerciseKey]=Boolean(value); // stable identity
}

function setExerciseLoadField(date,exerciseKey,index,field,value){
  const data=dayData(date);
  data.loads[index]=data.loads[index]||{};            // backwards compatibility
  data.loads[index][field]=value;
  if(exerciseKey){
    data.loadsByKey[exerciseKey]=data.loadsByKey[exerciseKey]||{};
    data.loadsByKey[exerciseKey][field]=value;        // stable identity
  }
}
