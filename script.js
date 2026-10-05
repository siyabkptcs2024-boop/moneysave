const DB="moneysave_db", STORE="transactions";let db, type="expense";
const $=id=>document.getElementById(id);
$("date").value=new Date().toISOString().slice(0,10);

function openDB(){return new Promise((res,rej)=>{let r=indexedDB.open(DB,1);r.onupgradeneeded=()=>{let d=r.result;if(!d.objectStoreNames.contains(STORE)){let s=d.createObjectStore(STORE,{keyPath:"id",autoIncrement:true});s.createIndex("date","date")}};r.onsuccess=()=>{db=r.result;res()};r.onerror=()=>rej(r.error)})}
function all(){return new Promise((res,rej)=>{let q=db.transaction(STORE,"readonly").objectStore(STORE).getAll();q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)})}
function add(x){return new Promise((res,rej)=>{let q=db.transaction(STORE,"readwrite").objectStore(STORE).add(x);q.onsuccess=res;q.onerror=()=>rej(q.error)})}
function remove(id){return new Promise((res,rej)=>{let q=db.transaction(STORE,"readwrite").objectStore(STORE).delete(id);q.onsuccess=res;q.onerror=()=>rej(q.error)})}
function clear(){return new Promise((res,rej)=>{let q=db.transaction(STORE,"readwrite").objectStore(STORE).clear();q.onsuccess=res;q.onerror=()=>rej(q.error)})}
const money=n=>"₹"+Number(n).toLocaleString("en-IN",{maximumFractionDigits:2});
function toast(t){let x=document.createElement("div");x.className="toast";x.textContent=t;document.body.appendChild(x);setTimeout(()=>x.remove(),1800)}
async function render(){
 let d=await all();d.sort((a,b)=>b.date.localeCompare(a.date)||b.id-a.id);
 let inc=d.filter(x=>x.type==="income").reduce((s,x)=>s+x.amount,0),exp=d.filter(x=>x.type==="expense").reduce((s,x)=>s+x.amount,0);
 $("balance").textContent=money(inc-exp);$("incomeTotal").textContent=money(inc);$("expenseTotal").textContent=money(exp);
 let now=new Date(),month=now.toISOString().slice(0,7),weekStart=new Date(now);weekStart.setDate(now.getDate()-6);
 let mi=d.filter(x=>x.date.slice(0,7)===month), mw=d.filter(x=>new Date(x.date+"T23:59:59")>=weekStart);
 let mExp=mi.filter(x=>x.type==="expense").reduce((s,x)=>s+x.amount,0),wExp=mw.filter(x=>x.type==="expense").reduce((s,x)=>s+x.amount,0);
 $("month").textContent=money(mExp);$("week").textContent=money(wExp);$("monthLabel").textContent=now.toLocaleString("en-IN",{month:"long",year:"numeric"});
 $("list").innerHTML=d.length?d.map(x=>`<div class="item"><div class="dot">${x.type==="income"?"💵":"🧾"}</div><div class="info"><b>${escapeHtml(x.note||x.category)}</b><small>${x.date} · ${escapeHtml(x.category)}</small></div><div class="money" style="color:${x.type==="income"?"#63e6be":"#ff7b91"}">${x.type==="income"?"+":"-"}${money(x.amount)}</div><button class="del" onclick="delTx(${x.id})">×</button></div>`).join(""):'<div class="empty">No transactions yet.</div>';
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
async function delTx(id){if(confirm("Delete this transaction?")){await remove(id);render();toast("Deleted")}}
document.querySelectorAll(".type").forEach(b=>b.onclick=()=>{document.querySelectorAll(".type").forEach(x=>x.classList.remove("active"));b.classList.add("active");type=b.dataset.type});
$("addBtn").onclick=async()=>{let amount=parseFloat($("amount").value),date=$("date").value;if(!amount||amount<=0)return toast("Enter a valid amount");if(!date)return toast("Select date");await add({amount,date,type,category:$("category").value,note:$("note").value.trim()});$("amount").value="";$("note").value="";render();toast("Saved on this iPhone ✓")};
$("clearBtn").onclick=async()=>{if(confirm("Delete all transactions?")){await clear();render();toast("All data cleared")}};
$("themeBtn").onclick=()=>{document.body.classList.toggle("light");$("themeBtn").textContent=document.body.classList.contains("light")?"🌙":"☀️"};
openDB().then(render);