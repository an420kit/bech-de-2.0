import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';
const cfg=window.BECHDE_CONFIG,ready=window.BECHDE_BACKEND_ENABLED,db=ready?createClient(cfg.supabaseUrl,cfg.supabaseAnonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storage:window.localStorage}}):null;
const OWNER_EMAIL='ankitmishra489@gmail.com';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=paise=>'₹'+(Number(paise||0)/100).toLocaleString('en-IN',{maximumFractionDigits:2});
const $=id=>document.getElementById(id);
function banner(text){const e=$('adminNotice');if(e)e.textContent=text}
function supportLink(){return '<div class="contact-actions"><a class="primary" href="https://wa.me/917296451307" target="_blank" rel="noopener">WhatsApp</a><a href="tel:+917296451307">Call owner</a><a href="mailto:ankitmishra489@gmail.com">Email</a></div>'}
async function loadListings(){
 const {data:rows,error}=await db.rpc('admin_list_listings');
 if(error){banner('Admin data unavailable: '+error.message+' — run supabase/004_loop_admin_controls.sql in Supabase SQL Editor.');return}
 $('listingCount').textContent=rows.length;
 $('activeCount').textContent=rows.filter(r=>r.status==='active').length;
 const container=$('adminListings');
 if(!rows.length){container.innerHTML='<p class="muted">No listings exist yet. Once sellers publish their first item, it will appear here.</p>';return}
 container.innerHTML=rows.map(r=>{
  const actions=[];
  if(r.status!=='removed')actions.push('<button class="smallbtn danger" data-remove="'+esc(r.id)+'">Remove listing</button>');
  if(r.status!=='paused'&&r.status!=='removed')actions.push('<button class="smallbtn" data-status="paused" data-id="'+esc(r.id)+'">Pause</button>');
  if(r.status!=='active')actions.push('<button class="smallbtn" data-status="active" data-id="'+esc(r.id)+'">Restore / activate</button>');
  if(r.status==='active')actions.push('<button class="smallbtn" data-status="sold" data-id="'+esc(r.id)+'">Mark sold</button>');
  return '<article class="listing-row"><img src="'+esc(r.photo_urls?.[0]||'')+'" alt=""><div><div class="listing-title">'+esc(r.title)+'</div><div class="listing-meta">'+esc(r.category)+' · '+esc(r.city)+' · '+money(r.price_paise)+' · '+new Date(r.created_at).toLocaleDateString('en-IN')+'</div><span class="statuspill">'+esc(r.status)+'</span>'+(r.status==='active'?' · <a href="product.html?id='+encodeURIComponent(r.id)+'">View listing</a>':'')+'</div><div class="listing-actions">'+actions.join('')+'</div></article>';
 }).join('');
 container.querySelectorAll('[data-remove]').forEach(btn=>btn.addEventListener('click',async()=>{
  const row=rows.find(x=>x.id===btn.dataset.remove);
  if(!confirm('Remove "'+(row?.title||'this listing')+'" from the public marketplace?'))return;
  btn.disabled=true;const {data,error}=await db.rpc('admin_remove_listing',{p_listing_id:btn.dataset.remove});
  if(error||!data){btn.disabled=false;banner('Could not remove listing: '+(error?.message||'not changed'));return}
  banner('Listing removed from the public marketplace.');await loadListings();
 }));
 container.querySelectorAll('[data-status]').forEach(btn=>btn.addEventListener('click',async()=>{
  btn.disabled=true;const {error}=await db.rpc('admin_set_listing_status',{p_listing_id:btn.dataset.id,p_status:btn.dataset.status});
  if(error){btn.disabled=false;banner('Could not update listing: '+error.message);return}
  banner('Listing status updated.');await loadListings();
 }));
}
async function loadReports(){
 const box=$('adminReports');
 const {data:reports,error}=await db.from('listing_reports').select('id,listing_id,reason,details,status,created_at').in('status',['open','reviewing']).order('created_at',{ascending:true}).limit(100);
 if(error){box.innerHTML='<p class="muted">Reports unavailable: '+esc(error.message)+'</p>';return}
 $('reportedCount').textContent=reports.length;
 if(!reports.length){box.innerHTML='<p class="muted">No open safety reports.</p>';return}
 box.innerHTML=reports.map(r=>'<div class="simple-row" data-report="'+esc(r.id)+'"><div><b>'+esc(r.reason)+'</b><p class="muted">'+esc(r.details||'No additional details')+' · '+new Date(r.created_at).toLocaleString()+'</p><span class="mini">Listing: '+esc(r.listing_id||'Removed listing')+'</span>'+(r.listing_id?'<br><a href="product.html?id='+encodeURIComponent(r.listing_id)+'">Open listing</a>':'')+'</div><button class="smallbtn" data-resolve="'+esc(r.id)+'">Resolve</button></div>').join('');
 box.querySelectorAll('[data-resolve]').forEach(btn=>btn.addEventListener('click',async()=>{
  btn.disabled=true;const {error}=await db.from('listing_reports').update({status:'resolved',reviewed_at:new Date().toISOString()}).eq('id',btn.dataset.resolve);
  if(error){btn.disabled=false;banner('Could not resolve report: '+error.message);return}
  banner('Report marked resolved.');await loadReports();
 }));
}
async function refresh(){banner('Refreshing live owner data…');await Promise.all([loadListings(),loadReports()]);}
async function init(){
 if(!ready){banner('Backend not configured. Set up Supabase in assets/config.js.');return}
 const {data:{user}}=await db.auth.getUser();
 if(!user){location.href='auth.html?next=admin.html';return}
 if((user.email||'').toLowerCase()!==OWNER_EMAIL){document.querySelector('main').innerHTML='<section class="panel"><h1>Owner access only</h1><p class="muted">Sign in with '+OWNER_EMAIL+'. The current account is not the owner account.</p><a class="btn primary" href="auth.html?next=admin.html">Sign in again</a> '+supportLink()+'</section>';return}
 const {data:isAdmin,error}=await db.rpc('is_bechde_admin');
 if(error||!isAdmin){banner('Owner email recognized, but server-side permissions are not installed yet. Run supabase/004_loop_admin_controls.sql in Supabase SQL Editor.');return}
 $('refreshAdmin').addEventListener('click',refresh);
 await refresh();
}
init();
