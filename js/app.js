/*
app.js
Main controller. Smaller calculations live in the other JS files.
*/

const QUOTES=[
"Consistency beats intensity when intensity cannot be repeated.",
"Do today's session well; Day 90 will take care of itself.",
"Your only job today is to complete the next useful action.",
"Train with control. Progress is built rep by rep.",
"A completed simple plan beats a missed perfect plan.",
"The body changes after the routine becomes normal.",
"You do not need motivation for every set; you need a system.",
"Small wins repeated daily become visible results.",
"Record the work. Improve the work. Repeat.",
"Do not chase exhaustion; chase progression.",
"Today is another vote for the physique you want.",
"Finish what is scheduled before adding what is unnecessary."
];

let monthlyUpToTodayMode=true;
let exerciseUpToTodayMode=true;
let deferredInstallPrompt=null;
let planEditMode=false;

function playSound(type="tap"){
  try{
    const AudioCtx=window.AudioContext||window.webkitAudioContext;
    const ctx=window.__moinAudioCtx||(window.__moinAudioCtx=new AudioCtx());
    const osc=ctx.createOscillator();
    const gain=ctx.createGain();
    const now=ctx.currentTime;

    const freq=type==="success"?720:type==="open"?520:type==="close"?330:430;
    osc.frequency.setValueAtTime(freq,now);
    osc.type="sine";
    gain.gain.setValueAtTime(.035,now);
    gain.gain.exponentialRampToValueAtTime(.001,now+.12);
    osc.connect(gain);gain.connect(ctx.destination);
    osc.start(now);osc.stop(now+.13);
  }catch{}
}

function renderQuote(){
  const d=parseDate(todayISO());
  const index=(d.getFullYear()*372+d.getMonth()*31+d.getDate())%QUOTES.length;
  const quote=$("#dailyQuote");
  quote.textContent=`“${QUOTES[index]}”`;
  quote.classList.remove("quote-enter");
  void quote.offsetWidth;
  quote.classList.add("quote-enter");
}

function updateClock(){
  const now=new Date();
  $("#clock").textContent=now.toLocaleTimeString([],{hour:"numeric",minute:"2-digit",second:"2-digit"});
  const selectedValue=$("#selectedDate")?.value;
  const weekdayDate=selectedValue?parseDate(selectedValue):now;
  $("#weekday").textContent=weekdayDate.toLocaleDateString([],{weekday:"long"});
}

function hexRgb(hex){
  const value=String(hex||"").replace("#","");
  if(!/^[0-9a-f]{6}$/i.test(value))return{r:0,g:0,b:0};
  return{r:parseInt(value.slice(0,2),16),g:parseInt(value.slice(2,4),16),b:parseInt(value.slice(4,6),16)};
}
function mixHex(a,b,weight=.5){
  const x=hexRgb(a),y=hexRgb(b),w=Math.max(0,Math.min(1,weight));
  const h=n=>Math.round(n).toString(16).padStart(2,"0");
  return `#${h(x.r+(y.r-x.r)*w)}${h(x.g+(y.g-x.g)*w)}${h(x.b+(y.b-x.b)*w)}`;
}
function appearanceProfile(){
  const themes={
    classic:{bg:"#eefbf3",card:"#ffffff",text:"#161616",muted:"#687386",line:"#e5ece8",row:"#ffffff",rowAlt:"#f8fbf9"},
    light:{bg:"#f6f7f9",card:"#ffffff",text:"#17191d",muted:"#687386",line:"#e2e6ea",row:"#ffffff",rowAlt:"#f7f9fb"},
    dark:{bg:"#07121f",card:"#0e1b2b",text:"#f4f8fd",muted:"#91a4bb",line:"#20364d",row:"#0e1b2b",rowAlt:"#13253a"},
    midnight:{bg:"#090b18",card:"#12162a",text:"#f7f7fb",muted:"#a0a8bf",line:"#292f4d",row:"#12162a",rowAlt:"#191f37"},
    ocean:{bg:"#e9f8fb",card:"#ffffff",text:"#12323a",muted:"#5f7d84",line:"#cfe7eb",row:"#ffffff",rowAlt:"#f3fbfc"},
    warm:{bg:"#fff6e8",card:"#fffdf8",text:"#352617",muted:"#806f5e",line:"#eadcc8",row:"#fffdf8",rowAlt:"#fff9ef"},
    rose:{bg:"#fff0f4",card:"#fffafb",text:"#382029",muted:"#866873",line:"#efd5de",row:"#fffafb",rowAlt:"#fff5f8"}
  };
  return themes[state.themePreset]||themes.classic;
}

function applyTheme(){
  const themePreset=state.themePreset||"classic";
  const accentPreset=state.accentPreset||"green";
  const accentMap={green:"#0a6b33",blue:"#075fc7",purple:"#6844cc",orange:"#c75c00",pink:"#b92968",teal:"#087e79",red:"#b4232d",gold:"#a66b00"};
  const accent=accentPreset==="custom"?(state.accent||"#0a6b33"):(accentMap[accentPreset]||accentMap.green);

  document.body.dataset.theme=themePreset;
  document.body.dataset.accent=accentPreset;
  document.body.style.setProperty("--accent",accent);

  // Multicolor keeps its gradient background while the other themes use a color palette.
  if(themePreset==="multicolor"){
    document.body.style.removeProperty("--bg");
    document.body.style.removeProperty("--card");
    document.body.style.removeProperty("--text");
    document.body.style.removeProperty("--muted");
    document.body.style.removeProperty("--line");
    document.body.style.removeProperty("--row");
    document.body.style.removeProperty("--rowAlt");
    document.body.style.setProperty("--accent2",mixHex(accent,"#ffffff",.18));
  }else if(themePreset==="custom"){
    const theme=state.themeColor||"#eefbf3",rgb=hexRgb(theme),luma=(.2126*rgb.r+.7152*rgb.g+.0722*rgb.b)/255,isDark=luma<.48;
    document.body.style.setProperty("--bg",theme);
    document.body.style.setProperty("--card",mixHex(theme,"#ffffff",isDark?.10:.78));
    document.body.style.setProperty("--row",mixHex(theme,"#ffffff",isDark?.12:.84));
    document.body.style.setProperty("--rowAlt",mixHex(theme,"#ffffff",isDark?.16:.68));
    document.body.style.setProperty("--text",isDark?"#f5f7fb":"#161616");
    document.body.style.setProperty("--muted",isDark?"#b6c0cc":"#687386");
    document.body.style.setProperty("--line",mixHex(theme,isDark?"#ffffff":"#000000",isDark?.22:.10));
    document.body.style.setProperty("--accent2",mixHex(accent,isDark?"#ffffff":"#000000",isDark?.22:.12));
  }else{
    const palette=appearanceProfile();
    Object.entries(palette).forEach(([key,value])=>document.body.style.setProperty(`--${key}`,value));
    const isDark=["dark","midnight"].includes(themePreset);
    document.body.style.setProperty("--accent2",mixHex(accent,isDark?"#ffffff":"#000000",isDark?.22:.12));
  }

  state.accent=accent;
  state.theme=themePreset;
  const themeSelect=$("#themePreset"),accentSelect=$("#accentPreset"),tc=$("#themeColor"),ac=$("#accentColor");
  if(themeSelect)themeSelect.value=themePreset;
  if(accentSelect)accentSelect.value=accentPreset;
  if(tc)tc.value=state.themeColor||"#eefbf3";
  if(ac)ac.value=state.accent||"#0a6b33";
  $("#themeCustomPicker")?.classList.toggle("hidden",themePreset!=="custom");
  $("#accentCustomPicker")?.classList.toggle("hidden",accentPreset!=="custom");

  const quick=$("#quickThemeToggle");
  if(quick){
    const dark=["dark","midnight"].includes(themePreset)||(themePreset==="custom"&&((.2126*hexRgb(state.themeColor||"#eefbf3").r+.7152*hexRgb(state.themeColor||"#eefbf3").g+.0722*hexRgb(state.themeColor||"#eefbf3").b)/255<.48));
    quick.textContent=dark?"☀":"☾";
    quick.setAttribute("aria-label",dark?"Switch to light theme":"Switch to dark theme");
  }
  const meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.content=themePreset==="custom"?(state.themeColor||"#eefbf3"):(appearanceProfile().bg||"#eefbf3");
}


