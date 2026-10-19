import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cfg=window.BECHDE_CONFIG||{};
const ready=!!window.BECHDE_BACKEND_ENABLED;
const db=ready?createClient(cfg.supabaseUrl,cfg.supabaseAnonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}):null;
const $=id=>document.getElementById(id);
const money=paise=>'₹'+(Number(paise||0)/100).toLocaleString('en-IN',{maximumFractionDigits:2});
const escapeHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const conditionLabel={like_new:'LIKE NEW',lightly_used:'LIGHTLY USED',regularly_used:'REGULARLY USED',needs_repair:'NEEDS REPAIR',good:'GOOD'};
const categoryLabel={phones:'Phones',home:'Home & Office',laptops:'Laptops',electronics:'Electronics',fashion:'Fashion',toys:'Toys & Hobbies',other:'Other'};
function toast(msg){let el=$('toast');if(!el){el=document.createElement('div');el.id='toast';el.className='toast';document.body.appendChild(el)}el.textContent=msg;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),3000)}
async function user(){if(!db)return null;const {data}=await db.auth.getUser();return data.user||null}
async function loadHome(){
 const box=$('products');if(!box||!db)return;
 const {data:items,error}=await db.from('listings').select('id,title,price_paise,condition,category,city,area,photo_urls,accepts_offers,bidding_enabled,created_at,is_promoted').eq('status','active').order('is_promoted',{ascending:false}).order('created_at',{ascending:false}).limit(40);
 if(error){toast('Live listings could not load. Check Supabase policies.');return}
 box.querySelectorAll('[data-live-listing]').forEach(el=>el.remove());
 box.querySelectorAll('.product').forEach(el=>el.style.display='none');
 const section=$('fresh');
 let empty=$('liveEmpty');if(!empty){empty=document.createElement('p');empty.id='liveEmpty';empty.className='muted';box.parentElement.appendChild(empty)}
 empty.textContent=items?.length?'':'No listings yet. Be the first to list something.';
 const ids=[...new Set((items||[]).map(x=>x.seller_id).filter(Boolean))];
 let profiles={};if(ids.length){const {data}=await db.from('public_seller_profiles').select('id,display_name').in('id',ids);(data||[]).forEach(p=>profiles[p.id]=p)}
 // Query seller names separately only after listing IDs are known.
 const {data:fullItems}=await db.from('listings').select('id,seller_id,title,price_paise,condition,category,city,area,photo_urls,accepts_offers,bidding_enabled,created_at,is_promoted').eq('status','active').order('is_promoted',{ascending:false}).order('created_at',{ascending:false}).limit(40);
 const sellerIds=[...new Set((fullItems||[]).map(x=>x.seller_id))];
 if(sellerIds.length){const {data}=await db.from('public_seller_profiles').select('id,display_name').in('id',sellerIds);profiles={};(data||[]).forEach(p=>profiles[p.id]=p)}
 (fullItems||[]).forEach(item=>{
   const img=item.photo_urls?.[0]||'';
   const card=document.createElement('article');card.className='product';card.dataset.liveListing='1';card.dataset.category=item.category;card.dataset.name=(item.title+' '+item.category+' '+item.city).toLowerCase();card.dataset.price=String(Number(item.price_paise)/100);card.dataset.condition=conditionLabel[item.condition]||'';card.dataset.listingId=item.id;
   const flags=[item.accepts_offers?'OFFERS OPEN':'',item.bidding_enabled?'BIDDING OPEN':''].filter(Boolean).join(' · ');
   card.innerHTML='<a href="product.html?id='+encodeURIComponent(item.id)+'" class="product-image">'+(img?'<img loading="lazy" src="'+escapeHtml(img)+'" alt="'+escapeHtml(item.title)+'">':'')+(item.condition?'<span class="condition">'+escapeHtml(conditionLabel[item.condition]||item.condition)+'</span>':'')+'</a><div class="product-info"><div class="product-cat">'+escapeHtml(categoryLabel[item.category]||item.category)+' · '+escapeHtml(item.area||item.city)+'</div><h3>'+escapeHtml(item.title)+'</h3><div class="price">'+money(item.price_paise)+'</div>'+(flags?'<div class="save">'+escapeHtml(flags)+'</div>':'')+'<div class="sellerline"><span class="avatar">'+escapeHtml((profiles[item.seller_id]?.display_name||'S').slice(0,1).toUpperCase())+'</span> '+escapeHtml(profiles[item.seller_id]?.display_name||'Bech De seller')+(item.is_promoted?'<span class="tag">PROMOTED</span>':'')+'</div><div class="product-actions"><a class="chat" style="text-align:center;padding:9px;border-radius:8px;flex:1;font-size:11px;font-weight:800" href="product.html?id='+encodeURIComponent(item.id)+'">View item</a></div></div>';
   box.appendChild(card);
 });
 if(window.applyFilters)window.applyFilters();
}
async function submitSellerForm(){
 const form=$('sellform');if(!form||!db)return;
 const current=await user();if(!current){location.href='auth.html?next=seller';return}
 const files=[...($('photos')?.files||[])];
 if(!files.length||files.length>8){toast('Upload 1 to 8 real product photos.');return}
 if(files.some(f=>!['image/jpeg','image/png','image/webp'].includes(f.type)||f.size>5*1024*1024)){toast('Use JPG, PNG or WebP images up to 5 MB each.');return}
 const title=$('title').value.trim(),price=Number($('price').value),city=$('location').value.trim();
 if(!title||!Number.isFinite(price)||price<=0||!city){toast('Add a title, valid price and location.');return}
 const submit=form.querySelector('button[type=submit],button:not([type])');if(submit){submit.disabled=true;submit.textContent='Uploading photos…'}
 try{
  const urls=[];
  for(const f of files){
   const safe=f.name.toLowerCase().replace(/[^a-z0-9._-]/g,'-').slice(-80)||'photo.jpg';
   const path=current.id+'/'+crypto.randomUUID()+'-'+safe;
   const {error}=await db.storage.from('listing-photos').upload(path,f,{contentType:f.type,upsert:false});
   if(error)throw error;
   const {data}=db.storage.from('listing-photos').getPublicUrl(path);urls.push(data.publicUrl);
  }
  const conditionMap={'Like new':'like_new','Lightly used':'lightly_used','Regularly used':'regularly_used','Needs repair':'needs_repair','Good':'good'};
  const categoryMap={'Phones':'phones','Home & Office':'home','Laptops':'laptops','Electronics':'electronics','Fashion':'fashion','Toys & Hobbies':'toys','Other':'other'};
  const acceptsOffers=$('allowOffers')?.checked||false,bidding=$('allowBids')?.checked||false;
  const starts=$('bidEnd')?.value?new Date($('bidEnd').value).toISOString():null;
  const startBid=Number($('startingBid')?.value||0),reserve=Number($('reservePrice')?.value||0);
  if(bidding&&(!startBid||!starts||new Date(starts)<=new Date()))throw new Error('For bidding, add a valid starting bid and a future end time.');
  const payload={seller_id:current.id,title,price_paise:Math.round(price*100),city,area:city,category:categoryMap[$('category')?.value]||'other',condition:conditionMap[$('condition')?.value]||null,description:$('description')?.value.trim()||'',photo_urls:urls,accepts_offers:acceptsOffers,bidding_enabled:bidding,status:'active'};
  if(bidding){payload.starting_bid_paise=Math.round(startBid*100);payload.reserve_price_paise=reserve?Math.round(reserve*100):null;payload.auction_starts_at=new Date().toISOString();payload.auction_ends_at=starts}
  const {data,error}=await db.from('listings').insert(payload).select('id').single();if(error)throw error;
  toast('Your listing is live.');location.href='product.html?id='+encodeURIComponent(data.id);
 }catch(err){toast(err.message||'Could not publish listing.');if(submit){submit.disabled=false;submit.textContent='Publish listing →'}}
}
async function loadProduct(){
 const id=new URLSearchParams(location.search).get('id');if(!db||!id||! /^[0-9a-f-]{36}$/i.test(id))return;
 const {data:item,error}=await db.from('listings').select('*').eq('id',id).eq('status','active').maybeSingle();
 if(error||!item){toast('This listing is unavailable or could not load.');return}
 const {data:profile}=await db.from('public_seller_profiles').select('display_name,city').eq('id',item.seller_id).maybeSingle();
 for(const [key,value] of Object.entries({title:item.title,price:money(item.price_paise),condition:conditionLabel[item.condition]||'Condition not specified',category:categoryLabel[item.category]||item.category,location:[item.area,item.city].filter(Boolean).join(', '),seller:profile?.display_name||'Bech De seller',crumbTitle:item.title,description:item.description||'Contact the seller for more details.'})){const el=$(key);if(el)el.textContent=value}
 const photo=$('photo');if(photo&&item.photo_urls?.length){photo.src=item.photo_urls[0];photo.alt=item.title}
 const avatar=$('avatar');if(avatar)avatar.textContent=(profile?.display_name||'S').slice(0,1).toUpperCase();
 const tag=$('condition');if(tag)tag.textContent=conditionLabel[item.condition]||'PRE-LOVED';
 const offerBox=$('negotiationBox'),auctionBox=$('auctionBox');if(offerBox)offerBox.hidden=!item.accepts_offers;if(auctionBox)auctionBox.hidden=!item.bidding_enabled;
 if(item.bidding_enabled){const meta=$('auctionMeta');if(meta)meta.textContent='Starting bid: '+money(item.starting_bid_paise)+' · Ends '+new Date(item.auction_ends_at).toLocaleString('en-IN');const bidInput=$('bidAmount');if(bidInput)bidInput.min=String((Number(item.starting_bid_paise)+1)/100)}
 window.submitOffer=async()=>{const u=await user();if(!u){location.href='auth.html?next='+encodeURIComponent(location.pathname+location.search);return}const amount=Number($('offerAmount')?.value);if(!Number.isFinite(amount)||amount<=0){$('offerFeedback').textContent='Enter a valid offer amount.';return}const {error}=await db.from('price_offers').insert({listing_id:item.id,buyer_id:u.id,amount_paise:Math.round(amount*100)});$('offerFeedback').textContent=error?error.message:'Offer sent to seller. Check My Account for status.'};
 window.placeBid=async()=>{const u=await user();if(!u){location.href='auth.html?next='+encodeURIComponent(location.pathname+location.search);return}const amount=Number($('bidAmount')?.value);if(!Number.isFinite(amount)||amount<=0){$('bidFeedback').textContent='Enter a valid bid amount.';return}const {data,error}=await db.rpc('place_bid',{p_listing_id:item.id,p_amount_paise:Math.round(amount*100)});$('bidFeedback').textContent=error?error.message:'Your bid was submitted.';if(!error){$('bidList').textContent='Your bid: '+money(data.amount_paise)}};
 window.contact=async type=>{if(type==='call'){toast('For privacy, ask the seller to share a safe contact method in chat.');return}const u=await user();if(!u){location.href='auth.html?next='+encodeURIComponent(location.pathname+location.search);return}const {data:conversationId,error}=await db.rpc('start_conversation',{p_listing_id:item.id});if(error){toast(error.message);return}const body=prompt('Start a conversation with the seller:');if(body?.trim()){const {error:sendError}=await db.from('messages').insert({conversation_id:conversationId,sender_id:u.id,body:body.trim()});toast(sendError?sendError.message:'Message sent.');}else toast('Conversation opened. Messaging inbox is available after account UI is completed.')};
}
async function init(){
 if(!ready){document.querySelectorAll('[data-needs-backend]').forEach(e=>e.hidden=false);return}
 if($('sellform')){$('sellform').addEventListener('submit',e=>{e.preventDefault();e.stopImmediatePropagation();submitSellerForm()})}
 if($('products'))await loadHome();
 if($('crumbTitle')&&new URLSearchParams(location.search).has('id'))await loadProduct();
}
init();
