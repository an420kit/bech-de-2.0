import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';
const cfg=window.BECHDE_CONFIG,ready=window.BECHDE_BACKEND_ENABLED,db=ready?createClient(cfg.supabaseUrl,cfg.supabaseAnonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storage:window.localStorage}}):null;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function banner(text){let e=document.getElementById('adminNotice');if(!e){e=document.createElement('div');e.id='adminNotice';e.className='panel';document.querySelector('main')?.prepend(e)}e.textContent=text}
async function init(){
 if(!ready){banner('Backend not configured. Configure assets/config.js and apply the SQL migrations.');return}
 const {data:{user}}=await db.auth.getUser();if(!user){location.href='auth.html';return}
 const {data:isAdmin,error:roleError}=await db.rpc('is_bechde_admin');
 if(roleError||!isAdmin){document.querySelector('main').innerHTML='<section class="panel"><h1>Admin access required</h1><p class="muted">This account is not in the server-side admin allow-list.</p><a class="btn secondary" href="account.html">Back to account</a></section>';return}
 const list=document.querySelector('.simple-list');if(!list)return;
 const {data:reports,error}=await db.from('listing_reports').select('id,listing_id,reporter_id,reason,details,status,created_at').in('status',['open','reviewing']).order('created_at',{ascending:true}).limit(100);
 if(error){list.innerHTML='<p class="muted">'+esc(error.message)+'</p>';return}
 if(!reports?.length){list.innerHTML='<p class="muted">No open reports. New reports will appear here.</p>';return}
 list.innerHTML=reports.map(r=>'<div class="simple-row" data-report="'+esc(r.id)+'"><div><b>'+esc(r.reason)+'</b><p class="muted">'+esc(r.details||'No extra details')+' · '+new Date(r.created_at).toLocaleString()+'</p><span class="mini">Listing: '+esc(r.listing_id||'Removed listing')+'</span>'+(r.listing_id?'<br><a href="product.html?id='+encodeURIComponent(r.listing_id)+'">Open listing</a>':'')+'</div><button class="btn secondary" data-resolve="'+esc(r.id)+'">Resolve report</button></div>').join('');
 list.querySelectorAll('[data-resolve]').forEach(btn=>btn.addEventListener('click',async()=>{btn.disabled=true;const {error}=await db.from('listing_reports').update({status:'resolved',reviewed_by:user.id,reviewed_at:new Date().toISOString()}).eq('id',btn.dataset.resolve);if(error){btn.disabled=false;banner(error.message);return}btn.closest('.simple-row').remove();banner('Report marked resolved.');}));
}
init();
