/* LOOP 3D layer: procedural, interactive Three.js objects; no external model files required */
import * as THREE from 'https://esm.sh/three@0.180.0';
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function roundedBox(parent,w,h,d,mat,x=0,y=0,z=0,r=.08){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh}
function material(color,metalness=.2,roughness=.32){return new THREE.MeshStandardMaterial({color,metalness,roughness})}
function makePhone(scene){
 const root=new THREE.Group();scene.add(root);const parts={};const titanium=material('#202a37',.86,.23),glass=material('#08111c',.45,.12),screen=material('#0b1724',.25,.16),silver=material('#9cb2c4',.8,.22),lime=material('#c9fb42',.35,.24),lens=material('#02050a',.7,.1);
 parts.body=new THREE.Group();root.add(parts.body);roundedBox(parts.body,1.5,2.8,.15,titanium,0,0,0,.1);
 roundedBox(parts.body,1.39,2.66,.025,glass,0,0,.09,.07);
 const display=roundedBox(parts.body,1.31,2.48,.012,screen,0,0,.11,.05);
 const glow=new THREE.Mesh(new THREE.PlaneGeometry(1.28,2.42),new THREE.MeshBasicMaterial({color:'#102f4a'}));glow.position.set(0,0,.119);parts.body.add(glow);
 const stripe=new THREE.Mesh(new THREE.PlaneGeometry(1.12,.018),new THREE.MeshBasicMaterial({color:'#c9fb42'}));stripe.position.set(0,-.56,.122);parts.body.add(stripe);
 const topglow=new THREE.Mesh(new THREE.PlaneGeometry(.45,.45),new THREE.MeshBasicMaterial({color:'#227db0',transparent:true,opacity:.45}));topglow.position.set(.25,.65,.122);parts.body.add(topglow);
 parts.back=new THREE.Group();root.add(parts.back);roundedBox(parts.back,1.5,2.8,.065,material('#29394b',.8,.24),0,0,-.1,.1);
 const camMat=material('#101a26',.7,.18);
 for(let i=0;i<3;i++){const ring=new THREE.Mesh(new THREE.CylinderGeometry(.105,.105,.04,32),silver);ring.rotation.x=Math.PI/2;ring.position.set(-.43,.95-i*.28,-.155);parts.back.add(ring);const l=new THREE.Mesh(new THREE.CylinderGeometry(.073,.073,.045,32),lens);l.rotation.x=Math.PI/2;l.position.set(-.43,.95-i*.28,-.18);parts.back.add(l)}
 const flash=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,.035,20),lime);flash.rotation.x=Math.PI/2;flash.position.set(-.1,.94,-.16);parts.back.add(flash);
 parts.camera=new THREE.Group();root.add(parts.camera);
 const cameraBlock=roundedBox(parts.camera,.62,.96,.07,camMat,-.38,.7,-.16,.1);
 parts.button=new THREE.Group();root.add(parts.button);roundedBox(parts.button,.045,.35,.05,silver,.76,.35,.01,.015);
 parts.body.position.z=.04;
 root.userData.parts=parts;return root;
}
function makeHeadphones(scene){
 const root=new THREE.Group();scene.add(root);const black=material('#202b38',.72,.25),pad=material('#070a10',.15,.72),metal=material('#8ca4b8',.85,.2),accent=material('#c9fb42',.35,.25);
 const arc=new THREE.Mesh(new THREE.TorusGeometry(.82,.085,16,80,Math.PI),black);arc.rotation.z=Math.PI;arc.position.y=.28;root.add(arc);
 const inner=new THREE.Mesh(new THREE.TorusGeometry(.76,.028,10,80,Math.PI),metal);inner.rotation.z=Math.PI;inner.position.y=.28;root.add(inner);
 const left=new THREE.Group(),right=new THREE.Group();root.add(left,right);
 for(const [g,x] of [[left,-.8],[right,.8]]){const stem=roundedBox(g,.13,.48,.13,metal,x,-.18,0,.035);const cup=roundedBox(g,.48,.68,.3,black,x,-.52,0,.12);const cushion=roundedBox(g,.43,.61,.16,pad,x,-.52,.19,.11);const disc=new THREE.Mesh(new THREE.CircleGeometry(.12,32),accent);disc.position.set(x,-.52,.28);g.add(disc)}
 root.userData.parts={body:root,back:left,camera:right,button:inner};root.scale.set(1.1,1.1,1.1);return root;
}
function makeLaptop(scene){
 const root=new THREE.Group();scene.add(root);const body=material('#738697',.85,.22),dark=material('#08121e',.4,.12),glow=material('#183a52',.25,.2),lime=material('#c9fb42',.3,.2);
 roundedBox(root,1.85,.12,1.25,body,0,-.55,0,.06);roundedBox(root,1.76,.035,1.16,dark,0,-.475,0,.025);
 const hinge=roundedBox(root,1.78,.05,.08,body,0,-.43,-.57,.02);
 const screen=new THREE.Group();root.add(screen);roundedBox(screen,1.85,1.23,.09,body,0,.12,-.62,.06);roundedBox(screen,1.72,1.1,.025,dark,0,.12,-.565,.03);
 const p=new THREE.Mesh(new THREE.PlaneGeometry(1.68,1.05),glow);p.position.set(0,.12,-.548);screen.add(p);
 const line=new THREE.Mesh(new THREE.PlaneGeometry(1.25,.025),new THREE.MeshBasicMaterial({color:'#c9fb42'}));line.position.set(-.1,-.05,-.54);screen.add(line);
 root.userData.parts={body:root,back:screen,camera:hinge,button:line};root.scale.set(.9,.9,.9);return root;
}
function makeSneaker(scene){
 const root=new THREE.Group();scene.add(root);const sole=material('#e4e8e8',.08,.5),upper=material('#26394b',.25,.55),lace=material('#c9fb42',.15,.45);
 const base=new THREE.Mesh(new THREE.CapsuleGeometry(.25,.9,6,12),sole);base.rotation.z=Math.PI/2;base.position.y=-.25;root.add(base);
 const shell=new THREE.Mesh(new THREE.CapsuleGeometry(.22,.82,6,12),upper);shell.scale.set(1,.72,1.05);shell.rotation.z=Math.PI/2;shell.position.set(0,-.06,0);root.add(shell);
 for(let i=0;i<4;i++){const l=roundedBox(root,.32,.025,.035,lace,-.05+i*.12,.13,.19,.01);l.rotation.z=-.25}
 const swoosh=new THREE.Mesh(new THREE.TorusGeometry(.23,.035,8,28,Math.PI*1.25),lace);swoosh.rotation.y=Math.PI/2;swoosh.position.set(.05,-.04,.18);root.add(swoosh);
 root.userData.parts={body:root,back:shell,camera:base,button:swoosh};root.scale.set(1.15,1.15,1.15);return root;
}
function makeChair(scene){
 const root=new THREE.Group();scene.add(root);const fabric=material('#354d61',.2,.7),frame=material('#94a6b5',.8,.25),lime=material('#c9fb42',.3,.3);
 roundedBox(root,.95,.17,.85,fabric,0,-.15,0,.12);roundedBox(root,.95,1.2,.15,fabric,0,.48,-.36,.12);
 const post=roundedBox(root,.12,.58,.12,frame,0,-.55,0,.03);const foot=roundedBox(root,.12,.85,.12,frame,0,-.87,0,.03);foot.rotation.z=Math.PI/2;
 for(let i=0;i<5;i++){const a=i*Math.PI*2/5;const leg=roundedBox(root,.65,.055,.07,frame,Math.cos(a)*.28,-1.08,Math.sin(a)*.28,.025);leg.rotation.y=-a}
 const accent=new THREE.Mesh(new THREE.BoxGeometry(.5,.025,.025),lime);accent.position.set(0,.5,-.27);root.add(accent);root.userData.parts={body:root,back:post,camera:foot,button:accent};root.scale.set(.85,.85,.85);return root;
}
function makeScene(host,kind='phones',productMode=false){
 if(!host)return null;
 const scene=new THREE.Scene();scene.background=null;
 const camera=new THREE.PerspectiveCamera(34,1,.1,100);camera.position.set(0,.1,7.8);
 const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(devicePixelRatio||1,productMode?1.5:1.7));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;host.appendChild(renderer.domElement);renderer.domElement.setAttribute('aria-label','Interactive 3D product viewer. Drag to rotate.');
 scene.add(new THREE.HemisphereLight('#d7efff','#101722',2));
 const key=new THREE.DirectionalLight('#d9f3ff',3.2);key.position.set(4,5,6);scene.add(key);
 const rim=new THREE.PointLight('#258bd0',38,16);rim.position.set(-3,1,3);scene.add(rim);
 const limeLight=new THREE.PointLight('#c9fb42',18,12);limeLight.position.set(2,-2,2);scene.add(limeLight);
 const floor=new THREE.Mesh(new THREE.CircleGeometry(2.5,64),new THREE.MeshBasicMaterial({color:'#123248',transparent:true,opacity:.28}));floor.rotation.x=-Math.PI/2;floor.position.y=-1.75;scene.add(floor);
 const grid=new THREE.GridHelper(8,32,'#1d5670','#143044');grid.position.y=-1.78;grid.material.transparent=true;grid.material.opacity=.35;scene.add(grid);
 const builders={phones:makePhone,electronics:makeHeadphones,laptops:makeLaptop,fashion:makeSneaker,toys:makeSneaker,home:makeChair,other:makePhone};
 let activeKind=kind,object=builders[kind](scene),auto=true,drag=false,downX=0,downY=0,rotX=0,rotY=.2,scrollP=0,lastT=0,disposed=false;
 const resize=()=>{const r=host.getBoundingClientRect();if(!r.width||!r.height)return;renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix()};const ro=new ResizeObserver(resize);ro.observe(host);resize();
 const canvas=renderer.domElement;
 canvas.addEventListener('pointerdown',e=>{drag=true;auto=false;downX=e.clientX;downY=e.clientY;canvas.setPointerCapture?.(e.pointerId);canvas.style.cursor='grabbing'});
 canvas.addEventListener('pointermove',e=>{if(!drag)return;rotY+=(e.clientX-downX)*.012;rotX=clamp(rotX+(e.clientY-downY)*.008,-.7,.7);downX=e.clientX;downY=e.clientY});
 const stop=()=>{drag=false;canvas.style.cursor='grab'};canvas.addEventListener('pointerup',stop);canvas.addEventListener('pointercancel',stop);canvas.style.cursor='grab';
 canvas.addEventListener('wheel',e=>{if(productMode){camera.position.z=clamp(camera.position.z+e.deltaY*.003,4.8,10);e.preventDefault()}},{passive:false});
 function switchKind(next){if(!builders[next])return;scene.remove(object);object.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material.dispose()}});activeKind=next;object=builders[next](scene);rotX=0;rotY=.2;scrollP=0}
 function setExplode(p){scrollP=clamp(p,0,1);const parts=object.userData.parts;if(!parts)return;const e=scrollP<.48?scrollP/.48:(1-scrollP)/.52;const strength=clamp(e,0,1);if(activeKind==='phones'){parts.body.position.z=.04+strength*.85;parts.back.position.z=-.1-strength*.65;parts.camera.position.x=-.38-strength*.65;parts.camera.position.y=.7+strength*.2;parts.button.position.x=.76+strength*.4}else if(activeKind==='electronics'){parts.back.position.x=-.8-strength*.8;parts.camera.position.x=.8+strength*.8;parts.button.position.y=.28+strength*.5}else{parts.back.position.y=.12+strength*.75;parts.camera.position.y=-.55-strength*.7;parts.button.position.z=.2+strength*.8}}
 const onScroll=()=>{if(!productMode){const r=host.closest('.hero')?.getBoundingClientRect();if(r){const vh=innerHeight||800;setExplode(clamp((vh-r.top)/(vh+r.height),0,1))}}};addEventListener('scroll',onScroll,{passive:true});onScroll();
 const animate=t=>{if(disposed)return;if(!reduced&&!drag&&auto)rotY+=.0018;if(!drag&&reduced)rotY=.22;object.rotation.y=rotY;object.rotation.x=rotX+(reduced?0:Math.sin(t*.00045)*.025);object.position.y=(reduced?0:Math.sin(t*.0012)*.055);renderer.render(scene,camera);lastT=t};renderer.setAnimationLoop(animate);
 function reset(){rotX=0;rotY=.2;camera.position.set(0,.1,productMode?7.8:7.8);auto=true;setExplode(0)}
 return {scene,renderer,camera,switchKind,reset,setExplode,dispose(){disposed=true;renderer.setAnimationLoop(null);ro.disconnect();removeEventListener('scroll',onScroll);renderer.dispose();host.replaceChildren()}};
}
function makeControls(stage,viewer,productMode=false){
 const bar=document.createElement('div');bar.className='loop3d-controls';bar.innerHTML='<button type="button" data-action="reset">RESET VIEW</button><button type="button" data-action="explode">EXPLORE PARTS</button>';stage.appendChild(bar);
 bar.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.action==='reset'){viewer.reset();bar.querySelector('[data-action="explode"]').setAttribute('aria-pressed','false')}else{const active=b.getAttribute('aria-pressed')==='true';b.setAttribute('aria-pressed',String(!active));viewer.setExplode(active?0:.48);if(!productMode)stage.closest('.hero')?.scrollIntoView({behavior:reduced?'auto':'smooth',block:'center'})}});
}
function bootHero(){
 const hero=document.querySelector('.hero-visual');if(!hero||hero.querySelector('.loop3d-stage'))return;
 const stage=document.createElement('div');stage.className='loop3d-stage';stage.innerHTML='<div class="loop3d-hint"><i></i>LIVE 3D · DRAG TO ROTATE</div><div class="loop3d-live">OBJECT 01 / SECOND LIFE</div>';
 hero.prepend(stage);const oldImage=hero.querySelector('img');if(oldImage)oldImage.style.opacity='.08';
 let viewer;try{viewer=makeScene(stage,'phones')}catch(e){stage.remove();if(oldImage)oldImage.style.opacity='';return}
 makeControls(stage,viewer);
 document.querySelectorAll('[data-filter]').forEach(a=>a.addEventListener('click',()=>{const cat=a.dataset.filter;if(cat&&cat!=='all')viewer.switchKind(cat);else viewer.switchKind('phones');stage.querySelector('.loop3d-live').textContent='LIVE OBJECT / '+String(cat||'phones').toUpperCase()}));
 document.querySelectorAll('[data-jump]').forEach(a=>a.addEventListener('click',()=>{const cat=a.dataset.jump;viewer.switchKind(cat);stage.querySelector('.loop3d-live').textContent='LIVE OBJECT / '+String(cat).toUpperCase()}));
}
function bootProduct(){
 const gallery=document.querySelector('.gallery');if(!gallery||document.getElementById('loop3dProduct'))return;
 const stage=document.createElement('div');stage.id='loop3dProduct';stage.className='loop3d-product';stage.innerHTML='<div class="loop3d-hint"><i></i>INTERACTIVE 3D VIEWER</div><div class="loop3d-live">DRAG · ROTATE · EXPLORE</div>';gallery.prepend(stage);
 const image=gallery.querySelector('#photo');if(image){image.style.height='170px';image.style.objectFit='contain';image.style.background='#0b111a';image.style.marginTop='10px';}
 let cat=(new URLSearchParams(location.search).get('id')||'phone').toLowerCase();if(cat.includes('tv')||cat.includes('ipod'))cat='electronics';else if(cat.includes('desk')||cat.includes('buoy'))cat='home';else if(cat.includes('laptop'))cat='laptops';else if(cat.includes('shoe')||cat.includes('fashion'))cat='fashion';else cat='phones';
 try{const viewer=makeScene(stage,cat,true);makeControls(stage,viewer,true);const note=document.createElement('p');note.className='loop3d-product-note';note.textContent='Drag to rotate · Scroll or pinch-friendly controls · Rendered in real-time 3D. Seller photos remain below for reference.';stage.after(note)}catch(e){stage.remove()}
}
// 3D is opt-in and limited to product detail; never inject into homepage/category listings.
const preview3d=new URLSearchParams(location.search).get('3d')==='1';
if(preview3d){
 const start=()=>{bootProduct();const b=document.getElementById('try3d');if(b){b.textContent='↻ 3D preview enabled';b.onclick=()=>{const u=new URL(location.href);u.searchParams.delete('3d');location.href=u.href}}const n=document.getElementById('threeNote');if(n)n.textContent='Experimental category-based 3D illustration — not a scan or verified representation of this exact item.'};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
}
