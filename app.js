const IK="incident-tracker-v4-incidents",TK="incident-tracker-v4-tasks",HK="incident-tracker-v4-history";
let incidents=JSON.parse(localStorage.getItem(IK)||"[]");
let tasks=JSON.parse(localStorage.getItem(TK)||"[]");
let history=JSON.parse(localStorage.getItem(HK)||"[]");
let iDate=today(),tDate=today(),iFilter="all";
const $=id=>document.getElementById(id);

function today(){
  const d=new Date();
  return localISO(d);
}
function localISO(d){
  const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,"0"),day=String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}
function shiftISO(iso,days){
  // Use UTC for date-only arithmetic so daylight-saving changes can never
  // make the picker jump by two days or block the forward button.
  const [y,m,d]=iso.split("-").map(Number);
  const dt=new Date(Date.UTC(y,m-1,d));
  dt.setUTCDate(dt.getUTCDate()+days);
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth()+1).padStart(2,"0")}-${String(dt.getUTCDate()).padStart(2,"0")}`;
}
function fa(s){if(!s)return"-";return new Intl.DateTimeFormat("fa-IR-u-ca-persian",{year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(s+"T00:00:00"))}
function esc(x){return String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function save(){localStorage.setItem(IK,JSON.stringify(incidents));localStorage.setItem(TK,JSON.stringify(tasks));localStorage.setItem(HK,JSON.stringify(history))}
function elapsed(iso,endIso){let end=endIso?new Date(endIso):new Date();let n=Math.max(0,Math.floor((end-new Date(iso))/1000)),h=Math.floor(n/3600),m=Math.floor(n%3600/60),s=n%60;return [h,m,s].map(x=>String(x).padStart(2,"0")).join(":")}
function incStatus(s){return s==="open"?"باز":s==="progress"?"در حال پیگیری":"اتمام کار"}
function incDot(s){return s==="open"?"green":s==="progress"?"orange":"blue"}
function incAge(i){if(i.status==="closed")return"";let h=(Date.now()-new Date(i.createdAt))/36e5;return h>=48?"age-red":h>=24?"age-orange":""}

function renderIncidents(){
  $("dateI").textContent=fa(iDate);
  // An unresolved Incident stays on the main list on every date on/after
  // its registration date until it is closed.
  let list=incidents.filter(i=>i.reg<=iDate)
    .filter(i=>iFilter==="all"||i.status===iFilter)
    .filter(i=>i.status!=="closed");
  $("incidentRows").innerHTML=list.map(i=>`<tr class="${incAge(i)}">
<td><b>${esc(i.no)}</b></td><td>${esc(i.subject)}</td><td>${fa(i.reg)}</td><td>${esc(i.contractor||"-")}</td>
<td>${fa(i.f1)}</td><td>${fa(i.f2)}</td><td class="status"><i class="${incDot(i.status)}"></i>${incStatus(i.status)}</td>
<td class="progress">${i.progress}%<div class="bar"><span style="width:${i.progress}%"></span></div></td>
<td class="elapsed">${elapsed(i.createdAt,i.completedAt)}</td><td>${esc(i.description||"-")}</td>
<td><div class="rowactions"><button onclick="editIncident('${i.id}')">ویرایش</button><button onclick="deleteIncident('${i.id}')">حذف</button></div></td></tr>`).join("");
  $("emptyI").style.display=list.length?"none":"block";
  renderContractorStats();
}

function taskStatusText(s){return s==="done"?"انجام شد":"انجام نشد"}
function renderTasks(){
  $("dateT").textContent=fa(tDate);
  // An unfinished Task stays on the main list on every date on/after
  // its original date until it is marked done.
  let list=tasks.filter(t=>t.date<=tDate).filter(t=>t.status!=="done");
  $("taskRows").innerHTML=list.map(t=>`<tr>
