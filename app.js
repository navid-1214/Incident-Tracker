const IK="incident-tracker-v4-incidents",TK="incident-tracker-v4-tasks",HK="incident-tracker-v4-history",CK="incident-tracker-v1-customer",CH="incident-tracker-v1-customer-history",MK="incident-tracker-v1-msh-zones";
let incidents=JSON.parse(localStorage.getItem(IK)||"[]"),tasks=JSON.parse(localStorage.getItem(TK)||"[]"),history=JSON.parse(localStorage.getItem(HK)||"[]"),customers=JSON.parse(localStorage.getItem(CK)||"[]"),customerHistory=JSON.parse(localStorage.getItem(CH)||"[]"),mshZones=JSON.parse(localStorage.getItem(MK)||"[]");
let mshFilter="all",iDate=today(),tDate=today(),iFilter="all",iContractorFilter="all",networkHistoryPage=1,customerHistoryPage=1,customerStatusFilter="all",customerContractorFilter="all",customerSortMode="none";
const $=id=>document.getElementById(id);
function today(){return localISO(new Date())}
function localISO(d){const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,"0"),day=String(d.getDate()).padStart(2,"0");return `${y}-${m}-${day}`}
function shiftISO(iso,days){const [y,m,d]=iso.split("-").map(Number),dt=new Date(Date.UTC(y,m-1,d));dt.setUTCDate(dt.getUTCDate()+days);return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth()+1).padStart(2,"0")}-${String(dt.getUTCDate()).padStart(2,"0")}`}
function fa(s){if(!s)return"-";return new Intl.DateTimeFormat("fa-IR-u-ca-persian",{year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(s+"T00:00:00"))}
function esc(x){return String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function normalizeText(v){return String(v??"").replace(/\u200c/g," ").replace(/[يى]/g,"ی").replace(/ك/g,"ک").replace(/\s+/g," ").trim()}
function normalizeIncidentNumber(v){return String(v??"").replace(/\u200c/g,"").replace(/[^0-9]/g,"").replace(/^0+(?=\d)/,"")}
function incidentNoHtml(v){const n=normalizeIncidentNumber(v)||String(v??"").trim();return `<span class="incident-number"><b>${esc(n)}</b><small>-INC</small></span>`}
function save(){localStorage.setItem(IK,JSON.stringify(incidents));localStorage.setItem(TK,JSON.stringify(tasks));localStorage.setItem(HK,JSON.stringify(history));localStorage.setItem(CK,JSON.stringify(customers));localStorage.setItem(CH,JSON.stringify(customerHistory));localStorage.setItem(MK,JSON.stringify(mshZones))}
function elapsed(a,b){const end=b?new Date(b):new Date(),n=Math.max(0,Math.floor((end-new Date(a))/1000)),h=Math.floor(n/3600),m=Math.floor(n%3600/60),s=n%60;return [h,m,s].map(x=>String(x).padStart(2,"0")).join(":")}
function incStatus(s){return s==="open"?"باز":s==="progress"?"در حال پیگیری":"اتمام کار"}
function incDot(s){return s==="open"?"green":s==="progress"?"orange":"blue"}
function incAge(i){if(i.status==="closed")return"";const h=(Date.now()-new Date(i.createdAt))/36e5;return h>=48?"age-red":h>=24?"age-orange":""}
function completionDateText(i){if(!i.completedAt)return"-";const d=new Date(i.completedAt);return Number.isNaN(d.getTime())?"-":`${new Intl.DateTimeFormat("fa-IR-u-ca-persian",{year:"numeric",month:"2-digit",day:"2-digit"}).format(d)} - ${d.toLocaleTimeString("fa-IR",{hour:"2-digit",minute:"2-digit"})}`}
function renderIncidents(){
  $("dateI").textContent=fa(iDate);
  const list=incidents.filter(i=>i.reg<=iDate).filter(i=>iFilter==="all"||i.status===iFilter).filter(i=>i.status!=="closed").filter(i=>iContractorFilter==="all"||(iContractorFilter==="فرنیروی شرق"&&(i.contractor==="فرنیروی شرق"||i.contractor==="فرنیرو"))||i.contractor===iContractorFilter);
  $("incidentRows").innerHTML=list.map(i=>`<tr class="${incAge(i)}"><td>${incidentNoHtml(i.no)}</td><td>${esc(i.subject)}</td><td>${fa(i.reg)}</td><td>${esc(i.contractor||"-")}</td><td>${fa(i.f1)}</td><td>${completionDateText(i)}</td><td class="status"><i class="${incDot(i.status)}"></i>${incStatus(i.status)}</td><td class="progress">${i.progress}%<div class="bar"><span style="width:${i.progress}%"></span></div></td><td class="elapsed">${elapsed(i.createdAt,i.completedAt)}</td><td>${esc(i.description||"-")}</td><td><div class="rowactions"><button class="icon-edit" onclick="editIncident('${i.id}')" title="ویرایش">✏️</button><button class="icon-delete" onclick="deleteIncident('${i.id}')" title="حذف">🗑️</button></div></td></tr>`).join("");
  $("emptyI").style.display=list.length?"none":"block";renderContractorStats()
}
function renderContractorStats(){const active=incidents.filter(i=>i.status!=="closed");["شعبه","فرنیروی شرق","لاوین اساک"].forEach((n,k)=>{const el=$("count"+k);if(el)el.textContent=active.filter(i=>n==="فرنیروی شرق"?(i.contractor==="فرنیروی شرق"||i.contractor==="فرنیرو"):i.contractor===n).length});if($("countTotal"))$("countTotal").textContent=active.length}
function openIncident(){$("incidentForm").reset();$("incidentId").value="";$("incidentTitle").textContent="ثبت Incident";$("incidentDate").value=iDate;$("incidentStatus").value="open";$("incidentProgress").value=0;$("progressValue").value="0%";$("incidentDlg").showModal()}
function editIncident(id){const i=incidents.find(x=>x.id===id);if(!i)return;$("incidentId").value=id;$("incidentTitle").textContent="ویرایش Incident";$("incidentNo").value=normalizeIncidentNumber(i.no);$("incidentSubject").value=i.subject;$("incidentDate").value=i.reg;$("contractor").value=i.contractor||"";$("follow1").value=i.f1||"";$("incidentStatus").value=i.status;$("incidentProgress").value=i.progress;$("progressValue").value=i.progress+"%";$("incidentDescription").value=i.description||"";$("incidentDlg").showModal()}
function deleteIncident(id){if(!confirm("این Incident حذف شود؟"))return;const item=incidents.find(x=>x.id===id);if(item)history.push({id:crypto.randomUUID(),type:"incident",action:"deleted",at:new Date().toISOString(),item:{...item}});incidents=incidents.filter(x=>x.id!==id);save();renderAll()}
$("incidentForm").onsubmit=e=>{e.preventDefault();const id=$("incidentId").value,v={no:normalizeIncidentNumber($("incidentNo").value),subject:$("incidentSubject").value.trim(),reg:$("incidentDate").value,contractor:$("contractor").value,f1:$("follow1").value,status:$("incidentStatus").value,progress:Number($("incidentProgress").value)||0,description:$("incidentDescription").value.trim()};if(id){const old=incidents.find(x=>x.id===id);if(old){let completedAt=old.completedAt;if(v.status==="closed"&&old.status!=="closed")completedAt=new Date().toISOString();if(v.status!=="closed")completedAt="";Object.assign(old,v,{completedAt})}}else incidents.push({id:crypto.randomUUID(),createdAt:new Date().toISOString(),completedAt:v.status==="closed"?new Date().toISOString():"",...v});save();$("incidentDlg").close();renderAll()}

function customerStatusText(s){return incStatus(s)}
function canonicalCustomerContractor(v){
  const key=normalizeText(v);
  if(!key)return "";
  if(["سعید اسحقی","داده گستر لاوین","لاوین اساک","لاوین اساک"].includes(key))return "سعید اسحقی";
  if(["سید مهدی خطیبی","فرنیرو","فرنیروی شرق","فر نیروی شرق"].includes(key))return "سید مهدی خطیبی";
  if(["امیر مدیری","آریا برسام","اریا برسام"].includes(key))return "امیر مدیری";
  return key;
}

function extractOAC(title){const m=String(title||"").match(/\bOAC\s*[-_/#:]?\s*([A-Za-z0-9۰-۹٠-٩_-]+)/i);return m?`OAC ${m[1]}`:""}
function customerSortValue(c){
  if(customerSortMode==="contractor")return canonicalCustomerContractor(c.contractor).toLocaleLowerCase();
  if(customerSortMode==="operator")return normalizeText(c.operator).toLocaleLowerCase();
  if(customerSortMode==="oac")return (extractOAC(c.title)||"ZZZ").toLocaleLowerCase();
  return "";
}
function getCustomerList(){
  let list=customers.filter(x=>x.status!=="closed");
  if(customerStatusFilter!=="all")list=list.filter(x=>x.status===customerStatusFilter);
  if(customerContractorFilter!=="all")list=list.filter(x=>canonicalCustomerContractor(x.contractor)===customerContractorFilter);
  if(customerSortMode!=="none")list=[...list].sort((a,b)=>customerSortValue(a).localeCompare(customerSortValue(b),"fa"));
  return list;
}
function renderCustomerContractorStats(){
  const active=customers.filter(x=>x.status!=="closed");
  const names=["سعید اسحقی","سید مهدی خطیبی","امیر مدیری"];
  names.forEach((n,i)=>{const id=["customerCountLavin","customerCountEast","customerCountAria"][i];if($(id))$(id).textContent=active.filter(c=>canonicalCustomerContractor(c.contractor)===n).length});
  if($("customerCountTotal"))$("customerCountTotal").textContent=active.length;
  document.querySelectorAll("[data-customer-contractor]").forEach(b=>b.classList.toggle("active",b.dataset.customerContractor===customerContractorFilter));
}
function renderCustomers(){
  const list=getCustomerList();
  $("customerRows").innerHTML=list.map(c=>`<tr><td>${incidentNoHtml(c.no)}</td><td>${esc(c.title||"-")}</td><td>${esc(c.cause||"-").replace(/\n/g,"<br>")}</td><td>${esc(canonicalCustomerContractor(c.contractor)||"-")}</td><td>${esc(c.operator||"-")}</td><td class="status"><i class="${incDot(c.status)}"></i>${customerStatusText(c.status)}</td><td><div class="rowactions"><button class="icon-edit" onclick="editCustomer('${c.id}')" title="ویرایش">✏️</button><button class="icon-delete" onclick="deleteCustomer('${c.id}')" title="حذف">🗑️</button></div></td></tr>`).join("");
  $("emptyCustomer").style.display=list.length?"none":"block";
  renderCustomerContractorStats();
}
function openCustomer(){$("customerForm").reset();$("customerId").value="";$("customerTitle").textContent="ثبت Customer Incident";$('customerStatus').value="open";$('customerDlg').showModal()}
function editCustomer(id){const c=customers.find(x=>x.id===id);if(!c)return;$("customerId").value=id;$("customerTitle").textContent="ویرایش Customer Incident";$("customerNo").value=normalizeIncidentNumber(c.no);$("customerTitleInput").value=c.title||"";$("customerCause").value=c.cause||"";$("customerContractor").value=canonicalCustomerContractor(c.contractor)||c.contractor||"";$("customerOperator").value=c.operator||"";$("customerStatus").value=c.status;$('customerDlg').showModal()}
function deleteCustomer(id){if(!confirm("این Customer Incident حذف شود؟"))return;const item=customers.find(x=>x.id===id);if(item)customerHistory.push({id:crypto.randomUUID(),type:"customer",action:"deleted",at:new Date().toISOString(),item:{...item}});customers=customers.filter(x=>x.id!==id);save();renderAll()}
function clearAllCustomerRows(){const active=customers.filter(x=>x.status!=="closed");if(!active.length){alert("ردیفی برای حذف وجود ندارد.");return}if(!confirm(`همه ${active.length} ردیف فعال Customer Incident حذف شود؟`))return;const at=new Date().toISOString();active.forEach(item=>customerHistory.push({id:crypto.randomUUID(),type:"customer",action:"deleted",at,item:{...item}}));customers=customers.filter(x=>x.status==="closed");save();customerContractorFilter="all";customerStatusFilter="all";customerSortMode="none";renderAll()}
$("customerForm").onsubmit=e=>{e.preventDefault();const id=$("customerId").value,no=normalizeIncidentNumber($("customerNo").value);if(!no){alert("شماره Incident را وارد کنید.");return}if(customerExists(no,id)){alert("این شماره Customer Incident قبلاً ثبت شده است.");return}const v={no,title:$("customerTitleInput").value.trim(),cause:$("customerCause").value.trim(),contractor:canonicalCustomerContractor($("customerContractor").value),operator:$("customerOperator").value,status:$("customerStatus").value};if(id){const old=customers.find(x=>x.id===id);if(old){let completedAt=old.completedAt;if(v.status==="closed"&&old.status!=="closed")completedAt=new Date().toISOString();if(v.status!=="closed")completedAt="";Object.assign(old,v,{completedAt})}}else customers.push({id:crypto.randomUUID(),createdAt:new Date().toISOString(),completedAt:v.status==="closed"?new Date().toISOString():"",...v});save();$("customerDlg").close();renderAll()}

function historyNetworkItems(){const closed=incidents.filter(i=>i.status==="closed").map(i=>({...i,historyType:"completed",historyAt:i.completedAt||i.createdAt}));const deleted=history.filter(x=>x.type==="incident").map(x=>({...x.item,historyType:"deleted",historyAt:x.at}));const seen=new Set();return [...closed,...deleted].filter(i=>{const k=i.id||`${i.no}|${i.createdAt}`;if(seen.has(k))return false;seen.add(k);return true}).sort((a,b)=>new Date(b.historyAt||0)-new Date(a.historyAt||0))}
function historyCustomerItems(){const closed=customers.filter(c=>c.status==="closed").map(c=>({...c,historyType:"completed",historyAt:c.completedAt||c.createdAt}));const deleted=customerHistory.map(x=>({...x.item,historyType:"deleted",historyAt:x.at}));const seen=new Set();return [...closed,...deleted].filter(c=>{const k=c.id||`${c.no}|${c.createdAt}`;if(seen.has(k))return false;seen.add(k);return true}).sort((a,b)=>new Date(b.historyAt||0)-new Date(a.historyAt||0))}
function paginate(items,page){const size=5,total=Math.max(1,Math.ceil(items.length/size));const p=Math.min(page,total);return {rows:items.slice((p-1)*size,p*size),page:p,total}}
function pagerHtml(page,total,kind){if(total<=1)return"";let h=`<button type="button" data-pager="${kind}" data-page="${Math.max(1,page-1)}">‹</button>`;for(let i=1;i<=total;i++)h+=`<button type="button" class="${i===page?"active":""}" data-pager="${kind}" data-page="${i}">${i}</button>`;return h+`<button type="button" data-pager="${kind}" data-page="${Math.min(total,page+1)}">›</button>`}
function renderHistory(){const q=normalizeText($("historySearch")?.value).toLowerCase();const ni=historyNetworkItems().filter(i=>!q||[i.no,i.subject,i.contractor,i.description].join(" ").toLowerCase().includes(q));const ci=historyCustomerItems().filter(c=>!q||[c.no,c.title,c.cause,c.contractor,c.operator].join(" ").toLowerCase().includes(q));const np=paginate(ni,networkHistoryPage),cp=paginate(ci,customerHistoryPage);networkHistoryPage=np.page;customerHistoryPage=cp.page;$("historyIncidentRows").innerHTML=np.rows.map(i=>`<tr class="history-incident" data-history-id="${esc(i.id)}"><td><span class="history-badge incident-badge">${i.historyType==="deleted"?"حذف شده":"اتمام کار"}</span></td><td>${incidentNoHtml(i.no)}</td><td>${esc(i.subject||"-")}</td><td>${fa(i.reg)}</td><td>${esc(i.contractor||"-")}</td><td>${i.progress??0}%</td><td>${esc(i.description||"-")}</td><td>${fa(i.f1)}</td><td>${completionDateText(i)}</td></tr>`).join("");$("emptyHI").style.display=ni.length?"none":"block";$("networkHistoryPager").innerHTML=pagerHtml(networkHistoryPage,np.total,"network");$("customerHistoryRows").innerHTML=cp.rows.map(c=>`<tr class="customer-history-row" data-customer-history-id="${esc(c.id)}"><td><span class="history-badge incident-badge">${c.historyType==="deleted"?"حذف شده":"اتمام کار"}</span></td><td>${incidentNoHtml(c.no)}</td><td>${esc(c.title||"-")}</td><td>${esc(c.cause||"-")}</td><td>${esc(c.contractor||"-")}</td><td>${esc(c.operator||"-")}</td><td><i class="${incDot(c.status)}"></i>${customerStatusText(c.status)}</td></tr>`).join("");$("emptyCH").style.display=ci.length?"none":"block";$("customerHistoryPager").innerHTML=pagerHtml(customerHistoryPage,cp.total,"customer");document.querySelectorAll("[data-history-id]").forEach(r=>r.onclick=()=>openHistoryIncident(r.dataset.historyId));document.querySelectorAll("[data-customer-history-id]").forEach(r=>r.onclick=()=>openCustomerHistory(r.dataset.customerHistoryId));document.querySelectorAll("[data-pager]").forEach(b=>b.onclick=()=>{if(b.dataset.pager==="network")networkHistoryPage=Number(b.dataset.page);else customerHistoryPage=Number(b.dataset.page);renderHistory()})}
function openHistoryIncident(id){const i=historyNetworkItems().find(x=>String(x.id)===String(id));if(!i)return;$("historyDetailTitle").textContent="Network Incident — جزئیات History";$("historyIncidentDetail").innerHTML=`<div class="tablewrap"><table class="detail-table"><tbody><tr><th>Incident</th><td>${incidentNoHtml(i.no)}</td></tr><tr><th>موضوع</th><td>${esc(i.subject||"-")}</td></tr><tr><th>تاریخ ثبت</th><td>${fa(i.reg)}</td></tr><tr><th>پیمانکار</th><td>${esc(i.contractor||"-")}</td></tr><tr><th>وضعیت</th><td>${i.historyType==="deleted"?"حذف شده":"اتمام کار"}</td></tr><tr><th>درصد پیشرفت</th><td>${i.progress??0}%</td></tr><tr><th>توضیحات</th><td>${esc(i.description||"-")}</td></tr><tr><th>زمان سپری‌شده</th><td>${elapsed(i.createdAt,i.completedAt||i.historyAt)}</td></tr></tbody></table></div>`;$("historyIncidentDlg").showModal()}
function openCustomerHistory(id){const c=historyCustomerItems().find(x=>String(x.id)===String(id));if(!c)return;$("historyDetailTitle").textContent="Customer Incident — جزئیات History";$("historyIncidentDetail").innerHTML=`<div class="tablewrap"><table class="detail-table"><tbody><tr><th>Incident</th><td>${incidentNoHtml(c.no)}</td></tr><tr><th>عنوان</th><td>${esc(c.title||"-")}</td></tr><tr><th>علت</th><td>${esc(c.cause||"-")}</td></tr><tr><th>پیمانکار</th><td>${esc(c.contractor||"-")}</td></tr><tr><th>اپراتور بررسی کننده</th><td>${esc(c.operator||"-")}</td></tr><tr><th>وضعیت</th><td>${c.historyType==="deleted"?"حذف شده":customerStatusText(c.status)}</td></tr><tr><th>زمان ثبت</th><td>${c.createdAt?new Date(c.createdAt).toLocaleString("fa-IR"):"-"}</td></tr></tbody></table></div>`;$("historyIncidentDlg").showModal()}

function openTask(){
  $("taskForm").reset();$("taskId").value="";$("taskTitle").textContent="ثبت Task";$("taskDate").value=tDate;$("taskStatus").value="notdone";$("taskDlg").showModal()
}
function renderTaskRows(targetId,emptyId){
  const list=tasks.filter(t=>t.date<=tDate).sort((a,b)=>`${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
  const target=$(targetId); if(!target)return;
  target.innerHTML=list.map(t=>`<tr><td>${esc(t.name)}</td><td>${esc(t.time)}</td><td>${esc(t.description||"-")}</td><td>${esc(t.person||"-")}</td><td>${fa(t.date)}</td><td>${t.status==="done"?"انجام شد":"انجام نشد"}</td><td><div class="rowactions"><button onclick="editTask('${t.id}')" title="ویرایش">✏️</button><button onclick="deleteTask('${t.id}')" title="حذف">🗑️</button></div></td></tr>`).join("");
  if($(emptyId))$(emptyId).style.display=list.length?"none":"block";
}
function renderTasks(){renderTaskRows("taskRowsPage","emptyTPage")}
function editTask(id){const t=tasks.find(x=>x.id===id);if(!t)return;$("taskId").value=id;$("taskTitle").textContent="ویرایش Task";$("taskName").value=t.name;$("taskTime").value=t.time;$("taskDescription").value=t.description||"";$("taskPerson").value=t.person||"";$("taskDate").value=t.date;$("taskStatus").value=t.status;$("taskDlg").showModal()}
function deleteTask(id){if(!confirm("این Task حذف شود؟"))return;tasks=tasks.filter(x=>x.id!==id);save();renderTasks()}
$("taskForm").onsubmit=e=>{e.preventDefault();const id=$("taskId").value,v={name:$("taskName").value.trim(),time:$("taskTime").value,description:$("taskDescription").value.trim(),person:$("taskPerson").value.trim(),date:$("taskDate").value,status:$("taskStatus").value};if(id){const old=tasks.find(x=>x.id===id);if(old)Object.assign(old,v)}else tasks.push({id:crypto.randomUUID(),createdAt:new Date().toISOString(),...v});save();$("taskDlg").close();renderTasks()}