function navigate(pageId){
  setActivePage(pageId);
  document.body.classList.toggle("on-home",pageId==="homePage");
  playSound("tap");
  if(pageId==="homePage")renderHome();
  if(pageId==="workoutPage"){setPlanEditMode(false);renderWorkoutView();}
  if(pageId==="foodPage")renderFood($("#selectedDate").value);
  if(pageId==="progressPage")renderProgressPage();
  if(pageId==="exercisePage")renderExercisePage();
  if(pageId==="journeyPage")renderJourney();
  if(pageId==="profilePage")renderProfile();
  if(pageId==="settingsPage")renderSettings();
}

function journeyDayNumber(date){
  return Math.floor((parseDate(date)-parseDate(state.startDate))/86400000)+1;
}

function workoutStreak(targetDate){
  let cursor=parseDate(typeof userStreakStartDate==="function"?userStreakStartDate():CONFIG.streakHistoryStart);
  const end=parseDate(targetDate),rows=[];
  while(cursor<=end){
    const date=toISO(cursor),plan=workoutForDate(date);
    if(plan.name!=="Recovery")rows.push({date,completed:dayCompletion(date)===100});
    cursor.setDate(cursor.getDate()+1);
  }
  if(!rows.length)return 0;

  const target=rows.at(-1);
  const history=target.date===targetDate?rows.slice(0,-1):rows;
  if(!history.length)return target.date===targetDate&&target.completed?1:0;

  const type=history.at(-1).completed;
  let previous=0;
  for(let i=history.length-1;i>=0;i--){
    if(history[i].completed===type)previous+=type?1:-1;
    else break;
  }
  return target.date===targetDate&&target.completed?(previous<=0?1:previous+1):previous;
}


function exerciseWeightMax(exerciseName){
  const name=exerciseName.toLowerCase();

  if(name.includes("lateral raise"))return 25;
  if(name.includes("curl"))return 35;
  if(name.includes("triceps")||name.includes("extension"))return 45;
  if(name.includes("shoulder press"))return 50;
  if(name.includes("chest press"))return 100;
  if(name.includes("pulldown")||name.includes("row"))return 100;
  if(name.includes("leg press"))return 200;
  if(name.includes("romanian deadlift"))return 140;
  if(name.includes("hack squat")||name.includes("goblet squat"))return 120;
  if(name.includes("leg curl")||name.includes("leg extension"))return 100;
  if(name.includes("calf"))return 120;
  return 100;
}

function openWeightPicker(exerciseName,currentValue,onSelect){
  const max=exerciseWeightMax(exerciseName);
  const values=[];

  for(let value=0;value<=max;value+=2.5){
    values.push(Number(value.toFixed(1)));
  }

  $("#pickerSheet").innerHTML=`
    <div class="picker-head">
      <div>
        <h3>${escapeHTML(exerciseName)} — Weight</h3>
        <div style="font-size:9px;color:var(--muted);margin-top:2px">Tap a weight or use Custom.</div>
      </div>
      <button class="picker-close" id="pickerClose">×</button>
    </div>

    <div class="picker-grid">
      ${values.map(value=>`
        <button class="picker-option ${Number(currentValue)===value?"selected":""}" data-picker-weight="${value}">
          ${value}
        </button>
      `).join("")}
    </div>

    <div class="picker-custom">
      <input id="customWeightValue" type="number" min="0" step="0.5" inputmode="decimal" placeholder="Custom kg">
      <button id="customWeightSave">Use</button>
    </div>
  `;

  $("#pickerOverlay").classList.remove("hidden");

  $("#pickerClose").onclick=closePicker;

  $$("[data-picker-weight]").forEach(button=>{
    button.onclick=()=>{
      onSelect(Number(button.dataset.pickerWeight));
      closePicker();
    };
  });

  $("#customWeightSave").onclick=()=>{
    const value=$("#customWeightValue").value;
    if(value==="")return;
    onSelect(Number(value));
    closePicker();
  };
}

function openRepsPicker(currentValue,onSelect){
  const values=[1,2,3,4,5,6,7];

  $("#pickerSheet").innerHTML=`
    <div class="picker-head">
      <div>
        <h3>Repetitions</h3>
        <div style="font-size:9px;color:var(--muted);margin-top:2px">Quick choices 1–7.</div>
      </div>
      <button class="picker-close" id="pickerClose">×</button>
    </div>

    <div class="picker-grid">
      ${values.map(value=>`
        <button class="picker-option ${Number(currentValue)===value?"selected":""}" data-picker-reps="${value}">
          ${value}
        </button>
      `).join("")}
    </div>
  `;

  $("#pickerOverlay").classList.remove("hidden");
  $("#pickerClose").onclick=closePicker;

  $$("[data-picker-reps]").forEach(button=>{
    button.onclick=()=>{
      onSelect(Number(button.dataset.pickerReps));
      closePicker();
    };
  });
}

function closePicker(){
  $("#pickerOverlay").classList.add("hidden");
}




/* ============================================================
   EXERCISEDB SOURCE OF TRUTH — VERIFIED V1 IDS ONLY
   ============================================================ */
const EXERCISE_RECORD_CACHE_VERSION=6;
const EXERCISE_RECORD_CACHE_KEY=`moinExerciseRecordCache:v${EXERCISE_RECORD_CACHE_VERSION}`;
const EXERCISE_API_BASE="https://oss.exercisedb.dev/api/v1/exercises";

function configuredExerciseDbId(exerciseOrKey){
  if(exerciseOrKey && typeof exerciseOrKey==="object" && exerciseOrKey.exerciseDbId)return String(exerciseOrKey.exerciseDbId);
  const key=typeof exerciseOrKey==="string"?exerciseOrKey:exerciseOrKey?.key;
  return VERIFIED_EXERCISE_DB_IDS[key]||null;
}

