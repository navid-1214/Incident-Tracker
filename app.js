const IK="incident-tracker-v4-incidents",TK="incident-tracker-v4-tasks",HK="incident-tracker-v4-history";
let incidents=JSON.parse(localStorage.getItem(IK)||"[]");
let tasks=JSON.parse(localStorage.getItem(TK)||"[]");
let history=JSON.parse(localStorage.getItem(HK)||"[]");
const MK="incident-tracker-v1-msh-zones";
let mshZones=JSON.parse(localStorage.getItem(MK)||"[]");
let mshFilter="all";
let iDate=today(),tDate=today(),iFilter="all",iContractorFilter="all";
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
function save(){localStorage.setItem(IK,JSON.stringify(incidents));localStorage.setItem(TK,JSON.stringify(tasks));localStorage.setItem(HK,JSON.stringify(history));localStorage.setItem(MK,JSON.stringify(mshZones))}
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
    .filter(i=>i.status!=="closed")
    .filter(i=>iContractorFilter==="all"||(iContractorFilter==="فرنیروی شرق" && (i.contractor==="فرنیروی شرق"||i.contractor==="فرنیرو"))||i.contractor===iContractorFilter);
  $("incidentRows").innerHTML=list.map(i=>`<tr class="${incAge(i)}">
<td><b>${esc(i.no)}</b></td><td>${esc(i.subject)}</td><td>${fa(i.reg)}</td><td>${esc(i.contractor||"-")}</td>
<td>${fa(i.f1)}</td><td>${completionDateText(i)}</td><td class="status"><i class="${incDot(i.status)}"></i>${incStatus(i.status)}</td>
<td class="progress">${i.progress}%<div class="bar"><span style="width:${i.progress}%"></span></div></td>
<td class="elapsed">${elapsed(i.createdAt,i.completedAt)}</td><td>${esc(i.description||"-")}</td>
<td><div class="rowactions"><button class="icon-edit" onclick="editIncident('${i.id}')" aria-label="ویرایش" title="ویرایش">✏️</button><button class="icon-delete" onclick="deleteIncident('${i.id}')" aria-label="حذف" title="حذف">🗑️</button></div></td></tr>`).join("");
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
<td><div class="rowactions"><button class="icon-edit" onclick="editTask('${t.id}')" aria-label="ویرایش" title="ویرایش">✏️</button><button class="icon-delete" onclick="deleteTask('${t.id}')" aria-label="حذف" title="حذف">🗑️</button></div></td></tr>`).join("");
  $("emptyT").style.display=list.length?"none":"block";
}

function formatDuration(ms){
  if(!Number.isFinite(ms)||ms<0) return "-";
  const totalMinutes=Math.floor(ms/60000), days=Math.floor(totalMinutes/1440), hours=Math.floor((totalMinutes%1440)/60), minutes=totalMinutes%60;
  if(days>0) return `${days} روز و ${hours} ساعت و ${minutes} دقیقه`;
  if(hours>0) return `${hours} ساعت و ${minutes} دقیقه`;
  return `${minutes} دقیقه`;
}
function completionDateText(i){
  if(!i.completedAt) return "-";
  const d=new Date(i.completedAt);
  if(Number.isNaN(d.getTime())) return "-";
  return `${new Intl.DateTimeFormat("fa-IR-u-ca-persian",{year:"numeric",month:"2-digit",day:"2-digit"}).format(d)} - ${d.toLocaleTimeString("fa-IR",{hour:"2-digit",minute:"2-digit"})}`;
}
function incidentCompletionMs(i){
  if(!i?.createdAt||!i?.completedAt) return null;
  const start=new Date(i.createdAt).getTime(), end=new Date(i.completedAt).getTime();
  if(!Number.isFinite(start)||!Number.isFinite(end)||end<start) return null;
  return end-start;
}
function historyIncidentItems(){
  const closed=incidents.filter(i=>i.status==="closed").map(i=>({...i,historyType:"completed"}));
  const deleted=history.filter(x=>x.type==="incident").map(x=>({...x.item,historyType:"deleted",deletedAt:x.at}));
  const seen=new Set(), out=[];
  [...closed,...deleted].forEach(i=>{
    const key=i.id||`${i.no}|${i.createdAt||i.reg}`;
    if(!seen.has(key)){seen.add(key);out.push(i)}
  });
  return out;
}
function renderHistory(){
  const q=($("historySearch")?.value||"").toLowerCase().trim();
  const allIncidents=historyIncidentItems().filter(i=>!q||[i.no,i.subject,i.contractor,i.description].join(" ").toLowerCase().includes(q));
  $("historyIncidentRows").innerHTML=allIncidents.map(i=>`<tr class="history-incident ${i.historyType==="deleted"?"history-deleted":""}" data-history-id="${esc(i.id)}" tabindex="0" role="button" aria-label="نمایش جزئیات ${esc(i.no)}">
