/*
food.js
API-record-driven food system.

Source of truth: TheMealDB only.
A meal card uses one TheMealDB record for:
- idMeal
- strMeal (displayed name)
- strMealThumb (image)
- strIngredient* + strMeasure* (ingredients)
- strInstructions (quick/full recipe)

Local data is limited to scheduling and portion guidance for this fitness plan.
It never renames the API recipe or replaces its recipe/media with another source.
*/
const MEALDB_API_BASE="https://www.themealdb.com/api/json/v1/1";
const RECIPE_CACHE_VERSION=4;
const RECIPE_CACHE_KEY=`moinRecipeCache:v${RECIPE_CACHE_VERSION}`;

/*
Verified TheMealDB recipe IDs used by the rotation.
The day/week algorithm rotates these records instead of inventing local meal identities.
*/
const RECIPE_POOLS={
  breakfast:["53076","53215","52915","53076"], // Bread omelette / Shakshouka / French Omelette
  lunch:["52795","53358","53011","53367"],     // Chicken Handi / Mandi / Quinoa salad / Fried rice
  snack:["52852","52955","53011","53215"],     // Tuna Nicoise / Egg Drop Soup / salad / Shakshouka
  dinner:["52806","52851","53218","53039"]     // Tandoori / Nutty curry / Shawarma / Piri-piri
};


const RECIPE_NUTRITION_ESTIMATES={"53076":[380,20,3],"53215":[360,20,5],"52915":[310,22,1],"52795":[520,48,5],"53358":[600,45,4],"53011":[460,40,7],"53367":[520,35,4],"52852":[300,25,4],"52955":[180,12,2],"52806":[500,50,5],"52851":[550,45,5],"53218":[520,45,5],"53039":[450,48,6]};
function nutritionEstimate(id){const n=RECIPE_NUTRITION_ESTIMATES[id];return n?`≈ ${n[0]} kcal • ${n[1]} g protein • ${n[2]} g fiber`:"Nutrition estimate unavailable";}

const RECIPE_PORTION_GUIDANCE={
  "53076":"Use 1 recipe serving; avoid extra butter/oil.",
  "53215":"Use 2 eggs from the prepared dish with one small roti/flatbread if needed.",
  "52915":"Use the 3-egg omelette as the meal; skip extra cheese/butter beyond the API recipe and avoid a second bread serving.",
  "52955":"Use one bowl as the snack; do not add noodles or another starch on the side.",
  "52795":"Use about 180 g cooked chicken; keep cream/gravy modest and pair with 1–2 small rotis.",
  "53358":"Prioritize the chicken and limit cooked rice to about one medium bowl.",
  "53011":"Use a protein-forward serving: chicken first, roughly one small bowl of quinoa mixture.",
  "53367":"Use one medium bowl; prioritize chicken/egg and do not take a second rice serving.",
  "52852":"For snack use roughly half a normal recipe serving, emphasizing tuna and egg.",
  "52806":"Use about 180–200 g cooked chicken with vegetables and 1–2 small rotis if required.",
  "52851":"Use a chicken-heavy serving; keep peanut sauce/rice portion controlled.",
  "53218":"Use the chicken and yoghurt sauce as the focus; limit fries/flatbread to a small portion.",
  "53039":"Use a chicken-heavy serving with slaw; keep mayonnaise/fries minimal."
};

function getRecipeCache(){
  try{
    const parsed=JSON.parse(localStorage.getItem(RECIPE_CACHE_KEY)||"null");
    if(parsed?.version===RECIPE_CACHE_VERSION && parsed.records)return parsed;
  }catch{}
  return{version:RECIPE_CACHE_VERSION,records:{}};
}

function saveRecipeCache(cache){
  try{localStorage.setItem(RECIPE_CACHE_KEY,JSON.stringify(cache));}catch{}
}

function invalidateOldFoodCaches(){
  try{
    Object.keys(localStorage).forEach(key=>{
      if(key===RECIPE_CACHE_KEY)return;
      if(key.startsWith("moinFoodMedia") || key.startsWith("moinRecipeCache"))localStorage.removeItem(key);
    });
  }catch{}
}
invalidateOldFoodCaches();

