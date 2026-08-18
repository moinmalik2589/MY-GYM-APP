/*
progress.js
Progress ring thresholds and date ranges.

0-49 = red
50-79 = yellow
80-99 = green
100 = blue
*/
function ringColor(percent){
  if(percent===100)return"#3b82f6";
  if(percent>=80)return"#22c55e";
  if(percent>=50)return"#eab308";
  return"#ef4444";
}

function updateRing(element,percent){
  const safe=Math.max(0,Math.min(100,Math.round(percent)));
  element.style.setProperty("--ringDeg",`${safe*3.6}deg`);
  element.style.setProperty("--ringColor",ringColor(safe));
}

function dayCompletion(date){
  const plan=workoutForDate(date);
  const data=dayData(date);
  if(!plan.exercises.length)return 0;
  const done=plan.exercises.filter((exercise,index)=>exerciseDoneValue(date,exercise.key,index)).length;
  return Math.round(done/plan.exercises.length*100);
}

function periodEndForMode(start,end,upToToday){
  if(!upToToday)return end;
  return end>todayISO()?todayISO():end;
}

function weekRange(year,monthIndex,weekNumber){
  const monthEnd=new Date(year,monthIndex+1,0);
  const startDay=1+(weekNumber-1)*7;
  const start=new Date(year,monthIndex,Math.min(startDay,monthEnd.getDate()));
  const end=new Date(year,monthIndex,Math.min(startDay+6,monthEnd.getDate()));
  return[toISO(start),toISO(end)];
}

function monthRange(year,monthIndex){
  return[toISO(new Date(year,monthIndex,1)),toISO(new Date(year,monthIndex+1,0))];
}

function yearRange(year){return[`${year}-01-01`,`${year}-12-31`];}

function exercisePeriodRows(identity,startDate,endDate,upToToday){
  const effectiveEnd=periodEndForMode(startDate,endDate,upToToday);
  const rows=[];
  let cursor=parseDate(startDate);
  const end=parseDate(effectiveEnd);

  while(cursor<=end){
    const date=toISO(cursor);
    const index=exerciseIndexForDate(identity,date);

    if(index>=0){
      const key=exerciseTrackingKey(identity);
      const load=exerciseLoadValue(date,key,index);
      rows.push({
        date,
        day:cursor.toLocaleDateString([],{weekday:"long"}),
        completed:exerciseDoneValue(date,key,index),
        weight:load.weight??"",
        reps:load.reps??"",
        streak:getStreakInfo(identity,date).current
      });
    }
    cursor.setDate(cursor.getDate()+1);
  }
  return rows;
}