function renderMsh(){const q=($("mshSearch")?.value||"").trim();["لاوین اساک","فرنیرو","اریا برسام"].forEach((n,k)=>{const id=["mshCountLavin","mshCountFarniru","mshCountAria"][k];if($(id))$(id).textContent=mshZones.filter(x=>x.contractor===n).length});const box=$("mshResults");if(mshFilter==="all"&&!q){box.innerHTML="";return}const list=mshZones.filter(x=>mshFilter==="all"||x.contractor===mshFilter).filter(x=>!q||String(x.zone).includes(q));box.innerHTML=list.length?list.map(x=>`<div class="msh-result"><span class="zone">زون ${esc(x.zone)}</span><span class="contractor">${esc(x.contractor)}</span><button class="msh-delete" data-msh-delete="${esc(x.id)}">🗑️</button></div>`).join(""):"<div class='msh-empty'>زون موردنظر پیدا نشد.</div>";box.querySelectorAll("[data-msh-delete]").forEach(b=>b.onclick=()=>{const item=mshZones.find(x=>x.id===b.dataset.mshDelete);if(!item||!confirm(`زون ${item.zone} حذف شود؟`))return;mshZones=mshZones.filter(x=>x.id!==item.id);save();renderMsh()})}
function openMsh(){mshFilter="all";$("mshSearch").value="";document.querySelectorAll("[data-msh-contractor]").forEach(x=>x.classList.remove("active"));renderMsh();$("mshDlg").showModal()}