<td><b>${esc(t.name)}</b></td><td>${esc(t.time)}</td><td>${esc(t.description||"-")}</td><td>${esc(t.person||"-")}</td>
<td>${fa(t.date)}</td><td>${taskStatusText(t.status)}</td><td class="elapsed">${elapsed(t.createdAt,t.completedAt)}</td>
<td><div class="rowactions"><button onclick="editTask('${t.id}')">ویرایش</button><button onclick="deleteTask('${t.id}')">حذف</button></div></td></tr>`).join("");
  $("emptyT").style.display=list.length?"none":"block";
}

function renderHistory(){
  let q=($("historySearch")?.value||"").toLowerCase().trim();
  let closedIncidents=incidents.filter(i=>i.status==="closed").map(i=>({...i,historyType:"completed"}));
  let deletedIncidents=history.filter(x=>x.type==="incident").map(x=>({...x.item,historyType:"deleted"}));
  let allIncidents=[...closedIncidents,...deletedIncidents].filter(i=>!q||[i.no,i.subject,i.contractor,i.description].join(" ").toLowerCase().includes(q));
  let doneTasks=tasks.filter(t=>t.status==="done").map(t=>({...t,historyType:"completed"}));
  let deletedTasks=history.filter(x=>x.type==="task").map(x=>({...x.item,historyType:"deleted"}));
  let allTasks=[...doneTasks,...deletedTasks].filter(t=>!q||[t.name,t.person,t.description].join(" ").toLowerCase().includes(q));

  $("historyIncidentRows").innerHTML=allIncidents.map(i=>`<tr class="history-incident ${i.historyType==="deleted"?"history-deleted":""}">
<td><span class="history-badge incident-badge">${i.historyType==="deleted"?"Incident - حذف شده":"Incident"}</span></td><td><b>${esc(i.no)}</b></td><td>${esc(i.subject)}</td>
<td>${fa(i.reg)}</td><td>${esc(i.contractor||"-")}</td><td>${i.progress}%</td><td>${esc(i.description||"-")}</td>
<td>${fa(i.f1)}</td><td>${fa(i.f2)}</td></tr>`).join("");

  $("historyTaskRows").innerHTML=allTasks.map(t=>`<tr class="history-task ${t.historyType==="deleted"?"history-deleted":""}">
