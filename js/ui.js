/*
ui.js
Small reusable helpers.
*/
function $(selector){return document.querySelector(selector);}
function $$(selector){return[...document.querySelectorAll(selector)];}
function todayISO(){return new Date().toLocaleDateString("en-CA");}

function parseDate(value){
  const[y,m,d]=value.split("-").map(Number);
  return new Date(y,m-1,d);
}
function toISO(date){return date.toLocaleDateString("en-CA");}
function addDays(value,amount){const d=parseDate(value);d.setDate(d.getDate()+amount);return toISO(d);}

function escapeHTML(value){
  return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}

function formatClockTime(time){
  let[h,m]=time.split(":").map(Number);
  const suffix=h>=12?"PM":"AM";
  h=h%12||12;
  return`${h}:${String(m).padStart(2,"0")} ${suffix}`;
}

function toast(message){
  const el=$("#toast");
  el.textContent=message;
  el.classList.add("show");
  clearTimeout(window.toastTimer);
  window.toastTimer=setTimeout(()=>el.classList.remove("show"),1600);
}

function checkboxPopup(label,checked){toast(`${checked?"✅":"↩️"} ${label}`);}
function openModal(html){$("#modal").innerHTML=html;$("#modalBg").classList.remove("hidden");}
function closeModal(){$("#modalBg").classList.add("hidden");}

function closeDrawer(){
  $("#drawer").classList.remove("open");
  $("#drawerOverlay").classList.remove("show");
}

function setActivePage(pageId){
  $$(".page").forEach(p=>p.classList.toggle("active",p.id===pageId));
  $$(".bottom-item").forEach(b=>b.classList.toggle("active",b.dataset.page===pageId));
  closeDrawer();
  window.scrollTo({top:0,behavior:"smooth"});
}