function getExerciseRecordCache(){
  try{
    const parsed=JSON.parse(localStorage.getItem(EXERCISE_RECORD_CACHE_KEY)||"null");
    if(parsed?.version===EXERCISE_RECORD_CACHE_VERSION && parsed.recordsById && typeof parsed.recordsById==="object")return parsed;
  }catch{}
  return{version:EXERCISE_RECORD_CACHE_VERSION,recordsById:{}};
}

function saveExerciseRecordCache(cache){
  try{localStorage.setItem(EXERCISE_RECORD_CACHE_KEY,JSON.stringify(cache));}catch{}
}

function invalidateOldExerciseMediaCaches(){
  try{
    Object.keys(localStorage).forEach(key=>{
      if(key===EXERCISE_RECORD_CACHE_KEY)return;
      if(key.startsWith("moinExerciseDemo") || key.startsWith("moinExerciseMedia") || key.startsWith("moinExerciseRecordCache") || key.startsWith("moinExerciseDb"))localStorage.removeItem(key);
    });
    Object.keys(sessionStorage).forEach(key=>{
      if(key.startsWith("moinExerciseDb") || key.startsWith("moinExerciseDemo") || key.startsWith("moinExerciseMedia"))sessionStorage.removeItem(key);
    });
  }catch{}
}
invalidateOldExerciseMediaCaches();

async function fetchJsonWithTimeout(url,timeoutMs=8000){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{
    const response=await fetch(url,{signal:controller.signal,headers:{Accept:"application/json"}});
    if(!response.ok)return{ok:false,status:response.status,data:null};
    return{ok:true,status:response.status,data:await response.json()};
  }catch(error){
    return{ok:false,status:0,data:null,error};
  }finally{clearTimeout(timer);}
}

function extractExerciseRows(payload){
  if(Array.isArray(payload))return payload;
  if(Array.isArray(payload?.data))return payload.data;
  if(Array.isArray(payload?.exercises))return payload.exercises;
  if(Array.isArray(payload?.results))return payload.results;
  return[];
}

function unwrapExerciseRecord(payload){
  if(payload?.exerciseId)return payload;
  if(payload?.data?.exerciseId)return payload.data;
  return extractExerciseRows(payload)[0]||null;
}

function normalizeExerciseDbRecord(record){
  if(!record)return null;
  return{
    ...record,
    bodyParts:Array.isArray(record.bodyParts)?record.bodyParts:[],
    equipments:Array.isArray(record.equipments)?record.equipments:[],
    targetMuscles:Array.isArray(record.targetMuscles)?record.targetMuscles:[],
    secondaryMuscles:Array.isArray(record.secondaryMuscles)?record.secondaryMuscles:[],
    instructions:Array.isArray(record.instructions)?record.instructions:[]
  };
}

function isUsableExerciseDbRecord(record){
  return Boolean(record?.exerciseId && record?.name);
}

async function getExerciseRecord(exerciseDbId,{allowCached=true}={}){
  const wanted=String(exerciseDbId||"");
  if(!wanted)return null;
  const cache=getExerciseRecordCache();

  if(allowCached){
    const cached=cache.recordsById[wanted];
    if(isUsableExerciseDbRecord(cached) && String(cached.exerciseId)===wanted)return normalizeExerciseDbRecord(cached);
  }

  const response=await fetchJsonWithTimeout(`${EXERCISE_API_BASE}/${encodeURIComponent(wanted)}`);
  if(!response.ok){
    const cached=cache.recordsById[wanted];
    return allowCached && isUsableExerciseDbRecord(cached) && String(cached.exerciseId)===wanted
      ? normalizeExerciseDbRecord(cached)
      : null;
  }

  const record=normalizeExerciseDbRecord(unwrapExerciseRecord(response.data));
  if(!isUsableExerciseDbRecord(record) || String(record.exerciseId)!==wanted)return null;

  cache.recordsById[wanted]=record;
  saveExerciseRecordCache(cache);
  return record;
}

async function resolveExerciseRecord(exerciseOrKey){
  const trackingKey=typeof exerciseOrKey==="string"?exerciseOrKey:exerciseOrKey?.key;
  if(trackingKey==="meal-prep-review")return{status:"non-exercise",trackingKey};
  const exerciseDbId=configuredExerciseDbId(exerciseOrKey);
  if(!trackingKey || !exerciseDbId)return{status:"unavailable",trackingKey,exerciseDbId:null};
  const record=await getExerciseRecord(exerciseDbId);
  return record
    ? {status:"ok",trackingKey,exerciseDbId,record,method:"configured-exercise-db-id"}
    : {status:"unavailable",trackingKey,exerciseDbId,method:"configured-exercise-db-id"};
}

function cachedExerciseRecordForKey(trackingKey){
  const id=configuredExerciseDbId(trackingKey);
  if(!id)return null;
  const record=getExerciseRecordCache().recordsById[id];
  return isUsableExerciseDbRecord(record) && String(record.exerciseId)===String(id)
    ? normalizeExerciseDbRecord(record)
    : null;
}

function exerciseDisplayNameSync(exerciseOrKey){
  const key=typeof exerciseOrKey==="string"?exerciseOrKey:exerciseOrKey?.key;
  const record=cachedExerciseRecordForKey(key);
  if(record?.name)return record.name;
  if(EXERCISE_FALLBACK_NAMES[key])return EXERCISE_FALLBACK_NAMES[key];
  if(exerciseOrKey?.name)return exerciseOrKey.name;
  return "Exercise";
}

function exerciseUnavailableMarkup(message="Demo temporarily unavailable"){
  return`<div class="demo-unavailable"><div class="demo-unavailable-icon">🏋️</div><h4>${escapeHTML(message)}</h4></div>`;
}

function renderExerciseRecordMedia(slot,status,resolution){
  if(!slot||!status)return;
  if(resolution.status==="non-exercise"){
    slot.className="";
    slot.innerHTML=exerciseUnavailableMarkup("No exercise demo needed");
    status.textContent="This schedule item is not an exercise.";
    return;
  }
  if(resolution.status!=="ok"){
    slot.className="";
    slot.innerHTML=exerciseUnavailableMarkup("Exercise details temporarily unavailable");
    status.textContent="Configured ExerciseDB record is temporarily unavailable.";
    return;
  }

  const record=resolution.record;
  slot.className="";
  if(!record.gifUrl){
    slot.innerHTML=exerciseUnavailableMarkup("Demo temporarily unavailable");
  }else{
    slot.innerHTML=`<img class="exercise-real-media" src="${escapeHTML(record.gifUrl)}" alt="${escapeHTML(record.name)} exercise demo">`;
    const img=slot.querySelector("img");
    img.addEventListener("error",()=>{slot.innerHTML=exerciseUnavailableMarkup("Demo temporarily unavailable");},{once:true});
  }
  status.textContent=`${record.name} • ID ${record.exerciseId}`;
}

async function hydrateExerciseTitleElement(element,trackingKey){
  if(!element||!trackingKey)return;
  const result=await resolveExerciseRecord(trackingKey);
  if(result.status==="ok"){
    element.textContent=result.record.name;
    syncExerciseNameEverywhere(trackingKey,result.record);
  }
}

