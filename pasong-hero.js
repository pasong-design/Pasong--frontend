/* PASONG paid Homepage Hero loader. Add <script src="pasong-hero.js" defer></script> to index.html. */
(function(){
const API='https://pasong-api.vercel.app';
async function loadPaidHero(){
 try{
  const r=await fetch(API+'/api/advertising/hero',{cache:'no-store'}); const d=await r.json(); const heroes=d.heroes||[]; if(!heroes.length)return;
  const box=document.querySelector('.main-hero-slider'); if(!box)return;
  let old=box.querySelector('.pasong-paid-hero-wrap'); if(old)old.remove();
  const wrap=document.createElement('div'); wrap.className='pasong-paid-hero-wrap'; Object.assign(wrap.style,{position:'absolute',inset:'0',zIndex:'50',overflow:'hidden'});
  heroes.forEach((h,i)=>{const a=document.createElement('a');a.href=h.target_url||'#';a.target=h.target_url?'_blank':'_self';a.rel='noopener';Object.assign(a.style,{position:'absolute',inset:'0',display:i===0?'block':'none',backgroundImage:`url("${String(h.image_url||'').replace(/"/g,'\\"')}")`,backgroundSize:'cover',backgroundPosition:'center',backgroundRepeat:'no-repeat'});a.dataset.i=i;wrap.appendChild(a)});
  box.appendChild(wrap);
  if(heroes.length>1){let i=0;setInterval(()=>{const all=wrap.children;if(!all.length)return;all[i].style.display='none';i=(i+1)%all.length;all[i].style.display='block'},8000)}
 }catch(e){console.warn('PASONG Hero unavailable',e)}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(loadPaidHero,900));else setTimeout(loadPaidHero,900);
})();