function parseContractorCell(v){
  const s=normalizeText(v);
  if(!s)return"";
  const i=s.indexOf("/");
  const after=(i>=0?s.slice(i+1):s);
  const lettersOnly=after.replace(/[0-9۰-۹٠-٩]/g,"").replace(/[^\u0600-\u06FFa-zA-Z\s]/g," ").replace(/\s+/g," ").trim();
  return canonicalCustomerContractor(lettersOnly);
}
async function importIncidents(file){if(!file)return;if(typeof XLSX==="undefined"){alert("امکان خواندن Excel فراهم نیست.");return}try{const rows=await readXlsx(file),imported=[],dups=[],seen=new Set(),now=new Date();rows.forEach((r,idx)=>{const no=normalizeIncidentNumber(r[0]),subject=normalizeText(r[2]);if(idx===0&&(/شماره|incident/i.test(String(r[0]))||/عنوان|موضوع/i.test(String(r[2]))))return;if(!no){return}if(incidents.some(i=>normalizeIncidentNumber(i.no)===no)||history.some(x=>normalizeIncidentNumber(x.item?.no)===no)||seen.has(no)){dups.push(no);return}seen.add(no);imported.push({id:crypto.randomUUID(),createdAt:now.toISOString(),completedAt:"",no,subject,reg:localISO(now),contractor:"",f1:"",status:"open",progress:0,description:""})});incidents.push(...imported);save();renderAll();showImportToast(`${imported.length} مورد با موفقیت وارد شد.`,dups)}catch(e){console.error(e);alert("خواندن فایل Excel انجام نشد.")}}
async function importCustomers(file){if(!file)return;if(typeof XLSX==="undefined"){alert("امکان خواندن Excel فراهم نیست.");return}try{const rows=await readXlsx(file),imported=[],dups=[],seen=new Set();rows.forEach((r,idx)=>{const no=normalizeIncidentNumber(r[0]),title=normalizeText(r[2]),cause=[normalizeText(r[2]),normalizeText(r[3])].filter(Boolean).join("\n"),contractor=canonicalCustomerContractor(parseContractorCell(r[7]));if(idx===0&&(/شماره|incident/i.test(String(r[0]))||/عنوان|موضوع/i.test(String(r[2]))))return;if(!no)return;if(customers.some(c=>normalizeIncidentNumber(c.no)===no)||customerHistory.some(x=>normalizeIncidentNumber(x.item?.no)===no)||seen.has(no)){dups.push(no);return}seen.add(no);imported.push({id:crypto.randomUUID(),createdAt:new Date().toISOString(),completedAt:"",no,title,cause,contractor,operator:"",status:"open"})});customers.push(...imported);save();renderAll();showImportToast(`${imported.length} مورد با موفقیت وارد شد.`,dups)}catch(e){console.error(e);alert("خواندن فایل Excel انجام نشد.")}}
function showImportToast(msg,dups){const old=$("importToast");if(old)old.remove();const box=document.createElement("div");box.id="importToast";box.className="import-toast";box.innerHTML=`<b>${esc(msg)}</b>${dups.length?`<div>${dups.length} شماره Incident تکراری وارد نشد.</div>`:""}`;document.body.appendChild(box);setTimeout(()=>box.remove(),5000)}