function hydrateExerciseTitles(root=document){
  root.querySelectorAll?.("[data-exercise-title-key]").forEach(element=>{
    hydrateExerciseTitleElement(element,element.dataset.exerciseTitleKey);
  });
}

function syncExerciseNameEverywhere(trackingKey,record){
  if(!trackingKey||!record?.name)return;
  document.querySelectorAll(`[data-exercise-title-key="${CSS.escape(trackingKey)}"]`).forEach(element=>{
    element.textContent=record.name;
  });
  const option=document.querySelector(`#exerciseSelect option[value="${CSS.escape(trackingKey)}"]`);
  if(option)option.textContent=record.name;
}

let exerciseRecordPrimeStarted=false;
async function primeExerciseRecordsInBackground(){
  if(exerciseRecordPrimeStarted)return;
  exerciseRecordPrimeStarted=true;
  const queue=Object.keys(VERIFIED_EXERCISE_DB_IDS);
  async function worker(){
    while(queue.length){
      const key=queue.shift();
      const resolution=await resolveExerciseRecord(key);
      if(resolution.status==="ok")syncExerciseNameEverywhere(key,resolution.record);
    }
  }
  await Promise.all([worker(),worker(),worker()]);
}
window.primeExerciseRecordsInBackground=primeExerciseRecordsInBackground;

async function verifyAllWorkoutExerciseRecords(){
  const rows=[];
  const seen=new Set();
  Object.entries(state.plan).forEach(([dayIndex,day])=>{
    day.exercises.forEach((exercise,index)=>{
      if(exercise.key==="meal-prep-review" || seen.has(exercise.key))return;
      seen.add(exercise.key);
      rows.push({
        workoutSlot:`day-${dayIndex}-exercise-${index+1}`,
        internalKey:exercise.key,
        exerciseDbId:configuredExerciseDbId(exercise)
      });
    });
  });

  const report=[];
  for(const row of rows){
    const result=await resolveExerciseRecord(row.internalKey);
    const record=result.record||{};
    report.push({
      ...row,
      exerciseDbName:record.name||"—",
      gif:record.gifUrl?"YES":"NO",
      instructionsCount:Array.isArray(record.instructions)?record.instructions.length:0,
      status:result.status==="ok"?"OK":"FAIL"
    });
  }
  console.table(report);
  return report;
}
window.verifyAllWorkoutExerciseRecords=verifyAllWorkoutExerciseRecords;

function openExerciseGuide(trackingKey){
  const fallback=EXERCISE_FALLBACK_NAMES[trackingKey]||"Exercise";
  openModal(`
    <div class="exercise-guide-modal">
      <div class="picker-head">
        <div><h3 id="exerciseGuideTitle">${escapeHTML(fallback)}</h3><div style="font-size:9px;color:var(--muted)">Exercise guide</div></div>
        <button id="guideClose" class="picker-close">×</button>
      </div>
      <div class="guide-tabs">
        <button class="guide-tab active" data-guide-tab="demo">Demo</button>
        <button class="guide-tab" data-guide-tab="text">How to Do</button>
      </div>
      <div class="guide-page active" data-guide-page="demo">
        <div id="exerciseMediaSlot" class="media-loading">Loading demo...</div>
        <p id="exerciseMediaStatus" class="exercise-media-status">Loading ExerciseDB record…</p>
      </div>
      <div class="guide-page" data-guide-page="text">
        <div class="guide-copy"><p>Loading ExerciseDB instructions…</p></div>
      </div>
    </div>`);

  playSound("open");
  $("#guideClose").onclick=()=>{playSound("close");closeModal();};
  $$('[data-guide-tab]').forEach(tab=>{
    tab.onclick=()=>{
      $$('[data-guide-tab]').forEach(x=>x.classList.remove("active"));
      $$('[data-guide-page]').forEach(x=>x.classList.remove("active"));
      tab.classList.add("active");
      $(`[data-guide-page="${tab.dataset.guideTab}"]`).classList.add("active");
      playSound("tap");
    };
  });

  (async()=>{
    const resolution=await resolveExerciseRecord(trackingKey);
    renderExerciseRecordMedia($("#exerciseMediaSlot"),$("#exerciseMediaStatus"),resolution);
    const copy=$(".guide-copy");
    if(!copy)return;
    if(resolution.status!=="ok"){
      copy.innerHTML=`<p>Exercise details temporarily unavailable.</p>`;
      return;
    }

    const record=resolution.record;
    $("#exerciseGuideTitle").textContent=record.name;
    copy.innerHTML=`
      <h4>${escapeHTML(record.name)}</h4>
      ${record.instructions.length
        ? `<ol>${record.instructions.map(step=>`<li>${escapeHTML(step)}</li>`).join("")}</ol>`
        : `<p>No instructions were supplied by this ExerciseDB record.</p>`}
      <h4>ExerciseDB record</h4>
      <p>ID ${escapeHTML(record.exerciseId)}${record.equipments.length?` • ${escapeHTML(record.equipments.join(", "))}`:""}${record.targetMuscles.length?` • ${escapeHTML(record.targetMuscles.join(", "))}`:""}${record.secondaryMuscles.length?` • Secondary: ${escapeHTML(record.secondaryMuscles.join(", "))}`:""}</p>`;
    syncExerciseNameEverywhere(trackingKey,record);
  })();
}

function bindLongPress(element,name){
  let timer=null,moved=false;
  const start=()=>{
    moved=false;
    timer=setTimeout(()=>{if(!moved)openExerciseGuide(name);timer=null;},520);
  };
  const cancel=()=>{if(timer){clearTimeout(timer);timer=null;}};
  element.addEventListener("pointerdown",start);
  element.addEventListener("pointermove",()=>{moved=true;cancel();});
  element.addEventListener("pointerup",cancel);
  element.addEventListener("pointercancel",cancel);
  element.addEventListener("contextmenu",e=>e.preventDefault());
}

