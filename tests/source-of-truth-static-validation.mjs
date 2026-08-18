import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
import {fileURLToPath} from "node:url";

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,"..");
const read=relative=>fs.readFileSync(path.join(root,relative),"utf8");

const configSource=read("js/config.js")+`
this.__PLAN=DEFAULT_PLAN;
this.__IDS=VERIFIED_EXERCISE_DB_IDS;
this.__LEGACY=LEGACY_EXERCISE_KEY_MAP;
`;
const context={};
vm.createContext(context);
vm.runInContext(configSource,context);

const plan=context.__PLAN;
const ids=context.__IDS;
const uniqueKeys=[...new Set(Object.values(plan).flatMap(day=>day.exercises.map(ex=>ex.key)))];
const realKeys=uniqueKeys.filter(key=>key!=="meal-prep-review");

const app=read("js/app.js");
const food=read("js/food.js");
const storage=read("js/storage.js");
const sw=read("sw.js");
const config=read("js/config.js");
const files=fs.readdirSync(path.join(root,"assets"));

const errors=[];
const assert=(condition,message)=>{if(!condition)errors.push(message);};

for(const key of realKeys){
  assert(typeof ids[key]==="string" && /^[A-Za-z0-9]{7}$/.test(ids[key]),`Missing/invalid ExerciseDB V1 ID for ${key}`);
  const occurrences=Object.values(plan).flatMap(day=>day.exercises).filter(ex=>ex.key===key);
  for(const exercise of occurrences)assert(exercise.exerciseDbId===ids[key],`Plan slot ${exercise.slotKey} does not carry configured ID for ${key}`);
}
assert(uniqueKeys.includes("meal-prep-review"),"Meal Prep + Weekly Review missing");
assert(Object.keys(ids).length===realKeys.length,`Expected ${realKeys.length} verified IDs, found ${Object.keys(ids).length}`);

assert(app.includes("async function getExerciseRecord(exerciseDbId"),"Missing common getExerciseRecord(ID) resolver");
assert(app.includes("record.name") && app.includes("record.gifUrl") && app.includes("record.instructions"),"Exact API record fields are not rendered together");
assert(app.includes("EXERCISE_RECORD_CACHE_VERSION=6"),"Exercise cache version is not v6");
assert(app.includes("recordsById:{}"),"ID-only exercise cache is missing");
assert(!app.includes("idsByKey"),"Old pinned name-discovery cache remains");
assert(!app.includes("discoverAndPinExerciseId"),"Old discovery resolver remains");
assert(!app.includes("exact-name-bootstrap"),"Old exact-name bootstrap path remains");
assert(!config.includes("bootstrapExactNames"),"bootstrapExactNames remains in production config");
assert(!config.includes("EXERCISE_REGISTRY"),"EXERCISE_REGISTRY remains in production config");
assert(!app.includes("scoreExerciseMatch"),"Fuzzy matching remains");
assert(app.includes('exerciseUnavailableMarkup("Exercise details temporarily unavailable")'),"Exact-record API failure UI missing");
assert(app.includes('exerciseUnavailableMarkup("Demo temporarily unavailable")'),"Media-only GIF failure UI missing");
assert(!files.includes("lat-pulldown-reference.png"),"Legacy special demo PNG remains");

assert(storage.includes("migrateDailyHistoryToStableKeys"),"Stable-key history migration missing");
assert(storage.includes("exerciseByKey") && storage.includes("loadsByKey"),"Stable-key history stores missing");
assert(storage.includes("data.exercise[index]") && storage.includes("data.loads[index]"),"Legacy index compatibility was removed");
assert(storage.includes("exercise.exerciseDbId=VERIFIED_EXERCISE_DB_IDS"),"Existing plan migration does not attach verified IDs");

assert(food.includes('const MEALDB_API_BASE="https://www.themealdb.com/api/json/v1/1"'),"TheMealDB is not the single recipe API");
assert(food.includes("lookup.php?i="),"Food lookup is not ID-based");
assert(food.includes("record.strMeal") && food.includes("record.strMealThumb") && food.includes("strInstructions"),"Food card is not sourced from one recipe record");
assert(food.includes("RECIPE_CACHE_VERSION=4"),"Food cache changed unexpectedly");

assert(sw.includes('moin-gym-exercisedb-v1-verified-v7-20260817'),"Service-worker cache was not bumped");
assert(sw.includes("keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key))"),"Old service-worker caches are not deleted");
assert(sw.includes("requestUrl.origin!==self.location.origin"),"External API requests are still service-worker cached");

if(errors.length){console.error(errors.join("\n"));process.exit(1);}
console.log(`PASS: ${realKeys.length} unique workout exercises have fixed ExerciseDB V1 IDs.`);
console.log("PASS: production exercise path is stable key -> configured V1 ID -> exact record; no name discovery remains.");
console.log("PASS: existing history migration remains compatible and food architecture is unchanged.");