<td><span class="history-badge incident-badge">${i.historyType==="deleted"?"Incident - حذف شده":"Incident"}</span></td><td><b>${esc(i.no)}</b></td><td>${esc(i.subject)}</td>
<td>${fa(i.reg)}</td><td>${esc(i.contractor||"-")}</td><td>${i.progress}%</td><td>${esc(i.description||"-")}</td>
<td>${fa(i.f1)}</td><td>${completionDateText(i)}</td></tr>`).join("");
  $("emptyHI").style.display=allIncidents.length?"none":"block";
  renderContractorPerformance();
  document.querySelectorAll("[data-history-id]").forEach(row=>{
    const open=()=>openHistoryIncident(row.dataset.historyId);
    row.onclick=open;
    row.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();open()}};
  });
}
function openHistoryIncident(id){
  const i=historyIncidentItems().find(x=>String(x.id)===String(id));
  if(!i)return;
  const ms=incidentCompletionMs(i);
  $("historyIncidentDetail").innerHTML=`
    <div class="detail-grid">
      <div><span>شماره Incident</span><b>${esc(i.no)}</b></div>
      <div><span>وضعیت History</span><b>${i.historyType==="deleted"?"حذف شده":"اتمام کار"}</b></div>
      <div><span>موضوع Incident</span><b>${esc(i.subject||"-")}</b></div>
      <div><span>پیمانکار</span><b>${esc(i.contractor||"-")}</b></div>
      <div><span>تاریخ ثبت</span><b>${fa(i.reg)}</b></div>
      <div><span>تاریخ اتمام</span><b>${completionDateText(i)}</b></div>
      <div class="detail-wide"><span>مدت زمان از ثبت تا اتمام</span><b>${ms===null?"برای این Incident زمان اتمام معتبر ثبت نشده است.":formatDuration(ms)}</b></div>
      <div class="detail-wide"><span>توضیحات</span><p>${esc(i.description||"توضیحی ثبت نشده است.")}</p></div>
    </div>`;
  $("historyIncidentDlg").showModal();
}
function renderContractorPerformance(){
  const names=["شعبه","فرنیروی شرق","لاوین اساک"];
  const colors=["branch","east","lavin"];
  const items=historyIncidentItems();
  const cards=names.map((name,idx)=>{
    const completed=items.filter(i=>i.status==="closed"&&i.contractor===name);
    const valid=completed.map(incidentCompletionMs).filter(v=>v!==null);
    const avg=valid.length?valid.reduce((a,b)=>a+b,0)/valid.length:null;
    return {name,color:colors[idx],count:completed.length,validCount:valid.length,avg};
  });
  const box=$("contractorPerformance");
  if(!box)return;
  box.innerHTML=cards.map(c=>`<article class="performance-card performance-${c.color}">
    <div class="performance-top"><span class="performance-dot"></span><strong>${esc(c.name)}</strong></div>
    <div class="performance-time">${c.avg===null?"—":esc(formatDuration(c.avg))}</div>
    <div class="performance-label">میانگین زمان رفع مشکل</div>
    <div class="performance-meta"><span>Incident اتمام‌یافته</span><b>${c.count}</b></div>
    <div class="performance-meta"><span>مورد دارای زمان معتبر</span><b>${c.validCount}</b></div>
  </article>`).join("");
}

function setContractorFilter(name){
  iContractorFilter=name;
  document.querySelectorAll("[data-contractor-filter]").forEach(el=>{
    el.classList.toggle("active",el.dataset.contractorFilter===name);
  });
  renderIncidents();
}

function renderContractorStats(){
  const active=incidents.filter(i=>i.status!=="closed");
  const names=["شعبه","فرنیروی شرق","لاوین اساک"];
  names.forEach((name,idx)=>{
    const el=$("count"+idx);
    if(el) el.textContent=active.filter(i=>name==="فرنیروی شرق" ? (i.contractor==="فرنیروی شرق"||i.contractor==="فرنیرو") : i.contractor===name).length;
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

document.querySelectorAll(".filter").forEach(b=>b.onclick=()=>{const wasActive=b.classList.contains("active");document.querySelectorAll(".filter").forEach(x=>x.classList.remove("active"));iFilter=wasActive?"all":b.dataset.status;if(!wasActive)b.classList.add("active");renderIncidents()});
document.querySelectorAll("[data-contractor-filter]").forEach(b=>b.onclick=()=>setContractorFilter(b.dataset.contractorFilter));
document.querySelectorAll("[data-page]").forEach(b=>b.onclick=()=>{
  let p=b.dataset.page;document.querySelectorAll(".page").forEach(x=>x.classList.toggle("active",x.id===p));
  document.querySelectorAll("[data-page]").forEach(x=>x.classList.toggle("active",x.dataset.page===p));
});

function renderMsh(){
  const q=($('mshSearch')?.value||'').trim();
  ["لاوین اساک","فرنیرو","اریا برسام"].forEach((name,idx)=>{
    const id=["mshCountLavin","mshCountFarniru","mshCountAria"][idx];
    if($(id)) $(id).textContent=mshZones.filter(x=>x.contractor===name).length;
  });
  const box=$("mshResults");
  // On opening MSH Zone Manager, keep the zone list hidden.
  // Zones appear only after selecting a contractor or searching.
  if(mshFilter==="all" && !q){
    box.innerHTML='';
    return;
  }
  const list=mshZones
    .filter(x=>mshFilter==="all"||x.contractor===mshFilter)
    .filter(x=>!q||String(x.zone).includes(q));
  if(!list.length){box.innerHTML='<div class="msh-empty">زون موردنظر پیدا نشد.</div>';return;}
  box.innerHTML=list.map(x=>`<div class="msh-result"><span class="zone">زون ${esc(x.zone)}</span><span class="contractor">${esc(x.contractor)}</span><button type="button" class="msh-delete" data-msh-delete="${esc(x.id)}" aria-label="حذف زون">🗑️</button></div>`).join("");
  box.querySelectorAll('[data-msh-delete]').forEach(btn=>btn.onclick=()=>{
    const id=btn.dataset.mshDelete;
    const item=mshZones.find(x=>x.id===id);
    if(!item)return;
    if(!confirm(`زون ${item.zone} حذف شود؟`))return;
    mshZones=mshZones.filter(x=>x.id!==id);
    save();
    renderMsh();
  });
}
function openMsh(){mshFilter="all";document.querySelectorAll("[data-msh-contractor]").forEach(x=>x.classList.remove("active"));$("mshSearch").value="";renderMsh();$("mshDlg").showModal()}
$("mshLauncher").onclick=openMsh;
$("closeMsh").onclick=()=>$("mshDlg").close();
$("mshAdd").onclick=()=>{$("mshForm").reset();$("mshFormDlg").showModal()};
$("mshSearch").oninput=renderMsh;
document.querySelectorAll("[data-msh-contractor]").forEach(b=>b.onclick=()=>{mshFilter=b.dataset.mshContractor;document.querySelectorAll("[data-msh-contractor]").forEach(x=>x.classList.toggle("active",x===b));renderMsh()});
$("mshForm").onsubmit=e=>{e.preventDefault();const zone=$("mshZone").value.trim();const contractor=$("mshContractor").value;if(mshZones.some(x=>String(x.zone)===zone)){alert("این شماره زون قبلاً ثبت شده است.");return;}mshZones.push({id:crypto.randomUUID(),zone,contractor,createdAt:new Date().toISOString()});save();$("mshFormDlg").close();renderMsh()};
// XLSX import for Incident registration.
// Excel columns used ONLY: 1=Incident number, 3=Title. Registration time is set to import time.
function normalizeImportText(value){
  return String(value ?? "")
    .replace(/\u200c/g," ")
    .replace(/[يى]/g,"ی").replace(/ك/g,"ک")
    .replace(/\s+/g," ").trim();
}
function incidentNumberExists(no){
  const key=normalizeImportText(no);
  if(!key) return false;
  if(incidents.some(i=>normalizeImportText(i.no)===key)) return true;
  if(history.some(x=>x.type==="incident" && normalizeImportText(x.item?.no)===key)) return true;
  return false;
}
async function importIncidentsFromXlsx(file){
  if(!file) return;
  if(typeof XLSX==="undefined"){
    alert("امکان خواندن فایل xlsx فراهم نیست. لطفاً یک‌بار برنامه را با اینترنت باز کنید و دوباره تلاش کنید.");
    return;
  }
  try{
    const data=await file.arrayBuffer();
    const wb=XLSX.read(data,{type:"array",cellDates:true});
    if(!wb.SheetNames.length) throw new Error("no-sheet");
    const ws=wb.Sheets[wb.SheetNames[0]];
    const rows=XLSX.utils.sheet_to_json(ws,{header:1,defval:"",raw:false});
    if(!rows.length){
      alert("فایل Excel خالی است.");
      return;
    }

    const imported=[];
    const skippedDuplicate=[];
    const skippedInvalid=[];
    const batchNumbers=new Set();
    const importTime=new Date();

    rows.forEach((row,index)=>{
      const no=normalizeImportText(row[0]);
      const subject=normalizeImportText(row[2]);

      // Ignore an Excel header row if present.
      const headerNo=no.toLowerCase();
      const headerSubject=subject.toLowerCase();
      if(index===0 && (headerNo.includes("شماره") || headerNo.includes("incident") || headerSubject.includes("عنوان"))) return;

      if(!no){
        skippedInvalid.push(index+1);
        return;
      }

      const key=no;
      if(incidentNumberExists(key) || batchNumbers.has(key)){
        skippedDuplicate.push(key);
        return;
      }
      batchNumbers.add(key);

      imported.push({
        id:crypto.randomUUID(),
        createdAt:importTime.toISOString(),
        completedAt:"",
        no,
        subject,
        // Registration date/time is the exact moment the Excel import starts.
        reg:localISO(importTime),
        // Contractor is intentionally NOT imported from Excel.
        contractor:"",
        f1:"",
        f2:"",
        status:"open",
        progress:0,
        description:""
      });
    });

    incidents.push(...imported);
    if(imported.length) save();
    renderAll();

    let msg=`${imported.length} Incident با موفقیت وارد شد.`;
    if(skippedDuplicate.length) msg+=`\n${skippedDuplicate.length} مورد به دلیل شماره Incident تکراری وارد نشد.`;
    if(skippedInvalid.length) msg+=`\n${skippedInvalid.length} ردیف بدون شماره Incident نادیده گرفته شد.`;
    alert(msg);
  }catch(err){
    console.error(err);
    alert("خواندن فایل xlsx انجام نشد. لطفاً مطمئن شوید فایل Excel معتبر است.");
  }
}

function chooseXlsxFile(){
  $("xlsxFile").value="";
  $("xlsxFile").click();
}
const xlsxImportBtn=$("xlsxImportBtn");
if(xlsxImportBtn) xlsxImportBtn.onclick=chooseXlsxFile;
$("xlsxFile").onchange=e=>{
  const file=e.target.files?.[0];
  if(file) importIncidentsFromXlsx(file);
};

setInterval(renderAll,1000);renderAll();