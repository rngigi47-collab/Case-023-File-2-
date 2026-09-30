(() => {
const ACCESS_CODE="021026";
const CORRECT="B";
const stages=[...document.querySelectorAll(".stage")],screens=[...document.querySelectorAll(".screen")];
const envelopeBtn=document.getElementById("envelopeBtn"),soundToggle=document.getElementById("soundToggle");
const passwordForm=document.getElementById("passwordForm"),passwordInput=document.getElementById("passwordInput"),passwordFeedback=document.getElementById("passwordFeedback"),showPasswordBtn=document.getElementById("showPasswordBtn");
const folderBtn=document.getElementById("folderBtn"),beginBtn=document.getElementById("beginBtn"),subjectCards=[...document.querySelectorAll(".subject-card")];
const progressText=document.getElementById("progressText"),questionPanel=document.getElementById("questionPanel"),quizForm=document.getElementById("quizForm"),feedback=document.getElementById("feedback"),archiveBtn=document.getElementById("archiveBtn");
const revealed=new Set();let audioCtx=null,masterGain=null,nodes=[],soundOn=false;
function showStage(id){stages.forEach(x=>x.classList.toggle("active",x.id===id));window.scrollTo({top:0,behavior:"smooth"})}
function showScreen(id){screens.forEach(x=>x.classList.toggle("active",x.id===id));window.scrollTo({top:0,behavior:"smooth"})}
function startSound(){
  if(soundOn)return;const AC=window.AudioContext||window.webkitAudioContext;
  if(!AC){soundToggle.textContent="♪ SOUND UNAVAILABLE";soundToggle.disabled=true;return}
  audioCtx=audioCtx||new AC();if(audioCtx.state==="suspended")audioCtx.resume();
  masterGain=audioCtx.createGain();masterGain.gain.setValueAtTime(.0001,audioCtx.currentTime);masterGain.gain.exponentialRampToValueAtTime(.05,audioCtx.currentTime+1.2);masterGain.connect(audioCtx.destination);
  const lp=audioCtx.createBiquadFilter();lp.type="lowpass";lp.frequency.value=480;lp.connect(masterGain);
  [[55,"sine",.7],[82.41,"triangle",.16],[110,"sine",.05]].forEach(([f,t,g])=>{const o=audioCtx.createOscillator(),ga=audioCtx.createGain();o.type=t;o.frequency.value=f;ga.gain.value=g;o.connect(ga).connect(lp);o.start();nodes.push(o)});
  soundOn=true;soundToggle.setAttribute("aria-pressed","true");soundToggle.textContent="♪ SOUND: ON";
}
function stopSound(){
  if(!soundOn||!audioCtx||!masterGain)return;const now=audioCtx.currentTime;masterGain.gain.cancelScheduledValues(now);masterGain.gain.setValueAtTime(Math.max(masterGain.gain.value,.0001),now);masterGain.gain.exponentialRampToValueAtTime(.0001,now+.5);
  setTimeout(()=>nodes.forEach(n=>{try{n.stop()}catch(e){}}),600);nodes=[];soundOn=false;soundToggle.setAttribute("aria-pressed","false");soundToggle.textContent="♪ SOUND: OFF";
}
soundToggle.addEventListener("click",()=>soundOn?stopSound():startSound());
envelopeBtn.addEventListener("click",()=>{if(!soundOn)startSound();showStage("passwordStage");setTimeout(()=>passwordInput.focus(),350)});
showPasswordBtn.addEventListener("click",()=>{const showing=passwordInput.type==="text";passwordInput.type=showing?"password":"text";showPasswordBtn.textContent=showing?"SHOW":"HIDE"});
passwordForm.addEventListener("submit",e=>{e.preventDefault();if(passwordInput.value.trim()===ACCESS_CODE){passwordFeedback.textContent="ACCESS GRANTED.";passwordFeedback.className="password-feedback ok";passwordInput.disabled=true;passwordForm.querySelector('button[type="submit"]').disabled=true;setTimeout(()=>showStage("revealStage"),700)}else{passwordFeedback.textContent="ACCESS DENIED. Check the date.";passwordFeedback.className="password-feedback error";passwordInput.select()}});
folderBtn.addEventListener("click",()=>{showStage("caseStage");showScreen("cover")});
beginBtn.addEventListener("click",()=>showScreen("evidence"));
subjectCards.forEach(card=>card.addEventListener("click",()=>{const id=card.dataset.subject;if(!revealed.has(id)){revealed.add(id);card.classList.add("revealed");card.setAttribute("aria-expanded","true");card.querySelector(".subject-status").textContent="REVEALED"}progressText.textContent=`${revealed.size} / ${subjectCards.length} records reviewed`;if(revealed.size===subjectCards.length){questionPanel.classList.remove("hidden");progressText.textContent="All records reviewed. Assessment unlocked.";setTimeout(()=>questionPanel.scrollIntoView({behavior:"smooth",block:"start"}),250)}}));
const hints={"A": "Too literal. The records describe different outward behaviours.", "C": "Reassess the evidence. Look beneath the surface.", "D": "Control appears in some records, but it is not the common suspect.", "B": "Look for the force underneath the behaviours, not the behaviour itself."};
quizForm.addEventListener("submit",e=>{e.preventDefault();const selected=quizForm.querySelector('input[name="answer"]:checked');if(!selected){feedback.textContent="Select an answer before submitting.";feedback.className="feedback bad";return}if(selected.value===CORRECT){feedback.textContent="Correct. Assessment complete. Opening result…";feedback.className="feedback good";quizForm.querySelectorAll("input,button").forEach(el=>el.disabled=true);setTimeout(()=>showScreen("result"),700)}else{feedback.textContent=hints[selected.value]||"Reassess the evidence.";feedback.className="feedback bad"}});
archiveBtn.addEventListener("click",()=>showScreen("archived"));
})();