async function fetchMealDbJson(url,timeoutMs=8000){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{
    const response=await fetch(url,{signal:controller.signal,headers:{Accept:"application/json"}});
    if(!response.ok)return null;
    return await response.json();
  }catch{return null;}
  finally{clearTimeout(timer);}
}

function isValidMealRecord(record,recipeId){
  return Boolean(
    record?.idMeal===String(recipeId) &&
    record?.strMeal &&
    record?.strMealThumb &&
    record?.strInstructions
  );
}

async function getRecipeRecord(recipeId){
  const id=String(recipeId);
  const cache=getRecipeCache();
  const cached=cache.records[id];

  // Recipe identity is immutable enough for this plan: once an exact ID record
  // has been validated, reuse that complete object and avoid repeated API calls.
  if(isValidMealRecord(cached,id))return cached;

  const payload=await fetchMealDbJson(`${MEALDB_API_BASE}/lookup.php?i=${encodeURIComponent(id)}`);
  const record=payload?.meals?.[0]||null;

  if(isValidMealRecord(record,id)){
    cache.records[id]=record;
    saveRecipeCache(cache);
    return record;
  }

  return null;
}

function mealIngredients(record){
  const rows=[];
  for(let index=1;index<=20;index++){
    const ingredient=String(record?.[`strIngredient${index}`]||"").trim();
    const measure=String(record?.[`strMeasure${index}`]||"").trim();
    if(!ingredient)continue;
    rows.push({ingredient,measure});
  }
  return rows;
}

function recipeInstructionSteps(record){
  const text=String(record?.strInstructions||"")
    .replace(/\r/g,"\n")
    .replace(/\n{2,}/g,"\n")
    .trim();

  if(!text)return[];

  const explicit=text.split(/\n+/).map(x=>x.trim()).filter(Boolean);
  if(explicit.length>=3)return explicit;

  return text
    .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
    .map(x=>x.trim())
    .filter(Boolean);
}

function rotationIndexForDate(date){
  const current=parseDate(date);
  const anchor=parseDate(CONFIG.defaultJourneyStart);
  const days=Math.floor((current-anchor)/86400000);
  const week=Math.floor(Math.max(0,days)/7);
  return((week+current.getDay())%4+4)%4;
}

function mealScheduleForDate(date){
  const current=parseDate(date),rotation=rotationIndexForDate(date);
  return[{slot:"breakfast",label:"Breakfast",recipeId:RECIPE_POOLS.breakfast[rotation]},{slot:"lunch",label:"Lunch",recipeId:RECIPE_POOLS.lunch[rotation]},{slot:"snack",label:"Snack",recipeId:RECIPE_POOLS.snack[rotation]},{slot:"dinner",label:"Dinner",recipeId:RECIPE_POOLS.dinner[rotation]}];
}

function recipeUnavailableCard(slot){
  return`
    <div class="meal-card">
      <button class="meal-summary" type="button">
        <div class="meal-icon">🍽️</div>
        <div><h3>${escapeHTML(slot.label)}: Recipe temporarily unavailable</h3><p>The exact API record could not be loaded.</p></div>
        <div class="expand-symbol">＋</div>
      </button>
      <div class="meal-details"><p>No different recipe or unrelated image is substituted.</p></div>
    </div>
  `;
}


