import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';
const cfg=window.BECHDE_CONFIG,ready=window.BECHDE_BACKEND_ENABLED,db=ready?createClient(cfg.supabaseUrl,cfg.supabaseAnonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storage:window.localStorage}}):null;
const OWNER_EMAIL='ankitmisra489@gmail.com';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=paise=>'₹'+(Number(paise||0)/100).toLocaleString('en-IN',{maximumFractionDigits:2});
const $=id=>document.getElementById(id);
function banner(text){const e=$('adminNotice');if(e)e.textContent=text}
function supportLink(){return '<div class="contact-actions"><a class="primary" href="https://wa.me/917296451307" target="_blank" rel="noopener">WhatsApp</a><a href="tel:+917296451307">Call owner</a><a href="mailto:ankitmisra489@gmail.com">Email</a></div>'}
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
async function refresh(){banner('Refreshing live owner data…');await Promise.all([loadListings(),loadReports(),loadBannerList()]);}

let editingBannerId=null,existingBannerUrl='',existingBannerType='image',bannerPreviewUrl='';
const bannerPlacementNames={home_top:'Homepage top',home_middle:'Homepage after listings',category_banner:'Category banner'};
function bannerStatus(message,error=false){const e=$('bannerStatus');if(!e)return;e.textContent=message;e.classList.toggle('error',error)}
function safeMediaUrl(file){return URL.createObjectURL(file)}
function localDateValue(value){if(!value)return '';const d=new Date(value);return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16)}
function updateBannerPlacement(){const p=$('bannerPlacement').value;$('bannerCategoryWrap').hidden=p!=='category_banner';$('bannerPreviewFrame').dataset.placement=p;$('previewPlacementNote').textContent=p==='home_top'?'Homepage top: appears between the category bar and the hero section.':p==='home_middle'?'Homepage middle: appears after the fresh listings and before reviews.':'Category banner: appears above listings after a visitor chooses the selected category.'}
function updateBannerType(){const video=$('bannerType').value==='video';$('bannerFile').accept=video?'video/mp4,video/webm':'image/jpeg,image/png,image/webp';$('bannerMediaHelp').textContent=video?'Upload an MP4/WebM campaign clip no longer than 5 seconds, up to 25 MB. Video will autoplay muted and loop.':'Use a clear, real campaign photo. JPG, PNG or WebP, up to 8 MB. Recommended landscape ratio: 16:7.'}
function clearBannerForm(){
 editingBannerId=null;existingBannerUrl='';existingBannerType='image';if(bannerPreviewUrl){URL.revokeObjectURL(bannerPreviewUrl);bannerPreviewUrl=''}
 $('bannerForm').reset();$('bannerOrder').value='10';$('bannerButton').value='Explore';$('bannerActive').checked=true;$('bannerFile').value='';$('saveBanner').textContent='Save banner';$('bannerFile').required=false;updateBannerType();updateBannerPlacement();updateBannerPreview();bannerStatus('Ready to create a new banner.');
}
function updateBannerPreview(){
 const frame=$('bannerPreviewFrame'),p=$('bannerPlacement').value;
 frame.dataset.placement=p;
 $('previewBannerTitle').textContent=$('bannerTitle').value.trim()||'Your campaign headline';
 $('previewBannerDesc').textContent=$('bannerAlt').value.trim()||'Short campaign message goes here.';
 $('previewBannerButton').textContent=($('bannerButton').value.trim()||'Explore')+' ↗';
 $('previewCategoryTitle').textContent=({phones:'Phones & mobiles',home:'Home & office',laptops:'Laptops & computers',electronics:'Electronics',fashion:'Fashion',toys:'Toys & hobbies',other:'Explore category'})[$('bannerCategory').value]||'Browse the category';
 const media=$('previewBannerMedia');media.replaceChildren();
 const chosen=$('bannerFile').files?.[0];
 const url=chosen?(bannerPreviewUrl||safeMediaUrl(chosen)):existingBannerUrl;
 if(chosen&&!bannerPreviewUrl)bannerPreviewUrl=url;
 if(url){
  if($('bannerType').value==='video'){
   const v=document.createElement('video');v.src=url;v.muted=true;v.autoplay=true;v.loop=true;v.playsInline=true;v.preload='metadata';media.appendChild(v);
  }else{const img=document.createElement('img');img.src=url;img.alt=$('bannerAlt').value||'Banner preview';media.appendChild(img)}
 }else{media.textContent=$('bannerType').value==='video'?'Your 5-second video preview':'Upload an image to preview it here'}
}
function checkVideoFile(file){
 return new Promise((resolve,reject)=>{
  const url=URL.createObjectURL(file),video=document.createElement('video');
  video.preload='metadata';
  video.onloadedmetadata=()=>{const duration=video.duration;URL.revokeObjectURL(url);if(Number.isFinite(duration)&&duration>0&&duration<=5.05)resolve(duration);else reject(new Error('Video must be 5 seconds or shorter. This clip is '+(Number.isFinite(duration)?duration.toFixed(1)+' seconds':'not a valid video')+'.'))};
  video.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Could not read this video file. Use a valid MP4 or WebM clip.'))};
  video.src=url;
 });
}
function safeBannerTarget(raw){
 const value=(raw||'').trim();if(!value)return '';
 if(/^https:\/\//i.test(value))return value;
 if(/^(?:\/?[a-z0-9_-]+\.html)(?:[?#][^\s]*)?$/i.test(value))return value.replace(/^\//,'');
 throw new Error('Button destination must be an https:// URL or a page such as seller.html.');
}
async function loadBannerList(){
 const box=$('bannerList');if(!box)return;
 const {data:rows,error}=await db.from('ad_banners').select('*').order('display_order',{ascending:true}).order('created_at',{ascending:false}).limit(100);
 if(error){box.innerHTML='<p class="muted">Banner tools unavailable: '+esc(error.message)+'. Run supabase/005_loop_banner_studio.sql in Supabase SQL Editor.</p>';bannerStatus('Banner database is not ready. Run migration 005, then refresh.',true);return}
 if(!rows?.length){box.innerHTML='<p class="muted">No saved banners yet. Create one above; it stays in preview until published.</p>';return}
 box.innerHTML=rows.map(b=>'<article class="banner-list-row" data-banner-row="'+esc(b.id)+'">'+(b.media_type==='video'?'<video muted playsinline preload="metadata" src="'+esc(b.media_url)+'"></video>':'<img src="'+esc(b.media_url)+'" alt="'+esc(b.media_alt||b.title)+'">')+'<div><strong>'+esc(b.title)+'</strong><small>'+esc(bannerPlacementNames[b.placement]||b.placement)+(b.placement==='category_banner'?' · '+esc(b.category):'')+' · '+esc(b.media_type.toUpperCase())+' · priority '+esc(b.display_order)+'</small><small>Status: '+(b.active?'PUBLISHED':'PAUSED')+(b.ends_at?' · ends '+new Date(b.ends_at).toLocaleString():'')+'</small></div><div class="banner-list-actions"><button data-banner-edit="'+esc(b.id)+'">Edit</button><button data-banner-toggle="'+esc(b.id)+'">'+(b.active?'Pause':'Publish')+'</button><button class="delete" data-banner-delete="'+esc(b.id)+'">Delete</button></div></article>').join('');
 box.querySelectorAll('[data-banner-edit]').forEach(btn=>btn.addEventListener('click',()=>editBanner(rows.find(x=>x.id===btn.dataset.bannerEdit))));
 box.querySelectorAll('[data-banner-toggle]').forEach(btn=>btn.addEventListener('click',async()=>{
  const row=rows.find(x=>x.id===btn.dataset.bannerToggle);if(!row)return;btn.disabled=true;
  const {error}=await db.from('ad_banners').update({active:!row.active,updated_at:new Date().toISOString()}).eq('id',row.id);
  if(error){btn.disabled=false;bannerStatus('Could not update banner: '+error.message,true);return}
  bannerStatus('Banner '+(!row.active?'published':'paused')+'.');await loadBannerList();
 }));
 box.querySelectorAll('[data-banner-delete]').forEach(btn=>btn.addEventListener('click',async()=>{
  const row=rows.find(x=>x.id===btn.dataset.bannerDelete);if(!row||!confirm('Delete banner "'+row.title+'"?'))return;btn.disabled=true;
  const {error}=await db.from('ad_banners').delete().eq('id',row.id);
  if(error){btn.disabled=false;bannerStatus('Could not delete banner: '+error.message,true);return}
  bannerStatus('Banner deleted.');await loadBannerList();
 }));
}
function editBanner(b){
 if(!b)return;editingBannerId=b.id;existingBannerUrl=b.media_url;existingBannerType=b.media_type;
 $('bannerTitle').value=b.title||'';$('bannerPlacement').value=b.placement;$('bannerCategory').value=b.category||'phones';$('bannerType').value=b.media_type;$('bannerOrder').value=b.display_order||0;$('bannerAlt').value=b.media_alt||'';$('bannerButton').value=b.button_text||'Explore';$('bannerTarget').value=b.target_url||'';$('bannerActive').checked=!!b.active;$('bannerStart').value=localDateValue(b.starts_at);$('bannerEnd').value=localDateValue(b.ends_at);$('bannerFile').value='';$('bannerFile').required=false;$('saveBanner').textContent='Update banner';updateBannerType();updateBannerPlacement();updateBannerPreview();bannerStatus('Editing saved banner. Leave media empty to keep the current asset.');
 $('bannerStudio').scrollIntoView({behavior:'smooth',block:'start'});
}
async function saveBanner(event){
 event.preventDefault();
 try{
  if(!db)throw new Error('Supabase is not connected.');
  const userResult=await db.auth.getUser(),user=userResult.data?.user;if(!user)throw new Error('Please sign in with the owner account.');
  if((user.email||'').toLowerCase()!==OWNER_EMAIL)throw new Error('Only '+OWNER_EMAIL+' can manage banners.');
  const file=$('bannerFile').files?.[0],type=$('bannerType').value;
  let mediaUrl=existingBannerUrl;
  if(!editingBannerId&&!file)throw new Error('Upload the banner image or video before saving.');
  if(file){
   if(type==='image'){
    if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('Use a JPG, PNG or WebP image.');
    if(file.size>8*1024*1024)throw new Error('Image must be 8 MB or smaller.');
   }else{
    if(!['video/mp4','video/webm'].includes(file.type))throw new Error('Use an MP4 or WebM video.');
    if(file.size>25*1024*1024)throw new Error('Video must be 25 MB or smaller.');
    await checkVideoFile(file);
   }
   const safe=file.name.toLowerCase().replace(/[^a-z0-9._-]/g,'-').slice(-80)||'banner';
   const path=user.id+'/'+crypto.randomUUID()+'-'+safe;
   bannerStatus('Uploading banner media…');
   const {error:uploadError}=await db.storage.from('loop-banners').upload(path,file,{contentType:file.type,upsert:false});
   if(uploadError)throw uploadError;
   mediaUrl=db.storage.from('loop-banners').getPublicUrl(path).data.publicUrl;
  }else if(type!==existingBannerType)throw new Error('Upload a new asset when switching between image and video.');
  const placement=$('bannerPlacement').value,category=placement==='category_banner'?$('bannerCategory').value:null;
  const starts=$('bannerStart').value?new Date($('bannerStart').value).toISOString():null,ends=$('bannerEnd').value?new Date($('bannerEnd').value).toISOString():null;
  if(starts&&ends&&new Date(ends)<=new Date(starts))throw new Error('End time must be after start time.');
  const payload={title:$('bannerTitle').value.trim(),placement,category,media_type:type,media_url:mediaUrl,media_alt:$('bannerAlt').value.trim(),button_text:$('bannerButton').value.trim()||'Explore',target_url:safeBannerTarget($('bannerTarget').value),active:$('bannerActive').checked,display_order:Math.min(999,Math.max(0,Number($('bannerOrder').value)||0)),duration_seconds:type==='video'?5:null,starts_at:starts,ends_at:ends,updated_at:new Date().toISOString()};
  if(!payload.title)throw new Error('Add a headline for this banner.');
  $('saveBanner').disabled=true;$('saveBanner').textContent='Saving…';
  const result=editingBannerId?await db.from('ad_banners').update(payload).eq('id',editingBannerId).select('id').single():await db.from('ad_banners').insert(payload).select('id').single();
  if(result.error)throw result.error;
  existingBannerUrl=mediaUrl;existingBannerType=type;bannerStatus('Banner saved. '+(payload.active?'It will appear in the selected slot when the page is refreshed and any schedule is active.':'It is saved as paused.'));
  clearBannerForm();await loadBannerList();
 }catch(err){bannerStatus(err.message||'Could not save banner.',true)}
 finally{$('saveBanner').disabled=false;$('saveBanner').textContent=editingBannerId?'Update banner':'Save banner'}
}
function initBannerStudio(){
 $('bannerForm').addEventListener('submit',saveBanner);$('resetBanner').addEventListener('click',clearBannerForm);
 $('bannerPlacement').addEventListener('change',()=>{updateBannerPlacement();updateBannerPreview()});
 $('bannerType').addEventListener('change',()=>{updateBannerType();updateBannerPreview()});
 ['bannerCategory','bannerTitle','bannerAlt','bannerButton','bannerTarget','bannerOrder','bannerStart','bannerEnd'].forEach(id=>$(id).addEventListener('input',updateBannerPreview));
 $('bannerActive').addEventListener('change',updateBannerPreview);
 $('bannerFile').addEventListener('change',()=>{
  if(bannerPreviewUrl){URL.revokeObjectURL(bannerPreviewUrl);bannerPreviewUrl=''}
  const file=$('bannerFile').files?.[0];if(file)bannerPreviewUrl=safeMediaUrl(file);updateBannerPreview();
 });
 document.querySelectorAll('[data-preview-device]').forEach(btn=>btn.addEventListener('click',()=>{$('bannerPreviewFrame').dataset.device=btn.dataset.previewDevice;}));
 updateBannerPlacement();updateBannerType();updateBannerPreview();loadBannerList();
}

async function init(){
 if(!ready){banner('Backend not configured. Set up Supabase in assets/config.js.');return}
 const {data:{user}}=await db.auth.getUser();
 if(!user){location.href='auth.html?next=admin.html';return}
 if((user.email||'').toLowerCase()!==OWNER_EMAIL){document.querySelector('main').innerHTML='<section class="panel"><h1>Owner access only</h1><p class="muted">Sign in with '+OWNER_EMAIL+'. The current account is not the owner account.</p><a class="btn primary" href="auth.html?next=admin.html">Sign in again</a> '+supportLink()+'</section>';return}
 const {data:isAdmin,error}=await db.rpc('is_bechde_admin');
 if(error||!isAdmin){banner('Owner email recognized, but server-side permissions are not installed yet. Run supabase/004_loop_admin_controls.sql in Supabase SQL Editor.');return}
 $('refreshAdmin').addEventListener('click',refresh);
 initBannerStudio();
 await refresh();
}
init();
