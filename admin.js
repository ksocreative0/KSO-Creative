const ready=window.SUPABASE_CONFIG?.url && window.SUPABASE_CONFIG?.anonKey &&
  !window.SUPABASE_CONFIG.url.includes("YOUR_") && !window.SUPABASE_CONFIG.anonKey.includes("YOUR_");
const db=ready?window.supabase.createClient(window.SUPABASE_CONFIG.url,window.SUPABASE_CONFIG.anonKey):null;
const $=id=>document.getElementById(id);
let status="all";

function escapeHtml(v=""){return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}

async function requireAuth(){
  if(!db){location.href="admin-login.html";return false;}
  const {data,error}=await db.auth.getUser();
  console.log("Logged in user:", data.user?.email)
  if(error||!data.user){location.href="admin-login.html";return false;}
  $("adminEmail").textContent=data.user.email||"";
  return true;
}
async function projects(){
  const {data,error}=await db.from("projects").select("*").order("created_at",{ascending:false});
  if(error)throw error; return data||[];
}
async function draw(){
 try{
  const all=await projects();
  $("total").textContent=all.length;
  $("published").textContent=all.filter(x=>x.status==="published").length;
  $("archived").textContent=all.filter(x=>x.status==="archived").length;
  const shown=all.filter(x=>status==="all"||x.status===status);
  $("list").innerHTML=shown.map(p=>`<div class="item"><div class="item-media">${p.media_url?(p.media_type==="video"?`<video src="${escapeHtml(p.media_url)}" muted playsinline></video>`:`<img src="${escapeHtml(p.media_url)}" alt="">`):`<div class="media-empty">No media</div>`}</div><div><span class="badge">${escapeHtml(p.category==="web"?"Website Development":"Video Editing & Videography")}</span><h3>${escapeHtml(p.title||"Untitled project")}</h3><p>${escapeHtml(p.description||"No description added.")}</p></div><div class="actions"><button onclick="editProject('${p.id}')">Edit</button>${p.status==="archived"?`<button onclick="restoreProject('${p.id}')">Restore</button>`:`<button class="archive" onclick="archiveProject('${p.id}')">Archive</button>`}</div></div>`).join("")||"<p class='empty-admin'>Nothing here yet.</p>";
 }catch(err){console.error(err);alert("Could not load projects. Check the Supabase table and policies.");}
}
async function openForm(p={}){
 $("modal").classList.add("show"); $("formTitle").textContent=p.id?"Edit project":"Add project";
 ["id","title","category","description","url","role","challenge","solution","results","tools"].forEach(k=>$(k).value=p[k]||"");
 $("currentMedia").innerHTML=p.media_url?`<a href="${escapeHtml(p.media_url)}" target="_blank" rel="noopener">Current media</a>`:"No media uploaded";
 $("currentMedia").dataset.url=p.media_url||"";$("currentMedia").dataset.type=p.media_type||"";$("currentMedia").dataset.path=p.media_path||"";$("media").value="";
}
async function editProject(id){const all=await projects();openForm(all.find(x=>String(x.id)===String(id))||{})}
async function setStatus(id,value){const {error}=await db.from("projects").update({status:value,updated_at:new Date().toISOString()}).eq("id",id);if(error)throw error;draw();}
async function archiveProject(id){try{await setStatus(id,"archived")}catch(e){alert(e.message)}}
async function restoreProject(id){try{await setStatus(id,"published")}catch(e){alert(e.message)}}
async function uploadMedia(file){
 const safe=file.name.toLowerCase().replace(/[^a-z0-9._-]/g,"-");
 const path=`projects/${crypto.randomUUID()}-${safe}`;
 const {error}=await db.storage.from("project-media").upload(path,file,{upsert:false,contentType:file.type});
 if(error)throw error;
 const {data}=db.storage.from("project-media").getPublicUrl(path);
 return {url:data.publicUrl,type:file.type.startsWith("video/")?"video":"image",path};
}
$("newBtn").onclick=()=>openForm();
$("close").onclick=$("cancel").onclick=()=>$("modal").classList.remove("show");
$("logoutBtn").onclick=async()=>{await db.auth.signOut();location.href="admin-login.html";};
$("form").onsubmit=async e=>{
 e.preventDefault();
 try{
  const existingId=$("id").value,file=$("media").files[0];
  let mediaUrl=$("currentMedia").dataset.url||"",mediaType=$("currentMedia").dataset.type||"",mediaPath=$("currentMedia").dataset.path||"";
  if(file){const uploaded=await uploadMedia(file);mediaUrl=uploaded.url;mediaType=uploaded.type;mediaPath=uploaded.path;}
  const payload={title:$("title").value.trim()||null,category:$("category").value||null,description:$("description").value.trim()||null,media_url:mediaUrl||null,media_type:mediaType||null,media_path:mediaPath||null,url:$("url").value.trim()||null,role:$("role").value.trim()||null,challenge:$("challenge").value.trim()||null,solution:$("solution").value.trim()||null,results:$("results").value.trim()||null,tools:$("tools").value.trim()||null,status:"published",updated_at:new Date().toISOString()};
  const result=existingId?await db.from("projects").update(payload).eq("id",existingId):await db.from("projects").insert(payload);
  if(result.error)throw result.error;
  $("modal").classList.remove("show");draw();
 }catch(err){console.error(err);alert(err.message||"Could not save project.");}
};
document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));b.classList.add("active");status=b.dataset.status;draw();});
(async()=>{if(await requireAuth())draw();})();