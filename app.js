const SUPABASE_READY = window.SUPABASE_CONFIG?.url && window.SUPABASE_CONFIG?.anonKey &&
  !window.SUPABASE_CONFIG.url.includes("YOUR_") && !window.SUPABASE_CONFIG.anonKey.includes("YOUR_");
const publicDb = SUPABASE_READY ? window.supabase.createClient(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.anonKey) : null;

function escapeHtml(value=""){
  return String(value).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}

async function renderProjects(filter="all"){
  const grid=document.getElementById("projectGrid");
  if(!grid)return;
  if(!publicDb){
    grid.innerHTML=`<div class="empty-projects"><strong>Projects will appear here.</strong><span>Supabase will power this section once the project database is connected.</span></div>`;
    return;
  }
  const {data,error}=await publicDb.from("projects").select("*").eq("status","published").order("created_at",{ascending:false});
  if(error){
    console.error(error);
    grid.innerHTML=`<div class="empty-projects"><strong>Projects are temporarily unavailable.</strong><span>Please check the Supabase connection.</span></div>`;
    return;
  }
  const projects=(data||[]).filter(p=>filter==="all"||p.category===filter);
  grid.innerHTML=projects.length ? projects.map(p=>{
    const title=escapeHtml(p.title||"Untitled project");
    const label=escapeHtml(p.category==="web"?"Website Development":"Video Editing & Videography");
    const description=escapeHtml(p.description||"");
    let media="";
    if(p.media_url){
      media=p.media_type==="video"
        ? `<video src="${escapeHtml(p.media_url)}" controls playsinline preload="metadata" aria-label="${title}"></video>`
        : `<img src="${escapeHtml(p.media_url)}" alt="${title}" loading="lazy">`;
    }else{
      media=`<div class="media-empty"><span>No project media added</span></div>`;
    }
    const link=p.url ? `<a class="project-link" href="${escapeHtml(p.url)}" target="_blank" rel="noopener">View attached website</a>` : "";
    return `<article class="project-card"><div class="project-media">${media}</div><div class="project-info"><div class="project-meta">${label}</div><h3>${title}</h3><p>${description}</p>${p.tools?`<small class="project-tools">${escapeHtml(p.tools)}</small>`:""}</div>${link}</article>`;
  }).join("") : `<div class="empty-projects"><strong>No projects added yet.</strong><span>New work uploaded from the dashboard will appear here.</span></div>`;
}

document.addEventListener("DOMContentLoaded",()=>{
  renderProjects();
  document.querySelectorAll(".filter").forEach(btn=>btn.addEventListener("click",()=>{
    document.querySelectorAll(".filter").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    renderProjects(btn.dataset.filter);
  }));
  const toggle=document.getElementById("themeToggle");
  const savedTheme=localStorage.getItem("ksoCreativeTheme");
  if(savedTheme==="dark")document.body.classList.add("dark");
  function syncToggle(){toggle.querySelector(".toggle-thumb").textContent=document.body.classList.contains("dark")?"☀":"☾";}
  syncToggle();
  toggle.addEventListener("click",()=>{
    document.body.classList.toggle("dark");
    localStorage.setItem("ksoCreativeTheme",document.body.classList.contains("dark")?"dark":"light");
    syncToggle();
  });
  const menu=document.getElementById("menuBtn"), nav=document.getElementById("nav");
  menu.addEventListener("click",()=>nav.classList.toggle("open"));
  nav.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>nav.classList.remove("open")));
});