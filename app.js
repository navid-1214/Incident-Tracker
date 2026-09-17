const KEY="incident-tracker-v2";let data=JSON.parse(localStorage.getItem(KEY)||"[]");let selected=today();let filter="all";
const $=x=>document.getElementById(x);
function today(){let d=new Date();d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,10)}
function fa(s){if(!s)return"-";return new Intl.DateTimeFormat("fa-IR-u-ca-persian",{year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(s+"T00:00:00"))}
function save(){localStorage.setItem(KEY,JSON.stringify(data))}
function safe(x){return String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function status(s){return s==="open"?"باز":s==="progress"?"در حال پیگیری":"اتمام کار"}
function dot(s){return s==="open"?"green":s==="progress"?"orange":"blue"}
function age(i){if(i.status==="closed")return"";let h=(Date.now()-new Date(i.createdAt))/36e5;return h>=48?"age-red":h>=24?"age-orange":""}
function timer(i){let n=Math.max(0,Math.floor((Date.now()-new Date(i.createdAt))/1000));let h=Math.floor(n/3600),m=Math.floor(n%3600/60),s=n%60;return [h,m,s].map((x,i)=>String(x).padStart(2,"0")).join(":")}
function render(){ $("date").textContent=fa(selected);let q=$("search").value.toLowerCase().trim();
let list=data.filter(i=>i.reg===selected).filter(i=>filter==="all"||i.status===filter).filter(i=>!q||[i.no,i.subject,i.contractor,i.description].join(" ").toLowerCase().includes(q));
$("rows").innerHTML=list.map(i=>`<tr class="${age(i)}"><td><b>${safe(i.no)}</b></td><td>${safe(i.subject)}</td><td>${fa(i.reg)}</td><td>${safe(i.contractor||"-")}</td><td>${fa(i.f1)}</td><td>${fa(i.f2)}</td><td class="status"><i class="${dot(i.status)}"></i>${status(i.status)}</td><td class="progress">${i.progress}%<div class="bar"><span style="width:${i.progress}%"></span></div></td><td class="timer">${timer(i)}</td><td>${safe(i.description||"-")}</td><td><div class="rowactions"><button onclick="edit('${i.id}')">ویرایش</button><button onclick="removeI('${i.id}')">حذف</button></div></td></tr>`).join("");
$("empty").style.display=list.length?"none":"block"}
function openNew(){$("form").reset();$("id").value="";$("title").textContent="ثبت Incident";$("reg").value=selected;$("status").value="open";$("progress").value=0;$("dlg").showModal()}
function edit(id){let i=data.find(x=>x.id===id);if(!i)return;$("id").value=id;$("title").textContent="ویرایش Incident";$("no").value=i.no;$("subject").value=i.subject;$("reg").value=i.reg;$("contractor").value=i.contractor||"";$("f1").value=i.f1||"";$("f2").value=i.f2||"";$("status").value=i.status;$("progress").value=i.progress;$("description").value=i.description||"";$("dlg").showModal()}
function removeI(id){if(confirm("این Incident حذف شود؟")){data=data.filter(x=>x.id!==id);save();render()}}
$("form").onsubmit=e=>{e.preventDefault();let id=$("id").value;let v={no:$("no").value.trim(),subject:$("subject").value.trim(),reg:$("reg").value,contractor:$("contractor").value.trim(),f1:$("f1").value,f2:$("f2").value,status:$("status").value,progress:Math.max(0,Math.min(100,Number($("progress").value)||0)),description:$("description").value.trim()};if(id)Object.assign(data.find(x=>x.id===id),v);else data.push({id:crypto.randomUUID(),createdAt:new Date().toISOString(),...v});save();$("dlg").close();render()};
$("add").onclick=openNew;$("close").onclick=$("cancel").onclick=()=>$("dlg").close();$("search").oninput=render;
$("prev").onclick=()=>{let d=new Date(selected+"T00:00:00");d.setDate(d.getDate()-1);selected=d.toISOString().slice(0,10);render()};
$("next").onclick=()=>{let d=new Date(selected+"T00:00:00");d.setDate(d.getDate()+1);selected=d.toISOString().slice(0,10);render()};$("today").onclick=()=>{selected=today();render()};
document.querySelectorAll(".filter").forEach(b=>b.onclick=()=>{document.querySelectorAll(".filter").forEach(x=>x.classList.remove("active"));b.classList.add("active");filter=b.dataset.status;render()});
document.querySelectorAll("[data-page]").forEach(b=>b.onclick=()=>{let p=b.dataset.page;document.querySelectorAll(".page").forEach(x=>x.classList.toggle("active",x.id===p));document.querySelectorAll("[data-page]").forEach(x=>x.classList.toggle("active",x.dataset.page===p))});
setInterval(render,1000);render();