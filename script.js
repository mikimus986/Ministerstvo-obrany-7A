const USER_KEY="hlasovani_current_user";
const POLLS_KEY="hlasovani_polls";
const LAWSUITS_KEY="hlasovani_lawsuits";
const POLL_CREATORS=["Mikuláš Musialek","Miroslav Štrop","Vojtěch Laichman"];
const LAWSUIT_ADMIN="Miroslav Štrop";

const $=id=>document.getElementById(id);
let currentUser=localStorage.getItem(USER_KEY)||"";
let polls=JSON.parse(localStorage.getItem(POLLS_KEY)||"[]");
let lawsuits=JSON.parse(localStorage.getItem(LAWSUITS_KEY)||"[]");

function save(){
  localStorage.setItem(POLLS_KEY,JSON.stringify(polls));
  localStorage.setItem(LAWSUITS_KEY,JSON.stringify(lawsuits));
}
function escapeHTML(text){
  const d=document.createElement("div"); d.textContent=text; return d.innerHTML;
}
function canCreatePoll(){return POLL_CREATORS.includes(currentUser)}
function showApp(){
  $("authView").classList.add("hidden");
  $("mainView").classList.remove("hidden");
  $("userBox").textContent="Přihlášen: "+currentUser;
  $("newPollBtn").classList.toggle("hidden",!canCreatePoll());
  renderPolls(); renderLawsuits();
}
function showAuth(){
  $("authView").classList.remove("hidden");
  $("mainView").classList.add("hidden");
  $("userBox").textContent="";
}
function addOption(value=""){
  const input=document.createElement("input");
  input.className="pollOption"; input.maxLength=100;
  input.placeholder="Možnost odpovědi"; input.value=value;
  $("options").appendChild(input);
}
function resetPollForm(){
  $("questionInput").value=""; $("options").innerHTML="";
  addOption(); addOption();
}
function openPollForm(){
  if(!canCreatePoll()) return;
  resetPollForm(); $("createPollCard").classList.remove("hidden");
  $("lawsuitFormCard").classList.add("hidden"); $("questionInput").focus();
}
function closePollForm(){$("createPollCard").classList.add("hidden")}
function createPoll(){
  if(!canCreatePoll()) return;
  const question=$("questionInput").value.trim();
  const names=[...document.querySelectorAll(".pollOption")].map(x=>x.value.trim()).filter(Boolean);
  if(!question)return alert("Zadej otázku.");
  if(names.length<2)return alert("Anketa musí mít alespoň 2 možnosti.");
  polls.unshift({id:Date.now().toString(),question,options:names.map((name,i)=>({id:String(i),name,votes:0})),voters:[],creator:currentUser,created:new Date().toISOString()});
  save();closePollForm();renderPolls();
}
function hasVoted(poll){return poll.voters.includes(currentUser.toLowerCase())}
function vote(pollId,optionId){
  const poll=polls.find(p=>p.id===pollId); if(!poll||hasVoted(poll))return;
  const option=poll.options.find(o=>o.id===optionId); if(!option)return;
  option.votes++;poll.voters.push(currentUser.toLowerCase());save();renderPolls();
}
function deletePoll(id){
  const p=polls.find(x=>x.id===id); if(!p||p.creator!==currentUser)return;
  if(confirm("Opravdu chceš tuto anketu odstranit?")){polls=polls.filter(x=>x.id!==id);save();renderPolls()}
}
function renderPolls(){
  const box=$("pollList");box.innerHTML="";
  $("pollCount").textContent=polls.length+"";
  if(!polls.length){box.innerHTML='<div class="empty">Zatím není žádná anketa.</div>';return}
  polls.forEach(p=>{
    const total=p.options.reduce((s,o)=>s+o.votes,0), voted=hasVoted(p);
    const article=document.createElement("article");article.className="poll";
    let html=`<h3>${escapeHTML(p.question)}</h3><p class="small muted">Vytvořil: ${escapeHTML(p.creator)} · Celkem hlasů: ${total}</p>`;
    if(!voted){
      html+='<div>';
      p.options.forEach(o=>html+=`<label class="option"><input type="radio" name="poll-${p.id}" value="${o.id}"><span>${escapeHTML(o.name)}</span></label>`);
      html+=`<button class="voteBtn" data-id="${p.id}">Hlasovat</button></div>`;
    }else html+='<p class="muted">✓ V této anketě už jsi hlasoval.</p>';
    html+='<div>';
    p.options.forEach(o=>{const pc=total?Math.round(o.votes/total*100):0;html+=`<div class="resultLine"><span>${escapeHTML(o.name)}</span><strong>${o.votes} (${pc} %)</strong></div><div class="barWrap"><div class="bar" style="width:${pc}%"></div></div>`});
    html+='</div>';
    if(p.creator===currentUser)html+=`<button class="danger deletePoll" data-id="${p.id}">Odstranit anketu</button>`;
    article.innerHTML=html;box.appendChild(article);
  });
  document.querySelectorAll(".voteBtn").forEach(b=>b.onclick=()=>{
    const p=polls.find(x=>x.id===b.dataset.id),s=document.querySelector(`input[name="poll-${p.id}"]:checked`);
    if(!s)return alert("Vyber možnost.");vote(p.id,s.value);
  });
  document.querySelectorAll(".deletePoll").forEach(b=>b.onclick=()=>deletePoll(b.dataset.id));
}
function canSeeLawsuit(l){return l.sender===currentUser || currentUser===LAWSUIT_ADMIN;}
function openLawsuitForm(){
  $("lawsuitFormCard").classList.remove("hidden"); $("createPollCard").classList.add("hidden");
  $("lawsuitSender").value=currentUser; $("lawsuitTarget").value=""; $("lawsuitReason").value=""; $("lawsuitTarget").focus();
}
function closeLawsuitForm(){$("lawsuitFormCard").classList.add("hidden")}
function sendLawsuit(){
  const sender=$("lawsuitSender").value.trim(), target=$("lawsuitTarget").value.trim(), reason=$("lawsuitReason").value.trim();
  if(!sender||!target||!reason)return alert("Vyplň všechna pole.");
  lawsuits.unshift({id:Date.now().toString(),sender,target,reason,created:new Date().toISOString(),status:"pending"});
  save(); closeLawsuitForm(); renderLawsuits(); alert("Žaloba byla odeslána.");
}
function decideLawsuit(id,status){
  if(currentUser!==LAWSUIT_ADMIN)return;
  if(!confirm(status==="accepted"?"Přijmout tuto žalobu?":"Zamítnout tuto žalobu?"))return;
  lawsuits=lawsuits.filter(x=>x.id!==id); save(); renderLawsuits();
}
function renderLawsuits(){
  const box=$("lawsuitList"); box.innerHTML=""; const visible=lawsuits.filter(canSeeLawsuit); $("lawsuitCount").textContent=visible.length+"";
  if(!visible.length){box.innerHTML='<div class="empty">Nemáš žádné žaloby k zobrazení.</div>';return;}
  visible.forEach(l=>{
    const article=document.createElement("article"); article.className="lawsuit";
    const buttons=currentUser===LAWSUIT_ADMIN?`<div class="actions"><button class="acceptBtn" data-id="${l.id}">✓ Přijmout</button><button class="danger rejectBtn" data-id="${l.id}">✕ Zamítnout</button></div>`:"";
    article.innerHTML=`<div class="lawsuitHeader"><div><h3>Žaloba na: ${escapeHTML(l.target)}</h3><div class="small muted">Podal/a: ${escapeHTML(l.sender)}</div></div><span class="lawsuitBadge">AKTIVNÍ</span></div><div class="lawsuitDetails"><p><strong>Kdo žalobu posílá:</strong> ${escapeHTML(l.sender)}</p><p><strong>Na koho směřuje:</strong> ${escapeHTML(l.target)}</p><p><strong>Co udělal:</strong><br>${escapeHTML(l.reason)}</p><p class="small muted">Podáno: ${new Date(l.created).toLocaleString("cs-CZ")}</p>${buttons}</div>`;
    box.appendChild(article);
  });
  document.querySelectorAll(".acceptBtn").forEach(b=>b.onclick=e=>{e.stopPropagation();decideLawsuit(b.dataset.id,"accepted")});
  document.querySelectorAll(".rejectBtn").forEach(b=>b.onclick=e=>{e.stopPropagation();decideLawsuit(b.dataset.id,"rejected")});
}

$("loginBtn").onclick=()=>{
  const n=$("nameInput").value.trim();
  if(n.length<2)return alert("Jméno musí mít alespoň 2 znaky.");
  currentUser=n;localStorage.setItem(USER_KEY,currentUser);showApp();
};
$("nameInput").onkeydown=e=>{if(e.key==="Enter")$("loginBtn").click()};
$("logoutBtn").onclick=()=>{currentUser="";localStorage.removeItem(USER_KEY);showAuth()};
$("newPollBtn").onclick=openPollForm;
$("addOptionBtn").onclick=()=>addOption();
$("createBtn").onclick=createPoll;
$("cancelCreateBtn").onclick=closePollForm;
$("newLawsuitBtn").onclick=openLawsuitForm;
$("sendLawsuitBtn").onclick=sendLawsuit;
$("cancelLawsuitBtn").onclick=closeLawsuitForm;
if(currentUser)showApp();