function renderHome(){
  const date=$("#selectedDate").value;
  const profile=(typeof getUserProfile==="function"?getUserProfile():null)||state.userProfile||{};
  const displayName=profile.name||"User";
  const homeName=$("#homeUserName"),headerName=$("#headerUserName");
  if(homeName)homeName.textContent=`Welcome, ${displayName}`;
  if(headerName)headerName.textContent=displayName.toUpperCase();
  const plan=workoutForDate(date),data=dayData(date),percent=dayCompletion(date);

  $("#dailyPercent").textContent=`${percent}%`;
  updateRing($("#dailyRing"),percent);
  $("#workoutName").textContent=plan.name;

  const fasting=state.fridayFast&&parseDate(date).getDay()===5;
  $("#gymTimeDisplay").textContent=fasting?"After Iftar":formatClockTime(state.gymTime);
  $("#fastNotice").classList.toggle("hidden",!fasting);

  const j=journeyDayNumber(date);
  $("#dayNumber").textContent=j<1?"Before Start":j>90?"Complete":`${j} / 90`;
  $("#workoutStreakDisplay").innerHTML=formatStreakHtml(workoutStreak(date));

  $("#homeExerciseCards").innerHTML=plan.exercises.map((exercise,index)=>{
    const load=exerciseLoadValue(date,exercise.key,index),streak=getStreakInfo(exercise.key,date).current;
    return`<div class="exercise-card">
      <div class="exercise-top">
        <div class="exercise-num">${index+1}</div>
        <div class="exercise-name-zone" data-guide-key="${escapeHTML(exercise.key)}"><h3 data-exercise-title-key="${escapeHTML(exercise.key)}">${escapeHTML(exerciseDisplayNameSync(exercise))}</h3><p>${escapeHTML(exercise.sets)} sets • ${escapeHTML(exercise.reps)} reps</p><div class="longpress-hint">Hold name for exercise guide</div></div>
        <div class="exercise-streak">${formatStreakHtml(streak)}</div>
      </div>

      <div class="exercise-quick-row">
        <button class="quick-value" data-open-weight="${index}">
          <span>WEIGHT</span>
          <b>${load.weight!==undefined&&load.weight!==""?escapeHTML(load.weight)+" kg":"—"}</b>
        </button>

        <button class="quick-value" data-open-reps="${index}">
          <span>REPS</span>
          <b>${load.reps!==undefined&&load.reps!==""?escapeHTML(load.reps):"—"}</b>
        </button>

        <label class="quick-check-wrap">
          <input data-exercise-check="${index}" class="status-check" type="checkbox" ${exerciseDoneValue(date,exercise.key,index)?"checked":""}>
        </label>
      </div>
    </div>`;
  }).join("");

  $$("[data-open-weight]").forEach(button=>button.onclick=()=>{
    const index=Number(button.dataset.openWeight);
    const exercise=plan.exercises[index];
    const load=exerciseLoadValue(date,exercise.key,index);

    openWeightPicker(exerciseDisplayNameSync(exercise),load.weight,value=>{
      setExerciseLoadField(date,exercise.key,index,"weight",value);
      saveState();
      renderHome();
    });
  });

  $$("[data-open-reps]").forEach(button=>button.onclick=()=>{
    const index=Number(button.dataset.openReps);
    const exercise=plan.exercises[index];
    const load=exerciseLoadValue(date,exercise.key,index);

    openRepsPicker(load.reps,value=>{
      setExerciseLoadField(date,exercise.key,index,"reps",value);
      saveState();
      renderHome();
    });
  });

  $$("[data-guide-key]").forEach(el=>bindLongPress(el,el.dataset.guideKey));

  $$("[data-exercise-check]").forEach(input=>input.onchange=()=>{
    const index=Number(input.dataset.exerciseCheck);
    const exercise=plan.exercises[index];
    setExerciseDoneValue(date,exercise.key,index,input.checked);
    saveState();
    playSound(input.checked?"success":"tap");
    checkboxPopup(`${exerciseDisplayNameSync(plan.exercises[index])} ${input.checked?"completed":"unchecked"}`,input.checked);
    renderHome();
  });

  hydrateExerciseTitles($("#homeExerciseCards"));

  [["stepGoal","steps","8,000+ steps"],["waterGoal","water","Water goal"],["proteinGoal","protein","Protein-focused meals"],["sleepGoal","sleep","Sleep goal"]]
  .forEach(([id,key,label])=>{
    const input=$("#"+id);
    input.checked=!!data.habits[key];
    input.onchange=()=>{
      data.habits[key]=input.checked;
      saveState();
      playSound(input.checked?"success":"tap");checkboxPopup(label,input.checked);
    };
  });
}


function renderWorkoutView(){
  const names=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  $("#workoutView").innerHTML=[1,2,3,4,5,6,0].map(dayIndex=>{
    const plan=state.plan[dayIndex];
    return `<div class="workout-day-view">
      <div class="workout-day-head"><span>${names[dayIndex]}</span><span>${escapeHTML(plan.name)}</span></div>
      <div class="workout-day-list">
        ${plan.exercises.map((ex,i)=>`<div class="workout-ex-row">
          <div class="exercise-num">${i+1}</div>
          <div class="workout-guide-zone" data-workout-guide="${escapeHTML(ex.key)}">
            <h4 data-exercise-title-key="${escapeHTML(ex.key)}">${escapeHTML(exerciseDisplayNameSync(ex))}</h4>
            <p>${escapeHTML(ex.sets)} sets • ${escapeHTML(ex.reps)} reps</p>
          </div>
          <button class="exercise-info-btn" data-info-exercise="${escapeHTML(ex.key)}">i</button>
        </div>`).join("")}
      </div>
    </div>`;
  }).join("");

  hydrateExerciseTitles($("#workoutView"));
  $$("[data-info-exercise]").forEach(btn=>btn.onclick=()=>openExerciseGuide(btn.dataset.infoExercise));
  $$("[data-workout-guide]").forEach(el=>bindLongPress(el,el.dataset.workoutGuide));
}

function setPlanEditMode(enabled){
  planEditMode=enabled;
  $("#workoutView").classList.toggle("hidden",enabled);
  $("#planEditor").classList.toggle("hidden",!enabled);
  $("#restorePlan").classList.toggle("hidden",!enabled);
  $("#togglePlanEdit").textContent=enabled?"Done":"Edit";
  if(enabled)renderPlanEditor();else renderWorkoutView();
  playSound("tap");
}

function renderPlanEditor(){
  const names=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  $("#planEditor").innerHTML=[1,2,3,4,5,6,0].map(dayIndex=>{
    const plan=state.plan[dayIndex];
    return`<div class="day-editor">
      <div class="day-editor-head"><h3>${names[dayIndex]}</h3><input data-day-name="${dayIndex}" value="${escapeHTML(plan.name)}"><button data-add-exercise="${dayIndex}" class="add-btn">+ Add exercise</button></div>
      ${plan.exercises.map((ex,index)=>`<div class="editor-row">
        <input data-plan-field="${dayIndex}|${index}|name" value="${escapeHTML(ex.name)}">
        <input data-plan-field="${dayIndex}|${index}|sets" value="${escapeHTML(ex.sets)}">
        <input data-plan-field="${dayIndex}|${index}|reps" value="${escapeHTML(ex.reps)}">
        <button data-remove-exercise="${dayIndex}|${index}" class="delete-btn">Remove</button>
      </div>`).join("")}
    </div>`;
  }).join("");

  $$("[data-day-name]").forEach(i=>i.onchange=()=>{state.plan[i.dataset.dayName].name=i.value;saveState();});
  $$("[data-plan-field]").forEach(i=>i.onchange=()=>{const[d,n,f]=i.dataset.planField.split("|");state.plan[d].exercises[Number(n)][f]=i.value;saveState();refreshExerciseSelect();});
  $$('[data-add-exercise]').forEach(b=>b.onclick=()=>{
    const dayIndex=b.dataset.addExercise;
    const index=state.plan[dayIndex].exercises.length;
    const key=`custom-${dayIndex}-${Date.now()}-${index+1}`;
    state.plan[dayIndex].exercises.push({key,slotKey:`day-${dayIndex}-exercise-${index+1}`,name:"New Exercise",sets:"3",reps:"10"});
    saveState();renderPlanEditor();refreshExerciseSelect();
  });
  $$("[data-remove-exercise]").forEach(b=>b.onclick=()=>{const[d,n]=b.dataset.removeExercise.split("|");state.plan[d].exercises.splice(Number(n),1);saveState();renderPlanEditor();refreshExerciseSelect();});
}