function applyTheme(mode){const light=mode==="light";document.body.classList.toggle("light",light);$("themeIcon").textContent=light?"☀️":"🌙";$("themeText").textContent=light?"روز":"شب";localStorage.setItem("incident-theme",light?"light":"dark")}
function toggleTheme(){applyTheme(document.body.classList.contains("light")?"dark":"light")}
function switchPage(p){document.querySelectorAll(".page").forEach(x=>x.classList.toggle("active",x.id===p));document.querySelectorAll("[data-page]").forEach(x=>x.classList.toggle("active",x.dataset.page===p));if(p==="history")renderHistory();if(p==="customer")renderCustomers();if(p==="tasks")renderTasks()}
function renderAll(){renderIncidents();renderCustomers();renderHistory();renderTasks();renderMsh()}

$("incidentProgress").oninput=()=>$("progressValue").value=$("incidentProgress").value+"%";
$("addIncident").onclick=openIncident;$("addCustomer").onclick=openCustomer;$("taskLauncher").onclick=()=>switchPage("tasks");$("addTaskPage").onclick=openTask;$("themeToggle").onclick=toggleTheme;$("clearCustomerRows").onclick=clearAllCustomerRows;
$("mshLauncher").onclick=openMsh;$("closeMsh").onclick=()=>$("mshDlg").close();$("mshAdd").onclick=()=>{$("mshForm").reset();$("mshFormDlg").showModal()};$("mshSearch").oninput=renderMsh;
document.querySelectorAll("[data-msh-contractor]").forEach(b=>b.onclick=()=>{mshFilter=b.dataset.mshContractor;document.querySelectorAll("[data-msh-contractor]").forEach(x=>x.classList.toggle("active",x===b));renderMsh()});
$("mshForm").onsubmit=e=>{e.preventDefault();const zone=$("mshZone").value.trim(),contractor=$("mshContractor").value;if(mshZones.some(x=>String(x.zone)===zone)){alert("این شماره زون قبلاً ثبت شده است.");return}mshZones.push({id:crypto.randomUUID(),zone,contractor,createdAt:new Date().toISOString()});save();$("mshFormDlg").close();renderMsh()};