<td><span class="history-badge task-badge">${t.historyType==="deleted"?"Task - حذف شده":"Task"}</span></td><td><b>${esc(t.name)}</b></td><td>${esc(t.time)}</td>
<td>${esc(t.description||"-")}</td><td>${esc(t.person||"-")}</td><td>${fa(t.date)}</td><td>${t.historyType==="deleted"?"حذف شده":"انجام شد"}</td><td class="elapsed">${elapsed(t.createdAt,t.completedAt)}</td></tr>`).join("");

  $("emptyHI").style.display=allIncidents.length?"none":"block";
  $("emptyHT").style.display=allTasks.length?"none":"block";
}
function renderContractorStats(){
  const active=incidents.filter(i=>i.status!=="closed");
  const names=["شعبه","فرنیروی شرق","لاوین اساک"];
  names.forEach((name,idx)=>{
    const el=$("count"+idx);
    if(el) el.textContent=active.filter(i=>i.contractor===name).length;
  });
  const total=$("countTotal");
  if(total) total.textContent=active.length;
}

function renderAll(){renderIncidents();renderTasks();renderHistory();renderContractorStats()}

function openIncident(){
  $("incidentForm").reset();$("incidentId").value="";$("incidentTitle").textContent="ثبت Incident";
  $("incidentDate").value=iDate;$("incidentStatus").value="open";$("incidentProgress").value=0;$("incidentDlg").showModal()
}
function editIncident(id){
  let i=incidents.find(x=>x.id===id);if(!i)return;
  $("incidentId").value=id;$("incidentTitle").textContent="ویرایش Incident";$("incidentNo").value=i.no;$("incidentSubject").value=i.subject;
  $("incidentDate").value=i.reg;$("contractor").value=i.contractor||"";$("follow1").value=i.f1||"";$("follow2").value=i.f2||"";
  $("incidentStatus").value=i.status;$("incidentProgress").value=i.progress;$("incidentDescription").value=i.description||"";$("incidentDlg").showModal()
}
function deleteIncident(id){
  if(confirm("این Incident حذف شود؟")){
    let item=incidents.find(x=>x.id===id);
    if(item) history.push({id:crypto.randomUUID(),type:"incident",action:"deleted",at:new Date().toISOString(),item:{...item}});
    incidents=incidents.filter(x=>x.id!==id);save();renderAll();
  }
}

$("incidentForm").onsubmit=e=>{
  e.preventDefault();let id=$("incidentId").value;
  let v={no:$("incidentNo").value.trim(),subject:$("incidentSubject").value.trim(),reg:$("incidentDate").value,contractor:$("contractor").value.trim(),
  f1:$("follow1").value,f2:$("follow2").value,status:$("incidentStatus").value,progress:Math.max(0,Math.min(100,Number($("incidentProgress").value)||0)),description:$("incidentDescription").value.trim()};
  if(id){let old=incidents.find(x=>x.id===id);if(old){let completedAt=old.completedAt;if(v.status==="closed" && old.status!=="closed") completedAt=new Date().toISOString();if(v.status!=="closed") completedAt="";Object.assign(old,v,{completedAt});}}else incidents.push({id:crypto.randomUUID(),createdAt:new Date().toISOString(),completedAt:v.status==="closed"?new Date().toISOString():"",...v});
  save();$("incidentDlg").close();renderAll()
}

function openTask(){
  $("taskForm").reset();$("taskId").value="";$("taskTitle").textContent="ثبت Task روزانه";$("taskDate").value=tDate;$("taskStatus").value="notdone";$("taskDlg").showModal()
}
function editTask(id){
  let t=tasks.find(x=>x.id===id);if(!t)return;
  $("taskId").value=id;$("taskTitle").textContent="ویرایش Task";$("taskName").value=t.name;$("taskTime").value=t.time;
  $("taskDescription").value=t.description||"";$("taskPerson").value=t.person||"";$("taskDate").value=t.date;$("taskStatus").value=t.status;$("taskDlg").showModal()
}
function deleteTask(id){
  if(confirm("این Task حذف شود؟")){
    let item=tasks.find(x=>x.id===id);
    if(item) history.push({id:crypto.randomUUID(),type:"task",action:"deleted",at:new Date().toISOString(),item:{...item}});
    tasks=tasks.filter(x=>x.id!==id);save();renderAll();
  }
}

$("taskForm").onsubmit=e=>{
  e.preventDefault();let id=$("taskId").value;
  let v={name:$("taskName").value.trim(),time:$("taskTime").value,description:$("taskDescription").value.trim(),person:$("taskPerson").value.trim(),date:$("taskDate").value,status:$("taskStatus").value};
  if(id){let old=tasks.find(x=>x.id===id);if(old){let completedAt=old.completedAt;if(v.status==="done" && old.status!=="done") completedAt=new Date().toISOString();if(v.status!=="done") completedAt="";Object.assign(old,v,{completedAt});}}else tasks.push({id:crypto.randomUUID(),createdAt:new Date().toISOString(),completedAt:v.status==="done"?new Date().toISOString():"",...v});
  save();$("taskDlg").close();renderAll()
}

document.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>$(b.dataset.close).close());
$("addIncident").onclick=openIncident;$("addTask").onclick=openTask;
$("historySearch").oninput=renderHistory;

function shift(which,days){
  if(which==="i") iDate=shiftISO(iDate,days);
  else tDate=shiftISO(tDate,days);
  renderAll();
}
$("prevI").onclick=()=>shift("i",-1);$("nextI").onclick=()=>shift("i",1);$("todayI").onclick=()=>{iDate=today();renderAll()};
$("prevT").onclick=()=>shift("t",-1);$("nextT").onclick=()=>shift("t",1);$("todayT").onclick=()=>{tDate=today();renderAll()};

document.querySelectorAll(".filter").forEach(b=>b.onclick=()=>{document.querySelectorAll(".filter").forEach(x=>x.classList.remove("active"));b.classList.add("active");iFilter=b.dataset.status;renderIncidents()});
document.querySelectorAll("[data-page]").forEach(b=>b.onclick=()=>{
  let p=b.dataset.page;document.querySelectorAll(".page").forEach(x=>x.classList.toggle("active",x.id===p));
  document.querySelectorAll("[data-page]").forEach(x=>x.classList.toggle("active",x.dataset.page===p));
});
setInterval(renderAll,1000);renderAll();