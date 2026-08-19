const USER_PROFILE_KEY="moinGymUserProfile:v2";
const ACTIVE_USER_KEY="moinGymActiveFirebaseUid:v1";
let firebaseAppInstance=null;
let firebaseAuthInstance=null;
let firebaseDbInstance=null;
let phoneConfirmationResult=null;
let authMode="login";

function firebaseConfigured(){
  return Boolean(FIREBASE_CONFIG?.apiKey&&FIREBASE_CONFIG?.authDomain&&FIREBASE_CONFIG?.projectId&&FIREBASE_CONFIG?.appId&&window.firebase);
}
function initFirebaseServices(){
  if(!firebaseConfigured())return false;
  if(!firebase.apps.length)firebaseAppInstance=firebase.initializeApp(FIREBASE_CONFIG);else firebaseAppInstance=firebase.app();
  firebaseAuthInstance=firebase.auth();
  firebaseDbInstance=firebase.firestore();
  return true;
}
function profileStorageKey(uid){return `${USER_PROFILE_KEY}:${uid||"local"}`;}
function getCurrentUid(){return firebaseAuthInstance?.currentUser?.uid||localStorage.getItem(ACTIVE_USER_KEY)||"";}
function getUserProfile(){
  const uid=getCurrentUid();
  try{return JSON.parse(localStorage.getItem(profileStorageKey(uid))||"null");}catch{return null;}
}
function saveUserProfile(profile,uid=getCurrentUid()){
  if(uid)localStorage.setItem(ACTIVE_USER_KEY,uid);
  localStorage.setItem(profileStorageKey(uid),JSON.stringify(profile));
}
function userStreakStartDate(){return getUserProfile()?.firstLoginDate||todayISO();}
async function logoutUser(){
  try{if(firebaseAuthInstance)await firebaseAuthInstance.signOut();}catch{}
  localStorage.removeItem(ACTIVE_USER_KEY);
  location.reload();
}
function showAuthStep(step){document.querySelectorAll("[data-onboard-step]").forEach(x=>x.classList.toggle("hidden",x.dataset.onboardStep!==step));}
function setOnboardMessage(msg,isError=false){const el=document.getElementById("onboardMessage");if(!el)return;el.textContent=msg||"";el.classList.toggle("error",isError);}
function setAuthMode(mode){
  authMode=mode;
  document.querySelectorAll("[data-auth-mode]").forEach(btn=>btn.classList.toggle("active",btn.dataset.authMode===mode));
  const signupOnly=document.querySelectorAll(".signup-only");signupOnly.forEach(el=>el.classList.toggle("hidden",mode!=="signup"));
  const submit=document.getElementById("emailAuthBtn");if(submit)submit.textContent=mode==="signup"?"Create account":"Login";
  const heading=document.getElementById("authHeading");if(heading)heading.textContent=mode==="signup"?"Create your account":"Welcome back";
  setOnboardMessage("");
}
async function ensureUserRecord(user,extra={}){
  if(!firebaseDbInstance||!user)return null;
  const ref=firebaseDbInstance.collection("users").doc(user.uid);
  const snap=await ref.get();
  const existing=snap.exists?snap.data():{};
  const firstLoginDate=existing.firstLoginDate||todayISO();
  const payload={
    uid:user.uid,email:user.email||existing.email||null,phone:user.phoneNumber||existing.phone||null,
    provider:user.providerData?.[0]?.providerId||existing.provider||"firebase",
    firstLoginDate,lastLoginAt:firebase.firestore.FieldValue.serverTimestamp(),...extra
  };
  if(!snap.exists)payload.createdAt=firebase.firestore.FieldValue.serverTimestamp();
  await ref.set(payload,{merge:true});
  return {...existing,...payload,firstLoginDate};
}
async function loadRemoteProfile(user){
  if(!firebaseDbInstance||!user)return null;
  const snap=await firebaseDbInstance.collection("users").doc(user.uid).get();
  if(!snap.exists)return null;
  const data=snap.data();
  if(!data.profileComplete)return null;
  const profile={
    name:data.name||"",age:data.age||null,height:data.height||null,weight:data.weight||null,waist:data.waist||null,lower:data.lower||null,
    chest:data.chest||null,hip:data.hip||null,biceps:data.biceps||null,thigh:data.thigh||null,calves:data.calves||null,forearm:data.forearm||null,photoDataUrl:data.photoDataUrl||"",
    startDate:data.startDate||todayISO(),firstLoginDate:data.firstLoginDate||todayISO(),createdAt:data.createdAt?.toDate?.()?.toISOString?.()||new Date().toISOString(),uid:user.uid
  };
  saveUserProfile(profile,user.uid);return profile;
}
async function afterAuthenticated(user){
  localStorage.setItem(ACTIVE_USER_KEY,user.uid);
  const record=await ensureUserRecord(user);
  let profile=await loadRemoteProfile(user);
  if(profile){applyProfileToTracker(profile);finishOnboarding();return;}
  const local=getUserProfile();
  if(local?.uid===user.uid&&local?.name){profile={...local,firstLoginDate:local.firstLoginDate||record?.firstLoginDate||todayISO()};saveUserProfile(profile,user.uid);applyProfileToTracker(profile);finishOnboarding();return;}
  const start=document.getElementById("profileStartDate");if(start&&!start.value)start.value=todayISO();
  showAuthStep("profile");setOnboardMessage("Account verified. Complete your starting details.");
}
async function emailAuth(){
  if(!firebaseAuthInstance)return setOnboardMessage("Firebase is not configured yet.",true);
  const email=document.getElementById("authEmail").value.trim();
  const password=document.getElementById("authPassword").value;
  if(!email||password.length<6)return setOnboardMessage("Enter a valid email and a password of at least 6 characters.",true);
  try{
    setOnboardMessage(authMode==="signup"?"Creating account…":"Logging in…");
    if(authMode==="signup"){
      const credential=await firebaseAuthInstance.createUserWithEmailAndPassword(email,password);
      await ensureUserRecord(credential.user);
      await credential.user.sendEmailVerification();
      await firebaseAuthInstance.signOut();
      showAuthStep("email-verify");setOnboardMessage(`Verification link sent to ${email}. Open it, then come back and log in.`);
      return;
    }
    const credential=await firebaseAuthInstance.signInWithEmailAndPassword(email,password);
    if(!credential.user.emailVerified){
      await credential.user.sendEmailVerification();await firebaseAuthInstance.signOut();
      showAuthStep("email-verify");setOnboardMessage("Your email is not verified. A new verification link has been sent.",true);return;
    }
    await afterAuthenticated(credential.user);
  }catch(e){setOnboardMessage(firebaseAuthMessage(e),true);}
}
function firebaseAuthMessage(error){
  const code=error?.code||"";
  const known={
    "auth/email-already-in-use":"This email already has an account. Choose Login.","auth/user-not-found":"No account found with this email.",
    "auth/wrong-password":"Incorrect password.","auth/invalid-credential":"Email or password is incorrect.","auth/weak-password":"Use a stronger password (at least 6 characters).",
    "auth/too-many-requests":"Too many attempts. Try again later.","auth/invalid-phone-number":"Enter the phone number in international format, e.g. +919876543210.",
    "auth/quota-exceeded":"Firebase SMS quota has been reached.","auth/code-expired":"The OTP expired. Request a new one.","auth/invalid-verification-code":"The OTP is incorrect."
  };return known[code]||error?.message||"Authentication failed.";
}
function ensureRecaptcha(){
  if(window.moinRecaptchaVerifier)return window.moinRecaptchaVerifier;
  window.moinRecaptchaVerifier=new firebase.auth.RecaptchaVerifier("recaptcha-container",{size:"invisible"});
  return window.moinRecaptchaVerifier;
}
async function sendPhoneOtp(){
  if(!firebaseAuthInstance)return setOnboardMessage("Firebase is not configured yet.",true);
  const phone=document.getElementById("authPhone").value.trim();
  if(!/^\+[1-9]\d{7,14}$/.test(phone))return setOnboardMessage("Use international format, e.g. +919876543210.",true);
  try{
    setOnboardMessage("Sending OTP…");phoneConfirmationResult=await firebaseAuthInstance.signInWithPhoneNumber(phone,ensureRecaptcha());
    showAuthStep("phone-verify");setOnboardMessage(`OTP sent to ${phone}`);
  }catch(e){window.moinRecaptchaVerifier?.clear?.();window.moinRecaptchaVerifier=null;setOnboardMessage(firebaseAuthMessage(e),true);}
}
async function verifyPhoneOtp(){
  const code=document.getElementById("authOtp").value.trim();if(!code)return setOnboardMessage("Enter the OTP.",true);
  try{setOnboardMessage("Verifying…");const credential=await phoneConfirmationResult.confirm(code);await afterAuthenticated(credential.user);}catch(e){setOnboardMessage(firebaseAuthMessage(e),true);}
}
function applyProfileToTracker(profile){
  if(!profile)return;
  const placeholder=(state.measurements||[]).length===1&&state.measurements[0]?.date==="2026-08-17"&&Number(state.measurements[0]?.weight)===Number(CONFIG.bodyStart.weight)&&Number(state.measurements[0]?.waist)===Number(CONFIG.bodyStart.waist);
  state.userProfile=profile;
  if(profile.startDate)state.startDate=profile.startDate;
  const m={date:profile.startDate||todayISO(),weight:+profile.weight||0,waist:+profile.waist||0,lower:+profile.lower||0,chest:+profile.chest||0,hip:+profile.hip||0,biceps:+profile.biceps||0,thigh:+profile.thigh||0,calves:+profile.calves||0,forearm:+profile.forearm||0};
  if(placeholder)state.measurements=[];
  const existing=(state.measurements||[]).findIndex(x=>x.date===m.date);
  if(existing>=0)state.measurements[existing]={...state.measurements[existing],...m};else state.measurements=[m,...(state.measurements||[])];
  saveState();
}
async function saveOnboardingProfile(){
  const user=firebaseAuthInstance?.currentUser;if(firebaseConfigured()&&!user)return setOnboardMessage("Please log in again before saving your profile.",true);
  const ids=["profileName","profileAge","profileHeight","profileWeight","profileWaist","profileLower","profileChest","profileHip","profileBiceps","profileThigh","profileCalves","profileForearm","profileStartDate"];
  const v=Object.fromEntries(ids.map(id=>[id,document.getElementById(id)?.value?.trim()]));
  if(!v.profileName||!v.profileAge||!v.profileWeight||!v.profileStartDate)return setOnboardMessage("Name, age, weight and journey start date are required.",true);
  const remote=user?await ensureUserRecord(user):null;
  const photoFile=document.getElementById("profilePhoto")?.files?.[0];
  const existing=getUserProfile()||{};
  const profile={name:v.profileName,age:+v.profileAge,height:+v.profileHeight||null,weight:+v.profileWeight,waist:+v.profileWaist||null,lower:+v.profileLower||null,chest:+v.profileChest||null,hip:+v.profileHip||null,biceps:+v.profileBiceps||null,thigh:+v.profileThigh||null,calves:+v.profileCalves||null,forearm:+v.profileForearm||null,photoDataUrl:existing.photoDataUrl||"",startDate:v.profileStartDate,firstLoginDate:remote?.firstLoginDate||existing.firstLoginDate||todayISO(),createdAt:existing.createdAt||new Date().toISOString(),uid:user?.uid||"local"};
  if(photoFile)profile.photoDataUrl=await compressProfilePhoto(photoFile);
  if(user&&firebaseDbInstance){await firebaseDbInstance.collection("users").doc(user.uid).set({...profile,profileComplete:true,updatedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});}
  saveUserProfile(profile,user?.uid||"local");applyProfileToTracker(profile);finishOnboarding();
}
function finishOnboarding(){
  const profile=getUserProfile();if(profile)applyProfileToTracker(profile);
  document.body.classList.remove("onboarding-active");document.getElementById("onboardingGate")?.classList.add("hidden");
  if(typeof renderProfile==="function")renderProfile();if(typeof renderHome==="function")renderHome();if(typeof renderJourney==="function")renderJourney();if(typeof renderProgressPage==="function")renderProgressPage();
}
async function initOnboarding(){
  const gate=document.getElementById("onboardingGate");if(!gate)return;
  document.querySelectorAll("[data-auth-mode]").forEach(btn=>btn.onclick=()=>setAuthMode(btn.dataset.authMode));
  document.getElementById("emailAuthBtn").onclick=emailAuth;document.getElementById("sendPhoneOtpBtn").onclick=sendPhoneOtp;document.getElementById("verifyPhoneOtpBtn").onclick=verifyPhoneOtp;
  document.getElementById("backToAuthBtn").onclick=()=>{showAuthStep("auth");setOnboardMessage("");};
  document.getElementById("backFromEmailVerifyBtn").onclick=()=>{showAuthStep("auth");setAuthMode("login");};
  document.getElementById("saveProfileBtn").onclick=()=>saveOnboardingProfile().catch(e=>setOnboardMessage(e.message,true));
  const start=document.getElementById("profileStartDate");if(start&&!start.value)start.value=todayISO();
  if(!initFirebaseServices()){
    document.body.classList.add("onboarding-active");gate.classList.remove("hidden");setAuthMode("login");
    document.getElementById("authSetupWarning")?.classList.remove("hidden");setOnboardMessage("Add your Firebase Web App config in js/auth-config.js to enable Login / Signup.",true);return;
  }
  firebaseAuthInstance.onAuthStateChanged(async user=>{
    if(user && (!user.email||user.emailVerified)){
      try{await afterAuthenticated(user);}catch(e){document.body.classList.add("onboarding-active");gate.classList.remove("hidden");setOnboardMessage(e.message,true);}return;
    }
    document.body.classList.add("onboarding-active");gate.classList.remove("hidden");setAuthMode("login");showAuthStep("auth");
  });
}

async function compressProfilePhoto(file){
  if(!file)return "";const bitmap=await createImageBitmap(file);const max=256,scale=Math.min(1,max/Math.max(bitmap.width,bitmap.height));
  const canvas=document.createElement("canvas");canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
  canvas.getContext("2d").drawImage(bitmap,0,0,canvas.width,canvas.height);return canvas.toDataURL("image/jpeg",.72);
}
async function updateUserProfile(changes){
  const user=firebaseAuthInstance?.currentUser;const current=getUserProfile()||{};const profile={...current,...changes};
  saveUserProfile(profile,user?.uid||current.uid||"local");state.userProfile=profile;saveState();
  if(user&&firebaseDbInstance)await firebaseDbInstance.collection("users").doc(user.uid).set({...changes,profileComplete:true,updatedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});
  return profile;
}
