/*
streak.js
Signed streak logic. It is independent of the 90-day journey reset.

The stable exercise `key` is now used for identity. For backwards compatibility,
a name may still be passed; it is translated to a key when possible.
*/
function workoutForDate(date){return state.plan[parseDate(date).getDay()];}

function exerciseTrackingKey(value){
  if(VERIFIED_EXERCISE_DB_IDS[value] || value==="meal-prep-review")return value;
  return LEGACY_EXERCISE_KEY_MAP[value]||value;
}

function exerciseIndexForDate(identity,date){
  const key=exerciseTrackingKey(identity);
  return workoutForDate(date).exercises.findIndex(ex=>
    ex.key===key || (!ex.key && ex.name===identity)
  );
}

function exerciseState(identity,date){
  const index=exerciseIndexForDate(identity,date);
  if(index<0)return "SKIP";
  const key=exerciseTrackingKey(identity);
  return exerciseDoneValue(date,key,index)?"TRUE":"FALSE";
}

function streakHistoryStart(){
  return typeof userStreakStartDate==="function"?userStreakStartDate():CONFIG.streakHistoryStart;
}

function buildExerciseTimeline(identity,targetDate){
  const rows=[];
  let cursor=parseDate(streakHistoryStart());
  const end=parseDate(targetDate);

  while(cursor<=end){
    const date=toISO(cursor);
    rows.push({date,state:exerciseState(identity,date)});
    cursor.setDate(cursor.getDate()+1);
  }
  return rows;
}

function signedHistoricalRun(states){
  let last=-1;
  for(let i=states.length-1;i>=0;i--){
    if(states[i]!=="SKIP"){last=i;break;}
  }
  if(last<0)return 0;

  const type=states[last];
  let value=0;

  for(let i=last;i>=0;i--){
    const current=states[i];
    if(current==="SKIP")continue;
    if(current===type)value+=type==="TRUE"?1:-1;
    else break;
  }
  return value;
}

function highestPositiveRun(states){
  let current=0,highest=0;
  states.forEach(value=>{
    if(value==="SKIP")return;
    if(value==="TRUE"){
      current++;
      highest=Math.max(highest,current);
    }else current=0;
  });
  return highest;
}

function getStreakInfo(identity,targetDate){
  const timeline=buildExerciseTimeline(identity,targetDate);
  if(!timeline.length)return{current:0,max:0,prevStreak:0,todayCompleted:false};

  const target=timeline.at(-1);
  const previous=signedHistoricalRun(timeline.slice(0,-1).map(row=>row.state));

  let current=previous;
  if(target.state==="TRUE")current=previous<=0?1:previous+1;

  return{
    current,
    max:highestPositiveRun(timeline.map(row=>row.state)),
    prevStreak:previous,
    todayCompleted:target.state==="TRUE"
  };
}

function formatStreakHtml(value){
  const streak=Number(value)||0;
  if(streak<=-2)return`${Math.abs(streak)} <span class="flame-inverted">🔥</span>`;
  if(streak<=0)return"🔥 0";
  return`🔥 ${streak}`;
}