document.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>$(b.dataset.close).close());document.querySelectorAll("[data-page]").forEach(b=>b.onclick=()=>switchPage(b.dataset.page));
$("historySearch").oninput=()=>{networkHistoryPage=1;customerHistoryPage=1;renderHistory()};
$("prevI").onclick=()=>{iDate=shiftISO(iDate,-1);renderIncidents()};$("nextI").onclick=()=>{iDate=shiftISO(iDate,1);renderIncidents()};$("todayI").onclick=()=>{iDate=today();renderIncidents()};

document.querySelectorAll(".filter").forEach(b=>b.onclick=()=>{const active=b.classList.contains("active");document.querySelectorAll(".filter").forEach(x=>x.classList.remove("active"));iFilter=active?"all":b.dataset.status;if(!active)b.classList.add("active");renderIncidents()});
document.querySelectorAll("[data-contractor-filter]").forEach(b=>b.onclick=()=>{iContractorFilter=b.dataset.contractorFilter;document.querySelectorAll("[data-contractor-filter]").forEach(x=>x.classList.toggle("active",x===b));renderIncidents()});

function pickXlsx(handler){const input=document.createElement("input");input.type="file";input.accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";input.style.display="none";input.onchange=e=>handler(e.target.files?.[0]);document.body.appendChild(input);input.click();setTimeout(()=>input.remove(),1000)}
$("xlsxImportBtn").onclick=()=>pickXlsx(importIncidents);$("customerXlsxBtn").onclick=()=>pickXlsx(importCustomers);
document.querySelectorAll(".customer-filter").forEach(b=>b.onclick=()=>{customerStatusFilter=b.dataset.customerStatus;document.querySelectorAll(".customer-filter").forEach(x=>x.classList.toggle("active",x===b));renderCustomers()});
$("customerSort").onchange=e=>{customerSortMode=e.target.value;renderCustomers()};
document.querySelectorAll("[data-customer-contractor]").forEach(b=>b.onclick=()=>{customerContractorFilter=b.dataset.customerContractor;renderCustomers()});
applyTheme(localStorage.getItem("incident-theme")||"dark");renderAll();setInterval(()=>{renderIncidents();},1000);
