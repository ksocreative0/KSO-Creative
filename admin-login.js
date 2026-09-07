const form=document.getElementById("loginForm"), error=document.getElementById("loginError");
const ready=window.SUPABASE_CONFIG?.url && window.SUPABASE_CONFIG?.anonKey &&
  !window.SUPABASE_CONFIG.url.includes("YOUR_") && !window.SUPABASE_CONFIG.anonKey.includes("YOUR_");
const db=ready?window.supabase.createClient(window.SUPABASE_CONFIG.url,window.SUPABASE_CONFIG.anonKey):null;
async function checkSession(){
  if(!db)return;
  const {data}=await db.auth.getSession();
  if(data.session)location.href="admin.html";
}
checkSession();
form.addEventListener("submit",async e=>{
 e.preventDefault(); error.textContent="";
 if(!db){error.textContent="Connect Supabase in supabase-config.js first.";return;}
 const email=document.getElementById("email").value.trim();
 const password=document.getElementById("password").value;
 const {error:authError}=await db.auth.signInWithPassword({email,password});
 if(authError){error.textContent=authError.message;return;}
 location.href="admin.html";
});