function renderMonthlyProgress(){
  const[y,m]=$("#monthPicker").value.split("-").map(Number);
  const[start,end]=monthRange(y,m-1);
  const effectiveEnd=periodEndForMode(start,end,monthlyUpToTodayMode);

  let cursor=parseDate(start),final=parseDate(effectiveEnd),total=0,done=0,rows=[];
  while(cursor<=final){
    const date=toISO(cursor),plan=workoutForDate(date),pc=dayCompletion(date);
    total+=plan.exercises.length;
    done+=plan.exercises.filter((exercise,i)=>exerciseDoneValue(date,exercise.key,i)).length;
    rows.push({date,day:cursor.toLocaleDateString([],{weekday:"long"}),workout:plan.name,pc});
    cursor.setDate(cursor.getDate()+1);
  }

  if(!monthlyUpToTodayMode&&end>todayISO()){
    let future=parseDate(addDays(todayISO(),1)),fullEnd=parseDate(end);
    while(future<=fullEnd){total+=workoutForDate(toISO(future)).exercises.length;future.setDate(future.getDate()+1);}
  }

  const percent=total?Math.round(done/total*100):0;
  $("#monthlyPercent").textContent=`${percent}%`;
  $("#monthlyModeLabel").textContent=monthlyUpToTodayMode?"Up to Today":"Full Period";
  updateRing($("#monthlyRing"),percent);
  $("#monthlySummary").textContent=`${done} of ${total} scheduled exercise slots completed.`;
  drawMonthlyChart(rows);
  $("#monthlyBody").innerHTML=rows.map(r=>`<tr><td>${r.date}</td><td>${r.day}</td><td>${escapeHTML(r.workout)}</td><td>${r.pc}%</td><td>${r.pc===100?"✅":"⬜"}</td></tr>`).join("");
}


function drawMonthlyChart(rows){
  const canvas=$("#monthlyChart"),ctx=canvas.getContext("2d");
  ctx.clearRect(0,0,canvas.width,canvas.height);
  if(!rows.length)return;

  const accent=getComputedStyle(document.body).getPropertyValue("--accent").trim()||"#0a6b33";
  const muted=getComputedStyle(document.body).getPropertyValue("--muted").trim()||"#687386";
  const w=canvas.width,h=canvas.height,pad=36;
  const barW=Math.max(5,(w-pad*2)/rows.length*.62);

  ctx.strokeStyle="rgba(120,130,145,.25)";
  ctx.beginPath();ctx.moveTo(pad,15);ctx.lineTo(pad,h-pad);ctx.lineTo(w-10,h-pad);ctx.stroke();

  rows.forEach((row,i)=>{
    const x=pad+8+i*(w-pad-18)/rows.length;
    const bh=(h-pad-25)*(row.pc/100);
    ctx.fillStyle=row.pc===100?"#3b82f6":row.pc>=80?"#22c55e":row.pc>=50?"#eab308":"#ef4444";
    ctx.fillRect(x,h-pad-bh,barW,bh);
  });

  ctx.fillStyle=muted;ctx.font="12px system-ui";
  ctx.fillText("Daily workout completion %",pad,13);
}

function renderBodyProgress(){
  const arr=[...state.measurements].sort((a,b)=>a.date.localeCompare(b.date));
  const latest=arr.at(-1)||CONFIG.bodyStart;
  $("#currentWeight").textContent=`${(latest.weight??CONFIG.bodyStart.weight).toFixed(1)} kg`;
  $("#currentWaist").textContent=`${(latest.waist??CONFIG.bodyStart.waist).toFixed(1)} in`;
  $("#bodyHistory").innerHTML=[...arr].reverse().map(x=>`<tr><td>${x.date}</td><td>${x.weight??"-"}</td><td>${x.waist??"-"}</td><td>${x.lower??"-"}</td><td>${x.chest??"-"}</td><td>${x.hip??"-"}</td><td>${x.biceps??"-"}</td><td>${x.thigh??"-"}</td></tr>`).join("");
  drawWeightChart();
}

function drawWeightChart(){
  const canvas=$("#weightChart"),ctx=canvas.getContext("2d");
  const arr=[...state.measurements].filter(x=>x.weight).sort((a,b)=>a.date.localeCompare(b.date));
  ctx.clearRect(0,0,canvas.width,canvas.height);
  if(arr.length<2){ctx.fillStyle=getComputedStyle(document.body).getPropertyValue("--muted");ctx.font="16px system-ui";ctx.fillText("Add another check-in to see the weight trend.",20,40);return;}
  const values=arr.map(x=>x.weight),min=Math.min(...values)-1,max=Math.max(...values)+1;
  ctx.strokeStyle=getComputedStyle(document.body).getPropertyValue("--accent");ctx.lineWidth=4;ctx.beginPath();
  arr.forEach((x,i)=>{const px=50+i*(canvas.width-80)/(arr.length-1),py=canvas.height-35-(x.weight-min)/(max-min)*(canvas.height-70);i?ctx.lineTo(px,py):ctx.moveTo(px,py);});
  ctx.stroke();
}

function bodyField(label,id,type,value){return`<label>${label}<input id="${id}" type="${type}" ${type==="number"?'inputmode="decimal" min="0" step="0.1"':""} value="${escapeHTML(value??"")}"></label>`;}

function openBodyCheckin(){
  const latest=[...state.measurements].sort((a,b)=>a.date.localeCompare(b.date)).at(-1)||CONFIG.bodyStart;
  openModal(`<h3>Body Check-in</h3><div class="modal-grid">
    ${bodyField("Date","ciDate","date",todayISO())}${bodyField("Weight kg","ciWeight","number",latest.weight)}
    ${bodyField("Waist in","ciWaist","number",latest.waist)}${bodyField("Lower Belly in","ciLower","number",latest.lower)}
    ${bodyField("Chest in","ciChest","number",latest.chest)}${bodyField("Hip in","ciHip","number",latest.hip)}
    ${bodyField("Biceps in","ciBiceps","number",latest.biceps)}${bodyField("Thigh in","ciThigh","number",latest.thigh)}
  </div><div class="modal-actions"><button id="cancelCheckin" class="secondary-btn">Cancel</button><button id="saveCheckin" class="primary-btn">Save</button></div>`);
  $("#cancelCheckin").onclick=closeModal;
  $("#saveCheckin").onclick=()=>{
    const n=id=>$("#"+id).value===""?null:Number($("#"+id).value);
    const item={date:$("#ciDate").value,weight:n("ciWeight"),waist:n("ciWaist"),lower:n("ciLower"),chest:n("ciChest"),hip:n("ciHip"),biceps:n("ciBiceps"),thigh:n("ciThigh")};
    const index=state.measurements.findIndex(x=>x.date===item.date);
    if(index>=0)state.measurements[index]={...state.measurements[index],...item};else state.measurements.push(item);
    saveState();closeModal();renderBodyProgress();toast("Body check-in saved");
  };
}

function renderProgressPage(){renderMonthlyProgress();renderBodyProgress();}