function recipeCard(slot,record){
  const ingredients=mealIngredients(record);
  const steps=recipeInstructionSteps(record);
  const portion=RECIPE_PORTION_GUIDANCE[record.idMeal]||"Use a moderate single serving and prioritize the protein portion.";

  return`
    <div class="meal-card" data-recipe-id="${escapeHTML(record.idMeal)}">
      <button class="meal-summary" type="button">
        <div class="meal-icon">🍽️</div>
        <div>
          <h3>${escapeHTML(slot.label)}: ${escapeHTML(record.strMeal)}</h3>
          <p>${escapeHTML(portion)}</p>
        </div>
        <div class="expand-symbol">＋</div>
      </button>

      <div class="meal-details">
        <div class="food-choice">
          <b>Recipe:</b> ${escapeHTML(record.strMeal)}<br>
          <small>TheMealDB ID ${escapeHTML(record.idMeal)}</small>
        </div>

        <div class="food-choice">
          <b>Fitness portion guidance:</b> ${escapeHTML(portion)}<br><b>Approx. nutrition for recommended portion:</b> ${escapeHTML(nutritionEstimate(record.idMeal))}
        </div>

        <h4>Ingredients</h4>
        <ul>${ingredients.map(row=>`<li>${escapeHTML([row.measure,row.ingredient].filter(Boolean).join(" "))}</li>`).join("")}</ul>

        <h4>Quick recipe</h4>
        <ol>${steps.slice(0,3).map(step=>`<li>${escapeHTML(step)}</li>`).join("")}</ol>

        <button class="full-recipe-toggle" type="button">View full recipe</button>
        <div class="full-recipe">
          <div class="recipe-photo-wrap">
            <img class="recipe-photo loaded" loading="lazy" src="${escapeHTML(record.strMealThumb)}" alt="${escapeHTML(record.strMeal)}">
          </div>
          <div class="recipe-media-match">${escapeHTML(record.strMeal)} • TheMealDB ID ${escapeHTML(record.idMeal)}</div>
          <h4>Full step-by-step recipe</h4>
          <div class="recipe-steps">
            ${steps.map((step,index)=>`
              <div class="full-recipe-step">
                <div class="recipe-step-no">${index+1}</div>
                <p>${escapeHTML(step)}</p>
              </div>
            `).join("")}
          </div>
        </div>
      </div>
    </div>
  `;
}

async function renderFood(date){
  const schedule=mealScheduleForDate(date);
  $("#foodDateLabel").textContent=parseDate(date).toLocaleDateString([],{weekday:"long",day:"numeric",month:"long"});

  // Keep the current page structure; only its meal identity/data source changes.
  $("#foodMeals").innerHTML=schedule.map(slot=>slot.fasting?fastingCard(slot):`
    <div class="meal-card"><div class="meal-summary"><div class="meal-icon">🍽️</div><div><h3>${escapeHTML(slot.label)}: Loading recipe…</h3><p>Loading the exact recipe record.</p></div></div></div>
  `).join("");

  const records=await Promise.all(schedule.map(slot=>slot.fasting?Promise.resolve(null):getRecipeRecord(slot.recipeId)));
  if($("#selectedDate").value!==date)return;

  $("#foodMeals").innerHTML=schedule.map((slot,index)=>{
    if(slot.fasting)return fastingCard(slot);
    const record=records[index];
    return record?recipeCard(slot,record):recipeUnavailableCard(slot);
  }).join("");

  $$(".meal-summary").forEach(button=>{
    button.onclick=()=>{
      const card=button.closest(".meal-card");
      card.classList.toggle("open");
      const symbol=button.querySelector(".expand-symbol");
      if(symbol)symbol.textContent=card.classList.contains("open")?"−":"＋";
      playSound(card.classList.contains("open")?"open":"close");
    };
  });

  $$(".full-recipe-toggle").forEach(button=>{
    button.onclick=()=>{
      const full=button.nextElementSibling;
      const opening=!full.classList.contains("open");
      full.classList.toggle("open");
      button.textContent=opening?"Hide full recipe":"View full recipe";
      playSound(opening?"open":"close");
    };
  });
}

async function verifyMealRotationRecords(){
  const ids=[...new Set(Object.values(RECIPE_POOLS).flat())];
  const rows=[];
  for(const id of ids){
    const record=await getRecipeRecord(id);
    rows.push({
      recipeId:id,
      displayedName:record?.strMeal||"—",
      apiName:record?.strMeal||"—",
      imageUrl:record?.strMealThumb||"—",
      recipeSource:"TheMealDB",
      ingredients:mealIngredients(record).length,
      instructions:recipeInstructionSteps(record).length
    });
  }
  console.table(rows);
  return rows;
}
window.verifyMealRotationRecords=verifyMealRotationRecords;