function allExercises(){
  const keys=[];
  Object.values(state.plan).forEach(plan=>plan.exercises.forEach(exercise=>{
    if(exercise.key==="meal-prep-review")return;
    if(!keys.includes(exercise.key))keys.push(exercise.key);
  }));
  return keys.sort((a,b)=>exerciseDisplayNameSync(a).localeCompare(exerciseDisplayNameSync(b)));
}

function refreshExerciseSelect(){
  const current=$("#exerciseSelect").value;
  const keys=allExercises();
  $("#exerciseSelect").innerHTML=keys.map(key=>`<option value="${escapeHTML(key)}">${escapeHTML(exerciseDisplayNameSync(key))}</option>`).join("");
  if(keys.includes(current))$("#exerciseSelect").value=current;
}

function renderPeriodSpecificControls(){
  const mode=$("#periodSelect").value,now=new Date(),year=now.getFullYear(),month=now.getMonth()+1;
  if(mode==="weekly"){
    $("#periodSpecificControls").innerHTML=`<label>Month<input id="weeklyMonth" type="month" value="${year}-${String(month).padStart(2,"0")}"></label><label>Week<select id="weekNumber"><option value="1">1st Week</option><option value="2">2nd Week</option><option value="3">3rd Week</option><option value="4">4th Week</option><option value="5">5th Week</option></select></label>`;
  }else if(mode==="monthly"){
    $("#periodSpecificControls").innerHTML=`<label>Month<input id="monthlyMonth" type="month" value="${year}-${String(month).padStart(2,"0")}"></label>`;
  }else if(mode==="yearly"){
    const years=[];for(let y=2026;y<=year+3;y++)years.push(y);
    $("#periodSpecificControls").innerHTML=`<label>Year<select id="yearSelect">${years.map(y=>`<option value="${y}" ${y===year?"selected":""}>${y}</option>`).join("")}</select></label>`;
  }else $("#periodSpecificControls").innerHTML="";
  $("#periodSpecificControls").querySelectorAll("input,select").forEach(c=>c.onchange=renderExerciseProgress);
}

function selectedExerciseRange(){
  const mode=$("#periodSelect").value;
  if(mode==="weekly"){const[y,m]=$("#weeklyMonth").value.split("-").map(Number);return weekRange(y,m-1,Number($("#weekNumber").value));}
  if(mode==="monthly"){const[y,m]=$("#monthlyMonth").value.split("-").map(Number);return monthRange(y,m-1);}
  if(mode==="yearly")return yearRange(Number($("#yearSelect").value));
  return[streakHistoryStart(),todayISO()];
}

function renderExerciseProgress(){
  const name=$("#exerciseSelect").value;if(!name)return;
  const[start,end]=selectedExerciseRange();
  const rows=exercisePeriodRows(name,start,end,exerciseUpToTodayMode);
  let denominator=rows.length;

  if(!exerciseUpToTodayMode&&end>todayISO()){
    let cursor=parseDate(addDays(todayISO(),1)),final=parseDate(end);
    while(cursor<=final){if(exerciseIndexForDate(name,toISO(cursor))>=0)denominator++;cursor.setDate(cursor.getDate()+1);}
  }

  const completed=rows.filter(x=>x.completed).length,percent=denominator?Math.round(completed/denominator*100):0;
  $("#exercisePercent").textContent=`${percent}%`;$("#exerciseModeLabel").textContent=exerciseUpToTodayMode?"Up to Today":"Full Period";updateRing($("#exerciseRing"),percent);

  const streak=getStreakInfo(name,todayISO());
  $("#exStreak").innerHTML=formatStreakHtml(streak.current);$("#exBest").textContent=streak.max;
  const loads=rows.map(x=>Number(x.weight)).filter(x=>Number.isFinite(x)&&x>0);
  $("#exBestLoad").textContent=loads.length?`${Math.max(...loads)} kg`:"-";
  $("#exerciseSummary").textContent=`${completed} completed out of ${denominator} applicable sessions.`;
  drawExerciseChart(rows);
  $("#exerciseHistory").innerHTML=[...rows].reverse().map(x=>`<tr><td>${x.date}</td><td>${x.day}</td><td>${x.completed?"✅":"⬜"}</td><td>${x.weight!==""?x.weight+" kg":"-"}</td><td>${x.reps!==""?x.reps:"-"}</td><td>${formatStreakHtml(x.streak)}</td></tr>`).join("");
}


function drawExerciseChart(rows){
  const canvas=$("#exerciseChart"),ctx=canvas.getContext("2d");
  ctx.clearRect(0,0,canvas.width,canvas.height);
  if(!rows.length)return;

  const loads=rows.map(r=>Number(r.weight)||0);
  const max=Math.max(10,...loads);
  const accent=getComputedStyle(document.body).getPropertyValue("--accent").trim()||"#0a6b33";
  const muted=getComputedStyle(document.body).getPropertyValue("--muted").trim()||"#687386";
  const w=canvas.width,h=canvas.height,pad=40;

  ctx.strokeStyle="rgba(120,130,145,.25)";
  ctx.beginPath();ctx.moveTo(pad,16);ctx.lineTo(pad,h-pad);ctx.lineTo(w-12,h-pad);ctx.stroke();

  ctx.strokeStyle=accent;ctx.lineWidth=4;ctx.beginPath();
  rows.forEach((r,i)=>{
    const x=pad+(rows.length===1?0:i*(w-pad-28)/(rows.length-1));
    const y=h-pad-(Number(r.weight)||0)/max*(h-pad-30);
    if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
    ctx.fillStyle=r.completed?"#22c55e":"#ef4444";
    ctx.beginPath();ctx.arc(x,y,5,0,Math.PI*2);ctx.fill();
  });
  ctx.strokeStyle=accent;
  if(rows.length>1){
    ctx.beginPath();
    rows.forEach((r,i)=>{
      const x=pad+i*(w-pad-28)/(rows.length-1);
      const y=h-pad-(Number(r.weight)||0)/max*(h-pad-30);
      if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
    });
    ctx.stroke();
  }
  ctx.fillStyle=muted;ctx.font="12px system-ui";
  ctx.fillText("Recorded training weight (kg)",pad,13);
}

function renderExercisePage(){refreshExerciseSelect();renderPeriodSpecificControls();renderExerciseProgress();}

function renderJourney(){
  const start=state.startDate,end=addDays(start,89),current=journeyDayNumber(todayISO());
  $("#jStart").textContent=parseDate(start).toLocaleDateString([],{day:"numeric",month:"short",year:"numeric"});
  $("#jEnd").textContent=parseDate(end).toLocaleDateString([],{day:"numeric",month:"short",year:"numeric"});
  $("#jCurrent").textContent=current<1?"Before Start":current>90?"Complete":`Day ${current}`;
  $("#journeyMap").innerHTML=Array.from({length:90},(_,i)=>{const date=addDays(start,i),done=dayCompletion(date)===100;return`<div class="journey-day ${done?"done":""} ${date===todayISO()?"today":""} ${date>todayISO()?"future":""}" title="${date}">${i+1}</div>`;}).join("");
}

function openJourneyReset(){
  openModal(`<h3>Restart 90-Day Journey</h3><p style="font-size:10px;color:var(--muted)">This changes Day 1 only. Exercise streaks remain intact.</p><label>New Day 1<input id="newJourneyStart" type="date" value="${todayISO()}"></label><div class="modal-actions"><button id="cancelJourneyReset" class="secondary-btn">Cancel</button><button id="confirmJourneyReset" class="danger-btn">Restart</button></div>`);
  $("#cancelJourneyReset").onclick=closeModal;
  $("#confirmJourneyReset").onclick=()=>{state.startDate=$("#newJourneyStart").value;saveState();closeModal();renderJourney();renderHome();toast("90-day journey restarted");};
}

function renderProfile(){
  $("#profileGymTime").textContent=formatClockTime(state.gymTime);
  const profile=(typeof getUserProfile==="function"?getUserProfile():null)||state.userProfile||{};
  const latest=(state.measurements||[])[0]||{};
  const name=profile.name||"User";
  const avatar=$("#profileAvatar"),nameEl=$("#profileNameDisplay"),weightEl=$("#profileStartWeight"),waistEl=$("#profileStartWaist");
  if(avatar)avatar.textContent=(name.trim()[0]||"M").toUpperCase();
  if(nameEl)nameEl.textContent=name;
  if(weightEl)weightEl.textContent=`${profile.weight||latest.weight||CONFIG.bodyStart.weight} kg`;
  if(waistEl)waistEl.textContent=`${profile.waist||latest.waist||CONFIG.bodyStart.waist} in`;
}
function renderSettings(){
  updateInstallVisibility();
  $("#fridayFastToggle").checked=state.fridayFast;
  $("#gymTimeSetting").value=state.gymTime;
  applyTheme();
}


function updateInstallVisibility(){
  const installed=
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true ||
    localStorage.getItem("moinGymInstalled")==="1";

  document.body.classList.toggle("app-installed",installed);

  const button=$("#installBtn");
  if(button)button.closest(".settings-row").style.display=installed?"none":"";
}

window.addEventListener("appinstalled",()=>{
  localStorage.setItem("moinGymInstalled","1");
  deferredInstallPrompt=null;
  updateInstallVisibility();
});

window.addEventListener("beforeinstallprompt",event=>{event.preventDefault();deferredInstallPrompt=event;});
async function installApp(){
  if(!deferredInstallPrompt){toast("Open the hosted app in Chrome/Edge to install it");return;}
  deferredInstallPrompt.prompt();await deferredInstallPrompt.userChoice;deferredInstallPrompt=null;
}

function exportData(){
  const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"}),link=document.createElement("a");
  link.href=URL.createObjectURL(blob);link.download=`moin-gym-progress-${todayISO()}.json`;link.click();URL.revokeObjectURL(link.href);
}

function importData(file){
  const reader=new FileReader();
  reader.onload=()=>{try{state=JSON.parse(reader.result);saveState();location.reload();}catch{toast("Invalid backup file");}};
  reader.readAsText(file);
}

function wireEvents(){
  $("#selectedDate").value=todayISO();$("#monthPicker").value=todayISO().slice(0,7);
  $("#selectedDate").onchange=()=>{renderHome();renderFood($("#selectedDate").value);};
  $("#prevDay").onclick=()=>{$("#selectedDate").value=addDays($("#selectedDate").value,-1);renderHome();};
  $("#nextDay").onclick=()=>{$("#selectedDate").value=addDays($("#selectedDate").value,1);renderHome();};

  $("#menuBtn").onclick=()=>{$("#drawer").classList.add("open");$("#drawerOverlay").classList.add("show");};
  $("#closeDrawer").onclick=closeDrawer;$("#drawerOverlay").onclick=closeDrawer;
  $$("[data-page]").forEach(b=>b.onclick=()=>navigate(b.dataset.page));

  $("#togglePlanEdit").onclick=()=>setPlanEditMode(!planEditMode);

  $("#restorePlan").onclick=()=>{if(confirm("Restore the default workout plan?")){state.plan=deepCopy(DEFAULT_PLAN);saveState();renderPlanEditor();refreshExerciseSelect();toast("Default plan restored");}};

  $("#monthlyRing").onclick=()=>{monthlyUpToTodayMode=!monthlyUpToTodayMode;playSound("tap");renderMonthlyProgress();};
  $("#monthPicker").onchange=renderMonthlyProgress;

  $("#periodSelect").onchange=()=>{renderPeriodSpecificControls();renderExerciseProgress();};
  $("#exerciseSelect").onchange=renderExerciseProgress;
  $("#exerciseRing").onclick=()=>{exerciseUpToTodayMode=!exerciseUpToTodayMode;playSound("tap");renderExerciseProgress();};

  $("#addCheckin").onclick=openBodyCheckin;$("#resetJourney").onclick=openJourneyReset;
$("#fridayFastToggle").onchange=e=>{state.fridayFast=e.target.checked;saveState();renderHome();toast(state.fridayFast?"Friday Fast Mode ON":"Friday Fast Mode OFF");};
  $("#gymTimeSetting").onchange=e=>{state.gymTime=e.target.value||CONFIG.normalGymTime;saveState();renderHome();renderProfile();toast("Gym time updated");};
  // Appearance controls save the user's preset or free-form color choice immediately.
  $("#themePreset").onchange=e=>{state.themePreset=e.target.value;saveState();applyTheme();drawWeightChart();};
  $("#accentPreset").onchange=e=>{state.accentPreset=e.target.value;saveState();applyTheme();drawWeightChart();};
  $("#themeColor").oninput=e=>{state.themePreset="custom";state.themeColor=e.target.value;saveState();applyTheme();drawWeightChart();};
  $("#accentColor").oninput=e=>{state.accentPreset="custom";state.accent=e.target.value;saveState();applyTheme();drawWeightChart();};
  $("#quickThemeToggle").onclick=()=>{
    const dark=["dark","midnight"].includes(state.themePreset);
    state.themePreset=dark?"light":"dark";
    saveState();applyTheme();drawWeightChart();
  };
  $("#logoutBtn").onclick=()=>{if(typeof logoutUser==="function")logoutUser();};

  $("#installBtn").onclick=installApp;$("#exportBtn").onclick=exportData;
  $("#importFile").onchange=e=>{if(e.target.files[0])importData(e.target.files[0]);};
  $("#modalBg").onclick=e=>{if(e.target.id==="modalBg")closeModal();};
  $("#pickerOverlay").onclick=e=>{if(e.target.id==="pickerOverlay")closePicker();};
}

function startApp(){
  applyTheme();
  if(typeof initOnboarding==="function")initOnboarding();updateInstallVisibility();document.body.classList.add("on-home");renderQuote();updateClock();setInterval(updateClock,1000);wireEvents();refreshExerciseSelect();
  renderHome();renderFood($("#selectedDate").value);renderProgressPage();renderExercisePage();renderJourney();renderProfile();renderSettings();
  primeExerciseRecordsInBackground().catch(()=>{});
  if("serviceWorker"in navigator)navigator.serviceWorker.register("sw.js").catch(()=>{});
}
startApp();
